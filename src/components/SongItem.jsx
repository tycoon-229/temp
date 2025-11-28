"use client";

import Image from "next/image";
import useLoadImage from "@/hooks/useLoadImage";
import { Play } from "lucide-react";
import Link from "next/link";

const SongItem = ({ data, onClick }) => {
  const imagePath = useLoadImage(data);

  return (
    <div
      onClick={() => onClick(data.id)}
      className="
        relative 
        group 
        flex 
        flex-col 
        items-center 
        justify-center 
        rounded-2xl 
        overflow-hidden 
        cursor-pointer 
        transition-all
        duration-300
        p-3 /* Padding để nội dung cách viền kính ra một chút */
        
        /* --- STYLE CHO THẺ BAO NGOÀI (THE CARD) --- */
        
        /* Light Mode: Kính đục màu xám trắng (Cloudy) */
        bg-neutral-100/80 
        border border-neutral-200
        shadow-sm
        backdrop-blur-md /* Làm mờ nền phía sau thẻ */

        /* Dark Mode: Kính đen mờ */
        dark:bg-neutral-900/40
        dark:border-white/5
        dark:shadow-none
        
        /* --- HOVER EFFECT (Toàn bộ thẻ) --- */
        /* Light: Đậm hơn chút / Dark: Sáng hơn chút */
        hover:bg-white dark:hover:bg-neutral-800/60
        
        /* Viền phát sáng Emerald */
        hover:border-emerald-500/50
        
        /* Đổ bóng xanh Emerald */
        hover:shadow-[0_5px_20px_rgba(16,185,129,0.15)]
        
        /* Nhích nhẹ lên trên */
        hover:-translate-y-1
      "
    >
      {/* --- PHẦN 1: ẢNH (Nằm gọn trong thẻ kính) --- */}
      <div className="relative aspect-square w-full h-full rounded-xl overflow-hidden shadow-inner">
        <Image
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          src={imagePath || "/images/liked.png"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          alt="Image"
        />
        
        {/* Play Overlay Button */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[1px]">
            <div className="bg-emerald-500 p-3 rounded-full shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                <Play size={24} fill="black" className="text-black ml-1" />
            </div>
        </div>
      </div>

      {/* --- PHẦN 2: THÔNG TIN (Chữ) --- */}
      <div className="flex flex-col items-start w-full pt-3 gap-y-1">
        <p className="font-bold font-mono truncate w-full text-sm text-neutral-800 dark:text-white transition-colors">
            {data.title}
        </p>
        <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 w-full truncate pb-1 flex items-center gap-1 uppercase tracking-wider">
          {/* Link tới trang nghệ sĩ */}
          <Link 
            href={`/artist/${encodeURIComponent(data.author)}`}
            onClick={(e) => e.stopPropagation()} // Ngăn không cho click lan ra ngoài (không phát nhạc)
            className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors z-10"
          >
            {data.author}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SongItem;