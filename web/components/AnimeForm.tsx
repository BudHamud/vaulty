'use client'

import React, { useState, useEffect } from "react";
import { searchAnimeOnMAL, searchOnTMDB } from "@/lib/api";
import type { Anime, AnimeStatus, AnimeType, SearchResult } from "@/types/anime";

type SearchDb = 'MAL' | 'TMDB';

interface FormState {
    title: string;
    status: AnimeStatus;
    type: AnimeType;
    description: string;
    currentEp: number;
    totalEp: string | number;
    imgUrl: string;
    startDate: string;
    finishDate: string;
    isFocus: boolean;
    score: number;
    releaseYear: string;
}

interface AnimeFormProps {
    onSubmit: (form: FormState) => void;
    initialData?: Partial<Anime> | null;
}

const AnimeForm = ({ onSubmit, initialData = null }: AnimeFormProps) => {
    const today = new Date().toISOString().split("T")[0];
    const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [shouldSearch, setShouldSearch] = useState(true);
    const [searchDatabase, setSearchDatabase] = useState<SearchDb>("MAL");
    const [posterOptions, setPosterOptions] = useState<{ es: string; en: string }>({ es: '', en: '' });
    const [posterLang, setPosterLang] = useState<'es' | 'en'>('es');

    const [form, setForm] = useState<FormState>({
        title: "", status: "Viendo", type: "Anime", description: "", currentEp: 0,
        totalEp: "", imgUrl: "", startDate: today, finishDate: "", isFocus: false, score: 0, releaseYear: "",
    });

    useEffect(() => {
        if (initialData) {
            setForm({ ...form, ...initialData } as FormState);
        } else {
            setForm({ title: "", status: "Viendo", type: "Anime", description: "", currentEp: 0, totalEp: "", imgUrl: "", startDate: today, finishDate: "", isFocus: false, score: 0, releaseYear: "" });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData]);

    useEffect(() => {
        if (!shouldSearch) { setShouldSearch(true); return; }
        const delayDebounce = setTimeout(async () => {
            if (form.title.length > 3 && !initialData) {
                setLoading(true);
                let results: SearchResult[] = [];
                try {
                    if (form.type === "Serie" || form.type === "Pelicula") {
                        const tmdbResults = await searchOnTMDB(form.title);
                        results = tmdbResults.filter((item) => {
                            if (form.type === "Serie") return item.type === "Serie";
                            if (form.type === "Pelicula") return item.type === "Pelicula";
                            return true;
                        });
                    } else {
                        results = searchDatabase === "MAL" ? await searchAnimeOnMAL(form.title) : await searchOnTMDB(form.title);
                    }
                } catch (error) { console.error("[AnimeForm] Search error:", error); results = []; }
                setSuggestions(results);
                setLoading(false);
            } else { setSuggestions([]); }
        }, 500);
        return () => clearTimeout(delayDebounce);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.title, form.type, searchDatabase, initialData]);

    const handleStatusChange = (newStatus: AnimeStatus) => {
        let updates: Partial<FormState> = { status: newStatus };
        if (newStatus === "Terminado") {
            updates.finishDate = form.finishDate || today;
            if (form.totalEp && form.totalEp !== "??") updates.currentEp = parseInt(String(form.totalEp));
        } else {
            updates.finishDate = "";
        }
        setForm({ ...form, ...updates });
    };

    const selectSuggestion = (s: SearchResult) => {
        setShouldSearch(false);
        setSuggestions([]);
        const esUrl = s.imgUrlEs || s.imgUrl || '';
        const enUrl = s.imgUrlEn || s.imgUrl || '';
        setPosterOptions({ es: esUrl, en: enUrl });
        setPosterLang('es');
        setForm((prev) => ({
            ...prev, title: s.title, imgUrl: esUrl, totalEp: s.totalEp || "??",
            score: s.score || 0, releaseYear: String(s.releaseYear || ""),
            description: s.synopsis?.substring(0, 200) || "",
        }));
    };

    const switchPosterLang = (lang: 'es' | 'en') => {
        const url = lang === 'es' ? posterOptions.es : posterOptions.en;
        if (!url) return;
        setPosterLang(lang);
        setForm(prev => ({ ...prev, imgUrl: url }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        onSubmit(form);
    };

    const progress = form.totalEp && form.totalEp !== '??' ? Math.round((form.currentEp / parseInt(String(form.totalEp))) * 100) : 0;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-6xl mx-auto">
            {/* MEDIA TYPE */}
            <div className="grid grid-cols-3 gap-2">
                {["Anime", "Movie", "Series"].map((type) => (
                    <button key={type} type="button" onClick={() => setForm({ ...form, type: type === "Movie" ? "Pelicula" : type === "Series" ? "Serie" : type as AnimeType })}
                        className={`py-3 px-4 rounded-lg text-sm font-bold transition-all ${(form.type === type || (type === "Movie" && form.type === "Pelicula") || (type === "Series" && form.type === "Serie")) ? "bg-indigo-600 text-white shadow-lg" : "bg-vaulty-card text-vaulty-muted hover:bg-vaulty-card-hover border border-vaulty-border"}`}>
                        {type}
                    </button>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row items-start gap-6">
                {/* LEFT COLUMN */}
                <div className="hidden lg:block w-64 flex-shrink-0 space-y-3">
                    {form.imgUrl ? (
                        <div className="relative group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={form.imgUrl} alt={form.title || "Preview"} className="w-full max-h-80 rounded-xl shadow-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            {form.isFocus && <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-black px-2 py-1 rounded-full uppercase tracking-wider">Airing</div>}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 rounded-b-xl">
                                <h3 className="text-white font-black text-base leading-tight">{form.title || "Title"}</h3>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-80 bg-vaulty-card rounded-xl flex items-center justify-center border-2 border-dashed border-vaulty-border"><p className="text-vaulty-muted text-sm">No image</p></div>
                    )}
                    {(posterOptions.es || posterOptions.en) && (
                        <div className="flex gap-2">
                            {(['es', 'en'] as const).map((lang) => (
                                <button key={lang} type="button" onClick={() => switchPosterLang(lang)} disabled={!posterOptions[lang]}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${posterLang === lang ? 'bg-vaulty-accent border-vaulty-accent text-white' : 'bg-vaulty-card border-vaulty-border text-vaulty-muted hover:border-vaulty-accent/50 disabled:opacity-30 disabled:cursor-not-allowed'}`}>
                                    {lang === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="bg-vaulty-card rounded-xl p-3 border border-vaulty-border space-y-2">
                        <div>
                            <p className="text-xs font-black text-vaulty-muted uppercase mb-1">Total Content</p>
                            <p className="text-white font-bold text-xl">{form.totalEp || '??'} Episodes</p>
                        </div>
                        {((form.score ?? 0) > 0 || form.releaseYear) && (
                            <div className="pt-2 border-t border-vaulty-border grid grid-cols-2 gap-2">
                                {(form.score ?? 0) > 0 && <div><p className="text-[10px] font-black text-vaulty-muted uppercase mb-0.5">Score</p><p className="text-white font-bold text-base">{form.score}/10</p></div>}
                                {form.releaseYear && <div><p className="text-[10px] font-black text-vaulty-muted uppercase mb-0.5">Year</p><p className="text-white font-bold text-base">{form.releaseYear}</p></div>}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="flex-1 space-y-4 w-full">
                    <div>
                        <label className="text-xs font-black text-vaulty-muted uppercase tracking-wider mb-2 block">Search Database</label>
                        <div className="flex gap-3 items-start">
                            {form.imgUrl && (
                                <div className="lg:hidden flex-shrink-0 space-y-1">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={form.imgUrl} alt={form.title || "Preview"} className="w-16 h-24 object-cover rounded-lg shadow-md" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    {(posterOptions.es || posterOptions.en) && (
                                        <div className="flex gap-1">
                                            {(['es', 'en'] as const).map(lang => (
                                                <button key={lang} type="button" onClick={() => switchPosterLang(lang)} disabled={!posterOptions[lang]}
                                                    className={`flex-1 py-0.5 rounded text-[10px] font-bold border transition-all ${posterLang === lang ? 'bg-vaulty-accent border-vaulty-accent text-white' : 'bg-vaulty-card border-vaulty-border text-vaulty-muted disabled:opacity-30'}`}>
                                                    {lang.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex-1 space-y-2">
                                <div className="relative">
                                    <input type="text" placeholder="Search for a title..." className="w-full p-3 pl-10 bg-vaulty-card border border-vaulty-border rounded-xl text-sm text-white placeholder:text-vaulty-muted outline-none focus:ring-2 focus:ring-vaulty-accent/50" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                                    <svg className="absolute left-3 top-3.5 w-4 h-4 text-vaulty-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    {loading && <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                                </div>
                                {form.type === "Anime" && (
                                    <div className="flex gap-2 mt-2">
                                        {(["MAL", "TMDB"] as SearchDb[]).map((db) => (
                                            <button key={db} type="button" onClick={() => setSearchDatabase(db)} className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${searchDatabase === db ? "bg-indigo-600 border-indigo-500 text-white" : "bg-vaulty-card border-vaulty-border text-vaulty-muted"}`}>
                                                {db === "MAL" ? "Jikan (MAL)" : db}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {suggestions.length > 0 && (
                                    <div className="mt-2 max-h-48 overflow-y-auto space-y-1 bg-vaulty-card p-2 rounded-xl border border-vaulty-border">
                                        {suggestions.map((s, i) => (
                                            <button key={i} type="button" onClick={() => selectSuggestion(s)} className="w-full text-left p-2 hover:bg-vaulty-card-hover rounded-lg transition-colors flex gap-3 items-center">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                {s.imgUrl && <img src={s.imgUrl} alt={s.title} className="w-10 h-14 object-cover rounded" />}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white truncate">{s.title}</p>
                                                    <p className="text-xs text-vaulty-muted">{s.releaseYear} • {s.score}/10</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status & Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-black text-vaulty-muted uppercase mb-2 block">Status</label>
                            <select className="w-full p-3 bg-vaulty-card border border-vaulty-border rounded-xl text-sm font-bold text-white cursor-pointer" value={form.status} onChange={(e) => handleStatusChange(e.target.value as AnimeStatus)}>
                                <option value="Pendiente">Planning</option>
                                <option value="Viendo">Watching</option>
                                <option value="Terminado">Completed</option>
                            </select>
                        </div>
                        {(['startDate', 'finishDate'] as const).map((field) => (
                            <div key={field}>
                                <label className="text-xs font-black text-vaulty-muted uppercase mb-2 block">{field === 'startDate' ? 'Start Date' : 'Finish Date'}</label>
                                <input type="date" className="w-full p-3 bg-vaulty-card border border-vaulty-border rounded-xl text-sm text-white disabled:opacity-30 disabled:cursor-not-allowed" value={(form[field] as string) || ''} disabled={field === 'finishDate' && form.status !== 'Terminado'} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
                            </div>
                        ))}
                    </div>

                    {/* Progress */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-black text-vaulty-muted uppercase">Progress</label>
                            <span className="text-xs text-indigo-400 font-bold">{progress}%</span>
                        </div>
                        <div className="flex gap-2 md:gap-3 items-center">
                            <button type="button" onClick={() => setForm({ ...form, currentEp: Math.max(0, form.currentEp - 1) })} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-vaulty-card hover:bg-vaulty-card-hover rounded-lg text-white font-bold transition-colors border border-vaulty-border text-sm">−</button>
                            <input type="number" className="w-16 md:w-20 p-2 md:p-3 bg-vaulty-card border border-vaulty-border rounded-lg text-center text-sm font-bold text-white" value={form.currentEp} onChange={(e) => setForm({ ...form, currentEp: parseInt(e.target.value) || 0 })} />
                            <button type="button" onClick={() => setForm({ ...form, currentEp: form.currentEp + 1 })} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold transition-colors text-sm">+</button>
                            <div className="flex-1 bg-vaulty-card-hover rounded-full h-2 md:h-2.5 overflow-hidden"><div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} /></div>
                            <span className="hidden sm:inline text-xs font-bold text-vaulty-muted min-w-[80px] text-right">{form.currentEp} / {form.totalEp || '??'}</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-black text-vaulty-muted uppercase mb-2 block">Notes</label>
                        <textarea className="w-full p-3 bg-vaulty-card border border-vaulty-border rounded-xl text-sm text-white placeholder:text-vaulty-muted resize-none outline-none focus:ring-2 focus:ring-vaulty-accent/50" rows={3} placeholder="Your thoughts..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => window.location.reload()} className="px-6 py-3 bg-vaulty-card hover:bg-vaulty-card-hover text-slate-300 font-bold text-sm rounded-xl transition-all border border-vaulty-border">Cancel</button>
                        <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-wider py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/50 active:scale-95">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            {initialData ? "Update" : "Add to Vault"}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default AnimeForm;
