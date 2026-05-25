import { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Props = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: 'primary' | 'ghost';
};

export function Button({ children, variant = 'primary', ...props }: Props) {
  const primary = variant === 'primary';

  return (
    <button
      {...props}
      style={{
        width: props.style?.width ?? '100%',
        background: primary ? 'rgba(255, 208, 0, 0.04)' : 'transparent',
        color: primary ? 'var(--primary)' : 'var(--text-muted)',
        border: `1px solid ${primary ? 'rgba(255, 208, 0, 0.78)' : 'var(--border)'}`,
        padding: '0.62rem 0.9rem',
        borderRadius: 8,
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: 'none',
        textTransform: 'uppercase',
        fontSize: '0.82rem',
        letterSpacing: 0,
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}
