"use client";

import { useEffect, useState, useRef } from "react";
import { Howl } from "howler";
import { 
  Play, Pause, Rewind, FastForward, SkipBack, SkipForward, 
  Volume2, VolumeX, Shuffle, Repeat, Repeat1, AlignJustify 
} from "lucide-react";

// --- IMPORT QUAN TRỌNG ---
import usePlayer from "../hooks/usePlayer";
import useTrackStats from "../hooks/useTrackStats"; // Hook thống kê
// -------------------------

// Mock components (Xóa phần này và uncomment import thật nếu chạy trên local)
const useRouter = () => ({ push: () => {} });
const LikeButton = () => <button className="text-neutral-400 hover:text-emerald-500">♡</button>;
const MediaItem = ({ data }) => (
  <div className="flex items-center gap-x-3 cursor-pointer hover:bg-neutral-800/50 w-full p-2 rounded-md">
    <div className="relative rounded-md min-h-[48px] min-w-[48px] overflow-hidden bg-neutral-800">
      { (data?.image_url || data?.image) && <img src={data.image_url || data.image} alt="Media Item" className="object-cover w-full h-full" />}
    </div>
    <div className="flex flex-col gap-y-1 overflow-hidden">
      <p className="text-white truncate">{data?.title || data?.name || 'Unknown'}</p>
      <p className="text-neutral-400 text-sm truncate">{data?.author || data?.artist_name || 'Unknown Artist'}</p>
    </div>
  </div>
);
const Slider = ({ value = 1, onChange }) => (
  <input type="range" min={0} max={1} step={0.1} value={value} onChange={(e) => onChange?.(e.target.value)} className="w-full h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"/>
);
// -------------------------------------------------------------------

