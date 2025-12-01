"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ListMusic, User, Play, Loader2, Heart } from "lucide-react";
import Link from "next/link"; 
import { DecoderText, CyberCard, GlitchText } from "@/components/CyberComponents"; 
import FollowButton from '@/components/FollowButton';

// --- PLAYLIST CARD ---
const PlaylistCard = ({ playlist }) => (
  <Link href={`/playlist/${encodeURIComponent(playlist.name)}`}>
    <CyberCard className="group h-full p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer relative">
       <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition translate-y-2 group-hover:translate-y-0 z-10">
          <div className="bg-emerald-500 p-2 rounded-full shadow-lg hover:scale-105 transition">
              <Play size={16} fill="black" className="text-black ml-0.5"/>
          </div>
       </div>
       
       <div className="w-full aspect-square bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-black rounded-lg mb-3 flex items-center justify-center shadow-md border border-neutral-300 dark:border-white/5 group-hover:border-emerald-500/30 transition">
          <ListMusic size={32} className="text-neutral-500 group-hover:text-emerald-500 transition"/>
       </div>
       
       <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
          {playlist.name}
       </h3>
       <p className="text-[10px] text-neutral-500 font-mono mt-0.5 uppercase tracking-wider">My Playlist</p>
    </CyberCard>
  </Link>
);

// --- ARTIST CARD (ĐÃ SỬA NÚT FOLLOW) ---
const ArtistCard = ({ name, image, onUnfollow }) => (
  <CyberCard className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer group border border-transparent hover:border-emerald-500/30">
     <Link href={`/artist/${encodeURIComponent(name)}`} className="flex-1 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 flex items-center justify-center overflow-hidden group-hover:border-emerald-500/50 transition">
            {image ? (<img src={image} className="w-full h-full object-cover" alt={name}/>) : (<User size={24} className="text-neutral-500 group-hover:text-emerald-500 transition"/>)}
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition truncate">{name}</h3>
            <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">Artist</p>
        </div>
     </Link>
     <div className="shrink-0">
        {/* Truyền callback để khi Unfollow thì xóa khỏi list ngay lập tức */}
        <FollowButton 
            artistName={name} 
            artistImage={image} 
            onFollowChange={(isFollowing) => !isFollowing && onUnfollow(name)} 
        />
     </div>
  </CyberCard>
);

const ProfilePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [followedArtists, setFollowedArtists] = useState([]);
  const [activeTab, setActiveTab] = useState('playlists');

  useEffect(() => {
    const getData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/'); return; }
        
        const currentUser = session.user;
        setUser(currentUser);

        // 1. Lấy Profile
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
        setProfile(profileData);

        // 2. Lấy Playlist
        const { data: playlistData } = await supabase.from('playlists').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
        setPlaylists(playlistData || []);

        // 3. Lấy Nghệ sĩ đã Follow
        const { data: followingData } = await supabase
            .from('following_artists')
            .select('artist_name, artist_image')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
            
        setFollowedArtists(followingData || []);

      } catch (error) { 
        console.error("Lỗi tải profile:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    getData();
  }, [router]);

  // Hàm xử lý khi Unfollow thì xóa khỏi giao diện ngay
  const handleUnfollow = (artistName) => {
      setFollowedArtists(prev => prev.filter(a => a.artist_name !== artistName));
  };

  if (loading) return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-neutral-100 dark:bg-black transition-colors">
        <Loader2 className="animate-spin text-emerald-500" size={32} /> 
        <p className="text-xs text-emerald-500 tracking-widest font-mono">LOADING_USER_DATA...</p>
    </div>
  );

  if (!user) return null; 

  return (
    <div className="w-full h-full p-6 pb-[100px] overflow-y-auto custom-scrollbar bg-neutral-100 dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-end gap-6 mb-8 pb-6 border-b border-neutral-300 dark:border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="relative group w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-neutral-800 shadow-xl">
            {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover group-hover:scale-110 transition duration-700"/>
            ) : (
                <div className="w-full h-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                    <User size={48} className="text-neutral-400 dark:text-neutral-600"/>
                </div>
            )}
         </div>

         <div className="flex-1 mb-1">
            <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-500 tracking-[0.3em] uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                :: PERSONAL_PROFILE ::
            </p>
            
            <h1 className="text-3xl md:text-5xl font-bold font-mono text-neutral-900 dark:text-white mb-3 tracking-tighter">
                {profile?.full_name || "Music Listener"}
            </h1>
            
            <div className="flex items-center gap-6 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold"><ListMusic size={14}/> {playlists.length} Playlists</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold"><Heart size={14}/> {followedArtists.length} Following</span>
                <span>•</span>
                <span className="truncate max-w-[200px] opacity-70">{user?.email}</span>
            </div>
         </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-6 mb-6 border-b border-neutral-200 dark:border-white/5">
         <button 
            onClick={() => setActiveTab('playlists')}
            className={`pb-3 text-xs font-bold font-mono transition border-b-2 uppercase tracking-wider px-2 ${activeTab === 'playlists' ? 'text-emerald-600 dark:text-emerald-500 border-emerald-500' : 'text-neutral-500 border-transparent hover:text-black dark:hover:text-white'}`}
         >
            My_Playlists ({playlists.length})
         </button>
         <button 
            onClick={() => setActiveTab('artists')}
            className={`pb-3 text-xs font-bold font-mono transition border-b-2 uppercase tracking-wider px-2 ${activeTab === 'artists' ? 'text-emerald-600 dark:text-emerald-500 border-emerald-500' : 'text-neutral-500 border-transparent hover:text-black dark:hover:text-white'}`}
         >
            Following_Artists ({followedArtists.length})
         </button>
      </div>

      {/* CONTENT */}
      <div className="animate-in fade-in zoom-in duration-500">
         {activeTab === 'playlists' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {playlists.length > 0 ? (
                    playlists.map(pl => <PlaylistCard key={pl.id} playlist={pl} />)
                ) : (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-neutral-400 gap-2">
                        <ListMusic size={40} className="opacity-30"/>
                        <p className="font-mono italic text-xs tracking-widest">[NO_PLAYLISTS_CREATED]</p>
                    </div>
                )}
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
               {followedArtists.length > 0 ? (
                    followedArtists.map((a) => (
                        <ArtistCard 
                            key={a.artist_name} 
                            name={a.artist_name} 
                            image={a.artist_image} 
                            onUnfollow={handleUnfollow} 
                        />
                    ))
               ) : (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-neutral-400 gap-2">
                      <User size={40} className="opacity-30"/>
                      <p className="font-mono italic text-xs tracking-widest">[NO_ARTISTS_FOLLOWED]</p>
                  </div>
               )}
            </div>
         )}
      </div>

    </div>
  );
};

export default ProfilePage;