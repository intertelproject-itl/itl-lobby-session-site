import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../../design/components/layout/AppShell';
import { PageContainer } from '../../design/components/layout/PageContainer';
import { LoadingScreen } from '../../design/components/ui/LoadingScreen';
import { InventoryGallery } from '../../design/components/character/InventoryGallery';
import { Modal } from '../../design/components/ui/Modal';
import { InventoryItemDetails } from '../../design/components/character/InventoryItemDetails';
import { useSessionAccess } from '../../scripts/hooks/useSessionAccess';
import { useInventory } from '../../scripts/hooks/useInventory';
import { InventoryAsset } from '../../integrations/inventory/inventory.types';

export function InventoryPage() {
  const { sessionId } = useParams();
  const numericSessionId = Number(sessionId);
  const { loading: sessionLoading, character } = useSessionAccess(numericSessionId);
  const { assets, loading } = useInventory(numericSessionId, character?.id);
  const [selected, setSelected] = useState<InventoryAsset | null>(null);

  function selectItem(asset: InventoryAsset) {
    setSelected(asset);
  }

  if (sessionLoading || loading) return <LoadingScreen label="Recuperando inventario..." />;
  if (!character) return <LoadingScreen label="Personagem nao encontrado." />;

  return (
    <AppShell>
      <PageContainer>
        <InventoryGallery assets={assets} onSelect={selectItem} />
        {selected ? (
          <Modal maxWidth={760}>
            <InventoryItemDetails
              asset={selected}
              character={character}
              sessionId={numericSessionId}
              onBack={() => setSelected(null)}
            />
          </Modal>
        ) : null}
      </PageContainer>
    </AppShell>
  );
}
