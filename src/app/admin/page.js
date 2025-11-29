"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  ShieldAlert, UploadCloud, Activity, Users, Trash2, TrendingUp, 
  Search, Loader2, RefreshCw, Music, ArrowLeft, Eye, X, Eraser 
} from "lucide-react";

const AdminDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [cleaning, setCleaning] = useState(false); // State cho nút dọn dẹp
  
  // --- STATE VIEW ---
  const [currentView, setCurrentView] = useState('dashboard');

  // --- STATE DỮ LIỆU ---
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSongs: 0,
    topSongs: [], 
    topSearchedArtists: [],
  });
  const [usersList, setUsersList] = useState([]);
  const [allSongsList, setAllSongsList] = useState([]); 
  const [allArtistsList, setAllArtistsList] = useState([]); 

  // --- STATE TÌM KIẾM BÀI HÁT ---
  const [songSearchTerm, setSongSearchTerm] = useState("");

  const fetchDashboardData = async () => {
    try {
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: songCount } = await supabase.from('songs').select('*', { count: 'exact', head: true });
        
        const { data: topSongs } = await supabase.from('songs').select('id, title, author, play_count').order('play_count', { ascending: false }).limit(3);
        const { data: topArtists } = await supabase.from('artist_search_counts').select('artist_name, search_count').order('search_count', { ascending: false }).limit(3);
        
        const { data: allUsers } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        const { data: allSongs } = await supabase.from('songs').select('*').order('created_at', { ascending: false });
        const { data: allArtists } = await supabase.from('artist_search_counts').select('*').order('search_count', { ascending: false });

        setStats({ totalUsers: userCount || 0, totalSongs: songCount || 0, topSongs: topSongs || [], topSearchedArtists: topArtists || [] });
        setUsersList(allUsers || []);
        setAllSongsList(allSongs || []);
        setAllArtistsList(allArtists || []);
    } catch (error) {
        console.error("System Error:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/"); return; }
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (profile?.role !== 'admin') { router.push("/"); return; }
      
      await fetchDashboardData();
      setLoading(false);
    };
    init();
  }, [router]);

  const filteredSongs = allSongsList.filter((song) => 
    song.title.toLowerCase().includes(songSearchTerm.toLowerCase()) ||
    song.author.toLowerCase().includes(songSearchTerm.toLowerCase())
  );

  const handleSyncMusic = async () => {
    if (!confirm("SYSTEM_WARNING: Execute sync protocol for 100 tracks from Jamendo API?")) return;
    setSyncing(true);
    try {
        const CLIENT_ID = '3501caaa'; 
        let allTracks = [];
        const offsets = [0, 20, 40, 60, 80]; 
        
        const fetchPromises = offsets.map(offset => 
            fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&limit=20&include=musicinfo&order=popularity_week&offset=${offset}`).then(res => res.json())
        );
        const responses = await Promise.all(fetchPromises);
        responses.forEach(data => { if (data.results) allTracks = [...allTracks, ...data.results]; });

        if (allTracks.length > 0) {
            const songsToInsert = allTracks.map(track => ({
                title: track.name,
                author: track.artist_name,
                song_url: track.audio,
                image_url: track.image,
                duration: track.duration,
                play_count: 0, 
            }));
            const { error } = await supabase.from('songs').upsert(songsToInsert, { onConflict: 'song_url', ignoreDuplicates: true });
            if (error) throw error;
            alert(`[SUCCESS]: Synced ${songsToInsert.length} tracks.`);
            await fetchDashboardData(); 
        } else {
            alert("[ERROR]: No data received.");
        }
    } catch (error) {
        alert("[CRITICAL_ERROR]: " + error.message);
    } finally {
        setSyncing(false);
    }
  };

  // --- 3. HÀM DỌN DẸP BÀI TRÙNG (MỚI) ---
  const handleCleanup = async () => {
    if (!confirm("CẢNH BÁO: Hành động này sẽ quét toàn bộ Database và xóa các bài hát bị trùng lặp (giữ lại 1 bản). Bạn có chắc chắn không?")) return;
    
    setCleaning(true);
    try {
        // Gọi hàm RPC cleanup_duplicate_songs đã tạo trong SQL
        const { error } = await supabase.rpc('cleanup_duplicate_songs');
        
        if (error) throw error;
        
        alert("✅ Đã dọn dẹp xong! Các bài hát trùng lặp đã bị xóa.");
        await fetchDashboardData(); // Tải lại danh sách
    } catch (error) {
        alert("Lỗi dọn dẹp: " + error.message);
    } finally {
        setCleaning(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if(!confirm("CONFIRM_DELETE: Remove user profile?")) return;
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (!error) {
        setUsersList(usersList.filter(u => u.id !== userId));
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
    } else { alert("Error: " + error.message); }
  };

  const handleDeleteSong = async (songId) => {
    if(!confirm("CONFIRM_DELETE: Remove track from database?")) return;
    const { error } = await supabase.from('songs').delete().eq('id', songId);
    if (!error) {
        setAllSongsList(allSongsList.filter(s => s.id !== songId));
        setStats(prev => ({ ...prev, totalSongs: prev.totalSongs - 1 }));
    } else { alert("Error: " + error.message); }
  };

  const handleDeleteSearch = async (artistName) => {
    if(!confirm(`CONFIRM_DELETE: Clear search history for "${artistName}"?`)) return;
    const { error } = await supabase.from('artist_search_counts').delete().eq('artist_name', artistName);
    if (!error) {
        setAllArtistsList(allArtistsList.filter(a => a.artist_name !== artistName));
    } else { alert("Error: " + error.message); }
  };

  if (loading) {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-neutral-900 text-emerald-500 font-mono gap-4">
            <Loader2 className="animate-spin" size={40} />
            <p className="animate-pulse tracking-widest text-xs">INITIALIZING_SYSTEM_CORE...</p>
        </div>
    );
  }

  return (
    <div className="h-full w-full p-6 pb-[120px] overflow-y-auto bg-neutral-900 text-neutral-200">
      
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
        <div>
            <h1 className="text-3xl font-bold font-mono tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-colors duration-300">
            ADMIN_CONTROL_PANEL
            </h1>
            <p className="text-[10px] text-emerald-500 tracking-[0.3em] font-mono mt-2 animate-pulse">
            :: ROOT_ACCESS_GRANTED ::
            </p>
        </div>

        {currentView === 'dashboard' && (
            <button 
                onClick={handleSyncMusic}
                disabled={syncing}
                className="group flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded hover:bg-emerald-500 hover:text-black transition disabled:opacity-50 font-mono text-xs shadow-[0_0_10px_rgba(16,185,129,0.1)]"
            >
                {syncing ? <Loader2 className="animate-spin" size={16}/> : <RefreshCw size={16} className="group-hover:rotate-180 transition duration-500"/>}
                {syncing ? "SYNCING_DATA..." : "EXECUTE_SYNC (100)"}
            </button>
        )}
      </div>

      {currentView === 'dashboard' && (
        <div className="animate-in fade-in zoom-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                
                <div className="group transition-all duration-300 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition"><UploadCloud size={24} /></div>
                        <span className="text-[10px] font-mono text-neutral-500 uppercase group-hover:text-emerald-500 transition">Module_01</span>
                    </div>
                    <h3 className="text-white font-mono text-lg mb-2 group-hover:text-emerald-400 transition">CONTENT_MANAGER</h3>
                    <p className="text-neutral-400 text-xs font-mono leading-relaxed">[STATUS: {syncing ? 'BUSY' : 'READY'}]<br/>Sync Jamendo API & Manage Tracks.</p>
                </div>

                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 opacity-90">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-full bg-blue-500/10 text-blue-500"><Users size={24} /></div>
                        <span className="text-[10px] font-mono text-neutral-500 uppercase">Module_02</span>
                    </div>
                    <h3 className="text-white font-mono text-lg mb-2">USER_DATABASE</h3>
                    <p className="text-neutral-400 text-xs font-mono">Total Users: <span className="text-blue-400 font-bold">{stats.totalUsers}</span> <br/>Active Sessions: --</p>
                </div>

                <div 
                    onClick={() => setCurrentView('songs_list')}
                    className="cursor-pointer group bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 opacity-90 hover:bg-purple-500/5 hover:border-purple-500/50 transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-full bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition"><Activity size={24} /></div>
                        <span className="text-[10px] font-mono text-neutral-500 uppercase">Metrics</span>
                    </div>
                    <h3 className="text-white font-mono text-lg mb-2 group-hover:text-purple-400">DB_METRICS</h3>
                    <p className="text-neutral-400 text-xs font-mono">Total Songs: <span className="text-purple-400 font-bold">{stats.totalSongs}</span> <br/><span className="text-[10px] text-neutral-500 group-hover:text-purple-300 transition">:: CLICK_TO_VIEW_ALL ::</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-black/20 border border-white/5 rounded-xl p-5 backdrop-blur-md">
                    <h4 className="text-white font-mono text-sm mb-4 flex items-center gap-2 uppercase tracking-wider text-opacity-80"><TrendingUp size={16} className="text-emerald-500"/> Top_Streamed_Tracks</h4>
                    <div className="space-y-3">
                        {stats.topSongs.length === 0 ? <p className="text-neutral-600 text-xs font-mono">[NO_DATA]</p> : stats.topSongs.map((song, i) => (
                            <div key={song.id} className="flex justify-between items-center text-xs font-mono border-b border-white/5 pb-2 last:border-0">
                                <div className="flex items-center gap-3"><span className="text-emerald-600">0{i+1}</span><span className="text-neutral-300 truncate w-32">{song.title}</span></div><span className="text-neutral-500">{song.play_count} plays</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative group bg-black/20 border border-white/5 rounded-xl p-5 backdrop-blur-md hover:border-blue-500/30 transition">
                    <button onClick={() => setCurrentView('artists_list')} className="absolute top-4 right-4 text-[10px] font-mono text-blue-500 hover:text-white bg-blue-500/10 hover:bg-blue-500 px-2 py-1 rounded transition">VIEW_ALL_LOGS</button>
                    <h4 className="text-white font-mono text-sm mb-4 flex items-center gap-2 uppercase tracking-wider text-opacity-80"><Search size={16} className="text-blue-500"/> Top_Searched_Artists</h4>
                    <div className="space-y-3">
                        {stats.topSearchedArtists.length === 0 ? <p className="text-neutral-600 text-xs font-mono">[NO_DATA]</p> : stats.topSearchedArtists.map((artist, i) => (
                            <div key={i} className="flex justify-between items-center text-xs font-mono border-b border-white/5 pb-2 last:border-0">
                                <div className="flex items-center gap-3"><span className="text-blue-600">0{i+1}</span><span className="text-neutral-300 truncate w-32">{artist.artist_name}</span></div><span className="text-neutral-500">{artist.search_count} queries</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center"><h3 className="text-white font-mono text-sm uppercase tracking-wider flex items-center gap-2"><Users size={16} className="text-yellow-500"/> User_Manifest_Log</h3><span className="text-[10px] text-neutral-500 font-mono">Count: {usersList.length}</span></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono text-neutral-400">
                        <thead className="bg-black/40 text-neutral-500 uppercase tracking-widest"><tr><th className="px-6 py-4 font-normal">Identity</th><th className="px-6 py-4 font-normal">Role_Status</th><th className="px-6 py-4 font-normal">Date</th><th className="px-6 py-4 font-normal text-right">Cmd</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                            {usersList.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition duration-200">
                                    <td className="px-6 py-4 flex items-center gap-3"><div className="w-8 h-8 rounded bg-neutral-800 border border-white/10 overflow-hidden flex items-center justify-center">{user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover"/> : <Users size={12}/>}</div><div className="flex flex-col"><span className="text-neutral-200">{user.full_name || "Unknown"}</span>{user.phone && <span className="text-[10px] text-neutral-600">{user.phone}</span>}</div></td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] border ${user.role === 'admin' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>{user.role === 'admin' ? 'ADMIN_PRIVILEGE' : 'USER_STANDARD'}</span></td>
                                    <td className="px-6 py-4 opacity-60">{new Date(user.created_at).toLocaleDateString('en-GB')}</td>
                                    <td className="px-6 py-4 text-right">{user.role !== 'admin' && (<button onClick={() => handleDeleteUser(user.id)} className="text-neutral-600 hover:text-red-500 transition p-2 hover:bg-red-500/10 rounded" title="Delete User"><Trash2 size={16} /></button>)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {usersList.length === 0 && <div className="p-8 text-center text-neutral-600 font-mono text-xs">[NO_RECORDS_FOUND]</div>}
                </div>
            </div>
        </div>
      )}

      {/* --- VIEW 2: SONGS LIST (CÓ TÌM KIẾM & NÚT XÓA TRÙNG) --- */}
      {currentView === 'songs_list' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <button onClick={() => { setCurrentView('dashboard'); setSongSearchTerm(""); }} className="flex items-center gap-2 text-neutral-400 hover:text-white transition font-mono text-sm group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition"/> RETURN_TO_BASE
                </button>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* NÚT XÓA TRÙNG MỚI */}
                    <button 
                        onClick={handleCleanup}
                        disabled={cleaning}
                        className="flex items-center gap-2 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2.5 rounded hover:bg-red-500 hover:text-white transition disabled:opacity-50 font-mono text-xs whitespace-nowrap"
                        title="Remove duplicate songs from database"
                    >
                        {cleaning ? <Loader2 className="animate-spin" size={14}/> : <Eraser size={14}/>}
                        REMOVE_DUPLICATES
                    </button>

                    {/* SEARCH BAR */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16}/>
                        <input 
                            value={songSearchTerm}
                            onChange={(e) => setSongSearchTerm(e.target.value)}
                            placeholder="SEARCH_TRACK..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-xs font-mono text-white outline-none focus:border-purple-500 focus:bg-white/5 transition"
                        />
                        {songSearchTerm && (
                            <button onClick={() => setSongSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
                                <X size={14}/>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <h3 className="text-white font-mono text-sm uppercase tracking-wider flex items-center gap-2">
                        <Music size={16} className="text-purple-500"/> Full_Database_Tracks
                    </h3>
                    <span className="text-[10px] text-neutral-500 font-mono">
                        Showing: {filteredSongs.length} / {allSongsList.length}
                    </span>
                </div>
                
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left text-xs font-mono text-neutral-400">
                        <thead className="bg-black/40 text-neutral-500 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md"><tr><th className="px-6 py-4 font-normal">Track_Info</th><th className="px-6 py-4 font-normal">Artist</th><th className="px-6 py-4 font-normal">Plays</th><th className="px-6 py-4 font-normal">Import_Date</th><th className="px-6 py-4 font-normal text-right">Action</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSongs.map((song) => (
                                <tr key={song.id} className="hover:bg-white/5 transition">
                                    <td className="px-6 py-4 flex items-center gap-3"><div className="w-8 h-8 rounded bg-neutral-800 border border-white/10 overflow-hidden flex-shrink-0">{song.image_url ? <img src={song.image_url} className="w-full h-full object-cover"/> : <Music size={12}/>}</div><span className="text-neutral-200 truncate max-w-[200px]">{song.title}</span></td>
                                    <td className="px-6 py-4 text-neutral-400">{song.author}</td>
                                    <td className="px-6 py-4"><span className="text-emerald-500 font-bold">{song.play_count}</span></td>
                                    <td className="px-6 py-4 opacity-60">{new Date(song.created_at).toLocaleDateString('en-GB')}</td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => handleDeleteSong(song.id)} className="text-neutral-600 hover:text-red-500 transition p-2 hover:bg-red-500/10 rounded"><Trash2 size={16} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredSongs.length === 0 && <div className="p-8 text-center text-neutral-600 font-mono text-xs">[NO_MATCHES_FOUND]</div>}
                </div>
            </div>
        </div>
      )}

      {/* --- VIEW 3: ARTISTS LIST --- */}
      {currentView === 'artists_list' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button onClick={() => setCurrentView('dashboard')} className="mb-4 flex items-center gap-2 text-neutral-400 hover:text-white transition font-mono text-sm group"><ArrowLeft size={16} className="group-hover:-translate-x-1 transition"/> RETURN_TO_BASE</button>
            <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center"><h3 className="text-white font-mono text-sm uppercase tracking-wider flex items-center gap-2"><Search size={16} className="text-blue-500"/> Search_Query_Log</h3><span className="text-[10px] text-neutral-500 font-mono">Unique: {allArtistsList.length}</span></div>
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left text-xs font-mono text-neutral-400">
                        <thead className="bg-black/40 text-neutral-500 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md"><tr><th className="px-6 py-4 font-normal">Rank</th><th className="px-6 py-4 font-normal">Keyword</th><th className="px-6 py-4 font-normal">Count</th><th className="px-6 py-4 font-normal text-right">Action</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                            {allArtistsList.map((artist, i) => (
                                <tr key={i} className="hover:bg-white/5 transition">
                                    <td className="px-6 py-4 text-neutral-500">#{i+1}</td>
                                    <td className="px-6 py-4"><span className="text-neutral-200 font-bold">{artist.artist_name}</span></td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="h-1.5 w-16 bg-neutral-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${Math.min((artist.search_count / (allArtistsList[0]?.search_count || 1)) * 100, 100)}%` }}></div></div><span className="text-blue-400">{artist.search_count}</span></div></td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => handleDeleteSearch(artist.artist_name)} className="text-neutral-600 hover:text-red-500 transition p-2 hover:bg-red-500/10 rounded"><Trash2 size={16} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {allArtistsList.length === 0 && <div className="p-8 text-center text-neutral-600 font-mono text-xs">[NO_LOGS_FOUND]</div>}
                </div>
            </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-10 p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-lg flex items-center gap-3">
         <ShieldAlert className="text-yellow-600 dark:text-yellow-500" size={20} />
         <p className="text-xs text-yellow-700 dark:text-yellow-500/80 font-mono">WARNING: Authorized personnel only. All actions are logged.</p>
      </div>
    </div>
  );
}

export default AdminDashboard;