import { useMemo, useState, useEffect } from "react";
import Auth from "@/components/Auth";
import AddToVaultModal from "@/components/AddToVaultModal";
import ConfirmModal from "@/components/ConfirmModal";
import AnimeSections from "@/components/AnimeSections";
import ImportModal from "@/components/ImportModal";
import Sidebar from "@/components/Sidebar";
import RightPanel from "@/components/RightPanel";
import CurrentlyWatchingCard from "@/components/CurrentlyWatchingCard";
import RecentHistoryCard from "@/components/RecentHistoryCard";
import SettingsModal from "@/components/SettingsModal";
import MyListView from "@/components/MyListView";

import { useAuth } from "@/hooks/useAuth";
import { useAnimes } from "@/hooks/useAnimes";
import { useExportVault } from "@/hooks/useExportVault";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { getProfile } from "@/lib/profiles";
import type { Anime, ViewMode } from "@/types/anime";

const AnimeApp = () => {
    const { user, loading: authLoading } = useAuth();
    const { animes, createAnime, updateAnime, deleteAnime, deleteAllAnimes } = useAnimes(user);
    const { downloadTxt } = useExportVault(animes);
    const { viewMode, setViewMode, loading: prefsLoading } = useUserPreferences(user);

    const [activeView, setActiveView] = useState("home");
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editingAnime, setEditingAnime] = useState<Anime | null>(null);
    const [deletingAnimeId, setDeletingAnimeId] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        getProfile(user.id).then((profile) => {
            if (profile?.username) setUsername(profile.username);
        });
    }, [user]);

    const currentlyWatching = useMemo(() => animes.filter((a) => a.status === "Viendo").slice(0, 4), [animes]);

    const recentHistory = useMemo(() => {
        return [...animes]
            .sort((a, b) => {
                const da = new Date(a.finishDate || a.startDate || a.createdAt || 0).getTime();
                const db = new Date(b.finishDate || b.startDate || b.createdAt || 0).getTime();
                return db - da;
            })
            .slice(0, 8);
    }, [animes]);

    const stats = useMemo(() => ({
        total: animes.length,
        completed: animes.filter((a) => a.status === "Terminado").length,
        watching: animes.filter((a) => a.status === "Viendo").length,
        eps: animes.reduce((acc, curr) => acc + (curr.currentEp || 0), 0),
    }), [animes]);

    const viewFilteredAnimes = useMemo(() => {
        const typeMap: Record<string, string> = { movies: "Pelicula", tvshows: "Serie" };
        let filtered = animes;
        if (typeMap[activeView]) filtered = animes.filter((a) => a.type === typeMap[activeView]);
        if (searchTerm) filtered = filtered.filter((a) => a.title.toLowerCase().includes(searchTerm.toLowerCase()));
        return filtered;
    }, [animes, activeView, searchTerm]);

    const handleSubmit = async (data: Anime) => {
        if (editingAnime?.id) {
            await updateAnime(editingAnime.id, data);
        } else {
            await createAnime(data);
        }
        setIsModalOpen(false);
        setEditingAnime(null);
    };

    const handleBatchImport = async (importedAnimes: Partial<Anime>[]) => {
        for (const anime of importedAnimes) {
            const exists = animes.some((a) => a.title.toLowerCase() === (anime.title || "").toLowerCase());
            if (!exists) await createAnime(anime as Anime);
        }
    };

    const openEdit = (anime: Anime) => { setEditingAnime(anime); setIsModalOpen(true); };

    if (authLoading || prefsLoading) return null;
    if (!user) return <Auth />;

    return (
        <div className="flex min-h-screen bg-vaulty-bg">
            <Sidebar
                activeView={activeView}
                onNavigate={(view) => { setActiveView(view); setSearchTerm(""); }}
                username={username}
                onSettings={() => setIsSettingsOpen(true)}
                onAdd={() => { setEditingAnime(null); setIsModalOpen(true); }}
            />

            <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-6 min-w-0 pb-24 lg:pb-6">
                {/* Top bar */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6 sm:mb-8">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-vaulty-text">
                            {activeView === "home" ? `Welcome back, ${username ? username.charAt(0).toUpperCase() + username.slice(1) : (user?.email?.split("@")[0] || "there")}!`
                                : activeView === "movies" ? "Movies"
                                    : activeView === "tvshows" ? "TV Shows"
                                        : activeView === "mylist" ? "My List"
                                            : "Stats"}
                        </h2>
                        {activeView === "home" && <p className="text-sm text-vaulty-muted mt-1">{"Here's what you've been watching."}</p>}
                        {activeView === "mylist" && <p className="text-sm text-vaulty-muted mt-1">Manage {animes.length} items in your collection</p>}
                    </div>

                    <div className={`flex items-center gap-2 sm:gap-3 sm:w-auto sm:shrink-0 ${activeView === "mylist" ? "hidden sm:flex" : "flex w-full"}`}>
                        <div className="relative flex-1 sm:flex-none">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vaulty-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input type="text" value={searchTerm} placeholder="Search Vaulty..." onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 bg-vaulty-card border border-vaulty-border rounded-xl outline-none focus:ring-2 focus:ring-vaulty-accent/50 w-full sm:w-52 text-sm text-vaulty-text placeholder:text-vaulty-muted" />
                        </div>
                        <button onClick={() => { setEditingAnime(null); setIsModalOpen(true); }} className="px-3 sm:px-4 py-2 bg-vaulty-accent hover:bg-vaulty-accent-hover text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-vaulty-accent/20 shrink-0">+ Add</button>
                    </div>
                </div>

                {/* Home Dashboard */}
                {activeView === "home" && (
                    <div className="space-y-8">
                        {currentlyWatching.length > 0 && (
                            <section>
                                <h3 className="text-base font-bold text-vaulty-text mb-4">Currently Watching</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {currentlyWatching.map((anime) => <div key={anime.id} onClick={() => openEdit(anime)} className="cursor-pointer"><CurrentlyWatchingCard anime={anime} /></div>)}
                                </div>
                            </section>
                        )}
                        {recentHistory.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold text-vaulty-text">Recent History</h3>
                                    <button onClick={() => setActiveView("mylist")} className="text-xs text-vaulty-accent hover:text-vaulty-text font-semibold transition-colors">View All</button>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                    {recentHistory.map((anime) => <div key={anime.id} onClick={() => openEdit(anime)} className="cursor-pointer"><RecentHistoryCard anime={anime} /></div>)}
                                </div>
                            </section>
                        )}
                        {animes.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-vaulty-card border border-vaulty-border flex items-center justify-center mb-4"><svg className="w-8 h-8 text-vaulty-muted" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg></div>
                                <p className="text-vaulty-text font-bold text-sm mb-1">Your vault is empty</p>
                                <p className="text-vaulty-muted text-xs mb-4">Add your first title to get started</p>
                                <button onClick={() => { setEditingAnime(null); setIsModalOpen(true); }} className="px-4 py-2 bg-vaulty-accent hover:bg-vaulty-accent-hover text-white rounded-xl text-sm font-bold transition-all">+ Add Title</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Stats View */}
                {activeView === "stats" && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[{ label: "Total Titles", value: stats.total, color: "text-vaulty-accent" }, { label: "Completed", value: stats.completed, color: "text-emerald-400" }, { label: "Watching", value: stats.watching, color: "text-amber-400" }, { label: "Total Episodes", value: stats.eps, color: "text-blue-400" }].map((s) => (
                                <div key={s.label} className="bg-vaulty-card rounded-2xl p-5 border border-vaulty-border">
                                    <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                                    <p className="text-vaulty-muted text-xs font-semibold mt-1 uppercase tracking-wider">{s.label}</p>
                                </div>
                            ))}
                        </div>
                        <div className="bg-vaulty-card rounded-2xl p-5 border border-red-900/30">
                            <p className="text-sm font-bold text-vaulty-text mb-3">Danger Zone</p>
                            <div className="flex items-center gap-4 flex-wrap">
                                <button onClick={() => { if (window.confirm("Are you sure? This will delete your ENTIRE Vaulty database.")) deleteAllAnimes(); }} className="text-xs font-bold text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-500/50 px-3 py-2 rounded-xl transition-all">Delete All</button>
                                <button onClick={downloadTxt} className="text-xs font-bold text-vaulty-muted hover:text-vaulty-text border border-vaulty-border px-3 py-2 rounded-xl transition-all">Export List</button>
                                <div className="flex gap-2 ml-auto">
                                    {(['list', 'grid'] as ViewMode[]).map((mode) => (
                                        <button key={mode} onClick={() => setViewMode(mode)} className={`p-2 rounded-lg text-sm transition-all border ${viewMode === mode ? "bg-vaulty-accent text-white border-vaulty-accent" : "text-vaulty-muted border-vaulty-border hover:text-vaulty-text"}`}>
                                            {mode === 'list' ? '☰ List' : '⊞ Grid'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* My List View */}
                {activeView === "mylist" && (
                    <MyListView animes={animes} searchTerm={searchTerm} onEdit={(anime) => { setEditingAnime(anime); setIsModalOpen(true); }} onDelete={setDeletingAnimeId} />
                )}

                {/* Filtered Views */}
                {["movies", "tvshows"].includes(activeView) && (
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            {(['list', 'grid'] as ViewMode[]).map((mode) => (
                                <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${viewMode === mode ? "bg-vaulty-accent text-white border-vaulty-accent" : "text-vaulty-muted border-vaulty-border hover:text-vaulty-text"}`}>
                                    {mode === 'list' ? '☰ List' : '⊞ Grid'}
                                </button>
                            ))}
                            <span className="text-vaulty-muted text-xs ml-2">{viewFilteredAnimes.length} titles</span>
                        </div>
                        <AnimeSections animes={viewFilteredAnimes} viewMode={viewMode} onEdit={(anime) => { setEditingAnime(anime); setIsModalOpen(true); }} onDelete={setDeletingAnimeId} />
                    </div>
                )}
            </main>

            <RightPanel animes={animes} onEdit={openEdit} />

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={user} username={username} onOpenImport={() => { setIsSettingsOpen(false); setIsImportModalOpen(true); }} />

            <AddToVaultModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingAnime(null); }} initialData={editingAnime} onSubmit={handleSubmit} />

            {isImportModalOpen && <ImportModal existingAnimes={animes} onImport={handleBatchImport} onClose={() => setIsImportModalOpen(false)} />}

            <ConfirmModal isOpen={!!deletingAnimeId} onClose={() => setDeletingAnimeId(null)} onConfirm={async () => { const id = deletingAnimeId; setDeletingAnimeId(null); if (id) await deleteAnime(id); }} title={animes.find((a) => a.id === deletingAnimeId)?.title || "este anime"} />
        </div>
    );
};

export default AnimeApp;
