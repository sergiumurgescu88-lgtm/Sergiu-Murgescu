import React, { useState, useEffect, useRef } from 'react';
import { Camera, Settings2, Sliders, Key, Sparkles, Upload, MapPin, Image as ImageIcon, X, AlertTriangle, Download, ExternalLink, Globe, Copy, Check, FileCode, Briefcase, Snowflake, Info, Table, MousePointer2 } from 'lucide-react';
import MenuParser from './components/MenuParser';
import DishCard from './components/DishCard';
import Snowfall from './components/Snowfall';
import { Dish, PhotoStyle, ImageSize, PhotoQuality } from './types';
import JSZip from 'jszip';

// High-fidelity SVG recreation of the 3D glossy logo from your screenshot
const InstantPhotoLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-lg">
    <defs>
      <linearGradient id="blueGloss" x1="10" y1="10" x2="60" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#87CEEB" />
        <stop offset="50%" stopColor="#4169E1" />
        <stop offset="100%" stopColor="#2E3192" />
      </linearGradient>
      <linearGradient id="redGloss" x1="90" y1="90" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FF4B8B" />
        <stop offset="50%" stopColor="#DC143C" />
        <stop offset="100%" stopColor="#800020" />
      </linearGradient>
      <filter id="gloss" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
        <feOffset in="blur" dx="1" dy="1" result="offset" />
        <feComposite in="SourceGraphic" in2="offset" operator="over" />
      </filter>
    </defs>
    <g filter="url(#gloss)">
      <path d="M50 5 C25.1 5 5 25.1 5 50 C5 54.2 5.6 58.3 6.6 62.1 L45 42 L12 25 L45 8 L60 35 L50 5Z" fill="url(#blueGloss)" />
      <path d="M50 95 C74.9 95 95 74.9 95 50 C95 45.8 94.4 41.7 93.4 37.9 L55 58 L88 75 L55 92 L40 65 L50 95Z" fill="url(#redGloss)" />
      <path d="M7 62 L45 42 L55 58 L93 38" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

const MrDeliveryLogo = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <circle cx="50" cy="50" r="48" fill="white" />
    <path d="M50 2C23.5 2 2 23.5 2 50C2 53.7 2.4 57.3 3.2 60.7L38 43L20 30L45 15L55 35L50 2Z" fill="#4169E1" />
    <path d="M50 98C76.5 98 98 76.5 98 50C98 46.3 97.6 42.7 96.8 39.3L62 57L80 70L55 85L45 65L50 98Z" fill="#DC143C" />
  </svg>
);

