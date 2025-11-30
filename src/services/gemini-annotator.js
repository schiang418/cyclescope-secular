import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

/**
 * Gemini Chart Annotator Service
 * 
 * Uses Google Gemini 3 Pro to overlay analysis text on stock charts
 * without altering the underlying price data.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBrBs2t1D5Km12Ri6PjFgso38ljBiNmJOI';
const GEMINI_MODEL = 'gemini-3-pro-image-preview';

export class GeminiAnnotator {
  constructor() {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }

  /**
   * Format Layer 3 output for overlay display
   * @param {Object} layer3 - Layer 3 analysis object
   * @returns {string} Formatted text for overlay
   */
  formatLayer3ForOverlay(layer3) {
    const { scenario_summary, primary_message } = layer3;
    
    let text = '';
    
    // Add scenario summaries as bullets
    if (scenario_summary && Array.isArray(scenario_summary)) {
      scenario_summary.forEach(summary => {
        text += `• ${summary}\n`;
      });
    }
    
    // Add primary message
    if (primary_message) {
      text += `\n${primary_message}`;
    }
    
    return text.trim();
  }

  /**
   * Annotate chart with analysis overlay
   * @param {string} inputPath - Path to original chart PNG
   * @param {string} outputPath - Path to save annotated chart PNG
   * @param {Object} layer3 - Layer 3 analysis object
   * @returns {Promise<string>} Path to annotated chart
   */
  async annotateChart(inputPath, outputPath, layer3) {
    console.log('[Gemini] Starting chart annotation...');
    console.log(`[Gemini] Input: ${inputPath}`);
    console.log(`[Gemini] Output: ${outputPath}`);

    // Verify input file exists
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input chart not found: ${inputPath}`);
    }

    // Format Layer 3 text for overlay
    const instructions = this.formatLayer3ForOverlay(layer3);
    console.log('[Gemini] Overlay text:');
    console.log(instructions);

    // Read file as buffer and convert to base64
    const fileBuffer = fs.readFileSync(inputPath);
    const base64Image = fileBuffer.toString('base64');

    // Construct the prompt
    const prompt = `
You are a specialized financial charting assistant.
  
TASK:
The user has provided a list of NOTES or SCENARIOS below. 
Your job is to overlay these notes as a clean, bulleted list on the chart image.

INPUT NOTES:
"${instructions}"

VISUALIZATION RULES:
1. NO DRAWING ON CANDLES: Do NOT draw arrows, trendlines, curves, or prediction paths. Do not touch the price action/candles.
2. OVERLAY BOX: Create a semi-transparent dark background box (like a "Heads Up Display" or Legend).
3. PLACEMENT: Place this box in an empty area of the chart (preferably top-left or bottom-left) where it DOES NOT OBSCURE the recent price candles (usually on the right).
4. CONTENT: Inside the box, render the provided inputs as a crisp, readable BULLETED LIST.
5. STYLE: Use bright white text for high contrast. Use a professional sans-serif font. 
6. FONT SIZE: CRITICAL - USE A VERY SMALL, COMPACT FONT SIZE (approx 10px). The text must be legible but minimize screen real estate usage.

STRICT CONSTRAINTS (CRITICAL):
1. DATA INTEGRITY IS PARAMOUNT: The underlying chart (candlesticks, price numbers on the axis, dates, grid lines, background color) must remain VISUALLY IDENTICAL to the source image provided. 
2. DO NOT REDRAW THE DATA: Do not regenerate the candlesticks or change the last closing price. The chart data must be preserved exactly as is.
3. ADDITIVE ONLY: Your job is to ADD the text overlay box on top of the existing image.
4. TEXT ACCURACY: Ensure all superimposed text is SPELLED CORRECTLY.

EXECUTION:
Generate a new image that acts as a perfect copy of the original with the requested text overlay layered on top.
    `.trim();

    try {
      console.log('[Gemini] Calling Gemini API...');

      const response = await this.client.models.generateContent({
        model: GEMINI_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: 'image/png',
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            imageSize: '2K', // Request high resolution
          },
        },
      });

      // Extract image from response
      const parts = response.candidates?.[0]?.content?.parts;

      if (!parts) {
        throw new Error('No content returned from Gemini');
      }

      const imagePart = parts.find(part => part.inlineData && part.inlineData.data);

      if (!imagePart || !imagePart.inlineData) {
        // Check if model returned text instead
        const textPart = parts.find(part => part.text);
        if (textPart) {
          throw new Error(`Model returned text instead of image: ${textPart.text}`);
        }
        throw new Error('Model did not return a valid image');
      }

      // Write to disk
      const outputBuffer = Buffer.from(imagePart.inlineData.data, 'base64');

      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, outputBuffer);
      console.log(`[Gemini] Annotated chart saved: ${outputPath}`);

      return outputPath;
    } catch (error) {
      console.error('[Gemini] Annotation failed:', error);
      throw error;
    }
  }
}

export const geminiAnnotator = new GeminiAnnotator();
