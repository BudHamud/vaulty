'use client'

const navItems = [
    { id: "home", label: "Home", icon: (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>), filter: null },
    { id: "movies", label: "Movies", icon: (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4zm2 0h1V9h-1v2zm1-4V5h-1v2h1zM5 5v2H4V5h1zm-1 4h1v2H4V9zm0 4h1v2H4v-2z" clipRule="evenodd" /></svg>), filter: "Pelicula" },
    { id: "tvshows", label: "TV Shows", icon: (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" /></svg>), filter: "Serie" },
    { id: "mylist", label: "My List", icon: (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>), filter: "Pendiente" },
    { id: "stats", label: "Stats", icon: (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>), filter: "__stats" },
];

interface SidebarProps {
    activeView: string;
    onNavigate: (view: string) => void;
    username: string | null;
    onSettings: () => void;
    onAdd: () => void;
}

export default function Sidebar({ activeView, onNavigate, username, onSettings, onAdd }: SidebarProps) {
    return (
        <>
            {/* ── DESKTOP sidebar ────────────────────────────────────────────── */}
            <aside className="hidden lg:flex w-52 shrink-0 flex-col bg-vaulty-sidebar min-h-screen py-6 px-3 border-r border-vaulty-border">
                <div className="px-3 mb-8">
                    <h1 className="text-xl font-black text-white tracking-tight">Vaulty</h1>
                </div>

                <nav className="flex flex-col gap-1 flex-1">
                    {navItems.filter(item => ["home", "mylist", "stats"].includes(item.id)).map((item) => {
                        const isActive = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left w-full ${isActive ? "bg-vaulty-accent text-white shadow-lg shadow-vaulty-accent/20" : "text-vaulty-muted hover:text-vaulty-text hover:bg-vaulty-card"}`}
                            >
                                {item.icon}{item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="flex flex-col gap-1 mt-4 pt-4 border-t border-vaulty-border">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-vaulty-muted cursor-default">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        <span className="truncate">{username ? `@${username}` : "Profile"}</span>
                    </div>
                    <button onClick={onSettings} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-vaulty-muted hover:text-vaulty-text hover:bg-vaulty-card transition-all text-left w-full">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                        Settings
                    </button>
                </div>
            </aside>

            {/* ── MOBILE bottom nav bar ────────────────────────────── */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-vaulty-sidebar border-t border-vaulty-border flex items-end justify-around px-2 pb-3 pt-2 safe-area-inset-bottom">
                <button onClick={() => onNavigate("home")} className={`flex flex-col items-center gap-1 px-3 py-1 transition-all ${activeView === "home" ? "text-vaulty-accent" : "text-vaulty-muted"}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                    <span className="text-[9px] font-bold">Home</span>
                </button>
                <button onClick={() => onNavigate("mylist")} className={`flex flex-col items-center gap-1 px-3 py-1 transition-all ${activeView === "mylist" ? "text-vaulty-accent" : "text-vaulty-muted"}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                    <span className="text-[9px] font-bold">My List</span>
                </button>
                <button onClick={onAdd} className="flex flex-col items-center gap-1 px-2 -mt-5 transition-all">
                    <span className="w-12 h-12 rounded-full bg-vaulty-accent flex items-center justify-center shadow-lg shadow-vaulty-accent/40">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    </span>
                    <span className="text-[9px] font-bold text-vaulty-muted mt-0.5">Add</span>
                </button>
                <button onClick={() => onNavigate("stats")} className={`flex flex-col items-center gap-1 px-3 py-1 transition-all ${activeView === "stats" ? "text-vaulty-accent" : "text-vaulty-muted"}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                    <span className="text-[9px] font-bold">Stats</span>
                </button>
                <button onClick={onSettings} className="flex flex-col items-center gap-1 px-3 py-1 transition-all text-vaulty-muted">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                    <span className="text-[9px] font-bold">Profile</span>
                </button>
            </nav>
        </>
    );
}
