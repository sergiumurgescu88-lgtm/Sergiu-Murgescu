
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
 * 20 FOOD PHOTOGRAPHY PROTOCOLS - MICHELIN STYLE
 * 100% PHOTOREALISTIC - STRICT ZERO-ATMOSPHERIC POLICY
 */
const CULINARY_PROTOCOLS: Record<string, { instructions: string; angle: string; shootBrief: string; checklist: string[] }> = {
  PIZZA: {
    angle: "90° (overhead/flat lay)",
    shootBrief: "Camera: Phase One XF IQ4 150MP. Lens: 80mm LS f/2.8. Lighting: ARRI SkyPanel S60-C Top-Down through double diffusion. Surface: Dark rustic wood or black marble.",
    instructions: "Perfect 90° flat lay. Show uniform distribution of ingredients. Crust edge must look crispy with authentic Maillard char marks (irregular, natural). Cheese must appear melted with golden-brown bubbles. Pull one slice slightly to show natural cheese stretch. Background: Dark rustic wood or black marble. Sprinkle fresh basil. Subtle gleam of olive oil catching light.",
    checklist: ["Perfect 90° perpendicular angle", "Cheese stretch looks physically real", "Authentic char marks (irregular, natural)", "Natural soft lighting (no harsh shadows)", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  BURGER: {
    angle: "45° (3/4 view)",
    shootBrief: "Camera: Phase One XF IQ4. Lens: 120mm LS Macro. Lighting: 3-Point ARRI SkyPanel. Key: 45° back-left to create realistic glow. Surface: Natural wood or black stone.",
    instructions: "Position camera to show both the top of the bun AND the visible side layers. Meat should look juicy with visible juice. Melted cheese must naturally drape over edges. Bun fresh and fluffy with a natural sheen. Background: Natural wood or black stone. Crispy fries out of focus in background.",
    checklist: ["45° angle perfectly calibrated", "All layers visible from side", "Cheese drape natural and gravity-correct", "Bun looks real with natural shine", "Meat juice visible but not excessive", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  STEAK: {
    angle: "45°",
    shootBrief: "Camera: Canon EOS R5 C. Lens: 85mm f/1.2L. Lighting: ARRI SkyPanel S60-C at 50° side-back. Surface: Dark polished slate or wooden cutting board.",
    instructions: "Show a caramelized crust with visible cross-hatch grill marks. If cut, show interior pink color (medium-rare) realistically. Meat juices glisten on surface naturally. Add a realistic pat of melting butter following real physics. Minimal garnish: fresh thyme, salt, peppercorns.",
    checklist: ["Grill marks perfectly realistic", "Interior color authentic (if cut)", "Juiciness through real light reflection", "Butter melts according to physics", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  PASTA: {
    angle: "90° for flat pasta or 45° for volumetric",
    shootBrief: "Camera: Sony FX3. Lens: 50mm f/1.2 GM. Lighting: Soft window-light simulation. Surface: Rustic Italian wooden table.",
    instructions: "For 90°: elegant 'nest' twist in center. For 45°: show depth of bowl and sauce. Sauce coats pasta uniformly but not drowning. Ingredients distributed naturally. Fresh grated parmesan looks real (not powder). Realistic drizzle of olive oil.",
    checklist: ["Pasta twisted naturally (nest)", "Sauce uniformly distributed", "Fresh grated parmesan looks real", "Herbs vibrant green", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  SALAD: {
    angle: "45° or 90°",
    shootBrief: "Camera: Hasselblad H6D-100c. Lens: 120mm Macro. Lighting: High-key ARRI SkyPanel. Surface: White marble or light wood.",
    instructions: "Leaves ultra-fresh, crisp, with micro-droplets of water (natural dew). Ingredients visible, not hidden. Dressing artistically drizzled or alongside. Vibrant colors: deep greens, bright reds. Modern ceramic bowl.",
    checklist: ["Leaves ultra-fresh and crisp", "Micro-droplets natural", "All ingredients visible", "Vibrant airy lighting", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  SOUPS: {
    angle: "90° or 45°",
    shootBrief: "Camera: Phase One XF. Lens: 80mm f/2.8. Lighting: Top-down ARRI SkyPanel through double diffusion. Surface: Rustic wood or stone.",
    instructions: "Elegant ceramic bowl, not full (2cm to rim). Creams: show velvety texture, swirl of cream or oil. Clear: ingredients float naturally. Surface reflections must be realistic. Garnish: fresh-cut herbs, croutons.",
    checklist: ["Bowl never too full", "Visible texture (smooth/chunky)", "Realistic surface reflections", "Ingredients float naturally", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  DESSERT_SLICE: {
    angle: "45°",
    shootBrief: "Camera: Phase One XF. Lens: 120mm Macro. Lighting: ARRI SkyPanel side-rake. Surface: Polished white marble or dark stone.",
    instructions: "Show interior texture: layers, cream, filling. Clean-edged precise cut. Sauce decoration (lines, dots) following real physics. Garnish: fresh fruit, mint, chocolate shavings. Side lighting to highlight cream textures.",
    checklist: ["Interior layers visible and realistic", "Precise clean-cut edge", "Artistic plating follows physics", "Refined Michelin style", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  WHOLE_CAKE: {
    angle: "0° (eye level)",
    shootBrief: "Camera: Canon EOS R5 C. Lens: 50mm f/1.2L. Lighting: Two soft ARRI SkyPanels at 45°. Surface: Elegant cake stand.",
    instructions: "Dramatic height focus. Remove one slice to show internal layers. Frosting/Glaze smooth or textured according to style. Natural drip of ganache follows gravity realistically. Slice in front to reveal interior. Side-back lighting for natural glow.",
    checklist: ["0° angle for dramatic height", "All layers visible and realistic", "Perfect frosting application", "Natural gravity-correct drip", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  BEVERAGES: {
    angle: "0° or 45°",
    shootBrief: "Camera: Sony FX3. Lens: 90mm Macro. Lighting: Strong backlighting through glass. Surface: Polished black granite bar or elegant table.",
    instructions: "Realistic condensation (micro-droplets) for cold drinks. Crystal-clear ice geometry. Coffee: show crema and latte art. Clean glass, no fingerprints. Backlighting to make liquid glow and appear translucent.",
    checklist: ["Realistic condensation (cold)", "Crystal clear real ice", "Backlighting for translucency", "Clean glassware", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  BREAKFAST: {
    angle: "45° or 0°",
    shootBrief: "Camera: Hasselblad X2D. Lens: XCD 55V. Lighting: Natural morning light simulation (5000K). Surface: Light oak or white marble.",
    instructions: "Eggs: 45°, liquid yolk ready to burst. Pancakes: 0°, stack height focus, syrup dripping naturally. Morning light quality: bright and optimistic. Garnish: bacon, avocado, toast.",
    checklist: ["Liquid yolk physics (eggs)", "Syrup drip gravity (pancakes)", "Morning light quality", "Fresh appetizing vibe", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  SANDWICHES: {
    angle: "45°",
    shootBrief: "Camera: Sony A7R V. Lens: 50mm f/1.2 GM. Lighting: Side-lighting for bread texture. Surface: Polished concrete or rustic wood.",
    instructions: "Diagonal cut to reveal interior layers. Bread: crispy exterior, fluffy interior. Ingredients fresh, colorful, abundant. Sauce visible but controlled. Natural lighting highlights bread texture and freshness.",
    checklist: ["Diagonal cut for interior visibility", "Distinct layer visibility", "Textured bread looks real", "Controlled sauce application", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  ASIAN: {
    angle: "Type-specific (90° for Sushi, 45° for Ramen)",
    shootBrief: "Camera: Phase One XF. Lens: 80mm f/2.8. Lighting: Neutral 5500K. Surface: Black slate or dark ceramic.",
    instructions: "Sushi: 90° artistic arrangement, vibrant natural fish colors. Ramen: 45°, bowl depth focus, broth surface sheen. Cultural authenticity in plating. Chopsticks placed perfectly.",
    checklist: ["Cultural authenticity lock", "Vibrant natural fish colors", "Noodles/Ingredients float naturally", "Traditional props", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  MEXICAN: {
    angle: "45°",
    shootBrief: "Camera: Canon EOS R5. Lens: 35mm f/1.8. Lighting: Vibrant ARRI SkyPanel (5000K). Surface: Modern textured stoneware.",
    instructions: "Tacos: 2-3 tacos, filling visible and abundant. Burritos: diagonal cut, interior layers visible. Quesadillas: melted cheese stretch. Vibrant colors: green (cilantro/lime), red (salsa), white (sour cream). Festive atmosphere.",
    checklist: ["Filling architecture visibility", "Vibrant color palette", "Traditional props", "Cheese stretch realism", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  APPETIZERS: {
    angle: "90° (overhead)",
    shootBrief: "Camera: Phase One IQ4. Lens: 80mm f/2.8. Lighting: Large overhead ARRI SkyPanel. Surface: Polished marble slab or wooden board.",
    instructions: "Aesthetic varied arrangement. Organically or geometrically organized. Visible variety of colors and textures. Items visually accessible with distinct negative space. Organised party-ready look.",
    checklist: ["Perfect 90° flat lay", "Visual and color variety", "Artistic organization", "Organized abundance", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  SEAFOOD: {
    angle: "45°",
    shootBrief: "Camera: Hasselblad X2D. Lens: 90mm Macro. Lighting: Cool luxury 6000K key. Surface: White polished marble.",
    instructions: "Fish: crispy golden skin, white flaky meat. Shrimp/Shellfish: pink-orange and glistening. Fresh lemon wedges, parsley, melted butter. Nautical feel. Seafood must look freshly caught and moist.",
    checklist: ["Fish flaky texture definition", "Glistening fresh shellfish", "Natural seafood colors", "Lighting highlights moisture", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  PREMIUM_PASTA: {
    angle: "45° or 90°",
    shootBrief: "Camera: Phase One XF. Lens: 120mm Macro. Lighting: ARRI SkyPanel side-back. Surface: Polished black granite or elegant porcelain.",
    instructions: "Fine-dining presentation. Risotto: 'all’onda' wave texture. Premium garnishes: truffles, mushrooms, saffron. Glossy sauce emulsion. Michelin refined style.",
    checklist: ["All’onda wave texture (risotto)", "Premium ingredients highlighted", "Refined Michelin plating", "Glossy sauce lock", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  GRILL_BBQ: {
    angle: "45°",
    shootBrief: "Camera: Canon R5 C. Lens: 50mm f/1.2. Lighting: Warm cinema 4000K key. Surface: Honed dark concrete or wood platter.",
    instructions: "Highlight glistening glaze and Maillard caramelization. Char marks authentic and irregular. Meat succulent and moist. Casual but premium presentation. NO SMOKE.",
    checklist: ["Authentic irregular char marks", "Glistening BBQ glaze", "Succulent meat texture", "Warm rustic lighting", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  VEGETARIAN: {
    angle: "45° or 90°",
    shootBrief: "Camera: Sony A7R IV. Lens: 90mm Macro. Lighting: High-key natural light simulation. Surface: Light grey stone or artisanal ceramic.",
    instructions: "Vibrancy and freshness focus. Chromatic colors: deep greens, bright oranges, purples. Diverse textures (crispy, creamy, crunchy). Geometric/modern arrangement. Wholesome nourishing vibe.",
    checklist: ["Chromatic vibrant colors", "Evident freshness", "Varied textures mapping", "Artistic colorful plating", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  PREMIUM_BRUNCH: {
    angle: "45°",
    shootBrief: "Camera: Phase One XF. Lens: 80mm LS. Lighting: Weekend morning window-light simulation. Surface: White marble.",
    instructions: "Benedict: hollandaise flowing according to fluid dynamics, yolk ready to run. Avocado Toast: artisan grilled bread, perfectly mashed. Indulgent, weekend morning luxury. Instagram-worthy aesthetic.",
    checklist: ["Hollandaise fluid dynamics", "Liquid yolk physics", "Luxury brunch aesthetic", "Bright morning light", "ZERO-STEAM/ZERO-SMOKE POLICY"]
  },
  SPECIAL_DESSERTS: {
    angle: "Varies (45° or 90°)",
    shootBrief: "Camera: Hasselblad H6D. Lens: 120mm Macro. Lighting: Warm 3200K softbox. Surface: Polished black granite or designer plate.",
    instructions: "Ice Cream: perfect scoops, slight melting for realism. Profiteroles: glossy chocolate, cream filling. Crème Brûlée: perfectly cracked caramel crust. Decadent, high-end dessert bar style.",
    checklist: ["Sugar/Caramel texture focus", "Mirror-glaze reflections", "Physics-correct melting", "Decadent appearance", "ZERO-STEAM/ZERO-SMOKE POLICY"]
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
  
  if (lower.includes('pizza')) return { category: 'PIZZA', protocolKey: 'PIZZA', lockedElements: ['Crust char pattern lock', 'Cheese blister distribution', 'Topping coordinates'], vessel: 'Modern ceramic pizza stone', bestAngle: '90° Overhead', similarityThreshold: '98-100%' };
  if (lower.includes('burger')) return { category: 'BURGER', protocolKey: 'BURGER', lockedElements: ['Layer architecture lock', 'Cheese drape viscosity', 'Meat surface sheen'], vessel: 'Modern matte black ceramic', bestAngle: '45° Hero', similarityThreshold: '97-100%' };
  if (lower.includes('steak') || lower.includes('beef')) return { category: 'STEAK', protocolKey: 'STEAK', lockedElements: ['Sear mark geometry', 'Medium-rare internal color lock', 'Jus pooling viscosity'], vessel: 'Large white bone-china', bestAngle: '45° Diner View', similarityThreshold: '98-100%' };
  if (lower.includes('pasta')) {
    if (lower.includes('risotto') || lower.includes('truffle') || lower.includes('lobster')) return { category: 'PREMIUM_PASTA', protocolKey: 'PREMIUM_PASTA', lockedElements: ['All’onda texture lock', 'Garnish micro-placement', 'Gloss level 8/10'], vessel: 'Wide-rimmed white porcelain bowl', bestAngle: '45° Angle', similarityThreshold: '97-99%' };
    return { category: 'PASTA', protocolKey: 'PASTA', lockedElements: ['Nest architecture strands', 'Sauce emulsion lock', 'Ingredient visibility'], vessel: 'Minimalist white bowl', bestAngle: '45° Angle', similarityThreshold: '96-98%' };
  }
  if (lower.includes('salad')) return { category: 'SALAD', protocolKey: 'SALAD', lockedElements: ['Leaf crispness definition', 'Dressing drip coordinates', 'Ingredient distribution'], vessel: 'Modern stoneware bowl', bestAngle: '45° Angle', similarityThreshold: '97-99%' };
  if (lower.includes('soup') || lower.includes('stew') || lower.includes('cream of')) return { category: 'SOUPS', protocolKey: 'SOUPS', lockedElements: ['Liquid surface tension', 'Ingredient float buoyancy', 'Swirl geometry'], vessel: 'Designer ceramic bowl', bestAngle: '90° Overhead', similarityThreshold: '96-98%' };
  if (lower.includes('cake') || lower.includes('pastry') || lower.includes('dessert')) {
    if (lower.includes('slice') || lower.includes('piece')) return { category: 'DESSERT_SLICE', protocolKey: 'DESSERT_SLICE', lockedElements: ['Layer definition', 'Precision cut edges', 'Drip gravity'], vessel: 'Modern white plate', bestAngle: '45° Angle', similarityThreshold: '98-100%' };
    if (lower.includes('ice cream') || lower.includes('sorbet') || lower.includes('gelato')) return { category: 'SPECIAL_DESSERTS', protocolKey: 'SPECIAL_DESSERTS', lockedElements: ['Melt geometry', 'Scoop texture definition', 'Topping coordinates'], vessel: 'Modern dessert glass', bestAngle: '45° Angle', similarityThreshold: '97-99%' };
    return { category: 'WHOLE_CAKE', protocolKey: 'WHOLE_CAKE', lockedElements: ['Volumetric cake height', 'Frosting smoothness lock', 'Decoration geometry'], vessel: 'Minimalist cake stand', bestAngle: '0° Eye Level', similarityThreshold: '98-100%' };
  }
  if (lower.includes('cocktail') || lower.includes('drink') || lower.includes('juice') || lower.includes('coffee')) return { category: 'BEVERAGE', protocolKey: 'BEVERAGES', lockedElements: ['Liquid refraction', 'Condensation micro-droplet pattern', 'Ice clarity index'], vessel: 'Ultra-clear crystal glass', bestAngle: '0° Eye Level', similarityThreshold: '99-100%' };
  if (lower.includes('breakfast') || lower.includes('pancake') || lower.includes('benedict') || lower.includes('brunch')) {
    if (lower.includes('brunch') || lower.includes('benedict')) return { category: 'BRUNCH', protocolKey: 'PREMIUM_BRUNCH', lockedElements: ['Hollandaise viscosity', 'Yolk run physics', 'Muffin texture definition'], vessel: 'Elegant ceramic plate', bestAngle: '45° Angle', similarityThreshold: '97-99%' };
    return { category: 'BREAKFAST', protocolKey: 'BREAKFAST', lockedElements: ['Egg yolk lock', 'Syrup drip gravity', 'Morning light temperature'], vessel: 'Modern ceramic plate', bestAngle: '45° Angle', similarityThreshold: '97-100%' };
  }
  if (lower.includes('sandwich') || lower.includes('wrap') || lower.includes('panini')) return { category: 'SANDWICH', protocolKey: 'SANDWICHES', lockedElements: ['Interior layer definition', 'Bread texture crunch', 'Component compression'], vessel: 'Modern causal plate', bestAngle: '45° Angle', similarityThreshold: '96-99%' };
  if (lower.includes('sushi') || lower.includes('ramen') || lower.includes('noodle') || lower.includes('asian')) return { category: 'ASIAN', protocolKey: 'ASIAN', lockedElements: ['Rice grain separation', 'Broth gloss lock', 'Cultural plating symmetry'], vessel: 'Slate or black ceramic', bestAngle: '90° or 45°', similarityThreshold: '98-100%' };
  if (lower.includes('taco') || lower.includes('mexican') || lower.includes('burrito')) return { category: 'MEXICAN', protocolKey: 'MEXICAN', lockedElements: ['Filling abundance lock', 'Cheese stretch realism', 'Cilantro micro-coordinates'], vessel: 'Modern textured stoneware', bestAngle: '45° Angle', similarityThreshold: '97-100%' };
  if (lower.includes('appetizer') || lower.includes('platter') || lower.includes('board') || lower.includes('finger food')) return { category: 'APPETIZER', protocolKey: 'APPETIZERS', lockedElements: ['Geometric distribution', 'Item variety count', 'Board material texture'], vessel: 'Polished marble slab', bestAngle: '90° Overhead', similarityThreshold: '96-98%' };
  if (lower.includes('fish') || lower.includes('shrimp') || lower.includes('lobster') || lower.includes('seafood')) return { category: 'SEAFOOD', protocolKey: 'SEAFOOD', lockedElements: ['Skin sear texture', 'Segment flake definition', 'Lemon wedge coordinates'], vessel: 'Modern white ceramic', bestAngle: '45° Angle', similarityThreshold: '97-99%' };
  if (lower.includes('bbq') || lower.includes('grill') || lower.includes('ribs') || lower.includes('wings')) return { category: 'GRILL', protocolKey: 'GRILL_BBQ', lockedElements: ['Char mark irregularity', 'Glaze specular highlight', 'Caramelization depth'], vessel: 'Modern dark ceramic platter', bestAngle: '45° Angle', similarityThreshold: '98-100%' };
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
 * PROTOCOL: ADD LOGO (Natural Brand Integration)
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
 * PROTOCOL: ADD LOC (Location/Background)
 */
const ENVIRONMENT_PROTOCOL = `
[PROTOCOL: ADD LOC]
Integrate user-provided location backgrounds naturally using Step-by-Step Scene Construction.
1. Table Sync: 
   - Beach -> light wooden/wicker.
   - Garden -> light oak/wrought iron.
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
  const protocol = CULINARY_PROTOCOLS[archetype.protocolKey] || { instructions: "Follow high-end Michelin culinary photography standards.", angle: archetype.bestAngle, shootBrief: "High-end commercial gear.", checklist: ["Authentic textures", "Natural shadows"] };
  const locks = archetype.lockedElements.map((l, i) => `${i + 1}. ${l}`).join('\n');
  const checklist = protocol.checklist.map(c => `✅ ${c}`).join('\n');

  return `
[MICHELIN PRODUCTION PROTOCOL LEVEL ${profile.level}] - ${dishName.toUpperCase()}
MANDATE: Create a 100% photorealistic commercial production asset. €30,000+ Production Value.

1. CATEGORY PROTOCOL: ${archetype.protocolKey}
   - RECOMMENDED ANGLE: ${protocol.angle}
   - PROFESSIONAL SHOOT BRIEF: ${protocol.shootBrief}
   - SPECIFIC INSTRUCTIONS: ${protocol.instructions}
   - DESCRIPTION CONTEXT: ${dishDescription}

2. SIMILARITY MANDATE (${archetype.similarityThreshold} FIDELITY):
   - You MUST lock the structural architecture. No deviations from description.
   - STRUCTURAL LOCKS:
${locks}

3. CRITICAL REALISM RULES:
   - ❌ NO AI artifacts. ❌ NO impossible physics. ❌ NO perfect symmetry.
   - ❌ NO oversaturated colors. ❌ NO artificial glow. ❌ NO painted-on details.
   - NOTE: Scenario-specific atmospheric effects (steam/volumetric light) allowed only where explicitly requested by special protocols.

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
        { text: `MAGIC EDIT: ${editPrompt}. MANDATE: Hyper-realistic 100% photorealism. Maintain lighting consistency. Apply scenario-specific physics.` },
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
    model: 'gemini-3-pro-preview',
    config: { systemInstruction: `You are Maya, a friendly AI assistant for Instant Menu Pictures, a professional menu photography app powered by AI.

Your role:
- Help users create stunning menu photography
- Explain app features clearly and concisely (Logo upload, Location backgrounds, Magic Edits, Prep Team, etc.)
- Guide users through workflows step-by-step
- Answer questions about credits (50 free welcome credits, €0.20 per credit), pricing, and account management
- Be enthusiastic but not overwhelming
- Keep responses SHORT for voice delivery (under 100 words)
- Remember conversation context and refer back to previous messages

When responding:
1. Keep it conversational and natural
2. Use "you" and "I" language
3. Ask follow-up questions to clarify needs
4. Provide specific, actionable guidance
5. Mention credit costs when relevant (1 credit for generation/edit)
6. If you don't know something, offer to connect them with support

Remember: Your responses will be spoken aloud, so prioritize clarity and brevity.` },
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
  const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64) throw new Error("TTS failed to return audio.");
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
      systemInstruction: "You are Maya, the Live MrDelivery Concierge. Expert in Michelin-quality commercial production. Speak clearly, elegantly, and helpfully.",
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
      outputAudioTranscription: {},
      inputAudioTranscription: {},
    },
  });
};
