import type { MediaSearchResult, VaultType } from "../types/vault";

const JIKAN_API_BASE = "https://api.jikan.moe/v4";
const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const tmdbApiKey = process.env.EXPO_PUBLIC_TMDB_API_KEY;

interface JikanAnime {
  mal_id: number;
  title: string;
  images?: { jpg?: { large_image_url?: string; image_url?: string } };
  synopsis?: string;
  score?: number;
  year?: number;
  aired?: { from?: string };
  episodes?: number;
}

function mapAnimeResult(item: JikanAnime): MediaSearchResult {
  return {
    id: item.mal_id,
    title: item.title,
    type: "Anime",
    imgUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || "",
    synopsis: item.synopsis || "",
    score: item.score || 0,
    releaseYear: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : ""),
    totalEp: item.episodes || "??",
  };
}

function mapTmdbType(type: VaultType): "movie" | "tv" {
  return type === "Pelicula" ? "movie" : "tv";
}

function mapTmdbStatus(status?: string): "Viendo" | "Terminado" {
  return status === "Ended" ? "Terminado" : "Viendo";
}

export async function searchMedia(query: string, type: VaultType): Promise<MediaSearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return [];
  }

  if (type === "Anime") {
    const response = await fetch(`${JIKAN_API_BASE}/anime?q=${encodeURIComponent(cleanQuery)}&limit=10&sfw=true`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Jikan returned ${response.status}`);
    }

    const data: { data?: JikanAnime[] } = await response.json();
    return (data.data || []).map(mapAnimeResult);
  }

  if (!tmdbApiKey) {
    throw new Error("Missing EXPO_PUBLIC_TMDB_API_KEY for movie/series metadata search.");
  }

  const mediaType = mapTmdbType(type);
  const response = await fetch(
    `${TMDB_API_BASE}/search/${mediaType}?api_key=${tmdbApiKey}&query=${encodeURIComponent(cleanQuery)}&language=es-MX&include_adult=false&page=1`
  );

  if (!response.ok) {
    throw new Error(`TMDB returned ${response.status}`);
  }

  const data: { results?: Array<Record<string, unknown>> } = await response.json();

  return (data.results || []).slice(0, 10).map((item) => {
    const titleValue = (type === "Pelicula" ? item.title : item.name) as string | undefined;
    const dateValue = (type === "Pelicula" ? item.release_date : item.first_air_date) as string | undefined;
    const posterPath = item.poster_path as string | undefined;
    const totalEp = type === "Pelicula" ? 1 : "??";

    return {
      id: item.id as number | undefined,
      title: titleValue || cleanQuery,
      type,
      imgUrl: posterPath ? `${TMDB_IMAGE_BASE}${posterPath}` : "",
      synopsis: (item.overview as string | undefined) || "",
      score: Number(item.vote_average || 0),
      releaseYear: dateValue ? dateValue.split("-")[0] : "",
      totalEp,
      tmdbStatus: mapTmdbStatus(item.status as string | undefined),
    } satisfies MediaSearchResult;
  });
}
