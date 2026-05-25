import { useApiErrorStore } from '../../../scripts/store/api-error.store';

export function ApiErrorModal() {
  const { isOpen, title, message, statusCode, closeError } = useApiErrorStore();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#101010',
          border: '1px solid #27272A',
          borderLeft: '4px solid #FF3B30',
          borderRadius: 16,
          padding: 20,
          boxShadow: '0 0 30px rgba(255, 59, 48, 0.15)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#FF3B30',
            marginBottom: 8,
          }}
        >
          Falha de comunicação
        </div>

        <h2
          style={{
            margin: '0 0 12px',
            color: '#FFD000',
            fontSize: 22,
          }}
        >
          {title}
        </h2>

        {typeof statusCode === 'number' && (
          <p style={{ margin: '0 0 8px', color: '#A1A1AA' }}>
            Código: {statusCode}
          </p>
        )}

        <p style={{ margin: '0 0 20px', color: '#F5F5F5', lineHeight: 1.5 }}>
          {message}
        </p>

        <button
          onClick={closeError}
          style={{
            width: '100%',
            background: '#FFD000',
            color: '#060606',
            border: '1px solid #FF3B30',
            borderRadius: 12,
            padding: '12px 16px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}