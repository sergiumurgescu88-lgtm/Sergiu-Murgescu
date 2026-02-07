import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { chatWithConcierge, speakText, connectLiveConcierge } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Welcome to MrDelivery AI Concierge. I am your expert consultant in Michelin-style food photography and menu aesthetics. How can I assist your culinary vision today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  
  // Real-time transcription state
  const [liveUserInput, setLiveUserInput] = useState('');
  const [liveModelOutput, setLiveModelOutput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Voice interaction refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sessionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, liveUserInput, liveModelOutput]);

  const playAudioBuffer = async (buffer: ArrayBuffer) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    
    // Decode manual PCM (or raw) as per guidelines
    const dataInt16 = new Int16Array(buffer);
    const frameCount = dataInt16.length;
    const audioBuffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    
    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      let fullResponse = '';
      const stream = chatWithConcierge(userMsg, messages);
      
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = fullResponse;
          return newMessages;
        });
      }

      if (isTtsEnabled) {
        const audioBuffer = await speakText(fullResponse);
        await playAudioBuffer(audioBuffer);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'I apologize, I am experiencing a temporary technical interruption. Please try again in a moment.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleVoice = async () => {
    if (isVoiceActive) {
      sessionRef.current?.close();
      setIsVoiceActive(false);
      setLiveUserInput('');
      setLiveModelOutput('');
      return;
    }

    setIsVoiceActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionPromise = connectLiveConcierge({
        onopen: () => {
          console.debug('Live session opened');
          const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          const source = inputCtx.createMediaStreamSource(stream);
          const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
            const base64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
            sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } }));
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputCtx.destination);
        },
        onmessage: async (msg: any) => {
          // Handle Audio
          const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio) {
            const binaryString = atob(base64Audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            playAudioBuffer(bytes.buffer);
          }

          // Handle real-time user transcription
          if (msg.serverContent?.inputTranscription) {
            setLiveUserInput(msg.serverContent.inputTranscription.text);
          }

          // Handle real-time model transcription
          if (msg.serverContent?.outputTranscription) {
            setLiveModelOutput(prev => prev + msg.serverContent.outputTranscription.text);
          }

          // Commit turn to main message list when complete
          if (msg.serverContent?.turnComplete) {
            setMessages(prev => [
              ...prev, 
              { role: 'user', text: liveUserInput }, 
              { role: 'model', text: liveModelOutput }
            ]);
            setLiveUserInput('');
            setLiveModelOutput('');
          }
        },
        onclose: () => {
          setIsVoiceActive(false);
          setLiveUserInput('');
          setLiveModelOutput('');
        },
        onerror: () => {
          setIsVoiceActive(false);
          setLiveUserInput('');
          setLiveModelOutput('');
        },
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Voice failed', err);
      setIsVoiceActive(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[300]">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white p-4 rounded-full shadow-2xl transition-all active:scale-90 flex items-center gap-2 group border border-orange-400/30"
        >
          <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-20"></div>
          <MessageCircle size={24} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap text-sm font-bold uppercase tracking-widest px-0 group-hover:px-2">
            AI Concierge
          </span>
        </button>
      )}

      {isOpen && (
        <div className="w-[350px] sm:w-[400px] h-[550px] bg-zinc-900/95 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col backdrop-blur-xl animate-in fade-in slide-in-from-bottom-10">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-lg border border-orange-400/20">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">AI Concierge</h3>
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Michelin Expert
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsTtsEnabled(!isTtsEnabled)} 
                className={`p-2 rounded-lg transition-colors ${isTtsEnabled ? 'text-orange-500' : 'text-zinc-600'}`}
              >
                {isTtsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-orange-600 text-white rounded-tr-none' 
                    : 'bg-zinc-800/80 text-zinc-200 border border-zinc-700/50 rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-line leading-relaxed">{msg.text || (i === messages.length - 1 && isTyping && <Loader2 size={16} className="animate-spin opacity-50" />)}</p>
                </div>
              </div>
            ))}
            
            {/* Live User Transcription */}
            {liveUserInput && (
              <div className="flex justify-end animate-pulse">
                <div className="max-w-[85%] p-3 rounded-2xl rounded-tr-none text-sm bg-orange-600/50 text-white/90 italic">
                  {liveUserInput}
                </div>
              </div>
            )}
            
            {/* Live Model Response */}
            {liveModelOutput && (
              <div className="flex justify-start">
                <div className="max-w-[85%] p-3 rounded-2xl rounded-tl-none text-sm bg-zinc-800/80 text-zinc-200 border border-zinc-700/50">
                  {liveModelOutput}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 rounded-b-3xl">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pl-4 pr-12 text-sm text-zinc-200 focus:outline-none focus:border-orange-500/50 transition-colors"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-zinc-800 hover:bg-orange-600 disabled:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl transition-all disabled:opacity-50"
                >
                  {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
              <button 
                onClick={toggleVoice}
                className={`p-3 rounded-2xl transition-all ${isVoiceActive ? 'bg-red-600 text-white animate-pulse' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
              >
                {isVoiceActive ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            </div>
            <p className="text-[9px] text-zinc-600 text-center mt-3 uppercase tracking-widest font-black">
              Bilingv RO/EN • Live Transcription • Powered by MrDelivery AI Agency
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
