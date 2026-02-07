
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Camera, Settings2, Sliders, Key, Sparkles, Upload, MapPin, Image as ImageIcon, X, AlertTriangle, Download, ExternalLink, Globe, Copy, Check, FileCode, Briefcase, Snowflake, Info, Table, MousePointer2, Rocket, Maximize, Globe2, Loader2, AlertCircle, CreditCard, Coins, User as UserIcon, LogOut, ShoppingCart, ShieldCheck, Plus, CheckCircle } from 'lucide-react';
import MenuParser from './components/MenuParser';
import DishCard from './components/DishCard';
import Snowfall from './components/Snowfall';
import ChatBot from './components/ChatBot';
import Auth from './components/Auth';
import Pricing from './components/Pricing';
import AdminPanel from './components/AdminPanel';
import UserDashboard from './components/UserDashboard';
import { Dish, PhotoStyle, ImageSize, PhotoQuality, STYLE_TOOLTIPS, User, Currency, ActivityLog } from './types';
import JSZip from 'jszip';

// Using a unique ID prefix for gradients to prevent collisions when multiple logos are rendered
const MrDeliveryLogo = ({ size = 24, className = "", idPrefix = "logo" }: { size?: number, className?: string, idPrefix?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <defs>
      <linearGradient id={`${idPrefix}topGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4FB9E1" />
        <stop offset="100%" stopColor="#2E3192" />
      </linearGradient>
      <linearGradient id={`${idPrefix}bottomGrad`} x1="100%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#C1272D" />
        <stop offset="100%" stopColor="#F15A24" />
      </linearGradient>
    </defs>
    <g>
      <path d="M20 55 C20 30 40 10 70 10 L80 10 L30 65 L20 55Z" fill={`url(#${idPrefix}topGrad)`} />
      <path d="M80 45 C80 70 60 90 30 90 L20 90 L70 35 L80 45Z" fill={`url(#${idPrefix}bottomGrad)`} />
      <path d="M45 25 L50 30 L35 45 L30 40 Z M52 22 L55 25 M55 19 L58 22 M58 16 L61 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
      <path d="M55 70 C60 65 65 60 62 55 C59 50 54 52 49 57 C44 62 42 67 45 72 C48 77 50 75 55 70 Z" fill="white" opacity="0.9"/>
      <path d="M45 72 L35 82" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
    </g>
  </svg>
);

const MOCK_USERS: User[] = [
  { id: '1', email: 'admin@mrdelivery.ro', fullName: 'Infrastructure Admin', credits: 9999, role: 'admin', joinedAt: '2023-01-01', totalGenerations: 1250, isLoggedIn: true, isEmailVerified: true, preferredCurrency: 'EUR' },
  { id: '2', email: 'chef.paul@restaurateur.com', fullName: 'Chef Paul Bocuse', credits: 125, role: 'user', joinedAt: '2024-02-15', totalGenerations: 82, isLoggedIn: false, isEmailVerified: true, preferredCurrency: 'EUR' },
  { id: '3', email: 'elena.popescu@bistro.ro', fullName: 'Elena Popescu', credits: 42, role: 'user', joinedAt: '2024-03-10', totalGenerations: 15, isLoggedIn: false, isEmailVerified: true, preferredCurrency: 'RON' },
  { id: '4', email: 'john.doe@grillhouse.us', fullName: 'John Doe', credits: 5, role: 'user', joinedAt: '2024-04-01', totalGenerations: 124, isLoggedIn: false, isEmailVerified: true, preferredCurrency: 'USD' },
];

const MOCK_LOGS: ActivityLog[] = [
  { id: 'l1', userId: '2', userName: 'Chef Paul Bocuse', action: 'PRODUCE', details: 'Pizza Michelin - Standard (1:1)', creditsAffected: -1, timestamp: new Date().toISOString() },
];

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  subMessage?: string;
}

const App: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [style, setStyle] = useState<PhotoStyle>(PhotoStyle.NATURAL_DAYLIGHT);
  const [size, setSize] = useState<ImageSize>(ImageSize.SIZE_1K);
  const [quality, setQuality] = useState<PhotoQuality>(PhotoQuality.PREMIUM);
  const [isSnowing, setIsSnowing] = useState<boolean>(true);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [locationImage, setLogoLocation] = useState<string | null>(null); // renamed for internal consistency but keeping logic
  const [locationImageReal, setLocationImageReal] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);
  const [showResetConfirmation, setShowResetConfirmation] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Auth & System States
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Global Infrastructure Tracking
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(MOCK_LOGS);

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

  const addToast = (type: 'success' | 'error' | 'info', message: string, subMessage?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message, subMessage }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
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
    if (!user) {
      setShowAuth(true);
      return;
    }
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

  const handleChargeCredit = (action: string, details: string) => {
    if (!user) return;
    
    const newCredits = user.credits - 1;
    const updatedUser = { 
      ...user, 
      credits: newCredits, 
      totalGenerations: user.totalGenerations + 1 
    };
    
    setUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    setActivityLogs(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.fullName,
      action: action,
      details: details,
      creditsAffected: -1,
      timestamp: new Date().toISOString()
    }, ...prev]);

    addToast('success', 'Production Successful!', `1 credit used. ${newCredits} remaining.`);
  };

  const updateDish = (id: string, updates: Partial<Dish>) => {
    setDishes((prev) => prev.map((dish) => (dish.id === id ? { ...dish, ...updates } : dish)));
  };

  const requestReset = () => {
    if (step === 2 && dishes.length > 0) setShowResetConfirmation(true);
    else resetApp();
  };

  const resetApp = () => {
    setDishes([]); setStep(1); setLogoImage(null); setLocationImageReal(null); setShowResetConfirmation(false);
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
      link.href = url; link.download = `production_bundle_${new Date().getTime()}.zip`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(url);
    } catch (error) { console.error("Session Export failed", error); } finally { setIsZipping(false); }
  };

  const handleAuthComplete = (newUser: User) => {
    if (newUser.email.toLowerCase().includes('admin') || newUser.email.toLowerCase().includes('infra')) {
      newUser.role = 'admin';
    }
    setUser(newUser);
    setAllUsers(prev => {
      const existing = prev.find(u => u.email === newUser.email);
      if (existing) return prev.map(u => u.email === newUser.email ? { ...u, isLoggedIn: true } : u);
      return [...prev, { ...newUser, joinedAt: new Date().toISOString(), totalGenerations: 0 }];
    });
    setShowAuth(false);
  };

  const handlePurchase = (credits: number) => {
    if (user) {
      const updatedUser = { ...user, credits: user.credits + credits };
      setUser(updatedUser);
      setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      setActivityLogs(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        userName: user.fullName,
        action: 'PURCHASE',
        details: 'Liquidity Injection: Credit Package',
        creditsAffected: credits,
        timestamp: new Date().toISOString()
      }, ...prev]);
      setShowPricing(false);
      addToast('success', 'Top-up confirmed!', `${credits} credits added to your account.`);
    }
  };

  const updateOtherUserCredits = (userId: string, amount: number) => {
    const targetUser = allUsers.find(u => u.id === userId);
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, credits: Math.max(0, u.credits + amount) };
        if (user && user.id === userId) setUser(updated);
        return updated;
      }
      return u;
    }));
    
    setActivityLogs(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      userId: user?.id || 'admin',
      userName: user?.fullName || 'Infrastructure System',
      action: 'ADMIN_ADJUST',
      details: `Credit Adjustment: ${targetUser?.fullName} (${amount > 0 ? '+' : ''}${amount})`,
      creditsAffected: amount,
      timestamp: new Date().toISOString()
    }, ...prev]);
  };

  const getCreditColor = (credits: number) => {
    if (credits >= 20) return 'text-green-500';
    if (credits >= 5) return 'text-orange-500';
    return 'text-red-500';
  };

  if (checkingKey) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={40} strokeWidth={1} /></div>;

  if (!apiKeyReady) {
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-200 flex flex-col items-center justify-center p-4 text-center">
         <div className="w-32 h-32 bg-white/5 rounded-[3rem] flex items-center justify-center shadow-[0_0_80px_rgba(255,75,75,0.1)] border border-white/5 mb-10 overflow-hidden backdrop-blur-md relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <MrDeliveryLogo size={100} idPrefix="lock" />
         </div>
         <h1 className="text-6xl font-serif font-bold text-white mb-4 tracking-tight">Studio<span className="text-orange-500">Access</span></h1>
         <p className="text-[11px] text-zinc-500 mb-10 font-black uppercase tracking-[0.4em]">Proprietary Michelin Engine • mrdelivery.ro</p>
         
         <div className="max-w-md mb-10 p-10 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] text-left backdrop-blur-3xl shadow-2xl">
           <h4 className="text-orange-500 font-bold flex items-center gap-3 mb-4 uppercase tracking-widest text-sm"><CreditCard size={20} /> Infrastructure Lock</h4>
           <p className="text-zinc-400 text-xs leading-relaxed mb-6">
             Paid Studio Models require valid Cloud Billing. High-fidelity production (Gemini 3 Pro) consumes external compute units.
           </p>
           <a 
             href="https://ai.google.dev/gemini-api/docs/billing" 
             target="_blank" 
             rel="noopener noreferrer" 
             className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-orange-400 transition-colors"
           >
             Protocol Documentation <ExternalLink size={12} />
           </a>
         </div>

         <button onClick={handleSelectKey} className="flex items-center gap-3 px-12 py-5 bg-white text-zinc-900 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-zinc-200 transition-all shadow-2xl active:scale-95 group"><Key size={20} className="group-hover:rotate-45 transition-transform duration-500" /> Unlock Studio Slot</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 selection:bg-orange-500/30 overflow-x-hidden relative">
      {isSnowing && <Snowfall />}
      {showAuth && <Auth onAuthComplete={handleAuthComplete} onClose={() => setShowAuth(false)} />}
      {showPricing && <Pricing onPurchase={handlePurchase} onClose={() => setShowPricing(false)} currentCurrency={user?.preferredCurrency || 'EUR'} onCurrencyChange={(c) => user && setUser({...user, preferredCurrency: c})} />}
      {showAdmin && user?.role === 'admin' && (
        <AdminPanel 
          users={allUsers} 
          logs={activityLogs} 
          onClose={() => setShowAdmin(false)} 
          onUpdateUserCredits={updateOtherUserCredits}
          onRefresh={() => {}}
        />
      )}
      {showUserDashboard && user && (
        <UserDashboard 
          user={user} 
          logs={activityLogs} 
          onClose={() => setShowUserDashboard(false)} 
          onLogout={() => { setUser(null); setShowUserDashboard(false); }}
          onOpenPricing={() => { setShowPricing(true); setShowUserDashboard(false); }}
          onUpdateUser={(upd) => {
            const updated = {...user, ...upd};
            setUser(updated);
            setAllUsers(prev => prev.map(u => u.id === user.id ? updated : u));
          }}
        />
      )}
      
      {/* Toast System */}
      <div className="fixed top-24 right-6 z-[1100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`p-4 rounded-2xl border flex items-center gap-4 shadow-2xl backdrop-blur-3xl animate-in slide-in-from-right-10 pointer-events-auto max-w-sm ${
            toast.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
            toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
            'bg-zinc-900/80 border-zinc-700 text-zinc-300'
          }`}>
            {toast.type === 'success' ? <CheckCircle size={20} /> : toast.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
              {toast.subMessage && <span className="text-[10px] opacity-70 font-medium">{toast.subMessage}</span>}
            </div>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="ml-auto p-1 hover:bg-white/10 rounded-lg"><X size={14} /></button>
          </div>
        ))}
      </div>

      <header className="sticky top-0 z-[150] bg-zinc-950/80 border-b border-white/5 backdrop-blur-3xl shadow-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-1 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-5 cursor-pointer shrink-0" onClick={requestReset}>
            <div className="bg-zinc-900 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner ring-1 ring-white/5">
              <MrDeliveryLogo size={24} className="sm:w-8 sm:h-8" idPrefix="header" />
            </div>
            <div className="flex flex-col leading-tight">
              {/* REFINED BRANDING HEADER */}
              <h1 className="text-lg sm:text-2xl font-serif font-bold tracking-tight flex items-baseline">
                <span className="text-white">MrDelivery</span>
                <span className="text-orange-500 italic mx-0.5">.AI</span>
                <span className="text-white ml-1">Studio</span>
              </h1>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-[6px] sm:text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600 hidden xs:inline">Production Mode</span>
                <div className="flex items-center gap-1 px-1 sm:px-1.5 py-0.5 bg-sky-500/10 rounded-md border border-sky-500/20 text-sky-400 group/snow" onClick={(e) => { e.stopPropagation(); setIsSnowing(!isSnowing); }}>
                  <Snowflake size={8} className={`${isSnowing ? 'animate-spin-slow' : 'opacity-40'} sm:w-[10px] sm:h-[10px]`} />
                  <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-tighter">{isSnowing ? 'ON' : 'OFF'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-6 ml-auto">
             {user ? (
               <div className="flex items-center gap-1.5 sm:gap-5">
                 {user.role === 'admin' && (
                   <button 
                     onClick={() => setShowAdmin(true)}
                     className="flex items-center gap-2 px-2.5 sm:px-5 py-2 sm:py-2.5 bg-zinc-900 hover:bg-orange-600/10 border border-zinc-800 hover:border-orange-500/40 rounded-xl sm:rounded-2xl transition-all text-orange-500 group shadow-lg"
                   >
                     <ShieldCheck size={14} className="group-hover:scale-110 transition-transform duration-300 sm:w-4 sm:h-4" />
                     <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest hidden md:inline">Admin</span>
                   </button>
                 )}
                 <button 
                   onClick={() => setShowPricing(true)}
                   title="Credits available for image generation"
                   className="flex items-center gap-1.5 sm:gap-4 px-2.5 sm:px-5 py-2 sm:py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl sm:rounded-2xl transition-all group shadow-xl ring-1 ring-white/5"
                 >
                   <Coins size={14} className={`${getCreditColor(user.credits)} sm:w-[18px] sm:h-[18px]`} />
                   <div className="flex flex-col items-start leading-none">
                     <span className={`text-xs sm:text-sm font-black ${getCreditColor(user.credits)} transition-colors`}>{user.credits}</span>
                     <span className="text-[6px] sm:text-[8px] font-black text-zinc-600 uppercase tracking-tighter hidden sm:inline">Credits</span>
                   </div>
                   <div className="ml-1 p-0.5 sm:p-1 bg-orange-600 text-white rounded-md sm:rounded-lg group-hover:scale-110 transition-all shadow-xl shadow-orange-950/40 hidden xs:flex">
                     <Plus size={8} className="sm:w-[10px] sm:h-[10px]" />
                   </div>
                 </button>
                 <div className="flex items-center gap-2 sm:gap-4 pl-1.5 sm:pl-6 border-l border-zinc-800">
                   <div className="relative group/avatar cursor-pointer shrink-0" onClick={() => setShowUserDashboard(true)}>
                     <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-[1rem] bg-zinc-800 flex items-center justify-center text-zinc-500 border border-zinc-700 overflow-hidden shadow-2xl ring-1 ring-white/10 group-hover/avatar:ring-orange-500/40 transition-all">
                       {user.profilePhoto ? <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" /> : <UserIcon size={16} className="sm:w-5 sm:h-5" />}
                     </div>
                     <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-zinc-950 sm:w-2.5 sm:h-2.5 sm:border-2"></div>
                   </div>
                   <button onClick={() => setUser(null)} className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all hidden sm:block" title="Terminate Session">
                     <LogOut size={20} />
                   </button>
                 </div>
               </div>
             ) : (
               <button 
                 onClick={() => setShowAuth(true)}
                 className="px-3 sm:px-8 py-2 sm:py-3 bg-white text-zinc-900 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] rounded-xl sm:rounded-2xl hover:bg-zinc-200 transition-all shadow-2xl active:scale-95"
               >
                 Authorize
               </button>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 sm:py-24 relative z-10">
        {step === 1 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in duration-1000">
            <div className="text-center mb-12 max-w-4xl">
              <div className="inline-block px-4 py-1.5 mb-8 rounded-full bg-zinc-900/50 border border-zinc-800 text-[9px] font-black text-orange-500/80 tracking-[0.3em] uppercase shadow-xl backdrop-blur-md">
                Infrastructure by MrDelivery AI Agency
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-4 leading-tight tracking-tight text-balance">Instant Menu Pictures</h1>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-medium text-zinc-600 mb-10 italic">Michelin Cinematic Engine</h2>
              <p className="text-sm sm:text-base text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
                Turn any text or photo into a stunning menu image, customized with your logo and restaurant decor. Edit dishes to perfection, keep authenticity, and create premium visuals for websites, delivery apps, and social media—without costly professional photographers.
              </p>
            </div>
            <MenuParser onDishesParsed={handleDishesParsed} logoImage={logoImage} locationImage={locationImageReal} onLogoChange={setLogoImage} onLocationChange={setLocationImageReal} />
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {globalError === "quota_exceeded" && (
              <div className="mb-10 p-8 bg-orange-600/5 border border-orange-500/20 rounded-[2.5rem] flex flex-col sm:flex-row items-center justify-between gap-8 backdrop-blur-3xl shadow-2xl">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-orange-600/20 rounded-2xl border border-orange-500/30">
                    <AlertCircle className="text-orange-500" size={32} />
                  </div>
                  <div>
                    <p className="text-xl font-serif font-bold text-white leading-tight mb-1">Production Protocol Restriction (429)</p>
                    <p className="text-xs text-zinc-500 leading-relaxed max-w-md">Cloud Infrastructure limit reached for Premium Models. Switch to Standard Efficiency or verify Cloud Billing configurations.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex-1 sm:flex-none text-[10px] font-black text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-widest text-center"
                  >
                    Cloud Documentation
                  </a>
                  <button onClick={handleSelectKey} className="flex-1 sm:flex-none px-8 py-4 bg-white text-zinc-900 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-2xl hover:bg-zinc-200 transition-all">Switch Node</button>
                </div>
              </div>
            )}

            <div className="mb-16 p-8 bg-zinc-900/40 border border-white/5 rounded-[3rem] flex flex-col gap-10 backdrop-blur-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] ring-1 ring-white/5 overflow-visible">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Settings2 className="text-orange-500" size={20} />
                    <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em]">Production Specialists Protocol</span>
                  </div>
                  <div className="flex items-center gap-5 bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                      <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">
                        Studio Slots: {activeGenerationsCount}/3
                      </span>
                    </div>
                    {isGenerationLimitReached && (
                      <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" /> QUEUE FULL
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2.5 max-h-[400px] overflow-y-auto p-6 bg-zinc-950/50 rounded-[2.5rem] border border-zinc-900 custom-scrollbar overflow-visible ring-1 ring-inset ring-white/5">
                  {Object.values(PhotoStyle).map((s) => (
                    <div key={s} className="relative group">
                      <button 
                        onClick={() => setStyle(s)} 
                        className={`px-6 py-3 text-[10px] font-bold tracking-widest rounded-xl transition-all duration-500 border uppercase ${
                          style === s 
                            ? 'bg-orange-600 border-orange-400 text-white shadow-[0_15px_30px_rgba(234,88,12,0.4)] -translate-y-1 scale-105 z-10' 
                            : 'bg-zinc-900/80 border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-orange-500/40 hover:bg-zinc-800'
                        }`}
                      >
                        {s}
                      </button>
                      
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 p-5 bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] pointer-events-none backdrop-blur-2xl ring-1 ring-white/10 translate-y-2 group-hover:translate-y-0">
                        <div className="text-xs text-white font-black mb-2 border-b border-zinc-800 pb-2 uppercase tracking-widest">{s}</div>
                        <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">{STYLE_TOOLTIPS[s]}</p>
                        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-950 border-r border-b border-zinc-800 transform rotate-45"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-between gap-10 pt-10 border-t border-white/5">
                <div className="flex flex-col sm:flex-row items-center gap-12 w-full lg:w-auto">
                  <div className="flex flex-col items-start gap-4 w-full sm:w-auto">
                    <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-2">Compute Fidelity</span>
                    <div className="flex bg-zinc-950 p-2 rounded-2xl border border-zinc-900 w-full sm:w-auto ring-1 ring-inset ring-white/5 shadow-inner">
                      {Object.values(PhotoQuality).map((q) => (
                        <button key={q} onClick={() => setQuality(q)} className={`flex-1 sm:flex-none px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${quality === q ? 'bg-zinc-800 text-orange-500 shadow-xl border border-orange-500/20' : 'text-zinc-600 hover:text-zinc-400'}`}>{q}</button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-4 w-full sm:w-auto">
                    <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-2">Spatial Density</span>
                    <div className="flex bg-zinc-950 p-2 rounded-2xl border border-zinc-900 w-full sm:w-auto ring-1 ring-inset ring-white/5 shadow-inner">
                      {Object.values(ImageSize).map((s) => (
                        <button key={s} onClick={() => setSize(s)} className={`flex-1 sm:flex-none px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${size === s ? 'bg-zinc-800 text-orange-500 shadow-xl border border-orange-500/20' : 'text-zinc-600 hover:text-zinc-400'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 w-full lg:w-auto">
                  {dishes.some(d => d.imageUrl) && (
                    <button onClick={handleDownloadAll} disabled={isZipping} className="flex-1 lg:flex-none flex items-center justify-center gap-4 px-12 py-5 bg-white text-zinc-900 text-xs font-black uppercase tracking-[0.2em] rounded-[1.5rem] shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50">
                      {isZipping ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />} Archival Export
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-14">
              {dishes.map((dish) => (
                <DishCard 
                  key={dish.id} 
                  dish={dish} 
                  userCredits={user?.credits || 0}
                  currentStyle={style} 
                  currentSize={size} 
                  currentQuality={quality} 
                  logoImage={logoImage} 
                  locationImage={locationImageReal} 
                  onUpdate={updateDish}
                  onCharge={handleChargeCredit}
                  onOpenPricing={() => setShowPricing(true)}
                  addToast={addToast}
                  isGenerationLimitReached={isGenerationLimitReached}
                  onKeyError={() => setGlobalError("quota_exceeded")}
                />
              ))}
            </div>
          </div>
        )}
      </main>
      
      <ChatBot />

      <footer className="py-24 text-center border-t border-white/5 bg-zinc-950/40 relative z-10">
        <div className="flex items-center justify-center gap-6 mb-8">
           <a href="https://mrdelivery.ro" target="_blank" className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-orange-500 transition-all shadow-xl hover:scale-110 active:scale-90">
              <Globe2 size={24} />
           </a>
        </div>
        <p className="text-zinc-400 text-sm font-medium tracking-wide px-6">
          &copy; 2026 MrDelivery AI Studio • Proprietary Infrastructure of MrDelivery AI Agency
        </p>
        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">
          mrdelivery.ro
        </p>
      </footer>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
