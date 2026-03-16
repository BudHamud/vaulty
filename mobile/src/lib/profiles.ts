import { supabase } from "./supabase";
import type { UserProfile } from "../types/vault";

interface CreateProfileArgs {
  userId: string;
  username: string;
  email: string;
}

export async function createProfile({ userId, username, email }: CreateProfileArgs): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .insert({ id: userId, username: username.toLowerCase().trim(), email: email.trim() });

  if (error) {
    throw error;
  }
}

export async function getEmailByUsername(username: string): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("username", username.toLowerCase().trim())
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Username not found");
  }

  return (data as { email: string }).email;
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("username, email")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as UserProfile | null) ?? null;
}

export async function updateProfileEmail(userId: string, newEmail: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ email: newEmail.trim() })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}
