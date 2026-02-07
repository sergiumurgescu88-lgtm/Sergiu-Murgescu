
import React, { useState } from 'react';
import { 
  User as UserIcon, Settings, Shield, Clock, Coins, 
  ImageIcon, ShoppingCart, LogOut, X, Check, Lock, 
  CreditCard, ChevronRight, Sparkles, Zap, Bell
} from 'lucide-react';
import { User, ActivityLog } from '../types';

interface UserDashboardProps {
  user: User;
  logs: ActivityLog[];
  onClose: () => void;
  onLogout: () => void;
  onOpenPricing: () => void;
  onUpdateUser: (updates: Partial<User>) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ 
  user, 
  logs, 
  onClose, 
  onLogout, 
  onOpenPricing,
  onUpdateUser
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'security' | 'history'>('overview');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);

  const userLogs = logs.filter(l => l.userId === user.id);

  const handleResetPassword = () => {
    setIsResetting(true);
    // Simulate API call
    setTimeout(() => {
      setIsResetting(false);
      setShowResetSuccess(true);
      setTimeout(() => setShowResetSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-zinc-950 border-l border-zinc-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right-10 duration-500 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b border-zinc-900 bg-zinc-950/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-600/10 rounded-2xl border border-orange-500/20 text-orange-500 shadow-lg">
              <UserIcon size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-white tracking-tight">My Studio</h2>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1">Operator Profile & Infrastructure</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-xl transition-all border border-zinc-800 shadow-xl">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-8 py-4 gap-2 bg-zinc-950 border-b border-zinc-900">
          {[
            { id: 'overview', icon: Zap, label: 'Overview' },
            { id: 'history', icon: Clock, label: 'Archive' },
            { id: 'security', icon: Lock, label: 'Security' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeView === tab.id 
                  ? 'bg-zinc-900 text-orange-500 border border-orange-500/20 shadow-lg' 
                  : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden xs:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[radial-gradient(circle_at_top_right,rgba(234,88,12,0.03),transparent)]">
          
          {activeView === 'overview' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
              {/* Profile Hero */}
              <div className="text-center pb-8 border-b border-zinc-900/50">
                <div className="relative inline-block mb-6 group">
                  <div className="absolute inset-0 bg-orange-600 blur-3xl opacity-10 group-hover:opacity-25 transition-opacity"></div>
                  <div className="relative w-28 h-28 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 overflow-hidden shadow-2xl ring-1 ring-white/10">
                    {user.profilePhoto ? (
                      <img src={user.profilePhoto} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <UserIcon size={48} strokeWidth={1} />
                    )}
                  </div>
                  <button className="absolute -bottom-1 -right-1 p-2.5 bg-zinc-800 border-2 border-zinc-950 rounded-2xl text-zinc-400 hover:text-white shadow-xl transition-all">
                    <ImageIcon size={14} />
                  </button>
                </div>
                <h3 className="text-3xl font-serif font-bold text-white">{user.fullName}</h3>
                <p className="text-zinc-500 font-mono text-xs mt-1">{user.email}</p>
                <div className="flex justify-center gap-2 mt-4">
                  <span className="px-3 py-1 bg-zinc-900 text-zinc-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-zinc-800">Operator #{user.id.slice(0, 5)}</span>
                  <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest rounded-lg border border-green-500/20">Active Session</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-[2rem] shadow-xl group hover:border-orange-500/30 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <Coins className="text-orange-500" size={18} />
                    <button onClick={onOpenPricing} className="p-1.5 bg-orange-600 text-white rounded-lg shadow-lg hover:scale-110 active:scale-90 transition-all">
                      <ShoppingCart size={12} />
                    </button>
                  </div>
                  <div className="text-3xl font-serif font-bold text-white">{user.credits}</div>
                  <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Studio Credits</div>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-[2rem] shadow-xl group hover:border-zinc-700 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <ImageIcon className="text-zinc-500" size={18} />
                    <Sparkles className="text-zinc-700" size={12} />
                  </div>
                  <div className="text-3xl font-serif font-bold text-white">{user.totalGenerations}</div>
                  <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Assets Produced</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-2">Session Control</h4>
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={onOpenPricing}
                    className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl text-white shadow-xl shadow-orange-950/40 group hover:opacity-90 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <CreditCard size={20} />
                      <div className="text-left">
                        <div className="text-xs font-black uppercase tracking-widest">Upgrade Protocol</div>
                        <div className="text-[10px] opacity-70">Purchase more production credits</div>
                      </div>
                    </div>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-4 p-5 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-red-500 hover:border-red-500/30 transition-all group"
                  >
                    <LogOut size={20} />
                    <div className="text-left">
                      <div className="text-xs font-black uppercase tracking-widest">Terminate Session</div>
                      <div className="text-[10px] text-zinc-600 group-hover:text-red-500/60">Securely sign out of the studio</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeView === 'history' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Archival Production Log</h4>
                <div className="text-[9px] text-zinc-500 font-medium">Showing last {userLogs.length} events</div>
              </div>
              
              <div className="space-y-3">
                {userLogs.length > 0 ? (
                  userLogs.map((log) => (
                    <div key={log.id} className="bg-zinc-900/30 border border-zinc-800/50 p-5 rounded-2xl group hover:border-zinc-700 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                            log.action === 'PRODUCE' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                          }`}>
                            {log.action === 'PRODUCE' ? <ImageIcon size={14} /> : <Zap size={14} />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white uppercase tracking-tight">{log.action}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</div>
                          </div>
                        </div>
                        <div className={`text-xs font-black ${log.creditsAffected < 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {log.creditsAffected > 0 ? '+' : ''}{log.creditsAffected} CR
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed italic border-t border-zinc-800/50 pt-3 mt-1">
                        "{log.details}"
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl">
                    <Clock size={32} className="text-zinc-800 mx-auto mb-4" />
                    <p className="text-zinc-600 text-xs font-medium uppercase tracking-widest">No production history archived.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'security' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-[2.5rem] shadow-xl">
                <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center text-orange-500 mb-6 shadow-inner ring-1 ring-white/5">
                  <Shield size={28} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-2">Access Credentials</h3>
                <p className="text-sm text-zinc-500 leading-relaxed mb-8">Maintain studio security by updating your operational protocols regularly.</p>
                
                <div className="space-y-4">
                  <button 
                    onClick={handleResetPassword}
                    disabled={isResetting}
                    className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-zinc-700 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {isResetting ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : showResetSuccess ? (
                      <><Check size={16} className="text-green-500" /> Protocol Updated</>
                    ) : (
                      <><Lock size={16} /> Reset Access Protocol</>
                    )}
                  </button>
                  <p className="text-[9px] text-zinc-600 text-center leading-relaxed px-4">
                    Security protocol: Resetting your password will invalidate all other active operational sessions.
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/20 border border-zinc-800/50 p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Multifactor Authentication</span>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-md text-[8px] font-black uppercase tracking-widest border border-green-500/20">Active</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Login Notifications</span>
                  <div className="w-8 h-4 bg-orange-600 rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-zinc-900 bg-zinc-950 flex flex-col gap-4">
           <div className="flex items-center justify-center gap-3 text-zinc-700 text-[9px] font-black uppercase tracking-[0.4em]">
              <div className="h-px w-8 bg-zinc-900"></div>
              mrdelivery infrastructure
              <div className="h-px w-8 bg-zinc-900"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

const Loader2 = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${className} animate-spin`}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

export default UserDashboard;
