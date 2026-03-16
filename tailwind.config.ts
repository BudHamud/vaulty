import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                vaulty: {
                    bg: "#13141f",
                    sidebar: "#0d0e1a",
                    card: "#1a1b2e",
                    "card-hover": "#1f2035",
                    border: "#252738",
                    accent: "#6c5ce7",
                    "accent-hover": "#5a4dd4",
                    text: "#e2e8f0",
                    muted: "#6b7280",
                },
            },
        },
    },
    plugins: [],
};

export default config;
