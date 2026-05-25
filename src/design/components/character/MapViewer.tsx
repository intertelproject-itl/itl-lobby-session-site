import { InventoryAsset } from '../../../integrations/inventory/inventory.types';
import { Modal } from '../ui/Modal';

export function MapViewer({ asset, onClose }: { asset: InventoryAsset; onClose: () => void }) {
  return (
    <Modal>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="cy-title">{asset.nome}</h3>
            <p className="cy-subtitle">{asset.tipo}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text)', border: '1px solid var(--danger-line)', borderRadius: 12, padding: '0.6rem 0.8rem', cursor: 'pointer' }}>Fechar</button>
        </div>
        <img src={asset.url} alt={asset.nome} style={{ maxHeight: '70vh', width: '100%', objectFit: 'contain', borderRadius: 16 }} />
      </div>
    </Modal>
  );
}
