import React, { useState, useEffect } from "react";
import { searchAnimeOnMAL } from "../services/animeApi";
import { searchAnimeOnCrunchyroll, getAnimeDetails } from "../services/crunchyrollService";

const AnimeForm = ({ onSubmit, initialData = null }) => {
  const today = new Date().toISOString().split("T")[0];
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shouldSearch, setShouldSearch] = useState(true);
  const [searchSource, setSearchSource] = useState("MAL"); // "MAL" or "Crunchyroll"

  // Inicializamos con la nueva propiedad 'description'
  const [form, setForm] = useState({
    title: "",
    status: "Pendiente",
    type: "Anime",
    description: "",
    currentEp: 0,
    totalEp: "",
    imgUrl: "",
    startDate: today,
    finishDate: "",
    isFocus: false,
  });

  // Re-initialize form when initialData changes (Fixes the "Old Data" bug)
  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        type: initialData.type || "Anime"
      });
    } else {
      // Reset if no initial data (New mode)
      setForm({
        title: "",
        status: "Pendiente",
        type: "Anime",
        description: "",
        currentEp: 0,
        totalEp: "",
        imgUrl: "",
        startDate: today,
        finishDate: "",
        isFocus: false,
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (!shouldSearch) {
      setShouldSearch(true);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      if (form.title.length > 3 && !initialData) {
        setLoading(true);
        let results = [];

        if (searchSource === "MAL") {
          results = await searchAnimeOnMAL(form.title);
        } else {
          // Crunchyroll Search
          const crResults = await searchAnimeOnCrunchyroll(form.title);
          // Standarize CR results to match MAL somewhat for the UI
          results = crResults.map(item => ({
            title: item.title,
            imgUrl: item.image,
            url: item.url,
            type: 'Crunchyroll',
            releaseYear: '??', // CR search doesn't give year easily
            score: 'N/A'
          }));
        }

        setSuggestions(results);
        setLoading(false);
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [form.title, searchSource]);

  const handleStatusChange = (newStatus) => {
    let updates = { status: newStatus };
    if (newStatus === "Terminado") {
      updates.finishDate = form.finishDate || today;
      if (form.totalEp && form.totalEp !== "??") {
        updates.currentEp = parseInt(form.totalEp);
      }
    } else {
      updates.finishDate = "";
    }
    setForm({ ...form, ...updates });
  };

  const selectSuggestion = async (s) => {
    setShouldSearch(false);
    setSuggestions([]);

    if (searchSource === "Crunchyroll" && s.url) {
      setLoading(true);
      try {
        const details = await getAnimeDetails(s.url);
        setForm((prev) => ({
          ...prev,
          title: details.title || s.title,
          imgUrl: details.image || s.imgUrl,
          totalEp: details.episodeCount || "??",
          description: details.description ? details.description.substring(0, 300) + (details.description.length > 300 ? '...' : '') : "",
        }));
      } catch (error) {
        console.error("Failed to fetch CR details", error);
        // Fallback to basic info
        setForm((prev) => ({
          ...prev,
          title: s.title,
          imgUrl: s.imgUrl,
        }));
      }
      setLoading(false);
    } else {
      // MAL Selection
      setForm((prev) => ({
        ...prev,
        title: s.title,
        imgUrl: s.imgUrl,
        totalEp: s.totalEp,
        description: `${s.releaseYear}. ${s.score ? `${s.score}/10. ` : ""}${s.synopsis?.substring(0, 150)}...`,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 1. Buscador Principal */}
      <div className="relative">
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setSearchSource("MAL")}
            className={`text-xs font-bold px-3 py-1 rounded-full border ${searchSource === "MAL" ? "bg-blue-100 border-blue-300 text-blue-600" : "bg-white border-slate-200 text-slate-400"}`}
          >
            MyAnimeList
          </button>
          <button
            type="button"
            onClick={() => setSearchSource("Crunchyroll")}
            className={`text-xs font-bold px-3 py-1 rounded-full border ${searchSource === "Crunchyroll" ? "bg-orange-100 border-orange-300 text-orange-600" : "bg-white border-slate-200 text-slate-400"}`}
          >
            Crunchyroll
          </button>
        </div>

        <input
          className={`w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 font-bold text-slate-700 ${searchSource === 'Crunchyroll' ? 'focus:ring-orange-400' : 'focus:ring-indigo-400'}`}
          placeholder={`Buscar en ${searchSource}...`}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        {loading && <span className="absolute right-4 top-12 animate-spin">⏳</span>}

        {/* Sugerencias de la API */}
        {suggestions.length > 0 && (
          <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl mt-2 overflow-hidden overflow-y-auto max-h-64 custom-scrollbar">
            {suggestions.map((s, i) => (
              <div key={i} onClick={() => selectSuggestion(s)} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none">
                <img src={s.imgUrl} className="w-10 h-14 object-cover rounded-lg" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-800 uppercase truncate">{s.title}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    {searchSource === "MAL" ? `${s.releaseYear} • Score: ${s.score || "N/A"}` : "Crunchyroll Series"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. URL Imagen (Más sutil) */}
      <input
        className="w-full p-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-400 italic outline-none"
        placeholder="URL de la imagen..."
        value={form.imgUrl}
        onChange={(e) => setForm({ ...form, imgUrl: e.target.value })}
      />

      {/* TIPO Y FECHAS */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tipo</label>
          <select
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold"
            value={form.type || "Anime"}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="Anime">Anime</option>
            <option value="Serie">Serie</option>
            <option value="Pelicula">Pelicula</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Inicio</label>
          <input type="date" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className={`text-[10px] font-black uppercase ml-1 ${form.status !== "Terminado" ? "text-slate-200" : "text-slate-400"}`}>Fin</label>
          <input type="date" disabled={form.status !== "Terminado"} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm disabled:bg-slate-50 disabled:text-slate-300" value={form.finishDate} onChange={(e) => setForm({ ...form, finishDate: e.target.value })} />
        </div>
      </div>

      {/* 4. Status y Episodios */}
      <div className="grid grid-cols-2 gap-3">
        <select className="p-3 bg-slate-100 border-none rounded-xl text-sm font-bold text-slate-700 cursor-pointer" value={form.status} onChange={(e) => handleStatusChange(e.target.value)}>
          <option value="Pendiente">⏳ Pendiente</option>
          <option value="Viendo">🍿 Viendo</option>
          <option value="Terminado">✅ Terminado</option>
        </select>
        <div className="flex gap-2">
          <input type="number" placeholder="Vistos" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-center text-sm font-bold" value={form.currentEp} onChange={(e) => setForm({ ...form, currentEp: parseInt(e.target.value) || 0 })} />
          <input type="text" placeholder="Total" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-center text-sm font-bold" value={form.totalEp} onChange={(e) => setForm({ ...form, totalEp: e.target.value })} />
        </div>
      </div>

      {/* 5. Textarea Estilizado (Description) */}
      <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descripción / Reseña</label>
        <textarea
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-400 min-h-[100px] resize-none custom-scrollbar"
          placeholder="¿Qué te pareció?"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      {/* 6. Fila de Acciones (Prioridad y Botón Guardar en una línea) */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => setForm({ ...form, isFocus: !form.isFocus })}
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-tighter ${form.isFocus
            ? "bg-amber-50 border-amber-200 text-amber-600 shadow-inner"
            : "bg-white border-slate-100 text-slate-300 hover:border-slate-200"
            }`}
        >
          <span className="text-base">{form.isFocus ? "⭐" : "☆"}</span>
          {form.isFocus ? "Prioridad" : "Marcar"}
        </button>

        <button
          type="submit"
          className="flex-[2] bg-indigo-600 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 active:scale-95"
        >
          {initialData ? "Actualizar" : "Guardar Bóveda"}
        </button>
      </div>
    </form>
  );
};

export default AnimeForm;