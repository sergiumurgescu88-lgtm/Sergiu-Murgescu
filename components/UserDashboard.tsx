import React, { useState, useRef, useEffect } from 'react';
import { 
  User as UserIcon, Settings, Shield, Clock, Coins, 
  ImageIcon, ShoppingCart, LogOut, X, Check, Lock, 
  CreditCard, ChevronRight, Sparkles, Zap, Bell, AlertCircle, Calendar, Hash, Tag, Crown, RefreshCcw, Headphones
} from 'lucide-react';
import { User, ActivityLog } from '../types';

interface UserDashboardProps {
  user: User;
  logs: ActivityLog[];
  onClose: () => void;
  onLogout: () => void;
  onOpenPricing: () => void;
  onUpdateUser: (updates: Partial<User>) => void;
  onOpenSupport: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ 
  user, 
  logs, 
  onClose, 
  onLogout, 
  onOpenPricing,
  onUpdateUser,
  onOpenSupport
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'security' | 'history' | 'support'>('overview');
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userLogs = logs.filter(l => l.userId === user.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setUploadError("Protocol violation: File size exceeds 2MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateUser({ profilePhoto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
      
      <div 
        className="w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right-10 duration-500 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-zinc-900 bg-zinc-950/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl border shadow-lg bg-green-600/10 border-green-500/20 text-green-500`}>
              <UserIcon size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-white tracking-tight">Operator Profile</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Unlimited Infrastructure</p>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-green-500/10 text-green-500 border-green-500/20`}>
                  UNLIMITED ACCESS
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-xl transition-all border border-zinc-800 shadow-xl"><X size={20} /></button>
        </div>

        <div className="flex px-8 py-4 gap-2 bg-zinc-950 border-b border-zinc-900 overflow-x-auto custom-scrollbar">
          {[
            { id: 'overview', icon: Zap, label: 'Account' }, 
            { id: 'history', icon: Clock, label: 'Activity' }, 
            { id: 'support', icon: Headphones, label: 'Support' },
            { id: 'security', icon: Shield, label: 'Security' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeView === tab.id ? 'bg-zinc-900 text-orange-500 border border-orange-500/20 shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[radial-gradient(circle_at_top_right,rgba(234,88,12,0.03),transparent)]">
          
          {activeView === 'overview' && (
            <div className="space-y-10 animate-in fade-in">
              <div className="text-center pb-8 border-b border-zinc-900/50">
                <div className="relative inline-block mb-6 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="absolute inset-0 bg-orange-600 blur-3xl opacity-10 group-hover:opacity-25 transition-opacity"></div>
                  <div className="relative w-28 h-28 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 overflow-hidden shadow-2xl ring-1 ring-white/10 group-hover:scale-105 transition-all">
                    {user.profilePhoto ? <img src={user.profilePhoto} className="w-full h-full object-cover" alt="" /> : <UserIcon size={48} strokeWidth={1} />}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><ImageIcon size={20} /></div>
                  </div>
                </div>
                {uploadError && <p className="mb-4 text-red-500 text-[10px] font-black uppercase">{uploadError}</p>}
                <h3 className="text-3xl font-serif font-bold text-white">{user.fullName}</h3>
                <p className="text-zinc-500 font-mono text-xs mt-1">{user.email}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-[2rem] shadow-xl group hover:border-orange-500/30 transition-all">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2"><Sparkles className="text-orange-500" size={18} /><span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Total Production Assets</span></div>
                      <div className="text-3xl font-serif font-bold text-white">{user.totalGenerations}</div>
                   </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-[2rem] shadow-xl">
                  <div className="flex items-center justify-between mb-3"><Zap className="text-green-500" size={18} /></div>
                  <div className="text-3xl font-serif font-bold text-white">Unlimited</div>
                  <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Daily Capacity</div>
                </div>
              </div>

              <div className="space-y-4">
                <button onClick={onLogout} className="w-full flex items-center gap-4 p-5 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-red-500 hover:border-red-500/30 transition-all">
                  <LogOut size={20} /><div className="text-left font-black uppercase text-xs tracking-widest">Terminate Session</div>
                </button>
              </div>
            </div>
          )}

          {activeView === 'history' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Activity Archive</h4>
                <span className="text-[9px] text-zinc-600 uppercase font-black">{userLogs.length} Events Logged</span>
              </div>
              
              <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
                {userLogs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-950/50 border-b border-zinc-800">
                          <th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Time</th>
                          <th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Action</th>
                          <th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Production Summary</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {userLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-[10px] text-zinc-400 font-mono">{new Date(log.timestamp).toLocaleDateString()}</div>
                              <div className="text-[8px] text-zinc-600 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border bg-orange-500/10 text-orange-500 border-orange-500/20`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-[10px] text-zinc-300 font-medium line-clamp-1 italic">"{log.details}"</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-zinc-900/20">
                    <Clock size={32} className="text-zinc-800 mx-auto mb-4" />
                    <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">No activity history archived.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'support' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl text-center">
                <Headphones size={32} className="text-orange-500 mx-auto mb-6" />
                <h3 className="text-xl font-serif font-bold text-white mb-4">Unlimited Support Access</h3>
                <p className="text-xs text-zinc-400 mb-8">As an active operator, you have priority access to our support team.</p>
                <button 
                  onClick={onOpenSupport} 
                  className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-zinc-700 flex items-center justify-center gap-3 hover:text-white"
                >
                  <Headphones size={16} /> Open Support Portal
                </button>
              </div>
            </div>
          )}

          {activeView === 'security' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl">
                <Shield size={32} className="text-orange-500 mb-6" />
                <h3 className="text-2xl font-serif font-bold text-white mb-2">Access Security</h3>
                <p className="text-sm text-zinc-500 leading-relaxed mb-8">Manage your authentication protocols and operational session.</p>
                <button className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-zinc-700 flex items-center justify-center gap-3">
                  <Lock size={16} /> Reset Access Protocol
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="p-8 border-t border-zinc-900 bg-zinc-950 text-center"><p className="text-zinc-700 text-[9px] font-black uppercase tracking-[0.4em]">mrdelivery infrastructure</p></div>
      </div>
    </div>
  );
};

export default UserDashboard;