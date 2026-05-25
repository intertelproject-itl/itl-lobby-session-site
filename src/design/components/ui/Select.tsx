import { SelectHTMLAttributes } from 'react';

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: '100%',
        background: 'var(--panel-soft)',
        color: 'var(--text)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '0.9rem 1rem',
      }}
    />
  );
}
