import React from 'react';
import type { Anime } from '@/types/anime';

interface AnimeShowcaseProps {
    animes: Anime[];
}

const AnimeShowcase = ({ animes }: AnimeShowcaseProps) => {
    return (
        <div className="mt-12">
            <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Quick Look / Dashboard</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {animes.map(anime => (
                    <div key={anime.id} className="group relative rounded-2xl overflow-hidden aspect-[3/4] shadow-md hover:shadow-indigo-200 transition-all">
                        <img src={anime.imgUrl} alt={anime.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                        <div className="absolute bottom-0 p-3 w-full">
                            <p className="text-white font-bold text-xs truncate">{anime.title}</p>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-[10px] text-indigo-300 font-bold">EP {anime.currentEp}</span>
                                <div className={`w-2 h-2 rounded-full ${anime.status === 'Terminado' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AnimeShowcase;
