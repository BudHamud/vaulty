import { supabase } from "./supabaseClient";
import type { UserProfile } from "@/types/anime";

/**
 * Profiles table (run once in Supabase SQL editor):
 *
 * create table public.profiles (
 *   id uuid references auth.users on delete cascade primary key,
 *   username text unique not null,
 *   email text not null
 * );
 *
 * -- Allow anyone to read (needed for username→email lookup on login)
 * alter table public.profiles enable row level security;
 * create policy "Public profiles are viewable by everyone"
 *   on public.profiles for select using (true);
 * create policy "Users can insert their own profile"
 *   on public.profiles for insert with check (auth.uid() = id);
 * create policy "Users can update their own profile"
 *   on public.profiles for update using (auth.uid() = id);
 */

interface CreateProfileArgs {
    userId: string;
    username: string;
    email: string;
}

/** Create a profile row after signup */
export async function createProfile({ userId, username, email }: CreateProfileArgs): Promise<void> {
    const { error } = await supabase
        .from("profiles")
        .insert({ id: userId, username: username.toLowerCase().trim(), email });
    if (error) throw error;
}

/** Look up an email by username (for username-based login) */
export async function getEmailByUsername(username: string): Promise<string> {
    const { data, error } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", username.toLowerCase().trim())
        .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Username not found");
    return (data as { email: string }).email;
}

/** Update email stored in profiles table */
export async function updateProfileEmail(userId: string, newEmail: string): Promise<void> {
    const { error } = await supabase
        .from("profiles")
        .update({ email: newEmail })
        .eq("id", userId);
    if (error) throw error;
}

/** Get profile for a user */
export async function getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from("profiles")
        .select("username, email")
        .eq("id", userId)
        .maybeSingle();
    if (error) return null;
    return data as UserProfile;
}
