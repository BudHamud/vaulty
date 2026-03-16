import { Pressable, StyleSheet, Text, View } from "react-native";

export type VaultTabId = "home" | "mylist" | "stats" | "settings";

interface BottomTabsProps {
  activeTab: VaultTabId;
  onChangeTab: (tab: VaultTabId) => void;
  onQuickAdd: () => void;
}

const tabs: Array<{ id: VaultTabId; label: string }> = [
  { id: "home", label: "Home" },
  { id: "mylist", label: "My List" },
  { id: "stats", label: "Stats" },
  { id: "settings", label: "Settings" },
];

export function BottomTabs({ activeTab, onChangeTab, onQuickAdd }: BottomTabsProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {tabs.slice(0, 2).map((tab) => (
          <Pressable key={tab.id} style={styles.tab} onPress={() => onChangeTab(tab.id)}>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        ))}

        <Pressable style={styles.addButton} onPress={onQuickAdd}>
          <Text style={styles.addLabel}>Add</Text>
        </Pressable>

        {tabs.slice(2).map((tab) => (
          <Pressable key={tab.id} style={styles.tab} onPress={() => onChangeTab(tab.id)}>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0f172a",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#1e293b",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  tabLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  tabLabelActive: {
    color: "#fb923c",
  },
  addButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#f97316",
  },
  addLabel: {
    color: "#fff7ed",
    fontSize: 12,
    fontWeight: "800",
  },
});
