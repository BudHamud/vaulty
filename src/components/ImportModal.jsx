import React, { useState } from "react";
import { searchAnimeOnMAL } from "../services/animeApi";
import { searchOnTMDB } from "../services/tmdbApi";

const ImportModal = ({ existingAnimes = [], onImport, onClose }) => {
    const [source, setSource] = useState("crunchyroll"); // 'crunchyroll' | 'netflix'
    const [inputData, setInputData] = useState("");
    const [parsedData, setParsedData] = useState([]);

    // Batch State
    const [step, setStep] = useState(1); // 1: Paste, 2: Preview, 3: Enriching Batch, 4: Review Batch
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const [batchIndex, setBatchIndex] = useState(0); // Index in parsedData
    const [currentBatch, setCurrentBatch] = useState([]); // The enriched items waiting for approval
    const BATCH_SIZE = 10;

    const [tmdbKey, setTmdbKey] = useState(localStorage.getItem("tmdb_api_key") || "");

    // --- PARSERS (Same as before) ---
    const parseCrunchyroll = (json) => {
        try {
            const data = JSON.parse(json);
            if (!Array.isArray(data)) throw new Error("Format invalid.");
            return data.map(item => ({
                title: item.title,
                status: item.status || "Pendiente",
                currentEp: typeof item.currentEp === 'number' ? item.currentEp : 0,
                totalEp: "??",
                imgUrl: item.imgUrl || "",
                startDate: new Date().toISOString().split('T')[0],
                finishDate: "",
                rating: 0,
                description: item.seriesUrl ? `Imported from Crunchyroll: ${item.seriesUrl}` : "Imported from Crunchyroll.",
                isFocus: false
            }));
        } catch (e) {
            throw new Error("Invalid JSON.");
        }
    };

    const parseNetflix = (csv) => {
        const lines = csv.split('\n').filter(l => l.trim().length > 0);
        const seriesMap = {};
        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            try {
                const clean = dateStr.replace(/"/g, '').trim();
                const part = clean.split('/');
                if (part.length !== 3) return null;
                const year = 2000 + parseInt(part[2]);
                const month = parseInt(part[0]);
                const day = parseInt(part[1]);
                if (month > 12) return new Date(year, day - 1, month).toISOString().split('T')[0];
                return new Date(year, month - 1, day).toISOString().split('T')[0];
            } catch (e) { return null; }
        };

        lines.forEach(line => {
            const match = line.match(/^"([^"]+)","([^"]+)"/);
            if (!match) return;
            const fullTitle = match[1];

            const dateStr = match[2];
            const date = parseDate(dateStr);

            // Extract base series/movie name (before first colon)
            // "Breaking Bad: Temporada 1: Episodio 1" -> "Breaking Bad"
            // "Closer: Llevados por el Deseo" -> "Closer: Llevados por el Deseo" (if only one colon, keep it)
            let baseName = fullTitle.split(':')[0].trim();

            // Check if this looks like an episode title (has multiple colons or episode/season keywords)
            const isEpisodeTitle = fullTitle.match(/:.*(temporada|season|episodio|episode|ep\.|capítulo|pilot|piloto)/i);

            if (!seriesMap[baseName]) {
                seriesMap[baseName] = {
                    count: 0,
                    dates: [],
                    baseName: baseName,
                    fullTitle: fullTitle,
                    isEpisode: !!isEpisodeTitle
                };
            }
            seriesMap[baseName].count++;
            if (date) seriesMap[baseName].dates.push(date);
        });

        return Object.values(seriesMap).map(s => {
            s.dates.sort();
            const firstDate = s.dates[0] || new Date().toISOString().split('T')[0];
            const lastDate = s.dates[s.dates.length - 1] || "";

            // For SEARCH: Use base name (e.g., "Breaking Bad", not "Breaking Bad: Temporada 1: Episodio 1")
            // For KEYWORD DETECTION: Use full title to catch "Temporada", "Piloto", etc.
            return {
                title: s.baseName, // Clean name for TMDB search
                originalTitle: s.fullTitle, // Full title for keyword detection
                status: "Pendiente",
                currentEp: s.count,
                totalEp: "??",
                imgUrl: "",
                score: 0,
                synopsis: "",
                releaseYear: firstDate.split('-')[0] || "????",
                type: "Desconocido",
                startDate: firstDate,
                finishDate: lastDate
            };
        });
    };

    const handleParse = () => {
        if (source === 'netflix' && !tmdbKey) {
            setError("Por favor ingresa tu API Key de TMDB para importar de Netflix.");
            return;
        }
        if (source === 'netflix') {
            localStorage.setItem("tmdb_api_key", tmdbKey);
        }

        setError(null);
        try {
            let data = [];
            if (source === "crunchyroll") data = parseCrunchyroll(inputData);
            else data = parseNetflix(inputData);

            // Filter duplicates immediately
            const newData = data.filter(item =>
                !existingAnimes.some(existing => existing.title.toLowerCase() === item.title.toLowerCase())
            );

            if (newData.length === 0) throw new Error(data.length > 0 ? "All items already exist in your library!" : "No entries found.");

            setParsedData(newData);
            setStep(2);
        } catch (err) {
            setError(err.message);
        }
    };

    // --- BATCH PROCESSOR ---
    const processBatch = async (startIndex) => {
        setStep(3); // Loading screen
        const batchRaw = parsedData.slice(startIndex, startIndex + BATCH_SIZE);
        const enrichedBatch = [];

        for (let i = 0; i < batchRaw.length; i++) {
            const item = batchRaw[i];

            // Update UI
            setProgress({
                current: startIndex + i + 1,
                total: parsedData.length
            });

            let enriched = { ...item };
            try {
                let bestMatch = null;
                // Netflix -> TMDB -> MAL
                // Crunchyroll -> MAL -> TMDB

                if (source === 'netflix') {
                    // TMDB First (Smart Match)
                    try {
                        const tmdbResults = await searchOnTMDB(item.title, tmdbKey);

                        console.log(`[DEBUG] Procesando: "${item.title}"`);
                        console.log(`   - Episodes: ${item.currentEp}`);
                        console.log(`   - TMDB Results:`, tmdbResults?.map(r => `${r.title} (${r.type})`));

                        if (tmdbResults && tmdbResults.length > 0) {
                            let match = tmdbResults[0]; // Default to top result

                            const originalTitle = item.originalTitle || item.title;
                            // Check for Series keywords in the title
                            const hasSeriesKeywords = originalTitle.match(/(episode|ep\.|season|temporada|capítulo|pilot|piloto|s\d+e\d+|temporada\s+\d+)/i);
                            const isSimpleTitle = !originalTitle.includes(':') && !originalTitle.includes(',');

                            // SMART MATCH logic
                            if (item.currentEp > 1 || hasSeriesKeywords) {
                                console.log(`   -> Detectado como SERIE (Multiples caps o keywords)`);
                                // If watched multiple eps OR title explicitly says "Episode", it is a Series
                                const validSeries = tmdbResults.find(r =>
                                    (r.type === 'Serie' || r.type === 'Anime') &&
                                    (r.totalEp === "??" || Number(r.totalEp) >= item.currentEp)
                                );

                                if (validSeries) match = validSeries;
                                else {
                                    const anySeries = tmdbResults.find(r => r.type === 'Serie' || r.type === 'Anime');
                                    if (anySeries) match = anySeries;
                                }
                            } else {
                                // CASE: 1 Episode + No Series Keywords
                                console.log(`   -> Detectado como POTENCIAL PELICULA (1 cap, sin keywords)`);

                                let movieMatch = null;

                                if (isSimpleTitle) {
                                    // STRONG FORCE: If it's a simple title (no : or ,), look harder for a movie
                                    // "Un amor verdadero" -> Even if top result is a novel, find the movie
                                    movieMatch = tmdbResults.find(r => r.type === 'Pelicula');
                                    if (movieMatch) console.log(`   -> IMPORTANTE: Forzando Pelicula por Titulo Simple: ${movieMatch.title}`);
                                } else {
                                    movieMatch = tmdbResults.find(r => r.type === 'Pelicula');
                                }

                                if (movieMatch) {
                                    match = movieMatch;
                                } else {
                                    console.log(`   -> No se encontró Pelicula en resultados, manteniendo: ${match.type}`);
                                }
                            }

                            console.log(`   -> MATCH FINAL: ${match.title} (${match.type})`);
                            console.log('-----------------------------------');

                            bestMatch = { ...match, isTMDB: true };
                        }
                    } catch (e) {
                        console.error("Error en Smart Match:", e);
                    }

                    if (!bestMatch) {
                        try {
                            const malResults = await searchAnimeOnMAL(item.title);
                            if (malResults?.[0]) bestMatch = malResults[0];
                        } catch (e) { }
                    }
                } else {
                    // MAL First
                    try {
                        const malResults = await searchAnimeOnMAL(item.title);
                        if (malResults?.[0]) bestMatch = malResults[0];
                    } catch (e) { }

                    if (!bestMatch) {
                        try {
                            const tmdbResults = await searchOnTMDB(item.title, tmdbKey);
                            if (tmdbResults?.[0]) bestMatch = { ...tmdbResults[0], isTMDB: true };
                        } catch (e) { }
                    }
                }

                if (bestMatch) {
                    enriched.imgUrl = bestMatch.imgUrl || enriched.imgUrl;
                    enriched.totalEp = bestMatch.totalEp || "??";
                    const sourceTag = bestMatch.isTMDB ? "(Src: TMDB)" : "(Src: MAL)";
                    enriched.description = bestMatch.synopsis ?
                        `${bestMatch.releaseYear}. Score: ${bestMatch.score}. ${sourceTag}\n\n${bestMatch.synopsis.substring(0, 300)}...` :
                        enriched.description;
                    enriched.rating = bestMatch.score || 0;

                    // Assign Type
                    if (source === 'crunchyroll') enriched.type = 'Anime';
                    else if (bestMatch.isTMDB) {
                        // TMDB types are already properly mapped in tmdbApi.js ('Pelicula', 'Serie', 'Anime')
                        enriched.type = bestMatch.type;
                    } else {
                        // Fallback for Netflix if found on MAL or unknown
                        enriched.type = 'Anime';
                    }

                    if (enriched.totalEp !== "??" && enriched.currentEp >= enriched.totalEp) {
                        enriched.status = "Terminado";
                        if (!enriched.finishDate) enriched.finishDate = new Date().toISOString().split('T')[0];
                    } else {
                        enriched.status = "Pendiente"; // Default to Pendiente for incomplete series
                    }
                }
            } catch (e) {
                console.warn(`Failed to enrich ${item.title}`);
            }

            enrichedBatch.push(enriched);
            // Small Desync to avoid UI freeze
            await new Promise(r => setTimeout(r, 50));
        }

        setCurrentBatch(enrichedBatch);
        setStep(4); // Go to Review
    };

    const handleStart = () => {
        setBatchIndex(0);
        processBatch(0);
    };

    const [editingIndex, setEditingIndex] = useState(null);
    const [editSearch, setEditSearch] = useState("");
    const [editResults, setEditResults] = useState([]);
    const [isSearchingEdit, setIsSearchingEdit] = useState(false);
    const [editTypeFilter, setEditTypeFilter] = useState("all"); // "all", "Serie", "Pelicula", "Anime"
    const [editingEpisodeIndex, setEditingEpisodeIndex] = useState(null);

    const handleEditSearch = async (e) => {
        e.preventDefault();
        if (!editSearch.trim()) return;

        setIsSearchingEdit(true);
        try {
            let results = [];
            if (source === 'netflix') {
                // Try TMDB then MAL
                try {
                    const tmdb = await searchOnTMDB(editSearch, tmdbKey);
                    results = [...results, ...tmdb.map(r => ({ ...r, isTMDB: true }))];
                } catch (e) { }
                try {
                    const mal = await searchAnimeOnMAL(editSearch);
                    results = [...results, ...mal];
                } catch (e) { }
            } else {
                // Try MAL then TMDB
                try {
                    const mal = await searchAnimeOnMAL(editSearch);
                    results = [...results, ...mal];
                } catch (e) { }
                try {
                    const tmdb = await searchOnTMDB(editSearch, tmdbKey);
                    results = [...results, ...tmdb.map(r => ({ ...r, isTMDB: true }))];
                } catch (e) { }
            }

            // Apply type filter
            if (editTypeFilter !== "all") {
                results = results.filter(r => r.type === editTypeFilter);
            }

            setEditResults(results.slice(0, 20));
        } catch (error) {
            console.error("Edit search failed", error);
        }
        setIsSearchingEdit(false);
    };

    const selectEditResult = (result) => {
        const updatedBatch = [...currentBatch];
        const originalItem = updatedBatch[editingIndex];

        const sourceTag = result.isTMDB ? "(Src: TMDB)" : "(Src: MAL)";

        updatedBatch[editingIndex] = {
            ...originalItem,
            title: result.title, // Update title to matched one
            imgUrl: result.imgUrl || originalItem.imgUrl,
            totalEp: result.totalEp || "??",
            description: result.synopsis ?
                `${result.releaseYear}. Score: ${result.score}. ${sourceTag}\n\n${result.synopsis.substring(0, 300)}...` :
                originalItem.description,
            rating: result.score || 0,
            type: source === 'crunchyroll' ? 'Anime' : (result.isTMDB ? result.type : 'Anime'),
            // Recalculate status
            status: (result.totalEp !== "??" && originalItem.currentEp >= result.totalEp) ? "Terminado" : "Pendiente"
        };

        if (updatedBatch[editingIndex].status === "Terminado" && !updatedBatch[editingIndex].finishDate) {
            updatedBatch[editingIndex].finishDate = new Date().toISOString().split('T')[0];
        }

        setCurrentBatch(updatedBatch);
        setEditingIndex(null);
        setEditSearch("");
        setEditResults([]);
    };

    const confirmBatch = async () => {
        // 1. Send current batch to App
        await onImport(currentBatch);

        // 2. Check if more items exist
        const nextIndex = batchIndex + BATCH_SIZE;
        if (nextIndex < parsedData.length) {
            setBatchIndex(nextIndex);
            processBatch(nextIndex);
        } else {
            // Done!
            onClose();
        }
    };

    const deleteFromBatch = (index) => {
        const updated = currentBatch.filter((_, idx) => idx !== index);
        setCurrentBatch(updated);

        // If we deleted all items, move to next batch or close
        if (updated.length === 0) {
            const nextIndex = batchIndex + BATCH_SIZE;
            if (nextIndex < parsedData.length) {
                setBatchIndex(nextIndex);
                processBatch(nextIndex);
            } else {
                onClose();
            }
        }
    };

    const updateEpisodeCount = (index, newCount) => {
        const updated = [...currentBatch];
        const item = updated[index];
        const count = parseInt(newCount) || 0;

        item.currentEp = count;

        // Recalculate status
        if (item.totalEp !== "??" && count >= item.totalEp) {
            item.status = "Terminado";
            if (!item.finishDate) item.finishDate = new Date().toISOString().split('T')[0];
        } else {
            item.status = "Pendiente";
        }

        setCurrentBatch(updated);
        setEditingEpisodeIndex(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                            {step >= 3 ? `Importing ${batchIndex + 1} - ${Math.min(batchIndex + BATCH_SIZE, parsedData.length)} / ${parsedData.length}` : "Import Data"}
                        </h2>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-1">Batch Mode</p>
                    </div>
                    {step < 3 && <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>}
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">

                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="flex p-1 bg-slate-200 rounded-xl mb-4 w-fit">
                                <button onClick={() => setSource("crunchyroll")} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${source === "crunchyroll" ? "bg-white text-orange-500 shadow-sm" : "text-slate-500"}`}>Crunchyroll</button>
                                <button onClick={() => setSource("netflix")} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${source === "netflix" ? "bg-white text-red-600 shadow-sm" : "text-slate-500"}`}>Netflix CSV</button>
                            </div>

                            {source === 'netflix' && (
                                <div className="mb-4 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400">TMDB API Key (Requerido para Series/Peliculas)</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-400 outline-none"
                                        placeholder="Pega tu API Key de themoviedb.org aquí..."
                                        value={tmdbKey}
                                        onChange={(e) => setTmdbKey(e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Consíguela gratis en <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer" className="text-indigo-500 underline hover:text-indigo-700">themoviedb.org</a></p>
                                </div>
                            )}

                            <textarea className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-600 outline-none resize-none"
                                placeholder="Paste data here..." value={inputData} onChange={e => setInputData(e.target.value)} />
                            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-slate-700">Ready to import <span className="text-indigo-600">{parsedData.length} new items</span>.</p>
                            <p className="text-xs text-slate-500">We will process them in batches of 10 so you can verify the data.</p>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                            <h3 className="text-lg font-black text-slate-700">Analyzing Batch...</h3>
                            <p className="text-sm text-slate-400 font-bold">Item {progress.current} of {parsedData.length}</p>
                        </div>
                    )}

                    {step === 4 && (
                        <div>
                            <p className="text-sm font-bold text-slate-700 mb-4">Review this batch ({currentBatch.length} items):</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentBatch.map((item, idx) => (
                                    <div key={idx} className={`flex flex-col p-3 border rounded-xl bg-white hover:shadow-md transition-all ${editingIndex === idx ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-100'}`}>

                                        {/* NORMAL VIEW */}
                                        {editingIndex !== idx && (
                                            <div className="flex gap-3">
                                                {item.imgUrl ? (
                                                    <img src={item.imgUrl} className="w-16 h-24 object-cover rounded-lg shadow-sm" />
                                                ) : (
                                                    <div className="w-16 h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300 font-bold text-xs">NO IMG</div>
                                                )}
                                                <div className="flex-1 min-w-0 relative">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-black text-slate-800 truncate" title={item.title}>{item.title}</h4>
                                                            {item.originalTitle && item.originalTitle !== item.title && (
                                                                <p className="text-[9px] text-slate-400 italic truncate" title={item.originalTitle}>Netflix: {item.originalTitle}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1 flex-shrink-0">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingIndex(idx);
                                                                    setEditSearch(item.originalTitle || item.title);
                                                                    setEditResults([]);
                                                                }}
                                                                className="text-slate-400 hover:text-indigo-600 transition-colors text-sm"
                                                                title="Editar / Buscar otro"
                                                            >
                                                                ✎
                                                            </button>
                                                            <button
                                                                onClick={() => deleteFromBatch(idx)}
                                                                className="text-slate-400 hover:text-red-600 transition-colors text-sm"
                                                                title="Eliminar de la importación"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 mt-1 flex-wrap">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.status === 'Terminado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {item.status}
                                                        </span>

                                                        {editingEpisodeIndex === idx ? (
                                                            <input
                                                                type="number"
                                                                autoFocus
                                                                defaultValue={item.currentEp}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        updateEpisodeCount(idx, e.target.value);
                                                                    } else if (e.key === 'Escape') {
                                                                        setEditingEpisodeIndex(null);
                                                                    }
                                                                }}
                                                                onBlur={(e) => updateEpisodeCount(idx, e.target.value)}
                                                                className="w-12 text-[10px] font-bold bg-slate-50 border border-indigo-300 rounded px-1 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                                            />
                                                        ) : (
                                                            <span
                                                                onClick={() => setEditingEpisodeIndex(idx)}
                                                                className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded cursor-pointer hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                                                                title="Click para editar episodios vistos"
                                                            >
                                                                {item.currentEp} / {item.totalEp}
                                                            </span>
                                                        )}

                                                        <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-2 py-0.5 rounded uppercase">
                                                            {item.type || 'Anime'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* EDIT VIEW */}
                                        {editingIndex === idx && (
                                            <div className="flex flex-col gap-2 h-full animate-in fade-in duration-200">
                                                {/* Type Filter */}
                                                <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                                                    {['all', 'Serie', 'Pelicula', 'Anime'].map(type => (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => setEditTypeFilter(type)}
                                                            className={`flex-1 px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${editTypeFilter === type
                                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                                : 'text-slate-500 hover:bg-slate-200'
                                                                }`}
                                                        >
                                                            {type === 'all' ? 'Todos' : type}
                                                        </button>
                                                    ))}
                                                </div>

                                                <form onSubmit={handleEditSearch} className="flex gap-2">
                                                    <input
                                                        autoFocus
                                                        className="flex-1 p-2 bg-slate-50 border border-indigo-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                        value={editSearch}
                                                        onChange={(e) => setEditSearch(e.target.value)}
                                                        placeholder="Buscar título correcto..."
                                                    />
                                                    <button type="submit" className="bg-indigo-600 text-white px-3 rounded-lg text-xs font-bold">🔍</button>
                                                    <button onClick={() => setEditingIndex(null)} type="button" className="bg-slate-200 text-slate-500 px-3 rounded-lg text-xs font-bold">✕</button>
                                                </form>

                                                <div className="flex-1 overflow-y-auto max-h-64 bg-slate-50 rounded-lg custom-scrollbar border border-slate-100 p-1">
                                                    {isSearchingEdit ? (
                                                        <div className="text-center py-4 text-xs text-slate-400">Buscando...</div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            {editResults.map((res, rIdx) => (
                                                                <button
                                                                    key={rIdx}
                                                                    onClick={() => selectEditResult(res)}
                                                                    className="w-full flex items-center gap-2 p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-left group"
                                                                >
                                                                    {res.imgUrl && <img src={res.imgUrl} className="w-6 h-8 object-cover rounded" />}
                                                                    <div className="min-w-0">
                                                                        <p className="text-[10px] font-bold text-slate-700 truncate group-hover:text-indigo-600">{res.title}</p>
                                                                        <p className="text-[8px] text-slate-400 uppercase">
                                                                            {res.releaseYear} • {res.type || 'N/A'}
                                                                            {res.totalEp && res.totalEp !== "??" && ` • ${res.totalEp} eps`}
                                                                        </p>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                            {editResults.length === 0 && <p className="text-[10px] text-slate-300 text-center py-2">Sin resultados</p>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 transition-all">
                    {step === 1 && <button onClick={handleParse} disabled={!inputData.trim()} className="bg-indigo-600 text-white font-black text-xs uppercase tracking-widest py-3 px-8 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50">Next</button>}

                    {step === 2 && <button onClick={handleStart} className="bg-green-600 text-white font-black text-xs uppercase tracking-widest py-3 px-8 rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all">Start Batch Import</button>}

                    {step === 4 && (
                        <>
                            <button onClick={onClose} className="text-slate-400 font-bold text-xs uppercase hover:text-red-500 mr-auto px-4">Cancel All</button>
                            <button onClick={confirmBatch} className="bg-indigo-600 text-white font-black text-xs uppercase tracking-widest py-3 px-8 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
                                Import & Next 10 <span className="text-indigo-300">→</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
