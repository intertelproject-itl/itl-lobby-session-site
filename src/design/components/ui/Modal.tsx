import { PropsWithChildren } from 'react';

type ModalProps = PropsWithChildren<{
  maxWidth?: number;
}>;

export function Modal({ children, maxWidth = 900 }: ModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'grid', placeItems: 'center', padding: '1rem' }}>
      <div className="cy-card" style={{ width: `min(${maxWidth}px, 100%)`, maxHeight: 'calc(100vh - 2rem)', overflow: 'auto' }}>{children}</div>
    </div>
  );
}
