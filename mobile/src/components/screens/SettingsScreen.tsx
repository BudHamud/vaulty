import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { updateProfileEmail } from "../../lib/profiles";
import { supabase } from "../../lib/supabase";
import type { UserProfile } from "../../types/vault";

interface SettingsScreenProps {
  user: User;
  profile: UserProfile | null;
  onProfileRefresh: () => Promise<void>;
}

export function SettingsScreen({ user, profile, onProfileRefresh }: SettingsScreenProps) {
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleEmailUpdate = async () => {
    if (!newEmail.trim()) {
      return;
    }

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) {
        throw error;
      }

      await updateProfileEmail(user.id, newEmail.trim());
      await onProfileRefresh();
      setNewEmail("");
      Alert.alert("Email updated", "Supabase sent a confirmation message to your new address.");
    } catch (error) {
      Alert.alert("Email error", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Password error", "Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Password error", "Password must be at least 6 characters.");
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        throw error;
      }

      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Password updated", "Your password was updated successfully.");
    } catch (error) {
      Alert.alert("Password error", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage account details and security from the mobile app.</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Account</Text>
        <InfoRow label="Username" value={profile?.username ? `@${profile.username}` : "Not set"} />
        <InfoRow label="Current email" value={profile?.email || user.email || "Unknown"} />

        <TextInput
          value={newEmail}
          onChangeText={setNewEmail}
          placeholder="new@example.com"
          placeholderTextColor="#64748b"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Pressable style={[styles.primaryButton, emailLoading && styles.primaryButtonDisabled]} disabled={emailLoading} onPress={handleEmailUpdate}>
          <Text style={styles.primaryButtonLabel}>{emailLoading ? "Updating..." : "Change Email"}</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Password</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password"
          placeholderTextColor="#64748b"
          style={styles.input}
          secureTextEntry
        />
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm password"
          placeholderTextColor="#64748b"
          style={styles.input}
          secureTextEntry
        />
        <Pressable style={[styles.primaryButton, passwordLoading && styles.primaryButtonDisabled]} disabled={passwordLoading} onPress={handlePasswordUpdate}>
          <Text style={styles.primaryButtonLabel}>{passwordLoading ? "Updating..." : "Update Password"}</Text>
        </Pressable>
      </View>

      <View style={styles.signOutPanel}>
        <Text style={styles.panelTitle}>Session</Text>
        <Text style={styles.signOutText}>Sign out from this device and clear the persisted mobile session.</Text>
        <Pressable style={styles.signOutButton} onPress={() => supabase.auth.signOut()}>
          <Text style={styles.signOutButtonLabel}>Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  panel: {
    backgroundColor: "#11182d",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 18,
    gap: 12,
  },
  signOutPanel: {
    backgroundColor: "#1a1020",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    padding: 18,
    gap: 12,
  },
  panelTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  infoValue: {
    color: "#f8fafc",
    fontWeight: "700",
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
  signOutText: {
    color: "#fca5a5",
    lineHeight: 20,
  },
  signOutButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ef4444",
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutButtonLabel: {
    color: "#fca5a5",
    fontWeight: "800",
  },
});
