import React from "react";
import AnimeCard from "./AnimeCard";

const AnimeTimeline = ({
  animes = [],
  status = "Pendiente",
  viewMode,
  onEdit,
  onDelete,
}) => {
  const filtered = animes.filter(
    (a) => a.status?.toLowerCase() === status?.toLowerCase(),
  );

  const getCompareDate = (anime) => {
    return status === "Terminado" ? anime.finishDate : anime.startDate;
  };

  // 2. Focus Animes (Sin cambios, solo validando fechas)
  const focusAnimes = filtered
    .filter((a) => a.isFocus)
    .sort((a, b) => new Date(getCompareDate(b)) - new Date(getCompareDate(a)));

  const regularAnimes = filtered.filter((a) => !a.isFocus);

  // 3. Agrupar por año (MEJORADO)
  const groupedByYear = regularAnimes.reduce((acc, anime) => {
    const rawDate = getCompareDate(anime);
    let year = "Sin Fecha";

    if (rawDate) {
      // Si es un string tipo "2026-02-07", agarra el "2026"
      // Si es un objeto Date o string ISO, el constructor de Date lo entiende mejor
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate)) {
        year = parsedDate.getFullYear().toString();
      }
    }

    if (!acc[year]) acc[year] = [];
    acc[year].push(anime);
    return acc;
  }, {});

  // 4. Ordenar años
  const years = Object.keys(groupedByYear).sort((a, b) => {
    if (a === "Sin Fecha") return 1;
    if (b === "Sin Fecha") return -1;
    return b - a;
  });

  const [visibleCount, setVisibleCount] = React.useState(2);
  const visibleYears = years.slice(0, visibleCount);

  // Sorting items within years
  years.forEach((year) => {
    groupedByYear[year].sort((a, b) => {
      const dateA = new Date(getCompareDate(a));
      const dateB = new Date(getCompareDate(b));
      return dateB - dateA; // Descendente: más reciente arriba
    });
  });

  const gridClass =
    viewMode === "grid"
      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-8 gap-6"
      : "grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-4";

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* --- SECCIÓN FOCUS --- */}
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
              <AnimeCard
                key={anime.id}
                anime={anime}
                onEdit={onEdit}
                onDelete={onDelete}
                viewMode={viewMode}
              />
            ))}
          </div>
        </section>
      )}

      {/* --- SECCIÓN POR AÑOS --- */}
      {visibleYears.map((year) => (
        <section key={year} className="relative">
          <div className="sticky top-0 z-10 bg-slate-50/80 dark:bg-slate-800/10 backdrop-blur-sm py-2 mb-4 flex items-center gap-4">
            <h3 className="text-slate-400 dark:text-slate-500 font-black text-2xl tracking-tighter">
              {year}
            </h3>
            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-700"></div>
          </div>

          <div className={gridClass}>
            {groupedByYear[year].map((anime) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                onEdit={onEdit}
                onDelete={onDelete}
                viewMode={viewMode}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Lazy Load Button */}
      {visibleCount < years.length && (
        <div className="flex justify-center pt-8">
          <button
            onClick={() => setVisibleCount(prev => prev + 3)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest px-8 py-4 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            Mostrar Más ({years.length - visibleCount}) ▼
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
          <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-xs tracking-widest">
            No hay nada en {status}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnimeTimeline;
