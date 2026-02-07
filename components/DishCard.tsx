
import React, { useState, useRef, useEffect } from 'react';
import { Dish, ImageSize, PhotoStyle, PhotoQuality, AspectRatio } from '../types';
import { 
  Edit2, RefreshCw, X, Check, Download, Image as ImageIcon, 
  ScanEye, Upload, LucideIcon, Camera, Ratio, 
  MapPin, BadgeCheck, Mic, MicOff, Loader2, AlertCircle, 
  Info, Users, Search, ClipboardList, Utensils, Sparkles, Wand2, Eye, LayoutTemplate, Globe, Briefcase, Coffee
} from 'lucide-react';
import { generateDishImage, editDishImage, analyzeDishNutrition } from '../services/geminiService';

interface DishCardProps {
  dish: Dish;
  currentStyle: PhotoStyle;
  currentSize: ImageSize;
  currentQuality: PhotoQuality;
  logoImage: string | null;
  locationImage: string | null;
  onUpdate: (id: string, updates: Partial<Dish>) => void;
  isGenerationLimitReached: boolean;
  onKeyError?: () => void;
}

const ActionButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  onClear,
  disabled = false, 
  isActive = false,
  isMagic = false
}: { 
  icon: LucideIcon, 
  label: string, 
  onClick: (e: React.MouseEvent) => void, 
  onClear?: (e: React.MouseEvent) => void,
  disabled?: boolean, 
  isActive?: boolean,
  isMagic?: boolean
}) => (
  <div className="relative w-full group/container">
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg transition-all text-[10px] font-black uppercase tracking-tighter disabled:opacity-30 disabled:cursor-not-allowed group/btn w-full ${
        isMagic
          ? 'bg-gradient-to-r from-orange-600 to-red-600 border-orange-500/60 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)] animate-pulse hover:animate-none hover:scale-105 active:scale-95'
          : isActive 
            ? 'bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-[0_0_15px_rgba(234,88,12,0.1)]' 
            : 'bg-zinc-900/40 hover:bg-zinc-800/80 border-zinc-800/50 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 shadow-sm'
      }`}
    >
      <Icon size={14} className={`${isMagic ? 'text-white' : isActive ? 'text-orange-500' : 'text-zinc-500 group-hover/btn:text-orange-400'} transition-colors shrink-0`} />
      <span className="truncate relative z-10">{label}</span>
      {isMagic && <Sparkles size={10} className="absolute top-1 right-1 text-orange-200 animate-ping" />}
    </button>
    {isActive && onClear && (
      <button 
        onClick={(e) => { e.stopPropagation(); onClear(e); }}
        className="absolute -top-1.5 -right-1.5 p-1 bg-zinc-800 text-zinc-400 hover:text-white rounded-full border border-zinc-700 shadow-lg transition-all hover:bg-red-500/20 hover:border-red-500/40 z-20"
        title="Clear override"
      >
        <X size={10} />
      </button>
    )}
  </div>
);

const AspectRatioSelector = ({ value, onChange, disabled = false }: { value: AspectRatio, onChange: (val: AspectRatio) => void, disabled?: boolean }) => (
  <div className="relative group/select w-full">
    <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-zinc-500">
      <Ratio size={14} />
    </div>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value as AspectRatio)}
      disabled={disabled}
      className="appearance-none bg-zinc-900/40 hover:bg-zinc-800/80 border border-zinc-800/50 text-zinc-400 hover:text-zinc-200 text-[10px] font-black uppercase tracking-widest rounded-lg pl-9 pr-2 py-2.5 w-full focus:outline-none focus:border-orange-500/50 cursor-pointer transition-all disabled:opacity-30"
      onClick={(e) => e.stopPropagation()}
    >
      <option value="1:1">1:1 SQUARE</option>
      <option value="3:4">3:4 PORTRAIT</option>
      <option value="4:3">4:3 LANDSCAPE</option>
      <option value="9:16">9:16 STORY</option>
      <option value="16:9">16:9 CINEMA</option>
    </select>
  </div>
);

const MAGIC_EXAMPLES = {
  logo: [
    {
      id: "logo_napkin",
      title: "Elegant Napkin",
      description: "Subtle logo embossed on folded linen napkin corner",
      thumbnail: "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&q=80&w=800&ar=16:9",
      prompt: "with a cream-colored linen napkin elegantly folded to the left. A subtle embossed logo appears on the napkin corner, appearing as a delicate monogram print in soft gray tones, blending naturally with the fabric's texture",
      icon: Coffee
    },
    {
      id: "logo_coaster",
      title: "Wooden Coaster",
      description: "Laser-engraved logo on natural wood grain coaster",
      thumbnail: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=800&ar=16:9",
      prompt: "sitting on a circular wooden coaster with visible oak grain. A minimalist logo is laser-engraved on the bottom right, appearing as a natural burn mark in the wood",
      icon: LayoutTemplate
    },
    {
      id: "logo_menu",
      title: "Background Menu",
      description: "Sophisticated logo on elegant table card",
      thumbnail: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800&ar=16:9",
      prompt: "with a small elegant menu card in the soft-focus background. The restaurant logo is printed at the top in gold foil, sophisticated and refined",
      icon: ClipboardList
    },
    {
      id: "logo_plate",
      title: "Ceramic Plate Detail",
      description: "Minimalist embossed logo on plate rim",
      thumbnail: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800&ar=16:9",
      prompt: "on a white ceramic plate featuring a very subtle embossed logo on the top center rim, appearing as an elegant maker's mark, occupying only 5% of rim area",
      icon: Utensils
    },
    {
      id: "logo_packaging",
      title: "Artisan Packaging",
      description: "Printed logo on takeout box interior",
      thumbnail: "https://images.unsplash.com/photo-1544333346-64e4fe1feda0?auto=format&fit=crop&q=80&w=800&ar=16:9",
      prompt: "served in an open artisan cardboard box. The opened lid shows a printed logo on the inside surface in warm brown ink",
      icon: Briefcase
    }
  ],
  location: [
    {
      id: "location_fine_dining",
      title: "Fine Dining Elegance",
      description: "Upscale restaurant with logo on illuminated wall",
      thumbnail: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800&ar=16:9",
      prompt: "on an elegant table with white linen tablecloth in a fine dining restaurant with dark wood paneling. Approximately 3-4 meters in soft focus, the restaurant's logo is displayed as an illuminated sign mounted on the back wall",
      icon: Globe
    },
    {
      id: "location_modern_bistro",
      title: "Modern Casual Bistro",
      description: "Contemporary space with brick wall neon sign",
      thumbnail: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800&ar=16:9",
      prompt: "on a rustic reclaimed wood table in a modern casual bistro. On an exposed red brick wall behind, the restaurant's logo appears as a trendy neon sign glowing in warm orange",
      icon: LayoutTemplate
    },
    {
      id: "location_trattoria",
      title: "Cozy Traditional Trattoria",
      description: "Italian-style space with logo on entrance door",
      thumbnail: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=800&ar=16:9",
      prompt: "on a traditional red and white checkered tablecloth in a cozy Italian trattoria. In the background, the logo is elegantly applied as a gold vinyl decal on the glass panel of the wooden entrance door",
      icon: Utensils
    },
    {
      id: "location_sushi_bar",
      title: "Sleek Sushi Bar",
      description: "Minimalist Japanese style with backlit panel",
      thumbnail: "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?auto=format&fit=crop&q=80&w=800&ar=16:9",
      prompt: "on a polished black marble countertop in a contemporary sushi bar with minimalist Japanese design. The restaurant's logo is displayed on a frosted acrylic backlit panel on a clean white wall behind",
      icon: Search
    },
    {
      id: "location_steakhouse",
      title: "Rustic Steakhouse",
      description: "Classic American grill with embossed leather",
      thumbnail: "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=800&ar=16:9",
      prompt: "on a solid dark-stained oak wood table in a classic American steakhouse. The restaurant's logo is subtly embossed into the leather headrest of a high-backed booth visible in the background",
      icon: Briefcase
    }
  ]
};

const DishCard: React.FC<DishCardProps> = ({ dish, currentStyle, currentSize, currentQuality, logoImage, locationImage, onUpdate, isGenerationLimitReached, onKeyError }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMagicModalOpen, setIsMagicModalOpen] = useState(false);
  const [magicCategory, setMagicCategory] = useState<'logo' | 'location'>('logo');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isListening, setIsListening] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; 
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ro-RO';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setEditPrompt(prev => (prev.trim() + ' ' + transcript.trim()).trim());
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Recognition error', err);
      }
    }
  };

  const handleGenerate = async () => {
    if (isStudioFull) return;

    onUpdate(dish.id, { isLoading: true, error: undefined });
    try {
      let finalDescription = dish.description;
      if (dish.magicLogoPrompt) finalDescription += `. ${dish.magicLogoPrompt}`;
      if (dish.magicLocationPrompt) finalDescription += `. ${dish.magicLocationPrompt}`;

      const imageUrl = await generateDishImage(
        dish.name, 
        finalDescription, 
        currentStyle, 
        currentSize, 
        currentQuality,
        aspectRatio,
        dish.logoImage || logoImage,
        dish.locationImage || locationImage,
        dish.referencePhoto 
      );
      onUpdate(dish.id, { imageUrl, isLoading: false });
    } catch (err: any) {
      let errorMsg = err?.message || "Generation failed.";
      if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("limit: 0")) {
        errorMsg = "QUOTA RESTRICTION: Paid Billing Required for Gemini 3 Studio Quality.";
        if (onKeyError) onKeyError();
      }
      onUpdate(dish.id, { isLoading: false, error: errorMsg });
    }
  };

  const handleEdit = async (customPrompt?: string) => {
    if (isGenerationLimitReached && !dish.isEditing) return;
    const promptToUse = customPrompt || editPrompt;
    if (!dish.imageUrl || !promptToUse.trim()) return;
    
    onUpdate(dish.id, { isEditing: true });
    try {
      const newImageUrl = await editDishImage(dish.imageUrl, promptToUse);
      onUpdate(dish.id, { imageUrl: newImageUrl, isEditing: false });
      setIsEditMode(false);
      if (!customPrompt) setEditPrompt('');
    } catch (err: any) {
      onUpdate(dish.id, { isEditing: false, error: "Edit failed. Check quota." });
      if (onKeyError) onKeyError();
    }
  };

  const triggerPrepTeam = () => {
    const prompt = `
[PROTOCOL: HYPER-REALISTIC MINIATURE PREP TEAM]
MANDATE: Add a 100% photorealistic scene of a 5-person miniature kitchen brigade (scale 1:12-1:20) preparing this dish.
CHARACTER REALISM:
- Faces: Visible pores, natural unique ethnicities (25-55 yrs), individual iris detail, natural laugh lines.
- Hair: Individual visible strands, natural shine/flyaways.
- Clothing: Realistic fabric wrinkles, visible stitching, flour-dusted aprons, textured chef whites.
ROLES:
1. Head Chef: Elevated, supervisory position, traditional toque, seasoning dish from height.
2. Sous Chef: Mid-motion chopping ingredients on miniature wood cutting board.
3. Prep Cooks (2): Using stainless steel bowls and whisks; arranging garnishes with tweezers.
4. Specialist: Using a miniature blowtorch with a realistic blue flame on a specific ingredient.
TOOLS: Scaled 1:12-1:20. Metallic reflections on knives, wood grain on boards, glass transparency.
ATMOSPHERE: WARM & INVITING lighting (3200-4500K). Soft morning light. Subtle steam rising from hot components.
INTERACTION: Characters must physically stand on ingredients or lean into the dish. Cast realistic shadows.
`;
    handleEdit(prompt.trim());
  };

  const triggerDetectionSquad = () => {
    const prompt = `
[PROTOCOL: HYPER-REALISTIC MINIATURE DETECTION SQUAD]
MANDATE: Add a 100% photorealistic 5-person forensic investigation squad (scale 1:12-1:20) scrutinizing this dish.
CHARACTER REALISM:
- Faces: Intense concentration, clinical focus, visible pores, realistic skin subsurface scattering.
- Clothing: Lab coats with micro-textures, detective trench coats with realistic folds, latex-style gloves.
ROLES:
1. Lead Detective: Examining center evidence with a magnifying glass (realistic lens distortion visible).
2. Forensic Specialist: Using tweezers to collect a sample into a glass vial.
3. Assistant: Placing yellow evidence markers (numbered 1-5) and taking a photo (flash bloom captured).
4. Observers (2): Standing in background, arms crossed skeptically, leaning in with curiosity.
TOOLS: Yellow numbered tents, magnifying glass (metal handle), clear evidence bags, UV flashlights with purple beams.
ATMOSPHERE: COOL & DRAMATIC lighting (4500-5500K). High contrast. Volumetric light beams from flashlights with dust particles.
INTERACTION: Position markers among ingredients. Long, defined cast shadows. Mystery noir vibe.
`;
    handleEdit(prompt.trim());
  };

  const handleAnalyze = async () => {
    if (!dish.imageUrl) return;
    onUpdate(dish.id, { isAnalyzing: true });
    try {
      const analysis = await analyzeDishNutrition(dish.imageUrl);
      onUpdate(dish.id, { nutritionAnalysis: analysis, isAnalyzing: false });
      setShowNutrition(true);
    } catch (err: any) {
      onUpdate(dish.id, { isAnalyzing: false });
    }
  };

  const downloadIndividual = () => {
    if (!dish.imageUrl) return;
    const link = document.createElement('a');
    link.href = dish.imageUrl;
    link.download = `${dish.name.replace(/\s+/g, '_').toLowerCase()}_mrdelivery.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'ref' | 'logo' | 'loc') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'ref') onUpdate(dish.id, { referencePhoto: base64, imageUrl: undefined });
        else if (type === 'logo') onUpdate(dish.id, { logoImage: base64 });
        else if (type === 'loc') onUpdate(dish.id, { locationImage: base64 });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const selectMagicExample = (example: any) => {
    if (magicCategory === 'logo') {
      onUpdate(dish.id, { magicLogoPrompt: example.prompt });
    } else {
      onUpdate(dish.id, { magicLocationPrompt: example.prompt });
    }
    setTimeout(() => setIsMagicModalOpen(false), 800);
  };

  const isStudioFull = isGenerationLimitReached && !dish.isLoading && !dish.isEditing;
  const activeLogo = dish.logoImage || logoImage;
  const activeLocation = dish.locationImage || locationImage;

  return (
    <>
      <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'ref')} accept="image/*" className="hidden" />
      <input type="file" ref={cameraInputRef} onChange={(e) => handleFileUpload(e, 'ref')} accept="image/*" capture="environment" className="hidden" />
      <input type="file" ref={logoInputRef} onChange={(e) => handleFileUpload(e, 'logo')} accept="image/*" className="hidden" />
      <input type="file" ref={locationInputRef} onChange={(e) => handleFileUpload(e, 'loc')} accept="image/*" className="hidden" />

      {/* Magic Examples Modal - Enhanced per Protocol 5 */}
      {isMagicModalOpen && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-5 duration-300" onClick={() => setIsMagicModalOpen(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 delay-100" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div>
                <h3 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
                  <Sparkles className="text-orange-500 animate-pulse" size={28} /> MAGIC EXAMPLES
                </h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mt-1">Inspiration Studio - Choose Your Production Style</p>
              </div>
              <button onClick={() => setIsMagicModalOpen(false)} className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-2xl transition-all shadow-xl"><X size={24} /></button>
            </div>

            {/* Category Tabs per Protocol 5 */}
            <div className="flex p-6 gap-6 bg-zinc-950/50 border-b border-zinc-800">
              <button 
                onClick={() => setMagicCategory('logo')}
                className={`flex-1 max-w-[280px] h-20 rounded-2xl flex items-center justify-center gap-3 border transition-all duration-300 ${
                  magicCategory === 'logo' 
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 border-white/20 text-white shadow-[0_8px_20px_rgba(255,107,53,0.4)] -translate-y-1' 
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                <BadgeCheck size={24} className={magicCategory === 'logo' ? 'text-white' : 'text-zinc-600'} />
                <span className="text-[11px] font-black uppercase tracking-widest">Logo Placement</span>
              </button>
              <button 
                onClick={() => setMagicCategory('location')}
                className={`flex-1 max-w-[280px] h-20 rounded-2xl flex items-center justify-center gap-3 border transition-all duration-300 ${
                  magicCategory === 'location' 
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 border-white/20 text-white shadow-[0_8px_20px_rgba(255,107,53,0.4)] -translate-y-1' 
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                <Globe size={24} className={magicCategory === 'location' ? 'text-white' : 'text-zinc-600'} />
                <span className="text-[11px] font-black uppercase tracking-widest">Restaurant Locations</span>
              </button>
            </div>

            {/* Example Grid - 16:9 Thumbnails */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 animate-in slide-in-from-right-10 duration-500">
                {MAGIC_EXAMPLES[magicCategory].map((ex) => (
                  <div key={ex.id} className="group/ex relative flex flex-col">
                    <div 
                      onClick={() => selectMagicExample(ex)}
                      className={`h-full flex flex-col border rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-300 transform group-hover/ex:-translate-y-2 group-hover/ex:shadow-[0_20px_50px_rgba(234,88,12,0.2)] ${
                        (magicCategory === 'logo' ? dish.magicLogoPrompt : dish.magicLocationPrompt) === ex.prompt
                          ? 'border-orange-500 bg-orange-500/5 ring-4 ring-orange-500/10'
                          : 'border-zinc-800 bg-zinc-900/40 hover:border-orange-500/40'
                      }`}
                    >
                      {/* Thumbnail with 16:9 Image */}
                      <div className="aspect-video bg-zinc-950 relative overflow-hidden group/thumb">
                        <img 
                          src={ex.thumbnail} 
                          alt={ex.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/ex:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/ex:opacity-100 transition-opacity"></div>
                        
                        {(magicCategory === 'logo' ? dish.magicLogoPrompt : dish.magicLocationPrompt) === ex.prompt ? (
                          <div className="absolute inset-0 bg-orange-600/40 backdrop-blur-md flex flex-col items-center justify-center animate-in zoom-in-50 duration-300">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-orange-600 shadow-2xl mb-2">
                              <Check size={32} strokeWidth={4} />
                            </div>
                            <span className="text-[10px] text-white font-black tracking-widest">SELECTED</span>
                          </div>
                        ) : (
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                             <div className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20"><Eye size={20} className="text-white" /></div>
                           </div>
                        )}
                      </div>
                      
                      <div className="p-6 flex flex-col flex-1">
                        <h4 className="text-white font-bold text-base mb-2 leading-tight group-hover/ex:text-orange-400 transition-colors">{ex.title}</h4>
                        <p className="text-[11px] text-zinc-500 leading-relaxed font-medium mb-6 line-clamp-2">{ex.description}</p>
                        
                        <button className={`mt-auto w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          (magicCategory === 'logo' ? dish.magicLogoPrompt : dish.magicLocationPrompt) === ex.prompt
                            ? 'bg-orange-600 text-white'
                            : 'bg-transparent border-2 border-orange-500/50 text-orange-400 hover:bg-orange-600 hover:text-white hover:border-orange-600'
                        }`}>
                          {(magicCategory === 'logo' ? dish.magicLogoPrompt : dish.magicLocationPrompt) === ex.prompt ? '✓ IN USE' : 'SELECT THIS STYLE'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer with context details */}
            <div className="p-8 border-t border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
              <div className="flex items-center gap-4 text-zinc-500">
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800"><Info size={18} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Production Fidelity Mandate</p>
                  <p className="text-[9px] text-zinc-600 font-medium">Styles are applied at 96% structural similarity via Michelin Cinematic Protocol.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMagicModalOpen(false)}
                className="px-12 py-4 bg-white text-zinc-900 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl hover:bg-zinc-200 transition-all active:scale-95"
              >
                Return to Studio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen View */}
      {isExpanded && dish.imageUrl && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-4 sm:p-12 animate-in fade-in zoom-in-95 duration-300" onClick={() => setIsExpanded(false)}>
          <div className="relative max-w-7xl max-h-full">
            <img src={dish.imageUrl} alt={dish.name} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)]" />
            <div className="absolute -top-16 left-0 right-0 flex justify-between items-center text-white p-4">
              <h2 className="text-2xl font-serif font-bold">{dish.name}</h2>
              <button className="p-3 bg-zinc-900/80 hover:bg-orange-600 rounded-full transition-all backdrop-blur-md border border-white/10 shadow-xl"><X size={28} /></button>
            </div>
          </div>
        </div>
      )}

      {/* REFINED Nutrition Modal */}
      {showNutrition && dish.nutritionAnalysis && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-8" onClick={() => setShowNutrition(false)}>
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 shadow-lg">
                  <Utensils size={24} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">Culinary Protocol</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    AI Analysis Report
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowNutrition(false)} 
                className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all shadow-md"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar bg-zinc-950/30">
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row gap-6 pb-8 border-b border-zinc-800/50">
                  {dish.imageUrl && (
                    <div className="w-full sm:w-32 h-32 rounded-2xl overflow-hidden shadow-xl shrink-0 border border-zinc-800">
                      <img src={dish.imageUrl} className="w-full h-full object-cover" alt={dish.name} />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-lg mb-2 uppercase tracking-tight">{dish.name}</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">{dish.description}</p>
                  </div>
                </div>
                <div className="relative group/content">
                  <div className="flex items-center gap-2 mb-4 text-orange-500">
                    <ClipboardList size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Protocol Findings</span>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 sm:p-8 text-zinc-300 leading-relaxed font-medium whitespace-pre-line text-sm sm:text-base selection:bg-orange-500/30">
                      {dish.nutritionAnalysis}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-zinc-900 border-t border-zinc-800 flex justify-end">
              <button 
                onClick={() => setShowNutrition(false)}
                className="px-8 py-3 bg-white text-zinc-900 font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-zinc-200 transition-all shadow-lg active:scale-95"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card UI */}
      <div className={`bg-zinc-900/60 border rounded-[2rem] overflow-hidden shadow-2xl flex flex-col h-full transition-all duration-500 backdrop-blur-sm ${isStudioFull ? 'border-zinc-800 opacity-60' : 'border-zinc-800 hover:border-orange-500/30'}`}>
        <div className="relative w-full aspect-[4/3] bg-zinc-950 overflow-hidden cursor-pointer group" onClick={() => dish.imageUrl && setIsExpanded(true)}>
          {dish.imageUrl ? (
            <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800 p-6">
              <ImageIcon className="w-16 h-16 mb-3 opacity-10" />
            </div>
          )}
          
          {/* Loading Overlays */}
          {(dish.isLoading || dish.isEditing || dish.isAnalyzing) && (
            <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl flex flex-col items-center justify-center z-10 p-6 text-center">
              <div className="relative mb-6">
                <Loader2 className="animate-spin text-orange-500 w-12 h-12" strokeWidth={1.5} />
              </div>
              <span className="text-white text-sm font-black tracking-[0.2em] uppercase">Developing Shoot...</span>
            </div>
          )}

          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            {activeLogo && <div className="bg-orange-600/80 backdrop-blur-md text-white p-2 rounded-xl border border-orange-400/30"><BadgeCheck size={16} /></div>}
            {activeLocation && <div className="bg-sky-600/80 backdrop-blur-md text-white p-2 rounded-xl border border-sky-400/30"><MapPin size={16} /></div>}
            {(dish.magicLogoPrompt || dish.magicLocationPrompt) && <div className="bg-indigo-600/80 backdrop-blur-md text-white p-2 rounded-xl border border-indigo-400/30"><Sparkles size={16} /></div>}
          </div>
        </div>

        <div className="p-6 flex flex-col flex-grow">
          <div className="mb-6">
            <h3 className="text-2xl font-serif font-bold text-zinc-100 mb-1.5 leading-tight">{dish.name}</h3>
            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{dish.description}</p>
          </div>
          
          <div className="mt-auto space-y-3">
            <button 
              onClick={handleGenerate} 
              disabled={isStudioFull || dish.isLoading}
              className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                isStudioFull ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:opacity-90 active:scale-95'
              }`}
            >
              <RefreshCw size={18} className={dish.isLoading ? 'animate-spin' : ''} /> 
              {dish.imageUrl ? 'REGENERATE' : 'GENERATE SHOOT'}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} disabled={dish.isLoading} />
              <ActionButton icon={Upload} label="Upload Ref" onClick={() => fileInputRef.current?.click()} isActive={!!dish.referencePhoto} disabled={dish.isLoading} />
              <ActionButton icon={Camera} label="Live Ref" onClick={() => cameraInputRef.current?.click()} disabled={dish.isLoading} />
              <ActionButton icon={Edit2} label="Magic Edit" onClick={() => setIsEditMode(true)} disabled={!dish.imageUrl || dish.isLoading} />
              <ActionButton 
                icon={BadgeCheck} 
                label="Add Logo" 
                onClick={() => logoInputRef.current?.click()} 
                onClear={() => onUpdate(dish.id, { logoImage: undefined })}
                isActive={!!activeLogo} 
                disabled={dish.isLoading} 
              />
              <ActionButton 
                icon={MapPin} 
                label="Add Loc" 
                onClick={() => locationInputRef.current?.click()} 
                onClear={() => onUpdate(dish.id, { locationImage: undefined })}
                isActive={!!activeLocation} 
                disabled={dish.isLoading} 
              />
              <ActionButton icon={ScanEye} label="Nutrition" onClick={handleAnalyze} disabled={!dish.imageUrl || dish.isLoading} />
              <ActionButton 
                icon={Wand2} 
                label="Magic Examples" 
                isMagic={true}
                isActive={!!(dish.magicLogoPrompt || dish.magicLocationPrompt)}
                onClick={() => setIsMagicModalOpen(true)}
                onClear={(e) => { e.stopPropagation(); onUpdate(dish.id, { magicLogoPrompt: undefined, magicLocationPrompt: undefined }); }}
                disabled={dish.isLoading} 
              />
            </div>

            {/* MAGIC SPECIALIST BUTTONS - RESTORED FULL FUNCTIONALITY */}
            {dish.imageUrl && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/40">
                <button 
                  onClick={triggerPrepTeam}
                  disabled={dish.isLoading || dish.isEditing}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 bg-zinc-900/60 hover:bg-orange-600/10 border border-zinc-800 hover:border-orange-500/40 rounded-xl transition-all group/prep"
                >
                  <Users size={18} className="text-zinc-500 group-hover/prep:text-orange-500 transition-colors" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover/prep:text-zinc-200">Prep Team</span>
                </button>
                <button 
                  onClick={triggerDetectionSquad}
                  disabled={dish.isLoading || dish.isEditing}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 bg-zinc-900/60 hover:bg-sky-600/10 border border-zinc-800 hover:border-sky-500/40 rounded-xl transition-all group/det"
                >
                  <Search size={18} className="text-zinc-500 group-hover/det:text-sky-500 transition-colors" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover/det:text-zinc-200">Detection Squad</span>
                </button>
              </div>
            )}

            <button 
              onClick={downloadIndividual}
              disabled={!dish.imageUrl || dish.isLoading}
              className={`w-full mt-2 py-4 border-2 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                dish.imageUrl ? 'bg-zinc-950 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-700'
              }`}
            >
              <Download size={18} /> DOWNLOAD ASSET
            </button>
          </div>
        </div>
      </div>

      {/* Magic Edit Modal */}
      {isEditMode && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] w-full max-w-md p-10 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setIsEditMode(false)} className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-colors"><X size={28} /></button>
            <div className="mb-10 text-center">
              <div className="w-16 h-16 bg-orange-600/20 rounded-3xl flex items-center justify-center text-orange-500 mb-6 mx-auto shadow-xl"><Edit2 size={32} /></div>
              <h3 className="text-3xl font-serif font-bold text-white">Magic Retouch</h3>
              <p className="text-xs text-zinc-500 mt-2 font-black uppercase tracking-widest">Speak or type your adjustments</p>
            </div>
            <div className="space-y-6">
              <div className="relative group/input">
                <textarea 
                  value={editPrompt} 
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="Ex: Change plate to rustic wood, add scattered herbs..."
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-3xl py-6 pl-6 pr-16 text-sm text-white focus:outline-none focus:border-orange-500/50 min-h-[120px] resize-none font-medium"
                />
                <button 
                  onClick={toggleListening}
                  className={`absolute right-5 bottom-5 p-3.5 rounded-2xl transition-all shadow-xl border ${
                    isListening ? 'bg-red-600 border-red-400 text-white animate-pulse' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-orange-500'
                  }`}
                >
                  {isListening ? <MicOff size={22} /> : <Mic size={22} />}
                </button>
              </div>
              <button 
                onClick={() => handleEdit()} 
                disabled={!editPrompt.trim() || isStudioFull}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                {isStudioFull ? <><Loader2 size={18} className="animate-spin" /> Studio Full</> : <><Check size={20} /> Apply Magic Protocol</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DishCard;
