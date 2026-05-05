import { Loader2 } from 'lucide-react';

interface Props {
  size?: number;
  className?: string;
  label?: string;
}

export function Spinner({ size = 24, className = '', label }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 size={size} className="animate-spin" />
      {label ? <span className="text-sm text-ink-black/60">{label}</span> : null}
    </div>
  );
}
