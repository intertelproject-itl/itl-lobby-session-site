import { useEffect, useState } from 'react';
import { getCharacterSheetBySessionAndUser } from '../../integrations/character/character.api';
import { CharacterDetails } from '../../integrations/character/character.types';
import { InventoryAsset } from '../../integrations/inventory/inventory.types';
import { accessPublicSession, getSessionByIdSilently } from '../../integrations/sessions/sessions.api';
import { PublicSession } from '../../integrations/sessions/sessions.types';

type SessionDashboardState = {
  character: CharacterDetails | null;
  inventory: InventoryAsset[];
  loading: boolean;
  needsCharacter: boolean;
  session: PublicSession | null;
};

export function useSessionDashboard(sessionId: number, userId?: number) {
  const [state, setState] = useState<SessionDashboardState>({
    character: null,
    inventory: [],
    loading: true,
    needsCharacter: false,
    session: null,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      if (!sessionId || !userId) {
        setState((current) => ({ ...current, loading: false, needsCharacter: true }));
        return;
      }

      setState((current) => ({ ...current, loading: true, needsCharacter: false }));

      try {
        await accessPublicSession(sessionId, true);
        const session = await getSessionByIdSilently(sessionId);
        const character = await getCharacterSheetBySessionAndUser(sessionId, userId);

        if (!active) return;

        if (!character) {
          setState({
            character: null,
            inventory: [],
            loading: false,
            needsCharacter: true,
            session,
          });
          return;
        }

        setState({
          character,
          inventory: [],
          loading: false,
          needsCharacter: false,
          session,
        });
      } finally {
        if (active) {
          setState((current) => ({ ...current, loading: false }));
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [sessionId, userId]);

  return state;
}
