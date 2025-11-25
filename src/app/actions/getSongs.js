import { getJamendoTracks } from "@/lib/jamedoClient";

const getSongs = async () => {
  console.log("Fetching songs from Jamendo...");
  const tracks = await getJamendoTracks({
    limit: 200,
    format: "json",
  });

  if (!tracks || tracks.length === 0) {
    console.log("No tracks found from Jamendo.");
    return [];
  }

  console.log(`Found ${tracks.length} tracks.`);

  return tracks.map((track) => ({
    id: track.id,
    title: track.name,
    author: track.artist_name,
    song_path: track.audio,
    image_path: track.image,
  }));
};

export default getSongs;