import React, { useState, useEffect } from 'react';
import { Camera, Settings2, Sliders, Key } from 'lucide-react';
import MenuParser from './components/MenuParser';
import DishCard from './components/DishCard';
import { Dish, PhotoStyle, ImageSize } from './types';

const App: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [style, setStyle] = useState<PhotoStyle>(PhotoStyle.RUSTIC);
  const [size, setSize] = useState<ImageSize>(ImageSize.SIZE_1K);
  const [step, setStep] = useState<1 | 2>(1);
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setApiKeyReady(hasKey);
    } else {
      // Fallback for environments where aistudio might not be injected immediately or at all
      setApiKeyReady(true);
    }
    setCheckingKey(false);
  };

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      try {
        await window.aistudio.openSelectKey();
        setApiKeyReady(true);
      } catch (e) {
        console.error("Failed to select key", e);
        // If selection fails or is cancelled, we don't set ready to true
      }
    }
  };

  const handleDishesParsed = (parsedDishes: { name: string; description: string }[]) => {
    const newDishes = parsedDishes.map((d) => ({
      ...d,
      id: Math.random().toString(36).substr(2, 9),
      isLoading: false,
      isEditing: false,
    }));
    setDishes(newDishes);
    setStep(2);
  };

  const updateDish = (id: string, updates: Partial<Dish>) => {
    setDishes((prev) =>
      prev.map((dish) => (dish.id === id ? { ...dish, ...updates } : dish))
    );
  };

  const resetApp = () => {
    setDishes([]);
    setStep(1);
  };

  if (checkingKey) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!apiKeyReady) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col items-center justify-center p-4">
         <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-600/20 mb-8">
            <Camera size={32} fill="currentColor" />
         </div>
         <h1 className="text-4xl font-serif font-bold text-white mb-2 text-center">
            Instant<span className="text-orange-500">Photo</span>
         </h1>
         <p className="text-sm text-zinc-500 mb-8 font-medium">Powered by MrDelivery AI Agency</p>
         
         <p className="text-zinc-400 max-w-md text-center mb-8">
           To generate high-quality food photography with Gemini 3 Pro Vision, please connect a Google Cloud Project with a valid API key.
         </p>
         <button 
           onClick={handleSelectKey}
           className="flex items-center gap-2 px-6 py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
         >
           <Key size={18} />
           Connect API Key
         </button>
         <p className="mt-8 text-xs text-zinc-600">
           See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-zinc-400">billing documentation</a> for details.
         </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 selection:bg-orange-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
              <Camera size={18} fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-serif font-bold tracking-tight text-white leading-none">
                Instant<span className="text-orange-500">Photo</span>
              </h1>
              <span className="text-[10px] text-zinc-500 font-medium tracking-wide leading-none mt-0.5">by MrDelivery AI Agency</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
             <span className="hidden sm:block">Gemini 3 Pro Vision</span>
             {step === 2 && (
               <button 
                onClick={resetApp}
                className="text-zinc-400 hover:text-white transition-colors"
               >
                 Start Over
               </button>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        {step === 1 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-10 max-w-2xl">
              <div className="inline-block px-3 py-1 mb-4 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-orange-500/80">
                Powered by MrDelivery AI Agency
              </div>
              <h2 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6 leading-tight">
                Instant Menu Pictures <br/> <span className="text-zinc-600">Michelin Style</span>
              </h2>
              <p className="text-lg text-zinc-400 max-w-lg mx-auto">
                Transform your text menu into a high-end visual portfolio in seconds using next-gen AI.
              </p>
            </div>
            <MenuParser onDishesParsed={handleDishesParsed} />
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Controls Bar */}
            <div className="mb-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={12} />
                  Aesthetic
                </span>
                <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                  {Object.values(PhotoStyle).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        style === s
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                      }`}
                    >
                      {s.split('/')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                 <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings2 size={12} />
                  Output Quality
                </span>
                <div className="flex items-center gap-2">
                  {Object.values(ImageSize).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                        size === s
                          ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hidden md:block w-px h-10 bg-zinc-800 mx-2"></div>

              <div className="text-right flex-1">
                 <p className="text-sm text-zinc-400">
                   Detected <strong className="text-white">{dishes.length}</strong> items from your menu.
                 </p>
                 <p className="text-xs text-zinc-600 mt-1">
                   Select a style and click generate on items.
                 </p>
              </div>

            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dishes.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  currentStyle={style}
                  currentSize={size}
                  onUpdate={updateDish}
                />
              ))}
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="py-8 text-center text-zinc-600 text-sm">
        <p>&copy; {new Date().getFullYear()} InstantPhoto by MrDelivery AI Agency.</p>
      </footer>
    </div>
  );
};

export default App;