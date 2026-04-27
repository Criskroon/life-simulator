type StatKey = 'health' | 'happiness' | 'smarts' | 'looks';

interface StatBarProps {
  label: string;
  value: number;
  stat: StatKey;
}

// Sunny Side stat tokens — fill is the vibrant token, the track behind is the
// muted partner. Tailwind's JIT requires literal class strings, so we map
// rather than interpolate.
const FILL_BG: Record<StatKey, string> = {
  health: 'bg-stat-health',
  happiness: 'bg-stat-happiness',
  smarts: 'bg-stat-smarts',
  looks: 'bg-stat-looks',
};

const TRACK_BG: Record<StatKey, string> = {
  health: 'bg-stat-health-muted',
  happiness: 'bg-stat-happiness-muted',
  smarts: 'bg-stat-smarts-muted',
  looks: 'bg-stat-looks-muted',
};

export function StatBar({ label, value, stat }: StatBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 font-sans text-ink-soft">{label}</span>
      <div className={`flex-1 h-2 rounded-full overflow-hidden ${TRACK_BG[stat]}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${FILL_BG[stat]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-8 text-right font-mono text-ink-faint tabular-nums">
        {clamped}
      </span>
    </div>
  );
}
