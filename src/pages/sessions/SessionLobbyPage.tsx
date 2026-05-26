import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../design/components/layout/AppShell';
import { PageContainer } from '../../design/components/layout/PageContainer';
import { AttributeGrid } from '../../design/components/character/AttributeGrid';
import { CharacterSummary } from '../../design/components/character/CharacterSummary';
import { InventoryGallery } from '../../design/components/character/InventoryGallery';
import { SkillList } from '../../design/components/character/SkillList';
import { Button } from '../../design/components/ui/Button';
import { Card } from '../../design/components/ui/Card';
import { LoadingScreen } from '../../design/components/ui/LoadingScreen';
import { Modal } from '../../design/components/ui/Modal';
import { sendDiscordRoll } from '../../integrations/discord/discord.api';
import {
  getCharacterAttributesSheetBySessionAndUser,
  getCharacterSkillsSheetBySessionAndUser,
  updateCharacterAttributes,
  updateCharacterSkills,
} from '../../integrations/character/character.api';
import { getInventoryAssets } from '../../integrations/inventory/inventory.api';
import { InventoryAsset } from '../../integrations/inventory/inventory.types';
import { getSessionPeople } from '../../integrations/sessions/sessions.api';
import { Character } from '../../integrations/character/character.types';
import { findCharacterPortraitUrl, defaultPortraitImage } from '../../integrations/character/portrait';
import { useSessionDashboard } from '../../scripts/hooks/useSessionDashboard';
import { useAuthStore } from '../../scripts/store/auth.store';

type SheetModal = 'basic' | 'attributes' | 'skills' | 'inventory' | 'contacts' | null;
type QuickDie = 4 | 6 | 8 | 10 | 12 | 20 | 100;
type RollTone = 'critical' | 'failure' | 'neutral';
type DisplayRoll = {
  die: number;
  value: number;
  modifier?: number;
  label?: string;
  total?: number;
};

const quickDice: QuickDie[] = [4, 6, 8, 10, 12, 20, 100];
const rollCooldownSeconds = 10;
const rollRevealDelayMs = 2000;
const diceRollVolume = 0.18;
const rollScrambleChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#@$%&*+-?';
const sessionCoverImage = '/sessionsPublic/Cyberpunk_2077.jpeg';
const matrixLines = [
  '0x7A9F :: NETWATCH_TRACE // 10110100 01101001',
  'ICE_BREAK > upload shard_03 ... OK',
  'SYS_ROUTE[42] = NIGHT_CITY / DOGTOWN / BLACKWALL',
  'ACCESS KEY: 9F-77-A0-13 // SIGNAL LOCKED',
  '01001110 01000101 01010100 01010010 01010101 01001110',
];

function formatMultilineText(value?: string | null) {
  return value?.replace(/\\r\\n|\\n|\\r/g, '\n').replace(/\r\n|\r/g, '\n') ?? '';
}

