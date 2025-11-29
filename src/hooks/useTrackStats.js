import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient"; // Dùng đường dẫn tương đối

const useTrackStats = (activeSong) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    // 1. Kiểm tra đầu vào
    if (!activeSong || !activeSong.id) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        return;
    }

    console.log("Stats: 🎧 Đang theo dõi:", activeSong.title || activeSong.name);

    // 2. Hàm gửi dữ liệu
    const recordPlay = async () => {
      try {
        console.log("Stats: ⏳ Đủ 5 giây -> Đang gửi request...");
        
        // --- CHUẨN HÓA DỮ LIỆU ---
        // Jamendo dùng: name, artist_name, audio, image
        // Database dùng: title, author, song_url, image_url
        const payload = {
          _title: activeSong.title || activeSong.name || "Unknown Title",
          _author: activeSong.author || activeSong.artist_name || "Unknown Artist",
          _song_url: activeSong.song_url || activeSong.audio || activeSong.song_path || "", 
          _image_url: activeSong.image_url || activeSong.image || activeSong.image_path || ""
        };

        // Kiểm tra an toàn: Nếu không có link nhạc thì không tính
        if (!payload._song_url) {
            console.warn("Stats: ❌ Bỏ qua vì thiếu Link nhạc", payload);
            return;
        }

        // Gọi hàm RPC trên Supabase
        const { error } = await supabase.rpc('record_song_play', payload);
        
        if (!error) {
            console.log(`Stats: ✅ Đã cộng 1 lượt nghe cho "${payload._title}"`);
        } else {
            console.error("Stats Error (Supabase):", error.message);
        }
      } catch (error) {
        console.error("Stats Critical Error:", error);
      }
    };

    // 3. Reset timer cũ (tránh tính trùng khi next bài liên tục)
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // 4. Đếm 5 giây mới tính là 1 lượt nghe
    timeoutRef.current = setTimeout(recordPlay, 5000);

    // Cleanup
    return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    
  }, [activeSong?.id]); // Chỉ chạy lại khi ID bài hát thay đổi
};

export default useTrackStats;