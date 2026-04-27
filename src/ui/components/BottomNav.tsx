import type { ComponentType, SVGProps } from 'react';
import { ActivitiesIcon } from '../icons/nav/ActivitiesIcon';
import { AgeUpIcon } from '../icons/nav/AgeUpIcon';
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
  /** Optional FAB label override; defaults to "Age +1". */
  ageUpLabel?: string;
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
  ageUpLabel = 'Age +1',
}: BottomNavProps) {
  const badgeFor = (tab: BottomNavTab): number | undefined => {
    if (!badges) return undefined;
    const hit = badges.find((b) => b.tab === tab);
    return hit && hit.count > 0 ? hit.count : undefined;
  };

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
        <div className="w-16 flex-shrink-0" aria-hidden="true" />

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
          onClick={onAgeUp}
          disabled={ageUpDisabled}
          aria-label={ageUpLabel}
          data-testid="bottom-nav-ageup"
          className="absolute left-1/2 -translate-x-1/2 -top-5 w-16 h-16 rounded-full bg-coral text-cream-light shadow-warm-lg flex flex-col items-center justify-center gap-0.5 active:scale-95 transition disabled:bg-ink-faint disabled:text-cream disabled:shadow-none"
        >
          <AgeUpIcon size={22} />
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.05em] leading-none">
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
