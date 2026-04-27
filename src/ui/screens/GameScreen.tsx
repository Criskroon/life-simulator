import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/gameStore';
import { ActivitiesMenuV2 } from '../components/activities/ActivitiesMenuV2';
import type { ActivitySpec } from '../components/activities/activitySpec';
import { BODY_ACTIVITIES } from '../components/activities/bodyActivities';
import { HEART_ACTIVITIES } from '../components/activities/heartActivities';
import { MIND_ACTIVITIES } from '../components/activities/mindActivities';
import { MIRROR_ACTIVITIES } from '../components/activities/mirrorActivities';
import { SECTIONS, type SectionKey } from '../components/activities/sections';
import { SectionDetailScreen } from '../components/activities/SectionDetailScreen';
import { SHADOWS_ACTIVITIES } from '../components/activities/shadowsActivities';
import { TOWN_ACTIVITIES } from '../components/activities/townActivities';
import { WALLET_ACTIVITIES } from '../components/activities/walletActivities';
import { BottomNav, type BottomNavTab } from '../components/BottomNav';
import { EventModal } from '../components/EventModal';
import { HeaderStrip } from '../components/HeaderStrip';
import { InsufficientFundsModal } from '../components/InsufficientFundsModal';
import { PeopleScreenWithPets } from '../components/PeopleScreenWithPets';
import { RelationshipProfileModal } from '../components/RelationshipProfileModal';
import { ResolutionModal } from '../components/ResolutionModal';
import { SidePanel } from '../components/SidePanel';
import { StatBar } from '../components/StatBar';
import { TopBar } from '../components/TopBar';

const TAB_TITLES: Record<Exclude<BottomNavTab, 'home' | 'activities'>, string> = {
  career: 'CAREER',
  assets: 'ASSETS',
  people: 'PEOPLE',
};

/**
 * Sections wired to a detail screen — every Section except The Shop,
 * which has a sub-flow (stores) landing in a later session and stays on
 * the Coming-soon toast until then.
 */
const SECTION_ACTIVITIES: Partial<Record<SectionKey, ReadonlyArray<ActivitySpec>>> = {
  body: BODY_ACTIVITIES,
  mind: MIND_ACTIVITIES,
  town: TOWN_ACTIVITIES,
  heart: HEART_ACTIVITIES,
  wallet: WALLET_ACTIVITIES,
  shadows: SHADOWS_ACTIVITIES,
  mirror: MIRROR_ACTIVITIES,
};

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
  const openProfile = useGameStore((s) => s.openProfile);
  const closeProfile = useGameStore((s) => s.closeProfile);
  const executeRelationshipAction = useGameStore((s) => s.executeRelationshipAction);

  const [activeTab, setActiveTab] = useState<BottomNavTab>('home');
  // Modal-replace state for Section detail screens. When set, the
  // detail surface renders in place of ActivitiesMenuV2; back returns
  // to the menu, close exits the whole flow.
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);

  // Sync the nav back to 'home' when the activities menu is closed by any
  // path — modal close button, tab toggle, or an interrupt from the engine.
  useEffect(() => {
    if (!activitiesMenuOpen && activeTab === 'activities') {
      setActiveTab('home');
    }
  }, [activitiesMenuOpen, activeTab]);

  // Reset the Section detail any time the menu fully closes so the next
  // open lands on the grid, not a leftover sub-screen.
  useEffect(() => {
    if (!activitiesMenuOpen && openSection !== null) {
      setOpenSection(null);
    }
  }, [activitiesMenuOpen, openSection]);

  const openSectionData = useMemo(() => {
    if (openSection === null) return null;
    const section = SECTIONS.find((s) => s.key === openSection);
    const activities = SECTION_ACTIVITIES[openSection];
    if (!section || !activities) return null;
    return { section, activities };
  }, [openSection]);

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

  const returnHome = () => {
    if (activeTab === 'home') return;
    if (activeTab === 'activities') {
      closeActivitiesMenu();
    }
    setActiveTab('home');
  };

  const isHeaderTab =
    activeTab === 'career' || activeTab === 'assets' || activeTab === 'people';

  return (
    <div className="min-h-screen bg-cream flex justify-center p-4 pb-32">
      <div className="w-full max-w-phone">
        {isHeaderTab ? (
          <>
            <HeaderStrip
              title={TAB_TITLES[activeTab as Exclude<BottomNavTab, 'home' | 'activities'>]}
              onClose={returnHome}
            />
            {activeTab === 'people' && (
              <PeopleScreenWithPets player={player} onSelectPerson={openProfile} />
            )}
            {activeTab === 'career' && <TabPlaceholder title="Career" comingIn="1.2" />}
            {activeTab === 'assets' && <TabPlaceholder title="Assets" comingIn="1.3" />}
          </>
        ) : (
          <>
            <TopBar player={player} />
            <div className="bg-cream-light border border-cream-dark rounded-2xl shadow-warm p-4 mb-4 space-y-2">
              <StatBar label="Health" value={player.stats.health} stat="health" />
              <StatBar
                label="Happiness"
                value={player.stats.happiness}
                stat="happiness"
              />
              <StatBar label="Smarts" value={player.stats.smarts} stat="smarts" />
              <StatBar label="Looks" value={player.stats.looks} stat="looks" />
            </div>

            <SidePanel player={player} view="history" onSelect={openProfile} />
          </>
        )}
      </div>

      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAgeUp={ageUpYear}
        ageUpDisabled={blockingModalUp}
        ageUpPulse={player.actionsRemainingThisYear === 0}
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

      {showActivities && openSection !== null && openSectionData && (
        <SectionDetailScreen
          section={openSectionData.section}
          activities={openSectionData.activities}
          player={player}
          onBack={() => setOpenSection(null)}
          onClose={() => {
            setOpenSection(null);
            closeActivitiesMenu();
          }}
        />
      )}

      {showActivities && openSection === null && (
        <ActivitiesMenuV2
          player={player}
          onClose={closeActivitiesMenu}
          onOpenSection={(key) => {
            if (SECTION_ACTIVITIES[key]) {
              setOpenSection(key);
              return true;
            }
            return false;
          }}
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
