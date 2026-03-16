import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { VaultAppProvider } from "../src/context/VaultAppContext";

const vaultyTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#0b1020",
    card: "#0b1020",
    border: "#1e293b",
    primary: "#fb923c",
    text: "#f8fafc",
    notification: "#fb923c",
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0b1020" }}>
      <SafeAreaProvider>
        <ThemeProvider value={vaultyTheme}>
          <VaultAppProvider>
            <View style={{ flex: 1, backgroundColor: "#0b1020" }}>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: "#0b1020" } }}>
                <Stack.Screen name="index" options={{ animation: "none" }} />
                <Stack.Screen name="auth" options={{ animation: "fade" }} />
                <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
                <Stack.Screen
                  name="add"
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                    gestureEnabled: true,
                    contentStyle: { backgroundColor: "#0b1020" },
                  }}
                />
              </Stack>
            </View>
          </VaultAppProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
