"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import SongItem from "./SongItem";
import usePlayer from "@/hooks/usePlayer";
import useRealtimeSongs from "@/hooks/useRealtimeSongs";
import { Disc, ChevronLeft, ChevronRight } from "lucide-react"; 

const PageContent = ({ songs }) => {
  // --- 1. KHAI BÁO HOOKS ---
  const player = usePlayer();
  const hasSetIds = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);

  const PER_PAGE = 24; // Tăng lên 24 để chia hết cho 2,3,4,6 cột (đẹp hơn)

  const songMap = useMemo(() => {
    if (!songs) return {}; 
    const map = {};
    songs.forEach((song) => {
      map[song.id] = song;
    });
    return map;
  }, [songs]);

  useEffect(() => {
    // Chỉ set playlist nếu songs thay đổi (để tránh loop)
    if (songs && songs.length > 0) {
      // Logic này để đảm bảo khi vào trang Search, player biết danh sách bài hát
      // Nhưng không nên tự động setIds ngay lập tức nếu chưa bấm play (tránh làm mất playlist đang nghe)
      if (typeof window !== "undefined") {
        window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
      }
    }
  }, [songs, songMap]);

  const liveSongs = useRealtimeSongs(songs || []);
  const totalPages = Math.max(1, Math.ceil((songs || []).length / PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]);

  // --- 2. CHECK EMPTY ---
  if (!songs || songs.length === 0) {
    return (
        <div className="mt-20 flex flex-col items-center justify-center gap-4 text-neutral-400 opacity-70 animate-in fade-in zoom-in duration-500">
            <Disc size={50} className="animate-spin-slow text-neutral-600 dark:text-neutral-500"/>
            <div className="text-xs font-mono tracking-widest uppercase border border-neutral-300 dark:border-neutral-700 px-6 py-3 rounded-full bg-white/50 dark:bg-black/20">
                [SYSTEM_MESSAGE]: NO_DATA_FOUND
            </div>
        </div>
    );
  }

  // --- 3. LOGIC RENDER ---
  const onClick = (id) => {
    player.setId(id);
    // Khi bấm vào 1 bài trong list này, set toàn bộ list hiện tại vào hàng đợi
    player.setIds(songs.map(s => s.id));
  };

  const start = (currentPage - 1) * PER_PAGE;
  const end = start + PER_PAGE;
  const pageSongs = liveSongs.slice(start, end);

  const gotoPage = (page) => {
    const p = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(p);
    // Cuộn nhẹ lên đầu lưới kết quả
    const grid = document.getElementById("songs-grid");
    if(grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-6 mt-12 mb-8 font-mono">
        <button
          onClick={() => gotoPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="
            flex items-center gap-2 px-5 py-2 rounded-full 
            bg-white/80 dark:bg-black/40 
            border border-neutral-300 dark:border-white/10
            text-neutral-800 dark:text-neutral-300 
            hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400
            disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-neutral-300
            transition-all duration-300
            shadow-sm backdrop-blur-sm
          "
        >
          <ChevronLeft size={16}/> PREV
        </button>

        <span className="text-sm text-neutral-600 dark:text-neutral-400 tracking-widest bg-white/50 dark:bg-white/5 px-4 py-2 rounded-lg border border-transparent hover:border-emerald-500/30 transition-colors">
            PAGE <span className="text-emerald-600 dark:text-emerald-500 font-bold text-lg mx-1">{currentPage}</span> / {totalPages}
        </span>

        <button
          onClick={() => gotoPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="
            flex items-center gap-2 px-5 py-2 rounded-full 
            bg-white/80 dark:bg-black/40 
            border border-neutral-300 dark:border-white/10
            text-neutral-800 dark:text-neutral-300 
            hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400
            disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-neutral-300
            transition-all duration-300
            shadow-sm backdrop-blur-sm
          "
        >
          NEXT <ChevronRight size={16}/>
        </button>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div 
        id="songs-grid"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 mt-6"
      >
        {pageSongs.map((item) => (
          <SongItem key={item.id} onClick={onClick} data={item} />
        ))}
      </div>

      {renderPagination()}
    </div>
  );
};

export default PageContent;