import { GoogleGenAI, Type } from '@google/genai';
import { Difficulty, EvaluationResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function evaluateTranscript(
  difficulty: Difficulty,
  prompt: string,
  transcript: string
): Promise<EvaluationResult> {
  const systemInstruction = `You are evaluating a transcript from a voice dictation game. The dictation engine might have merged words without commas, or split compound words weirdly. Your job is to intelligently parse the raw transcript into distinct logical items based on the prompt category: "${prompt}". Count 'Coca Cola' as one item, 'chocolate milk' as one item. Filter out nonsense, conversational filler ('umm', 'like', 'uh'), and duplicates.

Calculate the Performance Score (out of 100) based strictly on this difficulty-adjusted matrix:
- EASY: <10 valid words: Low (15-40), 10-14: Mid (41-75), 15-22: High (76-95), 23+: Superior (96-100)
- MEDIUM: <7 valid words: Low (15-40), 7-11: Mid (41-75), 12-17: High (76-95), 18+: Superior (96-100)
- HARD: <5 valid words: Low (15-40), 5-8: Mid (41-75), 9-14: High (76-95), 15+: Superior (96-100)

Provide encouraging feedback for adults aged 40-50. Avoid clinical or psychological jargon. Keep it fun and engaging.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Difficulty: ${difficulty}\nPrompt: ${prompt}\nTranscript: ${transcript}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rawScore: {
              type: Type.NUMBER,
              description: 'The intelligent count of valid, distinct items provided by the user.',
            },
            performanceScore: {
              type: Type.NUMBER,
              description: 'The calculated score out of 100 based on the difficulty matrix.',
            },
            whatTheyDidWell: {
              type: Type.STRING,
              description: 'Encouraging feedback on what they did well.',
            },
            roomForImprovement: {
              type: Type.STRING,
              description: 'Constructive, fun feedback on how to improve.',
            },
          },
          required: ['rawScore', 'performanceScore', 'whatTheyDidWell', 'roomForImprovement'],
        },
      },
    });

    if (!response.text) {
      throw new Error('No response from AI');
    }

    return JSON.parse(response.text) as EvaluationResult;
  } catch (error) {
    console.error('Error evaluating transcript:', error);
    // Fallback in case of API failure
    return {
      rawScore: 0,
      performanceScore: 0,
      whatTheyDidWell: "We had trouble connecting to the evaluation server.",
      roomForImprovement: "Please try again!",
    };
  }
}
