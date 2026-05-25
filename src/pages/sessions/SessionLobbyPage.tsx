import { useEffect, useState } from 'react';
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
import { useSessionDashboard } from '../../scripts/hooks/useSessionDashboard';
import { useAuthStore } from '../../scripts/store/auth.store';

type SheetModal = 'basic' | 'attributes' | 'skills' | 'inventory' | null;
type QuickDie = 8 | 10 | 20 | 100;
type RollTone = 'critical' | 'failure' | 'neutral';
type DisplayRoll = {
  die: number;
  value: number;
  modifier?: number;
  label?: string;
  total?: number;
};

const quickDice: QuickDie[] = [8, 10, 20, 100];
const rollCooldownSeconds = 10;
const rollRevealDelayMs = 2000;
const rollScrambleChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#@$%&*+-?';
const sessionCoverImage = '/sessionsPublic/Cyberpunk_2077.jpeg';
const matrixLines = [
  '0x7A9F :: NETWATCH_TRACE // 10110100 01101001',
  'ICE_BREAK > upload shard_03 ... OK',
  'SYS_ROUTE[42] = NIGHT_CITY / DOGTOWN / BLACKWALL',
  'ACCESS KEY: 9F-77-A0-13 // SIGNAL LOCKED',
  '01001110 01000101 01010100 01010010 01010101 01001110',
];

export function SessionLobbyPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const userId = useAuthStore((state) => Number(state.user?.idUsuario ?? 0));
  const numericSessionId = Number(sessionId);
  const { loading, session, character, inventory, needsCharacter } = useSessionDashboard(numericSessionId, userId);
  const [activeModal, setActiveModal] = useState<SheetModal>(null);
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

  const sessionBriefing = session?.Briefing ?? session?.briefing ?? session?.resumo;

  function dispatchDiscordRoll(roll: DisplayRoll) {
    void sendDiscordRoll({
      dado: String(roll.total ?? roll.value),
      nome: character?.nome ?? '',
      funcao: character?.papel ?? '',
      tipoDado: `d${roll.die}`,
      modificadores: roll.modifier !== undefined ? `${roll.label ?? 'Modificador'}(${roll.modifier})` : '',
    });
  }

  function rollQuickDie(die: QuickDie) {
    if (rollCooldown > 0) return;

    const nextRoll = { die, value: Math.floor(Math.random() * die) + 1 };

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
      <PageContainer>
        <div className="session-page-layout">
          <div className="session-main-stack">
            <div className="session-dashboard-grid">
              <Card className="session-transparent-card" style={{ marginTop: 0 }}>
                <div className="session-info-panel">
                  <div className="session-info-media">
                    <img src={sessionCoverImage} alt="" className="session-info-image" />
                    <div className="session-matrix-code" aria-hidden="true">
                      {matrixLines.map((line) => (
                        <span key={line}>{line}</span>
                      ))}
                    </div>
                  </div>
                  <div className="session-info-copy">
                    <div>
                      <h1 className="cy-title">{session.titulo}</h1>
                      <p className="cy-subtitle">{sessionBriefing}</p>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>Mestre: {session.mestre}</p>
                  </div>
                </div>
              </Card>

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

            {character ? (
              <div className="session-actions">
                <Button type="button" onClick={() => setActiveModal('inventory')}>
                  Inventario
                </Button>
                <Button type="button" onClick={() => setActiveModal('attributes')}>
                  Atributos
                </Button>
                <Button type="button" onClick={() => setActiveModal('skills')}>
                  Pericias
                </Button>
                <Button type="button" onClick={() => setActiveModal('basic')}>
                  Informacoes basicas
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
              {activeModal === 'basic' ? <CharacterSummary character={character} /> : null}
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
              {activeModal === 'inventory' ? <InventoryGallery assets={inventory} onSelect={() => undefined} /> : null}
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
