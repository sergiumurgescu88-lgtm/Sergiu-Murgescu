
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
 * 20 FOOD PHOTOGRAPHY PROTOCOLS - MICHELIN STYLE (100% PHOTOREALISTIC)
 */
const CULINARY_PROTOCOLS: Record<string, { instructions: string; angle: string; checklist: string[] }> = {
  PIZZA: {
    angle: "90° (overhead/flat lay)",
    instructions: "Create a perfect overhead photograph. Show uniform distribution of ingredients. The crust edge must look crispy with authentic char marks in natural spots (not perfect circles). Cheese should appear melted with golden-brown bubbles. Pull one slice slightly to show natural cheese stretch - the stretch must look real, not exaggerated. Natural soft lighting from side-left. Background: dark rustic wood or black marble. Sprinkle fresh basil or arugula after baking. Add a subtle gleam of olive oil that catches the light naturally.",
    checklist: ["Perfect 90° perpendicular angle", "Cheese stretch looks physically real", "Authentic char marks (irregular, natural)", "Ingredients distributed realistically", "Natural soft lighting", "NO steam effects", "NO impossible melting"]
  },
  BURGER: {
    angle: "45° (3/4 view)",
    instructions: "Position camera to show both the top of the bun AND the visible side layers. Meat should look juicy with visible juice - but realistic, not dripping excessively. Melted cheese must naturally drape over edges - gravity-appropriate, not defying physics. Bun should look fresh, fluffy, with a natural sheen. Natural lighting from left-back to create realistic glow. Background: natural wood or black stone surface. Add crispy fries in background (naturally out of focus from depth of field).",
    checklist: ["45° angle perfectly calibrated", "All layers visible from side", "Cheese drip natural and gravity-correct", "Bun looks real with natural shine", "Meat juice visible but not excessive", "NO steam rising", "Sesame seeds randomly distributed"]
  },
  STEAK: {
    angle: "45°",
    instructions: "Show a caramelized crust with visible cross-hatch grill marks. If cut, show interior doneness color authentically (pink for medium-rare, etc.). Meat juices should glisten on surface naturally - real light reflection. Place steak on a modern white plate or wooden board. Add a realistic pat of melting butter on top - melting must follow real physics. Minimal garnish: fresh thyme, fleur de sel, peppercorns. Lighting from side-right to highlight texture.",
    checklist: ["Grill marks perfectly realistic", "Interior color looks authentic", "Juiciness through real light reflection", "Seared crust texture", "Butter melts according to physics", "NO steam effects"]
  },
  PASTA: {
    angle: "90° or 45°",
    instructions: "[90° for flat pasta or 45° for volumetric]. 90°: pasta twisted in center forming a natural 'nest'. 45°: show depth of bowl and sauce. Sauce should coat pasta uniformly but not drown it. Add main ingredients distributed aesthetically but naturally. Sprinkle fresh grated parmesan (not powder), basil or parsley. Add a realistic drizzle of olive oil. Background: rustic Italian wooden table.",
    checklist: ["Pasta twisted naturally", "Sauce uniformly distributed", "Fresh grated parmesan looks real", "Oil catches light realistically", "Natural shadows and reflections", "NO steam effects"]
  },
  SALAD: {
    angle: "45° or 90°",
    instructions: "Green leaves must look ultra-fresh, crisp, with fine water droplets (realistic dewyness). Show ingredient variety clearly. Dressing: either artistically drizzled or in a small bowl alongside. Vibrant colors: intense green, bright red, orange, white. Modern or rustic ceramic bowl. Natural bright lighting from side to make greens glisten.",
    checklist: ["Leaves ultra-fresh and crisp", "Fine water droplets (natural)", "All ingredients visible", "Vibrant but realistic colors", "Bright airy lighting", "NO steam", "Droplets look real"]
  },
  SOUPS: {
    angle: "90° or 45°",
    instructions: "Elegant or rustic ceramic bowl, leave 2cm to rim. Cream soups: velvety texture, natural swirl of cream or seeds. Clear soups: ingredients floating naturally. Stews: dense consistency. DO NOT add steam - show heat through surface reflection and lighting. Garnish on top: fresh herbs, croutons, parmesan. Props: silver spoon, linen napkin.",
    checklist: ["Bowl never too full", "Visible texture (smooth/chunky)", "ABSOLUTELY NO steam effects", "Fresh garnish looks real", "Lighting shows realistic liquid surface", "Ingredients float naturally"]
  },
  DESSERT_SLICE: {
    angle: "45°",
    instructions: "Artistically placed on white plate. Show interior texture: layers of cake, cream, filling. Cut must be precise, clean-edged. Artistic sauce decoration (chocolate, coulis) following real physics. Garnish: fresh fruit, mint, chocolate shavings. Soft lighting from side-front to highlight cream textures and glaze shine.",
    checklist: ["Interior layers visible", "Precise clean cut edge", "Artistic plating follows physics", "Fresh colorful garnish", "Michelin style precision", "NO steam effects", "Frosting looks real"]
  },
  WHOLE_CAKE: {
    angle: "0° (eye level)",
    instructions: "Dramatically show height. Remove one slice to show all internal layers. Glaze or frosting perfectly applied. Natural drip of ganache or caramel following gravity realistically. Elegant cake stand. Cut slice placed in front. Soft lighting from side-back to create natural glow.",
    checklist: ["0° angle for height", "All layers visible and realistic", "Perfect frosting application", "Natural gravity-correct drip", "Cake texture looks moist", "NO steam effects"]
  },
  BEVERAGES: {
    angle: "0° or 45°",
    instructions: "Cold drinks: realistic condensation (fine droplets), crystal-clear ice. Cocktails: color layers, elaborate garnish. Coffee: crema, latte art. Glass clean, no fingerprints. Backlighting to make beverage glow and appear translucent. Modern bar background.",
    checklist: ["Realistic condensation (cold)", "Crystal clear real ice cubes", "Fresh vibrant garnish", "Backlighting for translucency", "ABSOLUTELY NO steam effects", "Perfectly clean glass"]
  },
  BREAKFAST: {
    angle: "45° or 0°",
    instructions: "Eggs: 45°, liquid yolk flowing realistically. Pancakes: 0° stack height, syrup dripping naturally, butter pat melting via physics. Bowls: 90° overhead, toppings arranged geometrically but naturally. Bright, airy, morning light quality.",
    checklist: ["Correct angle per type", "Liquid yolk visible and realistic", "Syrup drip gravity-correct", "Butter melts according to physics", "Morning light - bright and cheerful", "NO steam effects"]
  },
  SANDWICHES: {
    angle: "45°",
    instructions: "Cut diagonally to show interior layers. Bread: crispy exterior (if toasted), fluffy interior. Ingredients fresh and abundant. Sauce visible but controlled. Placed on sandwich paper or rustic plate. Natural lighting from side to highlight bread texture.",
    checklist: ["Cut to show interior clearly", "All layers visible and distinct", "Textured bread looks real", "Controlled sauce", "Casual but premium vibe", "NO steam effects", "Ingredients naturally compressed"]
  },
  ASIAN: {
    angle: "Type-specific",
    instructions: "Sushi: 90° overhead - artistic arrangement, vibrant colors, wasabi and ginger. Ramen: 45° - bowl depth, noodles, chashu, soft egg. Broth sheen focus. Cultural authenticity mandatory. Traditional props (chopsticks).",
    checklist: ["Cultural authenticity", "Vibrant natural colors", "Traditional props", "ABSOLUTELY NO steam effects", "Rice grains look individual", "Fresh visible ingredients"]
  },
  MEXICAN: {
    angle: "45°",
    instructions: "Tacos: 2-3 tacos, filling abundant, tortilla naturally folded. Burritos: cut diagonally, interior layers visible. Quesadillas: triangles, melted cheese visible. Rustic plate. Vibrant, colorful lighting. Festive vibe.",
    checklist: ["Interior visible (cut/filling)", "Vibrant colors (green, red, yellow)", "Melted cheese looks real", "Festive vibe", "NO steam effects", "Cheese stretches realistically"]
  },
  APPETIZERS: {
    angle: "90° (overhead)",
    instructions: "Aesthetic and varied arrangement. Diverse vibrant colors. Charcuterie boards: artistic folds, whole/cut cheeses, fruits, nuts, jam bowls. Everything visually accessible. Uniform soft lighting. Wooden board or slate background.",
    checklist: ["Perfect 90° overhead angle", "Visual and color variety", "Artistic accessible arrangement", "Party-ready appearance", "NO steam effects", "Natural spacing"]
  },
  SEAFOOD: {
    angle: "45°",
    instructions: "Fish: crispy golden skin, white delicate flaky texture. Shrimp: pink-orange and glistening. Shellfish: open and fresh. Garnish: lemon, parsley, butter. Clean lighting making seafood glisten naturally. Freshness is key.",
    checklist: ["Fish: crispy skin, flaky texture", "Glistening shellfish", "Fresh visible lemon", "NO steam effects", "Fish skin has realistic texture", "Lighting highlights natural sheen"]
  },
  PREMIUM_PASTA: {
    angle: "45° or 90°",
    instructions: "High-end presentation. Risotto: 90° or 45°, creamy 'all'onda' texture, truffles or saffron highlighted. Carbonara: 90° nest, fresh grated parmesan. Elegant white plate. Finishing: olive oil drizzle, ground pepper.",
    checklist: ["Perfect texture (risotto/sauce)", "Premium ingredients highlighted", "Artistic refined plating", "Michelin fine dining style", "NO steam effects", "Rice grains visible in risotto"]
  },
  GRILL_BBQ: {
    angle: "45°",
    instructions: "Visible char marks, glistening BBQ glaze, exterior caramelization. Meat looks succulent. Casual but appetizing on wooden cutting board. Warm rustic lighting highlighting glaze and char naturally. Vibe: summer BBQ.",
    checklist: ["Visible appetizing char marks", "Glistening glaze (sauce)", "ABSOLUTELY NO smoke effects", "Succulent meat", "Warm rustic lighting", "Char marks look real"]
  },
  VEGETARIAN: {
    angle: "45° or 90°",
    instructions: "Emphasis on color and freshness. Diverse textures (spinach, avocado, pumpkin). Bowls (90°) with grains and nuts arranged geometrically but naturally. Artisanal ceramic. Bright natural lighting. Wholesome vibe.",
    checklist: ["Vibrant diverse colors", "Evident freshness in ingredients", "Varied textures (crispy/creamy)", "Artistic colorful plating", "Bright natural lighting", "NO steam effects"]
  },
  PREMIUM_BRUNCH: {
    angle: "45°",
    instructions: "Eggs Benedict: hollandaise naturally flowing over poached egg, yolk about to run. Avocado Toast: artisan bread, perfectly mashed avocado. French Toast: stack with syrup drip. Soft morning light.",
    checklist: ["Liquid yolk visible and realistic", "Hollandaise/syrup dripping naturally", "Toast: crispy and golden", "Bright morning light", "Instagram-worthy plating", "NO steam effects"]
  },
  SPECIAL_DESSERTS: {
    angle: "Varies",
    instructions: "Ice Cream: 45°, creamy texture, slight melting for realism. Profiteroles: 45°, glossy chocolate glaze, golden puff pastry. Crème Brûlée: 90°/45°, perfectly cracked caramelized sugar crust with spoon. Decadent appearance.",
    checklist: ["Highlighted texture (creamy/crispy)", "Glossy glazes look real", "Elegant refined plating", "Appetite-inducing lighting", "Melting follows real physics", "NO steam effects"]
  }
};

