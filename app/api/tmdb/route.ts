import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Manual aliases for known problematic titles
const TITLE_ALIASES: Record<string, string> = {
    "Ella": "Her",
    "The Office (EEUU)": "The Office US",
    "The Office US": "The Office"
};

interface TMDBItem {
    id: number;
    title?: string;
    name?: string;
    media_type: string;
    poster_path: string | null;
    overview: string;
    vote_average: number;
    popularity: number;
    release_date?: string;
    first_air_date?: string;
}

interface RawResult {
    id: number;
    title: string;
    type: string;
    imgUrl: string;
    synopsis: string;
    score: number;
    releaseYear: string;
    totalEp: string | number;
    popularity: number;
    matchScore: number;
    _mediaType: string;
}

function hasGoodMatch(results: TMDBItem[], query: string): boolean {
    if (!results || results.length === 0) return false;
    const lowerQuery = query.toLowerCase();
    return results.some(r => {
        const title = (r.title || r.name || '').toLowerCase();
        return title === lowerQuery || title.startsWith(lowerQuery);
    });
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const language = searchParams.get('language') || 'es-MX';

    if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    if (!TMDB_API_KEY) {
        return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 });
    }

    try {
        let cleanQuery = TITLE_ALIASES[query] || query;
        cleanQuery = cleanQuery.trim();

        console.log(`[TMDB API] Searching for: "${cleanQuery}"`);

        // STRATEGY 1: Primary search in specified language
        let url = `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanQuery)}&language=${language}&page=1&include_adult=false`;
        let response = await fetch(url);
        let data: { results?: TMDBItem[] } = await response.json();

        console.log(`[TMDB API] Strategy 1 (${language}): "${cleanQuery}" -> ${data.results?.length || 0} results`);

        // STRATEGY 2: If has ":", try replacing with space
        if (cleanQuery.includes(':')) {
            const noColonQuery = cleanQuery.replace(/:/g, ' ').trim();
            url = `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(noColonQuery)}&language=${language}&page=1&include_adult=false`;
            const res2 = await fetch(url);
            const d2: { results?: TMDBItem[] } = await res2.json();

            console.log(`[TMDB API] Strategy 2 (No Colon): "${noColonQuery}" -> ${d2.results?.length || 0} results`);

            if (hasGoodMatch(d2.results ?? [], noColonQuery) && !hasGoodMatch(data.results ?? [], cleanQuery)) {
                console.log(`[TMDB API] ✓ Using Strategy 2`);
                data = d2;
                cleanQuery = noColonQuery;
            } else if (!data.results || data.results.length === 0) {
                console.log(`[TMDB API] ✓ Using Strategy 2 (fallback)`);
                data = d2;
                cleanQuery = noColonQuery;
            }
        }

        // STRATEGY 3: English fallback
        if (language !== 'en-US' && (!data.results || data.results.length === 0)) {
            url = `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanQuery)}&language=en-US&page=1&include_adult=false`;
            const res3 = await fetch(url);
            const d3: { results?: TMDBItem[] } = await res3.json();
            console.log(`[TMDB API] Strategy 3 (English): "${cleanQuery}" -> ${d3.results?.length || 0} results`);
            if (d3.results && d3.results.length > 0) {
                data = d3;
            }
        }

        // STRATEGY 4: Truncate at colon as last resort
        if ((!data.results || data.results.length === 0) && cleanQuery.includes(':')) {
            const baseQuery = cleanQuery.split(':')[0].trim();
            url = `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(baseQuery)}&language=${language}&page=1&include_adult=false`;
            const res4 = await fetch(url);
            const d4: { results?: TMDBItem[] } = await res4.json();
            console.log(`[TMDB API] Strategy 4 (Truncate): "${baseQuery}" -> ${d4.results?.length || 0} results`);
            if (d4.results && d4.results.length > 0) {
                data = d4;
                cleanQuery = baseQuery;
            }
        }

        // Score and format base results
        const rawResults: RawResult[] = (data.results || []).map(item => {
            const title = item.title || item.name || '';
            const lowerTitle = title.toLowerCase();
            const lowerQuery = cleanQuery.toLowerCase();

            let score = item.popularity || 0;

            // Exact match boost
            if (lowerTitle === lowerQuery) score += 1000;
            else if (lowerTitle.startsWith(lowerQuery)) score += 500;
            else if (lowerTitle.includes(lowerQuery)) score += 200;

            // Popularity boost (balanced)
            score += (item.popularity || 0) * 0.5;

            return {
                id: item.id,
                title,
                type: item.media_type === 'movie' ? 'Pelicula' : item.media_type === 'tv' ? 'Serie' : 'Desconocido',
                imgUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
                synopsis: item.overview || '',
                score: item.vote_average || 0,
                releaseYear: (item.release_date || item.first_air_date || '').split('-')[0] || '',
                totalEp: item.media_type === 'tv' ? '??' : '1',
                popularity: item.popularity || 0,
                matchScore: score,
                _mediaType: item.media_type,
            };
        });

        // Sort by match score
        rawResults.sort((a, b) => b.matchScore - a.matchScore);

        // Fetch episode count for TV results (top 5 only to keep it fast)
        const tvResults = rawResults.filter(r => r._mediaType === 'tv').slice(0, 5);
        if (tvResults.length > 0) {
            await Promise.all(tvResults.map(async (r) => {
                try {
                    const detailRes = await fetch(
                        `${BASE_URL}/tv/${r.id}?api_key=${TMDB_API_KEY}&language=${language}`
                    );
                    if (detailRes.ok) {
                        const d: { number_of_episodes?: number } = await detailRes.json();
                        r.totalEp = d.number_of_episodes || '??';
                    }
                } catch { /* keep ?? */ }
            }));
        }

        // Strip internal _mediaType field
        const results = rawResults.map(({ _mediaType: _m, ...r }) => r);

        console.log(`[TMDB API] Final results: ${results.length}`);

        return NextResponse.json(results);

    } catch (error) {
        console.error('[TMDB API] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: 500 });
    }
}
