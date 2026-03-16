'use client'

import { motion } from "framer-motion";
import ActionButton from "./ActionButton";
import type { Anime, AnimeStatus, ViewMode } from "@/types/anime";

interface AnimeCardProps {
    anime: Anime;
    onEdit: (anime: Anime) => void;
    onDelete: (id: string) => void;
    viewMode: ViewMode;
}

const AnimeCard = ({ anime, onEdit, onDelete, viewMode }: AnimeCardProps) => {
    const getYear = (dateString: string | null | undefined): string | null =>
        dateString ? dateString.split("-")[0] : null;

    const statusColors: Record<AnimeStatus, string> = {
        Terminado: "bg-emerald-500",
        Viendo: "bg-amber-500",
        Pendiente: "bg-slate-400",
    };

    const renderDate = () => {
        const startYear = getYear(anime.startDate);
        const finishYear = getYear(anime.finishDate);

        if (anime.status === "Terminado" && finishYear) {
            if (startYear === finishYear) return startYear;
            return `${startYear} - ${finishYear}`;
        }
        return startYear || "??";
    };

    if (viewMode === "grid") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-vaulty-card rounded-2xl overflow-hidden border border-vaulty-border flex flex-col h-[380px] transition-all hover:border-vaulty-accent/50 group relative"
            >
                <motion.div
                    className="absolute top-2 right-2 flex gap-1 z-10"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    <ActionButton onClick={() => onEdit(anime)} icon="✎" colorHover="text-indigo-600" isGrid />
                    <ActionButton onClick={() => onDelete(anime.id)} icon="✕" colorHover="text-red-600" isGrid />
                </motion.div>

                <div className="h-2/3 overflow-hidden relative">
                    <motion.img
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                        src={anime.imgUrl || "https://placehold.co/100x150"}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                    <div
                        className={`${statusColors[anime.status]} absolute bottom-0 left-0 right-0 py-1 text-center text-[9px] font-black text-white uppercase tracking-widest`}
                    >
                        {anime.status}
                    </div>
                </div>

                {anime.isFocus && (
                    <motion.span
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: -5 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="absolute -left-1 -top-1 bg-amber-400 text-white text-[10px] px-2 py-1 rounded-lg shadow-lg z-20 font-black"
                    >
                        FOCUS
                    </motion.span>
                )}

                <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-black text-vaulty-text uppercase truncate mb-1">{anime.title}</h3>
                        <p className="text-[10px] text-vaulty-muted font-bold uppercase">{renderDate()}</p>
                    </div>
                    <p className="text-[11px] text-vaulty-muted italic line-clamp-2 mt-2 leading-relaxed">
                        {anime.description || "Sin notas."}
                    </p>
                    <div className="mt-2 pt-2 border-t border-vaulty-border">
                        <span className="text-[10px] font-black text-vaulty-accent uppercase tracking-wider">
                            EP {anime.currentEp} / {anime.totalEp || "??"}
                        </span>
                    </div>
                </div>
            </motion.div>
        );
    }

    // VISTA RECTANGULAR (LIST)
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className="bg-vaulty-card rounded-2xl overflow-hidden border border-vaulty-border flex h-40 transition-colors hover:border-vaulty-accent/50"
        >
            <motion.img
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                src={anime.imgUrl || "https://placehold.co/100x150"}
                alt=""
                className="w-28 h-full object-cover shrink-0"
            />

            <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                <div className="flex justify-between items-start gap-2">
                    <div className="truncate">
                        <h3 className="text-base font-black text-vaulty-text truncate leading-tight uppercase">
                            {anime.title}
                        </h3>
                        <div className="flex gap-2 mt-1">
                            <span className={`${statusColors[anime.status]} text-[9px] font-black text-white px-2 py-0.5 rounded-full uppercase`}>
                                {anime.status}
                            </span>
                            <span className="text-[9px] font-bold text-vaulty-muted uppercase">{renderDate()}</span>
                        </div>
                    </div>
                    <div className="flex gap-0.5 shrink-0 -mt-1">
                        <ActionButton onClick={() => onEdit(anime)} icon="✎" colorHover="text-vaulty-accent" />
                        <ActionButton onClick={() => onDelete(anime.id)} icon="✕" colorHover="text-red-500" />
                    </div>
                </div>

                <p className="text-xs text-vaulty-muted italic line-clamp-2 mt-1 leading-relaxed">
                    {anime.description || "Sin notas."}
                </p>

                <div className="mt-2 flex items-center justify-between border-t border-vaulty-border pt-2">
                    <span className="text-[10px] font-black text-vaulty-accent bg-vaulty-accent/10 px-2 py-1 rounded-md uppercase tracking-wider font-mono">
                        EP {anime.currentEp} / {anime.totalEp || "??"}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default AnimeCard;
