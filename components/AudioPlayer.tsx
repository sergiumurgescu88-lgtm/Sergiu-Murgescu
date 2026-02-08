import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Loader2, Music, SkipBack, SkipForward, RotateCcw, RotateCw, ListMusic, Wand2, Info } from 'lucide-react';
import { speakText } from '../services/geminiService';

const SCRIPT_TEXT = `Welcome to AI Studio, powered by Mister Delivery AI Agency. This Michelin-style menu generator has 7 powerful functions. Let me explain each one.

FUNCTION 1: LOGO UPLOAD.
This button allows you to upload your restaurant's logo. The AI will incorporate your branding into every menu image it creates, ensuring consistent brand identity across all your food photography. Simply click and select your logo file.

FUNCTION 2: upload images with your LOCATION.
With the Location button, you can specify your restaurant's location. This helps the AI understand regional cuisine styles and local preferences, making your menu images more authentic and culturally appropriate for your target audience.

FUNCTION 3: 
The Bulk Photos function is a time-saver. Instead of processing dishes one by one, you can upload multiple food photos at once. The AI will transform all of them into professional Michelin-style images in a single batch, perfect for creating an entire menu quickly.

FUNCTION 4: 
Voice Mode lets you describe your dishes by speaking instead of typing. Just click the microphone icon and say something like "Pizza Diavola: Spicy salami, mozzarella" in your chosen language. The AI will listen and generate stunning visuals from your voice description.

FUNCTION 5: IMPORT EXCEL
Have your menu in a spreadsheet? No problem. The Import Excel function allows you to upload an Excel file containing your entire menu with dish names and descriptions. The AI will automatically process each item and create professional images for your complete menu.

FUNCTION 6: PROCESS MENU and edit content for your website, your social media, and for your entire business.
This is where the magic happens. After you've input your menu items through text, voice, or Excel, click Process Menu, and the AI goes to work. Watch our next video to see all editing features; the real magic happens here. It transforms your basic description into stunning, Michelin-quality food photography that looks professionally shot, ready for your website, delivery apps, and social media.

FUNCTION 7: 
The most innovative feature - Capture Live Dish. This function allows you to photograph your actual dish in real-time using your device's camera. The AI will then enhance and transform your quick snapshot into a professional-quality Michelin-style image, maintaining authenticity while adding premium visual appeal. Also, with just a click of a button, the AI Agent will generate all the nutritional values ​​and allergens, and much more.

These seven functions work together to give you restaurant-quality menu photography without the cost of hiring professional photographers. Whether you prefer typing, speaking, uploading spreadsheets, or taking photos, there's a method that fits your workflow.`;

interface Track {
  title: string;
  artist: string;
  type: 'url' | 'tts';
  source: string;
}

/**
 * TO ADD MORE SONGS: 
 * Simply append a new object to this array.
 * Use type: 'url' for MP3 links or type: 'tts' for text you want Gemini to speak.
 */
const PLAYLIST: Track[] = [
  {
    title: "Studio Feature Walkthrough",
    artist: "Michelin Production Guide",
    type: 'tts',
    source: SCRIPT_TEXT
  },
  {
    title: "Restaurant Ambiance (Lo-Fi)",
    artist: "Michelin Studio Experience",
    type: 'url',
    source: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    title: "Culinary Beats",
    artist: "MrDelivery AI Beats",
    type: 'url',
    source: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  }
];

