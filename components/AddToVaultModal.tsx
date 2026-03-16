'use client'

import React, { useState, useEffect, useRef, useCallback } from "react";
import { searchTMDBByType, searchAnimeOnMAL, searchMangaOnMAL } from "@/lib/api";
import type { Anime, AnimeStatus, AnimeType, SearchResult } from "@/types/anime";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconFilm = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /></svg>);
const IconTv = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="15" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" /></svg>);
const IconBook = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>);
const IconStar = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>);
const IconSearch = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>);
const IconX = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
const IconVault = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="3" /><circle cx="12" cy="12" r="4" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>);

const TABS: { id: AnimeType; label: string; Icon: () => React.ReactElement }[] = [
    { id: "Anime", label: "ANIME", Icon: IconStar },
    { id: "Manga", label: "MANGA", Icon: IconBook },
    { id: "Pelicula", label: "MOVIE", Icon: IconFilm },
    { id: "Serie", label: "SERIES", Icon: IconTv },
];

const STATUS_OPTIONS: AnimeStatus[] = ["Pendiente", "Viendo", "Terminado"];

function getStatusLabel(s: AnimeStatus, tab: AnimeType): string {
    if (s === "Viendo" && tab === "Manga") return "Reading";
    return ({ Pendiente: "Pending", Viendo: "Watching", Terminado: "Completed" } as Record<string, string>)[s] ?? s;
}

const getUnitLabel = (tab: AnimeType): string => (tab === "Manga" ? "Chapters" : "Episodes");

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='320' viewBox='0 0 220 320'%3E%3Crect width='220' height='320' fill='%23192030'/%3E%3Ctext x='110' y='170' text-anchor='middle' fill='%2330394d' font-size='48'%3E%3F%3C/text%3E%3C/svg%3E";

interface FormState {
    title: string;
    type: AnimeType;
    status: AnimeStatus;
    currentEp: number;
    totalEp: string | number;
    imgUrl: string;
    startDate: string;
    finishDate: string;
    description: string;
    isFocus: boolean;
}

const defaultForm = (type: AnimeType): FormState => ({
    title: "", type, status: "Pendiente", currentEp: 0, totalEp: "",
    imgUrl: "", startDate: "", finishDate: "", description: "", isFocus: false,
});

interface AddToVaultModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Anime) => void;
    initialData?: Partial<Anime> | null;
}

