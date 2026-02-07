
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Mic, MicOff, Volume2, VolumeX, Play, Square, Headphones, Settings, History, Info } from 'lucide-react';
import { chatWithConcierge, speakText } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

type AgentState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: 'Hi there! I\'m Maya, your Michelin photography expert. How can I help you elevate your menu today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [currentState, setCurrentState] = useState<AgentState>('IDLE');
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentState]);

  // Initialize Speech Recognition (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSend(transcript);
      };

      recognitionRef.current.onerror = () => {
        setCurrentState('IDLE');
      };

      recognitionRef.current.onend = () => {
        if (currentState === 'LISTENING') setCurrentState('IDLE');
      };
    }
  }, [currentState]);

  const stopSpeaking = () => {
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch (e) {}
      activeSourceRef.current = null;
    }
    setCurrentState('IDLE');
  };

  const playResponse = async (text: string) => {
    if (!isTtsEnabled) {
      setCurrentState('IDLE');
      return;
    }

    try {
      setCurrentState('SPEAKING');
      const buffer = await speakText(text);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      
      // Decode PCM
      const dataInt16 = new Int16Array(buffer);
      const audioBuffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        setCurrentState('IDLE');
        activeSourceRef.current = null;
      };

      activeSourceRef.current = source;
      source.start();
    } catch (err) {
      console.error('TTS Playback failed', err);
      setCurrentState('IDLE');
    }
  };

  const handleSend = async (msgText: string = input) => {
    const text = msgText.trim();
    if (!text) return;

    if (currentState === 'SPEAKING') stopSpeaking();

    setInput('');
    const userMsg: Message = { 
      role: 'user', 
      text, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    setMessages(prev => [...prev, userMsg]);
    setCurrentState('PROCESSING');

    try {
      let fullResponse = '';
      const stream = chatWithConcierge(text, messages);
      
      const botMsg: Message = { 
        role: 'model', 
        text: '', 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages(prev => [...prev, botMsg]);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = fullResponse;
          return newMessages;
        });
      }

      await playResponse(fullResponse);
    } catch (error) {
      console.error('Concierge Error:', error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: 'I apologize, I hit a technical snag. Can we try that again?', 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setCurrentState('IDLE');
    }
  };

  const toggleTalk = () => {
    if (currentState === 'LISTENING') {
      recognitionRef.current?.stop();
      setCurrentState('PROCESSING');
      return;
    }

    if (currentState === 'SPEAKING') {
      stopSpeaking();
    }

    setCurrentState('LISTENING');
    try {
      recognitionRef.current?.start();
    } catch (err) {
      console.error('Mic start failed', err);
      setCurrentState('IDLE');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[300]">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-[#FF6B35] hover:bg-[#E05A2A] text-white rounded-full shadow-[0_8px_32px_rgba(255,107,53,0.4)] transition-all active:scale-90 flex items-center justify-center group border border-white/20"
        >
          <div className="absolute inset-0 bg-[#FF6B35] rounded-full animate-ping opacity-20 scale-125"></div>
          <MessageCircle size={28} strokeWidth={2.5} className="group-hover:scale-110 transition-transform duration-300" />
        </button>
      )}

      {/* Main Agent Panel */}
      {isOpen && (
        <div className="w-[350px] sm:w-[420px] h-[650px] bg-zinc-900/98 border border-zinc-800 rounded-[2.5rem] shadow-2xl flex flex-col backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-10 duration-500 overflow-hidden">
          
          {/* Header & Avatar Section */}
          <div className="p-6 border-b border-zinc-800/50 bg-zinc-900/50 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-zinc-600 hover:text-zinc-400 cursor-pointer" />
                <History size={18} className="text-zinc-600 hover:text-zinc-400 cursor-pointer" />
              </div>
              <button onClick={() => { stopSpeaking(); setIsOpen(false); }} className="p-2 text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="relative mb-4">
              <div className={`w-24 h-24 rounded-full border-4 border-zinc-800 overflow-hidden shadow-2xl transition-all duration-500 ${currentState === 'SPEAKING' ? 'scale-110 border-orange-500' : ''}`}>
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256&h=256" 
                  alt="Maya AI Agent" 
                  className="w-full h-full object-cover"
                />
              </div>
              {currentState === 'SPEAKING' && (
                <div className="absolute inset-0 rounded-full animate-pulse bg-orange-500/10"></div>
              )}
              <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-zinc-900 flex items-center justify-center ${currentState === 'IDLE' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}>
              </div>
            </div>

            <h3 className="text-lg font-serif font-bold text-white mb-1">Maya</h3>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
              {currentState === 'IDLE' && 'Ready to help!'}
              {currentState === 'LISTENING' && 'Listening to you...'}
              {currentState === 'PROCESSING' && 'Processing your question...'}
              {currentState === 'SPEAKING' && 'Speaking...'}
            </span>
          </div>

          {/* Transcript Section */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-zinc-950/20">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm relative group ${
                  msg.role === 'user' 
                    ? 'bg-orange-600 text-white rounded-tr-none shadow-lg shadow-orange-950/20' 
                    : 'bg-zinc-800/80 text-zinc-200 border border-zinc-800 rounded-tl-none'
                }`}>
                  <p className="leading-relaxed">{msg.text || (i === messages.length - 1 && currentState === 'PROCESSING' && <Loader2 size={16} className="animate-spin opacity-50" />)}</p>
                  <span className={`text-[8px] mt-2 block opacity-50 font-black uppercase tracking-tighter ${msg.role === 'user' ? 'text-right' : ''}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Control Section */}
          <div className="p-8 border-t border-zinc-800/50 bg-zinc-900/50 flex flex-col items-center gap-6">
            <div className="flex items-center gap-6">
              {/* Talk Button */}
              <div className="flex flex-col items-center gap-3">
                <button 
                  onClick={toggleTalk}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl active:scale-90 border-4 border-zinc-800 ${
                    currentState === 'LISTENING' ? 'bg-[#E74C3C] scale-110' : 
                    currentState === 'PROCESSING' ? 'bg-zinc-700' :
                    currentState === 'SPEAKING' ? 'bg-[#27AE60]' : 'bg-[#FF6B35]'
                  }`}
                >
                  {currentState === 'LISTENING' ? <div className="w-6 h-6 bg-white rounded-sm animate-pulse"></div> : 
                   currentState === 'PROCESSING' ? <Loader2 className="animate-spin text-white" size={32} /> :
                   currentState === 'SPEAKING' ? <Volume2 className="text-white animate-bounce" size={32} /> :
                   <Mic size={32} className="text-white" />}
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  {currentState === 'IDLE' ? 'Click to Talk' : currentState}
                </span>
              </div>

              {/* Stop Button - Only visible when speaking */}
              <div className={`flex flex-col items-center gap-3 transition-all duration-300 ${currentState === 'SPEAKING' ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}>
                <button 
                  onClick={stopSpeaking}
                  className="w-14 h-14 bg-[#2C3E50] text-white rounded-full flex items-center justify-center shadow-xl hover:bg-zinc-700 transition-colors border-2 border-zinc-700"
                >
                  <Square size={20} fill="white" />
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Stop</span>
              </div>
            </div>

            {/* Input Overlay */}
            <div className="w-full relative flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pl-5 pr-12 text-sm text-zinc-200 focus:outline-none focus:border-orange-500/50 transition-all placeholder-zinc-700"
              />
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || currentState !== 'IDLE'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-orange-500 disabled:opacity-0 transition-all"
              >
                <Send size={20} />
              </button>
            </div>

            <p className="text-[8px] text-zinc-700 text-center font-black uppercase tracking-[0.4em]">
              Maya AI Concierge • Instant Menu Pictures
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce-small {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-small {
          animation: bounce-small 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ChatBot;
