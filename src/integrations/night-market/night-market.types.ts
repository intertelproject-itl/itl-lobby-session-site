export type NightMarketRarity = 'Comum' | 'Incomum' | 'Raro' | 'Epico' | 'Lendario' | string;

type NightMarketBaseItem = {
  id?: string | null;
  nome?: string | null;
  tipo?: string | null;
  grupo?: string | null;
  preco?: number;
  detalhe?: string | null;
  raridade?: NightMarketRarity | null;
  observacao?: string | null;
};

export type NightMarketWeapon = NightMarketBaseItem & {
  dano?: string | null;
  dv0_6m?: number;
  dv7_12m?: number;
  dv13_25m?: number;
  dv26_50m?: number;
  dv51_100m?: number;
  dv101_200m?: number;
  pericia?: string | null;
  grupo?: string | null;
};

export type NightMarketArmor = NightMarketBaseItem & {
  pa?: number;
  penalidade?: string | null;
  cobertura?: string | null;
};

export type NightMarketCyberWeapon = NightMarketWeapon & {
  instalacao?: string | null;
  custoHumanidade?: string | null;
};

export type NightMarketCyberware = NightMarketBaseItem & {
  categoria?: string | null;
  slot?: string | null;
  custoHumanidade?: string | null;
  pericia?: string | null;
};

export type NightMarketResponse = {
  id?: string | null;
  armas?: NightMarketWeapon[] | null;
  armaduras?: NightMarketArmor[] | null;
  armasCiberneticas?: NightMarketCyberWeapon[] | null;
  ciberneticas?: NightMarketCyberware[] | null;
};

export type NightMarketCategory = 'Armas' | 'Armaduras' | 'Armas Ciberneticas' | 'Ciberneticas';

export type NightMarketDisplayItem = NightMarketBaseItem & {
  displayId: string;
  category: NightMarketCategory;
  specs: Array<{
    label: string;
    value: string;
  }>;
};

export type BuyMarketItemPayload = {
  idMongo?: string | null;
  categoria?: string | null;
  valor?: number;
  idPersonagem: number;
};
