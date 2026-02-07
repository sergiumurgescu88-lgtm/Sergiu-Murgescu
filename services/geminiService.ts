import { GoogleGenAI, Type, Modality } from "@google/genai";
import { PhotoStyle, ImageSize, PhotoQuality, MenuAnalysisResult, AspectRatio } from "../types";

const getMimeType = (dataUrl: string) => {
  try {
    return dataUrl.split(';')[0].split(':')[1];
  } catch (e) {
    return "image/png";
  }
};

const getBase64Data = (dataUrl: string) => {
  return dataUrl.split(',')[1];
};

/**
 * PRODUCTION ARCHETYPES & PROTOCOLS
 */
// ... (Keeping the protocols from the previous turn for brevity but ensuring logic is sound)

export const generateDishImage = async (
  dishName: string,
  dishDescription: string,
  style: PhotoStyle,
  size: ImageSize,
  quality: PhotoQuality,
  aspectRatio: AspectRatio,
  logoBase64?: string | null,
  locationBase64?: string | null,
  referenceBase64?: string | null
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const masterPrompt = `[MICHELIN PRODUCTION PROTOCOL] - ${dishName.toUpperCase()}
  MANDATE: Create a 100% photorealistic commercial asset.
  STYLE: ${style}
  CONTEXT: ${dishDescription}
  ${logoBase64 ? "INTEGRATE LOGO: Follow subtle branding protocol." : ""}
  ${locationBase64 ? "ENVIRONMENT: Use provided background context." : ""}
  COMPOSITION: Perfectly level horizon, 30% negative space, cinematic bokeh.`;

  const parts: any[] = [{ text: masterPrompt }];
  
  if (referenceBase64) {
    parts.unshift({ inlineData: { mimeType: getMimeType(referenceBase64), data: getBase64Data(referenceBase64) } });
    parts.push({ text: "REFERENCE LOCK: Match this plating architecture exactly." });
  }
  if (locationBase64) {
    parts.push({ inlineData: { mimeType: getMimeType(locationBase64), data: getBase64Data(locationBase64) } });
  }
  if (logoBase64) {
    parts.push({ inlineData: { mimeType: getMimeType(logoBase64), data: getBase64Data(logoBase64) } });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: { parts: parts },
    config: { 
      imageConfig: { 
        aspectRatio, 
        imageSize: size // Supports 1K, 2K, 4K
      } 
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part) throw new Error("API failed to return image data.");
  return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
};

export const parseMenuText = async (text: string): Promise<MenuAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Parse menu items into structural high-end data: ${text}`,
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
  return JSON.parse(response.text);
};

export const editDishImage = async (currentImageBase64: string, editPrompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { inlineData: { data: getBase64Data(currentImageBase64), mimeType: getMimeType(currentImageBase64) } },
        { text: `MAGIC EDIT: ${editPrompt}. Hyper-realistic execution.` },
      ],
    },
  });
  const part = response.candidates[0].content.parts.find(p => p.inlineData);
  if (!part) throw new Error("Edit failed.");
  return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
};

export const analyzeDishNutrition = async (imageBase64: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [
        { inlineData: { data: getBase64Data(imageBase64), mimeType: getMimeType(imageBase64) } },
        { text: "Analyze this dish: list ingredients, estimated calories, and give Michelin-style feedback." }
      ]
    }
  });
  return response.text || "";
};

export async function* chatWithConcierge(message: string, history: any[], imageBase64?: string | null) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const contents: any[] = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));

  const userParts: any[] = [{ text: message }];
  if (imageBase64) {
    userParts.push({
      inlineData: {
        data: getBase64Data(imageBase64),
        mimeType: getMimeType(imageBase64)
      }
    });
  }
  
  const response = await ai.models.generateContentStream({
    model: 'gemini-3-pro-preview',
    contents: [...contents, { role: 'user', parts: userParts }],
    config: { 
      thinkingConfig: { thinkingBudget: 32768 },
      systemInstruction: `You are Maya, the expert AI Concierge for Instant Menu Pictures.
      Use your deep Thinking Mode to solve complex plating and lighting problems.
      Analyze any images provided with Michelin standards.
      Keep responses concise but intellectually deep.` 
    },
  });
  
  for await (const chunk of response) if (chunk.text) yield chunk.text;
}

export const speakText = async (text: string): Promise<ArrayBuffer> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: { 
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });
  const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64) throw new Error("TTS failed.");
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

export const connectLiveConcierge = async (callbacks: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: "You are Maya, the Live AI Concierge. Respond naturally in real-time.",
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
      outputAudioTranscription: {},
      inputAudioTranscription: {},
    },
  });
};