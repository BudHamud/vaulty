'use client'

import React from "react";
import AnimeCard from "./AnimeCard";
import type { Anime, AnimeStatus, ViewMode } from "@/types/anime";

interface AnimeTimelineProps {
    animes?: Anime[];
    status?: AnimeStatus;
    viewMode: ViewMode;
    onEdit: (anime: Anime) => void;
    onDelete: (id: string) => void;
}

const AnimeTimeline = ({
    animes = [],
    status = "Pendiente",
    viewMode,
    onEdit,
    onDelete,
}: AnimeTimelineProps) => {
    const filtered = animes.filter(
        (a) => a.status?.toLowerCase() === status?.toLowerCase(),
    );

    const getCompareDate = (anime: Anime): string | null => {
        return status === "Terminado" ? anime.finishDate : anime.startDate;
    };

    const focusAnimes = filtered
        .filter((a) => a.isFocus)
        .sort(
            (a, b) =>
                new Date(getCompareDate(b) ?? "").getTime() -
                new Date(getCompareDate(a) ?? "").getTime(),
        );

    const regularAnimes = filtered.filter((a) => !a.isFocus);

    const groupedByYear = regularAnimes.reduce<Record<string, Anime[]>>((acc, anime) => {
        const rawDate = getCompareDate(anime);
        let year = "Sin Fecha";

        if (rawDate) {
            const parsedDate = new Date(rawDate);
            if (!isNaN(parsedDate.getTime())) {
                year = parsedDate.getFullYear().toString();
            }
        }

        if (!acc[year]) acc[year] = [];
        acc[year].push(anime);
        return acc;
    }, {});

    const years = Object.keys(groupedByYear).sort((a, b) => {
        if (a === "Sin Fecha") return 1;
        if (b === "Sin Fecha") return -1;
        return Number(b) - Number(a);
    });

    const [visibleCount, setVisibleCount] = React.useState(2);
    const visibleYears = years.slice(0, visibleCount);

    years.forEach((year) => {
        groupedByYear[year].sort((a, b) => {
            const dateA = new Date(getCompareDate(a) ?? "").getTime();
            const dateB = new Date(getCompareDate(b) ?? "").getTime();
            return dateB - dateA;
        });
    });

    const gridClass =
        viewMode === "grid"
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-8 gap-6"
            : "grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-4";

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {focusAnimes.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-amber-500 text-lg">⭐</span>
                        <h3 className="text-amber-600 dark:text-amber-400 text-[11px] font-black uppercase tracking-[0.2em]">
                            Prioridades
                        </h3>
                    </div>
                    <div className={gridClass}>
                        {focusAnimes.map((anime) => (
                            <AnimeCard key={anime.id} anime={anime} onEdit={onEdit} onDelete={onDelete} viewMode={viewMode} />
                        ))}
                    </div>
                </section>
            )}

            {visibleYears.map((year) => (
                <section key={year} className="relative">
                    <div className="sticky top-0 z-10 bg-vaulty-bg/90 backdrop-blur-sm py-2 mb-4 flex items-center gap-4">
                        <h3 className="text-vaulty-muted font-black text-2xl tracking-tighter">{year}</h3>
                        <div className="h-[1px] flex-1 bg-vaulty-border"></div>
                    </div>
                    <div className={gridClass}>
                        {groupedByYear[year].map((anime) => (
                            <AnimeCard key={anime.id} anime={anime} onEdit={onEdit} onDelete={onDelete} viewMode={viewMode} />
                        ))}
                    </div>
                </section>
            ))}

            {visibleCount < years.length && (
                <div className="flex justify-center pt-8">
                    <button
                        onClick={() => setVisibleCount(prev => prev + 3)}
                        className="bg-vaulty-card border border-vaulty-border text-vaulty-muted font-black text-xs uppercase tracking-widest px-8 py-4 rounded-full hover:bg-vaulty-card-hover hover:border-vaulty-accent/50 transition-all"
                    >
                        Mostrar Más ({years.length - visibleCount}) ▼
                    </button>
                </div>
            )}

            {filtered.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-vaulty-border rounded-3xl">
                    <p className="text-vaulty-muted font-bold uppercase text-xs tracking-widest">
                        No hay nada en {status}
                    </p>
                </div>
            )}
        </div>
    );
};

export default AnimeTimeline;
