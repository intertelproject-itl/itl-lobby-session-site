export type InventoryCategory = 'Armas' | 'Armaduras' | 'Ciberneticas' | 'Armas Ciberneticas' | 'Outros';

export type InventoryRawItem = Record<string, unknown> & {
  id?: string | null;
  idItem?: string | null;
  idMongo?: string | null;
  _id?: string | null;
  nome?: string | null;
  descricao?: string | null;
  detalhe?: string | null;
  imagem?: string | null;
  preco?: number | string | null;
  tipo?: string | null;
  raridade?: string | null;
};

export type InventoryAsset = {
  id: string;
  idItem?: string | null;
  idPersonagem: number;
  nome: string;
  descricao?: string | null;
  category: InventoryCategory;
  tipo: 'ITEM';
  itemType?: string | null;
  rarity?: string | null;
  price?: number | string | null;
  image?: string | null;
  url?: string;
  thumbnailUrl?: string;
  details: Record<string, unknown>;
};

export type InventoryResponse = {
  id?: string | null;
  idPersonagem: number;
  armas?: InventoryRawItem[] | null;
  armaduras?: InventoryRawItem[] | null;
  ciberneticas?: InventoryRawItem[] | null;
  armasCiberneticas?: InventoryRawItem[] | null;
  outros?: InventoryRawItem[] | null;
};
