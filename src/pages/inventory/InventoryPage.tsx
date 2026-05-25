import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../../design/components/layout/AppShell';
import { PageContainer } from '../../design/components/layout/PageContainer';
import { LoadingScreen } from '../../design/components/ui/LoadingScreen';
import { InventoryGallery } from '../../design/components/character/InventoryGallery';
import { MapViewer } from '../../design/components/character/MapViewer';
import { useSessionAccess } from '../../scripts/hooks/useSessionAccess';
import { useInventory } from '../../scripts/hooks/useInventory';
import { InventoryAsset } from '../../integrations/inventory/inventory.types';

export function InventoryPage() {
  const { sessionId } = useParams();
  const numericSessionId = Number(sessionId);
  const { loading: sessionLoading, character } = useSessionAccess(numericSessionId);
  const { assets, loading } = useInventory(numericSessionId, character?.id);
  const [selected, setSelected] = useState<InventoryAsset | null>(null);

  if (sessionLoading || loading) return <LoadingScreen label="Recuperando mapas e pistas..." />;
  if (!character) return <LoadingScreen label="Personagem não encontrado." />;

  return (
    <AppShell>
      <PageContainer>
        <InventoryGallery assets={assets} onSelect={setSelected} />
        {selected ? <MapViewer asset={selected} onClose={() => setSelected(null)} /> : null}
      </PageContainer>
    </AppShell>
  );
}
