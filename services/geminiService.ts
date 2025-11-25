import { GoogleGenAI } from "@google/genai";
import { EditRequest } from "../types";

// Initialize the client
// The API key is guaranteed to be available in process.env.API_KEY per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const editImageTimestamp = async (request: EditRequest): Promise<string> => {
  const { imageBase64, newDate, newTime } = request;

  // Clean base64 string if it contains metadata header
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  const prompt = `
    Strictly follow these instructions to edit the attached image:
    1. Identify the existing date and time stamp text overlay in the image.
    2. Remove the old date and time text completely using high-quality inpainting.
    3. Restore the background behind the text to match the surrounding texture and lighting perfectly (100% seamless).
    4. Insert the NEW date: "${newDate}" and NEW time: "${newTime}" in the exact same position.
    5. CRITICAL: The new text must match the original font style (Timemark style), color, thickness, size, and shadow exactly.
    6. Do NOT add any watermarks, AI artifacts, or extra symbols.
    7. Do NOT alter any other part of the image outside the timestamp area.
    8. Return the full edited image.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Optimized for image editing/generation tasks
      contents: {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: 'image/png', // Assuming PNG for high quality, API handles conversions usually
              data: cleanBase64,
            },
          },
        ],
      },
    });

    // Extract the image from the response
    // The model typically returns text or an image part. We need to find the image part.
    const parts = response.candidates?.[0]?.content?.parts;
    
    if (!parts) {
      throw new Error("No content generated");
    }

    let resultImageBase64 = '';

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        resultImageBase64 = part.inlineData.data;
        break; // Found the image
      }
    }

    if (!resultImageBase64) {
      // Sometimes the model might refuse or return text if it failed to generate an image
      throw new Error("The model did not return an image. It might have refused the request.");
    }

    return `data:image/png;base64,${resultImageBase64}`;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};