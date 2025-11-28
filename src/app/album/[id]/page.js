"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // Lấy ID từ URL
import getAlbumTracks from "@/app/actions/getAlbumTracks";
import SongSection from "@/components/SongSection";
import { Disc, Loader2 } from "lucide-react";
import Image from "next/image";

const AlbumPage = () => {
  const params = useParams();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const loadData = async () => {
          setLoading(true);
          const tracks = await getAlbumTracks(params.id);
          setSongs(tracks);
          setLoading(false);
      };
      loadData();
  }, [params.id]);

  if (loading) return <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500"/></div>;

  // Lấy thông tin album từ bài đầu tiên
  const albumInfo = songs[0] || {};

  return (
    <div className="w-full flex flex-col gap-8 p-6 pb-[120px]">
      
       {/* HEADER ALBUM */}
       <div className="flex flex-col md:flex-row gap-8 items-end mb-8 pb-8 border-b border-neutral-200 dark:border-white/10">
        <div className="relative w-52 h-52 shrink-0 rounded-lg overflow-hidden shadow-2xl">
            {albumInfo.image_path && <Image src={albumInfo.image_path} alt="Cover" fill className="object-cover"/>}
        </div>
        <div className="flex-1 mb-2">
            <p className="text-xs font-mono text-emerald-500 tracking-widest uppercase mb-1">:: ALBUM ::</p>
            <h1 className="text-4xl md:text-6xl font-bold font-mono text-neutral-900 dark:text-white tracking-tighter">
                {/* Tên album không có trong track info của Jamendo, có thể hiển thị tạm "Album Tracks" hoặc gọi thêm API album info nếu cần */}
                ALBUM TRACKS
            </h1>
            <p className="text-lg font-mono text-neutral-600 dark:text-neutral-400 mt-2">{albumInfo.author}</p>
        </div>
      </div>

      {/* TRACKLIST */}
      <SongSection title="" songs={songs} />
    </div>
  );
};

export default AlbumPage;