"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  ShieldAlert, UploadCloud, Activity, Users, Trash2, TrendingUp, 
  Search, Loader2, RefreshCw, Music, ArrowLeft, Eraser, Mic2, Heart, Skull, ArchiveRestore 
} from "lucide-react";
import useUI from "@/hooks/useUI";
import { GlitchButton, HoloButton } from "@/components/CyberComponents";

const AdminDashboard = () => {
  const router = useRouter();
  const { alert, confirm } = useUI(); // Sử dụng UI Hook tùy chỉnh
  
  // --- STATES QUẢN LÝ TRẠNG THÁI ---
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingArtists, setSyncingArtists] = useState(false); 
  const [cleaning, setCleaning] = useState(false); 
  const [resetting, setResetting] = useState(false);
  const [restoring, setRestoring] = useState(false); 
  
  const [currentView, setCurrentView] = useState('dashboard');

  // --- STATE DỮ LIỆU ---
  const [stats, setStats] = useState({
    totalUsers: 0, totalSongs: 0, totalArtists: 0,
    topSongs: [], topSearchedArtists: [],
  });
  
  const [usersList, setUsersList] = useState([]);
  const [allSongsList, setAllSongsList] = useState([]); 
  const [allArtistsList, setAllArtistsList] = useState([]); // Log tìm kiếm
  const [fullArtistsList, setFullArtistsList] = useState([]); // Danh sách Nghệ sĩ (Đã gộp & Sort)
  const [popularArtistsList, setPopularArtistsList] = useState([]); // Top 5 Followed

  // --- STATE TÌM KIẾM ---
  const [songSearchTerm, setSongSearchTerm] = useState("");
  const [artistSearchTerm, setArtistSearchTerm] = useState("");

  // --- HÀM TẢI DỮ LIỆU TỔNG HỢP ---
  const fetchDashboardData = async () => {
    try {
        // 1. Lấy các số liệu đếm nhanh
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: songCount } = await supabase.from('songs').select('*', { count: 'exact', head: true });
        
        // 2. Top Bài hát (theo lượt nghe)
        const { data: topSongs } = await supabase.from('songs').select('id, title, author, play_count').order('play_count', { ascending: false }).limit(3);
        
        // 3. Top Từ khóa tìm kiếm (theo hành vi người dùng)
        const { data: topSearched } = await supabase.from('artist_search_counts').select('artist_name, search_count').order('search_count', { ascending: false }).limit(3);
        
        // 4. Lấy danh sách chi tiết
        const { data: allUsers } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        // Lấy 2000 bài hát mới nhất để hiển thị danh sách (giới hạn để tránh quá tải)
        const { data: allSongs } = await supabase.from('songs').select('*').order('created_at', { ascending: false }).range(0, 1999); 
        const { data: allSearchLogs } = await supabase.from('artist_search_counts').select('*').order('search_count', { ascending: false });
        
        // --- 5. LOGIC GỘP NGHỆ SĨ & TÍNH FOLLOWER ---
        // A. Lấy nghệ sĩ từ DB (Đã Sync)
        const { data: dbArtists } = await supabase.from('artists').select('*');
        // B. Lấy danh sách Follow (Người dùng follow)
        const { data: allFollows } = await supabase.from('following_artists').select('artist_name, artist_image');
        
        const artistMap = {};

        // B1. Đưa DB Artists vào Map trước
        (dbArtists || []).forEach(a => {
            const key = a.name.trim().toLowerCase();
            artistMap[key] = {
                ...a,
                originalName: a.name, 
                followers: 0,
                inDB: true
            };
        });

        // B2. Duyệt bảng Follow để đếm và bổ sung người thiếu
        if (allFollows) {
            allFollows.forEach(item => {
                const key = item.artist_name.trim().toLowerCase();
                if (!artistMap[key]) {
                    // Nghệ sĩ này được follow nhưng chưa sync vào bảng artists
                    artistMap[key] = {
                        id: null, 
                        name: item.artist_name,
                        originalName: item.artist_name,
                        image_url: item.artist_image,
                        created_at: new Date().toISOString(),
                        followers: 0,
                        inDB: false 
                    };
                }
                // Tăng đếm follower
                artistMap[key].followers += 1;
            });
        }

        // B3. Chuyển về mảng và Sắp xếp theo Followers giảm dần
        const mergedArtists = Object.values(artistMap).sort((a, b) => b.followers - a.followers);

        // Cập nhật State
        setStats({ 
            totalUsers: userCount || 0, 
            totalSongs: songCount || 0, 
            totalArtists: mergedArtists.length, 
            topSongs: topSongs || [], 
            topSearchedArtists: topSearched || [] 
        });
        
        setUsersList(allUsers || []);
        setAllSongsList(allSongs || []);
        setAllArtistsList(allSearchLogs || []);
        setFullArtistsList(mergedArtists || []); 
        setPopularArtistsList(mergedArtists.slice(0, 5) || []); // Top 5 hiển thị Dashboard

    } catch (error) {
        console.error("System Error:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/"); return; }
      
      // Kiểm tra quyền Admin
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (profile?.role !== 'admin') { router.push("/"); return; }
      
      await fetchDashboardData();
      setLoading(false);
    };
    init();
  }, [router]);

  // --- LOGIC LỌC DỮ LIỆU (SEARCH FILTER) ---
  const filteredSongs = allSongsList.filter((song) => 
    (song.title || "").toLowerCase().includes(songSearchTerm.toLowerCase()) ||
    (song.author || "").toLowerCase().includes(songSearchTerm.toLowerCase())
  );

  const filteredArtists = fullArtistsList.filter((artist) => 
    (artist.originalName || artist.name || "").toLowerCase().includes(artistSearchTerm.toLowerCase())
  );

  const filteredSearchLogs = allArtistsList.filter((log) => 
    (log.artist_name || "").toLowerCase().includes(artistSearchTerm.toLowerCase())
  );

  // --- CÁC HÀM XỬ LÝ (HANDLERS) ---

  // 1. Đồng bộ Nhạc (100 bài)
  const handleSyncMusic = async () => {
    if (!await confirm("Execute sync protocol for 100 tracks from Jamendo API?", "SYNC_CONFIRMATION")) return;
    setSyncing(true);
    try {
        const CLIENT_ID = '3501caaa'; 
        let allTracks = [];
        const offsets = Array.from({ length: 5 }, (_, i) => i * 20); 
        
        // Gọi API song song
        const fetchPromises = offsets.map(offset => 
            fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&limit=20&include=musicinfo&order=popularity_week&offset=${offset}`).then(res => res.json())
        );
        const responses = await Promise.all(fetchPromises);
        responses.forEach(data => { if (data.results) allTracks = [...allTracks, ...data.results]; });

        if (allTracks.length > 0) {
            const songsToInsert = allTracks.map(track => ({
                title: track.name, author: track.artist_name, song_url: track.audio, image_url: track.image, duration: track.duration, play_count: 0, 
            }));
            // Upsert (Cập nhật nếu trùng link nhạc)
            const { error } = await supabase.from('songs').upsert(songsToInsert, { onConflict: 'song_url', ignoreDuplicates: true });
            if (error) throw error;
            
            alert(`Synced ${songsToInsert.length} tracks successfully.`, "success");
            await fetchDashboardData(); 
        }
    } catch (error) { alert("Error: " + error.message, "error"); } finally { setSyncing(false); }
  };

  // 2. Đồng bộ Nghệ sĩ (50 người hot nhất)
  const handleSyncArtists = async () => {
    if (!await confirm("Update top 50 artists from Jamendo?", "SYNC_ARTISTS")) return;
    setSyncingArtists(true);
    try {
        const CLIENT_ID = '3501caaa'; 
        const res = await fetch(`https://api.jamendo.com/v3.0/artists/?client_id=${CLIENT_ID}&format=jsonpretty&limit=50&order=popularity_total`);
        const data = await res.json();
        if (data.results) {
            const artistsToInsert = data.results.map(artist => ({ name: artist.name, image_url: artist.image }));
            const { error } = await supabase.from('artists').upsert(artistsToInsert, { onConflict: 'name', ignoreDuplicates: true });
            if (error) throw error;
            alert(`Synced ${artistsToInsert.length} artists.`, "success");
            await fetchDashboardData(); 
        }
    } catch (error) { alert("Error: " + error.message, "error"); } finally { setSyncingArtists(false); }
  };

  // 3. Reset Artist Data (Xóa hết bảng artists)
  const handleResetArtists = async () => {
    if (!await confirm("DANGER: Wipe Artist DB? (Follow data will be kept but unlinked).", "CONFIRM RESET")) return;
    setResetting(true);
    try {
        const { error } = await supabase.rpc('reset_artists_data');
        if (error) throw error;
        alert("Artist Database wiped. Ready to re-sync.", "success");
        await fetchDashboardData();
    } catch (error) { alert(error.message, "error"); } finally { setResetting(false); }
  };

  // 4. Khôi phục Nghệ sĩ từ danh sách Follow
  const handleRestoreFollowed = async () => {
     if (!await confirm("Restore artists from user follow lists to main Database?", "RESTORE")) return;
     setRestoring(true);
     try {
         const { error } = await supabase.rpc('restore_followed_artists');
         if (error) throw error;
         alert("Restored followed artists successfully!", "success");
         await fetchDashboardData();
     } catch (error) {
         alert(error.message, "error");
     } finally {
         setRestoring(false);
     }
  };

  // 5. Dọn dẹp trùng lặp
  const handleCleanupSongs = async () => {
    if (!await confirm("Remove duplicate songs based on URL?", "CLEANUP")) return;
    setCleaning(true);
    try { await supabase.rpc('cleanup_duplicate_songs'); alert("Cleanup Complete!", "success"); await fetchDashboardData(); } catch (e) { alert(e.message, "error"); } finally { setCleaning(false); }
  };
  
  const handleCleanupArtists = async () => {
    if (!await confirm("Remove duplicate artists based on Name?", "CLEANUP")) return;
    setCleaning(true);
    try { await supabase.rpc('cleanup_duplicate_artists'); alert("Cleanup Complete!", "success"); await fetchDashboardData(); } catch (e) { alert(e.message, "error"); } finally { setCleaning(false); }
  };

  // 6. Các hàm Xóa đơn lẻ
  const handleDeleteUser = async (id) => { if(await confirm("Permanently delete this user profile?", "DELETE USER")) { await supabase.from('profiles').delete().eq('id', id); fetchDashboardData(); } };
  const handleDeleteSong = async (id) => { if(await confirm("Remove this song from database?", "DELETE SONG")) { await supabase.from('songs').delete().eq('id', id); fetchDashboardData(); } };
  const handleDeleteSearch = async (name) => { if(await confirm("Clear this search log entry?", "DELETE LOG")) { await supabase.from('artist_search_counts').delete().eq('artist_name', name); fetchDashboardData(); } };
  const handleDeleteDbArtist = async (id) => { 
    if (!id) return alert("Artist này chưa được Sync vào DB chính (chỉ tồn tại trong danh sách Follow).", "warning");
    if(await confirm("Delete Artist from main Database?", "DELETE ARTIST")) { await supabase.from('artists').delete().eq('id', id); fetchDashboardData(); } 
  };

  // Loading View
  if (loading) return <div className="h-full w-full flex flex-col items-center justify-center bg-neutral-900 text-emerald-500 font-mono gap-4"><Loader2 className="animate-spin" size={40} /><p className="animate-pulse tracking-widest text-xs">INITIALIZING SYSTEM...</p></div>;

  return (
    <div className="h-full w-full p-6 pb-[120px] overflow-y-auto bg-neutral-900 text-neutral-200">
      
      {/* HEADER & TOOLBAR */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
        <div>
            <h1 className="text-3xl font-bold font-mono tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">ADMIN_CONTROL</h1>
            <p className="text-[10px] text-emerald-500 tracking-[0.3em] font-mono mt-2 animate-pulse">:: ROOT_ACCESS_GRANTED ::</p>
        </div>
        
        {currentView === 'dashboard' && (
            <div className="flex gap-3 flex-wrap">
                <HoloButton onClick={handleSyncMusic} disabled={syncing} className="bg-emerald-500/10 border-emerald-500/50 text-emerald-400 text-xs px-4 py-2">
                    {syncing ? <Loader2 className="animate-spin" size={14}/> : <RefreshCw size={14}/>} SYNC_SONGS
                </HoloButton>
                <HoloButton onClick={handleSyncArtists} disabled={syncingArtists} className="bg-blue-500/10 border-blue-500/50 text-blue-400 text-xs px-4 py-2">
                    {syncingArtists ? <Loader2 className="animate-spin" size={14}/> : <Mic2 size={14}/>} SYNC_ARTISTS
                </HoloButton>
                <HoloButton onClick={handleRestoreFollowed} disabled={restoring} className="bg-purple-500/10 border-purple-500/50 text-purple-400 text-xs px-4 py-2">
                    {restoring ? <Loader2 className="animate-spin" size={14}/> : <ArchiveRestore size={14}/>} RESTORE_FOLLOWED
                </HoloButton>
                <GlitchButton onClick={handleResetArtists} disabled={resetting} className="bg-red-500/10 border-red-500/50 text-red-400 text-xs px-4 py-2">
                    {resetting ? <Loader2 className="animate-spin" size={14}/> : <Skull size={14}/>} RESET_ARTISTS
                </GlitchButton>
            </div>
        )}
      </div>

      {/* VIEW 1: DASHBOARD */}
      {currentView === 'dashboard' && (
        <div className="animate-in fade-in zoom-in duration-500">
            {/* GRID CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Card 1 */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-mono text-lg mb-2">CONTENT</h3>
                    <p className="text-neutral-400 text-xs font-mono">Status: Ready</p>
                </div>
                {/* Card 2 */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-mono text-lg mb-2">USERS</h3>
                    <p className="text-neutral-400 text-xs font-mono">Total: <span className="text-blue-400 font-bold">{stats.totalUsers}</span></p>
                </div>
                {/* Card 3: Metrics (Clickable) */}
                <div className="group bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 hover:bg-purple-500/5 hover:border-purple-500/50 transition-all">
                    <h3 className="text-white font-mono text-lg mb-2 group-hover:text-purple-400">DB_METRICS</h3>
                    <p className="text-neutral-400 text-xs font-mono mb-3">Songs: {stats.totalSongs} | Artists: {stats.totalArtists}</p>
                    <div className="flex gap-2">
                         <button onClick={() => setCurrentView('songs_list')} className="text-[10px] bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white px-3 py-1 rounded transition font-mono">VIEW SONGS</button>
                         <button onClick={() => setCurrentView('db_artists_list')} className="text-[10px] bg-pink-500/20 hover:bg-pink-500 text-pink-300 hover:text-white px-3 py-1 rounded transition font-mono">VIEW ARTISTS</button>
                    </div>
                </div>
            </div>

            {/* STATS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Top Streamed */}
                <div className="bg-black/20 border border-white/5 rounded-xl p-5">
                    <h4 className="text-white font-mono text-sm mb-4 flex gap-2"><TrendingUp size={16} className="text-emerald-500"/> Top_Streamed_Tracks</h4>
                    <div className="space-y-3">
                        {stats.topSongs.map((s,i)=>(
                            <div key={s.id} className="flex justify-between text-xs font-mono border-b border-white/5 pb-2">
                                <span className="truncate w-40">{i+1}. {s.title}</span>
                                <span className="text-emerald-500">{s.play_count}</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Most Followed Artists */}
                <div className="relative bg-black/20 border border-white/5 rounded-xl p-5 hover:border-pink-500/30 transition">
                    <h4 className="text-white font-mono text-sm mb-4 flex gap-2"><Mic2 size={16} className="text-pink-500"/> Most_Followed_Artists</h4>
                    <div className="space-y-3">
                        {popularArtistsList.slice(0, 5).map((artist, i) => (
                            <div key={i} className="flex justify-between items-center text-xs font-mono border-b border-white/5 pb-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-pink-500 font-bold">#{i+1}</span>
                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-800">
                                        {artist.image_url && <img src={artist.image_url} className="w-full h-full object-cover"/>}
                                    </div>
                                    <span className="text-neutral-300 truncate w-24">{artist.originalName}</span>
                                    {!artist.inDB && <span className="text-[8px] text-red-400 ml-1">Sync Needed</span>}
                                </div>
                                <span className="text-[10px] text-pink-500 flex items-center gap-1"><Heart size={10} fill="currentColor"/> {artist.followers}</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setCurrentView('db_artists_list')} className="absolute top-4 right-4 text-[10px] text-blue-500 hover:text-white">VIEW ALL</button>
                </div>
            </div>
            
             {/* Top Searched */}
             <div className="bg-black/20 border border-white/5 rounded-xl p-5 backdrop-blur-md mb-8">
                <div className="flex justify-between items-center mb-4">
                     <h4 className="text-white font-mono text-sm flex items-center gap-2 uppercase tracking-wider text-opacity-80"><Search size={16} className="text-blue-500"/> Top_Searched_Keywords</h4>
                     <button onClick={() => setCurrentView('artists_list')} className="text-[10px] font-mono text-blue-500 hover:text-white bg-blue-500/10 hover:bg-blue-500 px-2 py-1 rounded transition">VIEW LOGS</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.topSearchedArtists.map((artist, i) => (
                        <div key={i} className="flex justify-between items-center text-xs font-mono bg-white/5 p-3 rounded-lg">
                            <div className="flex items-center gap-3"><span className="text-blue-600 font-bold">#{i+1}</span><span className="text-neutral-300 truncate">{artist.artist_name}</span></div><span className="text-blue-400 font-bold">{artist.search_count} <span className="text-[9px] text-neutral-500 font-normal">queries</span></span>
                        </div>
                    ))}
                </div>
            </div>

            {/* USER TABLE */}
            <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center"><h3 className="text-white font-mono text-sm uppercase tracking-wider flex items-center gap-2"><Users size={16} className="text-yellow-500"/> User_Manifest_Log</h3><span className="text-[10px] text-neutral-500 font-mono">Count: {usersList.length}</span></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono text-neutral-400">
                        <thead className="bg-black/40 text-neutral-500 uppercase tracking-widest"><tr><th className="px-6 py-4">Identity</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Date</th><th className="px-6 py-4 text-right">Cmd</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                            {usersList.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition">
                                    <td className="px-6 py-4 flex items-center gap-3"><div className="w-8 h-8 rounded bg-neutral-800 border border-white/10 overflow-hidden flex items-center justify-center">{user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover"/> : <Users size={12}/>}</div><div className="flex flex-col"><span className="text-neutral-200">{user.full_name || "Unknown"}</span>{user.phone && <span className="text-[10px] text-neutral-600">{user.phone}</span>}</div></td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] border ${user.role === 'admin' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>{user.role}</span></td>
                                    <td className="px-6 py-4 opacity-60">{new Date(user.created_at).toLocaleDateString('en-GB')}</td>
                                    <td className="px-6 py-4 text-right">{user.role !== 'admin' && (<button onClick={() => handleDeleteUser(user.id)} className="text-neutral-600 hover:text-red-500 transition p-2 hover:bg-red-500/10 rounded"><Trash2 size={16} /></button>)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* VIEW 2: SONGS LIST */}
      {currentView === 'songs_list' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <button onClick={() => { setCurrentView('dashboard'); setSongSearchTerm(""); }} className="flex items-center gap-2 text-neutral-400 hover:text-white font-mono text-sm group"><ArrowLeft size={16}/> RETURN_TO_BASE</button>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <GlitchButton onClick={handleCleanupSongs} disabled={cleaning} className="bg-red-500/10 border-red-500/50 text-red-400 px-4 py-2 text-xs">{cleaning ? <Loader2 className="animate-spin" size={14}/> : <Eraser size={14}/>} REMOVE_DUPLICATES</GlitchButton>
                    <div className="relative w-full md:w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16}/><input value={songSearchTerm} onChange={(e) => setSongSearchTerm(e.target.value)} placeholder="SEARCH_TRACK..." className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-xs font-mono text-white outline-none focus:border-purple-500"/></div>
                </div>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left text-xs font-mono text-neutral-400">
                        <thead className="bg-black/40 text-neutral-500 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md"><tr><th className="px-6 py-4">Track</th><th className="px-6 py-4">Artist</th><th className="px-6 py-4">Plays</th><th className="px-6 py-4 text-right">Cmd</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSongs.map((song) => (
                                <tr key={song.id} className="hover:bg-white/5">
                                    <td className="px-6 py-4 flex items-center gap-3"><div className="w-8 h-8 rounded bg-neutral-800 border border-white/10 overflow-hidden flex-shrink-0">{song.image_url ? <img src={song.image_url} className="w-full h-full object-cover"/> : <Music size={12}/>}</div><span className="text-neutral-200 truncate max-w-[200px]">{song.title}</span></td>
                                    <td className="px-6 py-4 text-neutral-400">{song.author}</td>
                                    <td className="px-6 py-4"><span className="text-emerald-500 font-bold">{song.play_count}</span></td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => handleDeleteSong(song.id)} className="text-neutral-600 hover:text-red-500 transition p-2 hover:bg-red-500/10 rounded"><Trash2 size={16} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* VIEW 3: ARTISTS LOGS */}
      {currentView === 'artists_list' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => { setCurrentView('dashboard'); setArtistSearchTerm(""); }} className="flex items-center gap-2 text-neutral-400 hover:text-white font-mono text-sm"><ArrowLeft size={14}/> BACK</button>
                <div className="relative w-64"><Search className="absolute left-2 top-2 text-neutral-500" size={12}/><input value={artistSearchTerm} onChange={(e) => setArtistSearchTerm(e.target.value)} placeholder="Search Logs..." className="w-full bg-black/40 border border-white/10 rounded pl-8 py-1.5 text-xs text-white outline-none focus:border-blue-500"/></div>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left text-xs font-mono text-neutral-400">
                        <thead className="bg-black/40 text-neutral-500 sticky top-0 backdrop-blur-md"><tr><th className="px-6 py-4">Keyword</th><th className="px-6 py-4">Count</th><th className="px-6 py-4 text-right">Cmd</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSearchLogs.map((artist, i) => (
                                <tr key={i} className="hover:bg-white/5"><td className="px-6 py-4"><span className="text-neutral-200 font-bold">{artist.artist_name}</span></td><td className="px-6 py-4 text-blue-400">{artist.search_count}</td><td className="px-6 py-4 text-right"><button onClick={() => handleDeleteSearch(artist.artist_name)} className="hover:text-red-500"><Trash2 size={16} /></button></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* VIEW 4: DB ARTISTS LIST */}
      {currentView === 'db_artists_list' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentView('dashboard')} className="flex items-center gap-2 text-neutral-400 hover:text-white text-xs font-mono"><ArrowLeft size={14}/> BACK</button>
                <div className="flex items-center gap-4">
                    <GlitchButton onClick={handleCleanupArtists} disabled={cleaning} className="bg-red-500/10 border-red-500/50 text-red-400 px-4 py-2 text-xs">{cleaning ? <Loader2 className="animate-spin" size={14}/> : <Eraser size={14}/>} CLEANUP</GlitchButton>
                    <div className="relative w-64"><Search className="absolute left-2 top-2 text-neutral-500" size={12}/><input value={artistSearchTerm} onChange={(e) => setArtistSearchTerm(e.target.value)} placeholder="Search Artist..." className="w-full bg-black/40 border border-white/10 rounded pl-8 py-1.5 text-xs text-white outline-none focus:border-pink-500"/></div>
                </div>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left text-xs font-mono text-neutral-400">
                        <thead className="bg-black/40 text-neutral-500 sticky top-0 backdrop-blur-md"><tr><th className="px-4 py-2">Artist</th><th className="px-4 py-2">Followers</th><th className="px-4 py-2 text-right">Action</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredArtists.map((artist, i) => (
                                <tr key={i} className="hover:bg-white/5">
                                    <td className="px-4 py-2 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-neutral-800 overflow-hidden">{artist.image_url && <img src={artist.image_url} className="w-full h-full object-cover"/>}</div>
                                        <div className="flex flex-col"><span className="text-neutral-200 font-bold">{artist.originalName}</span>{!artist.inDB && <span className="text-[8px] text-red-400">Sync Needed</span>}</div>
                                    </td>
                                    <td className="px-4 py-2"><span className="text-pink-500 font-bold">{artist.followers}</span></td>
                                    <td className="px-4 py-2 text-right">{artist.id && <button onClick={() => handleDeleteDbArtist(artist.id)} className="hover:text-red-500"><Trash2 size={14}/></button>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      <div className="mt-10 p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-lg flex items-center gap-3">
         <ShieldAlert className="text-yellow-600 dark:text-yellow-500" size={20} />
         <p className="text-xs text-yellow-700 dark:text-yellow-500/80 font-mono">WARNING: Authorized personnel only. All actions are logged.</p>
      </div>
    </div>
  );
}

export default AdminDashboard;