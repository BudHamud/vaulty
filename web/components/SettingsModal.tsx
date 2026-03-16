'use client'

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { updateProfileEmail } from "@/lib/profiles";
import Modal from "@/components/Modal";
import type { User } from "@supabase/supabase-js";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    username: string | null;
    onOpenImport?: () => void;
}

interface FeedbackMsg {
    type: "success" | "error";
    text: string;
}

type SettingsTab = "account" | "password" | "import";

export default function SettingsModal({ isOpen, onClose, user, username, onOpenImport }: SettingsModalProps) {
    const [tab, setTab] = useState<SettingsTab>("account");

    const [newEmail, setNewEmail] = useState("");
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailMsg, setEmailMsg] = useState<FeedbackMsg | null>(null);

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMsg, setPwMsg] = useState<FeedbackMsg | null>(null);

    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail.trim() || !user) return;
        setEmailLoading(true);
        setEmailMsg(null);
        try {
            const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
            if (error) throw error;
            await updateProfileEmail(user.id, newEmail.trim());
            setEmailMsg({ type: "success", text: "Confirmation email sent to " + newEmail.trim() + ". Check your inbox." });
            setNewEmail("");
        } catch (err: unknown) {
            setEmailMsg({ type: "error", text: err instanceof Error ? err.message : "Unknown error" });
        } finally {
            setEmailLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { setPwMsg({ type: "error", text: "Passwords don't match." }); return; }
        if (newPassword.length < 6) { setPwMsg({ type: "error", text: "Password must be at least 6 characters." }); return; }
        setPwLoading(true);
        setPwMsg(null);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setPwMsg({ type: "success", text: "Password updated successfully." });
            setNewPassword(""); setConfirmPassword("");
        } catch (err: unknown) {
            setPwMsg({ type: "error", text: err instanceof Error ? err.message : "Unknown error" });
        } finally {
            setPwLoading(false);
        }
    };

    const handleSignOut = async () => { await supabase.auth.signOut(); onClose(); };

    const tabs: { id: SettingsTab; label: string }[] = [
        { id: "account", label: "Account" },
        { id: "password", label: "Password" },
        { id: "import", label: "Import" },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="md">
            <div className="flex gap-1 bg-vaulty-card rounded-xl p-1 mb-6 border border-vaulty-border">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${tab === t.id ? "bg-vaulty-accent text-white shadow" : "text-vaulty-muted hover:text-vaulty-text"}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "account" && (
                <div className="space-y-5">
                    <div className="bg-vaulty-card rounded-xl p-4 border border-vaulty-border space-y-2">
                        {username && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-vaulty-muted font-semibold">Username</span>
                                <span className="text-vaulty-text font-bold">@{username}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-vaulty-muted font-semibold">Current email</span>
                            <span className="text-vaulty-text font-bold truncate max-w-[180px]">{user?.email}</span>
                        </div>
                    </div>

                    <form onSubmit={handleEmailChange} className="space-y-3">
                        <label className="block text-xs font-bold text-vaulty-muted uppercase tracking-wider">New email address</label>
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="new@example.com"
                            className="w-full p-3 bg-vaulty-card border border-vaulty-border rounded-xl outline-none focus:ring-2 focus:ring-vaulty-accent/50 text-vaulty-text placeholder:text-vaulty-muted text-sm"
                            required
                        />
                        {emailMsg && (
                            <p className={`text-xs font-medium px-3 py-2 rounded-lg ${emailMsg.type === "success" ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30" : "bg-red-900/20 text-red-400 border border-red-800/30"}`}>
                                {emailMsg.text}
                            </p>
                        )}
                        <button type="submit" disabled={emailLoading} className="w-full py-3 bg-vaulty-accent hover:bg-vaulty-accent-hover text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                            {emailLoading ? "Sending..." : "Change Email"}
                        </button>
                        <p className="text-[10px] text-vaulty-muted text-center">A confirmation link will be sent to the new address.</p>
                    </form>

                    <button onClick={handleSignOut} className="w-full py-2.5 border border-red-900/40 text-red-400 hover:bg-red-900/10 rounded-xl text-sm font-bold transition-all">
                        Sign Out
                    </button>
                </div>
            )}

            {tab === "password" && (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-vaulty-muted uppercase mb-2 tracking-wider">New password</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 bg-vaulty-card border border-vaulty-border rounded-xl outline-none focus:ring-2 focus:ring-vaulty-accent/50 text-vaulty-text placeholder:text-vaulty-muted text-sm" required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-vaulty-muted uppercase mb-2 tracking-wider">Confirm password</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 bg-vaulty-card border border-vaulty-border rounded-xl outline-none focus:ring-2 focus:ring-vaulty-accent/50 text-vaulty-text placeholder:text-vaulty-muted text-sm" required />
                    </div>
                    {pwMsg && (
                        <p className={`text-xs font-medium px-3 py-2 rounded-lg ${pwMsg.type === "success" ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30" : "bg-red-900/20 text-red-400 border border-red-800/30"}`}>
                            {pwMsg.text}
                        </p>
                    )}
                    <button type="submit" disabled={pwLoading} className="w-full py-3 bg-vaulty-accent hover:bg-vaulty-accent-hover text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                        {pwLoading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            )}

            {tab === "import" && (
                <div className="space-y-5">
                    <div>
                        <p className="text-xs text-vaulty-muted mb-3">Already exported your watch history? Import a CSV file to add entries to your vault.</p>
                        <button onClick={() => { if (onOpenImport) onOpenImport(); onClose(); }} className="w-full py-3 bg-vaulty-accent hover:bg-vaulty-accent-hover text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-vaulty-accent/20">
                            Import CSV file
                        </button>
                    </div>
                    <div className="space-y-3">
                        <p className="text-xs font-bold text-vaulty-muted uppercase tracking-wider">How to export your history</p>
                        {[
                            { emoji: "🟠", name: "Crunchyroll", steps: ["Abrí Chrome y andá a chrome://extensions", "Activá el Modo desarrollador", "Hacé clic en Cargar descomprimida y seleccioná la carpeta de la extensión extensions/crunchyroll-extension", "Andá a crunchyroll.com/history", "Abrí el popup y hacé clic en START SCAN", "Esperá y descargá el CSV"] },
                            { emoji: "🔴", name: "Netflix", steps: ["Go to Account", "Open Security & Privacy", "Click Download personal information", "Request the download & wait for an email", "Download the ZIP — use the ViewingActivity.csv file"] },
                            { emoji: "🔵", name: "Prime Video", steps: ["Abrí Chrome y andá a chrome://extensions", "Activá el Modo desarrollador", "Hacé clic en Cargar descomprimida y seleccioná la carpeta extensions/primevideo-extension", "Andá a amazon.com/gp/video/history", "Abrí el popup y hacé clic en START SCAN", "Copiá el JSON generado y pegalo en el importador"] },
                        ].map((src) => (
                            <div key={src.name} className="bg-vaulty-card rounded-xl p-4 border border-vaulty-border space-y-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-base">{src.emoji}</span>
                                    <span className="text-sm font-bold text-vaulty-text">{src.name}</span>
                                </div>
                                <ol className="list-decimal list-inside text-xs text-vaulty-muted space-y-1 leading-relaxed">
                                    {src.steps.map((s, i) => <li key={i}>{s}</li>)}
                                </ol>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Modal>
    );
}
