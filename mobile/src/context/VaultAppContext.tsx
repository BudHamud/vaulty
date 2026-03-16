import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { Alert } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useVault } from "../hooks/useVault";
import { getProfile } from "../lib/profiles";
import type { UserProfile } from "../types/vault";

type VaultAppContextValue = {
  user: ReturnType<typeof useAuth>["user"];
  authLoading: boolean;
  profile: UserProfile | null;
  greeting: string;
  refreshProfile: () => Promise<void>;
  vault: ReturnType<typeof useVault>;
};

const VaultAppContext = createContext<VaultAppContextValue | null>(null);

export function VaultAppProvider({ children }: PropsWithChildren) {
  const { user, loading: authLoading } = useAuth();
  const vault = useVault(user);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    getProfile(user.id)
      .then((nextProfile) => setProfile(nextProfile))
      .catch((error) => console.error(error));
  }, [user]);

  const greeting = useMemo(() => {
    const handle = profile?.username || user?.email?.split("@")[0] || "there";
    return `Welcome back, ${handle}`;
  }, [profile?.username, user?.email]);

  const refreshProfile = async () => {
    if (!user) {
      return;
    }

    try {
      const nextProfile = await getProfile(user.id);
      setProfile(nextProfile);
    } catch (error) {
      Alert.alert("Profile error", error instanceof Error ? error.message : "Unknown error");
    }
  };

  return (
    <VaultAppContext.Provider value={{ user, authLoading, profile, greeting, refreshProfile, vault }}>
      {children}
    </VaultAppContext.Provider>
  );
}

export function useVaultApp() {
  const context = useContext(VaultAppContext);
  if (!context) {
    throw new Error("useVaultApp must be used inside VaultAppProvider");
  }

  return context;
}
