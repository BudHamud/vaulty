interface ActionButtonProps {
    onClick: () => void;
    icon: React.ReactNode;
    colorHover: string;
    isGrid?: boolean;
}

const ActionButton = ({ onClick, icon, colorHover, isGrid }: ActionButtonProps) => (
    <button
        onClick={onClick}
        className={`
        w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer
        ${isGrid
                ? `bg-black/40 backdrop-blur-sm text-white/70 hover:${colorHover} hover:bg-black/60`
                : `text-vaulty-muted hover:${colorHover} hover:bg-vaulty-card`
            }
      `}
    >
        <span className="text-lg leading-none">{icon}</span>
    </button>
);

export default ActionButton;
