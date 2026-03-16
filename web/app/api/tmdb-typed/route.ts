import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

interface TMDBImages {
    posters?: { iso_639_1: string; file_path: string }[];
}

interface PosterUrls {
    imgUrlEs: string;
    imgUrlEn: string;
}

async function fetchTMDB<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}&api_key=${TMDB_API_KEY}`);
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    return res.json() as Promise<T>;
}

async function getBothPosters(mediaType: string, id: number, fallback: string): Promise<PosterUrls> {
    try {
        const images = await fetchTMDB<TMDBImages>(`/${mediaType}/${id}/images?include_image_language=es,en,null`);
        const posters = images.posters || [];
        const esPoster = posters.find(p => p.iso_639_1 === 'es')?.file_path;
        const enPoster = posters.find(p => p.iso_639_1 === 'en')?.file_path;
        return {
            imgUrlEs: esPoster ? `https://image.tmdb.org/t/p/w500${esPoster}` : fallback,
            imgUrlEn: enPoster ? `https://image.tmdb.org/t/p/w500${enPoster}` : fallback,
        };
    } catch {
        return { imgUrlEs: fallback, imgUrlEn: fallback };
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const type = searchParams.get('type') || 'Anime'; // Anime | Pelicula | Serie

    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });
    if (!TMDB_API_KEY) return NextResponse.json({ error: 'TMDB key not configured' }, { status: 500 });

    const clean = query.split('(')[0].trim();

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let items: any[] = [];

        if (type === 'Pelicula') {
            // ── Movies ─────────────────────────────────────────────────────────
            const data = await fetchTMDB<{ results?: any[] }>(
                `/search/movie?query=${encodeURIComponent(clean)}&language=es-MX&include_adult=false`
            );
            const moviePool = (data.results || []).slice(0, 8);
            items = await Promise.all(moviePool.map(async (item: any) => {
                const fallback = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '';
                const { imgUrlEs, imgUrlEn } = await getBothPosters('movie', item.id, fallback);
                return {
                    title: item.title,
                    imgUrl: imgUrlEs || imgUrlEn || fallback,
                    imgUrlEs,
                    imgUrlEn,
                    totalEp: 1,
                    score: item.vote_average ? item.vote_average.toFixed(1) : 0,
                    synopsis: item.overview || '',
                    releaseYear: item.release_date?.split('-')[0] || '????',
                    type: 'Pelicula',
                    tmdbStatus: 'Terminado',
                    studio: '',
                };
            }));

        } else if (type === 'Serie') {
            // ── TV Shows (non-anime) ────────────────────────────────────────────
            const data = await fetchTMDB<{ results?: any[] }>(
                `/search/tv?query=${encodeURIComponent(clean)}&language=es-MX&include_adult=false`
            );
            const filtered = (data.results || [])
                .filter((i: any) => {
                    const isAnim = i.genre_ids?.includes(16);
                    const isJP = i.origin_country?.includes('JP') || i.original_language === 'ja';
                    return !(isAnim && isJP);
                })
                .slice(0, 8);

            items = await Promise.all(filtered.map(async (item: any) => {
                let totalEp: string | number = '??';
                let tmdbStatus = 'Viendo';
                const fallback = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '';
                try {
                    const d = await fetchTMDB<any>(`/tv/${item.id}?language=es-MX`);
                    totalEp = d.number_of_episodes || '??';
                    tmdbStatus = d.status === 'Ended' ? 'Terminado' : 'Viendo';
                } catch { /* ignore */ }
                const { imgUrlEs, imgUrlEn } = await getBothPosters('tv', item.id, fallback);
                return {
                    title: item.name,
                    imgUrl: imgUrlEs || imgUrlEn || fallback,
                    imgUrlEs,
                    imgUrlEn,
                    totalEp,
                    score: item.vote_average ? item.vote_average.toFixed(1) : 0,
                    synopsis: item.overview || '',
                    releaseYear: item.first_air_date?.split('-')[0] || '????',
                    type: 'Serie',
                    tmdbStatus,
                    studio: '',
                };
            }));

        } else {
            // ── Anime ───────────────────────────────────────────────────────────
            // Try English first (better romaji coverage)
            let data = await fetchTMDB<{ results?: any[] }>(
                `/search/tv?query=${encodeURIComponent(clean)}&language=en-US&include_adult=false`
            );
            // Fallback to es-MX
            if (!data.results?.length) {
                data = await fetchTMDB<{ results?: any[] }>(
                    `/search/tv?query=${encodeURIComponent(clean)}&language=es-MX&include_adult=false`
                );
            }

            const animeFiltered = (data.results || []).filter((i: any) => {
                const isAnim = i.genre_ids?.includes(16);
                const isJP = i.origin_country?.includes('JP') || i.original_language === 'ja';
                return isAnim || isJP;
            });
            const pool = (animeFiltered.length > 0 ? animeFiltered : data.results || []).slice(0, 8);

            items = await Promise.all(pool.map(async (item: any) => {
                let totalEp: string | number = '??';
                let tmdbStatus = 'Viendo';
                let studio = '';
                const fallback = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '';
                try {
                    const d = await fetchTMDB<any>(`/tv/${item.id}?language=en-US`);
                    totalEp = d.number_of_episodes || '??';
                    tmdbStatus = d.status === 'Ended' ? 'Terminado' : 'Viendo';
                    studio = d.networks?.[0]?.name || d.production_companies?.[0]?.name || '';
                } catch { /* ignore */ }
                const { imgUrlEs, imgUrlEn } = await getBothPosters('tv', item.id, fallback);
                return {
                    title: item.name,
                    imgUrl: imgUrlEs || imgUrlEn || fallback,
                    imgUrlEs,
                    imgUrlEn,
                    totalEp,
                    score: item.vote_average ? item.vote_average.toFixed(1) : 0,
                    synopsis: item.overview || '',
                    releaseYear: item.first_air_date?.split('-')[0] || '????',
                    type: 'Anime',
                    tmdbStatus,
                    studio,
                };
            }));
        }

        return NextResponse.json(items);
    } catch (error) {
        console.error('[TMDB Typed] Error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
