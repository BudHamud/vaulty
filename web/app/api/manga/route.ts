import { NextRequest, NextResponse } from 'next/server';

const JIKAN_BASE = 'https://api.jikan.moe/v4';

interface JikanManga {
    title: string;
    images?: { jpg?: { large_image_url?: string; image_url?: string } };
    chapters?: number;
    score: number;
    synopsis: string;
    published?: { from?: string };
    authors?: { name: string }[];
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

    try {
        const res = await fetch(
            `${JIKAN_BASE}/manga?q=${encodeURIComponent(query)}&limit=8&sfw=true`,
            { headers: { Accept: 'application/json' } }
        );

        if (!res.ok) throw new Error(`Jikan returned ${res.status}`);

        const data: { data?: JikanManga[] } = await res.json();

        const results = (data.data || []).map(item => ({
            title: item.title,
            imgUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
            totalEp: item.chapters || '??',
            score: item.score || 0,
            synopsis: item.synopsis || '',
            releaseYear: item.published?.from ? new Date(item.published.from).getFullYear() : '????',
            author: item.authors?.map(a => a.name).join(', ') || '',
            studio: item.authors?.map(a => a.name).join(', ') || '',
            type: 'Manga',
        }));

        return NextResponse.json(results);
    } catch (error) {
        console.error('[Manga API] Error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
