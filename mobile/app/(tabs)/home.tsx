import { router } from "expo-router";
import { HomeScreen } from "../../src/components/screens/HomeScreen";
import { useVaultApp } from "../../src/context/VaultAppContext";

export default function HomeRoute() {
  const { greeting, vault } = useVaultApp();

  return (
    <HomeScreen
      items={vault.items}
      stats={vault.stats}
      loading={vault.loading}
      greeting={greeting}
      onOpenList={() => router.push("/(tabs)/my-list")}
      onQuickAdd={() => router.push("/add")}
    />
  );
}
