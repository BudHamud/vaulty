// hooks/useUserPreferences.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export const useUserPreferences = (user) => {
  const [viewMode, setViewMode] = useState("list");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPrefs = async () => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error(error);
      }

      if (data) {
        setViewMode(data.view_mode);
      } else {
        // crear prefs por primera vez
        await supabase.from("user_preferences").insert({
          user_id: user.id,
          view_mode: "list",
        });
      }

      setLoading(false);
    };

    fetchPrefs();
  }, [user]);

  const updateViewMode = async (mode) => {
    setViewMode(mode);

    await supabase
      .from("user_preferences")
      .update({ view_mode: mode, updated_at: new Date() })
      .eq("user_id", user.id);
  };

  return {
    viewMode,
    setViewMode,
    updateViewMode,
    loading,
  };
};
