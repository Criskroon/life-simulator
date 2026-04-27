import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/**
 * Lightweight toast surface used by UI-first action buttons whose engine
 * support hasn't landed yet. Keeps every "not wired" affordance honest:
 * the user sees the action name and a "coming soon" line so QA can spot
 * placeholders at a glance.
 *
 * TODO(engine): once a pet/career/asset action gets real engine support,
 * the call site stops calling `showComingSoon` and starts dispatching
 * through the gameStore. This component itself stays — other unfinished
 * surfaces will keep using it until 1.x is fully wired.
 */

interface Toast {
  id: number;
  label: string;
  detail?: string;
}

interface ComingSoonContextValue {
  showComingSoon: (label: string, detail?: string) => void;
}

const ComingSoonContext = createContext<ComingSoonContextValue | null>(null);

const TOAST_DURATION_MS = 2400;

export function ComingSoonProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const showComingSoon = useCallback((label: string, detail?: string) => {
    idRef.current += 1;
    const id = idRef.current;
    setToasts((prev) => [...prev, { id, label, detail }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  const value = useMemo<ComingSoonContextValue>(
    () => ({ showComingSoon }),
    [showComingSoon],
  );

  return (
    <ComingSoonContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} />
    </ComingSoonContext.Provider>
  );
}

/**
 * Hook for any component that needs to nudge the user about an unwired
 * action. Falls back to `console.info` outside a provider so storybook /
 * test render paths don't blow up.
 */
export function useComingSoon(): ComingSoonContextValue {
  const ctx = useContext(ComingSoonContext);
  if (ctx) return ctx;
  return {
    showComingSoon: (label, detail) => {
      // eslint-disable-next-line no-console
      console.info(`[coming soon] ${label}${detail ? ` — ${detail}` : ''}`);
    },
  };
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  // Mounted only when there's something to render — keeps the live region
  // quiet when the surface is idle.
  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="coming-soon-toasts"
      className="fixed inset-x-0 bottom-28 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastCard({ toast }: { toast: Toast }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // Defer one frame so the enter transition can run.
    const id = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={`max-w-phone w-full bg-ink text-cream-light rounded-2xl px-4 py-3 shadow-warm pointer-events-auto transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-cream-light/60 shrink-0">
          Coming soon
        </span>
        <span className="font-medium text-sm truncate">{toast.label}</span>
      </div>
      {toast.detail && (
        <div className="mt-0.5 text-xs text-cream-light/70 leading-snug">
          {toast.detail}
        </div>
      )}
    </div>
  );
}
