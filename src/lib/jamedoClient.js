const JAMENDO_CLIENT_ID = "3501caaa";
const JAMENDO_API_BASE_URL = "https://api.jamendo.com/v3.0";

export const getJamendoTracks = async (params) => {
  const url = new URL(JAMENDO_API_BASE_URL + "/tracks");
  url.searchParams.append("client_id", JAMENDO_CLIENT_ID);
  Object.keys(params).forEach((key) =>
    url.searchParams.append(key, params[key])
  );

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching from Jamendo API:", error);
    return null;
  }
};
