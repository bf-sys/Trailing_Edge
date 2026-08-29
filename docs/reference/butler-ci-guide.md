# Butler & CI Automation Guide

A plain-language explainer for the two optional itch.io pipeline items in
`docs/TODO.md`'s "itch.io packaged-build pipeline" section: the `butler`
CLI and a CI workflow. Neither exists in this project yet — this document
is the "what is this and what would building it involve" reference before
committing to either, written for someone who hasn't used either tool
before.

## The two pieces are independent

It's easy to lump "butler" and "CI" together as one automation project, but
they solve two different problems and can be adopted separately:

- **`butler`** replaces the *manual* step of zipping `dist/` and
  drag-dropping it onto itch.io's upload page with a single terminal
  command, run from your own machine, whenever you choose to run it.
- **CI (Continuous Integration)** replaces *you* as the one who has to
  remember to run commands at all — it's a service that runs commands
  automatically, on GitHub's own servers, when something happens in the
  repo (a push, a tag, a button click).

You could adopt `butler` alone (still publish by hand, but as one command
instead of a zip-and-drag) or CI alone (an automatic build-health check
with no publishing involved). Combining them — CI running `butler` on your
behalf — is what gets you a fully automatic "push a tag, itch.io updates
itself" pipeline, but that's the end state, not a required starting point.

## Part 1 — `butler`

### What it is

`butler` is itch.io's own official command-line upload tool. It's a small
standalone executable, not an npm package — you download it once from
itch.io directly, not via `npm install`.

- Docs: https://itch.io/docs/butler/
- Install page (has the download for Windows/Mac/Linux):
  https://itch.io/docs/butler/installing.html

On Windows, installing it means downloading a zip, extracting `butler.exe`
somewhere, and either adding that folder to your `PATH` (so plain `butler`
works from any terminal) or always calling it by its full path.

### Logging in

```
butler login
```

This opens a browser window, has you log into your itch.io account, and
then stores an API key locally in butler's own config directory (not in
this repo). That key is a secret, equivalent to a password for your itch.io
account's upload permissions — never commit it, never paste it into a file
that gets checked into git.

### Pushing a build

```
butler push <build-directory> <your-username>/<game-slug>:<channel-name>
```

For this project, once an itch.io project page exists (a separate,
still-open TODO item — see `docs/TODO.md`), the command would look like:

```
butler push dist bf-sys/trailing-edge:html5
```

- `dist` is the folder to upload — this project's build output, exactly
  what `npm run build` already produces.
- `bf-sys/trailing-edge` is a placeholder — the real value is
  `<your itch.io username>/<the game's URL slug>`, which only exists once
  the itch.io project page is created. `bf-sys` matches this repo's GitHub
  owner but isn't necessarily your itch.io username — check whichever
  account you make the project under.
- `html5` is a **channel** name — a label you choose, not something
  itch.io assigns. Each channel shows as its own row on the project's
  itch.io page (you might have `html5` for a browser build and, say,
  `windows` for a future desktop build); itch.io keeps a full version
  history per channel automatically.

Every `push` uploads a new, versioned build to that channel — nothing is
overwritten or lost; itch.io lets players and you look back at prior
versions if needed.

### Checking status without pushing

```
butler status <your-username>/<game-slug>
```

Shows what's currently live per channel — useful for confirming a push
actually landed, or checking state before pushing again.

## Part 2 — CI (GitHub Actions)

### What CI actually is, if you haven't used it before

A CI workflow is a YAML file checked into the repo, under
`.github/workflows/` — a folder that doesn't exist in this project yet.
GitHub reads that file and, whenever the trigger you configured fires (a
push, a tag, a manual button, a schedule), spins up a **temporary virtual
machine** and runs the commands you listed, then throws that machine away.
Nothing runs on your own computer, and nothing persists between runs except
what you explicitly save (like a build artifact or a published version).

The practical benefit: a check that used to depend on someone remembering
to run it locally (`npm run build`, a playthrough, etc.) instead runs
automatically and shows up as a green checkmark or red X directly on
GitHub, on every relevant commit.

### What it would do for this project

Two things CI could handle here, and they don't have to ship together:

1. **A safety net.** Run `npm run build` (which already runs
   `tsc --noEmit` first, per `package.json`) on every push, so a broken
   build is caught immediately and visibly, rather than silently sitting
   uncaught until someone happens to build locally.
2. **Automatic publishing.** After a successful build, also run
   `butler push` to send it straight to itch.io — but deliberately *not*
   on every single commit. You don't want a half-finished, mid-debugging
   commit going live to players the moment it's pushed. The realistic
   options are: trigger only on a version tag (e.g. pushing a `v0.1.0`
   tag signals "this is a real release"), or trigger only via a manual
   button GitHub provides ("Run workflow") that you click deliberately.

### What building this would actually take

1. **A new file**, something like `.github/workflows/build.yml` — nothing
   in `.github/` exists in this repo yet, so this is new territory, not an
   edit to something already there.
2. **Pick a trigger.** Recommended split: build+typecheck on every push to
   `main` (pure safety net, no publishing risk), and `butler push` only on
   a manual trigger or a version tag (so publishing is always a deliberate
   choice, never a side effect of an ordinary commit).
3. **Store the itch.io API key as a GitHub secret** — not in any file in
   the repo. On GitHub: Settings → Secrets and variables → Actions → New
   repository secret. The workflow file references it as
   `${{ secrets.BUTLER_API_KEY }}` (or whatever name you give it); GitHub
   encrypts it, never prints it in logs, and it never touches git history.
4. **The workflow's steps, in plain terms:** check out the repo's code
   onto the temporary machine, install Node.js, run `npm ci` (a stricter,
   CI-oriented sibling of `npm install` that installs exactly what
   `package-lock.json` specifies, rather than whatever `npm install` might
   resolve to), run `npm run build`, download/install `butler` on that same
   temporary machine, then run the `butler push` command using the secret
   as the login credential.
5. **Test it** before trusting it — push a throwaway tag (or use the
   manual trigger) and watch the "Actions" tab on the GitHub repo page to
   confirm it ran, and either the itch.io page updated or a clear failure
   showed up in the logs.

### Decisions this needs from you before it can be built

- The itch.io project's actual `<username>/<game-slug>` — doesn't exist
  until the itch.io project page (a separate TODO item) is created.
- Trigger strategy for the publish half — tag-based, manual-button-only, or
  something else. (Build+typecheck-on-every-push doesn't have this
  question; it's safe to run constantly.)
- Whether a channel naming convention beyond `html5` is worth deciding now,
  or fine to revisit if a non-browser build ever gets scoped.

## Where this fits against `docs/TODO.md`

That file's "itch.io packaged-build pipeline" section lists 7 items; this
document is the detailed expansion of items 6 (`butler` CLI) and 7 (CI
workflow) specifically. Items 1–5 (the `vite.config.ts` fix, a fresh build,
a local `npm run preview` smoke test, zipping `dist/`, and the itch.io
project page setup) are prerequisites — most are already done as of
2026-08-29; check that file for current status.
