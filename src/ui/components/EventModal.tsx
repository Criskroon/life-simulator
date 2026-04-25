import { useEffect } from 'react';
import type { GameEvent } from '../../game/types/events';
import type { PlayerState } from '../../game/types/gameState';
import { renderTemplate } from '../../game/engine/templates';

interface EventModalProps {
  event: GameEvent;
  player: PlayerState;
  onChoose: (choiceIndex: number) => void;
  remainingCount: number;
}

export function EventModal({ event, player, onChoose, remainingCount }: EventModalProps) {
  // Lock background scroll while the modal is up so iOS/desktop can't drift
  // behind the overlay while the player is making a choice.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
    >
      <div className="w-full max-w-phone bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">
            {event.category}
          </div>
          <h3
            id="event-modal-title"
            className="text-xl font-semibold text-slate-900"
          >
            {renderTemplate(event.title, player)}
          </h3>
        </div>

        <div className="px-5 py-4 overflow-y-auto">
          <p className="text-slate-700 leading-relaxed">
            {renderTemplate(event.description, player)}
          </p>
        </div>

        <div className="px-5 pb-5 pt-2 flex flex-col gap-2 border-t border-slate-100">
          {event.choices.map((choice, idx) => (
            <button
              key={`${event.id}-choice-${idx}`}
              type="button"
              onClick={() => onChoose(idx)}
              className="text-left bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl px-4 py-3 transition active:scale-[0.99]"
            >
              {choice.label}
            </button>
          ))}
          {remainingCount > 0 && (
            <div className="text-xs text-slate-400 text-center mt-2">
              {remainingCount} more event{remainingCount === 1 ? '' : 's'} this year
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
