import { useGameStore } from '../../game/state/gameStore';
import { ActivitiesMenu } from '../components/ActivitiesMenu';
import { AgeButton } from '../components/AgeButton';
import { EventModal } from '../components/EventModal';
import { InsufficientFundsModal } from '../components/InsufficientFundsModal';
import { ResolutionModal } from '../components/ResolutionModal';
import { SidePanel } from '../components/SidePanel';
import { StatBar } from '../components/StatBar';
import { TopBar } from '../components/TopBar';

export function GameScreen() {
  const player = useGameStore((s) => s.player);
  const pendingEvents = useGameStore((s) => s.pendingEvents);
  const lastResolution = useGameStore((s) => s.lastResolution);
  const pendingInsufficientChoice = useGameStore((s) => s.pendingInsufficientChoice);
  const pendingInsufficientActivity = useGameStore((s) => s.pendingInsufficientActivity);
  const activitiesMenuOpen = useGameStore((s) => s.activitiesMenuOpen);
  const ageUpYear = useGameStore((s) => s.ageUpYear);
  const resolveCurrentEvent = useGameStore((s) => s.resolveCurrentEvent);
  const clearLastResolution = useGameStore((s) => s.clearLastResolution);
  const confirmInsufficientChoice = useGameStore((s) => s.confirmInsufficientChoice);
  const cancelInsufficientChoice = useGameStore((s) => s.cancelInsufficientChoice);
  const openActivitiesMenu = useGameStore((s) => s.openActivitiesMenu);
  const closeActivitiesMenu = useGameStore((s) => s.closeActivitiesMenu);
  const executeActivityAction = useGameStore((s) => s.executeActivityAction);

  if (!player) return null;

  const currentEvent = pendingEvents[0];
  const insufficientPending =
    pendingInsufficientChoice !== null || pendingInsufficientActivity !== null;
  // Modal stacking priority (only one shows at a time):
  // 1. ResolutionModal — show outcome of last choice before anything else
  // 2. InsufficientFundsModal — confirm/cancel before re-showing event
  // 3. EventModal — show next event to resolve
  // 4. ActivitiesMenu — player-initiated, lowest priority so any incoming
  //    event from age-up takes precedence
  const showResolution = lastResolution !== null;
  const showInsufficient = !showResolution && insufficientPending;
  const showEvent = !showResolution && !showInsufficient && Boolean(currentEvent);
  const showActivities =
    !showResolution &&
    !showInsufficient &&
    !showEvent &&
    activitiesMenuOpen;

  // Disable both buttons while ANY modal is up so the user can't ageup
  // through their own outcome card.
  const blockingModalUp =
    pendingEvents.length > 0 ||
    !player.alive ||
    lastResolution !== null ||
    insufficientPending ||
    activitiesMenuOpen;

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
          <div className="max-w-phone mx-auto flex gap-2">
            <button
              type="button"
              onClick={openActivitiesMenu}
              disabled={blockingModalUp}
              className="relative flex-1 bg-white border border-slate-300 text-slate-900 font-semibold rounded-2xl py-4 text-base shadow active:scale-95 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
            >
              Activities
              <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[1.5rem] h-6 rounded-full bg-slate-900 text-white text-xs font-semibold px-2">
                {player.actionsRemainingThisYear}
              </span>
            </button>
            <div className="flex-[2]">
              <AgeButton
                onClick={ageUpYear}
                disabled={blockingModalUp}
                label="Age +1"
              />
            </div>
          </div>
        </div>
      </div>

      {showEvent && currentEvent && (
        <EventModal
          event={currentEvent}
          player={player}
          onChoose={resolveCurrentEvent}
          remainingCount={pendingEvents.length - 1}
        />
      )}

      {showInsufficient && (
        <InsufficientFundsModal
          onConfirm={confirmInsufficientChoice}
          onCancel={cancelInsufficientChoice}
        />
      )}

      {showActivities && (
        <ActivitiesMenu
          player={player}
          onPick={executeActivityAction}
          onClose={closeActivitiesMenu}
        />
      )}

      {showResolution && lastResolution && (
        <ResolutionModal resolution={lastResolution} onClose={clearLastResolution} />
      )}
    </div>
  );
}
