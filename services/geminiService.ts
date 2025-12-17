/**
 * @deprecated Use convex/ai.ts instead. This file is kept for reference only.
 * Import from lib/convex.tsx: import { useAction, api } from '../lib/convex';
 * Then use: const generateTheme = useAction(api.ai.generateTheme);
 */

import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedTheme } from '../types';

/** @deprecated */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTreeTheme = async (prompt: string): Promise<GeneratedTheme> => {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `You are an expert holiday decorator and color theorist. 
  Generate a Christmas tree visual theme based on the user's request. 
  Provide hex colors for the tree and ornaments, a background color, and a snow amount (0 to 1).`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          treeColor: { type: Type.STRING, description: "Hex color code for the pine needles" },
          ornamentColors: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Array of 3-5 hex color codes for ornaments"
          },
          snowAmount: { type: Type.NUMBER, description: "Amount of snow/frost on tree (0.0 to 1.0)" },
          backgroundColor: { type: Type.STRING, description: "Hex color for the scene background" },
          description: { type: Type.STRING, description: "Short description of the theme vibe" }
        },
        required: ["treeColor", "ornamentColors", "snowAmount", "backgroundColor", "description"]
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as GeneratedTheme;
  }
  
  throw new Error("Failed to generate theme");
};
