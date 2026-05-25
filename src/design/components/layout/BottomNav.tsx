import { Link, useLocation } from 'react-router-dom';

export function BottomNav() {
  const location = useLocation();
  const items = [
    { to: '/sessoes', label: 'Sessões' },
    { to: '/sessoes/1/personagem', label: 'Ficha' },
    { to: '/sessoes/1/inventario', label: 'Inventário' },
  ];

  return (
    <nav style={{ position: 'sticky', bottom: 0, borderTop: '1px solid var(--border)', background: 'rgba(6, 6, 6, 0.94)' }}>
      <div className="page-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', padding: '0.75rem 0 1rem' }}>
        {items.map((item) => {
          const active = location.pathname.startsWith(item.to.replace('/1', ''));
          return (
            <Link
              key={item.to}
              to={item.to}
              style={{
                textAlign: 'center',
                padding: '0.7rem',
                borderRadius: 14,
                border: active ? '1px solid var(--danger-line)' : '1px solid var(--border)',
                background: active ? 'rgba(255, 208, 0, 0.12)' : 'var(--panel)',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
