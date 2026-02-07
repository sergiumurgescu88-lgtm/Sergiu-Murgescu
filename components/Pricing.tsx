import React, { useState, useEffect } from 'react';
import { X, Check, Zap, ShieldCheck, Globe, CreditCard, ArrowRight, Coins } from 'lucide-react';
import { Currency } from '../types';

interface PricingProps {
  onPurchase: (credits: number) => void;
  onClose: () => void;
  currentCurrency: Currency;
  onCurrencyChange: (curr: Currency) => void;
}

const PACKAGES = [
  { id: 'small', credits: 10, price: { EUR: 2.00, USD: 2.50, RON: 10.00 }, bonus: 0 },
  { id: 'medium', credits: 50, price: { EUR: 10.00, USD: 12.50, RON: 50.00 }, bonus: 0 },
  { id: 'large', credits: 100, price: { EUR: 20.00, USD: 25.00, RON: 100.00 }, bonus: 0, bestValue: true },
  { id: 'pro', credits: 250, price: { EUR: 50.00, USD: 62.50, RON: 250.00 }, bonus: 13, bonusPercent: 5 },
  { id: 'enterprise', credits: 500, price: { EUR: 100.00, USD: 125.00, RON: 500.00 }, bonus: 50, bonusPercent: 10 },
  { id: 'unlimited', credits: 1000, price: { EUR: 200.00, USD: 250.00, RON: 1000.00 }, bonus: 150, bonusPercent: 15 },
];

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  RON: 'RON'
};

const Pricing: React.FC<PricingProps> = ({ onPurchase, onClose, currentCurrency, onCurrencyChange }) => {
  const [selectedId, setSelectedId] = useState('large');

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-8 border-b border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/50">
          <div>
            <h3 className="text-3xl font-serif font-bold text-white">Fuel Your Vision</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-orange-500 uppercase tracking-widest font-black">1 Credit = {CURRENCY_SYMBOLS[currentCurrency]} {(PACKAGES[0].price[currentCurrency] / PACKAGES[0].credits).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              {(['EUR', 'USD', 'RON'] as Currency[]).map((curr) => (
                <button key={curr} onClick={() => onCurrencyChange(curr)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentCurrency === curr ? 'bg-zinc-800 text-orange-500' : 'text-zinc-600 hover:text-zinc-400'}`}>{curr}</button>
              ))}
            </div>
            <button onClick={onClose} className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all border border-zinc-800 shadow-xl"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PACKAGES.map((pkg) => (
              <div key={pkg.id} onClick={() => setSelectedId(pkg.id)} className={`relative group cursor-pointer border rounded-3xl p-6 transition-all duration-300 ${selectedId === pkg.id ? 'bg-orange-600/10 border-orange-500 shadow-[0_0_30px_rgba(234,88,12,0.15)]' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}>
                {pkg.bestValue && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">Best Value</div>}
                <div className="text-center mb-6">
                  <div className={`text-4xl font-serif font-bold mb-1 ${selectedId === pkg.id ? 'text-white' : 'text-zinc-300'}`}>{pkg.credits + pkg.bonus} <span className="text-sm font-sans font-medium text-zinc-500">Credits</span></div>
                  {pkg.bonus > 0 && <div className="text-[10px] font-black uppercase tracking-widest text-green-500">Incl. {pkg.bonusPercent}% Bonus (+{pkg.bonus})</div>}
                </div>
                <div className="flex items-center justify-center gap-1 mb-8"><span className="text-zinc-500 text-sm font-medium">{CURRENCY_SYMBOLS[currentCurrency]}</span><span className="text-2xl font-bold text-white">{pkg.price[currentCurrency].toFixed(2)}</span></div>
                <button className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedId === pkg.id ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'}`}>{selectedId === pkg.id ? 'Selected' : 'Select Package'}</button>
              </div>
            ))}
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-zinc-800 pt-12 text-center">
            <div className="flex flex-col items-center">
              <Zap className="text-orange-500 mb-4" size={24} />
              <h4 className="text-white font-bold text-sm mb-2 uppercase">Instant Fulfillment</h4>
              <p className="text-zinc-500 text-xs">Production tokens are available immediately after validation.</p>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheck className="text-orange-500 mb-4" size={24} />
              <h4 className="text-white font-bold text-sm mb-2 uppercase">Verified Secured</h4>
              <p className="text-zinc-500 text-xs">Transactions processed via AES-256 encrypted gateway.</p>
            </div>
            <div className="flex flex-col items-center">
              <Globe className="text-orange-500 mb-4" size={24} />
              <h4 className="text-white font-bold text-sm mb-2 uppercase">Global Nodes</h4>
              <p className="text-zinc-500 text-xs">Universal pricing strategy matching regional economic nodes.</p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center"><CreditCard size={14} className="text-zinc-500" /></div>
              <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center"><Check size={14} className="text-green-500" /></div>
            </div>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Enterprise Validated Gateway</p>
          </div>
          <button 
            onClick={() => { const pkg = PACKAGES.find(p => p.id === selectedId); if (pkg) onPurchase(pkg.credits + pkg.bonus); }}
            className="w-full sm:w-auto px-12 py-4 bg-white text-zinc-900 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
          >
            Finalize Liquidity <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
