/**
 * SANS Plan Examiner - AI Analyzer
 * Combines PDF text extraction with MiniMax API analysis
 */

const pdfParse = require('pdf-parse');
const MiniMaxClient = require('./minimax-client');
const fs = require('fs');
const path = require('path');

class SansAnalyzer {
  constructor(config = {}) {
    this.minimax = new MiniMaxClient(config.minimax);
    this.db = config.db;
  }

  /**
   * Extract text from PDF file buffer
   */
  async extractTextFromPdf(pdfBuffer) {
    try {
      const data = await pdfParse(pdfBuffer);
      return {
        text: data.text,
        numPages: data.numpages,
        info: data.info
      };
    } catch (error) {
      console.error('PDF extraction error:', error.message);
      return null;
    }
  }

  /**
   * Extract text from file path
   */
  async extractTextFromFile(filePath) {
    try {
      const buffer = fs.readFileSync(filePath);
      return await this.extractTextFromPdf(buffer);
    } catch (error) {
      console.error('File read error:', error.message);
      return null;
    }
  }

  /**
   * Extract building information from text
   */
  _extractBuildingInfo(text) {
    const info = {
      floorArea: null,
      ceilingHeight: null,
      occupancy: null,
      parking: null,
      windowArea: null,
      stairWidth: null,
      stairRise: null,
      rooms: [],
      floors: 1
    };

    // Floor area
    const floorMatch = text.match(/floor.*?area.*?(\d+(?:\.\d+)?)\s*m²/i);
    if (floorMatch) info.floorArea = parseFloat(floorMatch[1]);

    const sqmMatch = text.match(/(\d+(?:\.\d+)?)\s*m²/i);
    if (sqmMatch && !info.floorArea) info.floorArea = parseFloat(sqmMatch[1]);

    // Ceiling height
    const ceilingMatch = text.match(/ceiling.*?height.*?(\d+)\s*mm/i);
    if (ceilingMatch) info.ceilingHeight = parseInt(ceilingMatch[1]);

    const heightMatch = text.match(/height.*?(\d+)\s*mm/i);
    if (heightMatch && !info.ceilingHeight) info.ceilingHeight = parseInt(heightMatch[1]);

    // Occupancy classification
    const occupancyMatch = text.match(/occupancy.*?(A|B|C|D|E|F|H1|H2|H3|H4)/i);
    if (occupancyMatch) info.occupancy = occupancyMatch[1].toUpperCase();

    // Parking
    const parkingMatch = text.match(/parking.*?(\d+)\s*(?:spaces|bays)/i);
    if (parkingMatch) info.parking = parseInt(parkingMatch[1]);

    // Window area percentage
    const windowMatch = text.match(/window.*?(\d+(?:\.\d+)?)\s*%/i);
    if (windowMatch) info.windowArea = parseFloat(windowMatch[1]);

    // Stair dimensions
    const stairWidthMatch = text.match(/stair.*?width.*?(\d+)\s*mm/i);
    if (stairWidthMatch) info.stairWidth = parseInt(stairWidthMatch[1]);

    const stairRiseMatch = text.match(/stair.*?rise.*?(\d+)\s*mm/i);
    if (stairRiseMatch) info.stairRise = parseInt(stairRiseMatch[1]);

    // Room count
    const bedroomMatch = text.match(/bedroom/i);
    if (bedroomMatch) info.rooms.push('bedroom');

    const bathroomMatch = text.match(/bathroom/i);
    if (bathroomMatch) info.rooms.push('bathroom');

    const kitchenMatch = text.match(/kitchen/i);
    if (kitchenMatch) info.rooms.push('kitchen');

    const loungeMatch = text.match(/lounge|living/i);
    if (loungeMatch) info.rooms.push('lounge');

    // Floor count
    const floorCountMatch = text.match(/(\d+)\s*(?:storey|storeys|floor|floors)/i);
    if (floorCountMatch) info.floors = parseInt(floorCountMatch[1]);

    return info;
  }

