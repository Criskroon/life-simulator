import { useEffect } from 'react';
import type { PlayerState } from '../../../game/types/gameState';
import { useComingSoon } from '../ComingSoonHandler';
import { WorldCard } from './WorldCard';
import { WORLDS } from './worlds';

interface ActivitiesMenuV2Props {
  player: PlayerState;
  onClose: () => void;
}

/**
 * Activities surface — the player's "what do you do this year" choice.
 * Eight Worlds laid out 2 × 4. Each tap fires a Coming-soon toast for now
 * (engine wiring lives in later sessions); the grid itself is the lasting
 * navigation surface.
 *
 * TODO(engine): swap `useComingSoon` calls for navigation into per-World
 * detail screens (e.g. `<TheBodyScreen />`) once those exist.
 */
export function ActivitiesMenuV2({ player, onClose }: ActivitiesMenuV2Props) {
  const { showComingSoon } = useComingSoon();
  const remaining = player.actionsRemainingThisYear;
  const total = 3;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      data-testid="activities-menu-v2"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activities-menu-title"
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/60 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="flex max-h-[92vh] w-full max-w-phone flex-col overflow-hidden rounded-3xl border border-cream-dark bg-cream shadow-warm-lg">
        <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-2">
          <div className="min-w-0">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
              This year
            </div>
            <h2
              id="activities-menu-title"
              className="mt-1 font-display text-[26px] font-bold leading-tight tracking-[-0.02em] text-ink"
            >
              What do you do?
            </h2>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            <ActionPointPips remaining={remaining} total={total} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close activities"
              className="-mr-1 -mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-cream-dark/60"
            >
              <CloseGlyph />
            </button>
          </div>
        </header>

        <p className="px-5 pb-3 font-sans text-[12.5px] italic leading-snug text-ink-soft">
          Eight worlds. Pick where to spend a year of your life.
        </p>

        <div
          data-testid="activities-worlds-grid"
          className="grid grid-cols-2 gap-3 overflow-y-auto px-5 pb-5"
        >
          {WORLDS.map((world) => (
            <WorldCard
              key={world.key}
              world={world}
              onClick={() => showComingSoon(world.name, world.toastDetail)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ActionPointPipsProps {
  remaining: number;
  total: number;
}

/**
 * Small dot strip showing remaining action points this year. Filled
 * (coral) for available, empty (cream-dark hairline) for spent. Caps at
 * `total` even when remaining exceeds it — the engine occasionally
 * rewards bonus actions and we'd rather show 3/3 than overflow.
 */
function ActionPointPips({ remaining, total }: ActionPointPipsProps) {
  const filled = Math.max(0, Math.min(total, remaining));
  return (
    <div
      aria-label={`${filled} of ${total} actions left`}
      className="flex items-center gap-[5px]"
    >
      {Array.from({ length: total }, (_, i) => i < filled).map((isFilled, i) => (
        <span
          key={i}
          className={`block h-[10px] w-[10px] rounded-full border ${
            isFilled
              ? 'border-coral bg-coral'
              : 'border-cream-dark bg-transparent'
          }`}
        />
      ))}
    </div>
  );
}

function CloseGlyph() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6 L18 18 M18 6 L6 18" />
    </svg>
  );
}
