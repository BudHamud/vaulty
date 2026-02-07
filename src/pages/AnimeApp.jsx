import { useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Auth from "../components/Auth";
import Header from "../components/Header";
import AnimeForm from "../components/AnimeForm";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import AnimeSections from "../components/AnimeSections";

import { useAuth } from "../hooks/useAuth";
import { useAnimes } from "../hooks/useAnimes";
import { useExportVault } from "../hooks/useExportVault";
import { useUserPreferences } from "../hooks/useUserPreferences";

const AnimeApp = () => {
  const { user, loading: authLoading } = useAuth();
  const { animes, createAnime, updateAnime, deleteAnime } = useAnimes(user);
  const { downloadTxt } = useExportVault(animes);
  const {
    viewMode,
    setViewMode,
    loading: prefsLoading,
  } = useUserPreferences(user);

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnime, setEditingAnime] = useState(null);
  const [deletingAnimeId, setDeletingAnimeId] = useState(null);

  const fixExistingDescriptions = async () => {
  console.log("Reparando descripciones existentes...");
  
  for (const anime of animes) {
    try {
      const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(anime.title)}&limit=1`);
      const resJson = await response.json();
      const s = resJson.data?.[0];

      if (s) {
        const releaseYear = s.aired?.from?.split("-")[0] || "????";
        const newDesc = `${releaseYear}. ${s.score ? `${s.score}/10. ` : ""}${s.synopsis?.substring(0, 150)}...`;

        await updateAnime(anime.id, { ...anime, description: newDesc });
        console.log(`🔧 Actualizado: ${anime.title}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (e) {
      console.error("Error actualizando:", anime.title);
    }
  }
  alert("Proceso de reparación terminado.");
};

  const filteredAnimes = animes.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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

  if (authLoading || prefsLoading) return null;
  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 w-full lg:max-w-none">
      <button
        onClick={() => supabase.auth.signOut()}
        className="mb-6 text-[10px] font-black text-slate-300 hover:text-red-400 uppercase tracking-widest"
      >
        Cerrar Sesión
      </button>

      <Header
        stats={stats}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onAdd={() => setIsModalOpen(true)}
        onDownload={downloadTxt}
        viewMode={viewMode}
        setViewMode={setViewMode}
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
        title={editingAnime ? "Editar Anime" : "Nuevo Registro"}
      >
        <AnimeForm
          key={editingAnime?.id || "new"}
          initialData={editingAnime}
          onSubmit={handleSubmit}
        />
      </Modal>

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