export function SessionLobbyPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const userId = useAuthStore((state) => Number(state.user?.idUsuario ?? 0));
  const numericSessionId = Number(sessionId);
  const { loading, session, character, needsCharacter } = useSessionDashboard(numericSessionId, userId);
  const [activeModal, setActiveModal] = useState<SheetModal>(null);
  const [sessionPanelCollapsed, setSessionPanelCollapsed] = useState(true);
  const [sheetPanelCollapsed, setSheetPanelCollapsed] = useState(false);
  const [briefingCollapsed, setBriefingCollapsed] = useState(true);
  const [quickResult, setQuickResult] = useState<DisplayRoll | null>(null);
  const [pendingRoll, setPendingRoll] = useState<DisplayRoll | null>(null);
  const [scrambleValue, setScrambleValue] = useState('--');
  const [rollCooldown, setRollCooldown] = useState(0);
  const [currentAttributes, setCurrentAttributes] = useState<Record<string, number>>({});
  const [currentSkills, setCurrentSkills] = useState<Record<string, number>>({});
  const [attributesEditable, setAttributesEditable] = useState(false);
  const [skillsEditable, setSkillsEditable] = useState(false);
  const [updatingAttributes, setUpdatingAttributes] = useState(false);
  const [updatingSkills, setUpdatingSkills] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
  const [inventory, setInventory] = useState<InventoryAsset[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [contacts, setContacts] = useState<Character[]>([]);
  const [contactPortraits, setContactPortraits] = useState<Record<string, string>>({});
  const [contactsLoading, setContactsLoading] = useState(false);
  const [portraitVersion, setPortraitVersion] = useState(0);
  const diceRollAudioRef = useRef<HTMLAudioElement | null>(null);

  const sessionBriefing = formatMultilineText(session?.Briefing ?? session?.briefing ?? session?.resumo);
  const criticalStats = character ? [
    { label: 'HP', current: character.hpAtual, maximum: character.hpMaximo },
    { label: 'Armadura', current: character.protecaoArmaduraAtual, maximum: character.protecaoArmaduraMaximo },
    { label: 'Sorte', current: character.sorteAtual, maximum: character.sorteMaxima },
    { label: 'Humanidade', current: character.humanidadeAtual, maximum: character.humanidadeMaxima },
  ] : [];
  const criticalInjuries = character?.ferimentosCriticos ?? '...';

  function formatCriticalValue(value: unknown) {
    return value === null || value === undefined || value === '' ? '-' : String(value);
  }

  function getContactKey(person: Character) {
    return `${person.idPersonagem}-${person.idUsuario}`;
  }

  function dispatchDiscordRoll(roll: DisplayRoll) {
    void sendDiscordRoll({
      dado: String(roll.total ?? roll.value),
      nome: character?.nome ?? '',
      funcao: character?.papel ?? '',
      tipoDado: `d${roll.die}`,
      modificadores: roll.modifier !== undefined ? `${roll.label ?? 'Modificador'}(${roll.modifier})` : '',
    });
  }

  function playDiceRollSound() {
    const audio = diceRollAudioRef.current;

    if (!audio) return;

    audio.volume = diceRollVolume;
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }

  function rollQuickDie(die: QuickDie) {
    if (rollCooldown > 0) return;

    const nextRoll = { die, value: Math.floor(Math.random() * die) + 1 };

    playDiceRollSound();
    setPendingRoll(nextRoll);
    setRollCooldown(rollCooldownSeconds);
  }

  function rollSheetValue(label: string, value: number) {
    const d20 = Math.floor(Math.random() * 20) + 1;

    const nextRoll = {
      die: 20,
      value: d20,
      modifier: value,
      label,
      total: d20 + value,
    };

    playDiceRollSound();
    setPendingRoll(nextRoll);
    setActiveModal(null);
    setRollCooldown(rollCooldownSeconds);
  }

  function clampSheetValue(value: number, min: number) {
    return Math.min(10, Math.max(min, value));
  }

  function adjustAttributes(key: string, delta: number) {
    setCurrentAttributes((current) => ({ ...current, [key]: clampSheetValue((current[key] ?? 0) + delta, 1) }));
  }

  function adjustSkills(key: string, delta: number) {
    setCurrentSkills((current) => ({ ...current, [key]: clampSheetValue((current[key] ?? 0) + delta, 0) }));
  }

  async function updateAttributes() {
    if (!character || updatingAttributes) return;

    setUpdatingAttributes(true);

    try {
      await updateCharacterAttributes({ idPersonagem: character.id, ...currentAttributes });
      setShowUpdateSuccess(true);
    } finally {
      setUpdatingAttributes(false);
    }
  }

  async function updateSkills() {
    if (!character || updatingSkills) return;

    setUpdatingSkills(true);

    try {
      await updateCharacterSkills({ idPersonagem: character.id, ...currentSkills });
      setShowUpdateSuccess(true);
    } finally {
      setUpdatingSkills(false);
    }
  }

  function closeUpdateSuccess() {
    setShowUpdateSuccess(false);
    setActiveModal(null);
  }

  function getRollTone(): RollTone {
    const currentRoll = pendingRoll ?? quickResult;

    if (!currentRoll) return 'neutral';
    if (currentRoll.value === currentRoll.die) return 'critical';
    if (currentRoll.value === 1) return 'failure';
    return 'neutral';
  }

  function goToCharacterCreation() {
    navigate(`/sessoes/${numericSessionId}/personagem/criar`, { replace: true });
  }

  useEffect(() => {
    if (!loading && needsCharacter) {
      goToCharacterCreation();
    }
  }, [loading, needsCharacter]);

  useEffect(() => {
    setCurrentAttributes(character?.atributos ?? {});
    setCurrentSkills(character?.pericias ?? {});
    setAttributesEditable(false);
    setSkillsEditable(false);
  }, [character]);

  useEffect(() => {
    if (!character || !userId || activeModal !== 'attributes') return;

    let active = true;
    const currentCharacter = character;

    async function refreshAttributes() {
      try {
        const data = await getCharacterAttributesSheetBySessionAndUser(numericSessionId, userId, currentCharacter.id);

        if (!active) return;
        setCurrentAttributes(data.values);
        setAttributesEditable(data.editavel);
      } catch {
        if (active) {
          setCurrentAttributes(currentCharacter.atributos ?? {});
          setAttributesEditable(false);
        }
      }
    }

    refreshAttributes();

    return () => {
      active = false;
    };
  }, [activeModal, character, numericSessionId, userId]);

  useEffect(() => {
    if (!character || !userId || activeModal !== 'skills') return;

    let active = true;
    const currentCharacter = character;

    async function refreshSkills() {
      try {
        const data = await getCharacterSkillsSheetBySessionAndUser(numericSessionId, userId, currentCharacter.id);

        if (!active) return;
        setCurrentSkills(data.values);
        setSkillsEditable(data.editavel);
      } catch {
        if (active) {
          setCurrentSkills(currentCharacter.pericias ?? {});
          setSkillsEditable(false);
        }
      }
    }

    refreshSkills();

    return () => {
      active = false;
    };
  }, [activeModal, character, numericSessionId, userId]);

  useEffect(() => {
    if (!character || activeModal !== 'inventory') return;

    let active = true;
    const currentCharacter = character;

    async function refreshInventory() {
      setInventoryLoading(true);

      try {
        const assets = await getInventoryAssets(numericSessionId, currentCharacter.id);

        if (active) {
          setInventory(assets);
        }
      } finally {
        if (active) {
          setInventoryLoading(false);
        }
      }
    }

    refreshInventory();

    return () => {
      active = false;
    };
  }, [activeModal, character, numericSessionId]);

  useEffect(() => {
    if (activeModal !== 'contacts') return;

    let active = true;

    async function refreshContacts() {
      setContactsLoading(true);

      try {
        const people = (await getSessionPeople(numericSessionId)).filter((person) => Number(person.idUsuario) !== userId);

        if (active) {
          setContacts(people);
          setContactPortraits(
            Object.fromEntries(
              await Promise.all(
                people.map(async (person) => [getContactKey(person), await findCharacterPortraitUrl(person, portraitVersion)])
              )
            )
          );
        }
      } finally {
        if (active) {
          setContactsLoading(false);
        }
      }
    }

    refreshContacts();

    return () => {
      active = false;
    };
  }, [activeModal, numericSessionId, portraitVersion, userId]);

  useEffect(() => {
    if (rollCooldown <= 0) return;

    const timeoutId = window.setTimeout(() => {
      setRollCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [rollCooldown]);

  useEffect(() => {
    if (!pendingRoll) return;

    const scrambleId = window.setInterval(() => {
      setScrambleValue(
        Array.from({ length: 3 }, () => rollScrambleChars[Math.floor(Math.random() * rollScrambleChars.length)]).join('')
      );
    }, 80);

    const revealId = window.setTimeout(() => {
      setQuickResult(pendingRoll);
      setPendingRoll(null);
      setScrambleValue('--');
      dispatchDiscordRoll(pendingRoll);
    }, rollRevealDelayMs);

    return () => {
      window.clearInterval(scrambleId);
      window.clearTimeout(revealId);
    };
  }, [pendingRoll]);

  if (loading) return <LoadingScreen label="Carregando dados da sessao..." />;
  if (!session) return <LoadingScreen label="Sessao nao encontrada." />;

  return (
    <AppShell>
      <audio ref={diceRollAudioRef} src="/mp3/dice-roll.mp3" preload="auto" />
      <PageContainer>
        <div className="session-page-layout">
          <div className="session-main-stack">
            <div className="session-dashboard-grid">
              <Card className="session-transparent-card" style={{ marginTop: 0 }}>
                <div className={`session-info-panel ${sessionPanelCollapsed ? 'session-info-panel-collapsed' : 'session-info-panel-expanded'}`}>
                  <div className="session-info-toolbar">
                    <div>
                      <h1 className="cy-title">{session.titulo}</h1>
                      <p style={{ margin: 0, color: 'var(--text-muted)' }}>Mestre: {session.mestre}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="session-panel-toggle session-panel-icon-button"
                      aria-label={sessionPanelCollapsed ? 'Expandir sessao' : 'Minimizar sessao'}
                      title={sessionPanelCollapsed ? 'Expandir sessao' : 'Minimizar sessao'}
                      onClick={() => setSessionPanelCollapsed((current) => !current)}
                    >
                      <span className={`session-panel-toggle-icon ${sessionPanelCollapsed ? 'session-panel-toggle-icon-expand' : 'session-panel-toggle-icon-collapse'}`} aria-hidden="true" />
                    </Button>
                  </div>

                  <div className="session-info-body">
                    <div className="session-info-media">
                      <img src={sessionCoverImage} alt="" className="session-info-image" />
                      <div className="session-matrix-code" aria-hidden="true">
                        {matrixLines.map((line) => (
                          <span key={line}>{line}</span>
                        ))}
                      </div>
                    </div>
                    <div className="session-info-copy">
                      <div className={`session-briefing-header ${briefingCollapsed ? 'session-briefing-header-collapsed' : 'session-briefing-header-expanded'}`}>
                        <p className={`cy-subtitle session-briefing-text ${briefingCollapsed ? 'session-briefing-text-collapsed' : ''}`}>
                          {sessionBriefing}
                        </p>
                        {sessionBriefing ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="session-briefing-toggle session-panel-icon-button"
                            aria-label={briefingCollapsed ? 'Expandir briefing' : 'Minimizar briefing'}
                            title={briefingCollapsed ? 'Expandir briefing' : 'Minimizar briefing'}
                            onClick={() => setBriefingCollapsed((current) => !current)}
                          >
                            <span className={`session-panel-toggle-icon ${briefingCollapsed ? 'session-panel-toggle-icon-expand' : 'session-panel-toggle-icon-collapse'}`} aria-hidden="true" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="session-side-stack">
                {character ? (
                  <Card className="session-transparent-card session-critical-panel" style={{ marginTop: 0 }}>
                    <div className={`session-sheet-panel ${sheetPanelCollapsed ? 'session-sheet-panel-collapsed' : 'session-sheet-panel-expanded'}`}>
                      <div className="session-sheet-toolbar">
                        <h2 className="cy-title">Ficha</h2>
                        <Button
                          type="button"
                          variant="ghost"
                          className="session-panel-toggle session-panel-icon-button"
                          aria-label={sheetPanelCollapsed ? 'Expandir ficha' : 'Minimizar ficha'}
                          title={sheetPanelCollapsed ? 'Expandir ficha' : 'Minimizar ficha'}
                          onClick={() => setSheetPanelCollapsed((current) => !current)}
                        >
                          <span className={`session-panel-toggle-icon ${sheetPanelCollapsed ? 'session-panel-toggle-icon-expand' : 'session-panel-toggle-icon-collapse'}`} aria-hidden="true" />
                        </Button>
                      </div>
                      <div className="session-sheet-body">
                        <div className="session-critical-grid">
                          {criticalStats.map((stat) => (
                            <div className="session-critical-stat" key={stat.label}>
                              <span>{stat.label}</span>
                              <strong>
                                {formatCriticalValue(stat.current)}
                                <small> / {formatCriticalValue(stat.maximum)}</small>
                              </strong>
                            </div>
                          ))}
                          <div className="session-critical-stat session-critical-stat-wide">
                            <span>Ferimentos criticos</span>
                            <strong>{formatCriticalValue(criticalInjuries)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : null}

                <Card className="session-transparent-card" style={{ marginTop: 0 }}>
                  <h2 className="cy-title">Rolagens rapidas</h2>
                  <div className="dice-grid">
                    {quickDice.map((die) => (
                      <Button
                        key={die}
                        type="button"
                        title={`Rolar d${die}`}
                        disabled={rollCooldown > 0}
                        onClick={() => rollQuickDie(die)}
                      >
                        d{die}
                      </Button>
                    ))}
                  </div>
                  <div className="roll-cooldown" aria-hidden={rollCooldown <= 0}>
                    {rollCooldown > 0 ? <span /> : null}
                  </div>
                  <div
                    className={`roll-result roll-result-${getRollTone()} ${quickResult || pendingRoll ? '' : 'roll-result-empty'} ${pendingRoll ? 'roll-result-scrambling' : ''} ${pendingRoll && getRollTone() !== 'neutral' ? 'roll-result-oscillating' : ''}`}
                  >
                    <span>
                      {pendingRoll
                        ? pendingRoll.label ?? `d${pendingRoll.die}`
                        : quickResult
                          ? quickResult.label ?? `d${quickResult.die}`
                          : 'Aguardando rolagem'}
                    </span>
                    <strong>{pendingRoll ? scrambleValue : quickResult?.total ?? quickResult?.value ?? '-'}</strong>
                    {quickResult?.modifier !== undefined && !pendingRoll ? (
                      <small>d20 {quickResult.value} + {quickResult.modifier}</small>
                    ) : null}
                  </div>
                </Card>
              </div>
            </div>

            {character ? (
              <div className="session-actions">
                <Button type="button" className="session-icon-button" aria-label="Contatos" title="Contatos" onClick={() => setActiveModal('contacts')}>
                  <span className="session-action-icon session-action-icon-contacts" aria-hidden="true" />
                </Button>
                <Button type="button" className="session-icon-button" aria-label="Inventario" title="Inventario" onClick={() => setActiveModal('inventory')}>
                  <span className="session-action-icon session-action-icon-inventory" aria-hidden="true" />
                </Button>
                <Button type="button" className="session-icon-button" aria-label="Atributos" title="Atributos" onClick={() => setActiveModal('attributes')}>
                  <span className="session-action-icon session-action-icon-attributes" aria-hidden="true" />
                </Button>
                <Button type="button" className="session-icon-button" aria-label="Pericias" title="Pericias" onClick={() => setActiveModal('skills')}>
                  <span className="session-action-icon session-action-icon-skills" aria-hidden="true" />
                </Button>
                <Button type="button" className="session-icon-button" aria-label="Informacoes basicas" title="Informacoes basicas" onClick={() => setActiveModal('basic')}>
                  <span className="session-action-icon session-action-icon-info" aria-hidden="true" />
                </Button>
              </div>
            ) : null}
          </div>

          <Link className="session-back-link" to="/sessoes">
            <Button
              style={{
                width: '100%',
                borderColor: 'var(--primary)',
                color: '#060606',
                background: 'var(--primary)',
                fontWeight: 900,
                padding: '0.85rem 1rem',
              }}
            >
              Voltar para sessoes
            </Button>
          </Link>
        </div>

        {character && activeModal ? (
          <Modal maxWidth={activeModal === 'attributes' || activeModal === 'skills' ? 720 : 900}>
            <div className="sheet-modal-stack">
              <Button
                type="button"
                variant="ghost"
                aria-label="Fechar"
                title="Fechar"
                className="modal-close-button"
                onClick={() => setActiveModal(null)}
              >
                X
              </Button>
              {activeModal === 'basic' ? (
                <CharacterSummary
                  character={character}
                  allowPortraitUpload
                  portraitVersion={portraitVersion}
                  onPortraitUpdated={() => setPortraitVersion(Date.now())}
                />
              ) : null}
              {activeModal === 'attributes' ? (
                <AttributeGrid
                  attributes={currentAttributes}
                  editable={attributesEditable}
                  onAdjust={adjustAttributes}
                  onUpdate={updateAttributes}
                  updating={updatingAttributes}
                  onRoll={(key, value) => rollSheetValue(key, value)}
                />
              ) : null}
              {activeModal === 'skills' ? (
                <SkillList
                  skills={currentSkills}
                  editable={skillsEditable}
                  onAdjust={adjustSkills}
                  onUpdate={updateSkills}
                  updating={updatingSkills}
                  onRoll={(key, value) => rollSheetValue(key, value)}
                />
              ) : null}
              {activeModal === 'inventory' ? (
                <InventoryGallery assets={inventory} loading={inventoryLoading} onSelect={() => undefined} />
              ) : null}
              {activeModal === 'contacts' ? (
                <div>
                  <h2 className="cy-title">Contatos</h2>
                  {contactsLoading ? (
                    <p className="cy-subtitle">Carregando pessoas da mesa...</p>
                  ) : (
                    <div className="session-contacts-grid">
                      {contacts.map((person) => (
                        <div className="session-contact-card" key={`${person.idPersonagem}-${person.idUsuario}`}>
                          <img
                            src={contactPortraits[getContactKey(person)] ?? defaultPortraitImage}
                            alt={`Retrato de ${formatCriticalValue(person.nome)}`}
                          />
                          <div>
                            <span>{formatCriticalValue(person.papel)}</span>
                            <strong>{formatCriticalValue(person.nome)}</strong>
                            <small>HP {formatCriticalValue(person.hpAtual)} / {formatCriticalValue(person.hpMaximo)}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </Modal>
        ) : null}

        {showUpdateSuccess ? (
          <Modal maxWidth={420}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <h2 className="cy-title" style={{ margin: 0 }}>Valores Atualizados</h2>
              <Button type="button" onClick={closeUpdateSuccess}>
                Fechar
              </Button>
            </div>
          </Modal>
        ) : null}
      </PageContainer>
    </AppShell>
  );
}
