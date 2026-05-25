import { InventoryAsset } from '../../../integrations/inventory/inventory.types';
import { Card } from '../ui/Card';

export function InventoryGallery({ assets, onSelect }: { assets: InventoryAsset[]; onSelect: (asset: InventoryAsset) => void }) {
  return (
    <Card>
      <h3 className="cy-title">Arquivos da sessão</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {assets.map((asset) => (
          <button key={asset.id} onClick={() => onSelect(asset)} style={{ background: 'var(--panel-soft)', border: '1px solid var(--border)', borderRadius: 16, padding: '0.75rem', cursor: 'pointer', color: 'var(--text)' }}>
            <img src={asset.thumbnailUrl ?? asset.url} alt={asset.nome} style={{ aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 12, marginBottom: '0.75rem' }} />
            <strong>{asset.nome}</strong>
            <small style={{ display: 'block', color: 'var(--text-muted)' }}>{asset.tipo}</small>
          </button>
        ))}
      </div>
    </Card>
  );
}
