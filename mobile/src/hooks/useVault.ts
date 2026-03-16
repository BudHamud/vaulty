import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { VaultItem, VaultPayload, VaultRow } from "../types/vault";
import { mapAnimeFromDB, mapAnimeToDB } from "shared";

export function useVault(user: User | null) {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const fetchItems = async () => {
      const { data, error } = await supabase
        .from("animes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else if (data) {
        setItems((data as VaultRow[]).map((row) => mapAnimeFromDB(row) as VaultItem));
      }

      setLoading(false);
    };

    fetchItems();
  }, [user]);

  const stats = useMemo(() => ({
    total: items.length,
    completed: items.filter((item) => item.status === "Terminado").length,
    watching: items.filter((item) => item.status === "Viendo").length,
    episodes: items.reduce((total, item) => total + item.currentEp, 0),
  }), [items]);

  const addItem = async (item: Omit<VaultItem, "id">) => {
    if (!user) {
      throw new Error("No authenticated user");
    }

    const { data, error } = await supabase
      .from("animes")
      .insert({ ...(mapAnimeToDB(item) as VaultPayload), user_id: user.id })
      .select()
      .single();

    if (error) {
      throw error;
    }

    setItems((current) => [mapAnimeFromDB(data as VaultRow) as VaultItem, ...current]);
  };

  const updateItem = async (id: string, item: Omit<VaultItem, "id">) => {
    const { data, error } = await supabase
      .from("animes")
      .update(mapAnimeToDB(item) as VaultPayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    setItems((current) => current.map((entry) => (entry.id === id ? (mapAnimeFromDB(data as VaultRow) as VaultItem) : entry)));
  };

  const deleteItem = async (id: string) => {
    const snapshot = items;
    setItems((current) => current.filter((item) => item.id !== id));

    const { error } = await supabase.from("animes").delete().eq("id", id);
    if (error) {
      setItems(snapshot);
      throw error;
    }
  };

  const deleteAllItems = async () => {
    if (!user) {
      throw new Error("No authenticated user");
    }

    const snapshot = items;
    setItems([]);

    const { error } = await supabase.from("animes").delete().eq("user_id", user.id);
    if (error) {
      setItems(snapshot);
      throw error;
    }
  };

  return {
    items,
    loading,
    stats,
    addItem,
    updateItem,
    deleteItem,
    deleteAllItems,
  };
}
