import type { Anime } from "@/types/anime";

export default function CurrentlyWatchingCard({ anime }: { anime: Anime }) {
    const progress =
        anime.totalEp && anime.currentEp
            ? Math.round((anime.currentEp / Number(anime.totalEp)) * 100)
            : null;

    const typeLabel = ({
        Anime: "EP",
        Serie: "EP",
        Pelicula: "MIN",
    } as Record<string, string>)[anime.type] || "EP";

    return (
        <div className="bg-vaulty-card rounded-2xl overflow-hidden border border-vaulty-border flex gap-4 p-4 hover:bg-vaulty-card-hover transition-colors group">
            {/* Poster */}
            <div className="w-20 h-24 shrink-0 rounded-xl overflow-hidden bg-vaulty-border">
                <img
                    src={anime.imgUrl || "https://placehold.co/80x96/1a1b2e/6c5ce7?text=?"}
                    alt={anime.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
            </div>

            {/* Info */}
            <div className="flex flex-col justify-between flex-1 min-w-0">
                <div>
                    <h3 className="font-bold text-vaulty-text text-sm truncate mb-1">
                        {anime.title}
                    </h3>
                    <p className="text-xs text-vaulty-muted">
                        {typeLabel} {anime.currentEp}
                        {anime.totalEp ? ` • ${Number(anime.totalEp) - anime.currentEp} left` : ""}
                    </p>
                </div>

                {/* Progress bar */}
                <div>
                    <div className="w-full h-1.5 bg-vaulty-border rounded-full overflow-hidden mt-2">
                        <div
                            className="h-full bg-vaulty-accent rounded-full transition-all"
                            style={{ width: `${progress ?? 50}%` }}
                        />
                    </div>
                    {progress !== null && (
                        <p className="text-[10px] text-vaulty-muted mt-1">{progress}%</p>
                    )}
                </div>
            </div>
        </div>
    );
}
