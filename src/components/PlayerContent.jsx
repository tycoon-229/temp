"use client";

import { useEffect, useState, useRef } from "react";
import { Howl, Howler } from "howler";
import { BsPlayFill, BsPauseFill } from "react-icons/bs";
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
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(false); // false = no repeat, true = repeat one
  
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

  const Icon = isPlaying ? BsPauseFill : BsPlayFill;
  const VolumeIcon = volume === 0 ? HiSpeakerXMark : HiSpeakerWave;

  const onPlayNext = () => {
    if (player.ids.length === 0) {
      return;
    }

    if (repeatMode) {
      // Repeat current song
      if (sound) {
        sound.seek(0);
        setSeek(0);
        sound.play();
      }
      return;
    }

    const currentIndex = player.ids.findIndex((id) => id === player.activeId);

    if (isShuffle) {
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
        // Loop back to first song
        player.setId(player.ids[0]);
      } else {
        player.setId(nextSong);
      }
    }
  };

  const onPlayPrevious = () => {
    if (player.ids.length === 0) {
      return;
    }

    const currentIndex = player.ids.findIndex((id) => id === player.activeId);
    const previousSong = player.ids[currentIndex - 1];

    if (!previousSong) {
      return player.setId(player.ids[player.ids.length - 1]);
    }

    player.setId(previousSong);
  };

  useEffect(() => {
    // Stop previous sound before playing a new one
    if (sound) {
      sound.unload();
    }

    setIsLoading(true);
    setSeek(0);

    const newSound = new Howl({
      src: [songUrl],
      format: ['mp3', 'mpeg'],
      html5: true,
      volume: volume,
      crossOrigin: 'anonymous',
      preload: 'metadata',
      onplay: () => {
        setIsPlaying(true);
        setDuration(newSound.duration());
        // Smooth time update with requestAnimationFrame
        const updateSeek = () => {
          if (newSound.playing()) {
            setSeek(newSound.seek());
            rafRef.current = requestAnimationFrame(updateSeek);
          }
        };
        rafRef.current = requestAnimationFrame(updateSeek);
      },
      onpause: () => {
        setIsPlaying(false);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      },
      onend: () => {
        setIsPlaying(false);
        setSeek(0);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        onPlayNext();
      },
      onload: () => {
        setDuration(newSound.duration());
        setIsLoading(false);
        setError(null);
        console.log('[Howler] Loaded:', { 
          duration: newSound.duration(),
          url: songUrl.substring(0, 80)
        });
      },
      onloaderror: (id, err) => {
        const errorMsg = `Howler load error: ${err}`;
        console.error('[Howler]', errorMsg, { url: songUrl });
        setError(errorMsg);
        setIsLoading(false);
      }
    });

    setSound(newSound);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      newSound.unload();
    };
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
    const mm = String(mins).padStart(2, "0");
    const ss = String(secs).padStart(2, "0");
    if (hrs > 0) {
      return `${hrs}:${mm}:${ss}`;
    }
    return `${mins}:${ss}`;
  };


  return (
    <div className="grid grid-cols-2 md:grid-cols-3 h-full gap-x-2">
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-xs p-2 rounded m-2 z-50">
          ⚠️ {error}
        </div>
      )}
      
      <div className="flex w-full justify-start">
        <div className="flex items-center gap-x-4">
          <MediaItem data={song} />
          <LikeButton songId={song.id} />
        </div>
      </div>

      <div className="flex md:hidden col-auto w-full justify-end items-center">
        <button
          onClick={handlePlay}
          disabled={!sound || isLoading}
          className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-b from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed p-1 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 active:scale-95"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Icon size={24} className="text-white" />
          )}
        </button>
      </div>

      <div className="hidden md:flex justify-center items-center w-full max-w-[722px] gap-x-6">
        <button
          onClick={() => setIsShuffle(!isShuffle)}
          disabled={!sound}
          className={`text-neutral-400 cursor-pointer hover:text-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition ${isShuffle ? 'text-green-500' : ''}`}
          title="Shuffle"
        >
          <MdShuffle size={24} />
        </button>
        <button
          onClick={onPlayPrevious}
          disabled={isLoading || !sound}
          className="text-neutral-400 cursor-pointer hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Previous"
        >
          <AiFillStepBackward size={30} />
        </button>
        <button
          onClick={handlePlay}
          disabled={!sound || isLoading}
          className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-b from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed p-1 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 active:scale-95"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Icon size={28} className="text-white" />
          )}
        </button>
        <button
          onClick={onPlayNext}
          disabled={isLoading || !sound}
          className="text-neutral-400 cursor-pointer hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Next"
        >
          <AiFillStepForward size={30} />
        </button>
        <button
          onClick={() => setRepeatMode(!repeatMode)}
          disabled={!sound}
          className={`text-neutral-400 cursor-pointer hover:text-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition ${repeatMode ? 'text-green-500' : ''}`}
          title="Repeat One"
        >
          {repeatMode ? <MdRepeatOne size={24} /> : <MdRepeat size={24} />}
        </button>
        <div className="flex-1 flex items-center gap-x-2">
          <span className="text-xs text-neutral-400 min-w-8">
            {formatTime(seek)}
          </span>
          <Slider value={seek} max={duration} onChange={handleSeekChange} disabled={isLoading || !sound} />
          <span className="text-xs text-neutral-400 min-w-8">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <div className="hidden md:flex w-full justify-end pr-2">
        <div className="flex items-center gap-x-2 w-[120px]">
          <button
            onClick={toggleMute}
            disabled={!sound}
            className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:text-green-500 transition"
            title={volume === 0 ? "Unmute" : "Mute"}
          >
            <VolumeIcon size={34} />
          </button>
          <Slider 
            value={volume} 
            onChange={(value) => { 
              setVolume(value); 
              if (sound) sound.volume(value);
            }} 
            disabled={!sound}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerContent;
