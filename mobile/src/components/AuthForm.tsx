import type { ComponentProps } from "react";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { createProfile, getEmailByUsername } from "../lib/profiles";
import { supabase } from "../lib/supabase";

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);

    try {
      if (isLogin) {
        const trimmedIdentifier = identifier.trim();
        const emailToUse = trimmedIdentifier.includes("@")
          ? trimmedIdentifier
          : await getEmailByUsername(trimmedIdentifier);

        const { error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password,
        });

        if (error) {
          throw error;
        }
      } else {
        if (!username.trim() || username.trim().length < 3) {
          throw new Error("Username must be at least 3 characters.");
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
          throw new Error("Username can only contain letters, numbers and underscores.");
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          await createProfile({
            userId: data.user.id,
            username: username.trim(),
            email: email.trim(),
          });
        }

        Alert.alert("Check your email", "Confirm your account from the email sent by Supabase.");
      }
    } catch (error) {
      Alert.alert("Auth error", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Vaulty Mobile</Text>
        <Text style={styles.title}>Your private media vault, now on mobile.</Text>
        <Text style={styles.subtitle}>
          Start with email and password auth, then track anime, series and movies from the same Supabase project.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <Pressable style={[styles.switchButton, isLogin && styles.switchButtonActive]} onPress={() => setIsLogin(true)}>
            <Text style={[styles.switchLabel, isLogin && styles.switchLabelActive]}>Sign in</Text>
          </Pressable>
          <Pressable style={[styles.switchButton, !isLogin && styles.switchButtonActive]} onPress={() => setIsLogin(false)}>
            <Text style={[styles.switchLabel, !isLogin && styles.switchLabelActive]}>Sign up</Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          {isLogin ? (
            <Field label="Email or Username" value={identifier} onChangeText={setIdentifier} autoCapitalize="none" />
          ) : (
            <>
              <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
              <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </>
          )}

          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />

          <Pressable style={[styles.submitButton, loading && styles.submitButtonDisabled]} disabled={loading} onPress={submit}>
            <Text style={styles.submitLabel}>{loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

type FieldProps = ComponentProps<typeof TextInput> & {
  label: string;
};

function Field({ label, ...props }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#64748b"
        style={styles.input}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    gap: 24,
  },
  hero: {
    gap: 10,
  },
  eyebrow: {
    color: "#fb923c",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: "#f8fafc",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#11182d",
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1e293b",
    gap: 20,
  },
  switchRow: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    padding: 4,
    borderRadius: 16,
  },
  switchButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  switchButtonActive: {
    backgroundColor: "#f97316",
  },
  switchLabel: {
    color: "#94a3b8",
    fontWeight: "700",
  },
  switchLabelActive: {
    color: "#fff7ed",
  },
  form: {
    gap: 14,
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    color: "#cbd5e1",
    fontSize: 13,
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
  submitButton: {
    marginTop: 8,
    backgroundColor: "#f97316",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitLabel: {
    color: "#fff7ed",
    fontSize: 15,
    fontWeight: "800",
  },
});
