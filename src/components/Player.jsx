"use client";

import { useEffect, useState } from "react";
import usePlayer from "@/hooks/usePlayer";
import useLoadSongUrl from "@/hooks/useLoadSongUrl";

import PlayerContent from "./PlayerContent";

const Player = () => {
  const player = usePlayer();
  const [song, setSong] = useState(null);

  // Get song data from window songMap (set by PageContent)
  useEffect(() => {
    if (typeof window !== 'undefined' && player.activeId && window.__SONG_MAP__) {
      const songData = window.__SONG_MAP__[player.activeId];
      setSong(songData || null);
      console.log('[Player] Song found:', songData?.title);
    } else {
      setSong(null);
    }
  }, [player.activeId]);

  const songUrl = useLoadSongUrl(song);

  console.log('[Player] State:', {
    activeId: player.activeId,
    songLoaded: !!song,
    urlLoaded: !!songUrl,
  });

  if (!song || !songUrl || !player.activeId) {
    return (
      <div 
        className="
          fixed 
          bottom-0 
          bg-black 
          w-full 
          py-2 
          h-[80px] 
          px-4
          border-t border-neutral-800
          flex items-center justify-center
          text-neutral-500 text-sm
        "
      >
        {!player.activeId ? 'Chọn bài hát để phát' : 'Đang tải...'}
      </div>
    );
  }

  return (
    <div 
      className="
        fixed 
        bottom-0 
        bg-black 
        w-full 
        py-2 
        h-[80px] 
        px-4
      "
    >
      <PlayerContent key={songUrl} song={song} songUrl={songUrl} />
    </div>
  );
}

export default Player;