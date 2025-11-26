"use client";

import { usePathname } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { Home, Search, Library, Plus } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import CreatePlaylistModal from "./CreatePlaylistModal"; // modal popup

const Sidebar = ({ children }) => {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const routes = useMemo(
    () => [
      { icon: Home, label: "Trang chủ", active: pathname !== "/search", href: "/" },
      { icon: Search, label: "Tìm kiếm", active: pathname === "/search", href: "/search" },
    ],
    [pathname]
  );

  // Load user và playlist
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUser(user);

        const { data: playlistsData } = await supabase
          .from("playlists")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        setPlaylists(playlistsData || []);
      } catch (err) {
        console.error("Sidebar load error:", err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleNewPlaylist = async (name) => {
    if (!name || !user) return;
    try {
      await supabase.from("playlists").insert({ name, user_id: user.id });
      const { data: playlistsData } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setPlaylists(playlistsData || []);
    } catch (err) {
      alert("Lỗi tạo playlist: " + err.message);
    }
    setShowAddModal(false);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col gap-y-2 bg-black h-full w-[300px] p-2">
        {/* Menu trên */}
        <div className="bg-neutral-900 rounded-lg h-fit w-full p-4 flex flex-col gap-y-4">
          {routes.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-x-4 text-md font-medium cursor-pointer hover:text-white transition ${item.active ? "text-white" : "text-neutral-400"}`}
            >
              <item.icon size={26} />
              <p className="truncate">{item.label}</p>
            </Link>
          ))}
        </div>

        {/* Thư viện */}
        <div className="bg-neutral-900 rounded-lg h-full w-full overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-x-2 text-white">
              <Library size={26} />
              <p className="font-medium text-md truncate">Thư viện của tôi</p>
            </div>
            <button
              className="p-1 rounded-full bg-green-500 hover:opacity-80"
              onClick={() => setShowAddModal(true)}
              title="Tạo playlist mới"
            >
              <Plus size={18} />
            </button>
          </div>

          {loading ? (
            <p className="text-neutral-500 text-sm">Đang tải playlist...</p>
          ) : playlists.length === 0 ? (
            <p className="text-neutral-500 text-sm">Chưa có playlist nào</p>
          ) : (
            <ul className="flex flex-col gap-y-2">
              {playlists.map((pl) => (
                <li key={pl.id}>
                  <Link
                    href={`/playlist/${encodeURIComponent(pl.name)}`} // link động
                    className="text-neutral-400 hover:text-white truncate block"
                  >
                    {pl.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="h-full flex-1 overflow-y-auto py-2 pr-2 pb-[100px]">
        <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
          {children}
        </div>
      </main>

      {showAddModal && (
        <CreatePlaylistModal
          onClose={() => setShowAddModal(false)}
          onCreate={handleNewPlaylist}
        />
      )}
    </div>
  );
};

export default Sidebar;
