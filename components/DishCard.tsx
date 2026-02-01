import React, { useState, useRef } from 'react';
import { Dish, ImageSize, PhotoStyle, PhotoQuality } from '../types';
import { Edit2, RefreshCw, X, Check, Download, Image as ImageIcon, Maximize2, ScanEye, Upload, LucideIcon } from 'lucide-react';
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

  const handleGenerate = async () => {
    onUpdate(dish.id, { isLoading: true, error: undefined, nutritionAnalysis: undefined });
    try {
      // Enhance the description to include specific details from the name to ensure better adherence
      const enhancedDescription = `Authentic, delicious ${dish.name}. ${dish.description}. Highlight the key ingredients of ${dish.name}.`;

      const imageUrl = await generateDishImage(
        dish.name, 
        enhancedDescription, 
        currentStyle, 
        currentSize, 
        currentQuality,
        logoImage,
        locationImage
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
      // Reset nutrition analysis when image changes
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
        // Reset analysis when new image uploaded
        onUpdate(dish.id, { imageUrl: reader.result as string, nutritionAnalysis: undefined, error: undefined });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // Reset input
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
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/png, image/jpeg, image/webp" 
        className="hidden" 
      />

      {/* Lightbox Modal */}
      {isExpanded && dish.imageUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative w-full h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={dish.imageUrl} 
              alt={dish.name} 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            />
            
            <button 
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 p-3 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors backdrop-blur-sm border border-white/10"
            >
              <X size={24} />
            </button>

            <div className="absolute bottom-8 px-6 py-3 bg-zinc-900/80 backdrop-blur-md rounded-full text-white text-sm border border-white/10 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-500">
              <span className="font-serif font-semibold text-orange-400">{dish.name}</span>
              <span className="w-1 h-1 bg-zinc-500 rounded-full"></span>
              <span className="text-zinc-300">{currentStyle.split('/')[0]}</span>
              <span className="w-1 h-1 bg-zinc-500 rounded-full"></span>
              <span className="text-zinc-400 font-mono text-xs border border-zinc-700 px-1.5 py-0.5 rounded">{currentSize}</span>
              <span className="w-1 h-1 bg-zinc-500 rounded-full"></span>
              <span className="text-orange-400 text-xs font-semibold uppercase tracking-wider">{currentQuality}</span>
            </div>
          </div>
        </div>
      )}

      <div className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg transition-all hover:border-zinc-700 hover:shadow-2xl flex flex-col h-full">
        {/* Image Area */}
        <div className="relative w-full aspect-[4/3] bg-zinc-950 overflow-hidden cursor-pointer" onClick={() => !isEditMode && dish.imageUrl && setIsExpanded(true)}>
          {dish.imageUrl ? (
            <img 
              src={dish.imageUrl} 
              alt={dish.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 p-6 text-center border-b border-zinc-800">
              <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
              <span className="text-sm font-medium">Ready to generate</span>
            </div>
          )}

          {/* Loading Overlay */}
          {(dish.isLoading || dish.isEditing || dish.isAnalyzing) && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 cursor-default">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mb-3"></div>
              <span className="text-zinc-200 text-sm font-medium animate-pulse">
                {dish.isAnalyzing ? 'Analyzing nutrition...' : dish.isEditing ? 'Refining with AI...' : 'Developing photo...'}
              </span>
            </div>
          )}

          {/* Fullscreen Hint Overlay (only on hover) */}
          {dish.imageUrl && !isEditMode && !dish.isLoading && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/50 backdrop-blur-sm p-1.5 rounded-lg text-white/80">
                <Maximize2 size={14} />
              </div>
            </div>
          )}
        </div>

        {/* Edit Mode Input */}
        {isEditMode && (
          <div className="p-4 bg-zinc-800 border-b border-zinc-700 absolute top-0 left-0 right-0 z-20 shadow-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                <Edit2 size={12} /> Magic Editor
              </span>
              <button onClick={() => setIsEditMode(false)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Ex: Add steam, brighter light..."
                className="flex-1 bg-zinc-900 border border-zinc-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-zinc-500"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
              />
              <button 
                onClick={handleEdit}
                disabled={!editPrompt.trim()}
                className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md px-3 py-2"
              >
                <Check size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2 gap-2">
            <h3 className="text-lg font-serif font-semibold text-zinc-100 leading-tight">{dish.name}</h3>
            {currentQuality === PhotoQuality.PREMIUM && !dish.imageUrl && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 whitespace-nowrap">PREMIUM</span>
            )}
          </div>
          <p className="text-sm text-zinc-400 line-clamp-2 mb-4 flex-grow">{dish.description}</p>
          
          {dish.nutritionAnalysis && (
            <div className="mb-4 text-xs text-zinc-300 bg-zinc-800/50 border border-zinc-700 p-3 rounded-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-1.5 text-orange-400 mb-2 font-semibold uppercase tracking-wider text-[10px]">
                <ScanEye size={12} />
                Nutrition AI Analysis
              </div>
              <p className="whitespace-pre-line leading-relaxed">{dish.nutritionAnalysis}</p>
            </div>
          )}

          {dish.error && (
            <div className="mb-4 text-xs text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">
              {dish.error}
            </div>
          )}

          {!dish.imageUrl && !dish.isLoading ? (
            <div className="w-full mt-auto grid grid-cols-2 gap-2">
               <button 
                onClick={handleGenerate}
                className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 active:scale-95"
              >
                <RefreshCw size={14} />
                Generate
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm font-medium rounded-lg transition-colors border border-zinc-700 flex items-center justify-center gap-2"
                title="Upload custom photo"
              >
                <Upload size={14} />
                Upload
              </button>
            </div>
          ) : (
            dish.imageUrl && (
              <div className="mt-auto pt-4 border-t border-zinc-800/50">
                 <div className="grid grid-cols-2 gap-2">
                    <ActionButton icon={RefreshCw} label="Regenerate" onClick={handleGenerate} title="Create a new version" />
                    <ActionButton icon={Edit2} label="Magic Edit" onClick={() => setIsEditMode(true)} title="Modify image with AI" />
                    <ActionButton icon={ScanEye} label="Nutrition" onClick={handleAnalyze} title="Get calorie breakdown" />
                    <ActionButton icon={Upload} label="Upload" onClick={() => fileInputRef.current?.click()} title="Replace with own photo" />
                    <ActionButton icon={Download} label="Download" onClick={handleDownload} title="Save to computer" />
                    <ActionButton icon={Maximize2} label="Fullscreen" onClick={() => setIsExpanded(true)} title="View larger" />
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