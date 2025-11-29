"use client";

import SongItem from "@/components/SongItem";
import usePlayer from "@/hooks/usePlayer";
import Link from "next/link"; 
import { ArrowRight } from "lucide-react"; 

const SongSection = ({ title, songs, moreLink }) => {
  const player = usePlayer();

  const onPlay = (id) => {
    player.setId(id);
    player.setIds(songs.map((s) => s.id));
    
    if (typeof window !== "undefined") {
        const songMap = {};
        songs.forEach(song => songMap[song.id] = song);
        window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
    }
  };

  if (!songs || songs.length === 0) return null;

  return (
    <div className="mb-12">
      
      {/* --- FIX: Chỉ render Header nếu có title --- */}
      {title && (
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
              {/* Thanh dọc màu xanh */}
              <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
              <h2 className="text-xl font-bold font-mono tracking-tighter text-neutral-800 dark:text-white uppercase">
                  {title}
              </h2>
           </div>
           
           {moreLink && (
               <Link href={moreLink} className="text-xs font-mono text-neutral-500 hover:text-emerald-500 transition hidden sm:block">
                   VIEW_ALL {'>'}
               </Link>
           )}
        </div>
      )}

      {/* Grid bài hát */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        
        {songs.map((item) => (
          <SongItem 
            key={item.id} 
            onClick={onPlay} 
            data={item} 
          />
        ))}

        {/* Thẻ Xem Thêm (Nếu có) */}
        {moreLink && (
            <Link href={moreLink} className="
                group relative flex flex-col items-center justify-center 
                rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 p-3
                bg-neutral-200/30 dark:bg-neutral-900/40
                border border-white/60 dark:border-white/5
                backdrop-blur-xl
                shadow-sm dark:shadow-none
                hover:bg-white/60 dark:hover:bg-neutral-800/60
                hover:border-emerald-500/50
                hover:shadow-[0_8px_32px_0_rgba(16,185,129,0.2)]
                hover:-translate-y-2
            ">
                <div className="w-full aspect-square rounded-xl bg-neutral-300/50 dark:bg-white/5 flex flex-col items-center justify-center gap-3 transition-colors group-hover:bg-emerald-500/20">
                    <div className="p-4 rounded-full bg-white dark:bg-black group-hover:scale-110 transition duration-300 border border-neutral-200 dark:border-white/10 group-hover:border-emerald-500">
                        <ArrowRight size={24} className="text-neutral-600 dark:text-white group-hover:text-emerald-500"/>
                    </div>
                    <span className="text-xs font-mono font-bold tracking-widest text-neutral-600 dark:text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        VIEW_ALL
                    </span>
                </div>
                
                <div className="flex flex-col items-center w-full pt-3 gap-y-1 opacity-0">
                    <p className="font-bold text-sm">Placeholder</p>
                    <p className="text-[10px]">Placeholder</p>
                </div>
            </Link>
        )}

      </div>
    </div>
  );
};

export default SongSection;