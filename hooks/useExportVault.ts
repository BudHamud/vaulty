import type { Anime } from "@/types/anime";

export const useExportVault = (animes: Anime[]): { downloadTxt: () => void } => {
    const downloadTxt = () => {
        if (!animes || animes.length === 0) {
            alert("La bóveda está vacía");
            return;
        }

        const date = new Date().toLocaleDateString();
        let text = `📖 MI BÓVEDA DE ANIME (${date})\n`;
        text += `--------------------------------\n\n`;

        const statusOrder: Anime["status"][] = ["Viendo", "Pendiente", "Terminado"];

        statusOrder.forEach((status) => {
            const list = animes
                .filter((a) => a.status === status)
                .sort((a, b) => {
                    const dateA = new Date(
                        status === "Terminado" ? (a.finishDate ?? "") : (a.startDate ?? ""),
                    );
                    const dateB = new Date(
                        status === "Terminado" ? (b.finishDate ?? "") : (b.startDate ?? ""),
                    );
                    return dateB.getTime() - dateA.getTime();
                });

            if (!list.length) return;

            text += `[${status.toUpperCase()}]\n`;
            list.forEach((a) => {
                const year =
                    status === "Terminado"
                        ? a.finishDate?.split("-")[0] || "????"
                        : a.startDate?.split("-")[0] || "????";

                text += `- (${year}) ${a.title} [${a.currentEp}/${a.totalEp || "??"}]\n`;
            });
            text += "\n";
        });

        const blob = new Blob([text], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `vaulty_export_${date.replace(/\//g, "-")}.txt`;
        link.click();
    };

    return { downloadTxt };
};
