import { PropsWithChildren } from 'react';

export function PageContainer({ children }: PropsWithChildren) {
  return <main className="page-container" style={{ padding: '1.25rem 0 2rem' }}>{children}</main>;
}
