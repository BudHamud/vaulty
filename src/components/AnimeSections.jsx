import React, { useState } from "react";
import AnimeTimeline from "./AnimeTimeline";

const sectionConfig = {
  Viendo: { color: "text-amber-500", dot: "bg-amber-500", border: "border-amber-100" },
  Pendiente: { color: "text-indigo-500", dot: "bg-indigo-500", border: "border-indigo-100" },
  Terminado: { color: "text-emerald-500", dot: "bg-emerald-500", border: "border-emerald-100" }
};

const AnimeSections = ({ animes, viewMode, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState({
    Viendo: true,
    Pendiente: true,
    Terminado: false,
  });

  const toggleSection = (sec) => setExpanded(prev => ({ ...prev, [sec]: !prev[sec] }));

  return (
    <div className="space-y-6">
      {["Viendo", "Pendiente", "Terminado"].map((status) => {
        const count = animes.filter(a => a.status === status).length;
        const config = sectionConfig[status];

        return (
          <section key={status} className="bg-white/40 rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            {/* Header del Colapsable */}
            <div 
              onClick={() => toggleSection(status)}
              className="flex justify-between items-center cursor-pointer p-6 hover:bg-white/60 transition-colors"
            >
              <h2 className={`text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${config.color}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`}></span>
                {status} <span className="opacity-40 ml-1">({count})</span>
              </h2>
              <span className={`text-[10px] font-bold text-slate-300 transition-transform ${expanded[status] ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>

            {/* Contenido con Animación */}
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