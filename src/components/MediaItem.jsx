"use client";

import { useLoadImage } from "@/hooks/useLoadImage";
import { Music } from "lucide-react";

const MediaItem = ({ data }) => {
  const imageUrl = useLoadImage(data);

  return (
    <div className="flex items-center gap-x-3 cursor-pointer hover:opacity-75 transition w-fit min-w-0">
      <div
        className="relative rounded-md min-h-[40px] min-w-[40px] overflow-hidden bg-neutral-700 flex items-center justify-center flex-shrink-0"
        style={{
          backgroundImage: imageUrl?.includes('data:') ? 'none' : `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {!imageUrl || imageUrl.includes('data:') ? (
          <Music size={20} className="text-neutral-400" />
        ) : null}
      </div>
      <div className="flex flex-col gap-y-1 overflow-hidden min-w-0">
        <p className="text-white text-sm font-medium truncate">
          {data?.title || 'Unknown Title'}
        </p>
        <p className="text-neutral-400 text-xs truncate">
          {data?.author || 'Unknown Artist'}
        </p>
      </div>
    </div>
  );
};

export default MediaItem;
