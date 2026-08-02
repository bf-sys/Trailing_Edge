const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// Bypass strict SSL for restricted network environments (resolves UNABLE_TO_VERIFY_LEAF_SIGNATURE)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load environment variables from the project root .env
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/assets', express.static('assets'));

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Read feedback
app.get('/api/feedback', (req, res) => {
    const feedbackPath = path.join(__dirname, 'feedback.json');
    if (fs.existsSync(feedbackPath)) {
        res.json(JSON.parse(fs.readFileSync(feedbackPath, 'utf8')));
    } else {
        res.json({});
    }
});

// Save feedback
app.post('/api/feedback', (req, res) => {
    const { assetId, feedback, action } = req.body;
    const feedbackPath = path.join(__dirname, 'feedback.json');
    let data = {};
    if (fs.existsSync(feedbackPath)) {
        data = JSON.parse(fs.readFileSync(feedbackPath, 'utf8'));
    }
    
    if (!data[assetId]) {
        data[assetId] = {};
    }
    
    if (action === 'accept') {
        data[assetId].status = 'accepted';
        data[assetId].feedback = '';
    } else {
        data[assetId].status = 'needs_revision';
        data[assetId].feedback = feedback;
    }
    
    fs.writeFileSync(feedbackPath, JSON.stringify(data, null, 2));
    res.json({ success: true });
});

// Helper to read assets
function getAssets() {
    const assetsPath = path.join(__dirname, 'assets.json');
    if (fs.existsSync(assetsPath)) {
        return JSON.parse(fs.readFileSync(assetsPath, 'utf8'));
    }
    return [];
}

app.get('/api/assets', (req, res) => {
    res.json(getAssets());
});

// Endpoint to update base prompt
app.post('/api/assets', (req, res) => {
    const { assetId, newPrompt } = req.body;
    const assetsPath = path.join(__dirname, 'assets.json');
    let assets = getAssets();
    
    const assetIndex = assets.findIndex(a => a.id === assetId);
    if (assetIndex !== -1) {
        assets[assetIndex].prompt = newPrompt;
        fs.writeFileSync(assetsPath, JSON.stringify(assets, null, 4));
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Asset not found' });
    }
});

// Autonomous Generation Endpoint
app.post('/api/generate', async (req, res) => {
    const { assetId, feedback, useReference } = req.body;
    const assets = getAssets();
    const asset = assets.find(a => a.id === assetId);
    
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    
    // Combine base prompt with specific user feedback
    const fullPrompt = feedback 
        ? `${asset.prompt} ADDITIONAL FEEDBACK: ${feedback}`
        : asset.prompt;
        
    try {
        console.log(`Generating image for ${assetId}...`);
        
        // You can change this to gemini-3-pro-image for stubborn assets!
        const modelName = 'gemini-3.1-flash-image';
        
        let apiContents = fullPrompt;
        
        if (useReference) {
            const assetPath = path.join(__dirname, asset.path);
            if (fs.existsSync(assetPath)) {
                const base64Ref = fs.readFileSync(assetPath).toString('base64');
                apiContents = [
                    { text: fullPrompt },
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: base64Ref
                        }
                    }
                ];
            } else {
                console.warn("Reference image requested but file not found. Generating from text only.");
            }
        }
        
        const response = await ai.models.generateContent({
            model: modelName,
            contents: apiContents
        });
        
        const candidate = response.candidates && response.candidates[0];
        const parts = candidate && candidate.content && candidate.content.parts;
        const imagePart = parts && parts.find(p => p.inlineData);
        
        if (!imagePart) {
            console.error("Full Response:", JSON.stringify(response, null, 2));
            throw new Error("No image data returned from API. (Check server logs for full response)");
        }
        
        const base64Image = imagePart.inlineData.data;
        const imageBuffer = Buffer.from(base64Image, 'base64');
        
        const assetPath = path.join(__dirname, asset.path);
        fs.writeFileSync(assetPath, imageBuffer);
        
        // Save the feedback that generated this image so it persists
        const feedbackPath = path.join(__dirname, 'feedback.json');
        let data = {};
        if (fs.existsSync(feedbackPath)) {
            data = JSON.parse(fs.readFileSync(feedbackPath, 'utf8'));
        }
        if (!data[assetId]) data[assetId] = {};
        data[assetId].status = 'needs_revision'; // It's still needs_revision until accepted
        data[assetId].feedback = feedback || '';
        fs.writeFileSync(feedbackPath, JSON.stringify(data, null, 2));
        
        console.log(`Success! Saved to ${assetPath}`);
        res.json({ success: true, message: `Image generated and saved as ${asset.path}` });
        
    } catch (error) {
        console.error('Generation Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Art Reviewer Tool running at http://localhost:${PORT}`);
});
