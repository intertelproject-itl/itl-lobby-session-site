export type PublicSession = {
  idSessao: number | string;
  titulo: string; 
  mestre?: string | null;
  localSessao?: string | null;
  resumo?: string | null;
  briefing?: string | null;
  Briefing?: string | null;
  statusSessao?: number | string;
  observacoes?: string | null;
  ativo?: number | string;
  publica?: number | string;
  loja_noturna?: number | string | boolean | null;
  loja_comun?: number | string | boolean | null;
  lojaNoturna?: number | string | boolean | null;
  lojaComun?: number | string | boolean | null;
  dataCriacao?: string;
  dataAtualizacao?: string;
};

export type SessionChatMessage = {
  id?: string | null;
  idSessao: number;
  nomePersonagem?: string | null;
  mensagem?: string | null;
  dataCriacao?: string | null;
};
