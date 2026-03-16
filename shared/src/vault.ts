export type AnimeStatus = "Viendo" | "Terminado" | "Pendiente";
export type AnimeType = "Anime" | "Serie" | "Pelicula" | "Manga";
export type ViewMode = "list" | "grid";

export interface Anime {
  id: string;
  title: string;
  status: AnimeStatus;
  type: AnimeType;
  description: string;
  imgUrl: string;
  startDate: string | null;
  finishDate: string | null;
  isFocus: boolean;
  currentEp: number;
  totalEp: string | number | null;
  createdAt?: string;
  score?: number;
  releaseYear?: string;
}

export interface AnimeRow {
  id: string;
  user_id: string;
  title: string;
  status: AnimeStatus;
  type: AnimeType;
  description: string;
  img_url: string;
  start_date: string | null;
  finish_date: string | null;
  is_focus: boolean;
  current_ep: number;
  total_ep: string | number | null;
  created_at: string;
  score?: number;
  release_year?: string;
}

export interface AnimePayload {
  title: string;
  status: AnimeStatus;
  type: AnimeType;
  description: string;
  img_url: string;
  start_date: string | null;
  finish_date: string | null;
  is_focus: boolean;
  current_ep: number;
  total_ep: string | number | null;
}

export interface SearchResult {
  id?: number;
  title: string;
  type: AnimeType;
  imgUrl: string;
  imgUrlEs?: string;
  imgUrlEn?: string;
  synopsis: string;
  score: number;
  releaseYear: string | number;
  totalEp: string | number;
  studio?: string;
  tmdbStatus?: string;
}

export interface VaultStats {
  total: number;
  completed: number;
  watching: number;
  eps: number;
}

export interface UserProfile {
  username: string;
  email: string;
}

const toNullableDate = (value: string | null | undefined): string | null =>
  value && value.trim() !== "" ? value : null;

export const mapAnimeToDB = (anime: Omit<Anime, "id"> | Anime): AnimePayload => ({
  title: anime.title,
  status: anime.status,
  type: anime.type || "Anime",
  description: anime.description,
  img_url: anime.imgUrl,
  start_date: toNullableDate(anime.startDate),
  finish_date: toNullableDate(anime.finishDate),
  is_focus: anime.isFocus,
  current_ep: anime.currentEp,
  total_ep: anime.totalEp,
});

export const mapAnimeFromDB = (row: AnimeRow): Anime => ({
  id: row.id,
  title: row.title,
  status: row.status,
  type: row.type || "Anime",
  description: row.description,
  imgUrl: row.img_url,
  startDate: row.start_date,
  finishDate: row.finish_date,
  isFocus: row.is_focus,
  currentEp: row.current_ep,
  totalEp: row.total_ep,
  createdAt: row.created_at,
  score: row.score,
  releaseYear: row.release_year,
});
