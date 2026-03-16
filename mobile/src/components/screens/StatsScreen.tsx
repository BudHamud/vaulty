import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { VaultItem } from "../../types/vault";

interface StatsScreenProps {
  stats: {
    total: number;
    completed: number;
    watching: number;
    episodes: number;
  };
  items: VaultItem[];
  onDeleteAll: () => Promise<void>;
}

export function StatsScreen({ stats, items, onDeleteAll }: StatsScreenProps) {
  const movies = items.filter((item) => item.type === "Pelicula").length;
  const shows = items.filter((item) => item.type === "Serie").length;
  const anime = items.filter((item) => item.type === "Anime").length;

  const handleDeleteAll = () => {
    Alert.alert("Delete all titles", "This will remove your entire mobile vault list from Supabase.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete all",
        style: "destructive",
        onPress: async () => {
          try {
            await onDeleteAll();
          } catch (error) {
            Alert.alert("Delete error", error instanceof Error ? error.message : "Unknown error");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Stats</Text>
        <Text style={styles.subtitle}>A compact view of your library health and current distribution.</Text>
      </View>

      <View style={styles.grid}>
        <StatCard label="Total Titles" value={String(stats.total)} accent="#fb923c" />
        <StatCard label="Completed" value={String(stats.completed)} accent="#34d399" />
        <StatCard label="Watching" value={String(stats.watching)} accent="#fbbf24" />
        <StatCard label="Episodes" value={String(stats.episodes)} accent="#60a5fa" />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Breakdown</Text>
        <BreakdownRow label="Anime" value={anime} />
        <BreakdownRow label="Series" value={shows} />
        <BreakdownRow label="Movies" value={movies} />
        <BreakdownRow label="Pending" value={items.filter((item) => item.status === "Pendiente").length} />
      </View>

      <View style={styles.dangerPanel}>
        <Text style={styles.panelTitle}>Danger Zone</Text>
        <Text style={styles.dangerText}>Use this only if you want to clear the full collection attached to your account.</Text>
        <Pressable style={styles.deleteButton} onPress={handleDeleteAll}>
          <Text style={styles.deleteButtonLabel}>Delete All</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.breakdownValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 120,
  },
  header: {
    gap: 6,
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#94a3b8",
    lineHeight: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    minWidth: "47%",
    flexGrow: 1,
    backgroundColor: "#11182d",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700",
  },
  panel: {
    backgroundColor: "#11182d",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 18,
    gap: 14,
  },
  panelTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    color: "#cbd5e1",
    fontWeight: "700",
  },
  breakdownValue: {
    color: "#fb923c",
    fontWeight: "800",
    fontSize: 18,
  },
  dangerPanel: {
    backgroundColor: "#1a1020",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    padding: 18,
    gap: 12,
  },
  dangerText: {
    color: "#fca5a5",
    lineHeight: 20,
  },
  deleteButton: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ef4444",
    paddingVertical: 14,
  },
  deleteButtonLabel: {
    color: "#fca5a5",
    fontWeight: "800",
  },
});
