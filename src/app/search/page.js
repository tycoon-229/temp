import getSongs from "@/app/actions/getSongs"; 
import SearchContent from "@/components/SearchContent"; 
import { Search, Disc, Filter, X, Tag, UserCheck } from "lucide-react"; // Thêm icon Tag
import Link from "next/link";
import qs from "query-string"; 
import Image from "next/image";

export const revalidate = 0;

const GENRES = ["Pop", "Rock", "Electronic", "HipHop", "Jazz", "Indie", "Cinematic", "Chillout"];

const SearchPage = async ({ searchParams }) => {
  const params = await searchParams;
  
  const { songs, artists } = await getSongs({ 
      title: params.title, 
      tag: params.tag 
  });

  // --- LOGIC TITLE THÔNG MINH ---
  let pageTitle = "SEARCH_RESULTS";
  let pageIcon = <Search className="text-emerald-500" size={40} />;

  if (params.tag && !params.title) {
      pageTitle = `${params.tag.toUpperCase()} SONGS`; // Ví dụ: POP SONGS
      pageIcon = <Tag className="text-emerald-500" size={40} />;
  } else if (params.title) {
      pageTitle = `RESULTS FOR "${params.title.toUpperCase()}"`;
  }

  return (
    <div className="flex flex-col w-full h-full p-6 pb-[120px] overflow-y-auto">
      
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4">
        
        {/* Tiêu đề động */}
        <h1 className="text-3xl md:text-5xl font-bold font-mono text-neutral-800 dark:text-white tracking-tighter flex items-center gap-3">
            {pageIcon}
            {pageTitle}
        </h1>
        
        {/* Status Bar */}
        <div className="flex flex-wrap items-center gap-2 text-sm font-mono text-neutral-500 dark:text-neutral-400">
            {params.title && (
                <div className="flex items-center gap-1 bg-neutral-200 dark:bg-white/10 px-3 py-1 rounded-full text-neutral-800 dark:text-white border border-neutral-300 dark:border-white/5">
                    <span>Query: "{params.title}"</span>
                    <Link href={qs.stringifyUrl({ url: '/search', query: { tag: params.tag } }, { skipNull: true })}>
                        <X size={14} className="hover:text-red-500 cursor-pointer"/>
                    </Link>
                </div>
            )}
            
            {params.tag && (
                <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full">
                    <span>Genre: #{params.tag}</span>
                </div>
            )}

            {!params.title && !params.tag && <span>Displaying Top Trending</span>}
            
            <span className="ml-auto text-xs">FOUND: [{songs.length}]</span>
        </div>
      </div>

      {/* FILTER TAGS */}
      <div className="mb-8 p-4 bg-white/60 dark:bg-black/20 rounded-xl border border-neutral-200 dark:border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-3 text-xs font-mono text-neutral-500 dark:text-neutral-400 tracking-widest">
            <Filter size={14}/>
            <span>FILTER_BY_GENRE</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => {
                const isSelected = params.tag === genre.toLowerCase();
                let newQuery = { ...params };
                if (isSelected) delete newQuery.tag;
                else newQuery.tag = genre.toLowerCase();

                const href = qs.stringifyUrl({
                    url: '/search',
                    query: newQuery
                }, { skipNull: true, skipEmptyString: true });

                return (
                    <Link 
                        key={genre}
                        href={href} 
                        className={`
                            px-4 py-2 rounded-lg text-sm font-mono transition-all border
                            ${isSelected 
                                ? "bg-emerald-500 text-black border-emerald-500 font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:bg-emerald-400" 
                                : "bg-transparent text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-white/10 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400" 
                            }
                        `}
                    >
                        {isSelected ? `[#${genre}]` : `#${genre}`}
                    </Link>
                )
            })}
        </div>
      </div>

      {/* --- PHẦN MỚI: TOP RESULT (ARTIST) --- */}
        {/* Chỉ hiện khi tìm theo tên và có kết quả Artist khớp */}
        {params.title && artists && artists.length > 0 && (
            <div className="mb-10">
                <h2 className="text-lg font-bold font-mono text-neutral-700 dark:text-neutral-300 mb-4 tracking-widest">TOP RESULT</h2>
                <Link href={`/artist/${encodeURIComponent(artists[0].name)}`} className="group block w-full md:w-[400px] bg-white/60 dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/10 backdrop-blur-xl rounded-2xl p-6 hover:bg-white/90 dark:hover:bg-neutral-800/60 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg cursor-pointer">
                    <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-md border-2 border-white dark:border-neutral-700 group-hover:scale-105 transition">
                            <Image src={artists[0].image} alt={artists[0].name} fill className="object-cover"/>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white font-mono group-hover:text-emerald-500 transition">{artists[0].name}</h3>
                            <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-1 uppercase tracking-widest">Artist</p>
                            <button className="mt-3 px-4 py-1.5 rounded-full bg-emerald-500 text-black text-xs font-bold font-mono flex items-center gap-2 w-max hover:bg-emerald-400 transition shadow-sm">
                                <UserCheck size={14}/> PROFILE
                            </button>
                        </div>
                    </div>
                </Link>
            </div>
        )}
      
      {/* CONTENT */}
      {songs.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-20 opacity-70 font-mono gap-4 animate-in fade-in zoom-in duration-500 text-neutral-500 dark:text-neutral-400">
            <div className="relative">
                <Disc size={60} className="text-neutral-300 dark:text-neutral-700 animate-spin-slow"/>
                <Search size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-800 dark:text-white"/>
            </div>
            <p className="text-lg tracking-widest">[NO_DATA_MATCHED]</p>
            <p className="text-xs">No tracks found combining these filters.</p>
         </div>
      ) : (
         <SearchContent songs={songs} />
      )}

    </div>
  );
};

export default SearchPage;