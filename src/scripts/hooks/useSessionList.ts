import { useEffect, useState } from 'react';
import { getPublicSessions } from '../../integrations/sessions/sessions.api';
import { PublicSession } from '../../integrations/sessions/sessions.types';

export function useSessionList() {
  const [sessions, setSessions] = useState<PublicSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setSessions(await getPublicSessions());
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { sessions, loading };
}
