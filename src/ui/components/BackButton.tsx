import { BackArrowIcon } from '../icons/nav/BackArrowIcon';

interface BackButtonProps {
  onClick: () => void;
  ariaLabel?: string;
}

export function BackButton({ onClick, ariaLabel = 'Back to home' }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      data-testid="top-bar-back-button"
      className="grid place-items-center w-11 h-11 p-0.5 rounded-full bg-transparent transition-transform active:scale-95"
    >
      <span className="grid place-items-center w-10 h-10 rounded-full bg-cream-light border border-brass/30 shadow-warm transition-colors hover:bg-cream-dark text-coral">
        <BackArrowIcon size={18} />
      </span>
    </button>
  );
}
