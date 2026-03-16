import { Redirect } from "expo-router";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { AuthForm } from "../src/components/AuthForm";
import { useVaultApp } from "../src/context/VaultAppContext";

export default function AuthRoute() {
  const { user, authLoading } = useVaultApp();

  if (!authLoading && user) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AuthForm />
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
});
