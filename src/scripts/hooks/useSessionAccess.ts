import { useEffect, useState } from 'react';
import { accessPublicSession, getPublicSessionById } from '../../integrations/sessions/sessions.api';
import { getMyCharacterBySession } from '../../integrations/character/character.api';
import { PublicSession } from '../../integrations/sessions/sessions.types';
import { CharacterDetails } from '../../integrations/character/character.types';
import { useAuthStore } from '../store/auth.store';

export function useSessionAccess(sessionId: number) {
  const userId = useAuthStore((state) => Number(state.user?.idUsuario ?? 0));
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<PublicSession | null>(null);
  const [character, setCharacter] = useState<CharacterDetails | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        await accessPublicSession(sessionId);
        setSession(await getPublicSessionById(sessionId));
        try {
          setCharacter(userId ? await getMyCharacterBySession(sessionId, userId) : null);
        } catch {
          setCharacter(null);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [sessionId, userId]);

  return { loading, session, character };
}
