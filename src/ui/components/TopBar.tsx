import type { PlayerState } from '../../game/types/gameState';
import { getCountry } from '../../game/data/countries';

interface TopBarProps {
  player: PlayerState;
}

export function TopBar({ player }: TopBarProps) {
  const country = getCountry(player.country);
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 mb-4">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-semibold text-slate-900">
            {player.firstName} {player.lastName}
          </div>
          <div className="text-xs text-slate-500">
            Age {player.age} · {country.name} · {player.currentYear}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Net worth</div>
          <div className="font-mono font-semibold text-slate-900">
            {country.currency.symbol}
            {player.money.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
