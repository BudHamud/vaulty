import { Redirect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { useVaultApp } from "../src/context/VaultAppContext";

export default function IndexRoute() {
  const { user, authLoading } = useVaultApp();

  if (authLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: "#0b1020" }}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ color: "#cbd5e1", fontSize: 16, fontWeight: "600" }}>Loading Vaulty...</Text>
      </View>
    );
  }

  return <Redirect href={user ? "/(tabs)/home" : "/auth"} />;
}
