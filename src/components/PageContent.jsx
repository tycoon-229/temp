"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import SongItem from "./SongItem";
import usePlayer from "@/hooks/usePlayer";
import useRealtimeSongs from "@/hooks/useRealtimeSongs";

const PageContent = ({ songs }) => {
  // --- 1. KHAI BÁO TOÀN BỘ HOOK Ở ĐÂY (TRƯỚC KHI RETURN) ---
  const player = usePlayer();
  const hasSetIds = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);

  const PER_PAGE = 20; 

  // Memoize songs map
  const songMap = useMemo(() => {
    if (!songs) return {}; // Xử lý nếu songs null
    const map = {};
    songs.forEach((song) => {
      map[song.id] = song;
    });
    return map;
  }, [songs]);

  // Hook 1: Set IDs
  useEffect(() => {
    if (songs && songs.length > 0 && !hasSetIds.current) {
      const songIds = songs.map((song) => song.id);
      player.setIds(songIds);
      if (typeof window !== "undefined") {
        window.__SONG_MAP__ = songMap;
      }
      hasSetIds.current = true;
    }
  }, [songs, player, songMap]);

  // Hook 2: Realtime Songs (Đưa lên trên cùng)
  // Lưu ý: Nếu songs null, truyền mảng rỗng để hook không lỗi
  const liveSongs = useRealtimeSongs(songs || []);

  // Tính toán logic (Đưa lên trên luôn)
  const totalPages = Math.max(1, Math.ceil((songs || []).length / PER_PAGE));

  // Hook 3: Clamp page (Đưa lên trên return)
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]); // Thêm currentPage vào dependency cho chuẩn

  // --- 2. BÂY GIỜ MỚI ĐƯỢC PHÉP RETURN SỚM ---
  if (!songs || songs.length === 0) {
    return <div className="mt-4 text-neutral-400">No songs available.</div>;
  }

  // --- 3. LOGIC RENDER ---
  const onClick = (id) => {
    player.setId(id);
    console.log("Now playing song id:", id);
  };

  const start = (currentPage - 1) * PER_PAGE;
  const end = start + PER_PAGE;
  // Dùng liveSongs thay vì songs gốc
  const pageSongs = liveSongs.slice(start, end);

  const gotoPage = (page) => {
    const p = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPagination = () => {
    return (
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={() => gotoPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded bg-neutral-800 text-neutral-300 disabled:opacity-50 border border-neutral-700"
          aria-label="Previous page"
        >
          ← Prev
        </button>

        <button
          onClick={() => gotoPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded bg-neutral-800 text-neutral-300 disabled:opacity-50 border border-neutral-700"
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    );
  };

  return (
    <div>
      <div
        className={
          "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4"
        }
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