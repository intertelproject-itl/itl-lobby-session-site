export type InventoryAsset = {
  id: number;
  nome: string;
  tipo: 'MAPA' | 'PISTA' | 'ITEM';
  url: string;
  thumbnailUrl?: string;
};
