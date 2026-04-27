import { useState, type ComponentType, type SVGProps } from 'react';
import { ActivitiesIcon } from '../icons/nav/ActivitiesIcon';
import { AssetsIcon } from '../icons/nav/AssetsIcon';
import { CareerIcon } from '../icons/nav/CareerIcon';
import { PeopleIcon } from '../icons/nav/PeopleIcon';

export type BottomNavTab = 'career' | 'assets' | 'people' | 'activities' | 'home';

export interface BottomNavBadge {
  tab: BottomNavTab;
  count: number;
}

export interface BottomNavProps {
  activeTab: BottomNavTab;
  onTabChange: (tab: BottomNavTab) => void;
  onAgeUp: () => void;
  ageUpDisabled?: boolean;
  badges?: BottomNavBadge[];
  /** When true, the Aging Stone breathes — used to draw attention when the
   *  player has spent all their actions for the year. */
  ageUpPulse?: boolean;
}

type NavIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

interface NavTabSpec {
  id: Exclude<BottomNavTab, 'home'>;
  label: string;
  Icon: NavIcon;
}

// Layout: [career] [assets] [FAB] [people] [activities]
// 'home' is the implicit default surface — no dedicated tab. Tapping the
// FAB advances time on the home surface; the four side tabs swap content.
const LEFT_TABS: NavTabSpec[] = [
  { id: 'career', label: 'Career', Icon: CareerIcon },
  { id: 'assets', label: 'Assets', Icon: AssetsIcon },
];

const RIGHT_TABS: NavTabSpec[] = [
  { id: 'people', label: 'People', Icon: PeopleIcon },
  { id: 'activities', label: 'Activities', Icon: ActivitiesIcon },
];

export function BottomNav({
  activeTab,
  onTabChange,
  onAgeUp,
  ageUpDisabled = false,
  badges,
  ageUpPulse = false,
}: BottomNavProps) {
  const [pressed, setPressed] = useState(false);

  const badgeFor = (tab: BottomNavTab): number | undefined => {
    if (!badges) return undefined;
    const hit = badges.find((b) => b.tab === tab);
    return hit && hit.count > 0 ? hit.count : undefined;
  };

  const handleAgeUp = () => {
    if (ageUpDisabled) return;
    setPressed(true);
    onAgeUp();
    // Match the keyframe duration so a rapid second click can re-trigger.
    window.setTimeout(() => setPressed(false), 220);
  };

  // Pulse only when the stone is actually idle and pulsing is requested.
  const stoneAnimation = pressed
    ? 'animate-stone-press'
    : ageUpPulse && !ageUpDisabled
      ? 'animate-stone-pulse'
      : '';

  const stoneShadow = ageUpDisabled ? 'shadow-none' : 'shadow-stone';
  const stoneBg = ageUpDisabled ? 'bg-ink-faint' : 'bg-coral';

  return (
    <nav
      aria-label="Primary"
      data-testid="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-30 bg-cream-light border-t border-cream-dark"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative max-w-phone mx-auto h-20 px-2 flex items-center justify-between">
        {LEFT_TABS.map((spec) => (
          <NavTabButton
            key={spec.id}
            spec={spec}
            active={activeTab === spec.id}
            badge={badgeFor(spec.id)}
            onClick={() => onTabChange(spec.id)}
          />
        ))}

        {/* FAB slot — reserves space in the flex row so left/right tabs
            distribute evenly. The actual button is absolutely positioned
            so it can sit slightly above the bar. */}
        <div className="w-20 flex-shrink-0" aria-hidden="true" />

        {RIGHT_TABS.map((spec) => (
          <NavTabButton
            key={spec.id}
            spec={spec}
            active={activeTab === spec.id}
            badge={badgeFor(spec.id)}
            onClick={() => onTabChange(spec.id)}
          />
        ))}

        <button
          type="button"
          onClick={handleAgeUp}
          disabled={ageUpDisabled}
          aria-label="Age up by one year"
          data-testid="bottom-nav-ageup"
          data-pulse={ageUpPulse && !ageUpDisabled ? 'true' : 'false'}
          className={`absolute left-1/2 -translate-x-1/2 -top-6 w-[76px] h-[76px] rounded-full text-cream-light flex flex-col items-center justify-center transition-colors ${stoneBg} ${stoneShadow} ${stoneAnimation}`}
        >
          <span className="font-sans text-[11px] font-medium leading-none">
            Age
          </span>
          <span className="font-display text-[22px] font-semibold leading-none mt-[2px]">
            +1
          </span>
        </button>
      </div>
    </nav>
  );
}

interface NavTabButtonProps {
  spec: NavTabSpec;
  active: boolean;
  badge?: number;
  onClick: () => void;
}

function NavTabButton({ spec, active, badge, onClick }: NavTabButtonProps) {
  const { Icon, label, id } = spec;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      data-testid={`bottom-nav-tab-${id}`}
      data-active={active ? 'true' : 'false'}
      className={`relative flex-1 min-h-14 flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-colors ${
        active ? 'bg-peach-light text-coral' : 'text-ink-faint'
      }`}
    >
      <span className="relative">
        <Icon size={24} />
        {badge !== undefined && (
          <span
            data-testid={`bottom-nav-badge-${id}`}
            className="absolute -top-1 -right-2 min-w-[1rem] h-4 px-1 rounded-full bg-coral text-cream-light font-mono text-[10px] font-medium leading-4 text-center"
          >
            {badge}
          </span>
        )}
      </span>
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.05em] leading-none">
        {label}
      </span>
    </button>
  );
}
