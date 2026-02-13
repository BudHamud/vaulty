import { useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Auth from "../components/Auth";
import Header from "../components/Header";
import AnimeForm from "../components/AnimeForm";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import AnimeSections from "../components/AnimeSections";
import ImportModal from "../components/ImportModal";

import { useAuth } from "../hooks/useAuth";
import { useAnimes } from "../hooks/useAnimes";
import { useExportVault } from "../hooks/useExportVault";
import { useUserPreferences } from "../hooks/useUserPreferences";

const AnimeApp = () => {
  const { user, loading: authLoading } = useAuth();
  const { animes, createAnime, updateAnime, deleteAnime, deleteAllAnimes } = useAnimes(user);
  const { downloadTxt } = useExportVault(animes);
  const {
    viewMode,
    setViewMode,
    loading: prefsLoading,
  } = useUserPreferences(user);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null); // null = All
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingAnime, setEditingAnime] = useState(null);
  const [deletingAnimeId, setDeletingAnimeId] = useState(null);

  const filteredAnimes = animes.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? a.type === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const stats = useMemo(
    () => ({
      total: animes.length,
      completed: animes.filter((a) => a.status === "Terminado").length,
      watching: animes.filter((a) => a.status === "Viendo").length,
      eps: animes.reduce((acc, curr) => acc + (curr.currentEp || 0), 0),
    }),
    [animes],
  );

  const handleSubmit = async (data) => {
    if (editingAnime) {
      await updateAnime(editingAnime.id, data);
    } else {
      await createAnime(data);
    }

    setIsModalOpen(false);
    setEditingAnime(null);
  };

  const handleBatchImport = async (importedAnimes) => {
    // Process imports sequentially or in parallel?
    // useHooks likely updates state, so sequential might be safer for UI updates,
    // but parallel is faster. createAnime is likely an async wrapper around supabase insert.

    console.log(`Importing ${importedAnimes.length} animes...`);
    // We can iterate and create.
    for (const anime of importedAnimes) {
      // Check for duplicates?
      const exists = animes.some(a => a.title.toLowerCase() === anime.title.toLowerCase());
      if (!exists) {
        await createAnime(anime);
      }
    }
    // We do NOT close the modal here anymore, to allow "Batch by Batch" importing.
    // The Modal component will call onClose when the user clicks "Finish" or "Close".
  };

  if (authLoading || prefsLoading) return null;
  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-2 sm:p-4 md:p-8 w-full lg:max-w-none transition-colors">
      <button
        onClick={() => supabase.auth.signOut()}
        className="mb-6 text-[10px] font-black text-slate-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-500 uppercase tracking-widest transition-colors"
      >
        Cerrar Sesión
      </button>

      <Header
        stats={stats}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onAdd={() => {
          setEditingAnime(null); // Ensure clean state for new
          setIsModalOpen(true);
        }}
        onImport={() => setIsImportModalOpen(true)}
        onDeleteAll={deleteAllAnimes}
        onDownload={downloadTxt}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <AnimeSections
        animes={filteredAnimes}
        viewMode={viewMode}
        onEdit={(anime) => {
          setEditingAnime(anime);
          setIsModalOpen(true);
        }}
        onDelete={setDeletingAnimeId}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAnime ? "Editar" : "Nuevo Registro"}
      >
        <AnimeForm
          key={editingAnime ? editingAnime.id : "new"} // Force re-render on switch
          initialData={editingAnime}
          onSubmit={handleSubmit}
        />
      </Modal>

      {isImportModalOpen && (
        <ImportModal
          existingAnimes={animes}
          onImport={handleBatchImport}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}

      <ConfirmModal
        isOpen={!!deletingAnimeId}
        onClose={() => setDeletingAnimeId(null)}
        onConfirm={async () => {
          const idABorrar = deletingAnimeId;
          setDeletingAnimeId(null);
          await deleteAnime(idABorrar);
        }}
        title={
          animes.find((a) => a.id === deletingAnimeId)?.title || "este anime"
        }
      />
    </div>
  );
};

export default AnimeApp;
