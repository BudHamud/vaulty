import ThemeToggle from './ThemeToggle';
import CategoryNav from './CategoryNav';
import type { VaultStats, ViewMode } from '@/types/anime';

interface HeaderProps {
    stats: VaultStats;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onAdd: () => void;
    onImport: () => void;
    onDeleteAll: () => void;
    onDownload: () => void;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    selectedCategory: string | null;
    onSelectCategory: (cat: string | null) => void;
}

const Header = ({
    stats, searchTerm, setSearchTerm, onAdd, onImport,
    onDeleteAll, onDownload, viewMode, setViewMode, selectedCategory, onSelectCategory
}: HeaderProps) => {
    return (
        <header className="mb-6 sm:mb-10 flex flex-col gap-4 sm:gap-6">
            {/* Top Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Vaulty</h1>
                    <div className="flex gap-2 sm:gap-4 mt-2">
                        <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded">TOT: {stats.total}</span>
                        <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 px-2 py-1 rounded">DONE: {stats.completed}</span>
                        <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 px-2 py-1 rounded">EPS: {stats.eps}</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                    <input
                        type="text" value={searchTerm} placeholder="Buscar..."
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 w-full sm:w-64 text-sm shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <button onClick={onAdd} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-4 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-all">
                        <span className="hidden sm:inline">+ NUEVO</span><span className="sm:hidden">+</span>
                    </button>
                    <button onClick={onImport} className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition-all uppercase tracking-widest">
                        <span className="hidden sm:inline">Importar</span><span className="sm:hidden">📥</span>
                    </button>
                    <ThemeToggle />
                </div>
            </div>

            {/* Bottom Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <CategoryNav selected={selectedCategory} onSelect={onSelectCategory} />
                <div className="flex flex-wrap gap-3 sm:gap-4 w-full sm:w-auto">
                    <button onClick={() => { if (window.confirm("¿ESTÁS SEGURO? Esto borrará TODA tu base de datos de Vaulty.")) onDeleteAll(); }} className="text-[10px] font-black text-red-300 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-1">
                        🧨 Borrar Todo
                    </button>
                    <button onClick={onDownload} className="text-[10px] font-black text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest flex items-center gap-1">
                        📋 Exportar Lista
                    </button>
                </div>
            </div>

            <div className="flex gap-2 bg-slate-200 dark:bg-slate-700 p-1 rounded-xl">
                {(['list', 'grid'] as const).map((mode) => (
                    <button key={mode} onClick={() => setViewMode(mode)} className={`p-2 rounded-lg transition-all ${viewMode === mode ? "bg-white dark:bg-slate-600 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
                        {mode === 'list' ? '☰' : '𐄹'}
                    </button>
                ))}
            </div>
        </header>
    );
};

export default Header;
