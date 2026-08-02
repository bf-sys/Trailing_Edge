require('dotenv').config({ path: '../../.env' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image',
            contents: 'A small red pixel art apple on a white background'
        });
        
        console.log(Object.keys(response));
        if (response.candidates && response.candidates[0]) {
             console.log("Candidate parts:", response.candidates[0].content.parts.length);
             const part = response.candidates[0].content.parts[0];
             if (part.inlineData) {
                 console.log("Found inlineData:", part.inlineData.mimeType);
                 console.log("Base64 length:", part.inlineData.data.length);
             } else if (part.executableCode) {
                 console.log("Executable code?");
             } else {
                 console.log(part);
             }
        }
    } catch (e) {
        console.error(e);
    }
}
test();
