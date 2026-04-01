import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface TradingStrategy {
  name: string;
  description: string;
  target: string;
  stopLoss: string;
  timing: string;
}

export interface TradingSetup {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entryPrice: string;
  targetPrice: string;
  stopLoss: string;
  patterns: string[];
  indicators: string[];
  analysis: string;
  companyInfo: {
    name: string;
    ticker: string;
    sector: string;
    description: string;
  };
  financials: {
    revenue: string;
    profit: string;
    margin: string;
    trend: 'UP' | 'DOWN' | 'STABLE';
  };
  strategies: TradingStrategy[];
}

export async function analyzeChart(base64Image: string, mimeType: string): Promise<TradingSetup> {
  // Prioritizing gemini-3-flash-preview for maximum speed as requested.
  const models = ["gemini-3-flash-preview", "gemini-2.5-flash-preview", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of models) {
    // Try each model, but reduce retries for speed
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const prompt = `Analyze this stock chart image and provide a detailed technical analysis. 
        Identify the company name and ticker from the chart.
        Use your internal knowledge and Google Search if needed to find company details and financial performance (Profit/Loss).
        
        Provide 3 different trading strategy ideas (e.g., Intraday, Swing, Long-term) based on the chart analysis. For each strategy, include a specific target, stop loss, and expected timing/duration.
        
        Return the analysis in the following JSON format:
        {
          "signal": "BUY" | "SELL" | "HOLD",
          "confidence": number (0-100),
          "entryPrice": "string",
          "targetPrice": "string",
          "stopLoss": "string",
          "patterns": ["string"],
          "indicators": ["string"],
          "analysis": "detailed markdown string explaining the technical reasoning",
          "companyInfo": {
            "name": "string",
            "ticker": "string",
            "sector": "string",
            "description": "brief company overview"
          },
          "financials": {
            "revenue": "latest revenue figure",
            "profit": "latest net profit/loss",
            "margin": "profit margin %",
            "trend": "UP" | "DOWN" | "STABLE"
          },
          "strategies": [
            {
              "name": "Strategy Name",
              "description": "brief logic",
              "target": "target price",
              "stopLoss": "stop loss price",
              "timing": "expected duration"
            }
          ]
        }`;

        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    data: base64Image.split(',')[1],
                    mimeType: mimeType,
                  },
                },
              ],
            },
          ],
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            // Using a simpler schema or relying on prompt can sometimes be faster, 
            // but responseSchema ensures we don't have to retry due to parsing errors.
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                signal: { type: Type.STRING, enum: ["BUY", "SELL", "HOLD"] },
                confidence: { type: Type.NUMBER },
                entryPrice: { type: Type.STRING },
                targetPrice: { type: Type.STRING },
                stopLoss: { type: Type.STRING },
                patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
                indicators: { type: Type.ARRAY, items: { type: Type.STRING } },
                analysis: { type: Type.STRING },
                companyInfo: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    ticker: { type: Type.STRING },
                    sector: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ["name", "ticker", "sector", "description"],
                },
                financials: {
                  type: Type.OBJECT,
                  properties: {
                    revenue: { type: Type.STRING },
                    profit: { type: Type.STRING },
                    margin: { type: Type.STRING },
                    trend: { type: Type.STRING, enum: ["UP", "DOWN", "STABLE"] },
                  },
                  required: ["revenue", "profit", "margin", "trend"],
                },
                strategies: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                      target: { type: Type.STRING },
                      stopLoss: { type: Type.STRING },
                      timing: { type: Type.STRING },
                    },
                    required: ["name", "description", "target", "stopLoss", "timing"],
                  },
                },
              },
              required: ["signal", "confidence", "entryPrice", "targetPrice", "stopLoss", "patterns", "indicators", "analysis", "companyInfo", "financials", "strategies"],
            },
          },
        });

        if (!response.text) {
          throw new Error("Empty response from AI model");
        }

        const result = JSON.parse(response.text);
        return result as TradingSetup;
      } catch (err) {
        console.warn(`Attempt ${attempt} failed with model ${model}:`, err);
        lastError = err;
        
        // Wait before retrying
        const delay = attempt * 1500; 
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Failed to analyze chart after multiple attempts and model fallbacks");
}
