"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Heart, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const FollowButton = ({ artistName, artistImage, onFollowChange }) => {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Kiểm tra xem user hiện tại có đang follow artist này không
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setLoading(false);
            return;
        }

        const { data } = await supabase
          .from('following_artists')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('artist_name', artistName) // So khớp tên nghệ sĩ
          .single();

        if (data) setIsFollowing(true);
      } catch (error) {
        // Không tìm thấy => chưa follow
      } finally {
        setLoading(false);
      }
    };

    checkFollowStatus();
  }, [artistName]);

  const handleFollow = async (e) => {
    e.preventDefault(); // Chặn chuyển trang nếu nút đặt trong thẻ Link
    e.stopPropagation();

    // Check login
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert("Vui lòng đăng nhập để theo dõi nghệ sĩ!");
        return;
    }

    // Optimistic UI (Đổi trạng thái ngay lập tức cho mượt)
    const previousState = isFollowing;
    setIsFollowing(!isFollowing);

    try {
        if (previousState) {
            // Đang follow -> Bấm để Unfollow
            const { error } = await supabase
                .from('following_artists')
                .delete()
                .eq('user_id', session.user.id)
                .eq('artist_name', artistName);
            
            if (error) throw error;
            if (onFollowChange) onFollowChange(false); // Callback cập nhật UI cha
        } else {
            // Chưa follow -> Bấm để Follow
            const { error } = await supabase
                .from('following_artists')
                .insert({
                    user_id: session.user.id,
                    artist_name: artistName,
                    artist_image: artistImage
                });
            
            if (error) throw error;
            if (onFollowChange) onFollowChange(true);
        }
        router.refresh();
    } catch (error) {
        console.error("Lỗi follow:", error);
        setIsFollowing(previousState); // Hoàn tác nếu lỗi
        alert("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  if (loading) return <div className="w-20 h-8 bg-neutral-800/50 rounded-full animate-pulse" />;

  return (
    <button
      onClick={handleFollow}
      className={`
        flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-xs font-bold transition-all duration-300 z-20
        ${isFollowing 
            ? 'bg-transparent border border-emerald-500 text-emerald-500 hover:bg-red-500/10 hover:border-red-500 hover:text-red-500 group' 
            : 'bg-emerald-500 text-black border border-emerald-500 hover:scale-105 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
        }
      `}
    >
      {isFollowing ? (
        <>
            <Check size={14} className="group-hover:hidden" /> 
            <span className="group-hover:hidden">FOLLOWING</span>
            <span className="hidden group-hover:inline">UNFOLLOW</span>
        </>
      ) : (
        <>
            <Heart size={14} fill="currentColor" /> 
            <span>FOLLOW</span>
        </>
      )}
    </button>
  );
};

export default FollowButton;