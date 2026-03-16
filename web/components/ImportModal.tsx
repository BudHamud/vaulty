import React, { useState } from "react";
import { searchAnimeOnMAL, searchOnTMDB } from "@/lib/api";
import type { Anime, AnimeStatus, AnimeType, SearchResult } from "@/types/anime";

type ImportSource = 'crunchyroll' | 'netflix' | 'primevideo';

interface RawItem {
    title: string;
    originalTitle?: string;
    status: AnimeStatus;
    currentEp: number;
    totalEp: string | number;
    imgUrl: string;
    startDate: string;
    finishDate: string;
    description: string;
    isFocus: boolean;
    type?: AnimeType;
    score?: number;
    synopsis?: string;
    releaseYear?: string;
    rating?: number;
}

interface EnrichedItem extends RawItem {
    isTMDB?: boolean;
}

interface ImportModalProps {
    existingAnimes?: Anime[];
    onImport: (items: Partial<Anime>[]) => Promise<void>;
    onClose: () => void;
}

const ImportModal = ({ existingAnimes = [], onImport, onClose }: ImportModalProps) => {
    const [source, setSource] = useState<ImportSource>("crunchyroll");
    const [inputData, setInputData] = useState("");
    const [parsedData, setParsedData] = useState<RawItem[]>([]);

    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const [batchIndex, setBatchIndex] = useState(0);
    const [currentBatch, setCurrentBatch] = useState<EnrichedItem[]>([]);
    const BATCH_SIZE = 10;
    const [tmdbKey, setTmdbKey] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("tmdb_api_key") || "" : ""));

    const parseCrunchyroll = (json: string): RawItem[] => {
        try {
            const data = JSON.parse(json);
            if (!Array.isArray(data)) throw new Error("Format invalid.");
            return data.map((item: Record<string, unknown>) => ({
                title: String(item.title ?? ''),
                status: (String(item.status ?? "Pendiente")) as AnimeStatus,
                currentEp: typeof item.currentEp === 'number' ? item.currentEp : 0,
                totalEp: "??",
                imgUrl: String(item.imgUrl ?? ''),
                startDate: new Date().toISOString().split('T')[0],
                finishDate: "",
                rating: 0,
                description: item.seriesUrl ? `Imported from Crunchyroll: ${item.seriesUrl}` : "Imported from Crunchyroll.",
                isFocus: false,
            }));
        } catch { throw new Error("Invalid JSON."); }
    };

    type SeriesMapEntry = { count: number; dates: string[]; baseName: string; fullTitle: string };

    const parsePrimeVideo = (input: string): RawItem[] => {
        try {
            const data = JSON.parse(input);
            if (Array.isArray(data)) {
                return data.map((item: Record<string, unknown>) => ({
                    title: String(item.title ?? ''),
                    status: (String(item.status ?? 'Pendiente')) as AnimeStatus,
                    currentEp: typeof item.currentEp === 'number' ? item.currentEp : 0,
                    totalEp: '??', imgUrl: String(item.imgUrl ?? ''),
                    startDate: String(item.startDate ?? new Date().toISOString().split('T')[0]),
                    finishDate: String(item.lastDate ?? ''),
                    rating: 0,
                    description: item.contentUrl ? `Imported from Prime Video: ${item.contentUrl}` : 'Imported from Prime Video.',
                    isFocus: false,
                }));
            }
        } catch { /* fall through to CSV */ }

        const lines = input.split('\n').filter(l => l.trim().length > 0);
        const dataLines = lines[0].toLowerCase().includes('title') ? lines.slice(1) : lines;
        const seriesMap: Record<string, SeriesMapEntry> = {};

        const parseDate = (dateStr: string): string | null => {
            if (!dateStr) return null;
            try {
                const clean = dateStr.replace(/"/g, '').trim();
                const datePart = clean.split(' ')[0];
                if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
                return null;
            } catch { return null; }
        };

        dataLines.forEach(line => {
            let title = '', dateStr = '';
            if (line.startsWith('"')) {
                const closeQuote = line.indexOf('"', 1);
                title = line.substring(1, closeQuote);
                dateStr = line.substring(closeQuote + 2).split(',')[0];
            } else {
                const parts = line.split(',');
                title = parts[0];
                dateStr = parts[1] || '';
            }
            title = title.trim();
            if (!title) return;
            const date = parseDate(dateStr);
            const baseName = title.replace(/ - Season \d+.*/i, '').replace(/: Season \d+.*/i, '').replace(/: Temporada \d+.*/i, '').replace(/: Episode \d+.*/i, '').replace(/: Episodio \d+.*/i, '').split(':')[0].trim();
            if (!seriesMap[baseName]) seriesMap[baseName] = { count: 0, dates: [], baseName, fullTitle: title };
            seriesMap[baseName].count++;
            if (date) seriesMap[baseName].dates.push(date);
        });

        return Object.values(seriesMap).map(s => {
            s.dates.sort();
            const firstDate = s.dates[0] || new Date().toISOString().split('T')[0];
            const lastDate = s.dates[s.dates.length - 1] || '';
            return { title: s.baseName, originalTitle: s.fullTitle, status: 'Pendiente' as AnimeStatus, currentEp: s.count, totalEp: '??', imgUrl: '', score: 0, synopsis: '', releaseYear: firstDate.split('-')[0] || '????', type: undefined, startDate: firstDate, finishDate: lastDate, description: '', isFocus: false };
        });
    };

    const parseNetflix = (csv: string): RawItem[] => {
        const lines = csv.split('\n').filter(l => l.trim().length > 0);
        const seriesMap: Record<string, SeriesMapEntry & { isEpisode: boolean }> = {};

        const parseDate = (dateStr: string): string | null => {
            if (!dateStr) return null;
            try {
                const clean = dateStr.replace(/"/g, '').trim();
                const part = clean.split('/');
                if (part.length !== 3) return null;
                const year = 2000 + parseInt(part[2]);
                const month = parseInt(part[0]); const day = parseInt(part[1]);
                if (month > 12) return new Date(year, day - 1, month).toISOString().split('T')[0];
                return new Date(year, month - 1, day).toISOString().split('T')[0];
            } catch { return null; }
        };

        lines.forEach(line => {
            const match = line.match(/^"([^"]+)","([^"]+)"/);
            if (!match) return;
            const fullTitle = match[1], date = parseDate(match[2]);
            const baseName = fullTitle.split(':')[0].trim();
            const isEpisodeTitle = !!fullTitle.match(/:.*(temporada|season|episodio|episode|ep\.|capítulo|pilot|piloto)/i);
            if (!seriesMap[baseName]) seriesMap[baseName] = { count: 0, dates: [], baseName, fullTitle, isEpisode: isEpisodeTitle };
            seriesMap[baseName].count++;
            if (date) seriesMap[baseName].dates.push(date);
        });

        return Object.values(seriesMap).map(s => {
            s.dates.sort();
            const firstDate = s.dates[0] || new Date().toISOString().split('T')[0];
            const lastDate = s.dates[s.dates.length - 1] || "";
            return { title: s.baseName, originalTitle: s.fullTitle, status: "Pendiente" as AnimeStatus, currentEp: s.count, totalEp: "??", imgUrl: "", score: 0, synopsis: "", releaseYear: firstDate.split('-')[0] || "????", type: undefined, startDate: firstDate, finishDate: lastDate, description: '', isFocus: false };
        });
    };

    const handleParse = () => {
        if ((source === 'netflix' || source === 'primevideo') && !tmdbKey) { setError("Por favor ingresa tu API Key de TMDB."); return; }
        if (source === 'netflix' || source === 'primevideo') localStorage.setItem("tmdb_api_key", tmdbKey);
        setError(null);
        try {
            let data: RawItem[] = [];
            if (source === "crunchyroll") data = parseCrunchyroll(inputData);
            else if (source === "primevideo") data = parsePrimeVideo(inputData);
            else data = parseNetflix(inputData);

            const newData = data.filter(item => !existingAnimes.some(e => e.title.toLowerCase() === item.title.toLowerCase()));
            if (newData.length === 0) throw new Error(data.length > 0 ? "All items already exist!" : "No entries found.");
            setParsedData(newData); setStep(2);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Parse error"); }
    };

    const processBatch = async (startIndex: number) => {
        setStep(3);
        const batchRaw = parsedData.slice(startIndex, startIndex + BATCH_SIZE);
        const enrichedBatch: EnrichedItem[] = [];

        for (let i = 0; i < batchRaw.length; i++) {
            const item = batchRaw[i];
            setProgress({ current: startIndex + i + 1, total: parsedData.length });
            let enriched: EnrichedItem = { ...item };

            try {
                let bestMatch: (SearchResult & { isTMDB?: boolean }) | null = null;
                if (source === 'netflix' || source === 'primevideo') {
                    try {
                        const tmdbResults = await searchOnTMDB(item.title);
                        if (tmdbResults?.length > 0) {
                            let match = tmdbResults[0];
                            const originalTitle = item.originalTitle || item.title;
                            const hasSeriesKeywords = originalTitle.match(/(episode|ep\.|season|temporada|capítulo|pilot|piloto|s\d+e\d+)/i);
                            const isSimpleTitle = !originalTitle.includes(':') && !originalTitle.includes(',');
                            if (item.currentEp > 1 || hasSeriesKeywords) {
                                const validSeries = tmdbResults.find(r => (r.type === 'Serie' || r.type === 'Anime') && (r.totalEp === "??" || Number(r.totalEp) >= item.currentEp));
                                if (validSeries) match = validSeries;
                                else { const anySeries = tmdbResults.find(r => r.type === 'Serie' || r.type === 'Anime'); if (anySeries) match = anySeries; }
                            } else {
                                const movieMatch = isSimpleTitle ? tmdbResults.find(r => r.type === 'Pelicula') : tmdbResults.find(r => r.type === 'Pelicula');
                                if (movieMatch) match = movieMatch;
                            }
                            bestMatch = { ...match, isTMDB: true };
                        }
                    } catch (e) { console.error("TMDB error:", e); }
                    if (!bestMatch) {
                        const couldBeAnime = /anime|dragon|naruto|bleach|one piece|attack on titan|sword art|demon slayer|hunter x hunter/i.test(item.title);
                        if (couldBeAnime) { try { const mal = await searchAnimeOnMAL(item.title); if (mal?.[0]) bestMatch = mal[0]; } catch { /* ignore */ } }
                    }
                } else {
                    try { const mal = await searchAnimeOnMAL(item.title); if (mal?.[0]) bestMatch = mal[0]; } catch { /* ignore */ }
                    if (!bestMatch) { try { const tmdb = await searchOnTMDB(item.title); if (tmdb?.[0]) bestMatch = { ...tmdb[0], isTMDB: true }; } catch { /* ignore */ } }
                }

                if (bestMatch) {
                    const sourceTag = bestMatch.isTMDB ? "(Src: TMDB)" : "(Src: MAL)";
                    enriched.imgUrl = bestMatch.imgUrl || enriched.imgUrl;
                    enriched.totalEp = bestMatch.totalEp || "??";
                    enriched.description = bestMatch.synopsis ? `${bestMatch.releaseYear}. Score: ${bestMatch.score}. ${sourceTag}\n\n${bestMatch.synopsis.substring(0, 300)}...` : enriched.description;
                    enriched.rating = bestMatch.score || 0;
                    enriched.type = (source === 'crunchyroll' ? 'Anime' : (bestMatch.type || 'Anime')) as AnimeType;
                    if (enriched.totalEp !== "??" && enriched.currentEp >= Number(enriched.totalEp)) {
                        enriched.status = "Terminado";
                        if (!enriched.finishDate) enriched.finishDate = new Date().toISOString().split('T')[0];
                    } else { enriched.status = "Pendiente"; }
                }
            } catch { console.warn(`Failed to enrich ${item.title}`); }

            enrichedBatch.push(enriched);
            await new Promise(r => setTimeout(r, 50));
        }

        setCurrentBatch(enrichedBatch); setStep(4);
    };

    const handleStart = () => { setBatchIndex(0); processBatch(0); };

    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editSearch, setEditSearch] = useState("");
    const [editResults, setEditResults] = useState<SearchResult[]>([]);
    const [isSearchingEdit, setIsSearchingEdit] = useState(false);
    const [editTypeFilter, setEditTypeFilter] = useState("all");
    const [editingEpisodeIndex, setEditingEpisodeIndex] = useState<number | null>(null);

    const handleEditSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editSearch.trim()) return;
        setIsSearchingEdit(true);
        try {
            let results: SearchResult[] = [];
            try { const tmdb = await searchOnTMDB(editSearch); results = [...results, ...tmdb]; } catch { /* ignore */ }
            try { const mal = await searchAnimeOnMAL(editSearch); results = [...results, ...mal]; } catch { /* ignore */ }
            if (editTypeFilter !== "all") results = results.filter(r => r.type === editTypeFilter);
            setEditResults(results.slice(0, 20));
        } catch { /* ignore */ }
        setIsSearchingEdit(false);
    };

    const selectEditResult = (result: SearchResult) => {
        const updatedBatch = [...currentBatch];
        const orig = updatedBatch[editingIndex!];
        const sourceTag = "(Src: auto)";
        updatedBatch[editingIndex!] = {
            ...orig, title: result.title, imgUrl: result.imgUrl || orig.imgUrl, totalEp: result.totalEp || "??",
            description: result.synopsis ? `${result.releaseYear}. Score: ${result.score}. ${sourceTag}\n\n${result.synopsis.substring(0, 300)}...` : orig.description,
            rating: result.score || 0, type: (source === 'crunchyroll' ? 'Anime' : (result.type || 'Anime')) as AnimeType,
            status: (result.totalEp !== "??" && orig.currentEp >= Number(result.totalEp)) ? "Terminado" : "Pendiente",
        };
        if (updatedBatch[editingIndex!].status === "Terminado" && !updatedBatch[editingIndex!].finishDate)
            updatedBatch[editingIndex!].finishDate = new Date().toISOString().split('T')[0];
        setCurrentBatch(updatedBatch); setEditingIndex(null); setEditSearch(""); setEditResults([]);
    };

    const confirmBatch = async () => {
        await onImport(currentBatch as unknown as Partial<Anime>[]);
        const nextIndex = batchIndex + BATCH_SIZE;
        if (nextIndex < parsedData.length) { setBatchIndex(nextIndex); processBatch(nextIndex); }
        else onClose();
    };

    const deleteFromBatch = (index: number) => {
        const updated = currentBatch.filter((_, idx) => idx !== index);
        setCurrentBatch(updated);
        if (updated.length === 0) {
            const nextIndex = batchIndex + BATCH_SIZE;
            if (nextIndex < parsedData.length) { setBatchIndex(nextIndex); processBatch(nextIndex); }
            else onClose();
        }
    };

    const updateEpisodeCount = (index: number, newCount: string) => {
        const updated = [...currentBatch];
        const item = updated[index];
        const count = parseInt(newCount) || 0;
        item.currentEp = count;
        if (item.totalEp !== "??" && count >= Number(item.totalEp)) {
            item.status = "Terminado";
            if (!item.finishDate) item.finishDate = new Date().toISOString().split('T')[0];
        } else { item.status = "Pendiente"; }
        setCurrentBatch(updated); setEditingEpisodeIndex(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-vaulty-sidebar rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-vaulty-border bg-vaulty-card flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-vaulty-text uppercase tracking-tight">
                            {step >= 3 ? `Importing ${batchIndex + 1} - ${Math.min(batchIndex + BATCH_SIZE, parsedData.length)} / ${parsedData.length}` : "Import Data"}
                        </h2>
                        <p className="text-xs text-vaulty-muted font-bold uppercase mt-1">Batch Mode</p>
                    </div>
                    {step < 3 && <button onClick={onClose} className="text-vaulty-muted font-bold text-xl">&times;</button>}
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="flex p-1 bg-vaulty-border rounded-xl mb-4 w-fit">
                                {(['crunchyroll', 'netflix', 'primevideo'] as ImportSource[]).map((src) => (
                                    <button key={src} onClick={() => setSource(src)} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${source === src ? "bg-vaulty-sidebar shadow-sm" : "text-vaulty-muted"}`}>
                                        {src === 'crunchyroll' ? 'Crunchyroll' : src === 'netflix' ? 'Netflix CSV' : 'Prime Video'}
                                    </button>
                                ))}
                            </div>
                            {(source === 'netflix' || source === 'primevideo') && (
                                <div className="mb-4">
                                    <label className="text-[10px] font-black uppercase text-vaulty-muted">TMDB API Key (Required)</label>
                                    <input type="text" className="w-full p-2 bg-vaulty-card border border-vaulty-border rounded-lg text-xs font-mono outline-none" placeholder="Paste your TMDB API key..." value={tmdbKey} onChange={(e) => setTmdbKey(e.target.value)} />
                                    <p className="text-[10px] text-vaulty-muted mt-1">Get it free at <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer" className="text-indigo-500 underline">themoviedb.org</a></p>
                                </div>
                            )}
                            <textarea className="w-full h-64 p-4 bg-vaulty-card border border-vaulty-border rounded-2xl text-xs font-mono text-vaulty-muted outline-none resize-none" placeholder={source === 'crunchyroll' ? 'Paste JSON from Vaulty Crunchyroll Exporter...' : source === 'primevideo' ? 'Paste JSON from Vaulty Prime Video Exporter...' : 'Paste Netflix ViewingActivity.csv content...'} value={inputData} onChange={e => setInputData(e.target.value)} />
                            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-vaulty-muted">Ready to import <span className="text-vaulty-accent">{parsedData.length} new items</span>.</p>
                            <p className="text-xs text-vaulty-muted">We will process them in batches of 10 so you can verify the data.</p>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                            <h3 className="text-lg font-black text-vaulty-text">Analyzing Batch...</h3>
                            <p className="text-sm text-vaulty-muted font-bold">Item {progress.current} of {parsedData.length}</p>
                        </div>
                    )}
                    {step === 4 && (
                        <div>
                            <p className="text-sm font-bold text-vaulty-muted mb-4">Review this batch ({currentBatch.length} items):</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentBatch.map((item, idx) => (
                                    <div key={idx} className={`flex flex-col p-3 border rounded-xl bg-vaulty-sidebar hover:shadow-md transition-all ${editingIndex === idx ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-vaulty-border'}`}>
                                        {editingIndex !== idx && (
                                            <div className="flex gap-3">
                                                {item.imgUrl ? <img src={item.imgUrl} alt={item.title} className="w-16 h-24 object-cover rounded-lg shadow-sm" /> : <div className="w-16 h-24 bg-vaulty-card rounded-lg flex items-center justify-center text-vaulty-muted text-xs font-bold">NO IMG</div>}
                                                <div className="flex-1 min-w-0 relative">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-black text-vaulty-text truncate">{item.title}</h4>
                                                            {item.originalTitle && item.originalTitle !== item.title && <p className="text-[9px] text-vaulty-muted italic truncate">Netflix: {item.originalTitle}</p>}
                                                        </div>
                                                        <div className="flex gap-1 flex-shrink-0">
                                                            <button onClick={() => { setEditingIndex(idx); setEditSearch(item.originalTitle || item.title); setEditResults([]); }} className="text-vaulty-muted hover:text-vaulty-accent transition-colors text-sm" title="Edit">✎</button>
                                                            <button onClick={() => deleteFromBatch(idx)} className="text-vaulty-muted hover:text-red-600 transition-colors text-sm">🗑️</button>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-1 flex-wrap">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.status === 'Terminado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{item.status}</span>
                                                        {editingEpisodeIndex === idx ? (
                                                            <input type="number" autoFocus defaultValue={item.currentEp} onKeyDown={(e) => { if (e.key === 'Enter') updateEpisodeCount(idx, (e.target as HTMLInputElement).value); else if (e.key === 'Escape') setEditingEpisodeIndex(null); }} onBlur={(e) => updateEpisodeCount(idx, e.target.value)} className="w-12 text-[10px] font-bold bg-vaulty-card border border-vaulty-border rounded px-1 py-0.5 text-center outline-none" />
                                                        ) : (
                                                            <span onClick={() => setEditingEpisodeIndex(idx)} className="text-[10px] font-bold bg-vaulty-card text-vaulty-muted px-2 py-0.5 rounded cursor-pointer hover:bg-indigo-100 hover:text-indigo-700 transition-colors">{item.currentEp} / {item.totalEp}</span>
                                                        )}
                                                        <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-2 py-0.5 rounded uppercase">{item.type || 'Anime'}</span>
                                                    </div>
                                                    <p className="text-[10px] text-vaulty-muted mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
                                                </div>
                                            </div>
                                        )}
                                        {editingIndex === idx && (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex gap-1 p-1 bg-vaulty-card rounded-lg">
                                                    {['all', 'Serie', 'Pelicula', 'Anime'].map(type => (
                                                        <button key={type} type="button" onClick={() => setEditTypeFilter(type)} className={`flex-1 px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${editTypeFilter === type ? 'bg-vaulty-accent text-white shadow-sm' : 'text-vaulty-muted hover:bg-vaulty-border'}`}>
                                                            {type === 'all' ? 'Todos' : type}
                                                        </button>
                                                    ))}
                                                </div>
                                                <form onSubmit={handleEditSearch} className="flex gap-2">
                                                    <input autoFocus className="flex-1 p-2 bg-vaulty-card border border-vaulty-border rounded-lg text-xs font-bold text-vaulty-text outline-none" value={editSearch} onChange={(e) => setEditSearch(e.target.value)} placeholder="Search correct title..." />
                                                    <button type="submit" className="bg-vaulty-accent text-white px-3 rounded-lg text-xs font-bold">🔍</button>
                                                    <button onClick={() => setEditingIndex(null)} type="button" className="bg-vaulty-border text-vaulty-muted px-3 rounded-lg text-xs font-bold">✕</button>
                                                </form>
                                                <div className="flex-1 overflow-y-auto max-h-64 bg-vaulty-card rounded-lg border border-vaulty-border p-1">
                                                    {isSearchingEdit ? <div className="text-center py-4 text-xs text-vaulty-muted">Searching...</div> : (
                                                        <div className="space-y-1">
                                                            {editResults.map((res, rIdx) => (
                                                                <button key={rIdx} onClick={() => selectEditResult(res)} className="w-full flex items-center gap-2 p-1.5 hover:bg-vaulty-sidebar rounded-md transition-all text-left group">
                                                                    {res.imgUrl && <img src={res.imgUrl} alt={res.title} className="w-6 h-8 object-cover rounded" />}
                                                                    <div className="min-w-0">
                                                                        <p className="text-[10px] font-bold text-vaulty-text truncate group-hover:text-vaulty-accent">{res.title}</p>
                                                                        <p className="text-[8px] text-vaulty-muted uppercase">{res.releaseYear} • {res.type || 'N/A'}{res.totalEp && res.totalEp !== "??" ? ` • ${res.totalEp} eps` : ''}</p>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                            {editResults.length === 0 && <p className="text-[10px] text-vaulty-muted text-center py-2">No results</p>}
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
                <div className="p-6 border-t border-vaulty-border bg-vaulty-card flex justify-end gap-3">
                    {step === 1 && <button onClick={handleParse} disabled={!inputData.trim()} className="bg-vaulty-accent text-white font-black text-xs uppercase tracking-widest py-3 px-8 rounded-xl hover:bg-vaulty-accent-hover shadow-lg transition-all disabled:opacity-50">Next</button>}
                    {step === 2 && <button onClick={handleStart} className="bg-green-600 text-white font-black text-xs uppercase tracking-widest py-3 px-8 rounded-xl hover:bg-green-700 shadow-lg transition-all">Start Batch Import</button>}
                    {step === 4 && (
                        <>
                            <button onClick={onClose} className="text-vaulty-muted font-bold text-xs uppercase hover:text-red-500 mr-auto px-4">Cancel All</button>
                            <button onClick={confirmBatch} className="bg-vaulty-accent text-white font-black text-xs uppercase tracking-widest py-3 px-8 rounded-xl hover:bg-vaulty-accent-hover shadow-lg transition-all flex items-center gap-2">Import & Next 10 <span className="text-indigo-300">→</span></button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
