import { getJamendoTracks } from "@/lib/jamedoClient";

const formatDuration = (seconds) => {
    if (!seconds) return "00:00";
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

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
  let artistsFound = []; // Mảng chứa kết quả tìm kiếm nghệ sĩ

  try {
      // --- TRƯỜNG HỢP 1: TÌM CHÍNH XÁC NGHỆ SĨ (Trang ArtistPage) ---
      if (artist) {
          console.log(`>>> Fetching specific artist: ${artist}`);
          rawTracks = await getJamendoTracks({ 
              ...baseParams, 
              artist_name: artist 
          });
      }
      // --- TRƯỜNG HỢP 2: TÌM KIẾM TỔNG HỢP (Thanh Search) ---
      else if (title) {
          // Gọi song song: Tìm theo tên bài + Tìm theo tên tác giả
          const [byNameSearch, byArtistName] = await Promise.all([
              getJamendoTracks({ ...baseParams, namesearch: title }),
              getJamendoTracks({ ...baseParams, artist_name: title })
          ]);

          // 1. XỬ LÝ TÌM NGHỆ SĨ (Logic mới)
          // Nếu tìm thấy bài hát khớp tên tác giả, ta lấy thông tin tác giả từ bài hát đó
          if (byArtistName && byArtistName.length > 0) {
              // Lấy đại diện bài đầu tiên để lấy info tác giả
              const rep = byArtistName[0];
              artistsFound.push({
                  id: rep.artist_id,
                  name: rep.artist_name,
                  image: rep.image || rep.album_image || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop", 
              });
          }

          // 2. XỬ LÝ TÌM BÀI HÁT (Gộp và lọc trùng)
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

      if (!rawTracks) rawTracks = [];

      // Map dữ liệu bài hát
      const mappedSongs = rawTracks.map((track) => ({
        id: track.id,
        title: track.name,
        author: track.artist_name,
        song_path: track.audio,
        image_path: track.image || track.album_image || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        duration: formatDuration(track.duration),
        lyrics: track.musicinfo?.lyrics || null,
        user_id: 'jamendo_api'
      }));

      // --- QUAN TRỌNG: TRẢ VỀ OBJECT { songs, artists } ---
      return { 
          songs: mappedSongs, 
          artists: artistsFound 
      };

  } catch (error) {
      console.error("GetSongs Error:", error);
      return { songs: [], artists: [] };
  }
};

export default getSongs;