import type { ShopStore } from './shopData';
import { StoreIcon } from './StoreIcons';

interface StoreCardProps {
  store: ShopStore;
  onClick: () => void;
}

/**
 * Single tile in the Shop Hub grid. Mirrors the rhythm of `SectionCard`
 * (cream-light bg, cream-dark hairline, warm shadow, rounded-2xl) so the
 * hub feels like part of the same family as the Activities Menu. The
 * icon block uses the store's accent token; the locale + status sit
 * monochrome below the name.
 */
export function StoreCard({ store, onClick }: StoreCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`store-card-${store.id}`}
      className="group relative flex w-full flex-col gap-2 rounded-2xl border border-cream-dark bg-cream-light px-3 py-3 text-left shadow-warm transition active:scale-[0.98] hover:bg-peach-light/40"
    >
      <span
        aria-hidden="true"
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink/10 text-cream-light shadow-[0_2px_0_rgba(0,0,0,0.08)] ${store.accentClass}`}
      >
        <StoreIcon iconKey={store.iconKey} size={20} />
      </span>
      <div className="min-w-0 w-full">
        <div className="font-display text-[13.5px] font-bold leading-tight tracking-[-0.01em] text-ink line-clamp-2">
          {store.name}
        </div>
        <div className="mt-[2px] truncate font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
          {store.locale}
        </div>
        <div className="mt-1 font-sans text-[10.5px] italic leading-snug text-ink-soft">
          {store.status}
        </div>
      </div>
    </button>
  );
}
