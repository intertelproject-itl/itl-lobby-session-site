import { useEffect, useState } from 'react';
import { getInventoryAssets } from '../../integrations/inventory/inventory.api';
import { InventoryAsset } from '../../integrations/inventory/inventory.types';

export function useInventory(sessionId?: number, characterId?: number) {
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [loading, setLoading] = useState(Boolean(sessionId && characterId));

  useEffect(() => {
    if (!sessionId || !characterId) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        if (!sessionId || !characterId) return;
        setAssets(await getInventoryAssets(sessionId, characterId));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [sessionId, characterId]);

  return { assets, loading };
}
