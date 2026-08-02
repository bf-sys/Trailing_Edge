require('dotenv').config({ path: '../../.env' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
    try {
        const fullPrompt = 'Isolated single sprite of a top-down 2D pixel art spaceship, gritty dark sci-fi aesthetic, muted industrial metallics, 32-bit pixel art style, retro-futuristic, high contrast lighting from thrusters, NO environment, NO scene, on a solid bright chroma-key green (#00FF00) background, no shading on the background.';
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image',
            contents: fullPrompt
        });
        
        require('fs').writeFileSync('output.json', JSON.stringify(response.candidates[0].content.parts[0], null, 2));
        console.log("Wrote to output.json");
    } catch (e) {
        console.error("Caught error:", e);
    }
}
test();
