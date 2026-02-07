  const handleSubmit = (data) => {
    if (editingAnime) {
      // IMPORTANTE: Mantenemos el ID que ya tenía el anime en nuestra lista
      setAnimes(
        animes.map((a) =>
          a.id === editingAnime.id ? { ...data, id: editingAnime.id } : a,
        ),
      );
    } else {
      // Si es nuevo, generamos uno
      setAnimes([{ ...data, id: Date.now() }, ...animes]);
    }
    setIsModalOpen(false);
    setEditingAnime(null);
  };

    useEffect(
    () => localStorage.setItem("anime-vault-v4", JSON.stringify(animes)),
    [animes],{})


    const cleanAnimeData = (data) => {
        return data.map((anime) => {
          // 1. Sanitizar fechas (quitar "Estreno", etc.)
          const sanitizeDate = (dateStr) => {
            if (!dateStr) return "";
            return dateStr.replace(/estreno/gi, "").trim();
          };
    
          // 2. Migrar note -> description
          // Usamos anime.description si ya existe, de lo contrario usamos anime.note
          const descriptionValue = anime.description || anime.note || "";
    
          // 3. Extraemos 'note' para que no quede en el objeto final
          const { note, ...restOfAnime } = anime;
    
          return {
            ...restOfAnime, // Mantenemos el resto (id, title, status, etc.)
            startDate: sanitizeDate(anime.startDate),
            finishDate: sanitizeDate(anime.finishDate),
            description: String(descriptionValue), // Nos aseguramos que sea texto
            isFocus: anime.isFocus || false,
            currentEp: anime.currentEp || 0,
            totalEp: anime.totalEp || 0,
          };
        });
      };