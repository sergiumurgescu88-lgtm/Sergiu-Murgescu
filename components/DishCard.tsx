
import React, { useState, useRef, useEffect } from 'react';
import { Dish, ImageSize, PhotoStyle, PhotoQuality, AspectRatio } from '../types';
import { 
  Edit2, RefreshCw, X, Check, Download, Image as ImageIcon, 
  Maximize2, ScanEye, Upload, LucideIcon, Camera, Ratio, 
  MapPin, BadgeCheck, Mic, MicOff, Loader2, AlertCircle, 
  Info, Users, Search, ClipboardList, Utensils
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
  disabled = false, 
  isActive = false 
}: { 
  icon: LucideIcon, 
  label: string, 
  onClick: (e: React.MouseEvent) => void, 
  disabled?: boolean, 
  isActive?: boolean 
}) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(e); }}
    disabled={disabled}
    className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg transition-all text-[10px] font-black uppercase tracking-tighter disabled:opacity-30 disabled:cursor-not-allowed group/btn w-full ${
      isActive 
        ? 'bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-[0_0_15px_rgba(234,88,12,0.1)]' 
        : 'bg-zinc-900/40 hover:bg-zinc-800/80 border-zinc-800/50 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 shadow-sm'
    }`}
  >
    <Icon size={14} className={`${isActive ? 'text-orange-500' : 'text-zinc-500 group-hover/btn:text-orange-400'} transition-colors shrink-0`} />
    <span className="truncate">{label}</span>
  </button>
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

const DishCard: React.FC<DishCardProps> = ({ dish, currentStyle, currentSize, currentQuality, logoImage, locationImage, onUpdate, isGenerationLimitReached, onKeyError }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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
      const imageUrl = await generateDishImage(
        dish.name, 
        dish.description, 
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
[PROTOCOL 3: PREP TEAM]
MANDATE: Add a hyper-realistic scene featuring 3-5 miniature human chefs (scale 1:12 to 1:20) actively preparing the dish.
CHARACTERS:
- Realism: Skin texture (pores), natural unique faces, detailed hair, anatomically correct body proportions.
- Clothing: Chef whites with micro-textures, wrinkles, and folds. 
- Roles: Head Chef (supervising), Sous Chef (chopping), Prep Cooks (garnishing/mixing).
TOOLS: Scaled perfectly (1:12-1:20). Metallic reflections, wood grains. Chef knives, whisks, bowls, tongs.
INTERACTION: People must interact physically with ingredients (standing on, touching, mid-motion).
LIGHTING: Match main dish direction. Subsurface scattering on skin. Cast shadows on ingredients.
ZERO-STEAM POLICY.
    `;
    handleEdit(prompt.trim());
  };

  const triggerDetectionSquad = () => {
    const prompt = `
[PROTOCOL 4: DETECTION SQUAD]
MANDATE: Add a hyper-realistic scene featuring miniature investigators (1-2 detectives + 2-4 observers/assistants) analyzing the dish as evidence.
CHARACTERS:
- Realism: 100% photorealistic skin, faces, and clothing (detective coats, lab coats).
- Roles: Lead Detective (magnifying glass), Forensic Specialist (tweezers/vials), Observer (documenting/photographing).
TOOLS: Forensic markers (numbered tents 1-5), cautionary tape, evidence bags, UV flashlights.
LIGHTING: Dramatic noir/investigative. Flashlight beams (volumetric light rays), sharp shadows, rim lighting.
ATMOSPHERE: Clinical focus, mystery.
ZERO-STEAM POLICY.
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

  const isStudioFull = isGenerationLimitReached && !dish.isLoading && !dish.isEditing;
  const activeLogo = dish.logoImage || logoImage;
  const activeLocation = dish.locationImage || locationImage;

  return (
    <>
      <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'ref')} accept="image/*" className="hidden" />
      <input type="file" ref={cameraInputRef} onChange={(e) => handleFileUpload(e, 'ref')} accept="image/*" capture="environment" className="hidden" />
      <input type="file" ref={logoInputRef} onChange={(e) => handleFileUpload(e, 'logo')} accept="image/*" className="hidden" />
      <input type="file" ref={locationInputRef} onChange={(e) => handleFileUpload(e, 'loc')} accept="image/*" className="hidden" />

      {/* Fullscreen View */}
      {isExpanded && dish.imageUrl && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-4 sm:p-12 animate-in fade-in zoom-in-95 duration-300" onClick={() => setIsExpanded(false)}>
          <div className="relative max-w-7xl max-h-full">
            <img src={dish.imageUrl} alt={dish.name} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)]" />
            <div className="absolute -top-16 left-0 right-0 flex justify-between items-center text-white p-4">
              <h2 className="text-2xl font-serif font-bold">{dish.name}</h2>
              <button className="p-3 bg-zinc-900/80 hover:bg-orange-600 rounded-full transition-all backdrop-blur-md border border-white/10 shadow-xl"><X size={28} /></button>
            </div>
            <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-4">
               <button onClick={(e) => { e.stopPropagation(); downloadIndividual(); }} className="flex items-center gap-2 px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest rounded-xl shadow-2xl transition-all">
                 <Download size={20} /> DOWNLOAD HIGH-RES
               </button>
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
            {/* Header */}
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

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar bg-zinc-950/30">
              <div className="space-y-8">
                {/* Dish Identity Section */}
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

                {/* Main Analysis Body */}
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

                {/* Footer Insight */}
                <div className="p-4 bg-zinc-800/20 rounded-xl border border-zinc-800/30 flex gap-3">
                  <Info size={16} className="text-zinc-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-zinc-500 font-medium leading-relaxed italic">
                    Analysis provided by Gemini 3.0 Multimodal Logic. Accuracy is estimated based on visual component recognition and cultural culinary databases.
                  </p>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
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

      <div className={`bg-zinc-900/60 border rounded-[2rem] overflow-hidden shadow-2xl flex flex-col h-full transition-all duration-500 backdrop-blur-sm ${isStudioFull ? 'border-zinc-800 opacity-60' : 'border-zinc-800 hover:border-orange-500/30'}`}>
        {/* Preview Area */}
        <div className="relative w-full aspect-[4/3] bg-zinc-950 overflow-hidden cursor-pointer group" onClick={() => dish.imageUrl && setIsExpanded(true)}>
          {dish.imageUrl ? (
            <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
          ) : dish.referencePhoto ? (
            <div className="relative w-full h-full">
              <img src={dish.referencePhoto} alt="Reference" className="w-full h-full object-cover opacity-20 grayscale" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="px-4 py-1.5 bg-orange-600/20 border border-orange-500/40 text-orange-400 font-black uppercase text-[10px] tracking-widest rounded-full backdrop-blur-sm animate-pulse">Reference Protocol Active</div>
              </div>
            </div>
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
                <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-10"></div>
              </div>
              <span className="text-white text-sm font-black tracking-[0.2em] uppercase mb-2">
                {dish.isLoading ? 'Developing Shoot...' : dish.isEditing ? 'Magic Retouching...' : 'Analyzing Dish...'}
              </span>
              <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest leading-none">
                Applying Michelin Protocol {Math.floor(Math.random() * 19) + 1}
              </p>
            </div>
          )}

          {/* Status Badges */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            {activeLogo && <div className="bg-orange-600/80 backdrop-blur-md text-white p-2 rounded-xl shadow-xl border border-orange-400/30"><BadgeCheck size={16} /></div>}
            {activeLocation && <div className="bg-sky-600/80 backdrop-blur-md text-white p-2 rounded-xl shadow-xl border border-sky-400/30"><MapPin size={16} /></div>}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 flex flex-col flex-grow">
          <div className="mb-6">
            <h3 className="text-2xl font-serif font-bold text-zinc-100 mb-1.5 leading-tight">{dish.name}</h3>
            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed font-medium">{dish.description}</p>
          </div>
          
          {dish.error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex gap-2 text-red-400">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{dish.error}</span>
              </div>
              {dish.error.includes("QUOTA") && (
                <button onClick={() => window.aistudio?.openSelectKey?.()} className="w-full py-2 bg-white text-zinc-950 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-all">Switch to Paid Key</button>
              )}
            </div>
          )}

          {/* Cinematic Studio Grid */}
          <div className="mt-auto space-y-3">
            {/* Primary Action Button */}
            <button 
              onClick={handleGenerate} 
              disabled={isStudioFull || dish.isLoading}
              className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] transition-all shadow-2xl relative overflow-hidden group/main ${
                isStudioFull 
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50' 
                  : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 active:scale-[0.98]'
              }`}
            >
              <RefreshCw size={18} className={dish.isLoading ? 'animate-spin' : 'group-hover/main:rotate-180 transition-transform duration-700'} /> 
              {isStudioFull ? 'Studio Busy' : dish.isLoading ? 'Developing...' : dish.imageUrl ? 'REGENERATE' : 'GENERATE SHOOT'}
            </button>

            {/* Specialist Control Grid (Restored 4x2) */}
            <div className="grid grid-cols-2 gap-2">
              <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} disabled={dish.isLoading} />
              <ActionButton icon={Upload} label="Upload Ref" onClick={() => fileInputRef.current?.click()} isActive={!!dish.referencePhoto} disabled={dish.isLoading} />
              
              <ActionButton icon={Camera} label="Live Ref" onClick={() => cameraInputRef.current?.click()} disabled={dish.isLoading} />
              <ActionButton icon={Edit2} label="Magic Edit" onClick={() => setIsEditMode(true)} disabled={!dish.imageUrl || dish.isLoading} />
              
              <ActionButton icon={BadgeCheck} label="Add Logo" onClick={() => logoInputRef.current?.click()} isActive={!!activeLogo} disabled={dish.isLoading} />
              <ActionButton icon={MapPin} label="Add Loc" onClick={() => locationInputRef.current?.click()} isActive={!!activeLocation} disabled={dish.isLoading} />
              
              <ActionButton icon={ScanEye} label="Nutrition" onClick={handleAnalyze} disabled={!dish.imageUrl || dish.isLoading} />
              <ActionButton icon={Maximize2} label="Fullscreen" onClick={() => setIsExpanded(true)} disabled={!dish.imageUrl} />
            </div>

            {/* Magic Buttons Section */}
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

            {/* Individual Download Asset Button */}
            <button 
              onClick={downloadIndividual}
              disabled={!dish.imageUrl || dish.isLoading}
              className={`w-full mt-2 py-4 border-2 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group/dl shadow-lg ${
                dish.imageUrl 
                  ? 'bg-zinc-950 border-orange-500/60 text-orange-500 hover:bg-orange-500 hover:text-white' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-700 cursor-not-allowed opacity-50'
              }`}
            >
              <Download size={18} className="group-hover/dl:translate-y-0.5 transition-transform" /> DOWNLOAD ASSET
            </button>
          </div>
        </div>
      </div>

      {/* Voice-Powered Magic Edit Modal */}
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
                  placeholder="Ex: Change plate to rustic wood, add scattered herbs, darker lighting..."
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-3xl py-6 pl-6 pr-16 text-sm text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all min-h-[120px] resize-none font-medium leading-relaxed"
                />
                <button 
                  onClick={toggleListening}
                  className={`absolute right-5 bottom-5 p-3.5 rounded-2xl transition-all shadow-xl border ${
                    isListening 
                      ? 'bg-red-600 border-red-400 text-white animate-pulse' 
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-orange-500 hover:border-orange-500/30'
                  }`}
                  title="Use Voice Command (RO/EN)"
                >
                  {isListening ? <MicOff size={22} /> : <Mic size={22} />}
                </button>
              </div>
              <button 
                onClick={() => handleEdit()} 
                disabled={!editPrompt.trim() || isStudioFull}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all shadow-2xl ${
                  isStudioFull 
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white active:scale-[0.98]'
                }`}
              >
                {isStudioFull ? <><Loader2 size={18} className="animate-spin" /> Studio Full</> : <><Check size={20} /> Apply Magic Protocol</>}
              </button>
              <div className="flex items-center justify-center gap-2 text-[9px] text-zinc-600 font-black uppercase tracking-[0.3em] mt-4">
                 <Info size={10} /> 95% Structural Fidelity Mandate
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DishCard;
