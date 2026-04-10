import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeMarket(ticks: number[], symbol: string) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      sentiment: "Neutral",
      score: 50,
      reasoning: "AI analysis unavailable (API key missing)."
    };
  }

  const prompt = `
    You are a professional quantitative trader and market analyst.
    Analyze the following recent price ticks (last 50 data points) for the asset ${symbol}:
    ${ticks.join(", ")}

    Based on this price action, provide a high-fidelity market sentiment analysis.
    
    Return ONLY a JSON object in this exact format:
    {
      "sentiment": "Bullish" | "Bearish" | "Neutral",
      "score": number (0-100, where 100 is extremely bullish),
      "reasoning": "A concise, professional technical explanation (max 150 characters) focusing on momentum, support/resistance, or volatility."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return {
      sentiment: "Neutral",
      score: 50,
      reasoning: "Failed to analyze market data."
    };
  }
}
