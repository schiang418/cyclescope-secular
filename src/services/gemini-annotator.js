import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3-pro-image-preview';

/**
 * Gemini Chart Annotator Service
 * 
 * Superimposes Layer 3 analysis onto stock chart images using Google Gemini AI.
 */
class GeminiAnnotator {
  constructor() {
    if (!GEMINI_API_KEY) {
      console.warn('[Gemini] WARNING: GEMINI_API_KEY not set');
    }
    this.client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }

  /**
   * Format Layer 3 analysis for overlay text
   * @param {Object} layer3 - Layer 3 analysis object
   * @returns {string} Formatted text for overlay
   */
  formatLayer3ForOverlay(layer3) {
    const lines = [];
    
    // Add scenario summaries as bullet points
    if (layer3.scenario_summary && Array.isArray(layer3.scenario_summary)) {
      layer3.scenario_summary.forEach(summary => {
        lines.push(`• ${summary}`);
      });
    }
    
    // Add primary message
    if (layer3.primary_message) {
      lines.push('');
      lines.push(layer3.primary_message);
    }
    
    return lines.join('\\n');
  }

  /**
   * Annotate chart with Layer 3 analysis
   * @param {string} inputPath - Path to original chart PNG
   * @param {string} outputPath - Path to save annotated chart PNG
   * @param {Object} layer3 - Layer 3 analysis object
   * @returns {Promise<string>} Path to annotated chart
   */
  async annotateChart(inputPath, outputPath, layer3) {
    console.log('\\n========================================');
    console.log('[Gemini] Starting chart annotation...');
    console.log(`[Gemini] Input: ${inputPath}`);
    console.log(`[Gemini] Output: ${outputPath}`);
    console.log(`[Gemini] API Key: ${GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 20) + '...' : 'NOT SET'}`);
    console.log(`[Gemini] Model: ${GEMINI_MODEL}`);

    // Verify input file exists
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input chart not found: ${inputPath}`);
    }

    // Format Layer 3 text for overlay
    const instructions = this.formatLayer3ForOverlay(layer3);
    console.log('[Gemini] Overlay text:');
    console.log(instructions);
    console.log(`[Gemini] Overlay text length: ${instructions.length} chars`);

    // Read file as buffer and convert to base64
    const fileBuffer = fs.readFileSync(inputPath);
    const base64Image = fileBuffer.toString('base64');
    console.log(`[Gemini] Image size: ${fileBuffer.length} bytes`);
    console.log(`[Gemini] Base64 length: ${base64Image.length} chars`);

    // Construct the strict prompt
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
3. PLACEMENT: Place this box in an empty area of the image file (preferably top-right) where it DOES NOT OBSCURE the recent price candles (usually on the right).
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
      console.log(`[Gemini] Request timestamp: ${new Date().toISOString()}`);

      console.log('[Gemini] Sending request to Gemini...');
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

      console.log('[Gemini] Response received');
      console.log(`[Gemini] Response timestamp: ${new Date().toISOString()}`);
      console.log(`[Gemini] Response candidates: ${response.candidates?.length || 0}`);
      
      // Extract image from response
      const parts = response.candidates?.[0]?.content?.parts;
      console.log(`[Gemini] Parts count: ${parts?.length || 0}`);

      if (!parts) {
        throw new Error('No content returned from Gemini');
      }

      const imagePart = parts.find(part => part.inlineData && part.inlineData.data);

      if (!imagePart || !imagePart.inlineData) {
        // Check if model returned text instead of image
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
      console.log(`[Gemini] Output file size: ${outputBuffer.length} bytes`);
      console.log('[Gemini] Annotation completed successfully');
      console.log('========================================\\n');

      return outputPath;
    } catch (error) {
      console.error('\\n========================================');
      console.error('[Gemini] ❌ ANNOTATION FAILED');
      console.error('[Gemini] Error name:', error.name);
      console.error('[Gemini] Error message:', error.message);
      console.error('[Gemini] Error stack:', error.stack);
      if (error.response) {
        console.error('[Gemini] API Response:', JSON.stringify(error.response, null, 2));
      }
      console.error('========================================\\n');
      throw error;
    }
  }
}

export const geminiAnnotator = new GeminiAnnotator();
