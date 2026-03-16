import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vaulty - Tu Colección Personal",
  description: "Gestiona tu colección de series, películas y anime",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="dark">
      <body className="antialiased bg-vaulty-bg text-vaulty-text">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
