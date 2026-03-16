import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { VaultItemForm } from "../src/components/VaultItemForm";
import { useVaultApp } from "../src/context/VaultAppContext";
import { searchMedia } from "../src/lib/mediaSearch";
import type { VaultItem } from "../src/types/vault";
import type { MediaSearchResult, VaultType } from "../src/types/vault";

export default function AddRoute() {
  const { vault } = useVaultApp();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<VaultType>("Anime");
  const [results, setResults] = useState<MediaSearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<MediaSearchResult | null>(null);
  const [searching, setSearching] = useState(false);

  const initialDraft = useMemo(() => {
    if (!selectedResult) {
      return null;
    }

    return {
      title: selectedResult.title,
      description: selectedResult.synopsis,
      type: selectedResult.type,
      status: selectedResult.tmdbStatus || "Viendo",
      imgUrl: selectedResult.imgUrl,
      startDate: null,
      finishDate: null,
      isFocus: false,
      currentEp: 0,
      totalEp: selectedResult.totalEp,
    } satisfies Partial<Omit<VaultItem, "id">>;
  }, [selectedResult]);

  const handleSearch = async () => {
    if (!query.trim()) {
      return;
    }

    setSearching(true);
    try {
      const nextResults = await searchMedia(query, searchType);
      setResults(nextResults);
    } catch (error) {
      Alert.alert("Search error", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (payload: Omit<VaultItem, "id">) => {
    try {
      await vault.addItem(payload);
      router.back();
    } catch (error) {
      Alert.alert("Save error", error instanceof Error ? error.message : "Unknown error");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Title</Text>
          <Text style={styles.subtitle}>Create a new entry in your Vaulty collection.</Text>
        </View>

        <View style={styles.searchPanel}>
          <Text style={styles.searchTitle}>Search Metadata</Text>
          <Text style={styles.searchSubtitle}>Use Jikan for anime or TMDB for series and movies.</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search title"
            placeholderTextColor="#64748b"
            style={styles.input}
          />
          <View style={styles.typeRow}>
            {(["Anime", "Serie", "Pelicula"] as VaultType[]).map((type) => (
              <Pressable
                key={type}
                style={[styles.typeChip, searchType === type && styles.typeChipActive]}
                onPress={() => setSearchType(type)}
              >
                <Text style={[styles.typeChipLabel, searchType === type && styles.typeChipLabelActive]}>{type}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={[styles.searchButton, searching && styles.searchButtonDisabled]} onPress={handleSearch} disabled={searching}>
            <Text style={styles.searchButtonLabel}>{searching ? "Searching..." : "Search"}</Text>
          </Pressable>

          {results.length > 0 && (
            <FlatList
              data={results}
              keyExtractor={(item, index) => `${item.type}-${item.id ?? item.title}-${index}`}
              scrollEnabled={false}
              contentContainerStyle={styles.resultsList}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.resultCard, selectedResult?.title === item.title && styles.resultCardActive]}
                  onPress={() => setSelectedResult(item)}
                >
                  <View style={styles.resultMain}>
                    <Text style={styles.resultTitle}>{item.title}</Text>
                    <Text style={styles.resultMeta}>{item.type} · {item.releaseYear || "?"} · {item.totalEp || "??"}</Text>
                    {!!item.synopsis && <Text numberOfLines={3} style={styles.resultSynopsis}>{item.synopsis}</Text>}
                  </View>
                  <Text style={styles.resultScore}>{item.score ? item.score.toFixed(1) : "-"}</Text>
                </Pressable>
              )}
            />
          )}
        </View>

        <VaultItemForm
          initialDraft={initialDraft}
          submitLabel="Add to Vault"
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
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
    padding: 20,
    gap: 16,
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
  searchPanel: {
    backgroundColor: "#11182d",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 16,
    gap: 12,
  },
  searchTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
  },
  searchSubtitle: {
    color: "#94a3b8",
    lineHeight: 20,
  },
  input: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#f8fafc",
    fontSize: 15,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  typeChipActive: {
    backgroundColor: "#f97316",
    borderColor: "#f97316",
  },
  typeChipLabel: {
    color: "#cbd5e1",
    fontWeight: "700",
  },
  typeChipLabelActive: {
    color: "#fff7ed",
  },
  searchButton: {
    backgroundColor: "#f97316",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonLabel: {
    color: "#fff7ed",
    fontWeight: "800",
  },
  resultsList: {
    gap: 10,
  },
  resultCard: {
    backgroundColor: "#0f172a",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 14,
    flexDirection: "row",
    gap: 12,
  },
  resultCardActive: {
    borderColor: "#f97316",
  },
  resultMain: {
    flex: 1,
    gap: 3,
  },
  resultTitle: {
    color: "#f8fafc",
    fontWeight: "800",
  },
  resultMeta: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  resultSynopsis: {
    color: "#cbd5e1",
    lineHeight: 18,
  },
  resultScore: {
    color: "#fb923c",
    fontWeight: "800",
    fontSize: 18,
  },
});

