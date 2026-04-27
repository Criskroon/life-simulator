import type { PlayerState } from '../../game/types/gameState';
import { getCountry } from '../../game/data/countries';
import { BackButton } from './BackButton';

interface TopBarProps {
  player: PlayerState;
  /** True when the player is on a tab other than 'home' — shows the back
   *  button overlaid on the top-left of the card. */
  showBack: boolean;
  onBack: () => void;
  /** Tapping the header is reserved for opening the profile menu. The menu
   *  itself ships in a later phase; for now the press is logged so the
   *  affordance can be exercised without affecting game state. */
  onProfilePress?: () => void;
}

export function TopBar({ player, showBack, onBack, onProfilePress }: TopBarProps) {
  const country = getCountry(player.country);
  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
      return;
    }
    console.log('Profile menu coming soon');
  };
  return (
    <div className="relative mb-4">
      {showBack && (
        <div className="absolute top-4 left-4 z-10">
          <BackButton onClick={onBack} />
        </div>
      )}
      <button
        type="button"
        onClick={handleProfilePress}
        aria-label="Open profile menu"
        data-testid="top-bar-profile-trigger"
        className={`w-full text-left bg-cream-light border border-cream-dark rounded-2xl shadow-warm p-4 transition-colors cursor-pointer hover:bg-cream-dark/40 ${
          showBack ? 'pl-[68px]' : ''
        }`}
      >
        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-display text-2xl text-ink leading-tight">
              {player.firstName} {player.lastName}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-ink-faint">
                Age {player.age} · {country.name} · {player.currentYear}
              </span>
              <span
                data-testid="top-bar-profile-chevron"
                aria-hidden="true"
                className="font-sans text-sm text-ink-faint leading-none"
              >
                ›
              </span>
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
    </div>
  );
}
