import { getJamendoTracks } from "@/lib/jamedoClient"; // Mượn client ID từ đây nếu cần hoặc khai báo lại

const getAlbums = async (artistName) => {
  const CLIENT_ID = '3501caaa'; // Dùng ID của bạn
  
  try {
    // Gọi API albums
    const url = `https://api.jamendo.com/v3.0/albums/?client_id=${CLIENT_ID}&format=jsonpretty&artist_name=${encodeURIComponent(artistName)}&imagesize=600&order=releasedate_desc`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        return [];
    }

    return data.results.map((album) => ({
      id: album.id,
      name: album.name,
      artist: album.artist_name,
      release_date: album.releasedate,
      image: album.image, // Ảnh bìa album
      zip: album.zip // Link tải (nếu cần)
    }));

  } catch (error) {
    console.error("GetAlbums Error:", error);
    return [];
  }
};

export default getAlbums;