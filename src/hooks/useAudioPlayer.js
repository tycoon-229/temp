"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Howl } from "howler";

/**
 * Custom hook for managing audio playback with Howler.js
 * Provides utilities for Web Audio API integration
 */
export default function useAudioPlayer() {
  const howlerRef = useRef(null);
  const rafRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Web Audio API for visualizer (optional enhancement)
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  // Initialize Web Audio API context
  const initAudioContext = useCallback(() => {
    if (audioContextRef.current) return;
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      
      // Create analyser node for visualization
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      
      return audioCtx;
    } catch (err) {
      console.warn("Web Audio API not supported or blocked:", err.message);
      return null;
    }
  }, []);

  // Load audio track with Howler
  const loadTrack = useCallback(async (url, metadata = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Unload previous track if exists
      if (howlerRef.current) {
        howlerRef.current.unload();
      }

      // Create new Howl instance
      const howl = new Howl({
        src: [url],
        format: ["mp3", "wav", "m4a", "flac"],
        volume: volume / 100,
        preload: true,
        html5: true,
        onload: () => {
          setDuration(howl.duration());
          setIsLoading(false);
        },
        onloaderror: (id, err) => {
          setError(`Failed to load audio: ${err}`);
          setIsLoading(false);
        },
        onplay: () => {
          setIsPlaying(true);
          // Start animation frame loop for smooth time update
          const updateTime = () => {
            if (howlerRef.current) {
              setCurrentTime(howlerRef.current.seek());
            }
            rafRef.current = requestAnimationFrame(updateTime);
          };
          rafRef.current = requestAnimationFrame(updateTime);
        },
        onpause: () => {
          setIsPlaying(false);
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
          }
        },
        onstop: () => {
          setIsPlaying(false);
          setCurrentTime(0);
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
          }
        },
        onend: () => {
          setIsPlaying(false);
          setCurrentTime(0);
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
          }
        },
      });

      howlerRef.current = howl;
      return howl;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [volume]);

  // Play audio
  const play = useCallback(() => {
    if (howlerRef.current) {
      howlerRef.current.play();
    }
  }, []);

  // Pause audio
  const pause = useCallback(() => {
    if (howlerRef.current) {
      howlerRef.current.pause();
    }
  }, []);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (!howlerRef.current) return;
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Seek to specific time
  const seek = useCallback((time) => {
    if (howlerRef.current) {
      howlerRef.current.seek(Math.max(0, Math.min(time, duration)));
      setCurrentTime(Math.max(0, Math.min(time, duration)));
    }
  }, [duration]);

  // Update volume
  const setVolumeValue = useCallback((vol) => {
    const newVol = Math.max(0, Math.min(vol, 100));
    setVolume(newVol);
    if (howlerRef.current) {
      howlerRef.current.volume(newVol / 100);
    }
  }, []);

  // Stop audio and reset
  const stop = useCallback(() => {
    if (howlerRef.current) {
      howlerRef.current.stop();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (howlerRef.current) {
        howlerRef.current.unload();
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    // State
    isPlaying,
    currentTime,
    duration,
    volume,
    isLoading,
    error,
    
    // Methods
    loadTrack,
    play,
    pause,
    togglePlayPause,
    seek,
    setVolume: setVolumeValue,
    stop,
    
    // References for advanced usage
    howlerRef,
    initAudioContext,
    analyserRef,
  };
}
