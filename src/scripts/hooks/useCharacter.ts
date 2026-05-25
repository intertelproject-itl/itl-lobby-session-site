import { useEffect, useState } from 'react';
import { CharacterDetails } from '../../integrations/character/character.types';
import { getCharacterById } from '../../integrations/character/character.api';

export function useCharacter(characterId?: number) {
  const [character, setCharacter] = useState<CharacterDetails | null>(null);
  const [loading, setLoading] = useState(Boolean(characterId));

  useEffect(() => {
    if (!characterId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        if (!characterId) return;
        setCharacter(await getCharacterById(characterId));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [characterId]);

  return { character, loading };
}
