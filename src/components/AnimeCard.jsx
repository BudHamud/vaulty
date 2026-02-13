import ActionButton from "./ActionButton";

const AnimeCard = ({ anime, onEdit, onDelete, viewMode }) => {
  const getYear = (dateString) =>
    dateString ? dateString.split("-")[0] : null;
  const statusColors = {
    Terminado: "bg-emerald-500",
    Viendo: "bg-amber-500",
    Pendiente: "bg-slate-400",
  };

  const renderDate = () => {
    const startYear = getYear(anime.startDate);
    const finishYear = getYear(anime.finishDate);

    if (anime.status === "Terminado" && finishYear) {
      // Si el año de inicio y fin son el mismo, mostrar solo uno
      if (startYear === finishYear) return startYear;
      // Si son distintos, mostrar rango
      return `${startYear} - ${finishYear}`;
    }
    return startYear || "??";
  };

  if (viewMode === "grid") {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col h-[380px] transition-all hover:border-indigo-400 dark:hover:border-indigo-500 group relative">
        <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionButton
            onClick={() => onEdit(anime)}
            icon="✎"
            colorHover="text-indigo-600"
            isGrid
          />
          <ActionButton
            onClick={() => onDelete(anime.id)}
            icon="✕"
            colorHover="text-red-600"
            isGrid
          />
        </div>

        <div className="h-2/3 overflow-hidden relative">
          <img
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
          <span className="absolute -left-1 -top-1 bg-amber-400 text-white text-[10px] px-2 py-1 rounded-lg shadow-lg z-20 font-black rotate-[-5deg]">
            FOCUS
          </span>
        )}

        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase truncate mb-1">
              {anime.title}
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
              {renderDate()}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2 mt-2 leading-relaxed italic">
            {anime.description || "Sin notas."}
          </p>
          <div className="mt-2 pt-2 border-t border-slate-50 dark:border-slate-700">
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              EP {anime.currentEp} / {anime.totalEp || "??"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // VISTA RECTANGULAR (LIST)
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex h-40 transition-colors hover:border-indigo-300 dark:hover:border-indigo-500">
      <img
        src={anime.imgUrl || "https://placehold.co/100x150"}
        alt=""
        className="w-28 h-full object-cover shrink-0"
      />

      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div className="truncate">
            <h3 className="text-base font-black text-slate-800 dark:text-white truncate leading-tight uppercase">
              {anime.title}
            </h3>
            <div className="flex gap-2 mt-1">
              <span
                className={`${statusColors[anime.status]} text-[9px] font-black text-white px-2 py-0.5 rounded-full uppercase`}
              >
                {anime.status}
              </span>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                {renderDate()}
              </span>
            </div>
          </div>
          <div className="flex gap-0.5 shrink-0 -mt-1">
            <ActionButton
              onClick={() => onEdit(anime)}
              icon="✎"
              colorHover="text-indigo-600"
            />
            <ActionButton
              onClick={() => onDelete(anime.id)}
              icon="✕"
              colorHover="text-red-500"
            />
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2 mt-1 leading-relaxed">
          {anime.description || "Sin notas."}
        </p>

        <div className="mt-2 flex items-center justify-between border-t border-slate-50 dark:border-slate-700 pt-2">
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md uppercase tracking-wider font-mono">
            EP {anime.currentEp} / {anime.totalEp || "??"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnimeCard;
