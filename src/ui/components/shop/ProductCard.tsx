import type { AutoListing } from './shopData';

interface ProductCardProps {
  listing: AutoListing;
  /** Currency symbol pulled from the country engine ("€", "$", "£"). */
  currencySymbol: string;
  /** Tailwind background class for the placeholder image rectangle. */
  imageAccentClass: string;
  onClick: () => void;
}

/**
 * Single tile in the Auto Dealer 2-column grid. The "image" rail is a
 * flat coloured rectangle for now — a coloured bar at the top of the
 * card carries the optional badge (LIVE -15%, DREAM, NEW). The body
 * carries make / yearTag · condition · km / price + chevron, matching
 * the mockup's stacked rhythm.
 */
export function ProductCard({
  listing,
  currencySymbol,
  imageAccentClass,
  onClick,
}: ProductCardProps) {
  const conditionLabel = formatCondition(listing.condition);
  const mileageLabel =
    listing.mileageKm === null
      ? null
      : `${(listing.mileageKm / 1000).toFixed(0)}k`;

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`product-card-${listing.id}`}
      className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-cream-dark bg-cream-light text-left shadow-warm transition active:scale-[0.98] hover:bg-peach-light/40"
    >
      {/* Placeholder image rail with optional badge */}
      <div
        aria-hidden="true"
        className={`relative flex h-20 w-full items-end justify-end px-2 py-2 ${imageAccentClass}`}
      >
        {listing.badge && <Badge kind={listing.badge} />}
      </div>

      <div className="flex flex-1 flex-col gap-[2px] px-3 py-3">
        <div className="font-display text-[14px] font-bold leading-tight tracking-[-0.01em] text-ink truncate">
          {listing.make}
        </div>
        <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-ink-soft">
          {listing.yearTag} · {conditionLabel}
          {mileageLabel ? ` · ${mileageLabel}` : ''}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="font-mono text-[14px] font-bold tabular-nums text-ink">
            {currencySymbol}
            {listing.price.toLocaleString()}
          </div>
          <span aria-hidden="true" className="text-[16px] leading-none text-ink-faint">
            ›
          </span>
        </div>
      </div>
    </button>
  );
}

function formatCondition(condition: AutoListing['condition']): string {
  switch (condition) {
    case 'new':
      return 'New';
    case 'used':
      return 'Used';
    case 'restored':
      return 'Restored';
  }
}

function Badge({ kind }: { kind: NonNullable<AutoListing['badge']> }) {
  switch (kind) {
    case 'live-deal':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-ink/30 bg-coral-dark px-2 py-[3px] font-mono text-[8.5px] font-bold uppercase tracking-[0.1em] text-cream-light shadow-[0_1px_0_rgba(0,0,0,0.08)]">
          <span className="block h-[5px] w-[5px] rounded-full bg-cream-light" />
          Live -15%
        </span>
      );
    case 'dream':
      return (
        <span className="inline-flex items-center rounded-full border border-ink/30 bg-danger px-2 py-[3px] font-mono text-[8.5px] font-bold uppercase tracking-[0.1em] text-cream-light shadow-[0_1px_0_rgba(0,0,0,0.08)]">
          Dream
        </span>
      );
    case 'new':
      return (
        <span className="inline-flex items-center rounded-full border border-ink/30 bg-ink px-2 py-[3px] font-mono text-[8.5px] font-bold uppercase tracking-[0.1em] text-cream-light shadow-[0_1px_0_rgba(0,0,0,0.08)]">
          New
        </span>
      );
  }
}
