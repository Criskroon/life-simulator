import type { ReactNode } from 'react';
import { ComingSoonProvider } from '../components/ComingSoonHandler';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <ComingSoonProvider>
      <div className="min-h-screen bg-slate-100 text-slate-900">
        {children}
      </div>
    </ComingSoonProvider>
  );
}
