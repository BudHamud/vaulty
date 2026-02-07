const toNullableDate = (value) =>
  value && value.trim() !== "" ? value : null;

export const mapAnimeToDB = (anime) => ({
  title: anime.title,
  status: anime.status,
  description: anime.description,
  img_url: anime.imgUrl,
  start_date: toNullableDate(anime.startDate),
  finish_date: toNullableDate(anime.finishDate),
  is_focus: anime.isFocus,
  current_ep: anime.currentEp,
  total_ep: anime.totalEp,
});

export const mapAnimeFromDB = (row) => ({
  id: row.id,
  title: row.title,
  status: row.status,
  description: row.description,
  imgUrl: row.img_url,
  startDate: row.start_date,
  finishDate: row.finish_date,
  isFocus: row.is_focus,
  currentEp: row.current_ep,
  totalEp: row.total_ep,
  createdAt: row.created_at,
});