type ApiNumber = number | string;

export type Character = {
  id: number;
  idPersonagem: ApiNumber;
  idUsuario: ApiNumber;
  idSessao: ApiNumber;
  nome: string;
  papel?: string | null;
  origem?: string | null;
  genero?: string | null;
  idade?: ApiNumber;
  conceito?: string | null;
  nivelReputacao?: ApiNumber | null;
  hpAtual?: ApiNumber | null;
  hpMaximo?: ApiNumber | null;
  HpAtual?: ApiNumber | null;
  HpMaximo?: ApiNumber | null;
  protecaoArmaduraAtual?: ApiNumber | null;
  protecaoArmaduraMaximo?: ApiNumber | null;
  ProtecaoArmaduraAtual?: ApiNumber | null;
  ProtecaoArmaduraMaximo?: ApiNumber | null;
  protecaoArmaduraMaxima?: ApiNumber | null;
  ProtecaoArmaduraMaxima?: ApiNumber | null;
  sorteAtual?: ApiNumber | null;
  sorteMaxima?: ApiNumber | null;
  SorteAtual?: ApiNumber | null;
  SorteMaxima?: ApiNumber | null;
  humanidadeAtual?: ApiNumber | null;
  humanidadeMax?: ApiNumber | null;
  humanidadeMaxima?: ApiNumber | null;
  HumanidadeAtual?: ApiNumber | null;
  HumanidadeMax?: ApiNumber | null;
  HumanidadeMaxima?: ApiNumber | null;
  ferimentosCriticos?: ApiNumber | string | null;
  FerimentosCriticos?: ApiNumber | string | null;
  'FerimentosCríticos'?: ApiNumber | string | null;
  dinheiro?: number | string | null;
  observacoes?: string | null;
  historia?: string | null;
  foto?: string | null;
  fotoBase64?: string | null;
  imagem?: string | null;
  imagemBase64?: string | null;
  portraitBase64?: string | null;
  potraitBase64?: string | null;
  dataCriacao?: string | null;
  sessionId?: ApiNumber;
  userId?: ApiNumber;
};

export type CharacterDetails = Character & {
  atributos?: Record<string, number>;
  pericias?: Record<string, number>;
};

export type SheetData = {
  values: Record<string, number>;
  editavel: boolean;
};

export type CreateCharacterRequest = {
  usuarioId?: number;
  sessionID?: number;
  sessionId?: number;
  nome?: string;
  papel?: string;
  origem?: string;
  historia?: string;
  dinheiro?: string;
  idade?: string;
  genero?: string;
  humanidade?: string;
};

export type AttributePayload = {
  inteligencia: number;
  reflexos: number;
  destreza: number;
  tecnica: number;
  frieza: number;
  vontade: number;
  sorte: number;
  movimento: number;
  corpo: number;
  empatia: number;
};

export type SkillPayload = Record<string, number>;

export type UpdateSheetPayload = Record<string, number> & {
  idPersonagem: number;
};
