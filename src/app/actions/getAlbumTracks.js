const getAlbumTracks = async (albumId) => {
  const CLIENT_ID = '3501caaa';
  try {
    const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&album_id=${albumId}&include=musicinfo&audioformat=mp32`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.results) return [];

    return data.results.map((track) => ({
      id: track.id,
      title: track.name,
      author: track.artist_name,
      song_path: track.audio,
      image_path: track.image || track.album_image,
      duration: track.duration, // Cần format nếu muốn
      user_id: 'jamendo_api'
    }));
  } catch (error) {
    return [];
  }
};
export default getAlbumTracks;