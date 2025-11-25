"use client";

import { useEffect, useState } from "react";

/**
 * Hook to get playable URL for a song
 * Handles Jamendo API audio URLs with proper parameters
 */
export default function useLoadSongUrl(song) {
  const [songUrl, setSongUrl] = useState(null);

  useEffect(() => {
    if (!song) {
      setSongUrl(null);
      return;
    }

    // Jamendo returns audio URL in song_path (mapped from track.audio)
    let audioUrl = song.song_path;

    if (!audioUrl) {
      console.warn('[useLoadSongUrl] No audio URL found in song');
      setSongUrl(null);
      return;
    }

    // Jamendo URLs need format: they return JSON by default
    // Add redirect=1 to get the actual MP3 redirect
    if (typeof audioUrl === 'string') {
      if (audioUrl.includes('jamendo.com')) {
        // Add redirect parameter to get actual MP3 URL
        audioUrl = audioUrl.includes('?') 
          ? audioUrl + '&redirect=1' 
          : audioUrl + '?redirect=1';
      }
      
      console.log('[useLoadSongUrl] Using audio URL:', audioUrl.substring(0, 100) + '...');
      setSongUrl(audioUrl);
    } else {
      console.warn('[useLoadSongUrl] Invalid audio URL format:', audioUrl);
      setSongUrl(null);
    }
  }, [song]);

  return songUrl;
}
