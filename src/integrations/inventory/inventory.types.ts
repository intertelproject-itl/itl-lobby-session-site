export type InventoryAsset = {
  id: string;
  idPersonagem: number;
  nome: string;
  descricao?: string | null;
  tipo: 'ITEM';
  url?: string;
  thumbnailUrl?: string;
};

export type InventoryResponse = {
  idPersonagem: number;
  nome?: string | null;
  descricao?: string | null;
};
