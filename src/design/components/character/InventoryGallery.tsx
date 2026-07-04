import { InventoryAsset, InventoryCategory } from '../../../integrations/inventory/inventory.types';
import { Card } from '../ui/Card';

type Props = {
  assets: InventoryAsset[];
  loading?: boolean;
  onSelect: (asset: InventoryAsset) => void;
};

const inventoryCategories: InventoryCategory[] = ['Armas', 'Armaduras', 'Armas Ciberneticas', 'Ciberneticas', 'Outros'];

function formatInventoryPrice(value: unknown) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? `${price.toLocaleString('pt-BR')} eb` : null;
}

export function InventoryGallery({ assets, loading = false, onSelect }: Props) {
  return (
    <Card className="inventory-panel">
      <div className="inventory-panel-header">
        <h3 className="cy-title">Inventario</h3>
        <span>{assets.length} itens</span>
      </div>
      {loading ? <p className="cy-subtitle">Carregando itens...</p> : null}
      {!loading && assets.length === 0 ? <p className="cy-subtitle">Nenhum item encontrado.</p> : null}
      <div className="inventory-category-stack">
        {inventoryCategories.map((category) => {
          const items = assets.filter((asset) => asset.category === category);

          if (items.length === 0) return null;

          return (
            <section className="inventory-category" key={category}>
              <div className="inventory-category-header">
                <h4>{category}</h4>
                <span>{items.length}</span>
              </div>
              <div className="inventory-item-grid">
                {items.map((asset) => (
                  <button type="button" className="inventory-item-tile" key={asset.id} onClick={() => onSelect(asset)}>
                    <span className="inventory-item-image">
                      {asset.thumbnailUrl ? <img src={asset.thumbnailUrl} alt="" /> : <i aria-hidden="true" />}
                    </span>
                    <span className="inventory-item-copy">
                      <strong>{asset.nome}</strong>
                      <small>{asset.itemType ?? asset.rarity ?? formatInventoryPrice(asset.price) ?? 'Item'}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </Card>
  );
}
