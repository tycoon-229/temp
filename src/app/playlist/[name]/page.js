"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Play } from "lucide-react";

const PlaylistPage = () => {
  const params = useParams();
  const playlistName = decodeURIComponent(params.name);
  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Lấy playlist theo tên
        const { data: playlistData, error: plError } = await supabase
          .from("playlists")
          .select("*")
          .eq("name", playlistName)
          .single();
        if (plError || !playlistData) throw new Error("Playlist không tồn tại");

        setPlaylist(playlistData);

        // Lấy danh sách bài hát
        const { data: playlistSongs, error: psError } = await supabase
          .from("playlist_songs")
          .select("*, songs(*)")
          .eq("playlist_id", playlistData.id)
          .order("added_at", { ascending: true });

        if (psError) throw psError;

        setSongs(playlistSongs.map((ps) => ps.songs));
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [playlistName]);

  if (loading)
    return <p className="text-white p-4 text-center">Đang tải...</p>;
  if (!playlist)
    return <p className="text-white p-4 text-center">Playlist không tồn tại</p>;

  return (
    <div className="p-6 text-white">
      {/* --- Header Playlist --- */}
      <div className="flex flex-col md:flex-row gap-6 mb-8 items-center">
        {/* Ảnh bìa giả lập */}
        <div className="w-48 h-48 bg-gradient-to-br from-green-500 to-green-800 flex items-center justify-center text-4xl font-bold rounded shadow-lg">
          {playlist.name[0].toUpperCase()}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <p className="text-sm uppercase text-green-500 font-semibold">Playlist</p>
          <h1 className="text-4xl font-bold">{playlist.name}</h1>
          <p className="text-neutral-400 mt-2">{songs.length} bài hát</p>
          <button className="mt-4 bg-green-500 hover:bg-green-600 px-6 py-2 rounded-full flex items-center gap-x-2 w-max transition">
            <Play size={20} />
            Phát tất cả
          </button>
        </div>
      </div>

      {/* --- Danh sách bài hát --- */}
      {songs.length === 0 ? (
        <p className="text-neutral-400 text-center">Playlist trống</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead className="text-neutral-400 text-sm uppercase border-b border-neutral-700">
              <tr>
                <th className="pl-4 w-10">#</th>
                <th>Tiêu đề</th>
                <th className="w-32 text-right">Thời lượng</th>
              </tr>
            </thead>
            <tbody>
              {songs.map((song, idx) => (
                <tr
                  key={song.id}
                  className="hover:bg-neutral-800 transition cursor-pointer rounded-md"
                >
                  <td className="pl-4 py-2">{idx + 1}</td>
                  <td className="flex items-center gap-x-4 py-2">
                    {/* Ảnh bài hát */}
                    <img
                      src={song.image_url || "/placeholder.png"}
                      alt={song.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{song.title}</span>
                      <span className="text-neutral-500 text-sm">{song.genre_id || ""}</span>
                    </div>
                  </td>
                  <td className="text-right py-2">{song.duration || "00:00"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PlaylistPage;
