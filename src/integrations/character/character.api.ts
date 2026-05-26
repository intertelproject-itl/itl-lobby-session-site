import { apiClient } from '../http/apiClient';
import '../http/authInterceptor';
import {
  AttributePayload,
  Character,
  CharacterDetails,
  CreateCharacterRequest,
  SheetData,
  SkillPayload,
  UpdateSheetPayload,
} from './character.types';

const ignoredSheetKeys = new Set(['idAtributo', 'idPericia', 'idPersonagem', 'personagem', 'editavel']);

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function normalizeCharacter(character: Character): Character {
  const id = toNumber(character.idPersonagem);

  return {
    ...character,
    id,
    sessionId: character.idSessao,
    userId: character.idUsuario,
    historia: character.observacoes ?? character.historia,
    hpAtual: character.hpAtual ?? character.HpAtual,
    hpMaximo: character.hpMaximo ?? character.HpMaximo,
    protecaoArmaduraAtual: character.protecaoArmaduraAtual ?? character.ProtecaoArmaduraAtual,
    protecaoArmaduraMaximo:
      character.protecaoArmaduraMaximo ??
      character.protecaoArmaduraMaxima ??
      character.ProtecaoArmaduraMaximo ??
      character.ProtecaoArmaduraMaxima,
    sorteAtual: character.sorteAtual ?? character.SorteAtual,
    sorteMaxima: character.sorteMaxima ?? character.SorteMaxima,
    humanidadeAtual: character.humanidadeAtual ?? character.HumanidadeAtual,
    humanidadeMaxima: character.humanidadeMax ?? character.humanidadeMaxima ?? character.HumanidadeMax ?? character.HumanidadeMaxima,
    ferimentosCriticos: character.ferimentosCriticos ?? character.FerimentosCriticos ?? character['FerimentosCríticos'],
    portraitBase64: character.portraitBase64 ?? character.potraitBase64,
  };
}

function isEditable(value: unknown) {
  return Number(value) === 1 || value === true || String(value).toLowerCase() === 'true';
}

function toSheetData(payload: Record<string, unknown>): SheetData {
  const values = Object.fromEntries(
    Object.entries(payload)
      .filter(([key, value]) => !ignoredSheetKeys.has(key) && value !== null && value !== undefined)
      .map(([key, value]) => [key, toNumber(value)])
  );

  return {
    values,
    editavel: isEditable(payload.editavel),
  };
}

function isTimeoutError(error: unknown) {
  return Boolean(
    typeof error === 'object' &&
      error &&
      ('code' in error || 'message' in error) &&
      ((error as { code?: string }).code === 'ECONNABORTED' ||
        String((error as { message?: string }).message ?? '').toLowerCase().includes('timeout'))
  );
}

export async function getCharacterBySessionAndUser(sessionId: number, userId: number) {
  try {
    const response = await apiClient.get<Character>(`/SessaoJogatina/${sessionId}/${userId}`, {
      suppressNonTimeoutError: true,
      validateStatus: (status) => status < 500,
    });

    if (response.status !== 200) {
      return null;
    }

    return normalizeCharacter(response.data);
  } catch (error) {
    if (isTimeoutError(error)) {
      throw error;
    }

    return null;
  }
}

export async function getCharacterAttributesSheetBySessionAndUser(sessionId: number, userId: number, characterId?: number) {
  const { data } = await apiClient.get<Record<string, unknown>>(`/SessaoJogatina/${sessionId}/atributos/${userId}`, {
    params: characterId ? { idPersonagem: characterId } : undefined,
    suppressNonTimeoutError: true,
  });

  return toSheetData(data);
}

export async function getCharacterAttributesBySessionAndUser(sessionId: number, userId: number, characterId?: number) {
  const data = await getCharacterAttributesSheetBySessionAndUser(sessionId, userId, characterId);
  return data.values;
}

export async function getCharacterSkillsSheetBySessionAndUser(sessionId: number, userId: number, characterId?: number) {
  const { data } = await apiClient.get<Record<string, unknown>>(`/SessaoJogatina/${sessionId}/pericias/${userId}`, {
    params: characterId ? { idPersonagem: characterId } : undefined,
    suppressNonTimeoutError: true,
  });

  return toSheetData(data);
}

export async function getCharacterSkillsBySessionAndUser(sessionId: number, userId: number, characterId?: number) {
  const data = await getCharacterSkillsSheetBySessionAndUser(sessionId, userId, characterId);
  return data.values;
}

export async function getCharacterSheetBySessionAndUser(sessionId: number, userId: number) {
  const character = await getCharacterBySessionAndUser(sessionId, userId);

  if (!character) {
    return null;
  }

  const [atributos, pericias] = await Promise.all([
    getCharacterAttributesBySessionAndUser(sessionId, userId, character.id).catch((error) => {
      if (isTimeoutError(error)) throw error;
      return {};
    }),
    getCharacterSkillsBySessionAndUser(sessionId, userId).catch((error) => {
      if (isTimeoutError(error)) throw error;
      return {};
    }),
  ]);

  return { ...character, atributos, pericias };
}

export async function getMyCharacterBySession(sessionId: number, userId: number) {
  return getCharacterSheetBySessionAndUser(sessionId, userId);
}

export async function createCharacter(payload: CreateCharacterRequest) {
  const { sessionId, ...rest } = payload;
  const { data } = await apiClient.post<void>('/Personagem', {
    ...rest,
    sessionID: payload.sessionID ?? sessionId,
  });
  return data;
}

export async function updateCharacterAttributes(payload: UpdateSheetPayload) {
  const { data } = await apiClient.put<void>('/Personagem/atributos', payload);
  return data;
}

export async function updateCharacterSkills(payload: UpdateSheetPayload) {
  const { data } = await apiClient.put<void>('/Personagem/pericias', payload);
  return data;
}

export async function updateCharacterPortrait(characterId: number, sessionId: number, file: File) {
  const formData = new FormData();
  formData.append('portrait', file);

  const { data } = await apiClient.put<void>(`/Personagem/retrato/${characterId}/${sessionId}`, formData);
  return data;
}

export async function createCharacterAttributes(_characterId: number, _payload: AttributePayload) {
  return null;
}

export async function createCharacterSkills(_characterId: number, _payload: SkillPayload) {
  return null;
}

export async function getCharacterById(_characterId: number): Promise<CharacterDetails | null> {
  return null;
}
