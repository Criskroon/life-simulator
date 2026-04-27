import type { Job } from '../../../game/types/gameState';
import { getCareer } from '../../../game/data/careers';
import { useComingSoon } from '../ComingSoonHandler';

interface InlineActionRowsProps {
  job: Job;
  /** Pre-formatted training-course price string (e.g. "-€1,200"). */
  trainingCostLabel: string;
}

interface ActionSpec {
  id: string;
  label: string;
  detail: string;
  meta?: string;
  toastTitle: string;
  toastDetail: string;
}

/**
 * Inline action rows shown directly under the Current Position card —
 * NOT collapsible (per mockup). Lists the four "this year" moves a
 * working player can make. Click → ComingSoon toast; the engine wiring
 * for raise/promotion/training lands in a later session.
 *
 * Meta strings are deliberately observed sentences ("High bar — 5 stars
 * helps", "Not yet — perf at 73, needs 80") rather than mechanical hints,
 * so the screen still reads as the diary it wants to be.
 */
export function InlineActionRows({
  job,
  trainingCostLabel,
}: InlineActionRowsProps) {
  const { showComingSoon } = useComingSoon();
  const actions = buildActions(job, trainingCostLabel);

  return (
    <section
      data-testid="career-inline-actions"
      className="rounded-2xl border border-cream-dark bg-cream-light shadow-warm overflow-hidden"
    >
      <header className="flex items-baseline justify-between gap-3 px-4 pt-3 pb-2">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[14px] font-semibold tracking-[-0.01em] text-ink">
            At work · this year
          </span>
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-ink-faint">
            · {actions.length}
          </span>
        </div>
      </header>
      <div className="border-t border-cream-dark divide-y divide-cream-dark">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            data-testid={`career-inline-action-${action.id}`}
            onClick={() => showComingSoon(action.toastTitle, action.toastDetail)}
            className="flex w-full items-center justify-between gap-3 px-4 py-[10px] text-left transition hover:bg-peach-light/40 active:scale-[0.99]"
          >
            <div className="min-w-0">
              <div className="font-bold text-[13.5px] tracking-[-0.01em] text-ink">
                {action.label}
              </div>
              <div className="mt-[1px] truncate text-[11.5px] leading-[1.3] text-ink-soft">
                {action.detail}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {action.meta && (
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] text-brass">
                  {action.meta}
                </span>
              )}
              <span aria-hidden="true" className="text-[16px] leading-none text-ink-faint">
                ›
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

/**
 * Build the four action rows. Most copy is static, but two ("Ask for a
 * raise", "Apply for promotion") look at real engine fields so the meta
 * line tells the player whether the move is plausible right now without
 * needing to wire the actual handler. "Apply for promotion" gates on the
 * next level's minSmarts requirement when one exists; "Ask for a raise"
 * leans on performance.
 */
function buildActions(
  job: Job,
  trainingCostLabel: string,
): ActionSpec[] {
  const career = getCareer(job.careerId);
  const nextLevel = career?.levels[job.level + 1] ?? null;
  const performance = Math.round(job.performance);
  const promotionGate = nextLevel?.minSmarts ?? 100;

  const raiseDetail =
    performance >= 80
      ? 'You\'ve earned the conversation. Walk in.'
      : 'High bar — five-star years help.';
  const promotionDetail = nextLevel
    ? performance >= promotionGate
      ? `Ready — perf at ${performance}, gate at ${promotionGate}.`
      : `Not yet — perf at ${performance}, needs ${promotionGate}.`
    : 'Top of this ladder. Look outside.';

  return [
    {
      id: 'work-harder',
      label: 'Work harder',
      detail: 'Performance up. Health takes the hit.',
      meta: '+PERF · -HEALTH',
      toastTitle: 'Work harder',
      toastDetail: 'Performance grinds arrive with the career pass.',
    },
    {
      id: 'ask-raise',
      label: 'Ask for a raise',
      detail: raiseDetail,
      meta: '+SALARY',
      toastTitle: 'Ask for a raise',
      toastDetail: 'Salary negotiation arrives with the career pass.',
    },
    {
      id: 'apply-promotion',
      label: 'Apply for promotion',
      detail: promotionDetail,
      meta: nextLevel ? `→ L${job.level + 2}` : 'CAPPED',
      toastTitle: 'Apply for promotion',
      toastDetail: 'Level-up paths land with the career pass.',
    },
    {
      id: 'training-course',
      label: 'Take training course',
      detail: 'Two evenings a week. Worth it later.',
      meta: trainingCostLabel,
      toastTitle: 'Take training course',
      toastDetail: 'Short courses land with the skills pass.',
    },
  ];
}
