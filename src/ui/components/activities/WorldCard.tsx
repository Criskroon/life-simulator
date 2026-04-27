import type { World } from './worlds';
import { WorldIcon } from './WorldIcons';

interface WorldCardProps {
  world: World;
  onClick: () => void;
}

/**
 * One tile in the 8 Worlds grid. Mirrors the card chrome of the People
 * surface (cream-light bg, cream-dark hairline, warm shadow, rounded-2xl)
 * so all Sunny Side surfaces feel like the same family. Icon block uses
 * the World's `section.*` token; everything else is monochrome ink.
 */
export function WorldCard({ world, onClick }: WorldCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`world-card-${world.key}`}
      className="group relative flex w-full flex-col items-start gap-3 overflow-hidden rounded-2xl border border-cream-dark bg-cream-light px-4 py-4 text-left shadow-warm transition active:scale-[0.98] hover:bg-peach-light/40"
    >
      <span
        aria-hidden="true"
        className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-ink/10 text-cream-light shadow-[0_2px_0_rgba(0,0,0,0.08)] ${world.bgClass}`}
      >
        <WorldIcon iconKey={world.iconKey} size={28} />
      </span>
      <div className="min-w-0">
        <div className="font-display text-[17px] font-bold leading-tight tracking-[-0.02em] text-ink">
          {world.name}
        </div>
        <div className="mt-1 line-clamp-2 font-sans text-[11.5px] italic leading-snug text-ink-soft">
          {world.tagline}
        </div>
      </div>
    </button>
  );
}
