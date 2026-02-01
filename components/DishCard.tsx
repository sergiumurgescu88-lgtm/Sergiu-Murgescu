import React, { useState } from 'react';
import { Dish, ImageSize, PhotoStyle } from '../types';
import { Edit2, RefreshCw, X, Check, Download, Image as ImageIcon, Maximize2 } from 'lucide-react';
import { generateDishImage, editDishImage } from '../services/geminiService';

interface DishCardProps {
  dish: Dish;
  currentStyle: PhotoStyle;
  currentSize: ImageSize;
  onUpdate: (id: string, updates: Partial<Dish>) => void;
}

const DishCard: React.FC<DishCardProps> = ({ dish, currentStyle, currentSize, onUpdate }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleGenerate = async () => {
    onUpdate(dish.id, { isLoading: true, error: undefined });
    try {
      const imageUrl = await generateDishImage(dish.name, dish.description, currentStyle, currentSize);
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
      onUpdate(dish.id, { imageUrl: newImageUrl, isEditing: false });
      setIsEditMode(false);
      setEditPrompt('');
    } catch (err) {
      onUpdate(dish.id, { isEditing: false, error: "Failed to edit image." });
    }
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
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 p-6 text-center border-b border-zinc-800">
              <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
              <span className="text-sm font-medium">Ready to generate</span>
            </div>
          )}

          {/* Loading Overlay */}
          {(dish.isLoading || dish.isEditing) && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 cursor-default">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mb-3"></div>
              <span className="text-zinc-200 text-sm font-medium animate-pulse">
                {dish.isEditing ? 'Refining with AI...' : 'Developing photo...'}
              </span>
            </div>
          )}

          {/* Action Overlay (Visible on Hover if image exists) */}
          {dish.imageUrl && !isEditMode && !dish.isLoading && !dish.isEditing && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors border border-white/5"
                title="View Fullscreen"
              >
                <Maximize2 size={20} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditMode(true); }}
                className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors border border-white/5"
                title="Edit with AI"
              >
                <Edit2 size={20} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors border border-white/5"
                title="Download"
              >
                <Download size={20} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleGenerate(); }}
                className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors border border-white/5"
                title="Regenerate"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Edit Mode Input */}
        {isEditMode && (
          <div className="p-4 bg-zinc-800 border-b border-zinc-700 absolute top-0 left-0 right-0 z-20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Magic Editor</span>
              <button onClick={() => setIsEditMode(false)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="e.g. Add steam, make it brighter..."
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
        <div className="p-5 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-serif font-semibold text-zinc-100 leading-tight">{dish.name}</h3>
          </div>
          <p className="text-sm text-zinc-400 line-clamp-2 mb-4 flex-grow">{dish.description}</p>
          
          {dish.error && (
            <div className="mb-4 text-xs text-red-400 bg-red-400/10 p-2 rounded">
              {dish.error}
            </div>
          )}

          {!dish.imageUrl && !dish.isLoading && (
            <button 
              onClick={handleGenerate}
              className="w-full mt-auto py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 border border-zinc-700"
            >
              <RefreshCw size={14} />
              Generate Photo
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default DishCard;