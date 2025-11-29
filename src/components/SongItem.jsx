"use client";

import Image from "next/image";
import useLoadImage from "@/hooks/useLoadImage";
import { Play } from "lucide-react";
import Link from "next/link";
import { ScanlineOverlay } from "./CyberComponents"; // <--- IMPORT MỚI

const SongItem = ({ data, onClick }) => {
  const imagePath = useLoadImage(data);

  return (
    <div
      onClick={() => onClick(data.id)}
      className="
        relative 
        group 
        flex flex-col items-center justify-center 
        rounded-2xl overflow-hidden cursor-pointer 
        transition-all duration-300
        p-3
        
        /* Style Glass */
        bg-neutral-100/80 border border-neutral-200 shadow-sm backdrop-blur-md
        dark:bg-neutral-900/40 dark:border-white/5 dark:shadow-none
        
        /* Hover Effect */
        hover:bg-white dark:hover:bg-neutral-800/60
        hover:border-emerald-500/50
        hover:shadow-[0_5px_20px_rgba(16,185,129,0.15)]
        hover:-translate-y-1
      "
    >
      {/* --- 1. TÍCH HỢP SCANLINE (Chỉ hiện khi Hover) --- */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0">
         <ScanlineOverlay />
      </div>

      {/* --- 2. ẢNH (z-10 để nổi lên trên scanline) --- */}
      <div className="relative aspect-square w-full h-full rounded-xl overflow-hidden shadow-inner z-10">
        <Image
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          src={imagePath || "/images/liked.png"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          alt="Image"
        />
        
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[1px]">
            <div className="bg-emerald-500 p-3 rounded-full shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                <Play size={24} fill="black" className="text-black ml-1" />
            </div>
        </div>
      </div>

      {/* --- 3. THÔNG TIN (z-10) --- */}
      <div className="flex flex-col items-start w-full pt-3 gap-y-1 z-10 relative">
        
        {/* Link Tên Bài Hát */}
        <Link 
            href="/now-playing"
            onClick={(e) => e.stopPropagation()} 
            className="font-bold font-mono truncate w-full text-sm text-neutral-800 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors hover:underline"
        >
            {data.title}
        </Link>

        {/* Link Nghệ Sĩ */}
        <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 w-full truncate pb-1 flex items-center gap-1 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
          <Link 
            href={`/artist/${encodeURIComponent(data.author)}`}
            onClick={(e) => e.stopPropagation()} 
            className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
          >
            {data.author}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SongItem;