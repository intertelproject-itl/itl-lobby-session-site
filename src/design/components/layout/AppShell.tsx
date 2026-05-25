import { PropsWithChildren } from 'react';
import { TopBar } from './TopBar';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="page-shell">
      <TopBar />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
