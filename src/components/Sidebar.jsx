"use client";

import { useEffect, useState } from "react";
import { Library, Plus, ListMusic, Loader2 } from "lucide-react"; 
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "./Navbar"; 
import CreatePlaylistModal from "./CreatePlaylistModal";

const Sidebar = ({ children }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // --- LOGIC FETCH DATA (Giữ nguyên) ---
  const fetchPlaylists = async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      setPlaylists(data || []);
    } catch (err) {
      console.error("Playlist Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const initData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user) {
            fetchPlaylists(session.user.id);
        } else if (mounted) {
            setLoading(false);
        }
    };
    initData();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            fetchPlaylists(session.user.id);
        } else if (event === 'SIGNED_OUT') {
            setPlaylists([]);
        }
    });

    return () => {
        mounted = false;
        authListener.subscription.unsubscribe();
    };
  }, []);

  const handleNewPlaylist = async (name) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!name || !user) return;
      await supabase.from("playlists").insert({ name, user_id: user.id });
      fetchPlaylists(user.id);
    } catch (err) { alert(err.message); }
    setShowAddModal(false);
  };

  return (
    // CONTAINER TỔNG: Full màn hình, không cuộn
    <div className="relative h-screen w-full overflow-hidden bg-neutral-100 dark:bg-black transition-colors duration-500">
      
      {/* 1. NAVBAR (FIXED - LUÔN NẰM TRÊN CÙNG) */}
      <div className="fixed top-0 left-0 w-full h-[80px] z-[999]">
         <Navbar />
      </div>

      {/* 2. BODY LAYOUT */}
      <div className="flex h-full w-full">
        
        {/* --- SIDEBAR TRÁI --- */}
        {/* pt-[90px] để đẩy khối kính xuống dưới Navbar */}
        <div className="hidden md:flex flex-col w-[260px] h-full pt-[90px] pb-4 ml-4 z-40 shrink-0">
            
            {/* KHỐI KÍNH CỦA SIDEBAR */}
            <div className="
                flex flex-col h-full w-full
                bg-white/60 dark:bg-black/60 
                backdrop-blur-3xl 
                border border-neutral-200 dark:border-white/5 
                rounded-2xl 
                p-4 gap-y-4
                shadow-sm dark:shadow-none
                transition-all duration-500 ease-out 
                hover:bg-white/90 dark:hover:bg-black/90
                hover:border-emerald-500/30
                hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]
            ">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 pl-2 pb-2 border-b border-neutral-200 dark:border-white/5 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors duration-300">
                    <div className="flex items-center gap-x-2">
                        <Library size={20} />
                        <p className="font-bold text-xs tracking-[0.2em] font-mono">LIBRARY</p>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="hover:text-emerald-500 p-1 transition"><Plus size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                    {loading ? (
                    <div className="flex items-center gap-2 text-neutral-500 text-xs font-mono mt-4 pl-2"><Loader2 className="animate-spin" size={14}/> [LOADING]...</div>
                    ) : playlists.length === 0 ? (
                    <div className="flex flex-col items-center mt-10 gap-2 opacity-50"><ListMusic size={30}/><p className="text-[10px] italic font-mono">[EMPTY_DATABASE]</p></div>
                    ) : (
                    <ul className="flex flex-col gap-y-1 mt-2">
                        {playlists.map((pl) => (
                        <li key={pl.id}>
                            <Link href={`/playlist/${encodeURIComponent(pl.name)}`} className="group/item flex items-center gap-x-3 px-2 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer">
                            <div className="w-8 h-8 rounded bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-black border border-neutral-300 dark:border-white/5 flex items-center justify-center group-hover/item:border-emerald-500/50 transition">
                                <ListMusic size={14} className="text-neutral-500 group-hover/item:text-emerald-600 dark:group-hover/item:text-emerald-400"/>
                            </div>
                            <span className="text-sm text-neutral-600 dark:text-neutral-400 font-mono truncate group-hover/item:text-black dark:group-hover/item:text-white w-32 transition-colors">{pl.name}</span>
                            </Link>
                        </li>
                        ))}
                    </ul>
                    )}
                </div>
            </div>
        </div>

        {/* --- NỘI DUNG CHÍNH (PHẢI) --- */}
        {/* flex-1 để chiếm hết phần còn lại, overflow-y-auto để cuộn */}
        <main className="flex-1 h-full overflow-y-auto bg-transparent scroll-smooth relative">
           
           {/* --- [THE SPACER] - CỤC GẠCH VÔ HÌNH --- */}
           {/* Đây là vị cứu tinh: Nó chiếm chỗ 80px đầu tiên, đẩy nội dung thật xuống dưới */}
           <div className="w-full h-[80px] shrink-0 pointer-events-none" />

           {/* Nội dung thật sự của Page */}
           <div className="p-6 pb-[120px]"> 
              {children}
           </div>
        </main>
      </div>

      {showAddModal && <CreatePlaylistModal onClose={() => setShowAddModal(false)} onCreate={handleNewPlaylist} />}
    </div>
  );
};

export default Sidebar;