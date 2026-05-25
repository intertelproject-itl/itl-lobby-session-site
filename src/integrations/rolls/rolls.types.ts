export type RollRequest = {
  characterId: number;
  tipo: 'ATRIBUTO' | 'PERICIA';
  referencia: string;
  valorBase: number;
  modificador?: number;
};

export type RollResponse = {
  d20: number;
  valorBase: number;
  modificador: number;
  total: number;
  tipo: string;
  referencia: string;
};
