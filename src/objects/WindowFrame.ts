import Phaser from 'phaser';
import { windowFrameConfig } from '../config/windowFrameConfig';

export interface WindowFrameOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
}

interface TileRun {
  count: number;
  correctionScale: number;
}

// Splits `totalLength` into `count` copies of a tile whose natural (unscaled)
// on-screen length is `naturalTileLength`, picking the count that lands
// closest to the tile's natural size, then returns the small per-tile scale
// correction (typically close to 1) that makes exactly `count` copies span
// `totalLength` with no gap or overlap. This is the mechanism that keeps
// periodic rivet detail crisp instead of one continuously stretched quad --
// see the class comment below for why this exists instead of Phaser's
// built-in NineSlice.
function fitTiles(totalLength: number, naturalTileLength: number): TileRun {
  const count = Math.max(1, Math.round(totalLength / naturalTileLength));
  const correctionScale = totalLength / (count * naturalTileLength);
  return { count, correctionScale };
}

function getSourceSize(scene: Phaser.Scene, key: string): { width: number; height: number } {
  const source = scene.textures.get(key).getSourceImage();
  return { width: source.width, height: source.height };
}

// Assembles an in-game window from 4 tiled/rotated source pieces (see
// windowFrameConfig.ts) via true per-tile repetition, not Phaser's built-in
// NineSlice GameObject -- NineSlice only stretches its edge/fill regions
// (confirmed against the installed Phaser 3.90 source: areas 2/4/5/6/8 of
// its 9-region layout scale, they don't tile), which would smear the
// periodic rivet/panel-line detail baked into window_corner/window_edge/
// window_titlebar. Each row/column of tiles instead gets its own small
// uniform scale correction (see fitTiles above) so a whole number of tiles
// exactly fills the required span.
//
// Layout, top to bottom: a border row (corners + tiled edge) at the top;
// an optional tiled title-bar row just inside it if `title` is given; the
// tiled fill interior (flanked by tiled edge columns down both sides); a
// border row at the bottom. The title bar is an additional row inside the
// top border, not a replacement for it -- avoids a seam where a taller
// title-bar plate would otherwise fail to line up with the (thinner)
// corner/edge border thickness.
//
// No art asset backs window_fill's chroma-key format the way the other 3
// do -- it's an opaque, already-tileable texture (see
// docs/history/art-eval-log-2026-08-21.md), not a green-screen isolate.
export class WindowFrame extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, options: WindowFrameOptions) {
    super(scene, options.x, options.y);

    const { width, height, title } = options;
    const { borderThicknessPx, titleBarHeightPx, fillTileSizePx, titleTextStyle, depth } = windowFrameConfig;

    const cornerNative = getSourceSize(scene, windowFrameConfig.cornerTextureKey);
    const edgeNative = getSourceSize(scene, windowFrameConfig.edgeTextureKey);
    const titlebarNative = getSourceSize(scene, windowFrameConfig.titlebarTextureKey);
    const fillNative = getSourceSize(scene, windowFrameConfig.fillTextureKey);

    // Tiles sit directly edge-to-edge with no overlap, so Phaser's default
    // bilinear (LINEAR) texture filtering bleeds each tile's edge pixels
    // into its neighbor's transparent padding, showing up as a thin seam
    // line at every join. Nearest-neighbor filtering avoids that -- scoped
    // to just these 4 textures rather than a global pixelArt/antialias
    // change, since nothing else in the game currently tiles textures
    // edge-to-edge this way.
    for (const key of [
      windowFrameConfig.cornerTextureKey,
      windowFrameConfig.edgeTextureKey,
      windowFrameConfig.titlebarTextureKey,
      windowFrameConfig.fillTextureKey,
    ]) {
      scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }

    if (width < borderThicknessPx * 2 + 16 || height < borderThicknessPx * 2 + 16) {
      console.warn(
        `WindowFrame: ${width}x${height} is too small for a ${borderThicknessPx}px border on both axes -- layout will look wrong.`
      );
    }

    const topBottomRunLength = width - borderThicknessPx * 2;
    const contentTop = borderThicknessPx + (title !== undefined ? titleBarHeightPx : 0);

    // Fill goes in first so it renders behind the border/title-bar rows
    // added below (Container children draw in list order, first = bottom).
    const fillScale = fillTileSizePx / fillNative.width;
    const naturalFillTileSize = fillNative.width * fillScale;
    const fillWidth = width - borderThicknessPx * 2;
    const fillHeight = height - borderThicknessPx - contentTop;
    if (fillWidth > 0 && fillHeight > 0) {
      const fillRunX = fitTiles(fillWidth, naturalFillTileSize);
      const fillRunY = fitTiles(fillHeight, naturalFillTileSize);
      const fillTileWidth = fillWidth / fillRunX.count;
      const fillTileHeight = fillHeight / fillRunY.count;
      for (let row = 0; row < fillRunY.count; row++) {
        for (let col = 0; col < fillRunX.count; col++) {
          const tileX = borderThicknessPx + fillTileWidth * (col + 0.5);
          const tileY = contentTop + fillTileHeight * (row + 0.5);
          this.add(
            scene.add
              .image(tileX, tileY, windowFrameConfig.fillTextureKey)
              .setScale(fillScale * fillRunX.correctionScale, fillScale * fillRunY.correctionScale)
          );
        }
      }
    }

