
export const searchAnimeOnCrunchyroll = async (query) => {
    try {
        const response = await fetch(`/api/crunchyroll?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to fetch from Crunchyroll API');
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error("Error searching Crunchyroll:", error);
        return [];
    }
};

export const getAnimeDetails = async (url) => {
    try {
        const response = await fetch(`/api/crunchyroll?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error('Failed to fetch details from Crunchyroll API');
        const data = await response.json();
        return data.details || null;
    } catch (error) {
        console.error("Error getting Crunchyroll details:", error);
        return null;
    }
};
