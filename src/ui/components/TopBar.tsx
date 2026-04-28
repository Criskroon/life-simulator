import type { PlayerState } from '../../game/types/gameState';
import { getCountry } from '../../game/data/countries';
import { getEducationStage } from '../../game/engine/educationEngine';
import { formatMoney } from '../../game/engine/countryEngine';
import { formatSpecialization } from './career/educationFormat';

interface TopBarProps {
  player: PlayerState;
  /** Tapping the header is reserved for opening the profile menu. The menu
   *  itself ships in a later phase; for now the press is logged so the
   *  affordance can be exercised without affecting game state. */
  onProfilePress?: () => void;
}

interface TopBarStatus {
  primary: string;
  secondary: string;
}

/**
 * What to show on the second status row: the active job, current education,
 * or an unemployed fallback. Job wins when both are present — once the
 * conflict popup ships a player can't realistically have both.
 */
function getTopBarStatus(player: PlayerState): TopBarStatus {
  if (player.job) {
    const country = getCountry(player.country);
    return {
      primary: player.job.title,
      secondary: `${formatMoney(country, player.job.salary)}/mo`,
    };
  }

  const eduState = player.educationState;
  if (eduState?.status === 'enrolled' && eduState.currentStageId) {
    const country = getCountry(player.country);
    const stage = getEducationStage(country, eduState.currentStageId);
    if (stage) {
      const stageName = stage.nameLocal ?? stage.name;
      return {
        primary: `${stageName} · Year ${eduState.yearOfStage}`,
        secondary: eduState.currentSpecialization
          ? formatSpecialization(eduState.currentSpecialization)
          : `GPA ${eduState.currentGpa.toFixed(1)}`,
      };
    }
  }

  return { primary: 'Unemployed', secondary: '—' };
}

function nameSizeClass(fullName: string): string {
  const len = fullName.length;
  if (len > 25) return 'text-xl';
  if (len > 18) return 'text-2xl';
  return 'text-[28px]';
}

function moneySizeClass(amount: string): string {
  return amount.length > 8 ? 'text-xl' : 'text-2xl';
}

export function TopBar({ player, onProfilePress }: TopBarProps) {
  const country = getCountry(player.country);
  const fullName = `${player.firstName} ${player.lastName}`;
  const moneyAmount = player.money.toLocaleString();
  const status = getTopBarStatus(player);
  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
      return;
    }
    console.log('Profile menu coming soon');
  };
  return (
    <div className="relative mb-4">
      <button
        type="button"
        onClick={handleProfilePress}
        aria-label="Open profile menu"
        data-testid="top-bar-profile-trigger"
        className="w-full text-left bg-cream-light border border-cream-dark rounded-2xl shadow-warm p-4 transition-colors cursor-pointer hover:bg-cream-dark/40"
      >
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div
              data-testid="top-bar-player-name"
              className={`font-display ${nameSizeClass(fullName)} text-ink leading-tight overflow-hidden`}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {fullName}
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
          <div className="flex flex-col items-end shrink-0 max-w-[40%]">
            <div className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-faint whitespace-nowrap">
              Net worth
            </div>
            <div
              data-testid="top-bar-net-worth"
              className={`font-display ${moneySizeClass(moneyAmount)} text-ink whitespace-nowrap`}
            >
              {country.currency.symbol}
              {moneyAmount}
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-cream-dark/60 pt-2">
          <div
            data-testid="top-bar-status-primary"
            className="font-sans text-[13px] font-semibold text-ink truncate min-w-0 flex-1"
          >
            {status.primary}
          </div>
          <div
            data-testid="top-bar-status-secondary"
            className="font-mono text-[11px] text-ink-soft whitespace-nowrap shrink-0"
          >
            {status.secondary}
          </div>
        </div>
      </button>
    </div>
  );
}