/**
 * ARCHETYPE MAPPING LOGIC
 */
interface DishArchetype {
  category: string;
  protocolKey: string;
  lockedElements: string[];
  vessel: string;
  bestAngle: string;
  similarityThreshold: string;
}

const getDishArchetype = (text: string): DishArchetype => {
  const lower = text.toLowerCase();
  
  if (lower.includes('pizza')) return { category: 'PIZZA', protocolKey: 'PIZZA', lockedElements: ['Crust char pattern lock', 'Cheese blister distribution', 'Topping coordinates'], vessel: 'Modern 360mm white ceramic pizza plate', bestAngle: '90° Overhead', similarityThreshold: '98-100%' };
  if (lower.includes('burger')) return { category: 'BURGER', protocolKey: 'BURGER', lockedElements: ['Layer architecture lock', 'Cheese drape viscosity', 'Meat surface sheen'], vessel: 'Modern matte black ceramic (280mm)', bestAngle: '45° Hero', similarityThreshold: '97-100%' };
  if (lower.includes('steak') || lower.includes('beef')) return { category: 'STEAK', protocolKey: 'STEAK', lockedElements: ['Sear mark geometry', 'Medium-rare internal color lock', 'Jus pooling viscosity'], vessel: 'Large white bone-china', bestAngle: '45° Diner View', similarityThreshold: '98-100%' };
  if (lower.includes('pasta')) {
    if (lower.includes('risotto') || lower.includes('truffle') || lower.includes('lobster')) return { category: 'PREMIUM_PASTA', protocolKey: 'PREMIUM_PASTA', lockedElements: ['All’onda texture lock', 'Garnish micro-placement', 'Gloss level 8/10'], vessel: 'Wide-rimmed white porcelain bowl', bestAngle: '45° Angle', similarityThreshold: '97-99%' };
    return { category: 'PASTA', protocolKey: 'PASTA', lockedElements: ['Nest architecture strands', 'Sauce emulsion lock', 'Ingredient visibility'], vessel: 'Minimalist white bowl', bestAngle: '45° Angle', similarityThreshold: '96-98%' };
  }
  if (lower.includes('salad')) return { category: 'SALAD', protocolKey: 'SALAD', lockedElements: ['Leaf crispness definition', 'Dressing drip coordinates', 'Ingredient distribution'], vessel: 'Modern stoneware bowl', bestAngle: '45° Angle', similarityThreshold: '97-99%' };
  if (lower.includes('soup') || lower.includes('stew') || lower.includes('cream of')) return { category: 'SOUPS', protocolKey: 'SOUPS', lockedElements: ['Liquid surface tension', 'Ingredient float buoyancy', 'Swirl geometry'], vessel: 'Designer ceramic bowl', bestAngle: '90° Overhead', similarityThreshold: '96-98%' };
  if (lower.includes('cake') || lower.includes('pastry') || lower.includes('dessert')) {
    if (lower.includes('slice') || lower.includes('piece')) return { category: 'DESSERT_SLICE', protocolKey: 'DESSERT_SLICE', lockedElements: ['Layer definition', 'Precision cut edges', 'Drip gravity'], vessel: 'Modern white plate', bestAngle: '45° Angle', similarityThreshold: '98-100%' };
    if (lower.includes('ice cream') || lower.includes('sorbet')) return { category: 'SPECIAL_DESSERTS', protocolKey: 'SPECIAL_DESSERTS', lockedElements: ['Melt geometry', 'Scoop texture definition', 'Topping coordinates'], vessel: 'Modern dessert glass', bestAngle: '45° Angle', similarityThreshold: '97-99%' };
    return { category: 'WHOLE_CAKE', protocolKey: 'WHOLE_CAKE', lockedElements: ['Volumetric cake height', 'Frosting smoothness lock', 'Decoration geometry'], vessel: 'Minimalist cake stand', bestAngle: '0° Eye Level', similarityThreshold: '98-100%' };
  }
  if (lower.includes('cocktail') || lower.includes('drink') || lower.includes('juice') || lower.includes('coffee')) return { category: 'BEVERAGE', protocolKey: 'BEVERAGES', lockedElements: ['Liquid refraction', 'Condensation micro-droplet pattern', 'Ice clarity index'], vessel: 'Ultra-clear crystal glass', bestAngle: '0° Eye Level', similarityThreshold: '99-100%' };
  if (lower.includes('breakfast') || lower.includes('pancake') || lower.includes('benedict') || lower.includes('brunch')) {
    if (lower.includes('brunch') || lower.includes('benedict')) return { category: 'BRUNCH', protocolKey: 'PREMIUM_BRUNCH', lockedElements: ['Hollandaise viscosity', 'Yolk run physics', 'Muffin texture definition'], vessel: 'Elegant ceramic plate', bestAngle: '45° Angle', similarityThreshold: '97-99%' };
    return { category: 'BREAKFAST', protocolKey: 'BREAKFAST', lockedElements: ['Egg yolk lock', 'Syrup drip gravity', 'Morning light temperature'], vessel: 'Modern ceramic plate', bestAngle: '45° Angle', similarityThreshold: '97-100%' };
  }
  if (lower.includes('sandwich') || lower.includes('wrap') || lower.includes('panini')) return { category: 'SANDWICH', protocolKey: 'SANDWICHES', lockedElements: ['Interior layer definition', 'Bread texture crunch', 'Component compression'], vessel: 'Modern causal plate', bestAngle: '45° Angle', similarityThreshold: '96-99%' };
  if (lower.includes('sushi') || lower.includes('ramen') || lower.includes('noodle') || lower.includes('asian')) return { category: 'ASIAN', protocolKey: 'ASIAN', lockedElements: ['Rice grain separation', 'Broth gloss lock', 'Cultural plating symmetry'], vessel: 'Slate or black ceramic', bestAngle: '90° or 45°', similarityThreshold: '98-100%' };
  if (lower.includes('taco') || lower.includes('mexican') || lower.includes('burrito')) return { category: 'MEXICAN', protocolKey: 'MEXICAN', lockedElements: ['Filling abundance lock', 'Cheese stretch realism', 'Cilantro micro-coordinates'], vessel: 'Rustic modern plate', bestAngle: '45° Angle', similarityThreshold: '97-100%' };
  if (lower.includes('appetizer') || lower.includes('platter') || lower.includes('board') || lower.includes('finger food')) return { category: 'APPETIZER', protocolKey: 'APPETIZERS', lockedElements: ['Geometric distribution', 'Item variety count', 'Board material texture'], vessel: 'Polished wooden board or slate', bestAngle: '90° Overhead', similarityThreshold: '96-98%' };
  if (lower.includes('fish') || lower.includes('shrimp') || lower.includes('lobster') || lower.includes('seafood')) return { category: 'SEAFOOD', protocolKey: 'SEAFOOD', lockedElements: ['Skin sear texture', 'Segment flake definition', 'Lemon wedge coordinates'], vessel: 'Modern white ceramic', bestAngle: '45° Angle', similarityThreshold: '97-99%' };
  if (lower.includes('bbq') || lower.includes('grill') || lower.includes('ribs') || lower.includes('wings')) return { category: 'GRILL', protocolKey: 'GRILL_BBQ', lockedElements: ['Char mark irregularity', 'Glaze specular highlight', 'Caramelization depth'], vessel: 'Rustic modern wooden board', bestAngle: '45° Angle', similarityThreshold: '98-100%' };
  if (lower.includes('vegan') || lower.includes('vegetarian')) return { category: 'VEGETARIAN', protocolKey: 'VEGETARIAN', lockedElements: ['Chromatic vibrancy lock', 'Texture contrast mapping', 'Ingredient integrity'], vessel: 'Artisanal modern ceramic', bestAngle: '45° or 90°', similarityThreshold: '98-100%' };

  return { category: 'GENERAL', protocolKey: 'GENERAL', lockedElements: ['Michelin plating standards', 'Ingredient freshness lock', 'Volumetric ratio accuracy'], vessel: 'Pristine white ceramic', bestAngle: '45° Standard', similarityThreshold: '96-98%' };
};

