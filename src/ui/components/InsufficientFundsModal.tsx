import { useEffect } from 'react';

interface InsufficientFundsModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation step shown when the player picks an unaffordable choice.
 * Two paths out: "Try anyway" applies the embarrassment penalty (and bounces
 * back to the original event so the player still has to pick something they
 * can afford); "Pick something else" just dismisses and shows the event again.
 */
export function InsufficientFundsModal({ onConfirm, onCancel }: InsufficientFundsModalProps) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="insufficient-funds-title"
    >
      <div className="w-full max-w-phone bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="text-xs uppercase tracking-wider text-amber-600 mb-1">
            ⚠️ Not enough money
          </div>
          <h3
            id="insufficient-funds-title"
            className="text-lg font-semibold text-slate-900 leading-snug"
          >
            You don't have enough money for this. Trying anyway will leave you embarrassed.
          </h3>
        </div>

        <div className="px-5 pb-5 pt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-xl px-4 py-3 transition active:scale-[0.99] font-medium"
          >
            Try anyway
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-3 transition active:scale-[0.99] font-medium"
          >
            Pick something else
          </button>
        </div>
      </div>
    </div>
  );
}
