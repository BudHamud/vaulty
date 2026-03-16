import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { AuthForm } from "./src/components/AuthForm";
import { VaultHome } from "./src/components/VaultHome";
import { useAuth } from "./src/hooks/useAuth";

export default function App() {
  const { user, loading } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#f97316" />
            <Text style={styles.loadingText}>Loading Vaulty...</Text>
          </View>
        ) : user ? (
          <VaultHome user={user} />
        ) : (
          <AuthForm />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0b1020",
  },
  container: {
    flex: 1,
    backgroundColor: "#0b1020",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  loadingText: {
    color: "#cbd5e1",
    fontSize: 16,
    fontWeight: "600",
  },
});
