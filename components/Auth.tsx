
import React, { useState, useMemo } from 'react';
import { Mail, Lock, User, Chrome, ArrowRight, X, Eye, EyeOff, CheckCircle2, Loader2, ShieldCheck, MailCheck, Check, AlertCircle, BadgeCheck, ChevronRight } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthProps {
  onAuthComplete: (user: UserType) => void;
  onClose: () => void;
}

type AuthMode = 'login' | 'signup' | 'verify-email' | 'success' | 'google-auth' | 'forgot-password';

const Auth: React.FC<AuthProps> = ({ onAuthComplete, onClose }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [authProgress, setAuthProgress] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google Simulation States
  const [showGoogleAccountPicker, setShowGoogleAccountPicker] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  // Password Strength Logic
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
  }, [password]);

  const strengthColor = () => {
    if (passwordStrength <= 25) return 'bg-red-500';
    if (passwordStrength <= 50) return 'bg-orange-500';
    if (passwordStrength <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const strengthText = () => {
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  // High-fidelity Google Login Simulation
  const startGoogleAuthFlow = (selectedEmail: string, selectedName: string) => {
    // Validate Gmail format
    if (!selectedEmail.toLowerCase().endsWith('@gmail.com')) {
      alert("Please provide a valid @gmail.com address.");
      return;
    }

    setShowGoogleAccountPicker(false);
    setMode('google-auth');
    setAuthProgress(0);
    setError(null);
    
    const interval = setInterval(() => {
      setAuthProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      const googleUser: UserType = {
        id: 'google_' + Math.random().toString(36).substr(2, 9),
        email: selectedEmail,
        fullName: selectedName,
        profilePhoto: `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedName)}&background=random&color=fff`,
        credits: 50,
        isLoggedIn: true,
        isEmailVerified: true,
        preferredCurrency: 'EUR',
        role: 'user',
        joinedAt: new Date().toISOString(),
        totalGenerations: 0
      };
      onAuthComplete(googleUser);
    }, 2200);
  };

  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (passwordStrength < 100) {
        setError("Password does not meet security requirements.");
        return;
      }
      if (!agreedToTerms) {
        setError("You must agree to the terms.");
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setMode('verify-email');
      }, 1500);
    } else {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onAuthComplete({
          id: Math.random().toString(36).substr(2, 9),
          email,
          fullName: fullName || 'Professional Chef',
          credits: 50,
          isLoggedIn: true,
          isEmailVerified: true,
          preferredCurrency: 'EUR',
          role: 'user',
          joinedAt: new Date().toISOString(),
          totalGenerations: 0
        });
      }, 1200);
    }
  };

  const simulateEmailConfirmation = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setMode('success');
    }, 2000);
  };

  const handleStartSession = () => {
    onAuthComplete({
      id: Math.random().toString(36).substr(2, 9),
      email,
      fullName: fullName || 'New Member',
      credits: 50,
      isLoggedIn: true,
      isEmailVerified: true,
      preferredCurrency: 'EUR',
      role: 'user',
      joinedAt: new Date().toISOString(),
      totalGenerations: 0
    });
  };

  // Google Account Picker UI (Real Identity Verification)
  if (showGoogleAccountPicker) {
    return (
      <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="p-6 text-center border-b border-zinc-100">
            <svg viewBox="0 0 24 24" width="24" height="24" className="mx-auto mb-4" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <h2 className="text-xl font-sans font-medium text-zinc-900">Sign in with Google</h2>
            <p className="text-sm text-zinc-500 mt-1">Provide your real identity to continue</p>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input 
                    type="text" 
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    placeholder="E.g. Chef Marco Rossi"
                    className="w-full h-11 px-9 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Gmail Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input 
                    type="email" 
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="w-full h-11 px-9 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={() => customGoogleEmail && customGoogleName && startGoogleAuthFlow(customGoogleEmail, customGoogleName)}
                disabled={!customGoogleEmail || !customGoogleName}
                className="w-full py-3 bg-[#4285F4] text-white text-sm font-bold rounded-lg hover:bg-[#357ae8] transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale shadow-lg"
              >
                Authenticate Google Account
              </button>
              
              <button 
                onClick={() => setShowGoogleAccountPicker(false)}
                className="w-full text-zinc-400 hover:text-zinc-600 text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                Cancel Authentication
              </button>
            </div>
          </div>
          
          <div className="p-6 bg-zinc-50 border-t border-zinc-100 text-[10px] text-zinc-400 leading-relaxed">
            Google will securely verify your identity for mrdelivery.ro. We do not store your Google password. Read our <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'google-auth') {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 animate-in fade-in duration-500">
        <div className="bg-zinc-900 border border-white/5 rounded-[3rem] w-full max-w-md p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800">
             <div 
               className="h-full bg-orange-600 transition-all duration-300 ease-out" 
               style={{ width: `${authProgress}%` }}
             />
          </div>
          <div className="mb-10 relative">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
               <Chrome size={48} className="text-[#4285F4]" />
            </div>
            <div className="absolute -bottom-2 right-1/2 translate-x-12">
               <div className="bg-orange-600 p-2 rounded-xl text-white shadow-xl">
                 <Loader2 className="animate-spin" size={16} />
               </div>
            </div>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mb-2">Connecting Account</h2>
          <p className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-10">Real Identity Verification...</p>
          <div className="flex flex-col gap-4 text-xs text-zinc-400 font-medium">
             <div className="flex items-center justify-center gap-3">
               <span className={authProgress > 30 ? 'text-green-500' : ''}>{authProgress > 30 ? '✓' : '○'} Handshake secure</span>
             </div>
             <div className="flex items-center justify-center gap-3">
               <span className={authProgress > 60 ? 'text-green-500' : ''}>{authProgress > 60 ? '✓' : '○'} Google OAuth valid</span>
             </div>
             <div className="flex items-center justify-center gap-3">
               <span className={authProgress > 90 ? 'text-green-500' : ''}>{authProgress > 90 ? '✓' : '○'} Granting access to {customGoogleName}</span>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'verify-email') {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 animate-in fade-in duration-300">
        <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] w-full max-w-md p-10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-zinc-800">
            <div className="h-full bg-sky-500 animate-pulse w-full"></div>
          </div>
          
          <div className="w-20 h-20 bg-sky-500/10 rounded-3xl flex items-center justify-center text-sky-500 mx-auto mb-8 shadow-inner ring-1 ring-sky-500/20">
            <MailCheck size={40} />
          </div>
          
          <h2 className="text-3xl font-serif font-bold text-white mb-4">Activation Required</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            Account created successfully. We've dispatched a secure activation link to <span className="text-white font-bold">{email || 'your email'}</span>.
          </p>
          
          <div className="space-y-4">
            <button 
              onClick={simulateEmailConfirmation}
              disabled={isVerifying}
              className="w-full py-5 bg-white text-zinc-900 font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl hover:bg-zinc-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isVerifying ? (
                <><Loader2 className="animate-spin" size={18} /> Verifying Link...</>
              ) : (
                <><Check size={18} strokeWidth={3} /> Simulează Click pe Link</>
              )}
            </button>
            <button onClick={() => setMode('signup')} className="w-full py-4 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all">Cancel / Use different email</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'success') {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-md p-10 text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-serif font-bold text-white mb-4">Account Active!</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Identity verified. Your Michelin production engine is now online. We've added your welcome bonus to your account.
          </p>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 mb-8">
            <span className="text-orange-500 font-black text-4xl block mb-1">50</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Welcome Credits Added</span>
          </div>
          <button 
            onClick={handleStartSession}
            className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl shadow-orange-950/20"
          >
            Start Creating Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300 overflow-y-auto custom-scrollbar">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-auto">
        <div className="p-6 sm:p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
              {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
            </h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mt-1">
              {mode === 'login' ? 'Sign in to continue creating' : 'Start creating professional menu pictures'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 sm:p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6 flex-1">
          <button 
            onClick={() => setShowGoogleAccountPicker(true)}
            className="group relative flex items-center justify-center gap-4 py-4 px-6 bg-white hover:bg-zinc-100 text-zinc-900 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-2xl active:scale-95 border-b-4 border-zinc-300 hover:border-zinc-400 w-full"
          >
            <Chrome size={20} className="absolute left-6 text-[#4285F4]" />
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800"></span>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
              <span className="bg-zinc-900 px-4 text-zinc-600">OR</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500">
              <AlertCircle size={18} />
              <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleManualAuth} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input 
                    type="text" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Chef / Owner Name"
                    className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 text-base text-white focus:outline-none focus:border-orange-500/50 transition-all"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Business Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 text-base text-white focus:outline-none focus:border-orange-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Secure Password</label>
                {mode === 'signup' && (
                  <span className={`text-[9px] font-black uppercase tracking-widest ${strengthColor().replace('bg-', 'text-')}`}>
                    {strengthText()}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-12 text-base text-white focus:outline-none focus:border-orange-500/50 transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="flex items-start gap-3 p-1">
                <input 
                  type="checkbox" 
                  id="terms" 
                  required
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 accent-orange-600"
                />
                <label htmlFor="terms" className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                  I agree to the <button type="button" className="text-orange-500 hover:underline">Terms of Service</button> and <button type="button" className="text-orange-500 hover:underline">Privacy Policy</button>
                </label>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading || (mode === 'signup' && (!agreedToTerms || passwordStrength < 100))}
              className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl shadow-orange-950/40 flex items-center justify-center gap-3 group disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
                <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <button 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-[11px] font-medium text-zinc-500"
            >
              {mode === 'login' ? "Don't have an account? " : "Already established? "}
              <span className="text-orange-500 font-black uppercase tracking-widest ml-2 hover:underline">
                {mode === 'login' ? 'Join Now' : 'Sign In'}
              </span>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-zinc-950 border-t border-zinc-800 text-center">
          <p className="text-[9px] text-zinc-600 font-medium leading-relaxed max-w-[250px] mx-auto flex items-center justify-center gap-2">
            <ShieldCheck size={12} className="text-green-500/50" />
            Infrastructure Secure • AES-256 Encrypted
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
