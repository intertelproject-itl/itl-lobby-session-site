import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#060606',
        color: '#F5F5F5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#101010',
          border: '1px solid #27272A',
          borderLeft: '4px solid #FF3B30',
          borderRadius: 18,
          padding: 24,
        }}
      >
        <h1 style={{ color: '#FFD000', marginTop: 0 }}>404</h1>
        <p>Essa rota não existe ou foi removida.</p>

        <Link
          to="/"
          style={{
            display: 'inline-block',
            marginTop: 16,
            background: '#FFD000',
            color: '#060606',
            border: '1px solid #FF3B30',
            borderRadius: 12,
            padding: '12px 16px',
            fontWeight: 700,
          }}
        >
          Ir para início
        </Link>
      </section>
    </main>
  );
}