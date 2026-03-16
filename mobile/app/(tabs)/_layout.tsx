import { router, Tabs } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#fb923c",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "#1e293b",
          height: 74,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        sceneStyle: {
          backgroundColor: "#0b1020",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabGlyph color={color} glyph="⌂" />,
        }}
      />
      <Tabs.Screen
        name="my-list"
        options={{
          title: "My List",
          tabBarIcon: ({ color }) => <TabGlyph color={color} glyph="▣" />,
        }}
      />
      <Tabs.Screen
        name="add-shortcut"
        options={{
          title: "",
          tabBarButton: () => (
            <Pressable style={styles.addButtonWrap} onPress={() => router.push("/add")}>
              <View style={styles.addButton}>
                <Text style={styles.addGlyph}>+</Text>
              </View>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color }) => <TabGlyph color={color} glyph="◔" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <TabGlyph color={color} glyph="⚙" />,
        }}
      />
    </Tabs>
  );
}

function TabGlyph({ color, glyph }: { color: string; glyph: string }) {
  return <Text style={[styles.tabGlyph, { color }]}>{glyph}</Text>;
}

const styles = StyleSheet.create({
  tabGlyph: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 22,
  },
  addButtonWrap: {
    top: -10,
    justifyContent: "center",
    alignItems: "center",
    width: 72,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#f97316",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  addGlyph: {
    color: "#fff7ed",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 30,
  },
});

