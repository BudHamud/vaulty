import type { Anime } from "@/types/anime";

export default function RecentHistoryCard({ anime }: { anime: Anime }) {
    const formatDate = (dateStr: string | null | undefined): string | null => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const dateLabel =
        anime.status === "Terminado"
            ? formatDate(anime.finishDate)
            : formatDate(anime.startDate);

    const epLabel =
        anime.currentEp != null
            ? `EP ${anime.currentEp}${anime.totalEp ? ` / ${anime.totalEp}` : ""}`
            : null;

    return (
        <div className="flex flex-col group cursor-default">
            {/* Poster */}
            <div className="relative rounded-xl overflow-hidden bg-vaulty-border aspect-[2/3] mb-2">
                <img
                    src={anime.imgUrl || "https://placehold.co/160x240/1a1b2e/6c5ce7?text=?"}
                    alt={anime.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Rating badge */}
                {(anime.score ?? 0) > 0 && (
                    <div className="absolute top-2 right-2 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        <span>★</span>
                        <span>{anime.score}</span>
                    </div>
                )}
            </div>

            {/* Info */}
            <h3 className="text-xs font-bold text-vaulty-text truncate">{anime.title}</h3>
            {(epLabel || dateLabel) && (
                <p className="text-[10px] text-vaulty-muted mt-0.5 truncate">
                    {[epLabel, dateLabel].filter(Boolean).join(" • ")}
                </p>
            )}
        </div>
    );
}
