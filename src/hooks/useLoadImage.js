"use client";

import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";

// Fallback placeholder image
const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23404040' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='%23888' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

export const useLoadImage = (song) => {
  const supabaseClient = useSupabaseClient();
  const [imageUrl, setImageUrl] = useState(FALLBACK_IMAGE);

  useEffect(() => {
    if (!song) {
      setImageUrl(FALLBACK_IMAGE);
      return;
    }

    // Check if image_path is a full URL
    if (song.image_path && song.image_path.startsWith('http')) {
      setImageUrl(song.image_path);
      return;
    }

    // Get public URL from Supabase storage
    if (song.image_path) {
      try {
        const { data } = supabaseClient.storage
          .from("images")
          .getPublicUrl(song.image_path);

        setImageUrl(data?.publicUrl || FALLBACK_IMAGE);
      } catch (err) {
        console.warn('Failed to load image:', song.image_path, err);
        setImageUrl(FALLBACK_IMAGE);
      }
    } else {
      setImageUrl(FALLBACK_IMAGE);
    }
  }, [song, supabaseClient]);

  return imageUrl;
};

export default useLoadImage;
