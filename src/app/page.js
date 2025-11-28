import getSongs from "@/app/actions/getSongs";
import SongSection from "@/components/SongSection";
import TrendingHero from "@/components/TrendingHero"; 
import { Disc } from "lucide-react";

export const revalidate = 0; 

export default async function Home() {
  
  // Tăng limit lên 11 để chừa 1 chỗ cho thẻ "Xem thêm" (Tổng = 12)
  const [
    mostHeard, 
    discoveries, 
    popSongs, 
    electronicSongs, 
    rockSongs,
    indieSongs
  ] = await Promise.all([
    getSongs({ boost: 'popularity_month', limit: 10 }), // Hero giữ nguyên 5
    
    // Các mục dưới tăng lên 11
    getSongs({ boost: 'buzzrate', limit: 11 }),         
    getSongs({ tag: 'pop', limit: 11 }),
    getSongs({ tag: 'electronic', limit: 11 }),
    getSongs({ tag: 'rock', limit: 11 }),
    getSongs({ tag: 'indie', limit: 11 }),
  ]);

  return (
    <div className="h-full w-full p-6 pb-[120px] overflow-y-auto scroll-smooth">
      
      {/* 1. HERO */}
      <TrendingHero songs={mostHeard} />

      {/* 2. CÁC SECTION KHÁC */}
      <div className="mt-12">
        <div className="mb-8 flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tighter font-mono text-neutral-900 dark:text-white flex items-center gap-2">
            <Disc className="text-emerald-500 animate-spin-slow" size={24}/>
            MORE_TO_EXPLORE
            </h1>
        </div>

        {/* Truyền thêm moreLink trỏ về trang Search với filter tương ứng */}
        <SongSection 
            title="Discoveries" 
            songs={discoveries} 
            moreLink="/search" // Discoveries mặc định là list chung
        />
        
        <SongSection 
            title="Pop Hits" 
            songs={popSongs} 
            moreLink="/search?tag=pop" 
        />
        
        <SongSection 
            title="Electronic Vibes" 
            songs={electronicSongs} 
            moreLink="/search?tag=electronic" 
        />
        
        <SongSection 
            title="Rock Anthems" 
            songs={rockSongs} 
            moreLink="/search?tag=rock" 
        />

        <SongSection 
            title="Indie Corner" 
            songs={indieSongs} 
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