import { router } from "expo-router";
import { useState } from "react";
import { MyListScreen } from "../../src/components/screens/MyListScreen";
import { useVaultApp } from "../../src/context/VaultAppContext";

export default function MyListRoute() {
  const { vault } = useVaultApp();
  const [showComposer, setShowComposer] = useState(false);

  return (
    <MyListScreen
      items={vault.items}
      loading={vault.loading}
      showComposer={showComposer}
      onOpenComposer={() => setShowComposer(true)}
      onCloseComposer={() => setShowComposer(false)}
      onAddItem={vault.addItem}
      onUpdateItem={vault.updateItem}
      onDeleteItem={vault.deleteItem}
      onOpenAddScreen={() => router.push("/add")}
    />
  );
}
