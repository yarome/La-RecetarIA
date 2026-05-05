interface Props {
  label: string;
  active?: boolean;
  onClick?: () => void;
  size?: 'xs' | 'sm';
}

export function TagPill({ label, active, onClick, size = 'sm' }: Props) {
  const sizeClass = size === 'xs' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border ${sizeClass} transition-colors ${
        active
          ? 'border-ink-black bg-ink-black text-canvas-white'
          : 'border-ink-black/30 text-ink-black/70 hover:border-ink-black hover:text-ink-black'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      tabIndex={onClick ? 0 : -1}
    >
      {label}
    </button>
  );
}
