import type { SearchResult } from '@/types/anime'

// Client-side API wrapper for TMDB
export async function searchOnTMDB(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    try {
        const response = await fetch(`/api/tmdb?query=${encodeURIComponent(query)}&language=es-MX`);

        if (!response.ok) {
            throw new Error(`TMDB API returned ${response.status}`);
        }

        const data: SearchResult[] = await response.json();
        return data;
    } catch (error) {
        console.error('[TMDB Client] Error:', error);
        return [];
    }
}

// Client-side API wrapper for Jikan (MyAnimeList)
export async function searchAnimeOnMAL(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    try {
        const response = await fetch(`/api/mal?query=${encodeURIComponent(query)}`);

        if (!response.ok) {
            console.warn('[Jikan Client] API returned error, skipping anime search');
            return [];
        }

        const data: SearchResult[] = await response.json();
        return data;
    } catch (error) {
        console.error('[Jikan Client] Error:', error);
        return [];
    }
}

// Type-specific TMDB search for AddToVaultModal (Anime | Pelicula | Serie)
export async function searchTMDBByType(query: string, type: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    try {
        const response = await fetch(
            `/api/tmdb-typed?query=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`
        );

        if (!response.ok) {
            console.warn('[TMDB Typed] API returned error');
            return [];
        }

        return (await response.json()) as SearchResult[];
    } catch (error) {
        console.error('[TMDB Typed] Error:', error);
        return [];
    }
}

// Manga search via Jikan
export async function searchMangaOnMAL(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    try {
        const response = await fetch(`/api/manga?query=${encodeURIComponent(query)}`);

        if (!response.ok) {
            console.warn('[Manga Client] API returned error');
            return [];
        }

        return (await response.json()) as SearchResult[];
    } catch (error) {
        console.error('[Manga Client] Error:', error);
        return [];
    }
}
