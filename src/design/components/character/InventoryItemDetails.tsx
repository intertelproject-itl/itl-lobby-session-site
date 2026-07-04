import { useEffect, useState } from 'react';
import { Character } from '../../../integrations/character/character.types';
import { defaultPortraitImage, findCharacterPortraitUrl } from '../../../integrations/character/portrait';
import { passInventoryItem } from '../../../integrations/inventory/inventory.api';
import { InventoryAsset } from '../../../integrations/inventory/inventory.types';
import { getSessionPeople } from '../../../integrations/sessions/sessions.api';
import { Button } from '../ui/Button';

type Props = {
  asset: InventoryAsset;
  character: Character;
  sessionId: number;
  onBack: () => void;
  onTransferred?: () => void;
};

function getCharacterId(character: Character) {
  return Number(character.idPersonagem ?? character.id);
}

function getDetailEntries(asset: InventoryAsset) {
  return Object.entries(asset.details).filter(([key, value]) => key.toLowerCase() !== 'id' && value !== null && value !== undefined && value !== '');
}

function getTransferItemId(asset: InventoryAsset) {
  return asset.idItem ?? null;
}

export function InventoryItemDetails({ asset, character, sessionId, onBack, onTransferred }: Props) {
  const originCharacterId = getCharacterId(character);
  const transferItemId = getTransferItemId(asset);
  const [contacts, setContacts] = useState<Character[]>([]);
  const [contactPortraits, setContactPortraits] = useState<Record<string, string>>({});
  const [contactsLoading, setContactsLoading] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Character | null>(null);
  const [duplicavel, setDuplicavel] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [transferMessage, setTransferMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!showContacts || !sessionId || !originCharacterId) return;

    let active = true;

    async function loadContacts() {
      setContactsLoading(true);

      try {
        const people = (await getSessionPeople(sessionId)).filter((person) => getCharacterId(person) !== originCharacterId);

        if (!active) return;

        setContacts(people);
        setContactPortraits(
          Object.fromEntries(
            await Promise.all(
              people.map(async (person) => [
                String(getCharacterId(person)),
                await findCharacterPortraitUrl(person),
              ])
            )
          )
        );
      } finally {
        if (active) {
          setContactsLoading(false);
        }
      }
    }

    void loadContacts().catch(() => {
      if (active) {
        setContacts([]);
        setContactsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [originCharacterId, sessionId, showContacts]);

  async function transferItem() {
    if (!transferItemId || !selectedContact || transferring) return;

    const targetCharacterId = getCharacterId(selectedContact);
    setTransferring(true);
    setTransferMessage(null);

    try {
      await passInventoryItem(originCharacterId, targetCharacterId, transferItemId, duplicavel);
      setTransferMessage(duplicavel ? 'Copia duvidosa entregue.' : 'Item transferido.');
      onTransferred?.();
    } catch {
      setTransferMessage('Nao foi possivel transferir o item.');
    } finally {
      setTransferring(false);
    }
  }

  return (
    <div className="inventory-detail-modal">
      <div className="inventory-detail-header">
        <div>
          <span>{asset.category}</span>
          <h2 className="cy-title">{asset.nome}</h2>
        </div>
        <Button type="button" variant="ghost" onClick={onBack}>
          Voltar
        </Button>
      </div>

      <div className="inventory-detail-body">
        <div className="inventory-detail-visual">
          <img className="inventory-detail-image" src={asset.url ?? defaultPortraitImage} alt="" />
        </div>
        <dl className="inventory-detail-list">
          {getDetailEntries(asset).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>
      </div>

      {transferItemId ? (
        <section className="inventory-delivery-panel">
          <div className="inventory-delivery-header">
            <div>
              <strong>Transferencia</strong>
              <span>{selectedContact ? `Destino: ${selectedContact.nome}` : 'Selecione um contato para receber o item.'}</span>
            </div>
            <Button type="button" onClick={() => setShowContacts((current) => !current)}>
              Transferir item
            </Button>
          </div>

          {showContacts ? (
            <div className="inventory-contact-picker">
              {contactsLoading ? <p className="cy-subtitle">Carregando contatos...</p> : null}
              {!contactsLoading && contacts.length === 0 ? <p className="cy-subtitle">Nenhum contato encontrado.</p> : null}
              {contacts.map((person) => {
                const contactId = getCharacterId(person);
                const selected = selectedContact ? getCharacterId(selectedContact) === contactId : false;

                return (
                  <button
                    type="button"
                    className={`inventory-contact-card ${selected ? 'inventory-contact-card-selected' : ''}`}
                    key={String(contactId)}
                    onClick={() => {
                      setSelectedContact(person);
                      setTransferMessage(null);
                    }}
                  >
                    <img src={contactPortraits[String(contactId)] ?? defaultPortraitImage} alt="" />
                    <span>
                      <strong>{person.nome}</strong>
                      <small>{person.papel ?? 'Contato'}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <label className="inventory-duplicate-option">
            <input type="checkbox" checked={duplicavel} onChange={(event) => setDuplicavel(event.target.checked)} />
            <span>Entregar uma copia duvidosa</span>
          </label>

          {transferMessage ? <p className="inventory-transfer-message">{transferMessage}</p> : null}

          <Button type="button" disabled={!selectedContact || transferring} onClick={() => void transferItem()}>
            {transferring ? 'Transferindo...' : 'Confirmar transferencia'}
          </Button>
        </section>
      ) : null}
    </div>
  );
}
