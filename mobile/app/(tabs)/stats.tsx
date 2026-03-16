import { StatsScreen } from "../../src/components/screens/StatsScreen";
import { useVaultApp } from "../../src/context/VaultAppContext";

export default function StatsRoute() {
  const { vault } = useVaultApp();

  return <StatsScreen stats={vault.stats} items={vault.items} onDeleteAll={vault.deleteAllItems} />;
}
