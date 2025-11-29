import getSongs from "@/app/actions/getSongs";
import SongSection from "@/components/SongSection";
import TrendingHero from "@/components/TrendingHero"; 
import { Disc } from "lucide-react";
import { GlitchText } from "@/components/CyberComponents"; // <--- IMPORT MỚI

export const revalidate = 0; 

export default async function Home() {
  
  const [
    mostHeard, 
    discoveries, 
    popSongs, 
    electronicSongs, 
    rockSongs, 
    indieSongs
  ] = await Promise.all([
    getSongs({ boost: 'popularity_month', limit: 10 }), 
    getSongs({ boost: 'buzzrate', limit: 11 }),        
    getSongs({ tag: 'pop', limit: 11 }),
    getSongs({ tag: 'electronic', limit: 11 }),
    getSongs({ tag: 'rock', limit: 11 }),
    getSongs({ tag: 'indie', limit: 11 }),
  ]);

  // Fix lỗi map: Lấy .songs từ object trả về
  const mostHeardSongs = mostHeard.songs || [];
  const discoverySongs = discoveries.songs || [];
  const popTracks = popSongs.songs || [];
  const electronicTracks = electronicSongs.songs || [];
  const rockTracks = rockSongs.songs || [];
  const indieTracks = indieSongs.songs || [];

  return (
    <div className="h-full w-full p-6 pb-[120px] overflow-y-auto scroll-smooth">
      
      {/* 1. HERO */}
      <TrendingHero songs={mostHeardSongs} />

      {/* 2. CÁC SECTION KHÁC */}
      <div className="mt-12">
        <div className="mb-8 flex flex-col gap-1">
             {/* --- ÁP DỤNG GLITCH TEXT --- */}
            <div className="flex items-center gap-3">
                <Disc className="text-emerald-500 animate-spin-slow" size={32}/>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter font-mono text-neutral-900 dark:text-white">
                    <GlitchText text="MUSIC_DASHBOARD" />
                </h1>
            </div>
            
            <p className="text-neutral-500 dark:text-neutral-400 text-xs tracking-[0.3em] font-mono pl-11">
               :: EXPLORE_THE_SOUND ::
            </p>
        </div>

        <SongSection 
            title="Discoveries" 
            songs={discoverySongs} 
            moreLink="/search" 
        />
        
        <SongSection 
            title="Pop Hits" 
            songs={popTracks} 
            moreLink="/search?tag=pop" 
        />
        
        <SongSection 
            title="Electronic Vibes" 
            songs={electronicTracks} 
            moreLink="/search?tag=electronic" 
        />
        
        <SongSection 
            title="Rock Anthems" 
            songs={rockTracks} 
            moreLink="/search?tag=rock" 
        />

        <SongSection 
            title="Indie Corner" 
            songs={indieTracks} 
            moreLink="/search?tag=indie" 
        />
      </div>

      <div className="mt-10 py-10 border-t border-neutral-200 dark:border-white/5 text-center">
         <p className="text-xs font-mono text-neutral-400 dark:text-neutral-600">
            Powered by Jamendo API • Music OS v2.0
         </p>
      </div>

    </div>
  );
}