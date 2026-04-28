import { useEffect, useMemo, useState } from 'react';
import { getCurrentCountry } from '../../../game/engine/countryEngine';
import type { PlayerState } from '../../../game/types/gameState';
import { useComingSoon } from '../ComingSoonHandler';
import { FilterPills } from './FilterPills';
import { ProductCard } from './ProductCard';
import {
  AUTO_BUY_TOAST_DETAIL,
  AUTO_DEALER_INVENTORY,
  AUTO_FILTERS,
  type AutoFilterId,
  type AutoListing,
  type CarCategory,
} from './shopData';

interface AutoDealerStoreProps {
  player: PlayerState;
  /** Back to the Shop Hub. */
  onBack: () => void;
  /** Close the entire Shop sub-flow. */
  onClose: () => void;
}

/**
 * Level 3 — the Auto Dealer storefront. Header (back / close + locale),
 * cash card, filter pills, then two stacked grids: Featured today
 * (subset with `featured: true`) and In stock (everything else). Both
 * grids respect the active filter pill — when a filter empties either
 * grid the section header still renders so the count change is visible
 * to the user instead of the section silently disappearing.
 *
 * Tapping any product card fires the buy Coming-soon toast. Filter
 * state is local; the store has no engine reach. Modal-overlay shell
 * matches `ShopHub` so the back / close transition feels in-family.
 */