/**
 * PHASE 2: CINEMATIC 3-POINT LIGHTING & EQUIPMENT
 */
interface AestheticProfile {
  level: number;
  camera: string;
  lens: string;
  lighting: { key: string; fill: string; back: string };
  surface: string;
  colorScience: string;
}

const getAestheticProfile = (style: PhotoStyle): AestheticProfile => {
  const isUltra = style.includes('Ultra') || style.includes('Michelin') || style.includes('Fine Dining');
  return {
    level: isUltra ? 20 : 15,
    camera: isUltra ? 'Phase One XF IQ4 150MP (€45K+)' : 'Sony FX3 Cinema Line',
    lens: isUltra ? 'Schneider Kreuznach 120mm LS f/4.0 Macro Blue Ring' : 'Sony FE 50mm f/1.2 GM Prime',
    lighting: {
      key: 'ARRI SkyPanel S60-C (45° Horiz, 35° Vert, 1.8m), 5600K, Full Grid Cloth.',
      fill: 'Aputure LS 600d Pro (60° opposite key), 90cm Octabox, 25% power.',
      back: 'Aputure LS 120d II Fresnel (150° behind), focused on rim, 65% power.'
    },
    surface: 'Modern polished marble, polished concrete, or satin light oak. NO RUSTIC WOOD.',
    colorScience: '16-bit RAW Neutral Conversion. Delta E < 1.0 accuracy.'
  };
};

