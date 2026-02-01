import React, { useState, useRef } from 'react';
import { MenuAnalysisResult } from '../types';
import { parseMenuText } from '../services/geminiService';
import { Sparkles, ArrowRight, Loader2, Image as ImageIcon, MapPin, X, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface MenuParserProps {
  onDishesParsed: (dishes: MenuAnalysisResult['dishes']) => void;
  logoImage: string | null;
  locationImage: string | null;
  onLogoChange: (image: string | null) => void;
  onLocationChange: (image: string | null) => void;
}

const MenuParser: React.FC<MenuParserProps> = ({ 
  onDishesParsed, 
  logoImage, 
  locationImage, 
  onLogoChange, 
  onLocationChange 
}) => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await parseMenuText(text);
      onDishesParsed(result.dishes);
    } catch (error) {
      alert("Could not parse menu. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Get data as array of arrays
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      let newText = "";
      
      // Skip header row if it looks like headers, otherwise process all
      let startIndex = 0;
      if (jsonData.length > 0 && jsonData[0].length > 0) {
         const firstCell = String(jsonData[0][0]).toLowerCase();
         if (firstCell.includes('name') || firstCell.includes('dish') || firstCell.includes('item')) {
            startIndex = 1;
         }
      }

      for (let i = startIndex; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row && row.length > 0) {
          const name = row[0]; // Assume first column is name
          const desc = row[1] || ""; // Assume second column is description
          
          if (name) {
            newText += `${name}: ${desc}\n`;
          }
        }
      }

      if (newText.trim()) {
        setText((prev) => (prev ? prev + "\n" + newText : newText));
      } else {
        alert("No readable data found in the Excel file. Please ensure column A has dish names.");
      }

    } catch (error) {
      console.error("Error parsing Excel:", error);
      alert("Failed to read Excel file. Please try a different file.");
    } finally {
      setIsParsingExcel(false);
      // Reset input
      e.target.value = '';
    }
  };

  const sampleMenu = `Starters:
- Truffle Arancini: Crispy risotto balls with black truffle oil and parmesan dust.
- Burrata Caprese: Fresh burrata cheese, heirloom tomatoes, basil pesto, balsamic glaze.

Mains:
- Wagyu Beef Burger: Brioche bun, caramelized onions, gruyere, truffle mayo.
- Pan-Seared Scallops: Cauliflower puree, crispy pancetta, lemon butter sauce.`;

  return (
    <div className="w-full max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-1 shadow-2xl">
      <input 
        type="file" 
        ref={logoInputRef} 
        onChange={(e) => handleFileChange(e, onLogoChange)} 
        accept="image/png, image/jpeg, image/webp" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={locationInputRef} 
        onChange={(e) => handleFileChange(e, onLocationChange)} 
        accept="image/png, image/jpeg, image/webp" 
        className="hidden" 
      />
      <input
        type="file"
        ref={excelInputRef}
        onChange={handleExcelUpload}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <h2 className="text-xl font-serif font-medium text-white flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 text-orange-500">
              1
            </span>
            Upload Menu
          </h2>
          
          <div className="flex items-center gap-2 self-end sm:self-auto">
             {/* Logo Upload Button */}
             <button 
               onClick={() => !logoImage && logoInputRef.current?.click()}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                 logoImage 
                   ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
                   : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
               }`}
             >
               <ImageIcon size={14} />
               {logoImage ? 'Logo Added' : 'Logo'}
               {logoImage && (
                 <div 
                   onClick={(e) => { e.stopPropagation(); onLogoChange(null); }}
                   className="ml-1 p-0.5 rounded-full hover:bg-black/20 cursor-pointer"
                 >
                   <X size={10} />
                 </div>
               )}
             </button>

             {/* Location Upload Button */}
             <button 
               onClick={() => !locationImage && locationInputRef.current?.click()}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                 locationImage 
                   ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
                   : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
               }`}
             >
               <MapPin size={14} />
               {locationImage ? 'Location Set' : 'Location'}
               {locationImage && (
                 <div 
                   onClick={(e) => { e.stopPropagation(); onLocationChange(null); }}
                   className="ml-1 p-0.5 rounded-full hover:bg-black/20 cursor-pointer"
                 >
                   <X size={10} />
                 </div>
               )}
             </button>

            <div className="h-4 w-px bg-zinc-800 mx-1 hidden sm:block"></div>

            <button 
              onClick={() => setText(sampleMenu)}
              className="text-xs text-zinc-500 hover:text-orange-400 transition-colors underline whitespace-nowrap"
            >
              Load Sample
            </button>
          </div>
        </div>
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your menu here... e.g. 'Avocado Toast: Sourdough bread, poached egg, chili flakes...'"
          className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none transition-all mb-4"
        />

        <div 
          onClick={() => excelInputRef.current?.click()}
          className="group w-full border border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/30 rounded-xl p-3 flex items-center justify-center cursor-pointer transition-all"
        >
          {isParsingExcel ? (
            <div className="flex items-center gap-2 text-zinc-400">
               <Loader2 className="animate-spin" size={16} />
               <span className="text-sm">Reading Excel file...</span>
            </div>
          ) : (
             <div className="flex items-center gap-2 text-zinc-500 group-hover:text-zinc-300">
               <FileSpreadsheet size={16} />
               <span className="text-sm font-medium">Or upload Excel file (Name, Description)</span>
             </div>
          )}
        </div>

      </div>
      
      <div className="bg-zinc-800/50 p-4 rounded-b-xl flex justify-end border-t border-zinc-800">
        <button
          onClick={handleAnalyze}
          disabled={!text.trim() || isAnalyzing}
          className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-all shadow-lg shadow-orange-900/20 active:scale-95"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Analyzing Menu...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Process Dishes
              <ArrowRight size={18} className="opacity-60" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MenuParser;