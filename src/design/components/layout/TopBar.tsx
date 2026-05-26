import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../scripts/store/auth.store';

export function TopBar() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <header className="brand-shell">
      <div
        className="page-container brand-bar"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(88px, 1fr) auto minmax(88px, 1fr)',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.15rem 0 0.2rem',
        }}
      >
        <span aria-hidden="true" />
        <Link to="/sessoes" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
          <img
            src="/logo/intertel_corrido.png"
            alt="INTERTEL"
            style={{
              width: 'min(82vw, 980px)',
              minWidth: 360,
              height: 170,
              objectFit: 'contain',
            }}
          />
        </Link>
        <span aria-hidden="true" />
      </div>
      <div className="topbar-actions">
        {user ? (
          <>
            <span style={{ color: 'var(--text-muted)', display: 'none' }} className="desktop-user">{user.nickname}</span>
            <button
              onClick={signOut}
              aria-label="Sair"
              title="Sair"
              className="logout-icon-button"
              style={{
                width: 42,
                height: 42,
              }}
            >
              <span className="logout-icon" aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}
