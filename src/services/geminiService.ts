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
    Analyze the following recent price ticks for ${symbol}:
    ${ticks.join(", ")}

    Provide a market sentiment analysis in JSON format:
    {
      "sentiment": "Bullish" | "Bearish" | "Neutral",
      "score": number (0-100, where 100 is extremely bullish),
      "reasoning": "A brief explanation of the trend"
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
