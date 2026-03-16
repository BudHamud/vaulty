import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { VaultItemForm } from "../VaultItemForm";
import type { VaultItem, VaultStatus, VaultType } from "../../types/vault";

interface MyListScreenProps {
  items: VaultItem[];
  loading: boolean;
  showComposer: boolean;
  onOpenComposer: () => void;
  onCloseComposer: () => void;
  onAddItem: (item: Omit<VaultItem, "id">) => Promise<void>;
  onUpdateItem: (id: string, item: Omit<VaultItem, "id">) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onOpenAddScreen: () => void;
}

const statuses: VaultStatus[] = ["Viendo", "Terminado", "Pendiente"];
const types: VaultType[] = ["Anime", "Serie", "Pelicula"];

export function MyListScreen({ items, loading, showComposer, onOpenComposer, onCloseComposer, onAddItem, onUpdateItem, onDeleteItem, onOpenAddScreen }: MyListScreenProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return items;
    }

    return items.filter((item) => item.title.toLowerCase().includes(normalizedSearch));
  }, [items, searchTerm]);

  const handleSave = async (payload: Omit<VaultItem, "id">) => {
    try {
      if (editingItemId) {
        await onUpdateItem(editingItemId, payload);
      } else {
        await onAddItem(payload);
      }

      setEditingItemId(null);
      onCloseComposer();
    } catch (error) {
      Alert.alert("Save error", error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteItem(id);
    } catch (error) {
      Alert.alert("Delete error", error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleEdit = (item: VaultItem) => {
    setEditingItemId(item.id);
    onOpenComposer();
  };

  const handleCloseComposer = () => {
    setEditingItemId(null);
    onCloseComposer();
  };

  const editingItem = editingItemId ? items.find((item) => item.id === editingItemId) ?? null : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My List</Text>
        <Text style={styles.subtitle}>Search, browse and add titles from your vault.</Text>
      </View>

      <TextInput
        value={searchTerm}
        onChangeText={setSearchTerm}
        placeholder="Search Vaulty"
        placeholderTextColor="#64748b"
        style={styles.searchInput}
      />

      <View style={styles.topActions}>
        <Pressable style={styles.topActionButton} onPress={onOpenAddScreen}>
          <Text style={styles.topActionButtonLabel}>Open Add Screen</Text>
        </Pressable>
        <Pressable style={styles.topActionGhost} onPress={onOpenComposer}>
          <Text style={styles.topActionGhostLabel}>Inline Composer</Text>
        </Pressable>
      </View>

      {showComposer && (
        <View style={styles.composer}>
          <View style={styles.composerHeader}>
            <Text style={styles.composerTitle}>{editingItemId ? "Edit Title" : "Quick Add"}</Text>
            <Pressable onPress={handleCloseComposer}>
              <Text style={styles.closeLabel}>Close</Text>
            </Pressable>
          </View>

          <VaultItemForm
            initialItem={editingItem}
            submitLabel={editingItemId ? "Save Changes" : "Add to Vault"}
            onSubmit={handleSave}
            onCancel={handleCloseComposer}
          />
        </View>
      )}

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? "Loading your vault..." : "No titles match your current search."}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemMain}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemMeta}>{item.type} · {item.status}</Text>
              </View>
              <View style={styles.itemActions}>
                <Pressable onPress={() => handleEdit(item)}>
                  <Text style={styles.editLabel}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(item.id)}>
                  <Text style={styles.deleteLabel}>Delete</Text>
                </Pressable>
              </View>
            </View>
            {!!item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
            <Text style={styles.progressLabel}>Progress: {item.currentEp}{item.totalEp ? ` / ${item.totalEp}` : ""}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    gap: 6,
    marginBottom: 14,
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
  searchInput: {
    backgroundColor: "#11182d",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#f8fafc",
    fontSize: 15,
    marginBottom: 14,
  },
  topActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  topActionButton: {
    flex: 1,
    backgroundColor: "#f97316",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  topActionButtonLabel: {
    color: "#fff7ed",
    fontWeight: "800",
    fontSize: 13,
  },
  topActionGhost: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  topActionGhostLabel: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: 13,
  },
  composer: {
    backgroundColor: "#11182d",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 16,
    gap: 12,
    marginBottom: 14,
  },
  composerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  composerTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
  },
  closeLabel: {
    color: "#94a3b8",
    fontWeight: "700",
  },
  listContent: {
    gap: 12,
    paddingBottom: 120,
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    paddingVertical: 32,
  },
  itemCard: {
    backgroundColor: "#11182d",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 16,
    gap: 8,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  itemActions: {
    gap: 10,
    alignItems: "flex-end",
  },
  itemMain: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 16,
  },
  itemMeta: {
    color: "#94a3b8",
    fontWeight: "700",
    fontSize: 12,
  },
  itemDescription: {
    color: "#cbd5e1",
    lineHeight: 20,
  },
  progressLabel: {
    color: "#fb923c",
    fontWeight: "700",
  },
  editLabel: {
    color: "#93c5fd",
    fontWeight: "700",
  },
  deleteLabel: {
    color: "#fca5a5",
    fontWeight: "700",
  },
});
