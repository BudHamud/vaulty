import { NextRequest, NextResponse } from 'next/server';

// Jikan API - Free public API for MyAnimeList (no API key needed!)
const JIKAN_API_BASE = 'https://api.jikan.moe/v4';

interface JikanAnime {
    mal_id: number;
    title: string;
    images?: { jpg?: { large_image_url?: string; image_url?: string } };
    synopsis: string;
    score: number;
    year?: number;
    aired?: { from?: string };
    episodes?: number;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    try {
        const url = `${JIKAN_API_BASE}/anime?q=${encodeURIComponent(query)}&limit=10&sfw=true`;

        console.log(`[Jikan API] Searching for: "${query}"`);

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Jikan API returned ${response.status}`);
        }

        const data: { data?: JikanAnime[] } = await response.json();

        const results = (data.data || []).map(item => ({
            id: item.mal_id,
            title: item.title,
            type: 'Anime',
            imgUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
            synopsis: item.synopsis || '',
            score: item.score || 0,
            releaseYear: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : ''),
            totalEp: item.episodes || '??'
        }));

        console.log(`[Jikan API] Found ${results.length} results for "${query}"`);

        return NextResponse.json(results);

    } catch (error) {
        console.error('[Jikan API] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch from Jikan API' }, { status: 500 });
    }
}
