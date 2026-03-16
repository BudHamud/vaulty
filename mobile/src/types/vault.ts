import type { Anime, AnimePayload, AnimeRow, AnimeStatus, AnimeType, SearchResult, UserProfile } from "shared";

export type VaultStatus = AnimeStatus;
export type VaultType = Exclude<AnimeType, "Manga">;
export type VaultItem = Anime;
export type VaultRow = AnimeRow;
export type VaultPayload = AnimePayload;
export type SharedSearchResult = SearchResult;
export type { UserProfile };

export interface MediaSearchResult {
  id?: number;
  title: string;
  type: VaultType;
  imgUrl: string;
  synopsis: string;
  score: number;
  releaseYear: string | number;
  totalEp: string | number;
  tmdbStatus?: VaultStatus;
}

