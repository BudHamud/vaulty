import { useMemo } from "react";
import type { Anime, AnimeType } from "@/types/anime";

interface RightPanelProps {
    animes: Anime[];
    onEdit: (anime: Anime) => void;
}

export default function RightPanel({ animes, onEdit }: RightPanelProps) {
    const stats = useMemo(() => {
        const completed = animes.filter((a) => a.status === "Terminado");
        const watching = animes.filter((a) => a.status === "Viendo");
        const totalEps = animes.reduce((acc, a) => acc + (a.currentEp || 0), 0);
        const totalHours = Math.round((totalEps * 24) / 60);

        const typeCounts = animes.reduce<Record<string, number>>((acc, a) => {
            acc[a.type] = (acc[a.type] || 0) + 1;
            return acc;
        }, {});
        const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

        const typeLabels: Record<AnimeType, string> = {
            Anime: "Anime",
            Serie: "TV Series",
            Pelicula: "Movies",
            Manga: "Manga",
        };

        return {
            total: animes.length,
            completed: completed.length,
            watching: watching.length,
            totalHours,
            topType: typeLabels[topType as AnimeType] || topType,
        };
    }, [animes]);

    const recommendations = useMemo(() => {
        return animes
            .filter((a) => a.status === "Pendiente")
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 4);
    }, [animes]);

    return (
        <aside className="hidden xl:flex w-64 shrink-0 flex-col gap-5 py-6 pr-4">
            {/* Watch Stats */}
            <div>
                <h2 className="text-sm font-bold text-vaulty-text mb-3">Watch Stats</h2>

                <div className="bg-vaulty-accent rounded-2xl p-4 mb-3 flex items-center gap-3">
                    <div className="bg-white/20 rounded-xl p-2">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wider">Total Watched</p>
                        <p className="text-white text-2xl font-black leading-none">
                            {stats.totalHours} <span className="text-sm font-semibold">hrs</span>
                        </p>
                    </div>
                </div>

                <div className="bg-vaulty-card rounded-2xl p-4 border border-vaulty-border flex items-center gap-3">
                    <div className="bg-vaulty-border rounded-xl p-2">
                        <svg className="w-5 h-5 text-vaulty-muted" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-vaulty-muted text-[10px] font-semibold uppercase tracking-wider">Top Genre</p>
                        <p className="text-vaulty-text text-sm font-bold">{stats.topType}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                    {[
                        { label: "Total", value: stats.total },
                        { label: "Done", value: stats.completed },
                        { label: "Watching", value: stats.watching },
                    ].map((s) => (
                        <div key={s.label} className="bg-vaulty-card rounded-xl p-3 text-center border border-vaulty-border">
                            <p className="text-vaulty-text font-black text-base">{s.value}</p>
                            <p className="text-vaulty-muted text-[10px] font-medium">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {recommendations.length > 0 && (
                <div>
                    <h2 className="text-sm font-bold text-vaulty-text mb-3">Recommended for You</h2>
                    <div className="flex flex-col gap-2">
                        {recommendations.map((anime) => (
                            <div
                                key={anime.id}
                                className="flex items-center gap-3 bg-vaulty-card rounded-xl p-3 border border-vaulty-border hover:border-vaulty-accent/50 transition-colors group"
                            >
                                <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-vaulty-border">
                                    <img
                                        src={anime.imgUrl || "https://placehold.co/40x56/1a1b2e/6c5ce7?text=?"}
                                        alt={anime.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-vaulty-text truncate">{anime.title}</p>
                                    <p className="text-[10px] text-vaulty-muted mt-0.5 truncate">
                                        {anime.type}
                                        {(anime.score ?? 0) > 0 ? ` · ★ ${anime.score}` : ""}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onEdit(anime)}
                                    className="w-7 h-7 rounded-full bg-vaulty-border hover:bg-vaulty-accent flex items-center justify-center text-vaulty-muted hover:text-white transition-all shrink-0"
                                >
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    );
}
