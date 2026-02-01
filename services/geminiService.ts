import { GoogleGenAI, Type } from "@google/genai";
import { PhotoStyle, ImageSize, PhotoQuality, MenuAnalysisResult } from "../types";

// Helper to get a fresh client instance. 
// This is crucial because the API_KEY might change after the user selects a project via window.aistudio.
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Parses raw menu text into structured dish data using Gemini Flash.
 */
export const parseMenuText = async (text: string): Promise<MenuAnalysisResult> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract a list of dishes from the following menu text. Return a clean JSON object with a list of dishes, each having a 'name' and a short visual 'description' suitable for an image prompt.
      
      Menu Text:
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dishes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["name", "description"],
              },
            },
          },
        },
      },
    });

    const result = response.text ? JSON.parse(response.text) : { dishes: [] };
    return result;
  } catch (error) {
    console.error("Error parsing menu:", error);
    throw new Error("Failed to parse menu text. Please try again.");
  }
};

/**
 * Helper to construct the style prompt
 */
const getStylePrompt = (style: PhotoStyle): string => {
  switch (style) {
    case PhotoStyle.RUSTIC:
      // Updated to Luxury Dark (No Wood)
      return "Style: 5-star Michelin restaurant dining, moody dramatic lighting, luxurious black marble or polished dark stone surface (no wood), elegant gold or silver cutlery, rich textures, chiaroscuro effect, professional food photography, 85mm lens.";
    case PhotoStyle.MODERN:
      return "Style: Modern avant-garde fine dining, bright, airy, high-key lighting, white marble or pristine surface, minimalist artistic plating, sharp focus, clean aesthetic.";
    case PhotoStyle.SOCIAL:
      return "Style: High-end food influencer aesthetic, flat lay (top-down view), vibrant colors, soft ring light, high contrast, organized composition, 4k detail, luxury table setting.";
    default:
      return "Style: Professional food photography, high resolution, luxury restaurant setting.";
  }
};

/**
 * Generates an image for a specific dish using Gemini 3 Pro Image Preview.
 */
export const generateDishImage = async (
  dishName: string,
  dishDescription: string,
  style: PhotoStyle,
  size: ImageSize,
  quality: PhotoQuality,
  logoBase64?: string | null,
  locationBase64?: string | null
): Promise<string> => {
  try {
    const ai = getAi();
    const stylePrompt = getStylePrompt(style);
    
    let fullPrompt = "";

    if (quality === PhotoQuality.PREMIUM) {
      // Enforce Michelin star quality and plating for Premium
      fullPrompt = `Ultra-premium Michelin 5-star quality food photography of ${dishName}, presented elegantly on a high-end designer plate. ${dishDescription}. ${stylePrompt}. Fine dining plating, culinary masterpiece, exquisite details, award-winning restaurant quality, photorealistic, 8k.`;
    } else {
      // Standard professional quality
      fullPrompt = `Professional food photography of ${dishName}, presented on a plate. ${dishDescription}. ${stylePrompt}. High quality, photorealistic, 4k, well-lit, appetizing commercial food photography.`;
    }

    const parts: any[] = [];
    
    // Add reference images if provided
    if (locationBase64) {
      // Clean base64 string
      const cleanLocation = locationBase64.replace(/^data:image\/\w+;base64,/, "");
      parts.push({ inlineData: { mimeType: "image/png", data: cleanLocation } });
      fullPrompt += "\n\n[CONTEXT: LOCATION IMAGE]\nThe provided image shows the restaurant's interior. Generate the food placed on a table within this specific environment. Match the surface material, ambient lighting, and background blur of this location to make it look like the photo was taken there.";
    }

    if (logoBase64) {
      // Clean base64 string
      const cleanLogo = logoBase64.replace(/^data:image\/\w+;base64,/, "");
      parts.push({ inlineData: { mimeType: "image/png", data: cleanLogo } });
      fullPrompt += "\n\n[CONTEXT: LOGO IMAGE]\nThe provided image is the restaurant logo. Integrate this logo subtly into the scene, for example printed on a high-quality napkin, engraved on a wooden salt shaker, or displayed on a small tasteful menu holder near the plate. It must look physically present in the scene, not overlaid digitally.";
    }

    // Add prompt text
    parts.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          imageSize: size, // '1K', '2K', or '4K'
          aspectRatio: style === PhotoStyle.SOCIAL ? "4:3" : "16:9",
        },
      },
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data returned from API.");
  } catch (error) {
    console.error("Error generating image:", error);
    // Explicitly rethrow so UI can catch it
    throw error;
  }
};

/**
 * Edits an existing image using Gemini 2.5 Flash Image (Nano Banana).
 */
export const editDishImage = async (
  currentImageBase64: string,
  editPrompt: string
): Promise<string> => {
  try {
    const ai = getAi();
    // Strip prefix if present for the API call
    const cleanBase64 = currentImageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image", // Nano Banana
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: "image/png", // Assuming PNG, or we could detect from string
            },
          },
          {
            text: `Edit this food image: ${editPrompt}. Maintain high visual quality and photorealism.`,
          },
        ],
      },
      // Note: gemini-2.5-flash-image does NOT support imageSize or strict aspect ratio configs in the same way
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No edited image returned.");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};

/**
 * Analyzes the nutrition of a dish image using Gemini 3 Pro Preview.
 */
export const analyzeDishNutrition = async (imageBase64: string): Promise<string> => {
  try {
    const ai = getAi();
    // Strip prefix if present for the API call
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: "image/png",
            }
          },
          {
            text: "Analyze this image and identify the potential allergens and nutritional values per 100g (Calories, Energy, Protein, Fat, Carbs). Provide the information in a concise, structured text format suitable for a menu.",
          }
        ]
      }
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Error analyzing nutrition:", error);
    throw error;
  }
}