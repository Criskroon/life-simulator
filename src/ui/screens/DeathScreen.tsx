import { useGameStore } from '../../game/state/gameStore';
import { LifeHistory } from '../components/LifeHistory';

export function DeathScreen() {
  const player = useGameStore((s) => s.player);
  const startNewLife = useGameStore((s) => s.startNewLife);
  const goToMenu = useGameStore((s) => s.goToMenu);
  const deleteCurrentSave = useGameStore((s) => s.deleteCurrentSave);

  if (!player) return null;

  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-phone">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">⚰️</div>
          <h2 className="text-2xl font-bold text-slate-900">
            {player.firstName} {player.lastName}
          </h2>
          <p className="text-slate-500 text-sm">
            {player.birthYear} – {player.currentYear} (age {player.age})
          </p>
          <p className="text-slate-700 mt-2">
            Died of {player.causeOfDeath ?? 'natural causes'}.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 mb-4">
          <h3 className="font-semibold text-slate-900 mb-2">Final Stats</h3>
          <div className="text-sm text-slate-600 grid grid-cols-2 gap-1">
            <div>Health: {player.stats.health}</div>
            <div>Happiness: {player.stats.happiness}</div>
            <div>Smarts: {player.stats.smarts}</div>
            <div>Looks: {player.stats.looks}</div>
            <div className="col-span-2">
              Money: ${player.money.toLocaleString()}
            </div>
            <div className="col-span-2">
              Crimes: {player.criminalRecord.length}
            </div>
            <div className="col-span-2">
              Relationships: {player.relationships.length}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 mb-4">
          <h3 className="font-semibold text-slate-900 mb-3">Life Story</h3>
          <div className="max-h-80 overflow-y-auto">
            <LifeHistory history={player.history} />
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            await deleteCurrentSave();
            startNewLife();
          }}
          className="w-full bg-slate-900 text-white font-semibold rounded-xl py-4 mb-2 active:scale-95 transition"
        >
          Start a New Life
        </button>
        <button
          type="button"
          onClick={() => void deleteCurrentSave().then(() => goToMenu())}
          className="w-full bg-white text-slate-900 font-semibold rounded-xl py-3 border border-slate-300"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
