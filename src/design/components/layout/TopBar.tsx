import { Link } from 'react-router-dom';
import { AmbientAudioPlayer } from '../audio/AmbientAudioPlayer';
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
          padding: '0.9rem 0 1rem',
        }}
      >
        <span aria-hidden="true" />
        <Link to="/sessoes" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
          <img
            src="/logo/intertel_corrido.png"
            alt="INTERTEL"
            style={{
              width: 'min(62vw, 680px)',
              minWidth: 280,
              height: 112,
              objectFit: 'contain',
            }}
          />
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'end', flexShrink: 0, minWidth: 0 }}>
          <AmbientAudioPlayer />
          {user ? (
            <>
              <span style={{ color: 'var(--text-muted)', display: 'none' }} className="desktop-user">{user.nickname}</span>
              <button
                onClick={signOut}
                aria-label="Sair"
                title="Sair"
                className="logout-image-button"
                style={{
                  width: 58,
                  height: 58,
                }}
              >
                <img src="/icons/log-out.png" alt="" aria-hidden="true" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
