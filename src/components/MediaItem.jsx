"use client";

import Image from "next/image";
import useLoadImage from "@/hooks/useLoadImage";
import Link from "next/link"; 

const MediaItem = ({ data, onClick }) => {
  const imageUrl = useLoadImage(data);

  return (
    <div 
      className="
        flex items-center gap-x-3 cursor-default w-full p-2 rounded-md 
        /* Hiệu ứng hover nền cho item */
        hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 
        transition
      "
    >
      {/* 1. ẢNH BÌA -> Link tới Now Playing */}
      <Link 
        href="/now-playing" 
        className="relative rounded-md min-h-[48px] min-w-[48px] overflow-hidden cursor-pointer hover:opacity-80 transition shadow-sm"
      >
        <Image
          fill
          src={imageUrl || "/images/liked.png"}
          alt="Media Item"
          className="object-cover"
        />
      </Link>

      <div className="flex flex-col gap-y-1 overflow-hidden">
        {/* 2. TÊN BÀI HÁT -> Link tới Now Playing */}
        <Link 
            href="/now-playing"
            className="
                truncate cursor-pointer hover:underline transition font-mono
                /* Light: Đen đậm -> Hover Xanh ngọc đậm */
                text-neutral-900 hover:text-emerald-600 
                /* Dark: Trắng -> Hover Xanh ngọc sáng */
                dark:text-white dark:hover:text-emerald-500
            "
        >
            {data.title}
        </Link>
        
        {/* 3. TÊN NGHỆ SĨ -> Link tới Artist Page */}
        <Link 
            href={`/artist/${encodeURIComponent(data.author)}`}
            className="
                text-sm truncate cursor-pointer hover:underline transition font-mono
                /* Light: Xám trung tính -> Hover Đen */
                text-neutral-500 hover:text-neutral-900 
                /* Dark: Xám nhạt -> Hover Trắng */
                dark:text-neutral-400 dark:hover:text-white
            "
        >
            {data.author}
        </Link>
      </div>
    </div>
  );
}
 
export default MediaItem;