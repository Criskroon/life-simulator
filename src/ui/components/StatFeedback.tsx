import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../game/state/gameStore';
import type { ResolvedChoice, SpecialEffect, StatDelta } from '../../game/types/events';

/**
 * Toast that appears bottom-right on desktop and top on mobile after every
 * resolved choice. Shows the outcome narrative (if probabilistic) plus any
 * stat deltas and special-effect summaries the player should notice.
 *
 * Mounted once at the GameScreen level; reads `lastResolution` from the store
 * and queues a fresh toast on every `resolutionTick` change. Toasts self-evict
 * after the CSS animation finishes.
 */

const TOAST_LIFETIME_MS = 2500;
const MAX_VISIBLE = 5;

const STAT_LABELS: Record<string, { label: string; icon: string }> = {
  'stats.health': { label: 'Health', icon: '❤️' },
  'stats.happiness': { label: 'Happiness', icon: '😊' },
  'stats.smarts': { label: 'Smarts', icon: '🧠' },
  'stats.looks': { label: 'Looks', icon: '✨' },
  money: { label: 'Money', icon: '💵' },
};

const SPECIAL_ICONS: Record<SpecialEffect, string> = {
  addRelationship: '👥',
  removeRelationship: '💔',
  addAsset: '🛍️',
  addCrime: '🚓',
  addEducation: '🏫',
  completeEducation: '🎓',
  setJob: '💼',
  leaveJob: '📦',
  die: '⚰️',
};

interface ToastEntry {
  key: number;
  resolution: ResolvedChoice;
}

function formatDelta(delta: StatDelta): { text: string; positive: boolean } {
  const diff = delta.after - delta.before;
  const positive = diff > 0;
  if (delta.path === 'money') {
    const sign = positive ? '+' : '−';
    return { text: `${sign}${Math.abs(diff).toLocaleString()}`, positive };
  }
  return { text: `${positive ? '+' : '−'}${Math.abs(diff)}`, positive };
}

export function StatFeedback() {
  const lastResolution = useGameStore((s) => s.lastResolution);
  const resolutionTick = useGameStore((s) => s.resolutionTick);
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const lastSeenTick = useRef(0);

  useEffect(() => {
    if (!lastResolution) return;
    if (resolutionTick === lastSeenTick.current) return;
    lastSeenTick.current = resolutionTick;

    // Skip an empty resolution (no narrative, no deltas, no specials) — there
    // is nothing for the player to read, the toast would just be a smear.
    if (
      !lastResolution.narrative &&
      lastResolution.deltas.length === 0 &&
      lastResolution.specials.length === 0
    ) {
      return;
    }

    const entry: ToastEntry = { key: resolutionTick, resolution: lastResolution };
    setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), entry]);

    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.key !== entry.key));
    }, TOAST_LIFETIME_MS + 50);

    return () => window.clearTimeout(timer);
  }, [lastResolution, resolutionTick]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed z-50 flex flex-col gap-2
                 left-1/2 -translate-x-1/2 top-3 w-full max-w-phone px-3
                 sm:left-auto sm:right-4 sm:translate-x-0 sm:top-auto sm:bottom-4 sm:px-0 sm:max-w-sm"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.key} resolution={toast.resolution} />
      ))}
    </div>
  );
}

function ToastCard({ resolution }: { resolution: ResolvedChoice }) {
  return (
    <div
      className="feedback-toast pointer-events-none rounded-xl
                 bg-slate-900/85 backdrop-blur-md text-slate-50
                 shadow-lg ring-1 ring-white/10
                 px-4 py-3"
    >
      {resolution.narrative && (
        <p className="text-sm leading-snug text-slate-100 mb-2">{resolution.narrative}</p>
      )}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {resolution.deltas.map((delta) => {
          const meta = STAT_LABELS[delta.path] ?? { label: delta.path, icon: '•' };
          const { text, positive } = formatDelta(delta);
          return (
            <span
              key={delta.path}
              className={`text-xs font-medium ${positive ? 'text-emerald-300' : 'text-rose-300'}`}
            >
              {meta.icon} {meta.label} {text}
            </span>
          );
        })}
        {resolution.specials.map((special, i) => (
          <span key={`${special.special}-${i}`} className="text-xs font-medium text-sky-200">
            {SPECIAL_ICONS[special.special] ?? '✦'} {special.label}
          </span>
        ))}
      </div>
    </div>
  );
}
