import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { VaultItem, VaultStatus, VaultType } from "../types/vault";

const statuses: VaultStatus[] = ["Viendo", "Terminado", "Pendiente"];
const types: VaultType[] = ["Anime", "Serie", "Pelicula"];

function normalizeType(type: string | undefined): VaultType {
  if (type === "Serie" || type === "Pelicula") {
    return type;
  }

  return "Anime";
}

interface VaultItemFormProps {
  initialItem?: VaultItem | null;
  initialDraft?: Partial<Omit<VaultItem, "id">> | null;
  submitLabel: string;
  onSubmit: (item: Omit<VaultItem, "id">) => Promise<void>;
  onCancel?: () => void;
}

export function VaultItemForm({ initialItem, initialDraft, submitLabel, onSubmit, onCancel }: VaultItemFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [currentEp, setCurrentEp] = useState("0");
  const [totalEp, setTotalEp] = useState("");
  const [status, setStatus] = useState<VaultStatus>("Viendo");
  const [type, setType] = useState<VaultType>("Anime");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!initialItem) {
      setTitle(initialDraft?.title || "");
      setDescription(initialDraft?.description || "");
      setCurrentEp(String(initialDraft?.currentEp ?? 0));
      setTotalEp(initialDraft?.totalEp != null ? String(initialDraft.totalEp) : "");
      setStatus(initialDraft?.status || "Viendo");
      setType(normalizeType(initialDraft?.type));
      return;
    }

    setTitle(initialItem.title);
    setDescription(initialItem.description || "");
    setCurrentEp(String(initialItem.currentEp ?? 0));
    setTotalEp(initialItem.totalEp != null ? String(initialItem.totalEp) : "");
    setStatus(initialItem.status);
    setType(normalizeType(initialItem.type));
  }, [initialDraft, initialItem]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        type,
        status,
        imgUrl: initialItem?.imgUrl || "",
        startDate: initialItem?.startDate || null,
        finishDate: status === "Terminado" ? initialItem?.finishDate || new Date().toISOString().slice(0, 10) : null,
        isFocus: initialItem?.isFocus || false,
        currentEp: Number(currentEp || 0),
        totalEp: totalEp ? Number(totalEp) : null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor="#64748b" style={styles.input} />
      <TextInput value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor="#64748b" style={[styles.input, styles.textArea]} multiline />
      <SelectorRow label="Type" options={types} selected={type} onSelect={(value) => setType(value as VaultType)} />
      <SelectorRow label="Status" options={statuses} selected={status} onSelect={(value) => setStatus(value as VaultStatus)} />
      <View style={styles.inlineInputs}>
        <TextInput value={currentEp} onChangeText={setCurrentEp} keyboardType="numeric" placeholder="Current ep" placeholderTextColor="#64748b" style={[styles.input, styles.inlineInput]} />
        <TextInput value={totalEp} onChangeText={setTotalEp} keyboardType="numeric" placeholder="Total ep" placeholderTextColor="#64748b" style={[styles.input, styles.inlineInput]} />
      </View>
      <Pressable style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.primaryButtonLabel}>{submitting ? "Saving..." : submitLabel}</Text>
      </Pressable>
      {onCancel && (
        <Pressable style={styles.secondaryButton} onPress={onCancel}>
          <Text style={styles.secondaryButtonLabel}>Cancel</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function SelectorRow({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: readonly string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.selectorWrap}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <View style={styles.selectorRow}>
        {options.map((option) => (
          <Pressable
            key={option}
            style={[styles.selectorChip, selected === option && styles.selectorChipActive]}
            onPress={() => onSelect(option)}
          >
            <Text style={[styles.selectorChipLabel, selected === option && styles.selectorChipLabelActive]}>{option}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingBottom: 32,
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
  textArea: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  selectorWrap: {
    gap: 10,
  },
  selectorLabel: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "700",
  },
  selectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  selectorChipActive: {
    backgroundColor: "#f97316",
    borderColor: "#f97316",
  },
  selectorChipLabel: {
    color: "#cbd5e1",
    fontWeight: "700",
  },
  selectorChipLabelActive: {
    color: "#fff7ed",
  },
  inlineInputs: {
    flexDirection: "row",
    gap: 10,
  },
  inlineInput: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: "#f97316",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonLabel: {
    color: "#fff7ed",
    fontWeight: "800",
  },
  secondaryButton: {
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
});
