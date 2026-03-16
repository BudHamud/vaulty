'use client'

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import type { Anime, AnimeStatus } from "@/types/anime";

const STATUS_DOT: Record<AnimeStatus, string> = {
    Terminado: "#22c55e",
    Viendo: "#f59e0b",
    Pendiente: "#6366f1",
};

interface FilterDropdownProps {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (val: string) => void;
}

const FilterDropdown = ({ label, value, options, onChange }: FilterDropdownProps) => (
    <div className="relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="appearance-none pl-3 pr-7 py-1.5 rounded-lg text-xs font-bold border cursor-pointer outline-none transition-all"
            style={{ background: value !== "all" ? "#3730a3" : "#181c2e", borderColor: value !== "all" ? "#6366f1" : "#252738", color: value !== "all" ? "#e0e7ff" : "#6b7280" }}
        >
            <option value="all">{label}</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: value !== "all" ? "#e0e7ff" : "#6b7280" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    </div>
);

interface PosterCardProps {
    anime: Anime;
    onEdit: (anime: Anime) => void;
    onDelete: (id: string) => void;
}

const PosterCard = ({ anime, onEdit, onDelete }: PosterCardProps) => {
    const year = anime.releaseYear || anime.startDate?.split("-")[0] || "";
    const typeLabel = ({ Pelicula: "Movie", Serie: "TV Series", Anime: "Anime", Manga: "Manga" } as Record<string, string>)[anime.type] || anime.type;

    return (
        <motion.div whileHover={{ y: -4, transition: { duration: 0.18 } }} className="group relative cursor-pointer rounded-xl overflow-hidden flex flex-col" style={{ background: "#181c2e" }} onClick={() => onEdit(anime)}>
            <div className="relative overflow-hidden" style={{ paddingBottom: "148%", background: "#0d0e1a" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={anime.imgUrl || "https://placehold.co/220x320/0d0e1a/252738?text=?"} alt={anime.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/220x320/0d0e1a/252738?text=?"; }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,12,22,0.85) 0%, transparent 50%)" }} />

                {(anime.score ?? 0) > 0 && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)", color: "#fbbf24" }}>
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        {Number(anime.score).toFixed(1)}
                    </div>
                )}
                {anime.isFocus && <div className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md" style={{ background: "rgba(99,102,241,0.9)", color: "#fff" }}>Airing</div>}

                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: "rgba(0,0,0,0.45)" }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(anime); }} className="w-8 h-8 rounded-full flex items-center justify-center transition-all" style={{ background: "rgba(99,102,241,0.85)", color: "#fff" }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(anime.id!); }} className="w-8 h-8 rounded-full flex items-center justify-center transition-all" style={{ background: "rgba(239,68,68,0.85)", color: "#fff" }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full border-2" style={{ background: STATUS_DOT[anime.status] || "#6b7280", borderColor: "#181c2e" }} />
            </div>
            <div className="px-2 pt-2 pb-3">
                <p className="text-xs font-black text-white leading-tight truncate mb-0.5">{anime.title}</p>
                <p className="text-[10px] font-semibold truncate" style={{ color: "#6c5ce7" }}>{[year, typeLabel].filter(Boolean).join(" • ")}</p>
            </div>
        </motion.div>
    );
};

type SortOption = "recent" | "year" | "alpha" | "rating";
type ViewModeLocal = "grid" | "list";

interface MyListViewProps {
    animes: Anime[];
    onEdit: (anime: Anime) => void;
    onDelete: (id: string) => void;
    searchTerm?: string;
}

