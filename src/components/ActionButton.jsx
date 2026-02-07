const ActionButton = ({ onClick, icon, colorHover, isGrid }) => (
  <button
    onClick={onClick}
    className={`
        w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer
        ${
          isGrid
            ? `bg-white/90 shadow-sm text-slate-600 hover:${colorHover}`
            : `text-slate-300 hover:${colorHover} hover:bg-slate-50`
        }
      `}
  >
    <span className="text-lg leading-none">{icon}</span>
  </button>
);

export default ActionButton;