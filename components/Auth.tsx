'use client'

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { createProfile, getEmailByUsername } from "@/lib/profiles";

interface AuthProps {
    onSuccess?: () => void;
}

const Auth = ({ onSuccess }: AuthProps) => {
    const [isLogin, setIsLogin] = useState(true);
    const [identifier, setIdentifier] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const isEmail = identifier.includes("@");
                let emailToUse = identifier.trim();

                if (!isEmail) {
                    emailToUse = await getEmailByUsername(identifier.trim());
                }

                const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
                if (error) throw error;
            } else {
                if (!username.trim()) throw new Error("Username is required.");
                if (username.trim().length < 3) throw new Error("Username must be at least 3 characters.");
                if (!/^[a-zA-Z0-9_]+$/.test(username.trim()))
                    throw new Error("Username can only contain letters, numbers and underscores.");

                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;

                if (data.user) {
                    try {
                        await createProfile({ userId: data.user.id, username: username.trim(), email: email.trim() });
                    } catch (profileErr: unknown) {
                        const msg = profileErr instanceof Error ? profileErr.message : "";
                        if (msg.includes("duplicate") || msg.includes("unique")) {
                            throw new Error("Username already taken. Choose another one.");
                        }
                        throw profileErr;
                    }
                }
            }
            onSuccess?.();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-vaulty-bg flex items-center justify-center p-4">
            <div className="bg-vaulty-sidebar rounded-3xl shadow-2xl w-full max-w-md p-8 border border-vaulty-border">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-vaulty-text uppercase tracking-tight mb-1">Vaulty</h1>
                    <h2 className="text-lg font-bold text-vaulty-text mb-2">
                        {isLogin ? "Welcome back" : "Create account"}
                    </h2>
                    <p className="text-sm text-vaulty-muted font-semibold">
                        {isLogin ? "Sign in with your email or username" : "Start tracking your watches"}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-800/40 rounded-xl">
                        <p className="text-sm text-red-400 font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    {isLogin ? (
                        <div>
                            <label className="block text-xs font-bold text-vaulty-muted uppercase mb-2 ml-1">Email or Username</label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="you@example.com or @username"
                                className="w-full p-4 bg-vaulty-card border border-vaulty-border rounded-2xl outline-none focus:ring-2 focus:ring-vaulty-accent/50 text-vaulty-text placeholder:text-vaulty-muted font-medium"
                                required
                                autoComplete="username"
                            />
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-vaulty-muted uppercase mb-2 ml-1">Username</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-vaulty-muted font-bold">@</span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="yourname"
                                        className="w-full pl-8 pr-4 py-4 bg-vaulty-card border border-vaulty-border rounded-2xl outline-none focus:ring-2 focus:ring-vaulty-accent/50 text-vaulty-text placeholder:text-vaulty-muted font-medium"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-vaulty-muted mt-1 ml-1">Letters, numbers and underscores only.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-vaulty-muted uppercase mb-2 ml-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full p-4 bg-vaulty-card border border-vaulty-border rounded-2xl outline-none focus:ring-2 focus:ring-vaulty-accent/50 text-vaulty-text placeholder:text-vaulty-muted font-medium"
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-vaulty-muted uppercase mb-2 ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••"
                            className="w-full p-4 bg-vaulty-card border border-vaulty-border rounded-2xl outline-none focus:ring-2 focus:ring-vaulty-accent/50 text-vaulty-text placeholder:text-vaulty-muted font-medium"
                            required
                            autoComplete={isLogin ? "current-password" : "new-password"}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-vaulty-accent hover:bg-vaulty-accent-hover text-white font-black text-sm uppercase tracking-widest py-4 rounded-2xl transition-all shadow-lg shadow-vaulty-accent/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
                    </button>
                </form>

                <button
                    onClick={() => { setIsLogin(!isLogin); setError(null); }}
                    className="w-full mt-4 text-sm text-vaulty-muted hover:text-vaulty-accent font-bold uppercase tracking-wider transition-colors"
                >
                    {isLogin ? "Don't have an account? Register" : "Already have an account? Sign in"}
                </button>
            </div>
        </div>
    );
};

export default Auth;
