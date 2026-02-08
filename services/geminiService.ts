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
 * PRODUCTION PROTOCOLS: PREP TEAM & DETECTION SQUAD
 * Hyper-refined prompts for 100% photorealistic, non-artificial execution.
 */
export const PREP_TEAM_PROMPT = `[PROTOCOL 3: PREP TEAM - HYPER-REALISTIC MINIATURE KITCHEN]
MANDATE: Add 3-5 hyper-realistic miniature humans (scale 1:12-1:20) actively preparing the dish. 
ABSOLUTE REQUIREMENT: Characters MUST look like 100% REAL HUMANS with photorealistic skin and unique facial features. NO PLASTIC, NO CGI, and NO TOY-LIKE appearance.
CHARACTER DETAILS:
- 3-5 unique individuals with distinct ethnicities, facial hair, and ages (25-55). 
- FACE REALISM: Visible pores, natural skin tone variations, subtle veins, laugh lines, and genuine human imperfections. Eyes must have realistic iris detail and sharp catchlights.
- EXPRESSIONS: Deep concentration, collaborative focus, and natural eye contact between team members as they work.
DYNAMIC ACTIONS & TOOLS: 
- 1 Chef wiping hands on a linen apron mid-task (visible fabric texture).
- 1 Sous Chef whisking with visible wrist rotation in a scaled stainless steel bowl (1:15 scale).
- 1 Prep Cook mid-chopping motion (knife blade mid-cut) on a scaled wooden grain board.
- 1 Assistant sprinkling micro-spices with visible particles caught in the air.
- 1 Member carrying a heavy ingredient (e.g., a giant peppercorn or garlic clove) with visible physical strain in posture and muscles.
- 1 Person tasting sauce with a tiny scaled metal spoon near their mouth.
INTEGRATION: Characters physically interact with ingredients (standing on bread/vegetables, leaning against bowls).
ATMOSPHERE: Warm collaborative kitchen energy (3200-4500K). Soft natural lighting with subsurface scattering on skin.
TOOLS: Hyper-detailed miniature metal and wood tools (1:12-1:20 scale) with reflections, scratches, and authentic wear.`;

export const DETECTION_SQUAD_PROMPT = `[PROTOCOL 4: DETECTION SQUAD - FORENSIC FOOD INVESTIGATION]
MANDATE: Add 3-5 hyper-realistic miniature detectives investigating the dish as a crime scene evidence.
ABSOLUTE REQUIREMENT: Characters MUST be real humans with unique faces and natural skin textures. NOT PLASTIC, NOT ARTIFICIAL.
CHARACTER DETAILS:
- 1-2 Lead Detectives in trench coats with visible fabric grain, 2-3 Forensic Specialists in clinical lab gear and gloves.
- FACE REALISM: Intense scrutiny, furrowed brows, analytical expressions. Skin shows high-detail pores and natural moisture/sweat highlights under harsh investigative lights.
- DYNAMIC ACTIONS & FORENSIC TOOLS: 
- Lead detective examining a garnish through a scaled magnifying glass (MUST show realistic optical refraction and distortion through the lens).
- Specialist using precision metal tweezers to carefully lift a micro-ingredient into a glass specimen vial.
- Assistant placing yellow numbered evidence tents (1-5) strategically around the dish ingredients.
- Team member pointing at a "clue" while explaining findings to an observer with active gestures.
ATMOSPHERE: Dramatic noir/investigative mood. Cool/neutral tones (4500-5500K). Hard directional lighting with deep cinematic shadows.
ENVIRONMENT: Volumetric flashlight beams cutting through the air with visible micro-dust particles catching the light.
TECHNICAL: 100% photorealistic execution, consistent miniature scale (1:15), anatomically correct human proportions.`;

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
        imageSize: size 
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