/**
 * PROTOCOL 1: ADD LOGO (Natural Brand Integration)
 */
const BRANDING_PROTOCOL = `
[PROTOCOL: ADD LOGO]
Integrate user-uploaded logo into the food scene in a natural, subtle, and brand-appropriate manner.
PLACEMENT LOGIC:
1. Napkin/Serviette (Default): Corner fold or center, embossed/subtle print, 85-95% opacity, fabric micro-texture match.
2. Coaster/Placemat: Engraved or printed texture matching material (wood, cork, fabric).
3. Menu/Table Card: Small standing card in background, elegant printed finish, shallow focus.
4. Plate Rim: Subtle ceramic print or gold emboss, only if minimalist.
RULES: Never cover food. Size: 2-5% of total image area. Blending: Multiply/Soft Light. Shadows: 2-3px, 20% opacity matching scene light.
`;

/**
 * PROTOCOL 2: ADD LOC (Location/Background)
 */
const ENVIRONMENT_PROTOCOL = `
[PROTOCOL: ADD LOC]
Integrate user-provided location backgrounds naturally using Step-by-Step Scene Construction.
1. Table Sync: 
   - Beach -> light wooden/wicker.
   - Garden -> rustic wooden/wrought iron.
   - Rooftop -> modern metal/composite.
   - Restaurant -> match existing decor.
2. Placement: Foreground dish positioned 25-40% from bottom, scale proportional to perspective (25-30cm plate equivalent).
3. Lighting: Analyze background light source. Cast shadows (30-50% opacity) and highlights (matching direction).
4. Environmental Harmony: Apply 10-20% depth-of-field blur to background. Match color temperature (Warm 2700K to Cool 7500K).
`;

