"use client";

import { useEffect, useState } from "react";
import usePlayer from "@/hooks/usePlayer";
import { supabase } from "@/lib/supabaseClient";
import { User, Disc, Music, Mic2, Info, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const NowPlayingPage = () => {
  const player = usePlayer();
  const router = useRouter();
  const [song, setSong] = useState(null);
  const [activeTab, setActiveTab] = useState('lyrics'); 

  useEffect(() => {
    if (typeof window !== 'undefined' && player.activeId && window.__SONG_MAP__) {
        const songData = window.__SONG_MAP__[player.activeId];
        if (songData) {
            setSong(songData);
            return;
        }
    }
    const fetchSong = async () => {
        if (!player.activeId) return;
        if (!song) router.push('/');
    };
    fetchSong();
  }, [player.activeId, router]);

  if (!song) return (
    <div className="w-full h-full flex items-center justify-center text-neutral-500 font-mono gap-2">
        <Loader2 className="animate-spin" /> [LOADING_DATA]...
    </div>
  );

  return (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-10 gap-6 p-6 pb-[120px] overflow-hidden">
      
      {/* --- CỘT TRÁI (70%) - VISUAL ART --- */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center relative perspective-1000">
         
         {/* 1. LAYER NỀN: ĐĨA THAN (VINYL) */}
         {/* Đã sửa: Light Mode dùng đĩa trắng, Dark Mode dùng đĩa đen */}
         <div className="relative w-[350px] h-[350px] md:w-[600px] md:h-[600px] flex items-center justify-center animate-[spin_10s_linear_infinite]">
            <div className="absolute inset-0 rounded-full shadow-2xl
                /* Light Mode: Đĩa trắng, vân xám */
                bg-neutral-100 border-4 border-neutral-300
                bg-[repeating-radial-gradient(#f5f5f5,#f5f5f5_2px,#e5e5e5_3px,#e5e5e5_4px)]
                
                /* Dark Mode: Đĩa đen, vân than chì */
                dark:bg-black dark:border-neutral-800 
                dark:bg-[repeating-radial-gradient(black,black_2px,#1a1a1a_3px,#1a1a1a_4px)]
            "></div>
            
            {/* Vòng tâm đĩa */}
            <div className="absolute w-24 h-24 rounded-full bg-neutral-200 dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-800 z-0"></div>

            <div className="absolute inset-0 rounded-full shadow-[0_0_100px_rgba(16,185,129,0.2)] opacity-50"></div>
         </div>

         {/* 2. LAYER GIỮA: TAM GIÁC BO TRÒN */}
         <div className="absolute z-10 w-[280px] h-[280px] md:w-[450px] md:h-[450px] flex items-center justify-center pl-12">
            <div className="relative w-full h-full filter drop-shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-transform duration-500 hover:scale-105">
                <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <clipPath id="roundedPlayBtn">
                            <path d="M 93.5 46.4 L 12.5 1.4 C 10.5 0.3 8 1.8 8 4.1 L 8 95.9 C 8 98.2 10.5 99.7 12.5 98.6 L 93.5 53.6 C 95.5 52.5 95.5 47.5 93.5 46.4 Z" />
                        </clipPath>
                        
                        {/* Gradient bóng kính */}
                        <linearGradient id="glassGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
                            <stop offset="50%" stopColor="transparent" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                        </linearGradient>
                    </defs>

                    {song.image_path ? (
                        <image 
                            href={song.image_path} 
                            width="100%" 
                            height="100%" 
                            preserveAspectRatio="xMidYMid slice"
                            clipPath="url(#roundedPlayBtn)" 
                        />
                    ) : (
                        // Fallback khi không có ảnh
                        <g clipPath="url(#roundedPlayBtn)">
                            {/* Nền Placeholder cũng đổi màu theo theme */}
                            {/* Dùng class CSS 'fill-current' và điều khiển màu ở thẻ cha */}
                            <foreignObject x="0" y="0" width="100%" height="100%">
                                <div className="w-full h-full bg-neutral-200 dark:bg-neutral-900 flex items-center justify-center pl-4">
                                    <Music size={80} className="text-emerald-500/50"/>
                                </div>
                            </foreignObject>
                        </g>
                    )}

                    {/* Lớp phủ bóng kính */}
                    <path 
                        d="M 93.5 46.4 L 12.5 1.4 C 10.5 0.3 8 1.8 8 4.1 L 8 95.9 C 8 98.2 10.5 99.7 12.5 98.6 L 93.5 53.6 C 95.5 52.5 95.5 47.5 93.5 46.4 Z"
                        fill="url(#glassGradient)"
                        className="pointer-events-none"
                    />
                </svg>
            </div>
         </div>

         {/* 3. INFO DƯỚI ĐĨA */}
         <div className="absolute bottom-4 left-0 right-0 text-center z-20">
            <h1 className="text-3xl md:text-5xl font-bold font-mono text-neutral-900 dark:text-white tracking-tighter drop-shadow-xl truncate px-10 transition-colors">
                {song.title}
            </h1>
            <p className="text-lg md:text-xl font-mono text-emerald-600 dark:text-emerald-400 mt-2 flex items-center justify-center gap-2 drop-shadow-md">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                {song.author}
            </p>
         </div>
      </div>

      {/* --- CỘT PHẢI (30%) --- */}
      <div className="lg:col-span-3 flex flex-col h-full bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-neutral-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl transition-colors duration-300">
         <div className="flex border-b border-neutral-200 dark:border-white/10">
            <button 
                onClick={() => setActiveTab('lyrics')}
                className={`flex-1 py-4 text-xs font-mono tracking-widest uppercase transition-colors flex items-center justify-center gap-2
                    ${activeTab === 'lyrics' 
                        ? 'bg-neutral-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-500 font-bold border-b-2 border-emerald-500' 
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'}`}
            >
                <Mic2 size={16}/> LYRICS
            </button>
            <button 
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-4 text-xs font-mono tracking-widest uppercase transition-colors flex items-center justify-center gap-2
                    ${activeTab === 'info' 
                        ? 'bg-neutral-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-500 font-bold border-b-2 border-emerald-500' 
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'}`}
            >
                <Info size={16}/> CREDITS
            </button>
         </div>

         <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
            {activeTab === 'lyrics' ? (
                song.lyrics ? (
                    <div className="text-center space-y-6">
                        {song.lyrics.split('\n').map((line, i) => (
                            <p key={i} className="text-lg font-medium text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-white transition-colors cursor-default leading-relaxed">
                                {line}
                            </p>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 gap-4 opacity-70">
                        <Disc size={40} className="animate-spin-slow"/>
                        <p className="font-mono text-xs tracking-widest">[INSTRUMENTAL / NO_LYRICS]</p>
                    </div>
                )
            ) : (
                <div className="space-y-6 font-mono text-sm">
                    <div>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">Artist</p>
                        <p className="text-neutral-800 dark:text-white text-xl font-bold">{song.author}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">Track Title</p>
                        <p className="text-neutral-800 dark:text-white text-lg">{song.title}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">Duration</p>
                        <p className="text-neutral-600 dark:text-neutral-400">{song.duration || "N/A"}</p>
                    </div>
                    <div className="pt-6 border-t border-neutral-200 dark:border-white/10">
                        <p className="text-[10px] text-neutral-400 text-center">:: METADATA_END ::</p>
                    </div>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default NowPlayingPage;