interface StatBarProps {
  label: string;
  value: number;
  color: string;
}

export function StatBar({ label, value, color }: StatBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-slate-600">{label}</span>
      <div className="flex-1 h-2 bg-slate-200 rounded overflow-hidden">
        <div
          className="h-full rounded transition-all duration-300"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 text-right text-slate-500 tabular-nums">{clamped}</span>
    </div>
  );
}
