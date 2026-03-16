import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { mapAnimeFromDB, mapAnimeToDB } from "@/lib/mappers/anime.mapper";
import type { Anime, AnimeRow } from "@/types/anime";
import type { User } from "@supabase/supabase-js";

export function useAnimes(user: User | null) {
    const [animes, setAnimes] = useState<Anime[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAnimes = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from("animes")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (!error && data) setAnimes((data as AnimeRow[]).map(mapAnimeFromDB));
        setLoading(false);
    };

    useEffect(() => {
        fetchAnimes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // 🔹 ACCIONES
    const createAnime = async (anime: Anime): Promise<void> => {
        const payload = mapAnimeToDB(anime);
        const { data, error } = await supabase
            .from("animes")
            .insert({ ...payload, user_id: user!.id })
            .select()
            .single();

        if (error) throw error;
        setAnimes((prev) => [mapAnimeFromDB(data as AnimeRow), ...prev]);
    };

    const updateAnime = async (id: string, anime: Anime): Promise<void> => {
        const payload = mapAnimeToDB(anime);
        const { data, error } = await supabase
            .from("animes")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        setAnimes((prev) =>
            prev.map((a) => (a.id === id ? mapAnimeFromDB(data as AnimeRow) : a))
        );
    };

    // 🗑️ BORRAR ANIME
    const deleteAnime = async (id: string): Promise<void> => {
        const originalAnimes = [...animes];
        setAnimes((prev) => prev.filter((a) => a.id !== id));

        const { error } = await supabase.from("animes").delete().eq("id", id);

        if (error) {
            setAnimes(originalAnimes);
            throw error;
        }
    };

    // 🧨 BORRAR TODO
    const deleteAllAnimes = async (): Promise<void> => {
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

    const toggleFocus = async (id: string, currentStatus: boolean): Promise<void> => {
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
    };
}
