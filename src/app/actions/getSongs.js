import { getJamendoTracks } from "@/lib/jamedoClient";

const formatDuration = (seconds) => {
    if (!seconds) return "00:00";
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

// Thêm tham số 'artist' vào hàm
const getSongs = async ({ title, artist, tag, boost, limit = 20 } = {}) => {
  
  const baseParams = {
    limit: limit, 
    format: "jsonpretty",
    include: "musicinfo+lyrics",
    audioformat: "mp32",
  };

  if (tag) baseParams.tags = tag;
  if (boost) baseParams.boost = boost;

  let rawTracks = [];

  try {
      // --- TRƯỜNG HỢP 1: TÌM CHÍNH XÁC NGHỆ SĨ (Dùng cho trang ArtistPage) ---
      if (artist) {
          console.log(`>>> Fetching specific artist: ${artist}`);
          // Chỉ gọi API filter theo artist_name -> Chính xác 100%
          rawTracks = await getJamendoTracks({ 
              ...baseParams, 
              artist_name: artist 
          });
      }
      // --- TRƯỜNG HỢP 2: TÌM KIẾM TỔNG HỢP (Dùng cho SearchBar) ---
      else if (title) {
          const [byNameSearch, byArtistName] = await Promise.all([
              getJamendoTracks({ ...baseParams, namesearch: title }),
              getJamendoTracks({ ...baseParams, artist_name: title })
          ]);

          const combined = [...(byNameSearch || []), ...(byArtistName || [])];
          const uniqueMap = new Map();
          combined.forEach(track => {
              if (!uniqueMap.has(track.id)) uniqueMap.set(track.id, track);
          });
          rawTracks = Array.from(uniqueMap.values());

      } 
      // --- TRƯỜNG HỢP 3: MẶC ĐỊNH (Tag, Boost...) ---
      else {
          if (!tag && !boost) baseParams.boost = "popularity_month";
          rawTracks = await getJamendoTracks(baseParams);
      }

      if (!rawTracks || rawTracks.length === 0) {
        return [];
      }

      return rawTracks.map((track) => ({
        id: track.id,
        title: track.name,
        author: track.artist_name,
        song_path: track.audio,
        image_path: track.image || track.album_image || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        duration: formatDuration(track.duration),
        lyrics: track.musicinfo?.lyrics || null,
        user_id: 'jamendo_api'
      }));

  } catch (error) {
      console.error("GetSongs Error:", error);
      return [];
  }
};

export default getSongs;