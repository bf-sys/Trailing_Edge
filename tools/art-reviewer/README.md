# Art Reviewer Tool

This is a standalone Node.js tool used to autonomously generate, review, and iterate on pixel art game assets using the Gemini API.

## How to Start the Tool

You can run this tool at any time from your terminal.

1. Open your terminal (or a new terminal window inside your IDE).
2. Navigate into the tool's directory:
   ```bash
   cd "C:\Users\bryan\Documents\Claude projects\Trailing_Edge\tools\art-reviewer"
   ```
3. Start the server:
   ```bash
   npm run start
   ```

Once the terminal says `Art Reviewer Tool running at http://localhost:3000`, open that URL in your web browser. 

When you are finished, press `Ctrl + C` in the terminal to kill the server.

## Features
- **Direct Gemini Generation**: Connects directly to `gemini-3.1-flash-image` using the `GEMINI_API_KEY` in your `.env` file.
- **Image-to-Image (I2I)**: Checking the "Use current image as base reference" box will pass the existing image as a reference to lock in the asset's shape/style.
- **Editable Base Prompts**: Expand the "Advanced: Edit Base Prompt" panel on any card to edit the core prompt and save it directly to `assets.json`.
