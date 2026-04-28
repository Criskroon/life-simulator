import { useEffect } from 'react';
import type { ResolvedChoice, SpecialEffect, StatDelta } from '../../game/types/events';

/**
 * Fullscreen resolution modal that appears after a player resolves an event
 * choice. Mirrors EventModal's layout for consistency: header with the
 * narrative (when probabilistic), the body with stat-deltas and special
 * summaries, and a single "Continue" button to close it.
 *
 * Mounted at GameScreen level. Pure: receives the resolution and an onClose
 * callback. The store decides when to render this — see `lastResolution`.
 */

const STAT_LABELS: Record<string, { label: string; icon: string }> = {
  'stats.health': { label: 'Health', icon: '❤️' },
  'stats.happiness': { label: 'Happiness', icon: '😊' },
  'stats.smarts': { label: 'Smarts', icon: '🧠' },
  'stats.looks': { label: 'Looks', icon: '✨' },
  money: { label: 'Money', icon: '💵' },
};

const SPECIAL_ICONS: Record<SpecialEffect, string> = {
  addRelationship: '👥',
  removeRelationship: '💔',
  addPartner: '💞',
  addFiance: '💍',
  addSpouse: '💒',
  addCasualEx: '🌒',
  addSignificantEx: '🌑',
  addFriend: '🤝',
  addFamilyMember: '👨‍👩‍👧',
  breakUpPartner: '💔',
  endEngagement: '💔',
  divorceSpouse: '💔',
  loseFriend: '👋',
  resetFriendContact: '📞',
  adjustRelationshipLevel: '💗',
  addAsset: '🛍️',
  addCrime: '🚓',
  setJob: '💼',
  leaveJob: '📦',
  die: '⚰️',
};

interface ResolutionModalProps {
  resolution: ResolvedChoice;
  onClose: () => void;
}

function formatDelta(delta: StatDelta): { text: string; positive: boolean } {
  const diff = delta.after - delta.before;
  const positive = diff > 0;
  if (delta.path === 'money') {
    const sign = positive ? '+' : '−';
    return { text: `${sign}${Math.abs(diff).toLocaleString()}`, positive };
  }
  return { text: `${positive ? '+' : '−'}${Math.abs(diff)}`, positive };
}

export function ResolutionModal({ resolution, onClose }: ResolutionModalProps) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const hasNarrative = Boolean(resolution.narrative);
  const hasDeltas = resolution.deltas.length > 0 || resolution.specials.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resolution-modal-title"
    >
      <div className="w-full max-w-phone bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {hasNarrative && (
          <div className="px-5 pt-5 pb-3 border-b border-slate-100">
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">
              What happened
            </div>
            <h3
              id="resolution-modal-title"
              className="text-lg font-semibold text-slate-900 leading-snug"
            >
              {resolution.narrative}
            </h3>
          </div>
        )}

        {hasDeltas && (
          <div className="px-5 py-4 overflow-y-auto flex flex-col gap-2">
            {resolution.deltas.map((delta) => {
              const meta = STAT_LABELS[delta.path] ?? { label: delta.path, icon: '•' };
              const { text, positive } = formatDelta(delta);
              return (
                <div
                  key={delta.path}
                  className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2"
                >
                  <span className="text-sm font-medium text-slate-700">
                    <span className="mr-2">{meta.icon}</span>
                    {meta.label}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      positive ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {text}
                  </span>
                </div>
              );
            })}
            {resolution.specials.map((special, i) => (
              <div
                key={`${special.special}-${i}`}
                className="flex items-center bg-sky-50 rounded-xl px-4 py-2"
              >
                <span className="mr-2">{SPECIAL_ICONS[special.special] ?? '✦'}</span>
                <span className="text-sm font-medium text-sky-900">{special.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="px-5 pb-5 pt-2 flex flex-col gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-3 transition active:scale-[0.99] font-medium"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
