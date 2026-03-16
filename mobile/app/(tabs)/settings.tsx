import { SettingsScreen } from "../../src/components/screens/SettingsScreen";
import { useVaultApp } from "../../src/context/VaultAppContext";

export default function SettingsRoute() {
  const { user, profile, refreshProfile } = useVaultApp();

  if (!user) {
    return null;
  }

  return <SettingsScreen user={user} profile={profile} onProfileRefresh={refreshProfile} />;
}
