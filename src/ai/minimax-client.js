/**
 * SANS Plan Examiner - MiniMax AI Client
 * Building code compliance analysis using MiniMax API
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class MiniMaxClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.MINIMAX_API_KEY || '';
    this.baseUrl = config.baseUrl || process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1';
    this.model = config.model || process.env.MINIMAX_MODEL || 'abab6.5s-chat';

    if (!this.apiKey) {
      console.warn('⚠️  MiniMax API key not configured. Using fallback rules.');
    }
  }

  /**
   * Make API call to MiniMax
   */
  async _callApi(messages, temperature = 0.3) {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/text/chatcompletion_v2`,
        {
          model: this.model,
          messages: messages,
          temperature: temperature
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout for analysis
        }
      );

      if (response.status === 200) {
        return response.data.choices[0].message.content;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract JSON from response (handle markdown wrapping)
   */
  _parseJsonResponse(text) {
    if (!text) return null;

    try {
      // Handle markdown code blocks
      let cleaned = text.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7);
      }
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }

      return JSON.parse(cleaned.trim());
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
      return null;
    }
  }

  /**
   * Analyze building plan text against SANS 10400 clauses
   */
  async analyzeBuildingPlan(planText, applicationId) {
    if (!this.apiKey) {
      return this._fallbackAnalyze(planText, applicationId);
    }

    const systemPrompt = `You are a building code compliance officer for Tshwane Municipality.
Your job is to analyze building plan descriptions against SANS 10400 building regulations.

Analyze the following building plan information and check compliance for these key SANS 10400 clauses:

**STRUCTURAL & FOUNDATION:**
1. SANS10400-A1 - Site Orientation (north arrow, sun path)
2. SANS10400-A2 - Ceiling Height (min 2400mm for habitable rooms, 2100mm for non-habitable)
3. SANS10400-A3 - Floor Height (min 300mm above ground level in flood areas)
4. SANS10400-J1 - Foundation Requirements (depth, type based on soil classification)
5. SANS10400-J2 - Concrete Strength (min 25MPa for foundations)
6. SANS10400-J3 - Masonry Strength (compressive strength requirements)

**FIRE SAFETY:**
7. SANS10400-B1 - Occupancy Classification (A-F, H1-H4)
8. SANS10400-B2 - Fire Resistance (60 min for walls, 30 min for floors)
9. SANS10400-B3 - Means of Egress (exit width, travel distance)
10. SANS10400-B4 - Fire Detection (smoke detectors required)

**ACCESS & EGRESS:**
11. SANS10400-D1 - Stair Width (min 900mm for residential, 1000mm for commercial)
12. SANS10400-D2 - Stair Rise (max 190mm per step, max 16 steps per flight)
13. SANS10400-D3 - Handrail Height (min 900mm, max 1000mm)
14. SANS10400-D4 - Landings (min 900mm length)
15. SANS10400-D5 - Ramp Gradient (max 1:12 for ramps)

**NATURAL LIGHT & VENTILATION:**
16. SANS10400-G1 - Window Area (min 10% of floor area for habitable rooms)
17. SANS10400-G2 - Ventilation (min 5% openable area for habitable rooms)
18. SANS10400-G3 - Light Shafts (if no direct windows)

**PARKING & ACCESS:**
19. SANS10400-F1 - Parking Requirements (1 per 100m² for residential, varies for commercial)
20. SANS10400-F2 - Driveway Width (min 3.5m for single, 5m for double)
21. SANS10400-F3 - Turnaround Space (adequate for emergency vehicles)

**OCCUPANCY & ROOM SIZES:**
22. SANS10400-E1 - Room Sizes (min bedroom 6.5m², living room 12m²)
23. SANS10400-E2 - Bathroom Requirements (toilet, washbasin, shower/bath)
24. SANS10400-E3 - Kitchen Requirements (minimum fitment space)

**HEIGHT & BOUNDARY:**
25. SANS10400-H1 - Building Height (max 2 storeys in residential 1)
26. SANS10400-H2 - Site Coverage (max 60% for residential)
27. SANS10400-H3 - Boundary Wall Height (max 1.8m front, 2.1m rear/sides)

**ENERGY EFFICIENCY (SANS 10400-XA):**
28. SANS10400-XA1 - Thermal Performance (insulation requirements)
29. SANS10400-XA2 - Glazing (SHGC and U-value limits)
30. SANS10400-XA3 - Building Orientation (passive solar design)

For EACH relevant clause, return JSON with:
{
  "clause_id": "SANS10400-XXX",
  "clause_title": "Descriptive title",
  "status": "PASS" | "FAIL" | "WARNING" | "NEED_INFO",
  "measured_value": "What was found (e.g., '2400mm ceiling')",
  "required_value": "What is required (e.g., 'min 2400mm')",
  "reasoning": "Why you made this判断",
  "suggestion": "What needs to be fixed (if FAIL)",
  "confidence": 0.0-1.0
}

If no issues found, status is PASS.
If missing information to decide, status is NEED_INFO.
Be thorough - check dimensions, ratios, and specific requirements.`;

    const userMessage = `Building Plan Information:\n${planText}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    const result = await this._callApi(messages, 0.3);

    if (result) {
      // Try to parse as array of results
      let analysisResults = this._parseJsonResponse(result);

      if (!analysisResults) {
        // Try to find JSON in response
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          analysisResults = this._parseJsonResponse(jsonMatch[0]);
        }
      }

      if (Array.isArray(analysisResults)) {
        return analysisResults.map(r => ({
          ...r,
          application_id: applicationId,
          analyzed_at: new Date().toISOString()
        }));
      }
    }

    // Fallback if parsing fails
    return this._fallbackAnalyze(planText, applicationId);
  }

  /**
   * Fallback rule-based analysis when no API key
   */
  _fallbackAnalyze(planText, applicationId) {
    const text = planText.toLowerCase();
    const results = [];

    // SANS10400-A2: Ceiling Height
    const ceilingMatch = text.match(/ceiling.*?(\d+)\s*mm/i);
    if (ceilingMatch) {
      const height = parseInt(ceilingMatch[1]);
      results.push({
        application_id: applicationId,
        clause_id: 'SANS10400-A2',
        clause_title: 'Ceiling Height',
        status: height >= 2400 ? 'PASS' : 'FAIL',
        measured_value: `${height}mm`,
        required_value: 'min 2400mm (habitable), 2100mm (non-habitable)',
        reasoning: `Ceiling height measured at ${height}mm. Minimum requirement is 2400mm for habitable rooms.`,
        suggestion: height < 2400 ? 'Increase ceiling height to meet 2400mm requirement' : null,
        confidence: 0.9,
        analyzed_at: new Date().toISOString()
      });
    }

    // SANS10400-A3: Floor Height (flood areas)
    const floorHeightMatch = text.match(/floor.*?height.*?(\d+)\s*mm/i);
    if (floorHeightMatch) {
      const height = parseInt(floorHeightMatch[1]);
      results.push({
        application_id: applicationId,
        clause_id: 'SANS10400-A3',
        clause_title: 'Floor Height Above Ground',
        status: height >= 300 ? 'PASS' : 'WARNING',
        measured_value: `${height}mm`,
        required_value: 'min 300mm in flood-prone areas',
        reasoning: `Floor height is ${height}mm above ground level.`,
        suggestion: height < 300 ? 'Consider raising floor height for flood protection' : null,
        confidence: 0.7,
        analyzed_at: new Date().toISOString()
      });
    }

    // SANS10400-B1: Occupancy Classification
    const occupancyMatch = text.match(/occupancy.*?(a[1-4]|b1|b2|c|d|e|f|h[1-4])/i);
    if (occupancyMatch) {
      const occ = occupancyMatch[1].toUpperCase();
      results.push({
        application_id: applicationId,
        clause_id: 'SANS10400-B1',
        clause_title: 'Occupancy Classification',
        status: 'PASS',
        measured_value: occ,
        required_value: 'Valid occupancy type (A-F, H1-H4)',
        reasoning: `Occupancy classification: ${occ}`,
        suggestion: null,
        confidence: 0.85,
        analyzed_at: new Date().toISOString()
      });
    }

    // SANS10400-D1: Stair Width
    const stairWidthMatch = text.match(/stair.*?width.*?(\d+)\s*mm/i);
    if (stairWidthMatch) {
      const width = parseInt(stairWidthMatch[1]);
      results.push({
        application_id: applicationId,
        clause_id: 'SANS10400-D1',
        clause_title: 'Stair Width',
        status: width >= 900 ? 'PASS' : 'FAIL',
        measured_value: `${width}mm`,
        required_value: 'min 900mm (residential), 1000mm (commercial)',
        reasoning: `Stair width measured at ${width}mm. Minimum requirement is 900mm for residential.`,
        suggestion: width < 900 ? 'Increase stair width to meet 900mm requirement' : null,
        confidence: 0.85,
        analyzed_at: new Date().toISOString()
      });
    }

    // SANS10400-D2: Stair Rise
    const stairRiseMatch = text.match(/stair.*?rise.*?(\d+)\s*mm/i);
    if (stairRiseMatch) {
      const rise = parseInt(stairRiseMatch[1]);
      results.push({
        application_id: applicationId,
        clause_id: 'SANS10400-D2',
        clause_title: 'Stair Rise',
        status: rise <= 190 ? 'PASS' : 'FAIL',
        measured_value: `${rise}mm`,
        required_value: 'max 190mm per step',
        reasoning: `Stair rise is ${rise}mm. Maximum allowed is 190mm per step.`,
        suggestion: rise > 190 ? 'Reduce step rise to max 190mm' : null,
        confidence: 0.85,
        analyzed_at: new Date().toISOString()
      });
    }

    // SANS10400-D3: Handrail Height
    const handrailMatch = text.match(/handrail.*?height.*?(\d+)\s*mm/i);
    if (handrailMatch) {
      const height = parseInt(handrailMatch[1]);
      results.push({
        application_id: applicationId,
        clause_id: 'SANS10400-D3',
        clause_title: 'Handrail Height',
        status: height >= 900 && height <= 1000 ? 'PASS' : 'FAIL',
        measured_value: `${height}mm`,
        required_value: 'min 900mm, max 1000mm',
        reasoning: `Handrail height is ${height}mm. Must be between 900mm and 1000mm.`,
        suggestion: height < 900 || height > 1000 ? 'Adjust handrail height to 900-1000mm range' : null,
        confidence: 0.8,
        analyzed_at: new Date().toISOString()
      });
    }

    // SANS10400-G1: Window Area (10% of floor)
    const windowMatch = text.match(/window.*?(\d+(?:\.\d+)?)\s*%/i);
    if (windowMatch) {
      const pct = parseFloat(windowMatch[1]);
      results.push({
        application_id: applicationId,
        clause_id: 'SANS10400-G1',
        clause_title: 'Window Area (Natural Light)',
        status: pct >= 10 ? 'PASS' : 'FAIL',
        measured_value: `${pct}% of floor area`,
        required_value: 'min 10% for habitable rooms',
        reasoning: `Window area is ${pct}% of floor area. Minimum requirement is 10%.`,
        suggestion: pct < 10 ? 'Increase window area to meet 10% requirement' : null,
        confidence: 0.8,
        analyzed_at: new Date().toISOString()
      });
    }

    // SANS10400-G2: Ventilation (5% openable)
    const ventMatch = text.match(/ventilation.*?(\d+(?:\.\d+)?)\s*%/i);
    if (ventMatch) {
      const pct = parseFloat(ventMatch[1]);
      results.push({
        application_id: applicationId,
        clause_id: 'SANS10400-G2',
        clause_title: 'Ventilation (Openable Area)',
        status: pct >= 5 ? 'PASS' : 'FAIL',
        measured_value: `${pct}% openable`,
        required_value: 'min 5% for habitable rooms',
        reasoning: `Openable ventilation area is ${pct}%. Minimum requirement is 5%.`,
        suggestion: pct < 5 ? 'Increase openable ventilation to meet 5% requirement' : null,
        confidence: 0.8,
        analyzed_at: new Date().toISOString()
      });
    }

    // SANS10400-F1: Parking
    const parkingMatch = text.match(/parking.*?(\d+)\s*(?:spaces|bays|slots)/i);
    const floorAreaMatch = text.match(/(\d+(?:\.\d+)?)\s*m²/i);
    if (parkingMatch && floorAreaMatch) {
      const parking = parseInt(parkingMatch[1]);
      const area = parseFloat(floorAreaMatch[1]);
      const required = Math.ceil(area / 100);
      results.push({
        application_id: applicationId,
        clause_id: 'SANS10400-F1',
        clause_title: 'Parking Requirements',
        status: parking >= required ? 'PASS' : 'FAIL',
        measured_value: `${parking} bays for ${area}m²`,
        required_value: `min ${required} bays (1 per 100m²)`,
        reasoning: `Parking provision is ${parking} bays for ${area}m² floor area. Required: ${required} minimum.`,
        suggestion: parking < required ? `Add ${required - parking} more parking bay(s)` : null,
        confidence: 0.75,
        analyzed_at: new Date().toISOString()
      });
    }

    // SANS10400-H1: Building Height
    const storeyMatch = text.match(/(\d+)\s*(?:storey|storeys|floor|floors)/i);
    if (storeyMatch) {
      const floors = parseInt(storeyMatch[1]);
      results.push({
        application_id: applicationId,
        clause_id: 'SANS10400-H1',
        clause_title: 'Building Height',
        status: floors <= 2 ? 'PASS' : 'WARNING',
        measured_value: `${floors} storey(s)`,
        required_value: 'max 2 storeys (Residential 1 zone)',
        reasoning: `Building is ${floors} storey(s) high.`,
        suggestion: floors > 2 ? 'Check zoning regulations for height limits' : null,
        confidence: 0.7,
        analyzed_at: new Date().toISOString()
      });
    }

    // SANS10400-H2: Site Coverage
    const coverageMatch = text.match(/site.*?coverage.*?(\d+(?:\.\d+)?)\s*%/i);
    if (coverageMatch) {
      const pct = parseFloat(coverageMatch[1]);
      results.push({
        application_id: applicationId,
        clause_id: 'SANS10400-H2',
        clause_title: 'Site Coverage',
        status: pct <= 60 ? 'PASS' : 'FAIL',
        measured_value: `${pct}%`,
        required_value: 'max 60% for residential',
        reasoning: `Site coverage is ${pct}%. Maximum allowed is 60% for residential.`,
        suggestion: pct > 60 ? 'Reduce site coverage to max 60%' : null,
        confidence: 0.8,
        analyzed_at: new Date().toISOString()
      });
    }

    // SANS10400-E1: Room Sizes
    const bedroomMatch = text.match(/bedroom.*?(\d+(?:\.\d+)?)\s*m²/i);
    if (bedroomMatch) {
      const area = parseFloat(bedroomMatch[1]);
      results.push({
        application_id: applicationId,
        clause_id: 'SANS10400-E1',
        clause_title: 'Minimum Room Sizes',
        status: area >= 6.5 ? 'PASS' : 'FAIL',
        measured_value: `${area}m² bedroom`,
        required_value: 'min 6.5m² for bedrooms, 12m² for living rooms',
        reasoning: `Bedroom area is ${area}m². Minimum requirement is 6.5m².`,
        suggestion: area < 6.5 ? 'Increase bedroom size to min 6.5m²' : null,
        confidence: 0.75,
        analyzed_at: new Date().toISOString()
      });
    }

    // SANS10400-J1: Foundation Requirements (check for mention)
    if (text.includes('foundation') || text.includes('footing')) {
      results.push({
        application_id: applicationId,
        clause_id: 'SANS10400-J1',
        clause_title: 'Foundation Requirements',
        status: 'NEED_INFO',
        measured_value: 'Foundation mentioned',
        required_value: 'Verified foundation design based on soil classification',
        reasoning: 'Foundation is mentioned but specific depth/type not specified.',
        suggestion: 'Provide foundation design details including depth and soil classification',
        confidence: 0.5,
        analyzed_at: new Date().toISOString()
      });
    }

    // Default PASS if no issues found
    if (results.length === 0) {
      results.push({
        application_id: applicationId,
        clause_id: 'SANS10400-GENERAL',
        clause_title: 'General Compliance',
        status: 'PASS',
        measured_value: 'No specific measurements found',
        required_value: 'Check all relevant clauses',
        reasoning: 'No obvious compliance issues detected from provided information. Full analysis requires detailed plan data.',
        suggestion: null,
        confidence: 0.5,
        analyzed_at: new Date().toISOString()
      });
    }

    return results;
  }

  /**
   * Process examiner feedback for learning
   */
  async processCorrection(originalPrediction, examinerCorrection, context) {
    if (!this.apiKey) {
      return this._fallbackProcessCorrection(originalPrediction, examinerCorrection);
    }

    const systemPrompt = `You are learning from building code examiner corrections.
Analyze how the examiner corrected your AI prediction.

Return JSON:
{
  "pattern_id": "what_pattern_was_wrong",
  "explanation": "why the correction makes sense",
  "new_rule": "any new rule to remember",
  "apply_to_clauses": ["SANS10400-A2", etc],
  "confidence_adjustment": -0.1 to +0.1
}`;

    const userMessage = `Original AI prediction: ${JSON.stringify(originalPrediction)}
Examiner correction: ${examinerCorrection}
Context: ${context}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    const result = await this._callApi(messages, 0.5);

    if (result) {
      return this._parseJsonResponse(result) || this._fallbackProcessCorrection(originalPrediction, examinerCorrection);
    }

    return this._fallbackProcessCorrection(originalPrediction, examinerCorrection);
  }

  _fallbackProcessCorrection(originalPrediction, examinerCorrection) {
    return {
      pattern_id: 'general_correction',
      explanation: 'Examiner provided manual correction',
      new_rule: null,
      apply_to_clauses: [originalPrediction.clause_id],
      confidence_adjustment: -0.1
    };
  }

  /**
   * Generate analysis summary
   */
  async generateSummary(analysisResults) {
    if (!this.apiKey) {
      return this._fallbackSummary(analysisResults);
    }

    const passed = analysisResults.filter(r => r.status === 'PASS').length;
    const failed = analysisResults.filter(r => r.status === 'FAIL').length;
    const warnings = analysisResults.filter(r => r.status === 'WARNING').length;

    const systemPrompt = `You are a building control officer summarizing plan analysis results.
Create a brief, professional summary for the applicant.

Include:
- Overall compliance status
- Key issues that need attention
- What to do next

Keep it concise and actionable.`;

    const userMessage = `Analysis Results:
- ${passed} clauses PASSED
- ${failed} clauses FAILED
- ${warnings} clauses need attention

Details: ${JSON.stringify(analysisResults)}`;

    const result = await this._callApi([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ], 0.7);

    return result || this._fallbackSummary(analysisResults);
  }

  _fallbackSummary(analysisResults) {
    const failed = analysisResults.filter(r => r.status === 'FAIL').length;
    const passed = analysisResults.filter(r => r.status === 'PASS').length;

    if (failed > 0) {
      return `${failed} compliance issue(s) need to be addressed before approval. ${passed} requirements met.`;
    }
    return `Building plan meets ${passed} SANS 10400 requirements. No critical issues found.`;
  }
}

// Export for use in server
module.exports = MiniMaxClient;