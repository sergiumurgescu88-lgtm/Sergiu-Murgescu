
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Settings2, Sliders, Key, Sparkles, Upload, MapPin, Image as ImageIcon, X, AlertTriangle, Download, ExternalLink, Globe, Copy, Check, FileCode, Briefcase, Snowflake, Info, Table, MousePointer2, Rocket, Maximize, Globe2, Loader2, AlertCircle, CreditCard } from 'lucide-react';
import MenuParser from './components/MenuParser';
import DishCard from './components/DishCard';
import Snowfall from './components/Snowfall';
import ChatBot from './components/ChatBot';
import { Dish, PhotoStyle, ImageSize, PhotoQuality, STYLE_TOOLTIPS } from './types';
import JSZip from 'jszip';

const MrDeliveryLogo = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <defs>
      <linearGradient id="topGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4FB9E1" />
        <stop offset="100%" stopColor="#2E3192" />
      </linearGradient>
      <linearGradient id="bottomGrad" x1="100%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#C1272D" />
        <stop offset="100%" stopColor="#F15A24" />
      </linearGradient>
    </defs>
    <g>
      <path d="M20 55 C20 30 40 10 70 10 L80 10 L30 65 L20 55Z" fill="url(#topGrad)" />
      <path d="M80 45 C80 70 60 90 30 90 L20 90 L70 35 L80 45Z" fill="url(#bottomGrad)" />
      <path d="M45 25 L50 30 L35 45 L30 40 Z M52 22 L55 25 M55 19 L58 22 M58 16 L61 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
      <path d="M55 70 C60 65 65 60 62 55 C59 50 54 52 49 57 C44 62 42 67 45 72 C48 77 50 75 55 70 Z" fill="white" opacity="0.9"/>
      <path d="M45 72 L35 82" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
    </g>
  </svg>
);

