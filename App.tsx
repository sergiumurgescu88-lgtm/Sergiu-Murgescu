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
  
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [locationImage, setLocationImage] = useState<string | null>(null);
  
  const [step, setStep] = useState<1 | 2>(1);
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);
  const [showResetConfirmation, setShowResetConfirmation] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState(false);

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
      }
    }
  };

  const handleDishesParsed = (parsedDishes: { name: string; description: string }[], referencePhoto?: string) => {
    const newDishes = parsedDishes.map((d) => ({
      ...d,
      id: Math.random().toString(36).substr(2, 9),
      referencePhoto: referencePhoto,
      isLoading: false,
      isEditing: false,
      isAnalyzing: false,
    }));
    setDishes((prev) => [...prev, ...newDishes]);
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
          const base64Data = dish.imageUrl.split(',')[1];
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
         <button 
           onClick={handleSelectKey}
           className="flex items-center gap-2 px-6 py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:bg-zinc-200 transition-colors shadow-lg"
         >
           <Key size={18} /> Connect API Key
         </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 selection:bg-orange-500/30">
      <input type="file" ref={logoInputRef} onChange={(e) => handleFileChange(e, setLogoImage)} accept="image/*" className="hidden" />
      <input type="file" ref={locationInputRef} onChange={(e) => handleFileChange(e, setLocationImage)} accept="image/*" className="hidden" />

      {showResetConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Start Over?</h3>
            <p className="text-sm text-zinc-400 mb-6">All generated photos will be lost.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowResetConfirmation(false)} className="px-4 py-2 text-sm text-zinc-300">Cancel</button>
              <button onClick={resetApp} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg">Yes, Start Over</button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={requestReset}>
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white"><Camera size={18} fill="currentColor" /></div>
            <h1 className="text-lg font-serif font-bold text-white leading-none">Instant<span className="text-orange-500">Photo</span></h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
             <span className="hidden sm:block">Gemini 3 Pro Vision</span>
             {step === 2 && <button onClick={requestReset} className="text-zinc-400 hover:text-white">Start Over</button>}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        {step === 1 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-10 max-w-2xl">
              <div className="inline-block px-3 py-1 mb-4 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-orange-500/80">Powered by MrDelivery AI Agency</div>
              <h2 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6 leading-tight">Instant Menu Pictures <br/> <span className="text-zinc-600">Michelin Style</span></h2>
              <p className="text-lg text-zinc-400 max-w-lg mx-auto">Transform your text menu or existing dish photos into high-end visual masterpieces.</p>
            </div>
            <MenuParser onDishesParsed={handleDishesParsed} logoImage={logoImage} locationImage={locationImage} onLogoChange={setLogoImage} onLocationChange={setLocationImage} />
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="mb-8 flex flex-col gap-4">
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"><Sliders size={12} /> Aesthetic</span>
                  <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                    {Object.values(PhotoStyle).map((s) => (
                      <button key={s} onClick={() => setStyle(s)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${style === s ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>{s.split('/')[0]}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                   <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"><Sparkles size={12} /> Quality</span>
                   <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                    {Object.values(PhotoQuality).map((q) => (
                      <button key={q} onClick={() => setQuality(q)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${quality === q ? 'bg-zinc-800 text-orange-400' : 'text-zinc-500 hover:text-zinc-300'}`}>{q}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                   <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"><Settings2 size={12} /> Resolution</span>
                   <div className="flex items-center gap-2">
                    {Object.values(ImageSize).map((s) => (
                      <button key={s} onClick={() => setSize(s)} className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${size === s ? 'border-zinc-500 bg-zinc-800 text-zinc-200' : 'border-zinc-800 text-zinc-500'}`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-between">
                <div className="flex gap-3">
                  <button onClick={() => !logoImage && logoInputRef.current?.click()} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${logoImage ? 'bg-orange-900/20 border-orange-500/30 text-orange-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}><ImageIcon size={16} />{logoImage ? 'Logo Added' : 'Add Logo'}</button>
                  <button onClick={() => !locationImage && locationInputRef.current?.click()} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${locationImage ? 'bg-orange-900/20 border-orange-500/30 text-orange-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}><MapPin size={16} />{locationImage ? 'Location Set' : 'Add Location'}</button>
                </div>
                {dishes.some(d => d.imageUrl) && (
                  <button onClick={handleDownloadAll} disabled={isZipping} className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 text-sm font-semibold rounded-lg shadow-lg">
                    {isZipping ? <span className="animate-spin w-4 h-4 border-2 border-zinc-600 border-t-transparent rounded-full"></span> : <Download size={16} />} Download All
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} currentStyle={style} currentSize={size} currentQuality={quality} logoImage={logoImage} locationImage={locationImage} onUpdate={updateDish} />
              ))}
            </div>
          </div>
        )}
      </main>
      <footer className="py-8 text-center text-zinc-600 text-sm"><p>&copy; {new Date().getFullYear()} InstantPhoto by MrDelivery AI Agency.</p></footer>
    </div>
  );
};

export default App;