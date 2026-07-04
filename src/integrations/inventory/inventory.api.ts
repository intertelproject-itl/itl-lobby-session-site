import { apiClient } from '../http/apiClient';
import '../http/authInterceptor';
import { InventoryAsset, InventoryCategory, InventoryRawItem, InventoryResponse } from './inventory.types';

const categoryMap: Array<{ key: keyof InventoryResponse; label: InventoryCategory }> = [
  { key: 'armas', label: 'Armas' },
  { key: 'armaduras', label: 'Armaduras' },
  { key: 'ciberneticas', label: 'Ciberneticas' },
  { key: 'armasCiberneticas', label: 'Armas Ciberneticas' },
  { key: 'outros', label: 'Outros' },
];

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getImageUrl(image?: string | null) {
  if (!image) return undefined;
  if (/^https?:\/\//i.test(image) || image.startsWith('data:')) return image;

  const apiUrl = String(import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
  return `${apiUrl}/${image.replace(/^\/+/, '')}`;
}

function getDescription(item: InventoryRawItem) {
  return item.descricao ?? item.detalhe ?? item.observacao as string | null | undefined;
}

function getItemId(item: InventoryRawItem, category: InventoryCategory, index: number) {
  const id = item.idItem ?? item.id ?? item._id ?? item.idMongo;
  return id ? String(id) : `${category}-${item.nome ?? index}`;
}

function toInventoryAsset(item: InventoryRawItem, category: InventoryCategory, idPersonagem: number, index: number): InventoryAsset {
  const imageUrl = getImageUrl(item.imagem);
  const itemId = getItemId(item, category, index);

  return {
    id: `${idPersonagem}-${category}-${itemId}-${index}`,
    idItem: itemId,
    idPersonagem,
    nome: item.nome ?? 'Item sem nome',
    descricao: getDescription(item),
    category,
    tipo: 'ITEM',
    itemType: item.tipo,
    rarity: item.raridade,
    price: item.preco,
    image: item.imagem,
    url: imageUrl,
    thumbnailUrl: imageUrl,
    details: item,
  };
}

export async function getInventoryAssets(_sessionId: number, characterId: number): Promise<InventoryAsset[]> {
  const { data } = await apiClient.get<InventoryResponse | InventoryResponse[]>(`/Inventario/${characterId}`);
  const inventories = Array.isArray(data) ? data : [data];

  return inventories.flatMap((inventory) => {
    const idPersonagem = toNumber(inventory.idPersonagem) || characterId;

    return categoryMap.flatMap(({ key, label }) => {
      const items = inventory[key];

      return Array.isArray(items)
        ? items.map((item, index) => toInventoryAsset(item as InventoryRawItem, label, idPersonagem, index))
        : [];
    });
  });
}

export async function passInventoryItem(characterOriginId: number, characterTargetId: number, itemId: string, duplicavel: boolean) {
  await apiClient.post(`/Inventario/PassarItem/${characterOriginId}/${characterTargetId}`, undefined, {
    params: { idItem: itemId, duplicavel },
  });
}
