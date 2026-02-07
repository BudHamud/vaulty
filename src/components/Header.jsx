const Header = ({
  stats,
  searchTerm,
  setSearchTerm,
  onAdd,
  onDownload,
  viewMode,
  setViewMode,
}) => {
  return (
    <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
          Vaulty
        </h1>

        <div className="flex gap-4 mt-2">
          <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-2 py-1 rounded">
            TOT: {stats.total}
          </span>
          <span className="text-[10px] font-black bg-emerald-100 text-emerald-600 px-2 py-1 rounded">
            DONE: {stats.completed}
          </span>
          <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-1 rounded">
            EPS: {stats.eps}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          value={searchTerm}
          placeholder="Buscar en la bóveda..."
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 w-64 text-sm shadow-sm"
        />

        <button
          onClick={onAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg transition-all"
        >
          + NUEVO
        </button>
      </div>

      <button
        onClick={onDownload}
        className="text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest flex items-center gap-1"
      >
        📋 Exportar Lista
      </button>

      <div className="flex gap-2 bg-slate-200 p-1 rounded-xl">
        <button
          onClick={() => setViewMode("list")}
          className={`p-2 rounded-lg transition-all ${
            viewMode === "list"
              ? "bg-white shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          ☰
        </button>
        <button
          onClick={() => setViewMode("grid")}
          className={`p-2 rounded-lg transition-all ${
            viewMode === "grid"
              ? "bg-white shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          𐄹
        </button>
      </div>
    </header>
  );
};

export default Header;