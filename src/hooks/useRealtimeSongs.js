"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import usePlayer from "@/hooks/usePlayer";

// Hook: keep songs list live by subscribing to Supabase realtime changes on `songs` table
export default function useRealtimeSongs(initialSongs = []) {
  const [songs, setSongs] = useState(initialSongs || []);
  const player = usePlayer();
  const mountedRef = useRef(false);

  useEffect(() => {
    // initialize once
    setSongs(initialSongs || []);
    if (typeof window !== 'undefined') {
      const map = {};
      (initialSongs || []).forEach((s) => (map[s.id] = s));
      window.__SONG_MAP__ = map;
      player.setIds((initialSongs || []).map((s) => s.id));
    }
    mountedRef.current = true;
  // we intentionally run this only when initialSongs changes
  }, [initialSongs]);

  useEffect(() => {
    if (!mountedRef.current) return;

    const channel = supabase.channel('public:songs');

    const handleInsert = (payload) => {
      const newSong = payload.new;
      setSongs((prev) => {
        // avoid duplicates
        if (prev.find((p) => p.id === newSong.id)) return prev;
        const next = [newSong, ...prev];
        // update window map and player ids
        if (typeof window !== 'undefined') {
          window.__SONG_MAP__ = (window.__SONG_MAP__ || {});
          window.__SONG_MAP__[newSong.id] = newSong;
        }
        player.setIds(next.map((s) => s.id));
        return next;
      });
    };

    const handleUpdate = (payload) => {
      const updated = payload.new;
      setSongs((prev) => {
        const next = prev.map((s) => (s.id === updated.id ? updated : s));
        if (typeof window !== 'undefined') {
          window.__SONG_MAP__ = (window.__SONG_MAP__ || {});
          window.__SONG_MAP__[updated.id] = updated;
        }
        return next;
      });
    };

    const handleDelete = (payload) => {
      const old = payload.old;
      setSongs((prev) => {
        const next = prev.filter((s) => s.id !== old.id);
        if (typeof window !== 'undefined' && window.__SONG_MAP__) {
          delete window.__SONG_MAP__[old.id];
        }
        player.setIds(next.map((s) => s.id));
        return next;
      });
    };

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'songs' }, handleInsert)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'songs' }, handleUpdate)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'songs' }, handleDelete)
      .subscribe((status) => {
        console.log('[useRealtimeSongs] subscription status:', status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, [player]);

  return songs;
}
