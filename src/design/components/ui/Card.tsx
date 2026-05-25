import { HTMLAttributes, PropsWithChildren } from 'react';

type CardProps = PropsWithChildren<HTMLAttributes<HTMLElement>>;

export function Card({ children, className = '', style, ...props }: CardProps) {
  return (
    <section
      {...props}
      style={{ marginTop: '1rem', ...style }}
      className={`cy-card ${className}`.trim()}
    >
      {children}
    </section>
  );
}
