import { useState } from 'react';
import { RollRequest, RollResponse } from '../../integrations/rolls/rolls.types';

export function useDiceRoll() {
  const [result, setResult] = useState<RollResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function roll(payload: RollRequest) {
    setLoading(true);
    try {
      const d20 = Math.floor(Math.random() * 20) + 1;
      const modifier = payload.modificador ?? 0;
      const response = {
        d20,
        valorBase: payload.valorBase,
        modificador: modifier,
        total: d20 + payload.valorBase + modifier,
        tipo: payload.tipo,
        referencia: payload.referencia,
      };
      setResult(response);
      return response;
    } finally {
      setLoading(false);
    }
  }

  return { result, loading, roll };
}
