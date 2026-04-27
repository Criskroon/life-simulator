import { useEffect } from 'react';
import { getCurrentCountry } from '../../../game/engine/countryEngine';
import type { PlayerState } from '../../../game/types/gameState';
import { useComingSoon } from '../ComingSoonHandler';
import { STORES, type ShopStore, type StoreId } from './shopData';
import { StoreCard } from './StoreCard';

interface ShopHubProps {
  player: PlayerState;
  /** Open a Level-3 store screen. Hub stays mounted underneath. */
  onOpenStore: (storeId: StoreId) => void;
  /** Close the entire Shop sub-flow — back to whatever was beneath. */
  onClose: () => void;
}

/**
 * Level 2 of the Shop sub-flow — the directory of storefronts. Header
 * carries the close affordance and the player's live cash; below sits
 * the coral hero card and a 2-column grid of all 9 stores. Tapping a
 * functional store (Auto Dealer, this session) calls `onOpenStore`;
 * everything else fires a Coming-soon toast with the store's own copy.
 *
 * Modal-overlay shell mirrors `SectionDetailScreen` so the transition
 * from Activities Menu (z-40) into the Shop (z-50) feels like the same
 * surface deepening, not a separate app launching.
 */
export function ShopHub({ player, onOpenStore, onClose }: ShopHubProps) {
  const { showComingSoon } = useComingSoon();
  const country = getCurrentCountry(player);
  const symbol = country.currency.symbol;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const handleStoreClick = (store: ShopStore) => {
    if (store.functional) {
      onOpenStore(store.id);
      return;
    }
    showComingSoon(store.name, store.comingSoonDetail);
  };

  const lifeStage = lifeStageFor(player.age);

  return (
    <div
      data-testid="shop-hub"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shop-hub-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="flex max-h-[92vh] w-full max-w-phone flex-col overflow-hidden rounded-3xl border border-cream-dark bg-cream shadow-warm-lg">
        {/* Header chrome — close + eyebrow */}
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
          <div className="min-w-0">
            <button
              type="button"
              onClick={onClose}
              data-testid="shop-hub-back"
              aria-label="Close shop"
              className="inline-flex items-center gap-[3px] font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft transition hover:text-ink"
            >
              <BackGlyph />
              All sections
            </button>
            <div className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-brass">
              {lifeStage} · {player.currentYear}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="shop-hub-close"
            aria-label="Close shop"
            className="-mr-1 -mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-cream-dark/60"
          >
            <CloseGlyph />
          </button>
        </header>

        {/* Coral hero card — the welcome */}
        <div className="mx-5 mt-1 rounded-2xl border border-ink/10 bg-coral px-4 py-4 text-cream-light shadow-warm">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cream-light/40 bg-coral-dark text-cream-light"
            >
              <BagGlyph />
            </span>
            <div className="min-w-0">
              <h2
                id="shop-hub-title"
                className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em]"
              >
                The Shop
              </h2>
              <p className="font-sans text-[12px] italic leading-snug text-cream-light/85">
                Buy things — big and small.
              </p>
            </div>
          </div>
        </div>

        {/* Section meta — store count + live cash */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-soft">
            {STORES.length} stores
          </span>
          <span
            data-testid="shop-hub-cash"
            className="inline-flex items-center gap-[6px] font-mono text-[11px] font-bold tabular-nums text-ink"
          >
            <CashGlyph />
            {symbol}
            {player.money.toLocaleString()}
          </span>
        </div>

        {/* 9-store grid */}
        <div
          data-testid="shop-hub-grid"
          className="grid grid-cols-2 gap-3 overflow-y-auto px-5 pb-5 pt-1"
        >
          {STORES.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onClick={() => handleStoreClick(store)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function lifeStageFor(age: number): string {
  if (age < 13) return 'CHILDHOOD';
  if (age < 18) return 'YOUTH';
  if (age < 30) return 'YOUNG ADULTHOOD';
  if (age < 60) return 'ADULTHOOD';
  return 'LATER YEARS';
}

function BackGlyph() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 6 L9 12 L15 18" />
    </svg>
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

function BagGlyph() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 9 H19 L18 20 H6 Z" />
      <path d="M9 9 V6 Q9 4 12 4 Q15 4 15 6 V9" />
    </svg>
  );
}

function CashGlyph() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x={3} y={6} width={18} height={12} rx={1.5} />
      <circle cx={12} cy={12} r={2.4} />
      <path d="M6 9 H6.01" />
      <path d="M18 15 H18.01" />
    </svg>
  );
}
