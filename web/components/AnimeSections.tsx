import React, { useState } from "react";
import AnimeTimeline from "./AnimeTimeline";
import type { Anime, AnimeStatus, ViewMode } from "@/types/anime";

interface AnimeSectionsProps {
    animes: Anime[];
    viewMode: ViewMode;
    onEdit: (anime: Anime) => void;
    onDelete: (id: string) => void;
}

const sectionConfig: Record<AnimeStatus, { color: string; dot: string; border: string }> = {
    Viendo: { color: "text-amber-500", dot: "bg-amber-500", border: "border-amber-100" },
    Pendiente: { color: "text-indigo-500", dot: "bg-indigo-500", border: "border-indigo-100" },
    Terminado: { color: "text-emerald-500", dot: "bg-emerald-500", border: "border-emerald-100" },
};

const AnimeSections = ({ animes, viewMode, onEdit, onDelete }: AnimeSectionsProps) => {
    const [expanded, setExpanded] = useState<Record<AnimeStatus, boolean>>({
        Viendo: true,
        Pendiente: true,
        Terminado: false,
    });

    const toggleSection = (sec: AnimeStatus) =>
        setExpanded(prev => ({ ...prev, [sec]: !prev[sec] }));

    const statuses: AnimeStatus[] = ["Viendo", "Pendiente", "Terminado"];

    return (
        <div className="space-y-6">
            {statuses.map((status) => {
                const count = animes.filter(a => a.status === status).length;
                const config = sectionConfig[status];

                return (
                    <section key={status} className="bg-vaulty-card/50 rounded-3xl border border-vaulty-border overflow-hidden shadow-sm">
                        <div
                            onClick={() => toggleSection(status)}
                            className="flex justify-between items-center cursor-pointer p-6 hover:bg-vaulty-card/80 transition-colors"
                        >
                            <h2 className={`text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${config.color}`}>
                                <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`}></span>
                                {status} <span className="opacity-40 ml-1">({count})</span>
                            </h2>
                            <span className={`text-[10px] font-bold text-vaulty-muted transition-transform ${expanded[status] ? 'rotate-180' : ''}`}>
                                ▼
                            </span>
                        </div>

                        <div className={`grid transition-all duration-500 ${expanded[status] ? "grid-rows-[1fr] opacity-100 p-6 pt-0" : "grid-rows-[0fr] opacity-0"}`}>
                            <div className="overflow-hidden">
                                <AnimeTimeline
                                    animes={animes}
                                    status={status}
                                    viewMode={viewMode}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                />
                            </div>
                        </div>
                    </section>
                );
            })}
        </div>
    );
};

export default AnimeSections;