const App: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [style, setStyle] = useState<PhotoStyle>(PhotoStyle.RUSTIC);
  const [size, setSize] = useState<ImageSize>(ImageSize.SIZE_1K);
  const [quality, setQuality] = useState<PhotoQuality>(PhotoQuality.PREMIUM);
  const [isSnowing, setIsSnowing] = useState<boolean>(true);
  
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [locationImage, setLocationImage] = useState<string | null>(null);
  
  const [step, setStep] = useState<1 | 2>(1);
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);
  const [showResetConfirmation, setShowResetConfirmation] = useState<boolean>(false);
  const [showDnsModal, setShowDnsModal] = useState<boolean>(false);
  const [dnsTab, setDnsTab] = useState<'cloudflare' | 'godaddy'>('cloudflare');
  const [isZipping, setIsZipping] = useState(false);
  const [copied, setCopied] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

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
      try { await window.aistudio.openSelectKey(); setApiKeyReady(true); } 
      catch (e) { console.error("Failed to select key", e); }
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
    setDishes((prev) => prev.map((dish) => (dish.id === id ? { ...dish, ...updates } : dish)));
  };

  const requestReset = () => {
    if (step === 2 && dishes.length > 0) setShowResetConfirmation(true);
    else resetApp();
  };

  const resetApp = () => {
    setDishes([]); setStep(1); setLogoImage(null); setLocationImage(null); setShowResetConfirmation(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
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
      link.href = url; link.download = "menu-photos.zip";
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(url);
    } catch (error) { console.error("Failed to zip files", error); } finally { setIsZipping(false); }
  };

  const getDnsBindContent = () => {
    return `mrdelivery.online. 3600 IN A 216.239.32.21
mrdelivery.online. 3600 IN A 216.239.34.21
mrdelivery.online. 3600 IN A 216.239.36.21
mrdelivery.online. 3600 IN A 216.239.38.21
mrdelivery.online. 3600 IN AAAA 2001:4860:4802:32::15
mrdelivery.online. 3600 IN AAAA 2001:4860:4802:34::15
mrdelivery.online. 3600 IN AAAA 2001:4860:4802:36::15
mrdelivery.online. 3600 IN AAAA 2001:4860:4802:38::15
www.mrdelivery.online. 3600 IN CNAME ghs.googlehosted.com.`;
  };

  const downloadDnsFile = () => {
    const blob = new Blob([getDnsBindContent()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = "mrdelivery_cloudflare_import.txt";
    document.body.appendChild(link); link.click();
    document.body.removeChild(link); URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getDnsBindContent());
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (checkingKey) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div></div>;

  if (!apiKeyReady) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col items-center justify-center p-4">
         <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 mb-8">
            <InstantPhotoLogo size={40} />
         </div>
         <h1 className="text-4xl font-serif font-bold text-white mb-2 text-center">Instant<span className="text-orange-500">Photo</span></h1>
         <p className="text-sm text-zinc-500 mb-8 font-medium">Powered by MrDelivery AI Agency</p>
         <button onClick={handleSelectKey} className="flex items-center gap-2 px-6 py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:bg-zinc-200 transition-colors shadow-lg"><Key size={18} /> Connect API Key</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 selection:bg-orange-500/30 overflow-x-hidden">
      {isSnowing && <Snowfall />}
      <input type="file" ref={logoInputRef} onChange={(e) => handleFileChange(e, setLogoImage)} accept="image/*" className="hidden" />
      <input type="file" ref={locationInputRef} onChange={(e) => handleFileChange(e, setLocationImage)} accept="image/*" className="hidden" />

      {/* DNS Setup Modal */}
      {showDnsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-lg p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative">
            <button onClick={() => setShowDnsModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-2"><X size={24} /></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-600/10 rounded-xl flex items-center justify-center text-orange-500 shrink-0"><Globe size={24} /></div>
              <div><h3 className="text-2xl font-serif font-bold text-white">mrdelivery.online Setup</h3><p className="text-zinc-400 text-sm">Follow these steps to link your domain</p></div>
            </div>
            <div className="flex border-b border-zinc-800 mb-6">
              <button onClick={() => setDnsTab('cloudflare')} className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${dnsTab === 'cloudflare' ? 'border-orange-500 text-white' : 'border-transparent text-zinc-500'}`}>Cloudflare</button>
              <button onClick={() => setDnsTab('godaddy')} className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${dnsTab === 'godaddy' ? 'border-orange-500 text-white' : 'border-transparent text-zinc-500'}`}>Manual Setup</button>
            </div>
            {dnsTab === 'cloudflare' ? (
              <div className="space-y-6">
                <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">1</div><div className="flex-grow"><p className="font-semibold text-white mb-1">Get Import Records</p><div className="flex gap-2 mt-2"><button onClick={downloadDnsFile} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-bold rounded-lg text-xs"><FileCode size={16} /> Download .txt</button><button onClick={copyToClipboard} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-200 font-bold rounded-lg border border-zinc-700 text-xs">{copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />} {copied ? 'Copied!' : 'Copy Content'}</button></div></div></div>
                <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold">2</div><div className="flex-grow"><p className="font-semibold text-white mb-1">Import into Cloudflare</p><div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 text-sm text-zinc-300"><div className="flex items-start gap-2"><Check size={14} className="text-green-500 mt-1" /><span>Use the "Import and Export" feature in DNS settings.</span></div><div className="flex items-start gap-2"><X size={14} className="text-red-500 mt-1" /><span><b>CRITICAL:</b> Set proxy status to "DNS Only" (Grey cloud).</span></div></div></div></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 overflow-x-auto"><table className="w-full text-left text-sm text-zinc-300"><thead><tr className="text-zinc-500 border-b border-zinc-800"><th className="pb-2">Type</th><th className="pb-2">Host</th><th className="pb-2">Value</th></tr></thead><tbody><tr><td className="py-1">A</td><td className="py-1">@</td><td className="py-1 font-mono">216.239.32.21</td></tr><tr><td className="py-1">CNAME</td><td className="py-1">www</td><td className="py-1 font-mono text-orange-400">ghs.googlehosted.com</td></tr></tbody></table></div>
              </div>
            )}
            <div className="mt-8 flex justify-end"><button onClick={() => setShowDnsModal(false)} className="px-6 py-2 bg-zinc-800 text-white rounded-lg font-medium transition-colors">Close</button></div>
          </div>
        </div>
      )}

      {showResetConfirmation && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Start Over?</h3>
            <p className="text-sm text-zinc-400 mb-6">All generated photos will be lost.</p>
            <div className="flex justify-end gap-3"><button onClick={() => setShowResetConfirmation(false)} className="px-4 py-2 text-sm text-zinc-300">Cancel</button><button onClick={resetApp} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg">Yes, Start Over</button></div>
          </div>
        </div>
      )}

      {/* Screenshot-Identical Header */}
      <header className="sticky top-0 z-[150] bg-gradient-to-b from-zinc-900 to-black border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={requestReset}>
            <div className="bg-black/40 p-1.5 rounded-lg border border-white/5">
              <InstantPhotoLogo size={28} />
            </div>
            <h1 className="text-xl font-sans font-bold text-white tracking-tight flex items-baseline">
              Instant<span className="text-[#f97316] drop-shadow-[0_0_8px_rgba(249,115,22,0.6)] ml-[1px]">Photo</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-5">
             <button 
               onClick={() => setIsSnowing(!isSnowing)} 
               className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all border ${isSnowing ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
               title="Let it snow!"
             >
               <Snowflake size={18} className={isSnowing ? 'animate-pulse' : ''} />
             </button>
             
             <div className="h-4 w-[1px] bg-zinc-800"></div>

             <a href="https://mrdelivery.online" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-zinc-100 hover:text-orange-400 transition-colors font-bold text-sm whitespace-nowrap group">
               <MrDeliveryLogo size={22} />
               <span>MrDelivery AI Agency</span>
             </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        {step === 1 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-10 max-w-2xl">
              <div className="inline-block px-3 py-1 mb-4 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-orange-500/80 tracking-widest uppercase">Powered by MrDelivery AI Agency</div>
              <h2 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6 leading-tight">Instant Menu Pictures <br/> <span className="text-zinc-600">Michelin Style</span></h2>
              <p className="text-lg text-zinc-400 max-w-lg mx-auto">Transform your text menu or existing dish photos into high-end visual masterpieces in seconds.</p>
            </div>
            <MenuParser onDishesParsed={handleDishesParsed} logoImage={logoImage} locationImage={locationImage} onLogoChange={setLogoImage} onLocationChange={setLocationImage} />
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="mb-8 flex flex-col gap-4">
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 backdrop-blur-md">
                <div className="flex flex-wrap gap-6">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"><Sliders size={12} /> Aesthetic Style</span>
                    <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                      {Object.values(PhotoStyle).map((s) => (
                        <button key={s} onClick={() => setStyle(s)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${style === s ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>{s.split('/')[0]}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"><Sparkles size={12} /> Quality</span>
                     <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                      {Object.values(PhotoQuality).map((q) => (
                        <button key={q} onClick={() => setQuality(q)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${quality === q ? 'bg-zinc-800 text-orange-400' : 'text-zinc-500 hover:text-zinc-300'}`}>{q}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"><Settings2 size={12} /> Output Resolution</span>
                     <div className="flex items-center gap-2">
                      {Object.values(ImageSize).map((s) => (
                        <button key={s} onClick={() => setSize(s)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${size === s ? 'border-zinc-500 bg-zinc-800 text-zinc-200' : 'border-zinc-800 text-zinc-500'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  {dishes.some(d => d.imageUrl) && (
                    <button onClick={handleDownloadAll} disabled={isZipping} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 text-zinc-900 text-sm font-bold rounded-xl shadow-xl transition-transform active:scale-95">
                      {isZipping ? <div className="animate-spin w-4 h-4 border-2 border-zinc-600 border-t-transparent rounded-full" /> : <Download size={16} />} Export All Assets
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} currentStyle={style} currentSize={size} currentQuality={quality} logoImage={logoImage} locationImage={locationImage} onUpdate={updateDish} />
              ))}
            </div>
          </div>
        )}
      </main>
      
      <footer className="py-12 text-center text-zinc-600 text-sm border-t border-zinc-900/50 relative z-10">
        <div className="flex items-center justify-center gap-6 mb-4">
          <button onClick={() => setShowDnsModal(true)} className="flex items-center gap-2 hover:text-orange-500 transition-colors font-bold"><Info size={16} /> Domain Integration</button>
          <span className="h-4 w-[1px] bg-zinc-800"></span>
          <a href="https://mrdelivery.online" className="hover:text-orange-500 transition-colors font-bold text-zinc-400">mrdelivery.online</a>
        </div>
        <p className="font-bold tracking-widest uppercase text-[10px] opacity-40">&copy; {new Date().getFullYear()} MrDelivery AI Agency. All Culinary IP Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default App;