const MyListView = ({ animes, onEdit, onDelete, searchTerm: externalSearch = "" }: MyListViewProps) => {
    const [mobileSearch, setMobileSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [ratingFilter, setRatingFilter] = useState("all");
    const [sortBy, setSortBy] = useState<SortOption>("recent");
    const [viewMode, setViewMode] = useState<ViewModeLocal>("grid");

    const activeSearch = mobileSearch || externalSearch;

    const filtered = useMemo(() => {
        let list = [...animes];
        if (activeSearch) list = list.filter((a) => a.title.toLowerCase().includes(activeSearch.toLowerCase()));
        if (typeFilter !== "all") list = list.filter((a) => a.type === typeFilter);
        if (statusFilter !== "all") list = list.filter((a) => a.status === statusFilter);
        if (ratingFilter !== "all") { const min = Number(ratingFilter); list = list.filter((a) => Number(a.score) >= min); }

        if (sortBy === "recent") {
            list.sort((a, b) => {
                const da = new Date(a.finishDate || a.startDate || a.createdAt || 0).getTime();
                const db = new Date(b.finishDate || b.startDate || b.createdAt || 0).getTime();
                return db - da;
            });
        } else if (sortBy === "year") {
            list.sort((a, b) => Number(b.releaseYear || b.startDate?.split("-")[0] || 0) - Number(a.releaseYear || a.startDate?.split("-")[0] || 0));
        } else if (sortBy === "alpha") {
            list.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortBy === "rating") {
            list.sort((a, b) => Number(b.score) - Number(a.score));
        }
        return list;
    }, [animes, activeSearch, typeFilter, statusFilter, ratingFilter, sortBy]);

    const hasFilters = typeFilter !== "all" || statusFilter !== "all" || ratingFilter !== "all";
    const clearFilters = () => { setTypeFilter("all"); setStatusFilter("all"); setRatingFilter("all"); };

    const mobileChips = [
        { id: "all", label: "All" },
        { id: "Viendo", label: "Watching" },
        { id: "Terminado", label: "Completed" },
        { id: "Pendiente", label: "Pending" },
        { id: "Anime", label: "Anime", isType: true },
        { id: "Pelicula", label: "Movie", isType: true },
        { id: "Serie", label: "TV Series", isType: true },
    ];

    return (
        <div className="space-y-5">
            {/* Mobile filters */}
            <div className="sm:hidden space-y-3">
                <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#4b5572" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" value={mobileSearch} placeholder="Search your library..." onChange={(e) => setMobileSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-semibold outline-none" style={{ background: "#181c2e", color: "#e2e8f0", border: "1px solid #252738" }} />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {mobileChips.map((chip) => {
                        const isActive = chip.isType ? typeFilter === chip.id : (chip.id === "all" ? (statusFilter === "all" && typeFilter === "all") : statusFilter === chip.id);
                        return (
                            <button key={chip.id} onClick={() => { if (chip.id === "all") { setStatusFilter("all"); setTypeFilter("all"); } else if (chip.isType) setTypeFilter(chip.id === typeFilter ? "all" : chip.id); else setStatusFilter(chip.id === statusFilter ? "all" : chip.id); }} className="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all" style={{ background: isActive ? "#4338ca" : "transparent", borderColor: isActive ? "#6366f1" : "#252738", color: isActive ? "#e0e7ff" : "#6b7280" }}>
                                {chip.label}
                            </button>
                        );
                    })}
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: "#6b7280" }}>{filtered.length} items</span>
                    <div className="flex gap-1">
                        {(['grid', 'list'] as ViewModeLocal[]).map((mode) => (
                            <button key={mode} onClick={() => setViewMode(mode)} className="p-1.5 rounded-lg transition-all" style={{ background: viewMode === mode ? "#4338ca" : "#181c2e", color: viewMode === mode ? "#e0e7ff" : "#4b5572" }}>
                                {mode === 'grid'
                                    ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                    : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                                }
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Desktop filter bar */}
            <div className="hidden sm:flex sticky top-0 z-20 rounded-xl px-3 py-2.5 flex-wrap items-center gap-2" style={{ background: "rgba(19,20,31,0.92)", backdropFilter: "blur(10px)", borderBottom: "1px solid #252738" }}>
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                    <FilterDropdown label="Genre ▾" value={typeFilter} onChange={setTypeFilter} options={[{ value: "Anime", label: "Anime" }, { value: "Pelicula", label: "Movie" }, { value: "Serie", label: "TV Series" }, { value: "Manga", label: "Manga" }]} />
                    <FilterDropdown label="Status ▾" value={statusFilter} onChange={setStatusFilter} options={[{ value: "Viendo", label: "Watching" }, { value: "Terminado", label: "Completed" }, { value: "Pendiente", label: "Planning" }]} />
                    <FilterDropdown label="Rating ▾" value={ratingFilter} onChange={setRatingFilter} options={[{ value: "9", label: "9+" }, { value: "8", label: "8+" }, { value: "7", label: "7+" }, { value: "6", label: "6+" }]} />
                    <div className="flex items-center gap-1 ml-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider mr-1" style={{ color: "#4b5572" }}>Sort By:</span>
                        {([{ id: "recent" as SortOption, label: "Recently Added" }, { id: "year" as SortOption, label: "Release Date" }, { id: "alpha" as SortOption, label: "Alphabetical" }, { id: "rating" as SortOption, label: "Rating" }]).map((s) => (
                            <button key={s.id} onClick={() => setSortBy(s.id)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all" style={{ background: sortBy === s.id ? "#4338ca" : "transparent", borderColor: sortBy === s.id ? "#6366f1" : "transparent", color: sortBy === s.id ? "#e0e7ff" : "#4b5572" }}>{s.label}</button>
                        ))}
                    </div>
                    {hasFilters && <button onClick={clearFilters} className="text-[10px] font-bold px-2 py-1 rounded-lg transition-all" style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)" }}>Clear</button>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-bold" style={{ color: "#4b5572" }}>{filtered.length} titles</span>
                    <div className="flex gap-1">
                        {(['grid', 'list'] as ViewModeLocal[]).map((mode) => (
                            <button key={mode} onClick={() => setViewMode(mode)} className="px-2.5 py-1 rounded-lg text-xs font-bold border transition-all capitalize" style={{ background: viewMode === mode ? "#4338ca" : "transparent", borderColor: viewMode === mode ? "#6366f1" : "#252738", color: viewMode === mode ? "#e0e7ff" : "#4b5572" }}>{mode}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <p className="text-sm font-bold" style={{ color: "#e2e8f0" }}>No titles found</p>
                    <p className="text-xs mt-1" style={{ color: "#4b5572" }}>Try adjusting your filters</p>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-4">
                    {filtered.map((anime) => <PosterCard key={anime.id} anime={anime} onEdit={onEdit} onDelete={onDelete} />)}
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((anime) => {
                        const year = anime.releaseYear || anime.startDate?.split("-")[0] || "";
                        const typeLabel = ({ Pelicula: "Movie", Serie: "TV Series", Anime: "Anime", Manga: "Manga" } as Record<string, string>)[anime.type] || anime.type;
                        return (
                            <div key={anime.id} className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer group transition-all" style={{ background: "#181c2e" }} onClick={() => onEdit(anime)}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={anime.imgUrl || "https://placehold.co/40x56/0d0e1a/252738?text=?"} alt={anime.title} className="w-10 h-14 object-cover rounded-lg shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/40x56/0d0e1a/252738?text=?"; }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-white truncate">{anime.title}</p>
                                    <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#6c5ce7" }}>{[year, typeLabel].filter(Boolean).join(" • ")}</p>
                                </div>
                                {(anime.score ?? 0) > 0 && <span className="text-xs font-black shrink-0" style={{ color: "#fbbf24" }}>★ {Number(anime.score).toFixed(1)}</span>}
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_DOT[anime.status] || "#6b7280" }} />
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={(e) => { e.stopPropagation(); onEdit(anime); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all" style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1" }}>✎</button>
                                    <button onClick={(e) => { e.stopPropagation(); onDelete(anime.id!); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>✕</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyListView;
