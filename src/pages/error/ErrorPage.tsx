import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

export function ErrorPage() {
  const error = useRouteError();

  let title = 'Erro inesperado';
  let message = 'Algo deu errado ao carregar esta página.';
  let status: number | undefined;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    title = `Erro ${error.status}`;
    message =
      error.statusText || 'Não foi possível carregar a rota solicitada.';
  } else if (error instanceof Error) {
    message = error.message;
  }

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
          maxWidth: 560,
          background: '#101010',
          border: '1px solid #27272A',
          borderLeft: '4px solid #FF3B30',
          borderRadius: 18,
          padding: 24,
          boxShadow: '0 0 32px rgba(255, 208, 0, 0.08)',
        }}
      >
        <div
          style={{
            color: '#FF3B30',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 8,
          }}
        >
          Sistema indisponível
        </div>

        <h1 style={{ margin: '0 0 12px', color: '#FFD000' }}>
          {title}
        </h1>

        {status && (
          <p style={{ margin: '0 0 8px', color: '#A1A1AA' }}>
            Status: {status}
          </p>
        )}

        <p style={{ margin: '0 0 24px', lineHeight: 1.6 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link
            to="/"
            style={{
              background: '#FFD000',
              color: '#060606',
              border: '1px solid #FF3B30',
              borderRadius: 12,
              padding: '12px 16px',
              fontWeight: 700,
            }}
          >
            Voltar ao início
          </Link>

          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'transparent',
              color: '#F5F5F5',
              border: '1px solid #27272A',
              borderRadius: 12,
              padding: '12px 16px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Recarregar página
          </button>
        </div>
      </section>
    </main>
  );
}