const AudioPlayer: React.FC = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Initial UI Loading Protocol
  useEffect(() => {
    const loadingDuration = 2500;
    const intervalTime = 50;
    const steps = loadingDuration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = Math.min((currentStep / steps) * 100, 100);
      setLoadProgress(progress);

      if (currentStep >= steps) {
        clearInterval(timer);
        setIsInitializing(false);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // Track Loading Logic
  useEffect(() => {
    const loadTrack = async () => {
      const track = PLAYLIST[currentTrackIndex];
      
      // Stop and Reset current audio
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      
      setCurrentTime(0);
      setDuration(0); 
      
      if (track.type === 'url') {
        setAudioUrl(track.source);
      } else if (track.type === 'tts') {
        setIsSynthesizing(true);
        try {
          const buffer = await speakText(track.source);
          const blob = new Blob([buffer], { type: 'audio/mp3' });
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
        } catch (error) {
          console.error("Failed to synthesize audio:", error);
          // Fallback to next track if synthesis fails
          if (currentTrackIndex < PLAYLIST.length - 1) {
             setCurrentTrackIndex(prev => prev + 1);
          }
        } finally {
          setIsSynthesizing(false);
        }
      }
    };

    if (!isInitializing) {
      loadTrack();
    }
  }, [currentTrackIndex, isInitializing]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.log("Audio play blocked:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const changeTrack = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setCurrentTrackIndex(prev => (prev + 1) % PLAYLIST.length);
    } else {
      setCurrentTrackIndex(prev => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const x = clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(x / width, 1));
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
    if (val > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const nextMute = !isMuted;
      setIsMuted(nextMute);
      audioRef.current.muted = nextMute;
    }
  };

  const currentTrack = PLAYLIST[currentTrackIndex];

  return (
    <div className="w-full max-w-2xl mx-auto mb-16 animate-in fade-in duration-1000 relative z-20">
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          if (currentTrackIndex < PLAYLIST.length - 1) changeTrack('next');
        }}
        preload="auto"
      />

      <div className="bg-zinc-900/60 border border-white/5 rounded-[2.5rem] p-6 sm:p-10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group ring-1 ring-white/5">
        {isInitializing ? (
          <div className="flex flex-col items-center justify-center py-10 animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                 <Loader2 className="animate-spin text-orange-500" size={28} strokeWidth={2} />
                 <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
              </div>
              <span className="text-xs font-black uppercase tracking-[0.4em] text-zinc-400">Booting Hi-Fi Protocol... {Math.round(loadProgress)}%</span>
            </div>
            <div className="w-full max-w-md h-1.5 bg-zinc-800 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-orange-600 to-red-600 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(234,88,12,0.5)]"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        ) : isSynthesizing ? (
          <div className="flex flex-col items-center justify-center py-12 animate-in fade-in">
             <div className="w-16 h-16 bg-orange-600/10 rounded-full flex items-center justify-center mb-6 relative">
                <Wand2 className="text-orange-500 animate-pulse" size={32} />
                <div className="absolute inset-0 border-2 border-orange-500/30 rounded-full animate-ping"></div>
             </div>
             <h3 className="text-lg font-serif font-bold text-white mb-2">Generating Voice Track</h3>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Gemini Neural TTS Processing...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/30 group-hover:scale-110 transition-transform duration-500 shadow-lg shrink-0">
                  {currentTrack.type === 'tts' ? <Wand2 size={28} /> : <Music size={28} />}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-lg font-serif font-bold text-white tracking-tight truncate pr-4">{currentTrack.title}</h4>
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {currentTrack.artist}
                  </p>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-950/50 rounded-lg border border-zinc-800 shadow-inner">
                  <ListMusic size={12} className="text-zinc-500" />
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{currentTrackIndex + 1}/{PLAYLIST.length}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div 
                ref={progressBarRef}
                onClick={handleSeek}
                className="w-full h-3 bg-zinc-800/80 rounded-full cursor-pointer relative group/progress overflow-hidden border border-white/5 shadow-inner"
              >
                <div 
                  className="absolute h-full bg-gradient-to-r from-orange-600 to-red-600 transition-all duration-100 ease-linear shadow-[0_0_20px_rgba(234,88,12,0.4)]"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
                <div 
                  className="absolute h-full w-4 bg-white/20 blur-md"
                  style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%`, transform: 'translateX(-50%)' }}
                />
              </div>
              <div className="flex justify-between items-center px-2">
                <span className="text-[11px] font-mono text-zinc-500 font-bold tracking-tighter">{formatTime(currentTime)}</span>
                <span className="text-[11px] font-mono text-zinc-400 font-bold tracking-tighter">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-4 sm:gap-6">
                <button 
                  onClick={() => changeTrack('prev')}
                  className="p-3 text-zinc-600 hover:text-white transition-all hover:scale-110 active:scale-95 bg-zinc-900/50 rounded-xl border border-zinc-800"
                  title="Previous Track"
                >
                  <SkipBack size={20} />
                </button>
                
                <button 
                  onClick={() => { if(audioRef.current) audioRef.current.currentTime -= 10; }}
                  className="p-2 text-zinc-500 hover:text-orange-400 transition-colors"
                  title="Rewind 10s"
                >
                  <RotateCcw size={18} />
                </button>

                <button 
                  onClick={togglePlay}
                  className="w-16 h-16 bg-orange-600 hover:bg-orange-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-orange-950/50 transition-all active:scale-90 ring-8 ring-orange-600/10 group/play"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={28} fill="white" className="group-hover/play:scale-110 transition-transform" /> : <Play size={28} fill="white" className="ml-1 group-hover/play:scale-110 transition-transform" />}
                </button>

                <button 
                  onClick={() => { if(audioRef.current) audioRef.current.currentTime += 10; }}
                  className="p-2 text-zinc-500 hover:text-orange-400 transition-colors"
                  title="Forward 10s"
                >
                  <RotateCw size={18} />
                </button>

                <button 
                  onClick={() => changeTrack('next')}
                  className="p-3 text-zinc-600 hover:text-white transition-all hover:scale-110 active:scale-95 bg-zinc-900/50 rounded-xl border border-zinc-800"
                  title="Next Track"
                >
                  <SkipForward size={20} />
                </button>
              </div>

              <div className="flex items-center gap-5 w-full sm:w-auto bg-zinc-950/30 p-4 rounded-[1.5rem] border border-white/5">
                <button onClick={toggleMute} className="text-zinc-500 hover:text-orange-500 transition-colors">
                  {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                </button>
                <div className="relative flex items-center group/vol">
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-full sm:w-28 accent-orange-500 h-1.5 bg-zinc-800 rounded-full cursor-pointer appearance-none transition-all hover:h-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Abstract design elements */}
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-1000 rotate-12">
           <Music size={180} strokeWidth={0.5} />
        </div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-600/5 blur-[80px] rounded-full"></div>
      </div>
      
      {/* Help Tip */}
      <div className="mt-4 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-600">
         <Info size={12} />
         <span>Tip: The Walkthrough is AI-Generated in Real-Time</span>
      </div>
    </div>
  );
};

export default AudioPlayer;