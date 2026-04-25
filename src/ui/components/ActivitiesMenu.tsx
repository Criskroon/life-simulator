import { useEffect } from 'react';
import { getAvailableActivities } from '../../game/engine/activityEngine';
import { getChoicePreview } from '../../game/engine/choicePreview';
import type { Activity, ActivityCategory } from '../../game/types/activities';
import type { PlayerState } from '../../game/types/gameState';

interface ActivitiesMenuProps {
  player: PlayerState;
  onPick: (activityId: string) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  mind_body: 'Mind & Body',
  love_social: 'Love & Social',
  career_money: 'Career & Money',
};

const CATEGORY_ORDER: ActivityCategory[] = ['mind_body', 'love_social', 'career_money'];

/**
 * Player-initiated actions menu. Mirrors the EventModal layout (centered
 * card, max-w-phone) so the two surfaces feel like the same family. Uses
 * the same disabled-but-clickable pattern as EventModal: unaffordable
 * activities stay clickable so the player can choose to take the
 * embarrassment penalty rather than being silently locked out.
 */
export function ActivitiesMenu({ player, onPick, onClose }: ActivitiesMenuProps) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const available = getAvailableActivities(player);
  const grouped = new Map<ActivityCategory, Activity[]>();
  for (const activity of available) {
    const list = grouped.get(activity.category) ?? [];
    list.push(activity);
    grouped.set(activity.category, list);
  }

  const remaining = player.actionsRemainingThisYear;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activities-menu-title"
    >
      <div className="w-full max-w-phone bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">
            Activities
          </div>
          <h3
            id="activities-menu-title"
            className="text-xl font-semibold text-slate-900"
          >
            {remaining} action{remaining === 1 ? '' : 's'} left this year
          </h3>
          {remaining === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              No actions remaining. Age up to refresh.
            </p>
          )}
        </div>

        <div className="px-5 py-4 overflow-y-auto flex flex-col gap-5">
          {CATEGORY_ORDER.map((category) => {
            const list = grouped.get(category);
            if (!list || list.length === 0) return null;
            return (
              <section key={category}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  {CATEGORY_LABELS[category]}
                </h4>
                <div className="flex flex-col gap-2">
                  {list.map((activity) => (
                    <ActivityRow
                      key={activity.id}
                      activity={activity}
                      player={player}
                      remaining={remaining}
                      onPick={onPick}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-3 transition active:scale-[0.99] font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

interface ActivityRowProps {
  activity: Activity;
  player: PlayerState;
  remaining: number;
  onPick: (id: string) => void;
}

function ActivityRow({ activity, player, remaining, onPick }: ActivityRowProps) {
  const preview = getChoicePreview(
    { label: activity.name, cost: activity.cost },
    player,
  );
  const enoughActions = remaining >= activity.actionCost;
  const positive = preview.adjustedCost !== null && preview.adjustedCost > 0;
  const negative = preview.adjustedCost !== null && preview.adjustedCost < 0;

  return (
    <button
      type="button"
      onClick={() => onPick(activity.id)}
      disabled={!enoughActions}
      className="text-left bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-900 rounded-xl px-4 py-3 transition active:scale-[0.99] flex items-start gap-3"
    >
      {activity.icon && (
        <span className="text-2xl shrink-0" aria-hidden="true">
          {activity.icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-medium">{activity.name}</span>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {activity.actionCost} action{activity.actionCost === 1 ? '' : 's'}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{activity.description}</p>
        {preview.costLabel && (
          <div
            className={`text-xs font-semibold mt-1 ${
              !preview.isAffordable
                ? 'text-rose-600'
                : positive
                  ? 'text-emerald-600'
                  : negative
                    ? 'text-slate-600'
                    : 'text-slate-600'
            }`}
          >
            {!preview.isAffordable && (
              <span className="mr-1" aria-hidden="true">⚠️</span>
            )}
            {preview.costLabel}
          </div>
        )}
      </div>
    </button>
  );
}
