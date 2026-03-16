// hooks/useUserPreferences.ts
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { ViewMode } from "@/types/anime";
import type { User } from "@supabase/supabase-js";

export const useUserPreferences = (
    user: User | null
): {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    updateViewMode: (mode: ViewMode) => Promise<void>;
    loading: boolean;
} => {
    const [viewMode, setViewMode] = useState<ViewMode>("list");
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
                .maybeSingle();

            if (error) {
                console.error(error);
            }

            if (data) {
                setViewMode((data as { view_mode: ViewMode }).view_mode);
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

    const updateViewMode = async (mode: ViewMode): Promise<void> => {
        setViewMode(mode);

        await supabase
            .from("user_preferences")
            .update({ view_mode: mode, updated_at: new Date() })
            .eq("user_id", user!.id);
    };

    return {
        viewMode,
        setViewMode,
        updateViewMode,
        loading,
    };
};
