import { apiClient } from '../http/apiClient';
import '../http/authInterceptor';

export type AtualizaDadosMaximoPayload = {
  idPersonagem: number;
  hpMaximo: number;
  protecaoMaxima: number;
  sorteMaxima: number;
  humanidade: number;
};

export type InfligirDanoPayload = {
  idPersonagem: number;
  danoHp: number;
  danoProtecao: number;
  danoSorte: number;
  humanidade: number;
};

export type FerimentoCriticoPayload = {
  idPersonagem: number;
  ferimento: string;
};

export type CurarFerimentoCriticoPayload = FerimentoCriticoPayload & {
  curarTodos: boolean;
};

export type CurarHpPayload = {
  idPersonagem: number;
  hpCurado: number;
  hpTotal: boolean;
};

export type CurarProtecaoPayload = {
  idPersonagem: number;
  protecaoCurada: number;
  protecaoTotal: boolean;
};

export type CurarSortePayload = {
  idPersonagem: number;
  sorteCurada: number;
  sorteTotal: boolean;
};

export type CurarHumanidadePayload = {
  idPersonagem: number;
  humanidadeCurada: number;
  humanidadeTotal: boolean;
};

export async function atualizaDadosMaximo(payload: AtualizaDadosMaximoPayload) {
  const { data } = await apiClient.put<void>('/Jogatina/AtualizaDadosMaximo', undefined, { params: payload });
  return data;
}

export async function infligirDano(payload: InfligirDanoPayload) {
  const { data } = await apiClient.put<void>('/Jogatina/InfligirDano', undefined, { params: payload });
  return data;
}

export async function infligirFerimentosCriticos(payload: FerimentoCriticoPayload) {
  const { data } = await apiClient.put<void>('/Jogatina/InfligirFerimentosCriticos', undefined, { params: payload });
  return data;
}

export async function curarFerimentosCriticos(payload: CurarFerimentoCriticoPayload) {
  const { data } = await apiClient.put<void>('/Jogatina/CurarFerimentosCriticos', undefined, { params: payload });
  return data;
}

export async function curarHp(payload: CurarHpPayload) {
  const { data } = await apiClient.put<void>('/Jogatina/CurarHp', undefined, { params: payload });
  return data;
}

export async function curarProtecaoArmaduraMaxima(payload: CurarProtecaoPayload) {
  const { data } = await apiClient.put<void>('/Jogatina/CurarProtecaoArmaduraMaxima', undefined, { params: payload });
  return data;
}

export async function curarSorte(payload: CurarSortePayload) {
  const { data } = await apiClient.put<void>('/Jogatina/CurarSorte', undefined, { params: payload });
  return data;
}

export async function curarHumanidade(payload: CurarHumanidadePayload) {
  const { data } = await apiClient.put<void>('/Jogatina/CurarHumanidade', undefined, { params: payload });
  return data;
}
