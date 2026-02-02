import React, { useState, useRef } from 'react';
import { Dish, ImageSize, PhotoStyle, PhotoQuality } from '../types';
import { Edit2, RefreshCw, X, Check, Download, Image as ImageIcon, Maximize2, ScanEye, Upload, LucideIcon, Camera } from 'lucide-react';
import { generateDishImage, editDishImage, analyzeDishNutrition } from '../services/geminiService';

interface DishCardProps {
  dish: Dish;
  currentStyle: PhotoStyle;
  currentSize: ImageSize;
  currentQuality: PhotoQuality;
  logoImage: string | null;
  locationImage: string | null;
  onUpdate: (id: string, updates: Partial<Dish>) => void;
}

const ActionButton = ({ icon: Icon, label, onClick, disabled = false, title }: { icon: LucideIcon, label: string, onClick: (e: React.MouseEvent) => void, disabled?: boolean, title?: string }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(e); }}
    disabled={disabled}
    title={title}
    className="flex items-center justify-start gap-2 px-3 py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg transition-all text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed group/btn w-full"
  >
    <Icon size={14} className="text-zinc-500 group-hover/btn:text-orange-400 transition-colors shrink-0" />
    <span className="truncate">{label}</span>
  </button>
);

const DishCard: React.FC<DishCardProps> = ({ dish, currentStyle, currentSize, currentQuality, logoImage, locationImage, onUpdate }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    onUpdate(dish.id, { isLoading: true, error: undefined, nutritionAnalysis: undefined });
    try {
      const enhancedDescription = `Authentic, delicious ${dish.name}. ${dish.description}. Highlight the key ingredients of ${dish.name}.`;

      const imageUrl = await generateDishImage(
        dish.name, 
        enhancedDescription, 
        currentStyle, 
        currentSize, 
        currentQuality,
        logoImage,
        locationImage,
        dish.referencePhoto 
      );
      onUpdate(dish.id, { imageUrl, isLoading: false });
    } catch (err) {
      onUpdate(dish.id, { isLoading: false, error: "Failed to generate image. Try again." });
    }
  };

  const handleEdit = async () => {
    if (!dish.imageUrl || !editPrompt.trim()) return;
    onUpdate(dish.id, { isEditing: true, error: undefined });
    try {
      const newImageUrl = await editDishImage(dish.imageUrl, editPrompt);
      onUpdate(dish.id, { imageUrl: newImageUrl, isEditing: false, nutritionAnalysis: undefined });
      setIsEditMode(false);
      setEditPrompt('');
    } catch (err) {
      onUpdate(dish.id, { isEditing: false, error: "Failed to edit image." });
    }
  };

  const handleAnalyze = async () => {
    if (!dish.imageUrl) return;
    onUpdate(dish.id, { isAnalyzing: true, error: undefined });
    try {
      const analysis = await analyzeDishNutrition(dish.imageUrl);
      onUpdate(dish.id, { nutritionAnalysis: analysis, isAnalyzing: false });
    } catch (err) {
      onUpdate(dish.id, { isAnalyzing: false, error: "Failed to analyze image." });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate(dish.id, { referencePhoto: reader.result as string, imageUrl: undefined, nutritionAnalysis: undefined, error: undefined });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleDownload = () => {
    if (dish.imageUrl) {
      const link = document.createElement('a');
      link.href = dish.imageUrl;
      link.download = `${dish.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
      <input type="file" ref={cameraInputRef} onChange={handleFileUpload} accept="image/*" capture="environment" className="hidden" />

      {isExpanded && dish.imageUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4" onClick={() => setIsExpanded(false)}>
          <img src={dish.imageUrl} alt={dish.name} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
          <button className="absolute top-4 right-4 p-3 bg-zinc-900/50 text-zinc-400 hover:text-white rounded-full"><X size={24} /></button>
        </div>
      )}

      <div className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-full transition-all hover:border-zinc-700">
        <div className="relative w-full aspect-[4/3] bg-zinc-950 overflow-hidden cursor-pointer" onClick={() => !isEditMode && dish.imageUrl && setIsExpanded(true)}>
          {dish.imageUrl ? (
            <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
          ) : dish.referencePhoto ? (
            <div className="relative w-full h-full">
              <img src={dish.referencePhoto} alt="Reference" className="w-full h-full object-cover opacity-40 grayscale blur-[2px]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-orange-500 font-bold uppercase tracking-widest text-xs gap-2">
                <Camera size={24} />
                Reference Active
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 p-6 text-center border-b border-zinc-800">
              <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
              <span className="text-sm font-medium">Ready to generate</span>
            </div>
          )}

          {(dish.isLoading || dish.isEditing || dish.isAnalyzing) && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mb-3"></div>
              <span className="text-zinc-200 text-sm font-medium animate-pulse">Processing...</span>
            </div>
          )}
        </div>

        {isEditMode && (
          <div className="p-4 bg-zinc-800 border-b border-zinc-700 absolute top-0 left-0 right-0 z-20 shadow-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-orange-400 uppercase flex items-center gap-1"><Edit2 size={12} /> Magic Editor</span>
              <button onClick={() => setIsEditMode(false)} className="text-zinc-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="flex gap-2">
              <input type="text" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="Ex: Add steam..." className="flex-1 bg-zinc-900 border border-zinc-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500" autoFocus />
              <button onClick={handleEdit} disabled={!editPrompt.trim()} className="bg-orange-600 text-white rounded-md px-3 py-2"><Check size={16} /></button>
            </div>
          </div>
        )}

        <div className="p-4 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2 gap-2">
            <h3 className="text-lg font-serif font-semibold text-zinc-100">{dish.name}</h3>
            {dish.referencePhoto && !dish.imageUrl && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">RE-EDIT MODE</span>}
          </div>
          <p className="text-sm text-zinc-400 line-clamp-2 mb-4 flex-grow">{dish.description}</p>
          
          {dish.nutritionAnalysis && (
            <div className="mb-4 text-xs text-zinc-300 bg-zinc-800/50 border border-zinc-700 p-3 rounded-lg"><p className="whitespace-pre-line">{dish.nutritionAnalysis}</p></div>
          )}

          {dish.error && <div className="mb-4 text-xs text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">{dish.error}</div>}

          {!dish.imageUrl && !dish.isLoading ? (
            <div className="flex flex-col gap-2 mt-auto">
               <button onClick={handleGenerate} className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 shadow-lg w-full transition-all active:scale-[0.98]">
                 <RefreshCw size={14} />{dish.referencePhoto ? 'Transform Reference' : 'Generate AI Photo'}
               </button>
               <div className="grid grid-cols-2 gap-2">
                 <button onClick={() => cameraInputRef.current?.click()} className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg border border-zinc-700 flex items-center justify-center gap-2 transition-all">
                   <Camera size={14} />Live Cam
                 </button>
                 <button onClick={() => fileInputRef.current?.click()} className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg border border-zinc-700 flex items-center justify-center gap-2 transition-all">
                   <Upload size={14} />Gallery
                 </button>
               </div>
            </div>
          ) : (
            dish.imageUrl && (
              <div className="mt-auto pt-4 border-t border-zinc-800/50">
                 <div className="grid grid-cols-2 gap-2">
                    <ActionButton icon={RefreshCw} label="Regenerate" onClick={handleGenerate} />
                    <ActionButton icon={Edit2} label="Magic Edit" onClick={() => setIsEditMode(true)} />
                    <ActionButton icon={ScanEye} label="Nutrition" onClick={handleAnalyze} />
                    <ActionButton icon={Camera} label="Take Photo" onClick={() => cameraInputRef.current?.click()} />
                    <ActionButton icon={Download} label="Download" onClick={handleDownload} />
                    <ActionButton icon={Maximize2} label="Fullscreen" onClick={() => setIsExpanded(true)} />
                 </div>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default DishCard;