import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { VaultItem } from "../../types/vault";

interface HomeScreenProps {
  greeting: string;
  items: VaultItem[];
  loading: boolean;
  stats: {
    total: number;
    completed: number;
    watching: number;
    episodes: number;
  };
  onOpenList: () => void;
  onQuickAdd: () => void;
}

export function HomeScreen({ greeting, items, loading, stats, onOpenList, onQuickAdd }: HomeScreenProps) {
  const currentlyWatching = items.filter((item) => item.status === "Viendo").slice(0, 4);
  const recentHistory = [...items]
    .sort((left, right) => {
      const leftDate = new Date(left.finishDate || left.startDate || left.createdAt || 0).getTime();
      const rightDate = new Date(right.finishDate || right.startDate || right.createdAt || 0).getTime();
      return rightDate - leftDate;
    })
    .slice(0, 6);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.title}>{greeting}</Text>
        <Text style={styles.subtitle}>A mobile dashboard for your anime, series and movie vault.</Text>
        <View style={styles.heroActions}>
          <Pressable style={styles.primaryButton} onPress={onQuickAdd}>
            <Text style={styles.primaryButtonLabel}>Add Title</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onOpenList}>
            <Text style={styles.secondaryButtonLabel}>Open My List</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Titles" value={String(stats.total)} />
        <StatCard label="Watching" value={String(stats.watching)} />
        <StatCard label="Done" value={String(stats.completed)} />
        <StatCard label="Eps" value={String(stats.episodes)} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#f97316" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Your vault is empty</Text>
          <Text style={styles.emptyText}>Add your first title to populate Home, My List and Stats.</Text>
        </View>
      ) : (
        <>
          <Section title="Currently Watching">
            {currentlyWatching.length === 0 ? (
              <Text style={styles.helperText}>Nothing in progress right now.</Text>
            ) : (
              currentlyWatching.map((item) => <HighlightCard key={item.id} item={item} />)
            )}
          </Section>

          <Section title="Recent History">
            {recentHistory.map((item) => (
              <View key={item.id} style={styles.historyRow}>
                <View style={styles.historyMain}>
                  <Text style={styles.historyTitle}>{item.title}</Text>
                  <Text style={styles.historyMeta}>{item.type} · {item.status}</Text>
                </View>
                <Text style={styles.historyValue}>{item.currentEp}</Text>
              </View>
            ))}
          </Section>
        </>
      )}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function HighlightCard({ item }: { item: VaultItem }) {
  return (
    <View style={styles.highlightCard}>
      <Text style={styles.highlightTitle}>{item.title}</Text>
      <Text style={styles.highlightMeta}>{item.type} · {item.currentEp}{item.totalEp ? ` / ${item.totalEp}` : ""}</Text>
      {!!item.description && <Text style={styles.highlightDescription}>{item.description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 120,
  },
  hero: {
    gap: 10,
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 20,
  },
  heroActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#f97316",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonLabel: {
    color: "#fff7ed",
    fontWeight: "800",
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonLabel: {
    color: "#e2e8f0",
    fontWeight: "700",
  },
  statsRow: {
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
    color: "#fb923c",
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700",
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyCard: {
    backgroundColor: "#11182d",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
    gap: 8,
  },
  emptyTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
  },
  emptyText: {
    color: "#94a3b8",
    lineHeight: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "800",
  },
  sectionBody: {
    gap: 10,
  },
  helperText: {
    color: "#94a3b8",
  },
  highlightCard: {
    backgroundColor: "#11182d",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 16,
    gap: 6,
  },
  highlightTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "800",
  },
  highlightMeta: {
    color: "#fb923c",
    fontWeight: "700",
  },
  highlightDescription: {
    color: "#cbd5e1",
    lineHeight: 20,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#11182d",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 16,
    gap: 12,
  },
  historyMain: {
    flex: 1,
    gap: 3,
  },
  historyTitle: {
    color: "#f8fafc",
    fontWeight: "800",
  },
  historyMeta: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  historyValue: {
    color: "#fb923c",
    fontSize: 20,
    fontWeight: "800",
  },
});
