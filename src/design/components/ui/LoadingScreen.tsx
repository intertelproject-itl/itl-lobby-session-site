export function LoadingScreen({ label = 'Conectando à rede...' }: { label?: string }) {
  return (
    <div className="page-container" style={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
      <div className="cy-card" style={{ textAlign: 'center', width: 'min(420px, 100%)' }}>
        <h2 className="cy-title">Aguarde</h2>
        <p className="cy-subtitle">{label}</p>
      </div>
    </div>
  );
}