/**
 * MASTER PROMPT CONSTRUCTOR (ENFORCING PROTOCOLS)
 */
const constructMasterPrompt = (
  dishName: string,
  dishDescription: string,
  style: PhotoStyle,
  archetype: DishArchetype,
  profile: AestheticProfile,
  hasLogo: boolean,
  hasLocation: boolean
): string => {
  const protocol = CULINARY_PROTOCOLS[archetype.protocolKey] || { instructions: "Follow high-end Michelin culinary photography standards.", angle: archetype.bestAngle, checklist: ["Authentic textures", "Natural shadows"] };
  const locks = archetype.lockedElements.map((l, i) => `${i + 1}. ${l}`).join('\n');
  const checklist = protocol.checklist.map(c => `✅ ${c}`).join('\n');

  return `
[MICHELIN PRODUCTION PROTOCOL LEVEL ${profile.level}] - ${dishName.toUpperCase()}
MANDATE: Create a 100% photorealistic commercial production asset. €30,000+ Production Value.

1. CATEGORY PROTOCOL: ${archetype.protocolKey}
   - RECOMMENDED ANGLE: ${protocol.angle}
   - SPECIFIC INSTRUCTIONS: ${protocol.instructions}
   - DESCRIPTION CONTEXT: ${dishDescription}

2. SIMILARITY MANDATE (${archetype.similarityThreshold} FIDELITY):
   - You MUST lock the structural architecture. No deviations from description.
   - STRUCTURAL LOCKS:
${locks}

3. CRITICAL REALISM RULES (ZERO-STEAM POLICY):
   - ❌ NO steam effects. ❌ NO artificial blur. ❌ NO impossible physics. ❌ NO perfect symmetry.
   - ❌ NO oversaturated colors. ❌ NO artificial glow. ❌ NO painted-on details.
   - ❌ ABSOLUTELY ZERO STEAM, SMOKE, OR VAPOR.

4. REALITY CHECKLIST:
${checklist}
   - Natural imperfections (crumbs, slight asymmetry).
   - Real physics for liquid flow, gravity, and melting.
   - Authentic textures (Maillard crust, glistening oils).

${hasLogo ? BRANDING_PROTOCOL : ""}
${hasLocation ? ENVIRONMENT_PROTOCOL : ""}

5. EQUIPMENT & LIGHTING:
   - CAMERA: ${profile.camera}
   - LENS: ${profile.lens}
   - LIGHTING: 3-Point System. KEY: ${profile.lighting.key} | FILL: ${profile.lighting.fill} | BACK: ${profile.lighting.back}
   - SURFACE: ${profile.surface}
   - VESSEL: ${archetype.vessel}. (Modern, pristine).

6. COMPOSITION:
   - Perfectly level horizon (0° tilt).
   - 30% Negative space for menu typography.
   - Shallow depth of field (bokeh) following optical physics.
`;
};

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
  const archetype = getDishArchetype(dishName + " " + dishDescription);
  const profile = getAestheticProfile(style);
  const masterPrompt = constructMasterPrompt(
    dishName, 
    dishDescription, 
    style, 
    archetype, 
    profile, 
    !!logoBase64, 
    !!locationBase64
  );

  const parts: any[] = [{ text: masterPrompt }];
  
  if (referenceBase64) {
    parts.unshift({ text: `REFERENCE LOCK (96-100%): Replicate this specific plating and architecture exactly. Fix lighting to Michelin studio standard.` });
    parts.unshift({ inlineData: { mimeType: getMimeType(referenceBase64), data: getBase64Data(referenceBase64) } });
  }
  
  if (locationBase64) {
    parts.push({ text: `ENVIRONMENT TARGET: Use this location as the context. Apply [PROTOCOL: ADD LOC] logic.` });
    parts.push({ inlineData: { mimeType: getMimeType(locationBase64), data: getBase64Data(locationBase64) } });
  }

  if (logoBase64) {
    parts.push({ text: "BRANDING ASSET: Use this logo. Apply [PROTOCOL: ADD LOGO] logic." });
    parts.push({ inlineData: { mimeType: getMimeType(logoBase64), data: getBase64Data(logoBase64) } });
  }

  const response = await ai.models.generateContent({
    model: quality === PhotoQuality.PREMIUM ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image",
    contents: { parts: parts },
    config: { 
      imageConfig: { 
        aspectRatio, 
        imageSize: quality === PhotoQuality.PREMIUM ? size : undefined 
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
        { text: `MAGIC EDIT: ${editPrompt}. MANDATE: 96% Similarity Lock. ZERO-STEAM POLICY. Cinema Lighting Consistency.` },
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
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: getBase64Data(imageBase64), mimeType: getMimeType(imageBase64) } },
        { text: "Detailed Michelin culinary analysis: List ingredients, calories, and pairings." }
      ]
    }
  });
  return response.text || "";
};

export async function* chatWithConcierge(message: string, history: any[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { systemInstruction: "You are the MrDelivery Virtual Concierge. Expert in Michelin photography and production aesthetics." },
  });
  const stream = await chat.sendMessageStream({ message });
  for await (const chunk of stream) if (chunk.text) yield chunk.text;
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
  const base64 = response.candidates[0].content.parts[0].inlineData.data;
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
      systemInstruction: "Live Concierge for ultra-high-end culinary consulting.",
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
      outputAudioTranscription: {},
      inputAudioTranscription: {},
    },
  });
};
