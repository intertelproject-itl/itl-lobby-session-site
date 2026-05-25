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
  dataCriacao?: string;
  dataAtualizacao?: string;
};
