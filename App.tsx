import React, { useState, useEffect, useRef } from 'react';
import { Camera, Settings2, Sliders, Key, Sparkles, Upload, MapPin, Image as ImageIcon, X, AlertTriangle, Download } from 'lucide-react';
import MenuParser from './components/MenuParser';
import DishCard from './components/DishCard';
import { Dish, PhotoStyle, ImageSize, PhotoQuality } from './types';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [style, setStyle] = useState<PhotoStyle>(PhotoStyle.RUSTIC);
  const [size, setSize] = useState<ImageSize>(ImageSize.SIZE_1K);
  const [quality, setQuality] = useState<PhotoQuality>(PhotoQuality.PREMIUM);
  
  // New state for branding/context
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [locationImage, setLocationImage] = useState<string | null>(null);
  
  const [step, setStep] = useState<1 | 2>(1);
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);
  const [showResetConfirmation, setShowResetConfirmation] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState(false);

  // Refs for hidden file inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

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
      isAnalyzing: false,
    }));
    setDishes(newDishes);
    setStep(2);
  };

  const updateDish = (id: string, updates: Partial<Dish>) => {
    setDishes((prev) =>
      prev.map((dish) => (dish.id === id ? { ...dish, ...updates } : dish))
    );
  };

  const requestReset = () => {
    if (step === 2 && dishes.length > 0) {
      setShowResetConfirmation(true);
    } else {
      resetApp();
    }
  };

  const resetApp = () => {
    setDishes([]);
    setStep(1);
    setLogoImage(null);
    setLocationImage(null);
    setShowResetConfirmation(false);
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

  const handleDownloadAll = async () => {
    const generatedDishes = dishes.filter(d => d.imageUrl);
    if (generatedDishes.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      generatedDishes.forEach((dish) => {
        if (dish.imageUrl) {
          // Data URL format: "data:image/png;base64,..."
          const base64Data = dish.imageUrl.split(',')[1];
          // Sanitize filename
          const filename = `${dish.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
          zip.file(filename, base64Data, { base64: true });
        }
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = "menu-photos.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to zip files", error);
      alert("Failed to create zip file.");
    } finally {
      setIsZipping(false);
    }
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
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={logoInputRef} 
        onChange={(e) => handleFileChange(e, setLogoImage)} 
        accept="image/png, image/jpeg, image/webp" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={locationInputRef} 
        onChange={(e) => handleFileChange(e, setLocationImage)} 
        accept="image/png, image/jpeg, image/webp" 
        className="hidden" 
      />

      {/* Confirmation Modal */}
      {showResetConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 rounded-full text-red-500 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Start Over?</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  Are you sure you want to start over? All generated photos and analyses will be lost if you haven't downloaded them.
                </p>
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowResetConfirmation(false)}
                    className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={resetApp}
                    className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors shadow-lg shadow-red-900/20"
                  >
                    Yes, Start Over
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={requestReset}>
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
                onClick={requestReset}
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
            <MenuParser 
              onDishesParsed={handleDishesParsed}
              logoImage={logoImage}
              locationImage={locationImage}
              onLogoChange={setLogoImage}
              onLocationChange={setLocationImage}
            />
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Controls Bar */}
            <div className="mb-8 flex flex-col gap-4">
              
              {/* Top Row: Style & Quality */}
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                
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
                    <Sparkles size={12} />
                    Quality
                  </span>
                  <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                    {Object.values(PhotoQuality).map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuality(q)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                          quality === q
                            ? 'bg-zinc-800 text-orange-400 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                   <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Settings2 size={12} />
                    Resolution
                  </span>
                  <div className="flex items-center gap-2">
                    {Object.values(ImageSize).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                          size === s
                            ? 'border-zinc-500 bg-zinc-800 text-zinc-200'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Customization (Logo & Location) */}
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 w-full">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex-shrink-0">
                    Customization
                  </span>
                  
                  <div className="flex gap-3 flex-1">
                    {/* Logo Button */}
                    <button 
                      onClick={() => !logoImage && logoInputRef.current?.click()}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        logoImage 
                          ? 'bg-orange-900/20 border-orange-500/30 text-orange-400' 
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <ImageIcon size={16} />
                      {logoImage ? 'Logo Added' : 'Add Logo'}
                      {logoImage && (
                        <div 
                          onClick={(e) => { e.stopPropagation(); setLogoImage(null); }}
                          className="ml-2 p-0.5 rounded-full hover:bg-black/20"
                        >
                          <X size={12} />
                        </div>
                      )}
                    </button>

                    {/* Location Button */}
                    <button 
                      onClick={() => !locationImage && locationInputRef.current?.click()}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        locationImage 
                          ? 'bg-orange-900/20 border-orange-500/30 text-orange-400' 
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <MapPin size={16} />
                      {locationImage ? 'Location Set' : 'Add Location Photo'}
                      {locationImage && (
                        <div 
                          onClick={(e) => { e.stopPropagation(); setLocationImage(null); }}
                          className="ml-2 p-0.5 rounded-full hover:bg-black/20"
                        >
                          <X size={12} />
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-3 flex-1">
                     <p className="text-sm text-zinc-400 hidden lg:block">
                       Detected <strong className="text-white">{dishes.length}</strong> items.
                     </p>
                     {dishes.some(d => d.imageUrl) && (
                       <button
                         onClick={handleDownloadAll}
                         disabled={isZipping}
                         className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white disabled:bg-zinc-400 disabled:cursor-not-allowed text-zinc-900 text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-white/5"
                       >
                         {isZipping ? (
                           <span className="animate-spin w-4 h-4 border-2 border-zinc-600 border-t-transparent rounded-full"></span>
                         ) : (
                           <Download size={16} />
                         )}
                         {isZipping ? 'Zipping...' : 'Download All'}
                       </button>
                     )}
                  </div>
                </div>
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
                  currentQuality={quality}
                  logoImage={logoImage}
                  locationImage={locationImage}
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