import type { AutoFilterId } from './shopData';
import { AUTO_FILTERS } from './shopData';

interface FilterPillsProps {
  active: AutoFilterId;
  onSelect: (id: AutoFilterId) => void;
}

/**
 * Horizontal pill bar at the top of the Auto Dealer store. Pure UI
 * state — the parent owns the active id and re-renders the product
 * grid filtered through `AUTO_FILTERS[active].match`. Active pill flips
 * to ink fill / cream text so it reads as "selected" against the cream
 * shell. Horizontal scroll is allowed but the 5 pills usually fit.
 */
export function FilterPills({ active, onSelect }: FilterPillsProps) {
  return (
    <div
      data-testid="auto-filter-pills"
      className="-mx-5 flex shrink-0 gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {AUTO_FILTERS.map((filter) => {
        const isActive = filter.id === active;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onSelect(filter.id)}
            data-testid={`auto-filter-${filter.id}`}
            data-active={isActive}
            className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-[6px] font-mono text-[10px] font-bold uppercase tracking-[0.06em] transition active:scale-[0.97] ${
              isActive
                ? 'border-ink bg-ink text-cream-light'
                : 'border-cream-dark bg-cream text-ink-soft hover:bg-peach-light/40'
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