    // Corner: square, uniform scale so its full display size equals the
    // border thickness on both axes. Reused for all 4 corners via rotation
    // (see the angle table below) -- topLeft=0, topRight=90, bottomRight=180,
    // bottomLeft=270 degrees clockwise, derived from how a top+left border
    // elbow maps under rotation.
    const cornerScale = borderThicknessPx / cornerNative.height;
    const cornerPositions: { x: number; y: number; angle: number }[] = [
      { x: borderThicknessPx / 2, y: borderThicknessPx / 2, angle: 0 },
      { x: width - borderThicknessPx / 2, y: borderThicknessPx / 2, angle: 90 },
      { x: width - borderThicknessPx / 2, y: height - borderThicknessPx / 2, angle: 180 },
      { x: borderThicknessPx / 2, y: height - borderThicknessPx / 2, angle: 270 },
    ];
    for (const pos of cornerPositions) {
      const corner = scene.add
        .image(pos.x, pos.y, windowFrameConfig.cornerTextureKey)
        .setScale(cornerScale)
        .setAngle(pos.angle);
      this.add(corner);
    }

    // Edge: uniform base scale sets its thickness axis to borderThicknessPx;
    // the run axis gets an additional small per-tile correction (fitTiles)
    // so a whole number of copies exactly spans the run between corners.
    const edgeScale = borderThicknessPx / edgeNative.height;
    const naturalEdgeTileLength = edgeNative.width * edgeScale;

    const horizontalRun = fitTiles(topBottomRunLength, naturalEdgeTileLength);
    const horizontalTileWidth = topBottomRunLength / horizontalRun.count;
    for (let i = 0; i < horizontalRun.count; i++) {
      const tileX = borderThicknessPx + horizontalTileWidth * (i + 0.5);
      const scaleX = edgeScale * horizontalRun.correctionScale;
      this.add(
        scene.add
          .image(tileX, borderThicknessPx / 2, windowFrameConfig.edgeTextureKey)
          .setScale(scaleX, edgeScale)
      );
      this.add(
        scene.add
          .image(tileX, height - borderThicknessPx / 2, windowFrameConfig.edgeTextureKey)
          .setScale(scaleX, edgeScale)
      );
    }

    const leftRightRunLength = height - borderThicknessPx * 2;
    const verticalRun = fitTiles(leftRightRunLength, naturalEdgeTileLength);
    const verticalTileHeight = leftRightRunLength / verticalRun.count;
    for (let i = 0; i < verticalRun.count; i++) {
      const tileY = borderThicknessPx + verticalTileHeight * (i + 0.5);
      // Rotated 90 degrees: the image's native WIDTH axis (the run/length
      // axis pre-rotation) becomes the visual vertical axis, so the
      // per-tile fit correction is applied to scaleX (still the local,
      // pre-rotation width axis) here, same as horizontal's scaleX role.
      const scaleX = edgeScale * verticalRun.correctionScale;
      this.add(
        scene.add
          .image(borderThicknessPx / 2, tileY, windowFrameConfig.edgeTextureKey)
          .setScale(scaleX, edgeScale)
          .setAngle(90)
      );
      this.add(
        scene.add
          .image(width - borderThicknessPx / 2, tileY, windowFrameConfig.edgeTextureKey)
          .setScale(scaleX, edgeScale)
          .setAngle(90)
      );
    }

    // Title bar: an additional tiled row just inside the top border, not a
    // replacement for it (see class comment). Spans the same inset as the
    // edge tiles so it lines up with the left/right border columns.
    if (title !== undefined) {
      const titlebarScale = titleBarHeightPx / titlebarNative.height;
      const naturalTitlebarTileLength = titlebarNative.width * titlebarScale;
      const titlebarRun = fitTiles(topBottomRunLength, naturalTitlebarTileLength);
      const titlebarTileWidth = topBottomRunLength / titlebarRun.count;
      const titlebarCenterY = borderThicknessPx + titleBarHeightPx / 2;
      for (let i = 0; i < titlebarRun.count; i++) {
        const tileX = borderThicknessPx + titlebarTileWidth * (i + 0.5);
        const scaleX = titlebarScale * titlebarRun.correctionScale;
        this.add(
          scene.add
            .image(tileX, titlebarCenterY, windowFrameConfig.titlebarTextureKey)
            .setScale(scaleX, titlebarScale)
        );
      }
      this.add(
        scene.add
          .text(width / 2, titlebarCenterY, title, titleTextStyle)
          .setOrigin(0.5, 0.5)
      );
    }

    this.setDepth(depth);
    scene.add.existing(this);
  }
}
