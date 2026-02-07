
import React, { useState, useMemo } from 'react';
import { 
  Users, Activity, Database, TrendingUp, Search, Plus, Minus, 
  ChevronRight, ArrowLeft, ShieldCheck, User as UserIcon, 
  Mail, Calendar, Coins, Image as ImageIcon, ExternalLink,
  Filter, Download, RefreshCw, X, Clock, BarChart3, Lock,
  MoreVertical, Smartphone, Globe2, Zap
} from 'lucide-react';
import { User, ActivityLog, Currency } from '../types';

interface AdminPanelProps {
  users: User[];
  logs: ActivityLog[];
  onClose: () => void;
  onUpdateUserCredits: (userId: string, amount: number) => void;
  onRefresh: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, logs, onClose, onUpdateUserCredits, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'activity'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => 
      l.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.action.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [logs, searchQuery]);

  const userLogs = useMemo(() => {
    if (!selectedUser) return [];
    return logs.filter(l => l.userId === selectedUser.id);
  }, [selectedUser, logs]);

  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalCredits: users.reduce((acc, u) => acc + u.credits, 0),
    totalGenerations: users.reduce((acc, u) => acc + u.totalGenerations, 0),
    activeToday: Math.floor(users.length * 0.65),
    revenueEst: (users.reduce((acc, u) => acc + u.totalGenerations, 0) * 0.25).toFixed(2)
  }), [users]);

  return (
    <div className="admin-panel fixed inset-0 z-[1000] bg-[#050505] flex flex-col animate-in fade-in duration-500 overflow-hidden">
      {/* Infrastructure Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-2xl p-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={onClose}
            className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl border border-zinc-800 transition-all active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-orange-500" size={24} />
              <h2 className="text-2xl font-serif font-bold text-white tracking-tight">Admin Console</h2>
              <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 text-[8px] font-black uppercase tracking-[0.2em] border border-orange-500/20 rounded-md">Alpha v2.4</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mt-1 ml-9">Unified Infrastructure • mrdelivery.ro</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800">
            {(['dashboard', 'users', 'activity'] as const).map((tab) => (
              <button 
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedUser(null); }}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeTab === tab 
                    ? 'bg-orange-600 text-white shadow-xl shadow-orange-900/20' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="h-10 w-px bg-zinc-800" />
          <button 
            onClick={onRefresh}
            className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl border border-zinc-800 transition-all active:rotate-180 duration-500"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Interface Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
          
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-12 animate-in slide-in-from-bottom-5">
              {/* High-Level Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Cloud Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: '+4 today' },
                  { label: 'System Liquidity', value: `${stats.totalCredits} CR`, icon: Coins, color: 'text-orange-500', bg: 'bg-orange-500/10', trend: '-120 usages' },
                  { label: 'Total Productions', value: stats.totalGenerations, icon: ImageIcon, color: 'text-green-500', bg: 'bg-green-500/10', trend: '98% Success' },
                  { label: 'Active Channels', value: stats.activeToday, icon: Zap, color: 'text-purple-500', bg: 'bg-purple-500/10', trend: 'Live Now' }
                ].map((stat, i) => (
                  <div key={i} className="bg-zinc-900/60 border border-zinc-800/80 p-8 rounded-[2rem] hover:border-zinc-700 transition-all shadow-2xl backdrop-blur-md group">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                        <stat.icon size={24} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{stat.trend}</span>
                    </div>
                    <div className="text-4xl font-serif font-bold text-white mb-2">{stat.value}</div>
                    <div className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.2em]">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Advanced Tracking Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                      <Activity size={24} className="text-orange-500" /> Infrastructure Pulse
                    </h3>
                  </div>
                  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-950/50">
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Event Time</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Operator</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">System Action</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-right">Delta</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {logs.slice(0, 8).map((log) => (
                            <tr key={log.id} className="hover:bg-zinc-800/40 transition-colors group">
                              <td className="px-8 py-5">
                                <div className="text-xs text-zinc-400 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</div>
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-500">{log.userName.charAt(0)}</div>
                                  <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{log.userName}</span>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <span className="px-3 py-1 bg-zinc-800 text-zinc-400 text-[9px] font-black uppercase tracking-widest border border-zinc-700 rounded-lg group-hover:border-orange-500/40 transition-colors">
                                  {log.action}
                                </span>
                              </td>
                              <td className={`px-8 py-5 text-sm font-black text-right ${log.creditsAffected > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {log.creditsAffected > 0 ? `+${log.creditsAffected}` : log.creditsAffected} CR
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                    <BarChart3 size={24} className="text-orange-500" /> Network Health
                  </h3>
                  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md">
                    <div className="space-y-8">
                      {[
                        { label: 'Compute Latency', value: '184ms', status: 'Optimal', icon: Clock },
                        { label: 'Storage Cluster', value: '84.2%', status: 'Normal', icon: Database },
                        { label: 'Mobile Traffic', value: '72%', status: 'Dominant', icon: Smartphone },
                        { label: 'Global Uptime', value: '99.99%', status: 'Stable', icon: Globe2 }
                      ].map((h, i) => (
                        <div key={i} className="flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-zinc-800 text-zinc-500 rounded-2xl border border-zinc-700 group-hover:text-orange-500 group-hover:border-orange-500/30 transition-all">
                              <h.icon size={18} />
                            </div>
                            <div>
                              <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">{h.label}</div>
                              <div className="text-lg font-bold text-white">{h.value}</div>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-green-500/20">
                            {h.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-section max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="relative w-full sm:max-w-xl group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" size={22} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Operator ID, Name, or Email..."
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-3xl py-5 pl-16 pr-6 text-base text-white focus:outline-none focus:border-orange-500/50 transition-all shadow-xl placeholder-zinc-700"
                  />
                </div>
                <div className="flex items-center gap-4">
                   <button className="flex items-center gap-3 px-6 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-95">
                     <Filter size={20} /> <span className="text-[10px] font-black uppercase tracking-widest">Filter</span>
                   </button>
                   <button className="flex items-center gap-3 px-6 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-95">
                     <Download size={20} /> <span className="text-[10px] font-black uppercase tracking-widest">Export DB</span>
                   </button>
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950/50">
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Identity Details</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Security Rank</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Timeline</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Assets</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Balance</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-right">Admin Tools</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {filteredUsers.map((user) => (
                        <tr 
                          key={user.id} 
                          className={`hover:bg-zinc-800/40 transition-all cursor-pointer group ${selectedUser?.id === user.id ? 'bg-orange-500/10 ring-1 ring-inset ring-orange-500/20' : ''}`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-3xl bg-zinc-800 flex items-center justify-center text-zinc-500 border border-zinc-700 overflow-hidden shrink-0 group-hover:scale-105 transition-transform shadow-xl">
                                {user.profilePhoto ? <img src={user.profilePhoto} className="w-full h-full object-cover" /> : <UserIcon size={24} />}
                              </div>
                              <div className="overflow-hidden">
                                <div className="text-base font-bold text-white truncate leading-tight mb-1">{user.fullName}</div>
                                <div className="text-[11px] text-zinc-500 truncate font-mono">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              user.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-xs text-zinc-500 font-medium">Joined {new Date(user.joinedAt).toLocaleDateString()}</td>
                          <td className="px-8 py-6 text-sm font-bold text-zinc-300">{user.totalGenerations} units</td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2.5">
                              <Coins size={18} className="text-orange-500" />
                              <span className="text-lg font-black text-white">{user.credits}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => { e.stopPropagation(); onUpdateUserCredits(user.id, 50); }}
                                className="p-3 bg-zinc-950 hover:bg-green-600/20 text-green-500 rounded-xl border border-zinc-800 hover:border-green-500/40 transition-all shadow-xl"
                                title="Inject 50 CR"
                              >
                                <Plus size={18} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); onUpdateUserCredits(user.id, -50); }}
                                className="p-3 bg-zinc-950 hover:bg-red-600/20 text-red-500 rounded-xl border border-zinc-800 hover:border-red-500/40 transition-all shadow-xl"
                                title="Drain 50 CR"
                              >
                                <Minus size={18} />
                              </button>
                              <button className="p-3 bg-zinc-950 hover:bg-zinc-800 text-zinc-500 rounded-xl border border-zinc-800 transition-all shadow-xl">
                                <MoreVertical size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-5">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-serif font-bold text-white flex items-center gap-4">
                  <Database size={32} className="text-orange-500" /> Global Production Archive
                </h3>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950/50">
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Protocol Time</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Operator Profile</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Instruction</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Production Summary</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-right">Asset Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="px-8 py-6">
                            <div className="text-sm text-zinc-300 font-mono leading-none mb-1">{new Date(log.timestamp).toLocaleDateString()}</div>
                            <div className="text-[10px] text-zinc-600 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString()}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-xs font-black border border-zinc-700 text-zinc-500 uppercase">
                                {log.userName.charAt(0)}
                              </div>
                              <span className="text-sm font-bold text-white">{log.userName}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="px-4 py-1.5 bg-orange-600/10 text-orange-500 text-[10px] font-black uppercase tracking-[0.1em] border border-orange-500/20 rounded-xl">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm text-zinc-400 max-w-sm truncate italic">"{log.details}"</p>
                          </td>
                          <td className={`px-8 py-6 text-base font-black text-right ${log.creditsAffected > 0 ? 'text-green-500' : 'text-red-500'}`}>
                             {log.creditsAffected > 0 ? `+${log.creditsAffected}` : log.creditsAffected}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Unified User Detail View Sidebar */}
        {selectedUser && (
          <aside className="w-[450px] border-l border-zinc-800 bg-[#080808]/95 backdrop-blur-3xl overflow-y-auto custom-scrollbar p-10 animate-in slide-in-from-right-20 duration-500 shadow-[-50px_0_100px_rgba(0,0,0,0.5)] z-50">
            <div className="sticky top-0 space-y-12 pb-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-orange-500">
                  <UserIcon size={18} />
                  <span className="text-[11px] font-black uppercase tracking-[0.3em]">Operator Dossier</span>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)} 
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-600 hover:text-white rounded-xl transition-all border border-zinc-800 shadow-xl"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="text-center">
                <div className="relative inline-block mb-6 group">
                  <div className="absolute inset-0 bg-orange-600 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative w-32 h-32 rounded-[3rem] bg-zinc-900 flex items-center justify-center text-zinc-500 border border-zinc-800 overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
                    {selectedUser.profilePhoto ? <img src={selectedUser.profilePhoto} className="w-full h-full object-cover" /> : <UserIcon size={48} />}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-600 border-4 border-[#080808] rounded-2xl flex items-center justify-center text-white shadow-xl">
                    <ShieldCheck size={18} />
                  </div>
                </div>
                <h4 className="text-3xl font-serif font-bold text-white mb-2 leading-tight">{selectedUser.fullName}</h4>
                <p className="text-zinc-500 font-mono text-sm tracking-tight">{selectedUser.email}</p>
                <div className="mt-4 flex justify-center gap-2">
                   <span className="px-3 py-1 bg-zinc-900 text-zinc-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-zinc-800">UID: {selectedUser.id}</span>
                   <span className="px-3 py-1 bg-zinc-900 text-zinc-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-zinc-800">LOC: {selectedUser.preferredCurrency}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-[2rem] shadow-xl backdrop-blur-md">
                  <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-2">Available Credits</div>
                  <div className="text-3xl font-serif font-bold text-orange-500 leading-none">{selectedUser.credits} <span className="text-xs font-sans text-zinc-500 uppercase tracking-tighter">CR</span></div>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-[2rem] shadow-xl backdrop-blur-md">
                  <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-2">Production Output</div>
                  <div className="text-3xl font-serif font-bold text-white leading-none">{selectedUser.totalGenerations} <span className="text-xs font-sans text-zinc-500 uppercase tracking-tighter">Units</span></div>
                </div>
              </div>

              <div className="space-y-6">
                <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-3">
                  <Clock size={16} className="text-orange-500" /> Operational History
                </h5>
                <div className="space-y-4 bg-zinc-900/20 border border-zinc-800/40 rounded-[2.5rem] p-8">
                   {userLogs.length > 0 ? (
                     userLogs.map((log, idx) => (
                       <div key={log.id} className="relative pl-8 pb-6 border-l border-zinc-800 last:pb-0">
                         <div className="absolute top-0 left-[-4px] w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(234,88,12,0.5)]"></div>
                         <div className="text-[9px] font-mono text-zinc-500 uppercase mb-1">{new Date(log.timestamp).toLocaleString()}</div>
                         <div className="text-sm font-bold text-white mb-0.5">{log.action}</div>
                         <div className="text-[11px] text-zinc-500 leading-relaxed italic line-clamp-1">"{log.details}"</div>
                         <div className={`text-[10px] font-black mt-2 ${log.creditsAffected > 0 ? 'text-green-500' : 'text-red-500'}`}>
                           {log.creditsAffected > 0 ? `+${log.creditsAffected}` : log.creditsAffected} Credits
                         </div>
                       </div>
                     ))
                   ) : (
                     <p className="text-zinc-600 text-center py-6 text-sm font-medium">No production history archived.</p>
                   )}
                </div>
              </div>

              <div className="space-y-6 pt-10 border-t border-zinc-800/50">
                <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-3">
                  <Lock size={16} className="text-orange-500" /> Infrastructure Access
                </h5>
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => onUpdateUserCredits(selectedUser.id, 100)}
                    className="w-full py-5 bg-gradient-to-r from-orange-600 to-red-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-2xl shadow-orange-950/40 active:scale-95"
                  >
                    Authorize 100 Credits Injection
                  </button>
                  <button className="w-full py-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all border border-zinc-800 shadow-xl active:scale-95">
                    Reset Access Protocol
                  </button>
                  <button className="w-full py-5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all border border-red-500/20 shadow-xl active:scale-95">
                    Terminate User Session
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      <style>{`
        .admin-panel .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .admin-panel .custom-scrollbar::-webkit-scrollbar-track {
          background: #050505;
        }
        .admin-panel .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1a1a1a;
          border-radius: 10px;
        }
        .admin-panel .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #262626;
        }
        
        .admin-panel table th {
          position: sticky;
          top: 0;
          z-index: 10;
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
