"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // <--- 1. IMPORT PORTAL
import { X, Search, Sliders } from "lucide-react";
import { useRouter } from "next/navigation";
import qs from "query-string";

const AdvancedSearchModal = ({ onClose, currentSearch }) => {
  const router = useRouter();
  const [title, setTitle] = useState(currentSearch || "");
  const [artist, setArtist] = useState("");
  const [tag, setTag] = useState("");
  
  // State để đảm bảo code chỉ chạy trên Client (tránh lỗi document not defined)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Khóa cuộn trang khi mở Modal
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSearch = () => {
    const query = {};
    if (title) query.title = title;
    if (tag) query.tag = tag;
    
    if (artist && !title) {
        query.title = artist;
    } else if (artist && title) {
        query.title = `${title} ${artist}`;
    }

    const url = qs.stringifyUrl({ 
        url: '/search', 
        query: query 
    }, { skipEmptyString: true });

    router.push(url);
    onClose();
  };

  // Nếu chưa mount (server-side), không render gì cả
  if (!mounted) return null;

  // --- 2. DÙNG CREATE PORTAL ---
  // Đưa toàn bộ Modal ra ngoài thẻ body
  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-24 p-4">
      
      {/* --- BACKDROP (Lớp màng chắn) --- */}
      {/* absolute inset-0: Phủ kín toàn màn hình */}
      {/* cursor-default: Để chuột không biến hình khi hover vào nền */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-neutral-900/95 via-neutral-900/80 to-neutral-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* --- MODAL CONTENT --- */}
      <div 
        className="
          relative z-10 /* Nổi lên trên backdrop */
          w-full max-w-lg 
          bg-white dark:bg-neutral-900 
          border border-neutral-200 dark:border-white/10 
          rounded-2xl shadow-2xl 
          flex flex-col 
          max-h-[80vh]
          animate-in slide-in-from-top-10 duration-300
          overflow-hidden
        "
        onClick={(e) => e.stopPropagation()} // Chặn sự kiện click lọt xuống dưới
      >
         
         {/* HEADER */}
         <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-white/5 bg-white/50 dark:bg-neutral-900/50 shrink-0">
            <div className="flex items-center gap-3 text-emerald-500">
                <Sliders size={24}/>
                <h2 className="text-xl font-bold font-mono tracking-tighter">ADVANCED SEARCH</h2>
            </div>
            
            <button 
                onClick={onClose} 
                className="text-neutral-400 hover:text-red-500 transition hover:rotate-90 duration-300 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5"
            >
                <X size={24} />
            </button>
         </div>

         {/* BODY */}
         <div className="p-6 overflow-y-auto custom-scrollbar space-y-5 font-mono text-sm">
            
            <div className="flex flex-col gap-2">
                <label className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-widest font-bold">Song Title</label>
                <input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="e.g. Shape of You"
                    autoFocus
                    className="p-3 rounded-lg bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-white/10 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-neutral-900 dark:text-white transition"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-widest font-bold">Artist Name</label>
                <input 
                    value={artist} 
                    onChange={(e) => setArtist(e.target.value)} 
                    placeholder="e.g. Ed Sheeran"
                    className="p-3 rounded-lg bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-white/10 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-neutral-900 dark:text-white transition"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-widest font-bold">Genre / Tag</label>
                <select 
                    value={tag} 
                    onChange={(e) => setTag(e.target.value)} 
                    className="p-3 rounded-lg bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-white/10 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-neutral-900 dark:text-white transition cursor-pointer appearance-none"
                >
                    <option value="">All Genres</option>
                    <option value="pop">Pop</option>
                    <option value="rock">Rock</option>
                    <option value="electronic">Electronic</option>
                    <option value="hiphop">HipHop</option>
                    <option value="jazz">Jazz</option>
                    <option value="indie">Indie</option>
                    <option value="classical">Classical</option>
                    <option value="soundtrack">Soundtrack</option>
                </select>
            </div>

            <div className="pt-4 pb-2">
                <button 
                    onClick={handleSearch} 
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white dark:text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition shadow-lg hover:shadow-emerald-500/20 active:scale-95"
                >
                    <Search size={18} strokeWidth={3}/> 
                    SEARCH NOW
                </button>
            </div>

         </div>
      </div>
    </div>,
    document.body // <--- Đích đến của Portal là body
  );
};

export default AdvancedSearchModal;