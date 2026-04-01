import { GoogleGenAI, GenerateContentResponse, Type, ThinkingLevel } from "@google/genai";

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
  // Using Gemini 3.1 models for best performance, stability, and speed.
  const models = ["gemini-3.1-pro-preview", "gemini-3.1-flash-lite-preview"];
  let lastError: any = null;

  for (const model of models) {
    // Try with search tool first, then without it if it fails
    const toolConfigs = [{ googleSearch: {} }, null];

    for (const tools of toolConfigs) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const prompt = `Analyze this stock chart image and provide a detailed technical analysis. 
          Identify the company name and ticker from the chart.
          ${tools ? "Use Google Search to find the latest company details and financial performance (Profit/Loss)." : "Use your internal knowledge to provide company details and financial performance (Profit/Loss)."}
          
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
              tools: tools ? [tools] : undefined,
              responseMimeType: "application/json",
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
          const errStr = JSON.stringify(err);
          console.warn(`Attempt ${attempt} failed with model ${model} (Tools: ${!!tools}):`, errStr);
          lastError = err;
          
          // If it's a 500 error or Rpc error and we were using tools, skip to the no-tools version immediately
          const isRpcError = errStr.includes('500') || errStr.includes('Rpc failed') || (err instanceof Error && (err.message.includes('500') || err.message.includes('Rpc failed')));
          
          if (isRpcError && tools) {
            console.log("RPC/500 error detected with tools, falling back to no-tools analysis.");
            break; 
          }

          // Wait before retrying
          const delay = attempt * 1000; 
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }
  
  throw lastError || new Error("Failed to analyze chart after multiple attempts and model fallbacks");
}
