export const searchAnimeOnMAL = async (query) => {
  if (query.length < 3) return [];
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=5`);
    const data = await response.json();
    return data.data.map(item => ({
      title: item.title,
      imgUrl: item.images.jpg.large_image_url,
      totalEp: item.episodes || '??',
      score: item.score,
      synopsis: item.synopsis,
      // Capturamos el año de estreno
      releaseYear: item.year || (item.aired?.from ? item.aired.from.split('-')[0] : '????')
    }));
  } catch (error) {
    console.error("Error buscando anime:", error);
    return [];
  }
};