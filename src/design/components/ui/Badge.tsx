import { PropsWithChildren } from 'react';

export function Badge({ children }: PropsWithChildren) {
  return (
    <span style={{ display: 'inline-block', padding: '0.35rem 0.65rem', borderRadius: 999, background: 'rgba(255, 208, 0, 0.08)', border: '1px solid var(--border)', color: 'var(--primary)', fontSize: 12 }}>
      {children}
    </span>
  );
}