  /**
   * Format extracted info for AI analysis
   */
  _formatBuildingInfo(info) {
    let formatted = 'BUILDING INFORMATION EXTRACTED:\n';

    if (info.floorArea) formatted += `- Floor Area: ${info.floorArea}m²\n`;
    if (info.ceilingHeight) formatted += `- Ceiling Height: ${info.ceilingHeight}mm\n`;
    if (info.occupancy) formatted += `- Occupancy Classification: ${info.occupancy}\n`;
    if (info.parking) formatted += `- Parking: ${info.parking} bays\n`;
    if (info.windowArea) formatted += `- Window Area: ${info.windowArea}%\n`;
    if (info.stairWidth) formatted += `- Stair Width: ${info.stairWidth}mm\n`;
    if (info.stairRise) formatted += `- Stair Rise: ${info.stairRise}mm\n`;
    if (info.rooms.length) formatted += `- Rooms: ${info.rooms.join(', ')}\n`;
    if (info.floors) formatted += `- Number of Floors: ${info.floors}\n`;

    return formatted;
  }

  /**
   * Main analysis method - extract text and analyze
   */
  async analyze(applicationId, options = {}) {
    const { pdfBuffer, pdfPath, extractedText, buildingInfo } = options;

    let textToAnalyze = extractedText;

    // If no extracted text provided, try to get from PDF
    if (!textToAnalyze && (pdfBuffer || pdfPath)) {
      const extracted = pdfBuffer
        ? await this.extractTextFromPdf(pdfBuffer)
        : await this.extractTextFromFile(pdfPath);

      if (extracted) {
        textToAnalyze = extracted.text;
        console.log(`Extracted ${extracted.numPages} pages from PDF`);
      }
    }

    if (!textToAnalyze) {
      return {
        success: false,
        error: 'No text available for analysis'
      };
    }

    // Extract building info for better analysis
    const info = buildingInfo || this._extractBuildingInfo(textToAnalyze);
    const formattedInfo = this._formatBuildingInfo(info);

    // Combine with original text for full context
    const fullAnalysisText = `${formattedInfo}\n\nFULL PDF TEXT:\n${textToAnalyze.substring(0, 8000)}`; // Limit to 8000 chars

    // Call MiniMax API for analysis
    const results = await this.minimax.analyzeBuildingPlan(fullAnalysisText, applicationId);

    if (!results || results.length === 0) {
      return {
        success: false,
        error: 'AI analysis failed to return results'
      };
    }

    // Add extracted info to results for context
    results.forEach(r => {
      r.extracted_info = info;
    });

    // Generate summary
    const summary = await this.minimax.generateSummary(results);

    return {
      success: true,
      results: results,
      summary: summary,
      extractedInfo: info,
      textLength: textToAnalyze.length
    };
  }

  /**
   * Process examiner feedback for learning
   */
  async processFeedback(applicationId, originalResults, examinerCorrections) {
    for (const correction of examinerCorrections) {
      const original = originalResults.find(r => r.clause_id === correction.clause_id);

      if (original) {
        const learning = await this.minimax.processCorrection(
          original,
          correction.correction,
          correction.context
        );

        // Store learning in database if db provided
        if (this.db) {
          await this.storeFeedback(applicationId, original, learning);
        }

        return learning;
      }
    }

    return null;
  }

  /**
   * Store feedback for future learning
   */
  async storeFeedback(applicationId, originalPrediction, learning) {
    if (!this.db) return;

    try {
      const { error } = await this.db
        .from('ai_feedback')
        .insert({
          application_id: applicationId,
          clause_id: originalPrediction.clause_id,
          original_prediction: JSON.stringify(originalPrediction),
          examiner_correction: learning.explanation,
          new_rule: learning.new_rule,
          confidence_adjustment: learning.confidence_adjustment,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to store feedback:', error.message);
      }
    } catch (err) {
      console.error('Feedback storage error:', err.message);
    }
  }
}

module.exports = SansAnalyzer;