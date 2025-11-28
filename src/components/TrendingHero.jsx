"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Play, User, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import usePlayer from "@/hooks/usePlayer";

const TrendingHero = ({ songs }) => {
  const player = usePlayer();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(interval);
  }, [currentIndex, isHovered]);

  const nextSlide = () => {
    if (!songs || songs.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % songs.length);
  };

  const prevSlide = () => {
    if (!songs || songs.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
  };

  // Bảo vệ activeSong khỏi null/undefined
  const activeSong = songs && songs.length > 0 ? songs[currentIndex] : null;

  const handlePlay = () => {
    if (!activeSong) return;

    // 1. Cập nhật Song Map toàn cục để Player biết thông tin bài hát
    if (typeof window !== "undefined") {
        const songMap = {};
        songs.forEach(song => songMap[song.id] = song);
        // Merge với map cũ để không làm mất dữ liệu của các section khác
        window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
    }

    // 2. Set ID bài hát đang chọn
    player.setId(activeSong.id);
    
    // 3. Set danh sách phát là toàn bộ list trending này
    player.setIds(songs.map(s => s.id));
  };

  if (!activeSong) return null;

  return (
    <div 
        className="relative w-full h-[400px] md:h-[450px] rounded-3xl overflow-hidden mb-12 group transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_0_50px_rgba(16,185,129,0.1)] border border-neutral-200 dark:border-white/10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. BACKGROUND BLUR */}
      <div className="absolute inset-0">
         <Image 
            src={activeSong.image_path || '/images/music-placeholder.png'} 
            alt="bg" 
            fill 
            className="object-cover blur-3xl opacity-50 dark:opacity-30 scale-110 transition-all duration-1000"
         />
         <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/40 to-transparent dark:from-black/90 dark:via-black/60 dark:to-transparent"></div>
      </div>

      {/* 2. NỘI DUNG CHÍNH */}
      <div className="absolute inset-0 flex items-center p-6 md:p-12 gap-8 md:gap-16">
         
         {/* CỘT TRÁI: ẢNH BÌA */}
         <div className="hidden md:block relative w-[280px] h-[280px] shrink-0 rounded-2xl overflow-hidden shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500 border-2 border-white/20">
            <Image 
                src={activeSong.image_path || '/images/music-placeholder.png'} 
                alt={activeSong.title} 
                fill 
                className="object-cover"
            />
         </div>

         {/* CỘT PHẢI: THÔNG TIN */}
         {/* Thêm key={activeSong.id} để trigger animation khi đổi bài */}
         <div key={activeSong.id} className="flex-1 flex flex-col items-start justify-center z-10 animate-in slide-in-from-right-10 duration-500">
            <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-emerald-500 text-black text-xs font-bold font-mono rounded-full animate-pulse">
                    #TRENDING_NOW
                </span>
                <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                    {currentIndex + 1} / {songs.length}
                </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold font-mono text-neutral-900 dark:text-white mb-2 tracking-tighter drop-shadow-sm line-clamp-2">
                {activeSong.title}
            </h1>

            <Link 
                href={`/artist/${encodeURIComponent(activeSong.author)}`}
                className="text-lg md:text-2xl text-emerald-600 dark:text-emerald-400 font-mono mb-8 flex items-center gap-2 hover:underline cursor-pointer w-fit"
            >
                <User size={24}/> {activeSong.author}
            </Link>

            <div className="flex items-center gap-4">
                <button 
                    onClick={handlePlay}
                    className="flex items-center gap-3 bg-neutral-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-full font-bold font-mono hover:scale-105 transition shadow-lg active:scale-95 group/btn"
                >
                    <Play fill="currentColor" className="group-hover/btn:text-emerald-500 transition-colors"/> 
                    LISTEN_NOW
                </button>
            </div>
         </div>
      </div>

      {/* 3. NÚT ĐIỀU HƯỚNG */}
      <div className="absolute bottom-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-300">
         <button onClick={prevSlide} className="p-3 rounded-full bg-white/20 dark:bg-black/40 hover:bg-white/40 dark:hover:bg-black/60 backdrop-blur-md transition text-neutral-800 dark:text-white">
            <ChevronLeft size={24}/>
         </button>
         <button onClick={nextSlide} className="p-3 rounded-full bg-white/20 dark:bg-black/40 hover:bg-white/40 dark:hover:bg-black/60 backdrop-blur-md transition text-neutral-800 dark:text-white">
            <ChevronRight size={24}/>
         </button>
      </div>

    </div>
  );
};

export default TrendingHero;