const PlayerContent = ({ song, songUrl }) => {
  const player = usePlayer();
  const router = useRouter(); 
  
  // --- KÍCH HOẠT THỐNG KÊ ---
  // Hook này sẽ tự động đếm 5s và lưu vào DB
  useTrackStats(song);
  // --------------------------

  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [seek, setSeek] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [volume, setVolume] = useState(1); 
  const [prevVolume, setPrevVolume] = useState(1); 
  
  const rafRef = useRef(null);

  useEffect(() => {
      if (player.volume !== undefined) {
          setVolume(player.volume);
      }
  }, [player.volume]);

  const clampVolume = (val) => Math.max(0, Math.min(1, val));

  useEffect(() => {
    // Log để kiểm tra bài hát đang nhận
    console.log('[Player] Now Playing:', song?.title || song?.name);
  }, [song]);

  useEffect(() => {
    if (sound) { sound.loop(player.repeatMode === 2); }
  }, [player.repeatMode, sound]);

  const Icon = isPlaying ? Pause : Play;
  const VolumeIcon = volume === 0 ? VolumeX : Volume2;

  const onPlayNext = () => {
    if (player.ids.length === 0) return;
    const currentIndex = player.ids.findIndex((id) => id === player.activeId);
    
    if (player.isShuffle) {
      const availableIds = player.ids.filter(id => id !== player.activeId);
      if (availableIds.length === 0) {
        const nextSong = player.ids[Math.floor(Math.random() * player.ids.length)];
        player.setId(nextSong);
      } else {
        const randomIndex = Math.floor(Math.random() * availableIds.length);
        player.setId(availableIds[randomIndex]);
      }
    } else {
      const nextSong = player.ids[currentIndex + 1];
      if (!nextSong) {
        if (player.repeatMode === 1) player.setId(player.ids[0]);
      } else {
        player.setId(nextSong);
      }
    }
  };

  const onPlayPrevious = () => {
    if (player.ids.length === 0) return;
    const previousId = player.popHistory();
    if (previousId) {
      player.setId(previousId, true); 
      return;
    }
    if (sound) {
      sound.seek(0);
      setSeek(0);
    }
  };

  useEffect(() => {
    if (sound) sound.unload();
    setIsLoading(true); setSeek(0);
    
    const initialVol = clampVolume(player.volume);

    const newSound = new Howl({
      src: [songUrl], 
      format: ['mp3', 'mpeg'], 
      volume: initialVol, 
      html5: true, 
      preload: 'metadata',
      onplay: () => {
        setIsPlaying(true);
        setDuration(newSound.duration());
        const updateSeek = () => { 
             setSeek(newSound.seek()); 
             rafRef.current = requestAnimationFrame(updateSeek); 
        };
        updateSeek();
      },
      onpause: () => { setIsPlaying(false); if(rafRef.current) cancelAnimationFrame(rafRef.current); },
      onend: () => {
        setIsPlaying(false); setSeek(0);
        if (player.repeatMode !== 2) onPlayNext();
      },
      onload: () => { 
          setDuration(newSound.duration()); 
          setIsLoading(false); 
          setError(null);
          newSound.volume(initialVol);
      },
      onloaderror: (id, err) => { 
          console.error("Howler Error:", err);
          setIsLoading(false); 
      }
    });
    
    setSound(newSound);
    setVolume(initialVol); 
    
    return () => { 
       if(rafRef.current) cancelAnimationFrame(rafRef.current); 
       newSound.unload(); 
    };
  }, [songUrl]); 

  const handlePlay = () => {
    if (!sound) return;
    if (!isPlaying) sound.play();
    else sound.pause();
  };
  
  const handleVolumeChange = (value) => {
      let val = parseFloat(value);
      if (val > 1) val = val / 100; 
      const safeVol = clampVolume(val);
      setVolume(safeVol);
      if (sound) sound.volume(safeVol);
      player.setVolume(safeVol);
      if (safeVol > 0) setPrevVolume(safeVol);
  };

  const toggleMute = () => {
    if (volume === 0) {
        const restoreVol = prevVolume > 0 ? prevVolume : 1;
        handleVolumeChange(restoreVol);
    } else {
        setPrevVolume(volume); 
        handleVolumeChange(0);
    }
  }

  const handleSkipBackward = () => {
    if (!sound) return;
    const newSeek = Math.max(0, seek - 5);
    sound.seek(newSeek);
    setSeek(newSeek);
  }

  const handleSkipForward = () => {
    if (!sound) return;
    const newSeek = Math.min(duration, seek + 5);
    sound.seek(newSeek);
    setSeek(newSeek);
  }

  const handleSeekChange = (newValue) => {
    if (!sound) return;
    sound.seek(newValue);
    setSeek(newValue);
  };
  
  useEffect(() => {
    if (sound && !isLoading) {
      sound.play();
    }
  }, [sound, isLoading]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const s = Math.floor(seconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  const openNowPlaying = () => {
    router.push('/now-playing');
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 h-full gap-x-6 items-center">
      {error && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur text-white text-xs font-mono py-1 px-3 rounded border border-red-400 z-50 animate-bounce">
          [ERR]: {error}
        </div>
      )}

      {/* INFO */}
      <div className="flex w-full justify-start items-center gap-x-4">
         <MediaItem data={song} />
         <LikeButton songId={song?.id} />
      </div>

      {/* MOBILE PLAY */}
      <div className="flex md:hidden col-auto w-full justify-end items-center">
        <button onClick={handlePlay} disabled={!sound || isLoading} className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-500 text-black shadow-md disabled:opacity-50">
          {isLoading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <Icon size={24} />}
        </button>
      </div>

      {/* CONTROLS */}
      <div className="hidden md:flex flex-col justify-center items-center w-full max-w-[722px] gap-y-2">
        <div className="flex items-center gap-x-6">
            <button onClick={() => player.setIsShuffle(!player.isShuffle)} disabled={!sound} className={`transition ${player.isShuffle ? 'text-emerald-600 dark:text-emerald-500 drop-shadow-md' : 'text-neutral-400 hover:text-neutral-800 dark:hover:text-white'}`}>
                <Shuffle size={20} />
            </button>
            <button onClick={onPlayPrevious} disabled={isLoading || !sound} className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition hover:scale-110">
                <SkipBack size={26} />
            </button>
            <button onClick={handleSkipBackward} disabled={!sound} className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition hover:scale-110" title="Skip -5s">
                <Rewind size={20} />
            </button>
            <button onClick={handlePlay} disabled={!sound || isLoading} className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-500 text-white dark:text-black shadow-md hover:scale-110 transition active:scale-95">
                 {isLoading ? <div className="w-5 h-5 border-2 border-white/50 border-t-transparent rounded-full animate-spin"/> : <Icon size={24} className="ml-0.5" fill="currentColor"/>}
            </button>
            <button onClick={handleSkipForward} disabled={!sound} className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition hover:scale-110" title="Skip +5s">
                <FastForward size={20} />
            </button>
            <button onClick={onPlayNext} disabled={isLoading || !sound} className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition hover:scale-110">
                <SkipForward size={26} />
            </button>
            <button onClick={() => player.setRepeatMode((player.repeatMode + 1) % 3)} disabled={!sound} className={`transition ${player.repeatMode !== 0 ? 'text-emerald-600 dark:text-emerald-500 drop-shadow-md' : 'text-neutral-400 hover:text-neutral-800 dark:hover:text-white'}`} title={player.repeatMode === 0 ? "No Repeat" : player.repeatMode === 1 ? "Repeat All" : "Repeat One"}>
                {player.repeatMode === 2 ? <Repeat1 size={20} /> : <Repeat size={20} />}
            </button>
        </div>
        <div className="w-full flex items-center gap-x-3">
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-500 min-w-[40px] text-right">{formatTime(seek)}</span>
              <div className="flex-1 h-full flex items-center">
                  <Slider value={seek} max={duration || 100} onChange={handleSeekChange} disabled={isLoading || !sound} />
              </div>
              <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-500 min-w-[40px]">{formatTime(duration)}</span>
        </div>
      </div>

      {/* VOLUME & LYRICS */}
      <div className="hidden md:flex w-full justify-end pr-2">
        <div className="flex items-center gap-x-3 w-[180px]"> 
          <button onClick={toggleMute} disabled={!sound} className="text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition">
            <VolumeIcon size={22} />
          </button>
          
          <Slider 
            value={volume} 
            onChange={handleVolumeChange} 
            disabled={!sound} 
          />
          
          <button onClick={openNowPlaying} className="text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-white/10" title="Lyrics & Details">
            <AlignJustify size={20} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default PlayerContent;