import { CloseIcon } from '../icons/nav/CloseIcon';

interface HeaderStripProps {
  title: string;
  onClose: () => void;
}

export function HeaderStrip({ title, onClose }: HeaderStripProps) {
  return (
    <div
      data-testid="header-strip"
      className="flex items-center justify-between bg-cream border-b border-cream-dark h-14 px-4 -mx-4 mb-4"
    >
      <div
        data-testid="header-strip-title"
        className="font-display text-[18px] font-semibold uppercase tracking-[0.05em] text-ink"
      >
        {title}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={`Close ${title.toLowerCase()}`}
        data-testid="header-strip-close"
        className="grid place-items-center w-11 h-11 p-0.5 rounded-full bg-transparent transition-transform active:scale-95"
      >
        <span className="grid place-items-center w-9 h-9 rounded-full bg-cream-light border border-brass/30 shadow-warm transition-colors hover:bg-cream-dark text-coral">
          <CloseIcon size={18} />
        </span>
      </button>
    </div>
  );
}
