interface AgeButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

export function AgeButton({ onClick, disabled, label = 'Age +1' }: AgeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-slate-900 text-white font-semibold rounded-2xl py-4 text-lg shadow-lg active:scale-95 transition disabled:bg-slate-300 disabled:shadow-none"
    >
      {label}
    </button>
  );
}
