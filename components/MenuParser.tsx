import React, { useState, useRef, useEffect } from 'react';
import { MenuAnalysisResult } from '../types';
import { parseMenuText } from '../services/geminiService';
import { Sparkles, ArrowRight, Loader2, Image as ImageIcon, MapPin, X, FileSpreadsheet, Camera, Upload, Images, Mic, MicOff } from 'lucide-react';
import * as XLSX from 'xlsx';

interface MenuParserProps {
  onDishesParsed: (dishes: MenuAnalysisResult['dishes'], referencePhoto?: string) => void;
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
  const [interimText, setInterimText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const lastProcessedIndex = useRef<number>(-1);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true; 
      recognitionRef.current.lang = 'ro-RO'; 
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            if (i > lastProcessedIndex.current) {
              finalTranscript += transcriptPart;
              lastProcessedIndex.current = i;
            }
          } else {
            currentInterim += transcriptPart;
          }
        }

        if (finalTranscript) {
          setText(prev => {
            const separator = prev.length > 0 && !prev.endsWith('\n') ? '\n' : '';
            return prev + separator + finalTranscript.trim();
          });
        }
        setInterimText(currentInterim);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setInterimText('');
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        setInterimText('');
        lastProcessedIndex.current = -1;
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        setInterimText('');
        lastProcessedIndex.current = -1;
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start recognition', err);
        recognitionRef.current?.stop();
        setTimeout(() => {
           try { recognitionRef.current?.start(); setIsListening(true); } catch(e) {}
        }, 200);
      }
    }
  };

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
    e.target.value = '';
  };

  const handlePhotoReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onDishesParsed([{ 
        name: "Reference Dish", 
        description: "Re-edited version of the uploaded reference photo with 90% similarity and Michelin aesthetic." 
      }], reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (files.length > 9) {
      alert("Maximum 9 images allowed for bulk upload.");
      return;
    }
    
    const validFiles = files.filter(f => f.size <= 4 * 1024 * 1024);
    if (validFiles.length < files.length) {
      alert("Some images were skipped because they exceed 4MB size limit.");
    }
    
    if (validFiles.length === 0) return;
    
    setIsProcessingBulk(true);
    
    const promises = validFiles.map(file => new Promise<{name: string, description: string, referencePhoto: string}>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dishName = file.name.split('.')[0].replace(/[-_]/g, ' ') || "Uploaded Dish";
        resolve({
          name: dishName,
          description: "Reference photo uploaded by user. 91% similarity requested.",
          referencePhoto: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }));
    
    Promise.all(promises).then(dishes => {
      onDishesParsed(dishes);
      setIsProcessingBulk(false);
    });
    
    e.target.value = '';
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Use objects to map headers automatically
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
      let newText = "";
      
      jsonData.forEach((row) => {
        const keys = Object.keys(row);
        
        // Find the specific headers requested by user: 'Denuire preparat' and 'Descriere'
        // We look for variations including typos (Denuire vs Denumire)
        const nameKey = keys.find(k => 
          k.toLowerCase().includes('denuire') || 
          k.toLowerCase().includes('denumire') || 
          k.toLowerCase().includes('preparat')
        );
        const descKey = keys.find(k => 
          k.toLowerCase().includes('descriere')
        );

        if (nameKey && row[nameKey]) {
          const name = String(row[nameKey]).trim();
          const desc = descKey ? String(row[descKey]).trim() : "";
          
          // Skip the header itself if it was somehow included in data rows
          if (name && !name.toLowerCase().includes('denuire preparat') && !name.toLowerCase().includes('denumire preparat')) {
            newText += `${name}: ${desc}\n`;
          }
        }
      });

      // Fallback: If no headers matched, try positional index (assuming Col B and C are often index 0/1 or 1/2)
      if (!newText.trim()) {
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (row && row.length >= 2) {
            // Find first two non-empty columns
            const filtered = row.filter(val => val !== undefined && val !== null && val !== "");
            if (filtered.length >= 2) {
              newText += `${filtered[0]}: ${filtered[1]}\n`;
            }
          }
        }
      }

      if (newText.trim()) {
        setText(prev => (prev.trim() ? prev + '\n' + newText : newText));
      } else {
        alert("No valid menu data found in the spreadsheet. Please ensure columns are named 'Denuire preparat' and 'Descriere'.");
      }
    } catch (error) {
      console.error("Excel import error:", error);
      alert("Failed to read Excel file. Please check the file format.");
    }
    e.target.value = '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-zinc-900/40 border border-zinc-800/60 rounded-[2.5rem] p-4 shadow-2xl backdrop-blur-md">
      <input type="file" ref={logoInputRef} onChange={(e) => handleFileChange(e, onLogoChange)} accept="image/*" className="hidden" />
      <input type="file" ref={locationInputRef} onChange={(e) => handleFileChange(e, onLocationChange)} accept="image/*" className="hidden" />
      <input type="file" ref={excelInputRef} onChange={handleExcelUpload} accept=".xlsx, .xls, .csv" className="hidden" />
      <input type="file" ref={photoInputRef} onChange={handlePhotoReferenceUpload} accept="image/*" className="hidden" />
      <input type="file" ref={cameraInputRef} onChange={handlePhotoReferenceUpload} accept="image/*" capture="environment" className="hidden" />
      <input type="file" ref={bulkInputRef} onChange={handleBulkUpload} accept="image/*" multiple className="hidden" />

      <div className="p-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 font-sans font-bold text-xs">
            1
          </div>
          <h3 className="text-2xl font-serif font-semibold text-white">Upload Menu</h3>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button 
            onClick={() => logoInputRef.current?.click()}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${logoImage ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-zinc-200'}`}
          >
            <ImageIcon size={14} /> Logo
            {logoImage && <X size={10} className="ml-1" onClick={(e) => { e.stopPropagation(); onLogoChange(null); }} />}
          </button>
          
          <button 
            onClick={() => locationInputRef.current?.click()}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${locationImage ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-zinc-200'}`}
          >
            <MapPin size={14} /> Location
            {locationImage && <X size={10} className="ml-1" onClick={(e) => { e.stopPropagation(); onLocationChange(null); }} />}
          </button>

          <button 
            onClick={() => bulkInputRef.current?.click()}
            disabled={isProcessingBulk}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${isProcessingBulk ? 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-zinc-200'}`}
            title="Upload up to 9 real dish photos (Max 4MB each)"
          >
            {isProcessingBulk ? <Loader2 size={14} className="animate-spin" /> : <Images size={14} />} 
            Bulk Photos
          </button>

          <button 
            onClick={toggleListening}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-[11px] font-bold transition-all ml-auto group/voice shadow-lg active:scale-95 ${
              isListening 
                ? 'bg-red-600 border-red-500 text-white animate-pulse' 
                : 'bg-gradient-to-r from-orange-600/20 to-red-600/20 hover:from-orange-600/40 hover:to-red-600/40 border-orange-500/30 text-orange-400'
            }`}
          >
            {isListening ? <MicOff size={14} /> : <Mic size={14} className="group-hover/voice:scale-110 transition-transform" />}
            {isListening ? 'Stop Voice' : 'Use Voice'}
          </button>
        </div>
        
        <div className="relative mb-8">
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or speak your menu... e.g. 'Pizza Diavola: Salam picant, mozzarella...'"
              className="w-full h-48 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl p-6 text-zinc-300 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-orange-500/30 resize-none transition-all"
            />
            {isListening && interimText && (
              <div className="absolute top-6 left-6 right-16 pointer-events-none">
                <p className="text-orange-500/50 font-medium italic animate-pulse">
                  {interimText}
                </p>
              </div>
            )}
          </div>
          <button 
            onClick={toggleListening}
            className={`absolute right-4 bottom-4 p-3 rounded-full shadow-lg transition-all z-10 ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
            title="Dictate menu items (RO/EN)"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => excelInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-3 py-4 px-6 bg-zinc-800/40 hover:bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 text-xs font-black uppercase tracking-widest rounded-2xl transition-all"
          >
            <FileSpreadsheet size={16} /> Import Excel
          </button>
          
          <button
            onClick={handleAnalyze}
            disabled={!text.trim() || isAnalyzing}
            className="flex-1 flex items-center justify-center gap-3 py-4 px-6 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-orange-950/20"
          >
            {isAnalyzing ? (
              <><Loader2 className="animate-spin" size={16} /> Parsing...</>
            ) : (
              <><Sparkles size={16} /> Process Menu</>
            )}
          </button>
        </div>
        
        <div className="mt-4 flex justify-center">
          <button 
            onClick={() => cameraInputRef.current?.click()}
            className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-orange-400 transition-colors flex items-center gap-2"
          >
            <Camera size={12} /> Or capture live dish
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuParser;