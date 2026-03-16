import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Alert, StyleSheet, View } from "react-native";
import { useVault } from "../hooks/useVault";
import { getProfile } from "../lib/profiles";
import type { UserProfile } from "../types/vault";
import { BottomTabs, type VaultTabId } from "./navigation/BottomTabs";
import { HomeScreen } from "./screens/HomeScreen";
import { MyListScreen } from "./screens/MyListScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { StatsScreen } from "./screens/StatsScreen";

interface VaultHomeProps {
  user: User;
}

export function VaultHome({ user }: VaultHomeProps) {
  const vault = useVault(user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<VaultTabId>("home");
  const [showComposer, setShowComposer] = useState(false);

  useEffect(() => {
    getProfile(user.id)
      .then((nextProfile) => setProfile(nextProfile))
      .catch((error) => console.error(error));
  }, [user.id]);

  const greeting = useMemo(() => {
    const handle = profile?.username || user.email?.split("@")[0] || "there";
    return `Welcome back, ${handle}`;
  }, [profile?.username, user.email]);

  const openComposer = () => {
    setActiveTab("mylist");
    setShowComposer(true);
  };

  const closeComposer = () => setShowComposer(false);

  const refreshProfile = async () => {
    try {
      const nextProfile = await getProfile(user.id);
      setProfile(nextProfile);
    } catch (error) {
      Alert.alert("Profile error", error instanceof Error ? error.message : "Unknown error");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {activeTab === "home" && (
          <HomeScreen
            items={vault.items}
            stats={vault.stats}
            loading={vault.loading}
            greeting={greeting}
            onOpenList={() => setActiveTab("mylist")}
            onQuickAdd={openComposer}
          />
        )}

        {activeTab === "mylist" && (
          <MyListScreen
            items={vault.items}
            loading={vault.loading}
            showComposer={showComposer}
            onOpenComposer={openComposer}
            onCloseComposer={closeComposer}
            onAddItem={vault.addItem}
            onUpdateItem={vault.updateItem}
            onDeleteItem={vault.deleteItem}
            onOpenAddScreen={openComposer}
          />
        )}

        {activeTab === "stats" && (
          <StatsScreen
            stats={vault.stats}
            items={vault.items}
            onDeleteAll={vault.deleteAllItems}
          />
        )}

        {activeTab === "settings" && (
          <SettingsScreen
            user={user}
            profile={profile}
            onProfileRefresh={refreshProfile}
          />
        )}
      </View>

      <BottomTabs activeTab={activeTab} onChangeTab={setActiveTab} onQuickAdd={openComposer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 92,
  },
});
