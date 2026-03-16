import React from 'react';

type Category = 'Todo' | 'Anime' | 'Serie' | 'Pelicula';

interface CategoryNavProps {
    selected: string | null;
    onSelect: (cat: string | null) => void;
}

const CategoryNav = ({ selected, onSelect }: CategoryNavProps) => {
    const categories: Category[] = ["Todo", "Anime", "Serie", "Pelicula"];

    return (
        <div className="flex p-1 bg-slate-200 dark:bg-slate-700 rounded-xl w-fit">
            {categories.map((cat) => (
                <button
                    key={cat}
                    onClick={() => onSelect(cat === "Todo" ? null : cat)}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${(selected === cat || (cat === "Todo" && !selected))
                        ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        }`}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
};

export default CategoryNav;
