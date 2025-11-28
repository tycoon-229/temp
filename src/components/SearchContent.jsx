"use client";

import { Play } from "lucide-react";
import usePlayer from "@/hooks/usePlayer";
import { useEffect } from "react";
import Link from "next/link"; // <--- 1. Import Link

const SearchContent = ({ songs }) => {
  const player = usePlayer();

  // Cập nhật song map để Player biết thông tin bài hát
  useEffect(() => {
      const songMap = {};
      songs.forEach(song => songMap[song.id] = song);
      if (typeof window !== "undefined") {
        window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
      }
  }, [songs]);

  const handlePlay = (id) => {
    player.setId(id);
    player.setIds(songs.map((song) => song.id));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500">
      {songs.map((song, idx) => (
        <div 
          key={song.id}
          onClick={() => handlePlay(song.id)}
          className="group relative bg-neutral-100/50 dark:bg-black/40 border border-neutral-200 dark:border-white/5 p-4 rounded-xl hover:bg-emerald-500/10 dark:hover:bg-white/10 transition cursor-pointer overflow-hidden flex flex-col gap-3 hover:border-emerald-500/50 shadow-sm hover:shadow-md"
        >
           {/* IMAGE */}
           <div className="relative w-full aspect-square bg-neutral-300 dark:bg-neutral-800 rounded-lg overflow-hidden shadow-lg group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition duration-300">
              <img 
                src={song.image_path || '/images/music-placeholder.png'} 
                alt={song.title}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
              />
              {/* Play Overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 backdrop-blur-[2px]">
                 <div className="bg-emerald-500 text-black p-3 rounded-full shadow-xl transform scale-50 group-hover:scale-100 transition duration-300">
                    <Play size={24} fill="black" className="ml-1"/>
                 </div>
              </div>
           </div>

           {/* INFO */}
           <div className="flex flex-col gap-1 z-10">
              <h3 className="font-bold text-neutral-800 dark:text-white font-mono truncate text-lg group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition">
                {song.title}
              </h3>
              
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate uppercase tracking-wider flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                 
                 {/* --- 2. LINK NGHỆ SĨ --- */}
                 <Link 
                    href={`/artist/${encodeURIComponent(song.author)}`}
                    onClick={(e) => e.stopPropagation()} // Chặn sự kiện click lan ra ngoài (không phát nhạc)
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
                 >
                    {song.author}
                 </Link>

              </div>
           </div>
           
           {/* Index Number Decoration */}
           <span className="absolute top-2 right-4 text-[40px] font-bold font-mono text-neutral-400/20 dark:text-white/5 pointer-events-none">
              {idx + 1 < 10 ? `0${idx+1}` : idx+1}
           </span>
        </div>
      ))}
    </div>
  );
};

export default SearchContent;