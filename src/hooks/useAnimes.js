import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { mapAnimeFromDB, mapAnimeToDB } from "../lib/mappers/anime.mapper";

export function useAnimes(user) {
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnimes = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("animes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setAnimes(data.map(mapAnimeFromDB));
    setLoading(false);
  };

  useEffect(() => {
    fetchAnimes();
  }, [user]);

  // 🔹 ACCIONES
  const createAnime = async (anime) => {
    const payload = mapAnimeToDB(anime);
    const { data, error } = await supabase
      .from("animes")
      .insert({ ...payload, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setAnimes((prev) => [mapAnimeFromDB(data), ...prev]);
  };

  const updateAnime = async (id, anime) => {
    const payload = mapAnimeToDB(anime);
    const { data, error } = await supabase
      .from("animes")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    setAnimes((prev) => prev.map((a) => (a.id === id ? mapAnimeFromDB(data) : a)));
  };

  // 🗑️ BORRAR ANIME
  const deleteAnime = async (id) => {
    const originalAnimes = [...animes];
    setAnimes((prev) => prev.filter((a) => a.id !== id));

    const { error } = await supabase.from("animes").delete().eq("id", id);

    if (error) {
      setAnimes(originalAnimes);
      throw error;
    }
  };

  // 🧨 BORRAR TODO
  const deleteAllAnimes = async () => {
    if (!user) return;
    const originalAnimes = [...animes];
    setAnimes([]); // Optimistic update

    const { error } = await supabase
      .from("animes")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      setAnimes(originalAnimes);
      throw error;
    }
  };

  const toggleFocus = async (id, currentStatus) => {
    const { error } = await supabase
      .from("animes")
      .update({ is_focus: !currentStatus })
      .eq("id", id);

    if (error) throw error;

    setAnimes((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isFocus: !currentStatus } : a))
    );
  };

  return {
    animes,
    loading,
    createAnime,
    updateAnime,
    deleteAnime,
    deleteAllAnimes,
    toggleFocus,
    // refetch: fetchAnimes
  };
}