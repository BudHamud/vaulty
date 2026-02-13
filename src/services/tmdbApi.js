// TMDB API Integration
// You need an API Key. For development, we can use a placeholder or ask the user.
// Using a standard free key pattern or asking user to provide one in env would be best.
// For this demo, I'll set up the structure.

const BASE_URL = "https://api.themoviedb.org/3";

export const searchOnTMDB = async (query, userApiKey) => {
    if (!query || query.length < 2) return [];

    // Use provided key or fallback to a default (if any) - currently no default fallback for prod
    const apiKey = userApiKey || localStorage.getItem("tmdb_api_key");
    if (!apiKey) throw new Error("No API Key provided");

    try {
        // 1. Remove everything inside and after parentheses for cleaner search
        // "The Office (EEUU)" -> "The Office"
        let cleanQuery = query.split('(')[0].trim();

        // MANUAL ALIAS MAP: Fix known problematic titles
        const aliases = {
            "ella": "Her",
        };

        const lowerQ = cleanQuery.toLowerCase();
        if (aliases[lowerQ]) {
            cleanQuery = aliases[lowerQ];
        }


        // Helper to check if we have a "Good" match (Exact or very close)
        const hasGoodMatch = (results, query) => {
            if (!results || results.length === 0) return false;
            const q = query.toLowerCase();
            return results.some(r => {
                const title = (r.media_type === 'movie' ? r.title : r.name).toLowerCase();
                return title === q; // Strict exact match requirement
            });
        };

        let data = { results: [] };
        let url;

        // STRATEGY 1: Search in Spanish (es-MX) with full cleaned query
        // "Closer: Llevados por el Deseo" -> Try exact first
        url = `${BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(cleanQuery)}&language=es-MX&page=1&include_adult=false`;
        let response = await fetch(url);
        if (response.ok) data = await response.json();
        else if (response.status === 401) throw new Error("TMDB Key Invalid");

        console.log(`[TMDB] Strategy 1 (Exact ES): "${cleanQuery}" -> ${data.results?.length || 0} results`);

        // STRATEGY 2: If has ":", ALWAYS try replacing ":" with space (Better for "Closer: Llevados...")
        // This runs even if we got results, because the colon version might be better
        if (cleanQuery.includes(':')) {
            const noColonQuery = cleanQuery.replace(/:/g, ' ').trim();
            url = `${BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(noColonQuery)}&language=es-MX&page=1&include_adult=false`;
            const res2 = await fetch(url);
            if (res2.ok) {
                const d2 = await res2.json();
                console.log(`[TMDB] Strategy 2 (No Colon ES): "${noColonQuery}" -> ${d2.results?.length || 0} results`);

                // Use this result if:
                // 1. It has an exact match and original didn't, OR
                // 2. Original had no results at all
                if (hasGoodMatch(d2.results, noColonQuery) && !hasGoodMatch(data.results, cleanQuery)) {
                    console.log(`[TMDB] ✓ Using Strategy 2 (found exact match)`);
                    data = d2;
                    cleanQuery = noColonQuery; // Update for scoring
                } else if (!data.results || data.results.length === 0) {
                    console.log(`[TMDB] ✓ Using Strategy 2 (fallback, no results from Strategy 1)`);
                    data = d2;
                    cleanQuery = noColonQuery;
                }
            }
        }

        // STRATEGY 3: English fallback
        if (!data.results || data.results.length === 0) {
            url = `${BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(cleanQuery)}&language=en-US&page=1&include_adult=false`;
            const res3 = await fetch(url);
            if (res3.ok) {
                const d3 = await res3.json();
                console.log(`[TMDB] Strategy 3 (English): "${cleanQuery}" -> ${d3.results?.length || 0} results`);
                if (d3.results && d3.results.length > 0) {
                    console.log(`[TMDB] ✓ Using Strategy 3`);
                    data = d3;
                }
            }
        }

        // STRATEGY 4: Truncate after ":" (Last resort)
        if ((!data.results || data.results.length === 0) && cleanQuery.includes(':')) {
            const shortQuery = cleanQuery.split(':')[0].trim();
            url = `${BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(shortQuery)}&language=es-MX&page=1&include_adult=false`;
            const res4 = await fetch(url);
            if (res4.ok) {
                const d4 = await res4.json();
                console.log(`[TMDB] Strategy 4 (Truncate): "${shortQuery}" -> ${d4.results?.length || 0} results`);
                if (d4.results && d4.results.length > 0) {
                    console.log(`[TMDB] ✓ Using Strategy 4 (last resort)`);
                    data = d4;
                }
            }
        }

        if (!data.results) return [];

        console.log(`[TMDB RAW] Query: "${cleanQuery}" Found: ${data.results.length} items`);

        // Filter and sort by Combined Score (Relevance + Popularity)
        const results = data.results
            .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
            .map(item => {
                const itemTitle = (item.media_type === 'movie' ? item.title : item.name).toLowerCase();
                const queryLower = cleanQuery.toLowerCase();

                let matchScore = 0;
                if (itemTitle === queryLower) matchScore = 50;
                else if (itemTitle.startsWith(queryLower)) matchScore = 20;
                else if (cleanQuery.includes(':') && itemTitle.startsWith(cleanQuery.split(':')[0].trim().toLowerCase())) matchScore = 15;

                return {
                    ...item,
                    combined: matchScore + (item.popularity || 0)
                };
            })
            .sort((a, b) => b.combined - a.combined)
            .slice(0, 20);

        // Fetch details for TV shows to get episode count
        const detailedResults = await Promise.all(results.map(async (item) => {
            const isMovie = item.media_type === 'movie';
            let totalEp = isMovie ? 1 : "??";
            let status = "Terminado"; // Default assumption

            if (!isMovie) {
                try {
                    const detailRes = await fetch(`${BASE_URL}/tv/${item.id}?api_key=${apiKey}`);
                    if (detailRes.ok) {
                        const detailData = await detailRes.json();
                        totalEp = detailData.number_of_episodes || "??";
                        status = detailData.status === "Ended" ? "Terminado" : "Viendo";
                    }
                } catch (e) {
                    console.warn("Failed to fetch TV details", e);
                }
            }

            // Detect Type (Anime vs Serie vs Pelicula)
            let type = isMovie ? 'Pelicula' : 'Serie';
            const isAnimation = item.genre_ids?.includes(16);
            const isJP = item.origin_country?.includes('JP') || (item.original_language === 'ja');

            if (isAnimation && isJP) {
                type = 'Anime';
            }

            return {
                title: isMovie ? item.title : item.name,
                imgUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
                totalEp: totalEp,
                score: item.vote_average ? item.vote_average.toFixed(1) : 0,
                synopsis: item.overview,
                releaseYear: (isMovie ? item.release_date : item.first_air_date)?.split('-')[0] || "????",
                type: type,
                tmdbStatus: status
            };
        }));

        return detailedResults;
    } catch (error) {
        console.error("Error searching TMDB:", error);
        return [];
    }
};
