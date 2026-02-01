import React, { useState } from 'react';
import { MenuAnalysisResult } from '../types';
import { parseMenuText } from '../services/geminiService';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

interface MenuParserProps {
  onDishesParsed: (dishes: MenuAnalysisResult['dishes']) => void;
}

const MenuParser: React.FC<MenuParserProps> = ({ onDishesParsed }) => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const sampleMenu = `Starters:
- Truffle Arancini: Crispy risotto balls with black truffle oil and parmesan dust.
- Burrata Caprese: Fresh burrata cheese, heirloom tomatoes, basil pesto, balsamic glaze.

Mains:
- Wagyu Beef Burger: Brioche bun, caramelized onions, gruyere, truffle mayo.
- Pan-Seared Scallops: Cauliflower puree, crispy pancetta, lemon butter sauce.`;

  return (
    <div className="w-full max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-1 shadow-2xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-medium text-white flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 text-orange-500">
              1
            </span>
            Upload Menu
          </h2>
          <button 
            onClick={() => setText(sampleMenu)}
            className="text-xs text-zinc-500 hover:text-orange-400 transition-colors underline"
          >
            Load Sample
          </button>
        </div>
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your menu here... e.g. 'Avocado Toast: Sourdough bread, poached egg, chili flakes...'"
          className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none transition-all"
        />
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