const AddToVaultModal = ({ isOpen, onClose, onSubmit, initialData = null }: AddToVaultModalProps) => {
    const [activeTab, setActiveTab] = useState<AnimeType>("Anime");
    const [useMAL, setUseMAL] = useState(false);
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [form, setForm] = useState<FormState>(defaultForm("Anime"));
    const [displayStudio, setDisplayStudio] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [posterOptions, setPosterOptions] = useState<{ es: string; en: string }>({ es: "", en: "" });
    const [posterLang, setPosterLang] = useState<"es" | "en">("es");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        if (initialData) {
            setActiveTab((initialData.type as AnimeType) || "Anime");
            setForm({ ...defaultForm((initialData.type as AnimeType) || "Anime"), ...initialData } as FormState);
            setDisplayStudio(""); setQuery(initialData.title || "");
            setSuggestions([]); setPosterOptions({ es: "", en: "" }); setPosterLang("es");
        } else {
            setActiveTab("Anime"); setForm(defaultForm("Anime")); setDisplayStudio("");
            setQuery(""); setSuggestions([]); setUseMAL(false);
            setPosterOptions({ es: "", en: "" }); setPosterLang("es");
        }
    }, [isOpen, initialData]);

    const handleTabChange = (tab: AnimeType) => {
        setActiveTab(tab); setForm(defaultForm(tab)); setDisplayStudio("");
        setQuery(""); setSuggestions([]); setUseMAL(false);
        setPosterOptions({ es: "", en: "" }); setPosterLang("es");
    };

    useEffect(() => {
        const doSearch = async () => {
            if (query.length < 3) { setSuggestions([]); setShowDropdown(false); return; }
            setSearching(true);
            try {
                let results: SearchResult[] = [];
                if (activeTab === "Manga") results = await searchMangaOnMAL(query);
                else if (activeTab === "Anime" && useMAL) results = await searchAnimeOnMAL(query);
                else results = await searchTMDBByType(query, activeTab);
                setSuggestions(results.slice(0, 8));
                setShowDropdown(results.length > 0);
            } catch (e) { console.error("Search error:", e); }
            finally { setSearching(false); }
        };
        const t = setTimeout(doSearch, 450);
        return () => clearTimeout(t);
    }, [query, activeTab, useMAL]);

    const selectSuggestion = useCallback((s: SearchResult) => {
        const esUrl = s.imgUrlEs || s.imgUrl || "";
        const enUrl = s.imgUrlEn || s.imgUrl || "";
        const hasBoth = esUrl && enUrl && esUrl !== enUrl;
        setPosterOptions(hasBoth ? { es: esUrl, en: enUrl } : { es: "", en: "" });
        setPosterLang("es");
        setQuery(s.title);
        setShowDropdown(false);
        setSuggestions([]);
        setDisplayStudio(s.studio || "");
        setForm((prev) => ({
            ...prev,
            title: s.title,
            type: (s.type as AnimeType) || activeTab,
            imgUrl: esUrl || enUrl || "",
            totalEp: s.totalEp ?? "",
            description: s.synopsis ? `${s.synopsis.substring(0, 200)}${s.synopsis.length > 200 ? "…" : ""}` : "",
            status: (s.tmdbStatus as AnimeStatus) || prev.status,
        }));
    }, [activeTab]);

    const switchPosterLang = (lang: "es" | "en") => {
        const url = lang === "es" ? posterOptions.es : posterOptions.en;
        if (!url) return;
        setPosterLang(lang);
        setForm(prev => ({ ...prev, imgUrl: url }));
    };

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const total = parseInt(String(form.totalEp)) || 0;
    const current = form.currentEp;
    const progress = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

    const adjustEp = (delta: number) => {
        const next = Math.max(0, current + delta);
        setForm((p) => ({ ...p, currentEp: total > 0 ? Math.min(next, total) : next }));
    };

    const handleSubmit = () => {
        if (!form.title.trim()) { inputRef.current?.focus(); return; }
        onSubmit({ ...form, type: activeTab } as Anime);
        onClose();
    };

    if (!isOpen) return null;

    const coverImg = form.imgUrl || PLACEHOLDER_IMG;
    const unitLabel = getUnitLabel(activeTab);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-4" style={{ background: "rgba(5,8,18,0.88)", backdropFilter: "blur(8px)" }}>
            <div className="relative w-full flex flex-col sm:flex-row rounded-2xl overflow-hidden shadow-2xl" style={{ maxWidth: 860, maxHeight: "92vh", background: "#10131f" }}>

                {/* ── LEFT PANEL ──────────────────────────────── */}
                <div className="relative flex-shrink-0 flex-col hidden sm:flex" style={{ width: 230 }}>
                    <div className="relative overflow-hidden flex-1" style={{ minHeight: 300 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={coverImg} alt={form.title || "Cover"} className="w-full h-full object-cover" style={{ minHeight: 300 }} onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }} />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #10131f 0%, transparent 55%)" }} />
                        {form.status && (
                            <div className="absolute top-3 left-3">
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: form.status === "Viendo" ? "rgba(99,102,241,0.9)" : form.status === "Terminado" ? "rgba(34,197,94,0.9)" : "rgba(71,85,105,0.85)", color: "#fff" }}>
                                    {getStatusLabel(form.status, activeTab)}
                                </span>
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-white font-black text-sm leading-tight" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
                                {form.title || <span className="opacity-30">No title yet</span>}
                            </p>
                        </div>
                    </div>
                    <div className="p-3 space-y-2" style={{ background: "#10131f" }}>
                        <div className="rounded-xl p-3" style={{ background: "#181c2e" }}>
                            <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#4b5572" }}>Total {unitLabel}</p>
                            <p className="text-sm font-black" style={{ color: "#e2e8f0" }}>{form.totalEp ? `${form.totalEp} ${unitLabel}` : <span style={{ color: "#2d3555" }}>—</span>}</p>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: "#181c2e" }}>
                            <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#4b5572" }}>{activeTab === "Manga" ? "Author" : "Studio / Author"}</p>
                            <p className="text-sm font-black" style={{ color: "#e2e8f0" }}>{displayStudio || <span style={{ color: "#2d3555" }}>—</span>}</p>
                        </div>
                        {posterOptions.es && posterOptions.en && (
                            <div className="flex gap-2">
                                {(["es", "en"] as const).map((lang) => (
                                    <button key={lang} type="button" onClick={() => switchPosterLang(lang)} className="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all" style={{ background: posterLang === lang ? "#4338ca" : "#181c2e", borderColor: posterLang === lang ? "#6366f1" : "#1a1f35", color: posterLang === lang ? "#e0e7ff" : "#4b5572" }}>
                                        {lang === "es" ? "🇪🇸 ES" : "🇺🇸 EN"}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT PANEL ──────────────────────────────── */}
                <div className="flex flex-col flex-1 overflow-y-auto min-h-0" style={{ background: "#10131f" }}>
                    {/* Mobile cover banner */}
                    {form.imgUrl && (
                        <div className="relative sm:hidden flex-shrink-0" style={{ height: 100 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={form.imgUrl} alt="" className="w-full h-full object-cover object-top" onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }} />
                            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #10131f 0%, rgba(16,19,31,0.4) 100%)" }} />
                            <div className="absolute bottom-2 left-4 right-12"><p className="text-white font-black text-sm truncate" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>{form.title}</p></div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 sm:px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid #1a1f35" }}>
                        <div className="flex items-center gap-2"><IconVault /><span className="text-sm font-black uppercase tracking-widest" style={{ color: "#e2e8f0" }}>{initialData ? "Edit Entry" : "Add to Vault"}</span></div>
                        <button onClick={onClose} className="rounded-full p-1.5 transition-colors" style={{ color: "#4b5572" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#94a3b8")} onMouseLeave={(e) => (e.currentTarget.style.color = "#4b5572")}><IconX /></button>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-1 px-4 sm:px-6 pt-4 flex-shrink-0">
                        {TABS.map(({ id, label, Icon }) => (
                            <button key={id} onClick={() => handleTabChange(id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all" style={activeTab === id ? { background: "#3730a3", color: "#c7d2fe" } : { background: "#181c2e", color: "#4b5572" }}>
                                <Icon />{label}
                            </button>
                        ))}
                    </div>

                    {/* Form body */}
                    <div className="flex-1 px-4 sm:px-6 py-4 space-y-4">
                        {/* Search */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#4b5572" }}>Search Database</label>
                                {activeTab === "Anime" && (
                                    <button type="button" onClick={() => setUseMAL(!useMAL)} className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full transition-all" style={useMAL ? { background: "rgba(14,165,233,0.15)", color: "#38bdf8", border: "1px solid rgba(14,165,233,0.3)" } : { background: "#181c2e", color: "#4b5572", border: "1px solid #1e2438" }}>
                                        {useMAL ? "● MAL" : "○ MAL"}
                                    </button>
                                )}
                            </div>
                            <div className="relative" ref={dropdownRef}>
                                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "#181c2e", border: "1px solid #1e2438" }}>
                                    <span style={{ color: "#4b5572" }}>{searching ? <span className="animate-spin inline-block text-xs">⟳</span> : <IconSearch />}</span>
                                    <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setForm((p) => ({ ...p, title: e.target.value })); }} placeholder="Search for a title…" className="flex-1 bg-transparent outline-none text-sm font-medium" style={{ color: "#e2e8f0" }} />
                                    {query && <button onClick={() => { setQuery(""); setForm((p) => ({ ...p, title: "" })); setSuggestions([]); }} style={{ color: "#4b5572" }}><IconX /></button>}
                                </div>
                                {showDropdown && suggestions.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden overflow-y-auto shadow-2xl" style={{ maxHeight: 240, background: "#181c2e", border: "1px solid #252b45" }}>
                                        {suggestions.map((s, i) => (
                                            <button key={i} type="button" onClick={() => selectSuggestion(s)} className="flex items-center gap-3 w-full p-2.5 text-left transition-colors" style={{ borderBottom: "1px solid #1a1f35" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#1e2438")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={s.imgUrl || PLACEHOLDER_IMG} alt="" className="w-8 h-11 object-cover rounded-md flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold truncate" style={{ color: "#c7d2fe" }}>{s.title}</p>
                                                    <p className="text-[10px] font-medium" style={{ color: "#4b5572" }}>{s.releaseYear}{s.score ? ` • ⭐ ${s.score}` : ""}{s.totalEp ? ` • ${s.totalEp} ${unitLabel}` : ""}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status + Progress */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#4b5572" }}>Status</label>
                                <select value={form.status} onChange={(e) => { const s = e.target.value as AnimeStatus; const today = new Date().toISOString().split("T")[0]; setForm((p) => ({ ...p, status: s, finishDate: s === "Terminado" ? (p.finishDate || today) : p.finishDate, currentEp: s === "Terminado" && total > 0 ? total : p.currentEp })); }} className="w-full rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition" style={{ background: "#181c2e", border: "1px solid #1e2438", color: "#e2e8f0" }}>
                                    {STATUS_OPTIONS.map((s) => <option key={s} value={s} style={{ background: "#181c2e" }}>{getStatusLabel(s, activeTab)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#4b5572" }}>Progress Tracker</label>
                                <div className="rounded-xl px-3 py-2" style={{ background: "#181c2e", border: "1px solid #1e2438" }}>
                                    <div className="flex items-center justify-between gap-2">
                                        <button type="button" onClick={() => adjustEp(-1)} className="w-7 h-7 rounded-full flex items-center justify-center text-base font-black transition-colors flex-shrink-0" style={{ background: "#1e2438", color: "#94a3b8" }}>−</button>
                                        <div className="flex items-center gap-1">
                                            <input type="number" value={form.currentEp} onChange={(e) => setForm((p) => ({ ...p, currentEp: Math.max(0, parseInt(e.target.value) || 0) }))} className="w-10 text-center bg-transparent outline-none text-base font-black" style={{ color: "#e2e8f0" }} min={0} />
                                            {form.totalEp && <span className="text-[10px] font-bold" style={{ color: "#4b5572" }}>/{form.totalEp}</span>}
                                        </div>
                                        <button type="button" onClick={() => adjustEp(1)} className="w-7 h-7 rounded-full flex items-center justify-center text-base font-black transition-colors flex-shrink-0" style={{ background: "#3730a3", color: "#c7d2fe" }}>+</button>
                                    </div>
                                    {total > 0 && (
                                        <div className="mt-1.5">
                                            <div className="h-1 rounded-full overflow-hidden" style={{ background: "#1e2438" }}>
                                                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)" }} />
                                            </div>
                                            <div className="flex justify-between mt-0.5">
                                                <span className="text-[8px] font-bold" style={{ color: "#4b5572" }}>{current}/{total}</span>
                                                <span className="text-[8px] font-bold" style={{ color: "#6366f1" }}>{progress}%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            {(["startDate", "finishDate"] as const).map((field) => (
                                <div key={field}>
                                    <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: field === "finishDate" && form.status !== "Terminado" ? "#2d3555" : "#4b5572" }}>{field === "startDate" ? "Start Date" : "Finish Date"}</label>
                                    <input type="date" value={(form[field] as string) || ""} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))} disabled={field === "finishDate" && form.status !== "Terminado"} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none disabled:opacity-30" style={{ background: "#181c2e", border: "1px solid #1e2438", color: form[field] ? "#e2e8f0" : "#4b5572", colorScheme: "dark" }} />
                                </div>
                            ))}
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#4b5572" }}>Private Notes</label>
                            <textarea value={form.description || ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Write down your theories, favorite moments, or reminders…" rows={4} className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none" style={{ background: "#181c2e", border: "1px solid #1e2438", color: "#94a3b8", lineHeight: "1.6" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#3730a3")} onBlur={(e) => (e.currentTarget.style.borderColor = "#1e2438")} />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid #1a1f35" }}>
                        <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors text-center" style={{ color: "#4b5572" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#94a3b8")} onMouseLeave={(e) => (e.currentTarget.style.color = "#4b5572")}>Cancel</button>
                        <button onClick={handleSubmit} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-95" style={{ background: "#3730a3", color: "#e0e7ff" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#4338ca")} onMouseLeave={(e) => (e.currentTarget.style.background = "#3730a3")}><IconVault />{initialData ? "Update Entry" : "Add to Vault"}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddToVaultModal;
