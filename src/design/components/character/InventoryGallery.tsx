import { InventoryAsset } from '../../../integrations/inventory/inventory.types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

type Props = {
  assets: InventoryAsset[];
  loading?: boolean;
  onSelect: (asset: InventoryAsset) => void;
};

export function InventoryGallery({ assets, loading = false, onSelect }: Props) {
  return (
    <Card>
      <h3 className="cy-title">Inventario</h3>
      {loading ? <p className="cy-subtitle">Carregando itens...</p> : null}
      {!loading && assets.length === 0 ? <p className="cy-subtitle">Nenhum item encontrado.</p> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {assets.map((asset) => (
          <div
            key={asset.id}
            style={{
              background: 'var(--panel-soft)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '0.85rem',
              color: 'var(--text)',
              display: 'grid',
              gap: '0.65rem',
            }}
          >
            <div>
              <strong>{asset.nome}</strong>
              {asset.descricao ? (
                <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  {asset.descricao}
                </small>
              ) : null}
            </div>
            {asset.url ? (
              <Button
                type="button"
                onClick={() => {
                  onSelect(asset);
                  window.open(asset.url, '_blank', 'noopener,noreferrer');
                }}
              >
                Abrir Arquivo 🔍
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
