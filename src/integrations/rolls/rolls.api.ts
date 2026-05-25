import { RollRequest, RollResponse } from './rolls.types';

export type { RollRequest, RollResponse } from './rolls.types';

export async function sendRoll(payload: RollRequest) {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const modifier = payload.modificador ?? 0;
  const data: RollResponse = {
    d20,
    valorBase: payload.valorBase,
    modificador: modifier,
    total: d20 + payload.valorBase + modifier,
    tipo: payload.tipo,
    referencia: payload.referencia,
  };

  return data;
}
