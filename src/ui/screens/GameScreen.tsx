import { useEffect, useState } from 'react';
import { useGameStore } from '../../game/state/gameStore';
import { ActivitiesMenu } from '../components/ActivitiesMenu';
import { BottomNav, type BottomNavTab } from '../components/BottomNav';
import { EventModal } from '../components/EventModal';
import { InsufficientFundsModal } from '../components/InsufficientFundsModal';
import { RelationshipProfileModal } from '../components/RelationshipProfileModal';
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
  const profileTarget = useGameStore((s) => s.profileTarget);
  const ageUpYear = useGameStore((s) => s.ageUpYear);
  const resolveCurrentEvent = useGameStore((s) => s.resolveCurrentEvent);
  const clearLastResolution = useGameStore((s) => s.clearLastResolution);
  const confirmInsufficientChoice = useGameStore((s) => s.confirmInsufficientChoice);
  const cancelInsufficientChoice = useGameStore((s) => s.cancelInsufficientChoice);
  const openActivitiesMenu = useGameStore((s) => s.openActivitiesMenu);
  const closeActivitiesMenu = useGameStore((s) => s.closeActivitiesMenu);
  const executeActivityAction = useGameStore((s) => s.executeActivityAction);
  const openProfile = useGameStore((s) => s.openProfile);
  const closeProfile = useGameStore((s) => s.closeProfile);
  const executeRelationshipAction = useGameStore((s) => s.executeRelationshipAction);

  const [activeTab, setActiveTab] = useState<BottomNavTab>('home');

  // Sync the nav back to 'home' when the activities menu is closed by any
  // path — modal close button, tab toggle, or an interrupt from the engine.
  useEffect(() => {
    if (!activitiesMenuOpen && activeTab === 'activities') {
      setActiveTab('home');
    }
  }, [activitiesMenuOpen, activeTab]);

  if (!player) return null;

  const currentEvent = pendingEvents[0];
  const insufficientPending =
    pendingInsufficientChoice !== null || pendingInsufficientActivity !== null;
  // Modal stacking priority (only one shows at a time):
  // 1. ResolutionModal — show outcome of last choice before anything else
  // 2. InsufficientFundsModal — confirm/cancel before re-showing event
  // 3. EventModal — show next event to resolve
  // 4. RelationshipProfileModal — player-initiated, slot above activities
  // 5. ActivitiesMenu — player-initiated, lowest priority so any incoming
  //    event from age-up takes precedence
  const showResolution = lastResolution !== null;
  const showInsufficient = !showResolution && insufficientPending;
  const showEvent = !showResolution && !showInsufficient && Boolean(currentEvent);
  const showProfile =
    !showResolution &&
    !showInsufficient &&
    !showEvent &&
    profileTarget !== null;
  const showActivities =
    !showResolution &&
    !showInsufficient &&
    !showEvent &&
    !showProfile &&
    activitiesMenuOpen;

  // Disable both buttons while ANY modal is up so the user can't ageup
  // through their own outcome card.
  const blockingModalUp =
    pendingEvents.length > 0 ||
    !player.alive ||
    lastResolution !== null ||
    insufficientPending ||
    activitiesMenuOpen ||
    profileTarget !== null;

  const handleTabChange = (tab: BottomNavTab) => {
    // Tabs toggle: tapping the active tab returns to home. The Activities
    // tab is special — it opens the existing modal flow and keeps the
    // store as the source of truth for whether the menu is visible.
    if (tab === 'activities') {
      if (activeTab === 'activities') {
        closeActivitiesMenu();
        setActiveTab('home');
      } else {
        openActivitiesMenu();
        setActiveTab('activities');
      }
      return;
    }
    if (activeTab === tab) {
      setActiveTab('home');
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen flex justify-center p-4 pb-32">
      <div className="w-full max-w-phone">
        <TopBar player={player} />

        {activeTab === 'home' && (
          <>
            <div className="bg-white rounded-2xl shadow-md p-4 mb-4 space-y-2">
              <StatBar label="Health" value={player.stats.health} color="#ef4444" />
              <StatBar
                label="Happiness"
                value={player.stats.happiness}
                color="#facc15"
              />
              <StatBar label="Smarts" value={player.stats.smarts} color="#3b82f6" />
              <StatBar label="Looks" value={player.stats.looks} color="#ec4899" />
            </div>

            <SidePanel player={player} onSelect={openProfile} />
          </>
        )}

        {activeTab === 'people' && (
          <SidePanel player={player} onSelect={openProfile} />
        )}

        {activeTab === 'career' && <TabPlaceholder title="Career" comingIn="1.2" />}

        {activeTab === 'assets' && <TabPlaceholder title="Assets" comingIn="1.3" />}
      </div>

      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAgeUp={ageUpYear}
        ageUpDisabled={blockingModalUp}
        badges={[{ tab: 'activities', count: player.actionsRemainingThisYear }]}
      />

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

      {showProfile && profileTarget && (
        <RelationshipProfileModal
          player={player}
          target={profileTarget.person}
          targetType={profileTarget.type}
          onAction={executeRelationshipAction}
          onClose={closeProfile}
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

interface TabPlaceholderProps {
  title: string;
  comingIn: string;
}

function TabPlaceholder({ title, comingIn }: TabPlaceholderProps) {
  return (
    <div
      data-testid={`tab-placeholder-${title.toLowerCase()}`}
      className="bg-cream-light border border-cream-dark rounded-2xl shadow-warm p-8 text-center"
    >
      <div className="font-display text-2xl text-ink mb-2">{title}</div>
      <div className="font-sans text-sm text-ink-soft">
        {title} tab — coming in {comingIn}
      </div>
    </div>
  );
}
