"use client";

import { useEffect, useState, useRef } from "react";
import { Howl, Howler } from "howler";
import { BsPlayFill, BsPauseFill, BsRewind, BsFastForward } from "react-icons/bs";
import { AiFillStepBackward, AiFillStepForward } from "react-icons/ai";
import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import { MdShuffle, MdRepeat, MdRepeatOne } from "react-icons/md";

import usePlayer from "@/hooks/usePlayer";
import LikeButton from "./LikeButton";
import MediaItem from "./MediaItem";
import Slider from "./Slider";

const PlayerContent = ({ song, songUrl }) => {
  const player = usePlayer();
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [seek, setSeek] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Web Audio API references
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  // Debug log
  useEffect(() => {
    console.log('[PlayerContent] Props received:', {
      songTitle: song?.title,
      songUrl: songUrl?.substring(0, 100),
      songId: song?.id,
    });
  }, [song, songUrl]);

  useEffect(() => {
    if (sound) {
      sound.loop(player.repeatMode === 2);
    }
  }, [player.repeatMode, sound]);

  const Icon = isPlaying ? BsPauseFill : BsPlayFill;
  const VolumeIcon = volume === 0 ? HiSpeakerXMark : HiSpeakerWave;

  const onPlayNext = () => {
    if (player.ids.length === 0) {
      return;
    }

    const currentIndex = player.ids.findIndex((id) => id === player.activeId);

    if (player.isShuffle) {
      // Select random song
      const availableIds = player.ids.filter(id => id !== player.activeId);
      if (availableIds.length === 0) {
        // Only one song or empty list
        const nextSong = player.ids[Math.floor(Math.random() * player.ids.length)];
        player.setId(nextSong);
      } else {
        const randomIndex = Math.floor(Math.random() * availableIds.length);
        player.setId(availableIds[randomIndex]);
      }
    } else {
      // Normal next
      const nextSong = player.ids[currentIndex + 1];
      if (!nextSong) {
        // Loop back to first song if repeat all
        if (player.repeatMode === 1) {
          player.setId(player.ids[0]);
        }
        // If repeatMode === 0, do nothing (stop at end)
      } else {
        player.setId(nextSong);
      }
    }
  };

  const onPlayPrevious = () => {
    if (player.ids.length === 0) {
      return;
    }

    // Try to go back in history
    const previousId = player.popHistory();
    if (previousId) {
      player.setId(previousId, true); // from history, don't push back
      return;
    }

    // If no history, reset the current song to the beginning
    if (sound) {
      sound.seek(0);
      setSeek(0);
    }
  };

    useEffect(() => {
    if (sound) sound.unload();
    setIsLoading(true);
    setSeek(0);
    const newSound = new Howl({
      src: [songUrl], format: ['mp3', 'mpeg'], volume: volume, html5: true, preload: 'metadata',
      onplay: () => {
        setIsPlaying(true);
        setDuration(newSound.duration());
        if (!rafRef.current) {
          const updateSeek = () => { setSeek(newSound.seek()); rafRef.current = requestAnimationFrame(updateSeek); };
          updateSeek();
        }
      },
      onpause: () => { setIsPlaying(false); cancelAnimationFrame(rafRef.current); },
      onend: () => {
        setIsPlaying(false);
        setSeek(0);
        if (player.repeatMode !== 2) {
          onPlayNext();
        }
      },
      onload: () => { setDuration(newSound.duration()); setIsLoading(false); setError(null); },
      onloaderror: (id, err) => { setError(`Error: ${err}`); setIsLoading(false); }
    });
    setSound(newSound);
    return () => { cancelAnimationFrame(rafRef.current); newSound.unload(); };
  }, [songUrl]);

  const handlePlay = () => {
    if (!sound) {
      console.warn('Sound not loaded yet');
      return;
    }
    
    try {
      if (!isPlaying) {
        sound.play();
      } else {
        sound.pause();
      }
    } catch (err) {
      console.error('Play/Pause error:', err);
    }
  };
  
  const toggleMute = () => {
    if (!sound) return;

    try {
      if (volume === 0) {
        setVolume(1);
        sound.volume(1);
      } else {
        setVolume(0);
        sound.volume(0);
      }
    } catch (err) {
      console.error('Mute error:', err);
    }
  }

  const handleSkipBackward = () => {
    if (!sound) return;
    try {
      const newSeek = Math.max(0, seek - 5);
      sound.seek(newSeek);
      setSeek(newSeek);
    } catch (err) {
      console.error('Skip backward error:', err);
    }
  }

  const handleSkipForward = () => {
    if (!sound) return;
    try {
      const newSeek = Math.min(duration, seek + 5);
      sound.seek(newSeek);
      setSeek(newSeek);
    } catch (err) {
      console.error('Skip forward error:', err);
    }
  }

  const handleSeekChange = (newValue) => {
    if (!sound) {
      console.warn('Sound not loaded yet');
      return;
    }

    try {
      sound.seek(newValue);
      setSeek(newValue);
    } catch (err) {
      console.error('Seek error:', err);
    }
  };
  
  // Auto-play the song after it loads
  useEffect(() => {
    if (sound && !isLoading) {
      try {
        sound.play();
      } catch (err) {
        console.error('Auto-play error:', err);
      }
    }
  }, [sound, isLoading]);

  // Format seconds into H:MM:SS or MM:SS
  const formatTime = (seconds) => {
    if (seconds === undefined || seconds === null || isNaN(seconds)) return "0:00";
    const s = Math.floor(seconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const ss = String(secs).padStart(2, "0");
    if (hrs > 0) {
      const mm = String(mins).padStart(2, "0");
      return `${hrs}:${mm}:${ss}`;
    }
    return `${mins}:${ss}`;
  };


  return (
    <div className="grid grid-cols-2 md:grid-cols-3 h-full gap-x-6 items-center">
      
      {/* 1. INFO SECTION */}
      <div className="flex w-full justify-start items-center gap-x-4">
         <MediaItem data={song} />
         <LikeButton songId={song.id} />
      </div>

      {/* 2. MOBILE PLAY BUTTON */}
      <div className="flex md:hidden col-auto w-full justify-end items-center">
        <button
          onClick={handlePlay}
          disabled={!sound || isLoading}
          className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50"
        >
          {isLoading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <Icon size={24} />}
        </button>
      </div>

      {/* 3. DESKTOP CONTROLS */}
      <div className="hidden md:flex flex-col justify-center items-center w-full max-w-[722px] gap-y-2">
        
        <div className="flex items-center gap-x-6">
            <button
                onClick={() => player.setIsShuffle(!player.isShuffle)}
                disabled={!sound}
                className={`transition ${player.isShuffle ? 'text-emerald-600 dark:text-emerald-500 drop-shadow-md' : 'text-neutral-400 hover:text-neutral-800 dark:hover:text-white'}`}
            >
                <MdShuffle size={20} />
            </button>

            <button
                onClick={onPlayPrevious}
                disabled={isLoading || !sound}
                className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition hover:scale-110"
            >
                <AiFillStepBackward size={26} />
            </button>

            <button
                onClick={handleSkipBackward}
                disabled={!sound}
                className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition hover:scale-110"
                title="Skip -5s"
            >
                <BsRewind size={20} />
            </button>

            <button
                onClick={handlePlay}
                disabled={!sound || isLoading}
                // Nút Play màu Emerald đậm hơn ở Light mode cho nổi
                className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-500 text-white dark:text-black shadow-md hover:scale-110 transition active:scale-95"
            >
                 {isLoading ? <div className="w-5 h-5 border-2 border-white/50 border-t-transparent rounded-full animate-spin"/> : <Icon size={24} className="ml-0.5"/>}
            </button>

            <button
                onClick={handleSkipForward}
                disabled={!sound}
                className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition hover:scale-110"
                title="Skip +5s"
            >
                <BsFastForward size={20} />
            </button>

            <button
                onClick={onPlayNext}
                disabled={isLoading || !sound}
                className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition hover:scale-110"
            >
                <AiFillStepForward size={26} />
            </button>

            <button
                onClick={() => player.setRepeatMode((player.repeatMode + 1) % 3)}
                disabled={!sound}
                className={`cursor-pointer hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 ${
                  player.repeatMode === 0 ? 'text-neutral-400 hover:text-neutral-300' :
                  player.repeatMode === 1 ? 'text-green-500 hover:text-green-400' :
                  'text-green-500 hover:text-green-400'
                }`}
                title={
                  player.repeatMode === 0 ? "No Repeat" :
                  player.repeatMode === 1 ? "Repeat All" :
                  "Repeat One"
                }
            >
                {player.repeatMode === 2 ? <MdRepeatOne size={20} /> : <MdRepeat size={20} />}
            </button>
        </div>

        {/* Slider Row */}
        <div className="w-full flex items-center gap-x-3">
             <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-500 min-w-[40px] text-right">
                {formatTime(seek)}
             </span>
             <div className="flex-1 h-full flex items-center">
                 <Slider value={seek} max={duration || 100} onChange={handleSeekChange} disabled={isLoading || !sound} />
             </div>
             <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-500 min-w-[40px]">
                {formatTime(duration)}
             </span>
        </div>
        
      </div>

      {/* 4. MUTE TOGGLE BUTTON */}
      <div className="hidden md:flex w-full justify-end pr-2">
        <button
          onClick={toggleMute}
          disabled={!sound}
          className="flex items-center justify-center h-10 w-10 text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition hover:scale-110"
        >
          <VolumeIcon size={24} />
        </button>
      </div>

    </div>
  );
};

export default PlayerContent;