export function AutoDealerStore({
  player,
  onBack,
  onClose,
}: AutoDealerStoreProps) {
  const { showComingSoon } = useComingSoon();
  const country = getCurrentCountry(player);
  const symbol = country.currency.symbol;
  const [filter, setFilter] = useState<AutoFilterId>('all');
  // Below 18 the player can't legally drive — showing a wall of
  // €40,000+ inventory reads as broken context. Replace the body
  // with a quiet age-gate while keeping the chrome (header + cash)
  // in place so the screen still feels like part of the Shop.
  const isMinor = player.age < 18;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const matcher = useMemo(
    () => AUTO_FILTERS.find((f) => f.id === filter)?.match ?? (() => true),
    [filter],
  );

  const filtered = useMemo(
    () => AUTO_DEALER_INVENTORY.filter(matcher),
    [matcher],
  );
  const featured = useMemo(() => filtered.filter((l) => l.featured), [filtered]);
  const inStock = useMemo(() => filtered.filter((l) => !l.featured), [filtered]);

  const handleBuy = (listing: AutoListing) => {
    showComingSoon(`${listing.make} ${listing.yearTag}`, AUTO_BUY_TOAST_DETAIL);
  };

  return (
    <div
      data-testid="auto-dealer-store"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auto-dealer-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="flex max-h-[92vh] w-full max-w-phone flex-col overflow-hidden rounded-3xl border border-cream-dark bg-cream shadow-warm-lg">
        {/* Header chrome — back / close + locale */}
        <header className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              data-testid="auto-dealer-back"
              aria-label="Back to the shop"
              className="inline-flex items-center gap-[3px] font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft transition hover:text-ink"
            >
              <BackGlyph />
              The Shop
            </button>
            <button
              type="button"
              onClick={onClose}
              data-testid="auto-dealer-close"
              aria-label="Close shop"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-cream-dark/60"
            >
              <CloseGlyph />
            </button>
          </div>

          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="auto-dealer-title"
                className="font-display text-[24px] font-bold leading-[1.05] tracking-[-0.025em] text-ink"
              >
                Auto Dealer
              </h2>
              <p className="mt-[2px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                Lange Vijverberg · Den Haag · {AUTO_DEALER_INVENTORY.length} in stock
              </p>
            </div>
            <span
              aria-hidden="true"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cream-dark bg-cream-light text-ink-soft"
            >
              <CartGlyph />
            </span>
          </div>
        </header>

        {/* Cash card */}
        <div className="mx-5 mt-2 flex items-center justify-between rounded-2xl border border-cream-dark bg-cream-light px-4 py-3 shadow-warm">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">
            Your cash
          </span>
          <span
            data-testid="auto-dealer-cash"
            className="font-mono text-[18px] font-bold tabular-nums text-ink"
          >
            {symbol}
            {player.money.toLocaleString()}
          </span>
        </div>

        {/* Body — filters + grids in a single scroll container */}
        <div className="flex flex-1 flex-col overflow-y-auto px-5 pt-3 pb-5">
          {isMinor ? (
            <MinorEmptyState />
          ) : (
            <>
              <FilterPills active={filter} onSelect={setFilter} />

              {filtered.length === 0 ? (
                <EmptyState filterId={filter} onReset={() => setFilter('all')} />
              ) : (
                <>
                  {/* Featured today */}
                  <SectionRow
                    title="Featured today"
                    count={featured.length}
                    accent="live"
                  />
                  {featured.length === 0 ? (
                    <p className="mt-1 mb-3 font-sans text-[12px] italic leading-snug text-ink-soft">
                      Nothing featured fits this filter right now.
                    </p>
                  ) : (
                    <div
                      data-testid="auto-dealer-featured"
                      className="mt-2 mb-4 grid grid-cols-2 gap-3"
                    >
                      {featured.map((listing) => (
                        <ProductCard
                          key={listing.id}
                          listing={listing}
                          currencySymbol={symbol}
                          imageAccentClass={categoryAccent(listing.category)}
                          onClick={() => handleBuy(listing)}
                        />
                      ))}
                    </div>
                  )}

                  {/* In stock */}
                  <SectionRow title="In stock" count={inStock.length} />
                  {inStock.length === 0 ? (
                    <p className="mt-1 font-sans text-[12px] italic leading-snug text-ink-soft">
                      Nothing else in stock matches this filter.
                    </p>
                  ) : (
                    <div
                      data-testid="auto-dealer-instock"
                      className="mt-2 grid grid-cols-2 gap-3"
                    >
                      {inStock.map((listing) => (
                        <ProductCard
                          key={listing.id}
                          listing={listing}
                          currencySymbol={symbol}
                          imageAccentClass={categoryAccent(listing.category)}
                          onClick={() => handleBuy(listing)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MinorEmptyState() {
  return (
    <div
      data-testid="auto-dealer-minor"
      className="mt-4 rounded-2xl border border-dashed border-cream-dark bg-cream-light px-4 py-6 text-center"
    >
      <div className="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cream-dark bg-cream text-ink-soft">
        <CarGlyph />
      </div>
      <div className="font-display text-[16px] font-bold tracking-[-0.01em] text-ink">
        Too young to drive.
      </div>
      <p className="mt-1 font-sans text-[12.5px] italic leading-snug text-ink-soft">
        Come back when you're 18.
      </p>
    </div>
  );
}

function CarGlyph() {
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
      <path d="M4 14 L5.5 9 H18.5 L20 14" />
      <path d="M3 14 H21 V18 H3 Z" />
      <circle cx={7} cy={18} r={1.4} />
      <circle cx={17} cy={18} r={1.4} />
    </svg>
  );
}

interface SectionRowProps {
  title: string;
  count: number;
  accent?: 'live';
}

/**
 * Mini-header above each grid (Featured today · 3 / In stock · 9). The
 * "live" variant adds a small red dot + "LIVE" tag matching the mockup
 * — used only for Featured today.
 */
function SectionRow({ title, count, accent }: SectionRowProps) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-soft">
        {title} · <span className="text-ink-faint font-medium">{count}</span>
      </span>
      {accent === 'live' && (
        <span className="inline-flex items-center gap-[5px] font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-danger">
          <span className="block h-[7px] w-[7px] animate-pulse rounded-full bg-danger" />
          Live
        </span>
      )}
    </div>
  );
}

interface EmptyStateProps {
  filterId: AutoFilterId;
  onReset: () => void;
}

function EmptyState({ filterId, onReset }: EmptyStateProps) {
  const filter = AUTO_FILTERS.find((f) => f.id === filterId);
  return (
    <div
      data-testid="auto-dealer-empty"
      className="mt-4 rounded-2xl border border-dashed border-cream-dark bg-cream-light px-4 py-5 text-center"
    >
      <div className="font-display text-[15px] font-bold tracking-[-0.01em] text-ink">
        Nothing in this lane today.
      </div>
      <p className="mt-1 font-sans text-[12px] italic leading-snug text-ink-soft">
        The {filter?.label ?? 'filter'} shelf is empty. Try All to see everything.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-3 inline-flex items-center justify-center rounded-full border border-ink bg-cream px-3 py-[5px] font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink shadow-warm transition active:scale-[0.97]"
      >
        Clear filter
      </button>
    </div>
  );
}

/**
 * Map a car category to a tailwind background token used as the
 * placeholder "image" rail at the top of each product card. Sport stays
 * coral (matches Auto Dealer accent), luxury reads as mirror lavender,
 * family and economy land on the cooler tokens so the grid mixes warm
 * and cool tiles instead of flattening into a single hue.
 */
function categoryAccent(category: CarCategory): string {
  switch (category) {
    case 'sport':
      return 'bg-coral';
    case 'luxury':
      return 'bg-section-mirror';
    case 'family':
      return 'bg-section-mind';
    case 'economy':
      return 'bg-section-body';
  }
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

function CartGlyph() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx={9} cy={20} r={1.4} />
      <circle cx={17} cy={20} r={1.4} />
      <path d="M3 4 H5 L7 16 H18 L20 7 H7" />
    </svg>
  );
}