const App: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  // Priority Style Initialization
  const [style, setStyle] = useState<PhotoStyle>(PhotoStyle.NATURAL_DAYLIGHT);
  const [size, setSize] = useState<ImageSize>(ImageSize.SIZE_1K);
  const [quality, setQuality] = useState<PhotoQuality>(PhotoQuality.PREMIUM);
  const [isSnowing, setIsSnowing] = useState<boolean>(true);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [locationImage, setLocationImage] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);
  const [showResetConfirmation, setShowResetConfirmation] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const activeGenerationsCount = dishes.filter(d => d.isLoading || d.isEditing).length;
  const isGenerationLimitReached = activeGenerationsCount >= 3;

  useEffect(() => { checkApiKey(); }, []);

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
        setGlobalError(null);
      } 
      catch (e) { console.error("Failed to select key", e); }
    }
  };

  const handleDishesParsed = (parsedDishes: { name: string; description: string; referencePhoto?: string }[], referencePhoto?: string) => {
    const newDishes = parsedDishes.map((d) => ({
      ...d,
      id: Math.random().toString(36).substr(2, 9),
      referencePhoto: referencePhoto || d.referencePhoto,
      isLoading: false,
      isEditing: false,
      isAnalyzing: false,
    }));
    setDishes((prev) => [...prev, ...newDishes]);
    setStep(2);
  };

  const updateDish = (id: string, updates: Partial<Dish>) => {
    setDishes((prev) => prev.map((dish) => (dish.id === id ? { ...dish, ...updates } : dish)));
  };

  const requestReset = () => {
    if (step === 2 && dishes.length > 0) setShowResetConfirmation(true);
    else resetApp();
  };

  const resetApp = () => {
    setDishes([]); setStep(1); setLogoImage(null); setLocationImage(null); setShowResetConfirmation(false);
    setGlobalError(null);
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
      link.href = url; link.download = "menu-photos.zip";
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(url);
    } catch (error) { console.error("Failed to zip files", error); } finally { setIsZipping(false); }
  };

  if (checkingKey) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

  if (!apiKeyReady) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col items-center justify-center p-4 text-center">
         <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(255,75,75,0.2)] border border-white/5 mb-10 overflow-hidden backdrop-blur-md relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <MrDeliveryLogo size={100} />
         </div>
         <h1 className="text-5xl font-serif font-bold text-white mb-2 tracking-tight">Virtual<span className="text-orange-500">Photographer</span></h1>
         <p className="text-sm text-zinc-500 mb-8 font-medium uppercase tracking-[0.2em]">Official mrdelivery.online Platform</p>
         
         <div className="max-w-md mb-8 p-6 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-left">
           <h4 className="text-orange-500 font-bold flex items-center gap-2 mb-2"><CreditCard size={18} /> Billing Access Required</h4>
           <p className="text-zinc-400 text-xs leading-relaxed mb-4">
             Gemini 3 Pro and Image models require a paid billing project. If you are seeing quota errors, ensure you have set up a paid plan in your Google Cloud Console.
           </p>
           <a 
             href="https://ai.google.dev/gemini-api/docs/billing" 
             target="_blank" 
             rel="noopener noreferrer" 
             className="text-orange-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:underline"
           >
             Billing Documentation <ExternalLink size={10} />
           </a>
         </div>

         <button onClick={handleSelectKey} className="flex items-center gap-2 px-8 py-4 bg-white text-zinc-900 font-bold rounded-xl hover:bg-zinc-200 transition-all shadow-2xl active:scale-95 group"><Key size={18} className="group-hover:rotate-12 transition-transform" /> Connect Paid Studio</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 selection:bg-orange-500/30 overflow-x-hidden relative">
      {isSnowing && <Snowfall />}
      
      {showResetConfirmation && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">New Shoot?</h3>
            <p className="text-sm text-zinc-400 mb-6">Resetting will clear all current session photos.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowResetConfirmation(false)} className="px-4 py-2 text-sm text-zinc-300">Cancel</button>
              <button onClick={resetApp} className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg">Reset Studio</button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-[150] bg-zinc-950/90 border-b border-zinc-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 cursor-pointer overflow-hidden" onClick={requestReset}>
            <div className="bg-zinc-900 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-zinc-800 flex items-center justify-center shrink-0">
              <MrDeliveryLogo size={24} className="sm:w-7 sm:h-7" />
            </div>
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate max-w-[100px] sm:max-w-none">InstantPhoto</h1>
              <div className="ml-2 sm:ml-3 p-1 sm:p-1.5 bg-sky-950/30 rounded-lg border border-sky-500/20 text-sky-400 shrink-0">
                <Snowflake size={12} className={`sm:w-3.5 sm:h-3.5 ${isSnowing ? 'animate-pulse' : ''}`} onClick={() => setIsSnowing(!isSnowing)} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">
             <button 
               onClick={handleSelectKey}
               className="text-[9px] sm:text-[10px] font-bold text-zinc-500 hover:text-orange-400 flex items-center gap-1.5 sm:gap-2 uppercase tracking-widest transition-colors shrink-0"
               title="Update API Key"
             >
               <Key size={12} className="sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">Switch Studio</span>
             </button>
             <div className="h-4 sm:h-6 w-px bg-zinc-800 shrink-0"></div>
             <a href="https://mrdelivery.online" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 sm:gap-3 text-zinc-200 hover:text-white transition-all font-semibold shrink-0">
               <MrDeliveryLogo size={20} className="sm:w-6 sm:h-6" />
               <span className="tracking-tight text-[11px] sm:text-sm flex items-center gap-1.5">
                 <span className="hidden sm:inline">mrdelivery.online</span>
                 <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black bg-orange-500 text-white border border-orange-400/30 uppercase shadow-[0_0_10px_rgba(234,88,12,0.5)]">Agency</span>
               </span>
             </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12 relative z-10">
        {step === 1 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] sm:min-h-[70vh] animate-in fade-in duration-1000">
            <div className="text-center mb-8 sm:mb-12 max-w-4xl">
              <div className="inline-block px-4 py-1.5 sm:px-5 sm:py-2 mb-6 sm:mb-8 rounded-full bg-zinc-900/80 border border-zinc-800 text-[9px] sm:text-[10px] font-black text-orange-500 tracking-[0.3em] uppercase">
                Powered by MrDelivery AI Agency
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold text-white mb-3 sm:mb-4 leading-tight">Instant Menu Pictures</h1>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif font-medium text-zinc-500/80 mb-6 sm:mb-10 italic">Michelin Style</h2>
              <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-12">
                Turn any text or photo into a stunning menu image, customized with your logo and restaurant decor. Edit dishes to perfection, keep authenticity, and create premium visuals for websites, delivery apps, and social media—without costly professional photographers.
              </p>
            </div>
            <MenuParser onDishesParsed={handleDishesParsed} logoImage={logoImage} locationImage={locationImage} onLogoChange={setLogoImage} onLocationChange={setLocationImage} />
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            {globalError === "quota_exceeded" && (
              <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-orange-500 shrink-0" size={20} />
                  <div>
                    <p className="text-sm font-bold text-white">Billing Restriction Detected (429)</p>
                    <p className="text-[11px] text-zinc-400">Gemini 3 Pro models require a paid billing project. Please switch keys or use "Standard" quality.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[10px] font-bold text-orange-400 hover:underline flex items-center gap-1 uppercase tracking-widest"
                  >
                    Billing Docs <ExternalLink size={10} />
                  </a>
                  <button onClick={handleSelectKey} className="flex-1 sm:flex-none px-4 py-2 bg-white text-zinc-900 text-[10px] font-black uppercase tracking-widest rounded-lg">Switch Key</button>
                </div>
              </div>
            )}

            <div className="mb-10 p-4 sm:p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl sm:rounded-3xl flex flex-col gap-4 sm:gap-6 backdrop-blur-xl shadow-2xl relative overflow-visible">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">Aesthetic Specialist Protocols <span className="text-zinc-600 hidden xs:inline">(Hover for details)</span></span>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Studio Slots: <span className={isGenerationLimitReached ? 'text-orange-500' : 'text-green-500'}>{activeGenerationsCount}/3</span>
                    </span>
                    {isGenerationLimitReached && (
                      <span className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-2 animate-pulse">
                        <Loader2 size={12} className="animate-spin" /> Capacity Reached
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-56 overflow-y-auto p-2 sm:p-4 bg-zinc-950 rounded-xl sm:rounded-2xl border border-zinc-800 custom-scrollbar overflow-visible">
                  {Object.values(PhotoStyle).map((s) => (
                    <div key={s} className="relative group">
                      <button 
                        onClick={() => setStyle(s)} 
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 text-[9px] sm:text-[11px] font-semibold tracking-wide rounded-lg sm:rounded-xl transition-all duration-300 border normal-case whitespace-nowrap ${
                          style === s 
                            ? 'bg-orange-600 border-orange-500 text-white shadow-[0_0_20px_rgba(234,88,12,0.4)] scale-[1.05] z-10' 
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-orange-500/40 hover:scale-[1.03] hover:shadow-[0_0_15px_rgba(234,88,12,0.2)]'
                        }`}
                      >
                        {s}
                      </button>
                      
                      {/* HOVER TOOLTIP */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] pointer-events-none backdrop-blur-md">
                        <div className="text-[11px] text-white font-bold mb-1 border-b border-zinc-800 pb-1">{s}</div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">{STYLE_TOOLTIPS[s]}</p>
                        <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-950 border-r border-b border-zinc-800 transform rotate-45"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 pt-4 border-t border-zinc-800/50">
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 w-full lg:w-auto">
                  <div className="flex flex-col items-center sm:items-start gap-2 w-full sm:w-auto">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">Output Quality</span>
                    <div className="flex bg-zinc-950 p-1 rounded-lg sm:rounded-xl border border-zinc-800 w-full sm:w-auto justify-center">
                      {Object.values(PhotoQuality).map((q) => (
                        <button key={q} onClick={() => setQuality(q)} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${quality === q ? 'bg-zinc-800 text-orange-400 shadow-md' : 'text-zinc-600 hover:text-zinc-300'}`}>{q}</button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-center sm:items-start gap-2 w-full sm:w-auto">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">Resolution</span>
                    <div className="flex bg-zinc-950 p-1 rounded-lg sm:rounded-xl border border-zinc-800 w-full sm:w-auto justify-center">
                      {Object.values(ImageSize).map((s) => (
                        <button key={s} onClick={() => setSize(s)} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${size === s ? 'bg-zinc-800 text-orange-400 shadow-md' : 'text-zinc-600 hover:text-zinc-300'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 w-full lg:w-auto">
                  {dishes.some(d => d.imageUrl) && (
                    <button onClick={handleDownloadAll} disabled={isZipping} className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 bg-white text-zinc-900 text-[11px] sm:text-sm font-black uppercase tracking-widest rounded-xl sm:rounded-2xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95">
                      {isZipping ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} Export Session
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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
                  isGenerationLimitReached={isGenerationLimitReached}
                  onKeyError={() => setGlobalError("quota_exceeded")}
                />
              ))}
            </div>
          </div>
        )}
      </main>
      
      <ChatBot />

      <footer className="py-12 sm:py-20 text-center border-t border-zinc-900/50">
        <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
           <a href="https://mrdelivery.online" className="text-zinc-500 hover:text-orange-500 transition-colors">
              <Globe2 size={20} />
           </a>
        </div>
        <p className="text-zinc-600 text-[8px] sm:text-[10px] font-black tracking-[0.3em] sm:tracking-[0.5em] uppercase px-4">
          &copy; {new Date().getFullYear()} MrDelivery AI Agency • mrdelivery.online
        </p>
      </footer>
    </div>
  );
};

export default App;
