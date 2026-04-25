import { useGameStore } from '../../game/state/gameStore';
import { AgeButton } from '../components/AgeButton';
import { EventModal } from '../components/EventModal';
import { SidePanel } from '../components/SidePanel';
import { StatBar } from '../components/StatBar';
import { TopBar } from '../components/TopBar';

export function GameScreen() {
  const player = useGameStore((s) => s.player);
  const pendingEvents = useGameStore((s) => s.pendingEvents);
  const ageUpYear = useGameStore((s) => s.ageUpYear);
  const resolveCurrentEvent = useGameStore((s) => s.resolveCurrentEvent);

  if (!player) return null;

  const currentEvent = pendingEvents[0];

  return (
    <div className="min-h-screen flex justify-center p-4 pb-32">
      <div className="w-full max-w-phone">
        <TopBar player={player} />

        <div className="bg-white rounded-2xl shadow-md p-4 mb-4 space-y-2">
          <StatBar label="Health" value={player.stats.health} color="#ef4444" />
          <StatBar label="Happiness" value={player.stats.happiness} color="#facc15" />
          <StatBar label="Smarts" value={player.stats.smarts} color="#3b82f6" />
          <StatBar label="Looks" value={player.stats.looks} color="#ec4899" />
        </div>

        <SidePanel player={player} />

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-100 via-slate-100 z-30">
          <div className="max-w-phone mx-auto">
            <AgeButton
              onClick={ageUpYear}
              disabled={pendingEvents.length > 0 || !player.alive}
              label="Age +1"
            />
          </div>
        </div>
      </div>

      {currentEvent && (
        <EventModal
          event={currentEvent}
          player={player}
          onChoose={resolveCurrentEvent}
          remainingCount={pendingEvents.length - 1}
        />
      )}
    </div>
  );
}
