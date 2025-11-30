import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

/**
 * OpenAI Secular Assistant Integration
 * 
 * Analyzes StockCharts chart images using OpenAI Assistant
 * Returns 3-layer JSON analysis (layer1, layer2, layer3)
 */

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID || 'asst_Avw3WLDShSyQbeSQgscnuhqu';
const POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLL_TIME = 300000; // 5 minutes

export class OpenAIAssistant {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Analyze chart image with OpenAI Secular Assistant
   * @param {string} chartPath - Path to chart image file
   * @param {string} date - Analysis date (YYYY-MM-DD)
   * @returns {Promise<Object>} Analysis result with layer1, layer2, layer3
   */
  async analyze(chartPath, date) {
    console.log('[OpenAI] Starting chart analysis...');
    console.log(`[OpenAI] Chart: ${chartPath}`);
    console.log(`[OpenAI] Date: ${date}`);
    console.log(`[OpenAI] Assistant ID: ${ASSISTANT_ID}`);

    // Verify chart file exists
    if (!fs.existsSync(chartPath)) {
      throw new Error(`Chart file not found: ${chartPath}`);
    }

    let fileId = null;

    try {
      // Step 1: Upload chart to OpenAI
      console.log('[OpenAI] Uploading chart...');
      const file = await this.client.files.create({
        file: fs.createReadStream(chartPath),
        purpose: 'assistants'
      });
      fileId = file.id;
      console.log(`[OpenAI] Chart uploaded: ${fileId}`);

      // Step 2: Create thread
      console.log('[OpenAI] Creating thread...');
      const thread = await this.client.beta.threads.create();
      console.log(`[OpenAI] Thread created: ${thread.id}`);

      // Step 3: Send message with chart
      console.log('[OpenAI] Sending message...');
      await this.client.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `engine + all layers\n\nAnalysis Date: ${date}\n\nAnalyze the attached chart and provide 3-layer analysis.`
          },
          {
            type: 'image_file',
            image_file: { file_id: fileId }
          }
        ]
      });

      // Step 4: Run assistant
      console.log('[OpenAI] Running assistant...');
      let run = await this.client.beta.threads.runs.create(thread.id, {
        assistant_id: ASSISTANT_ID,
        response_format: { type: 'json_object' },
        temperature: 0
      });
      console.log(`[OpenAI] Run started: ${run.id}`);

      // Step 5: Poll for completion
      const startTime = Date.now();
      while (run.status !== 'completed') {
        // Check timeout
        if (Date.now() - startTime > MAX_POLL_TIME) {
          throw new Error('Assistant run timeout (5 minutes)');
        }

        // Check for failure
        if (run.status === 'failed') {
          throw new Error(`Assistant run failed: ${run.last_error?.message || 'Unknown error'}`);
        }

        if (run.status === 'cancelled') {
          throw new Error('Assistant run was cancelled');
        }

        if (run.status === 'expired') {
          throw new Error('Assistant run expired');
        }

        // Log progress
        console.log(`[OpenAI] Run status: ${run.status}`);

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

        // Fetch updated run status
        run = await this.client.beta.threads.runs.retrieve(thread.id, run.id);
      }

      console.log('[OpenAI] Run completed successfully');

      // Step 6: Retrieve response
      console.log('[OpenAI] Retrieving response...');
      const messages = await this.client.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant');

      if (!assistantMessage) {
        throw new Error('No assistant response found');
      }

      const textContent = assistantMessage.content.find(c => c.type === 'text');
      if (!textContent) {
        throw new Error('No text content in assistant response');
      }

      // Step 7: Parse JSON response
      let analysis;
      try {
        analysis = JSON.parse(textContent.text.value);
      } catch (error) {
        console.error('[OpenAI] Failed to parse JSON response:', textContent.text.value);
        throw new Error(`Failed to parse assistant response: ${error.message}`);
      }

      // Step 8: Normalize keys (handle layer_1, layer 1, etc.)
      const normalized = this.normalizeKeys(analysis);

      // Verify structure
      if (!normalized.layer1 || !normalized.layer2 || !normalized.layer3) {
        console.error('[OpenAI] Invalid response structure:', normalized);
        throw new Error('Response missing required layers (layer1, layer2, layer3)');
      }

      console.log('[OpenAI] Analysis completed successfully');
      console.log(`[OpenAI] Layer 1 keys: ${Object.keys(normalized.layer1).join(', ')}`);
      console.log(`[OpenAI] Layer 2 keys: ${Object.keys(normalized.layer2).join(', ')}`);
      console.log(`[OpenAI] Layer 3 keys: ${Object.keys(normalized.layer3).join(', ')}`);

      return normalized;

    } finally {
      // Cleanup: Delete uploaded file
      if (fileId) {
        try {
          await this.client.files.del(fileId);
          console.log(`[OpenAI] Cleaned up file: ${fileId}`);
        } catch (error) {
          console.warn(`[OpenAI] Failed to delete file ${fileId}:`, error.message);
        }
      }
    }
  }

  /**
   * Normalize JSON keys to handle variations (layer_1, layer 1, layer1)
   * @param {Object} data - Raw analysis data
   * @returns {Object} Normalized data with layer1, layer2, layer3 keys
   */
  normalizeKeys(data) {
    const normalized = {};

    for (const [key, value] of Object.entries(data)) {
      // Remove spaces and underscores, convert to lowercase
      const normalizedKey = key.replace(/[ _]/g, '').toLowerCase();
      normalized[normalizedKey] = value;
    }

    return normalized;
  }

  /**
   * Save analysis to JSON file
   * @param {Object} analysis - Analysis result
   * @param {string} outputPath - Output file path
   */
  saveToFile(analysis, outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
    console.log(`[OpenAI] Analysis saved to: ${outputPath}`);
  }
}

// Export singleton instance
export const openaiAssistant = new OpenAIAssistant();

/**
 * Analyze chart with OpenAI Assistant
 * @param {string} chartPath - Path to chart image
 * @param {string} date - Analysis date (YYYY-MM-DD)
 * @returns {Promise<Object>} Analysis with layer1, layer2, layer3
 */
export async function analyzeChart(chartPath, date) {
  return await openaiAssistant.analyze(chartPath, date);
}
