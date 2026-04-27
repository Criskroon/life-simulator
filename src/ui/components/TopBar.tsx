import type { PlayerState } from '../../game/types/gameState';
import { getCountry } from '../../game/data/countries';

interface TopBarProps {
  player: PlayerState;
  /** True when the player is on a tab other than 'home' — enables the
   *  tap-to-return affordance and shows a small hint underneath. */
  showReturnHint: boolean;
  onReturnHome: () => void;
}

export function TopBar({ player, showReturnHint, onReturnHome }: TopBarProps) {
  const country = getCountry(player.country);
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={onReturnHome}
        aria-label="Return to home"
        data-testid="top-bar-home-trigger"
        className={`w-full text-left bg-cream-light border border-cream-dark rounded-2xl shadow-warm p-4 transition-colors ${
          showReturnHint ? 'cursor-pointer hover:bg-cream-dark/40' : 'cursor-default'
        }`}
      >
        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-display text-2xl text-ink leading-tight">
              {player.firstName} {player.lastName}
            </div>
            <div className="font-mono text-[11px] text-ink-faint mt-1">
              Age {player.age} · {country.name} · {player.currentYear}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-faint">
              Net worth
            </div>
            <div className="font-display text-xl text-ink">
              {country.currency.symbol}
              {player.money.toLocaleString()}
            </div>
          </div>
        </div>
      </button>
      {showReturnHint && (
        <div
          data-testid="top-bar-return-hint"
          className="mt-1 text-center font-mono text-[10px] uppercase tracking-[0.05em] text-ink-faint"
        >
          Tap here to return
        </div>
      )}
    </div>
  );
}
