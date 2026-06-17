import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../../design/components/layout/AppShell';
import { PageContainer } from '../../design/components/layout/PageContainer';
import { Button } from '../../design/components/ui/Button';
import { Card } from '../../design/components/ui/Card';
import { Input } from '../../design/components/ui/Input';
import { LoadingScreen } from '../../design/components/ui/LoadingScreen';
import { Modal } from '../../design/components/ui/Modal';
import { Character } from '../../integrations/character/character.types';
import { getPublicSessionById, getSessionPeople } from '../../integrations/sessions/sessions.api';
import { PublicSession } from '../../integrations/sessions/sessions.types';
import {
  atualizaDadosMaximo,
  curarFerimentosCriticos,
  curarHp,
  curarHumanidade,
  curarProtecaoArmaduraMaxima,
  curarSorte,
  infligirDano,
  infligirFerimentosCriticos,
} from '../../integrations/jogatina/jogatina.api';

type MasterActionKey =
  | 'maximos'
  | 'dano'
  | 'infligirFerimento'
  | 'curarFerimento'
  | 'curarHp'
  | 'curarProtecao'
  | 'curarSorte'
  | 'curarHumanidade';

type MasterFormValues = Record<string, string | boolean>;

const masterEmail = 'mestre@mestre';
const quickDice = [4, 6, 8, 10, 12, 20, 100];
const sessionCoverImage = '/sessionsPublic/Cyberpunk_2077.jpeg';
const matrixLines = [
  'GM_OVERRIDE :: NIGHT CITY CONTROL CHANNEL',
  'PLAYER_STATE > sync ficha minimal ... OK',
  'JOGATINA_API > aguardando comando',
  'ROLL_FEED :: ready',
];

const actionLabels: Record<MasterActionKey, string> = {
  maximos: 'Atualizar maximos',
  dano: 'Infligir dano',
  infligirFerimento: 'Infligir ferimento critico',
  curarFerimento: 'Curar ferimento critico',
  curarHp: 'Curar HP',
  curarProtecao: 'Curar protecao',
  curarSorte: 'Curar sorte',
  curarHumanidade: 'Curar humanidade',
};

function formatMultilineText(value?: string | null) {
  return value?.replace(/\\r\\n|\\n|\\r/g, '\n').replace(/\r\n|\r/g, '\n') ?? '';
}

function formatValue(value: unknown) {
  return value === null || value === undefined || value === '' ? '-' : String(value);
}

function toNumber(value: string | boolean | undefined) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function MasterControlPage() {
  const { sessionId } = useParams();
  const [email, setEmail] = useState(masterEmail);
  const [password, setPassword] = useState(sessionId ?? '');
  const [loginError, setLoginError] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<PublicSession | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [sessionPanelCollapsed, setSessionPanelCollapsed] = useState(false);
  const [chatLogPanelCollapsed, setChatLogPanelCollapsed] = useState(false);
  const [quickRollPanelCollapsed, setQuickRollPanelCollapsed] = useState(false);
  const [quickResult, setQuickResult] = useState<number | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [activeAction, setActiveAction] = useState<MasterActionKey>('dano');
  const [formValues, setFormValues] = useState<MasterFormValues>({});
  const [actionFeedback, setActionFeedback] = useState('');
  const [actionError, setActionError] = useState('');
  const diceRollAudioRef = useRef<HTMLAudioElement | null>(null);

  const numericSessionId = Number(password);
  const sessionBriefing = formatMultilineText(session?.Briefing ?? session?.briefing ?? session?.resumo);
  const actionTitle = selectedCharacter ? `${actionLabels[activeAction]}: ${selectedCharacter.nome}` : '';

  const characterCards = useMemo(
    () =>
      characters.map((character) => ({
        character,
        stats: [
          ['HP', `${formatValue(character.hpAtual)} / ${formatValue(character.hpMaximo)}`],
          ['Armadura', `${formatValue(character.protecaoArmaduraAtual)} / ${formatValue(character.protecaoArmaduraMaximo)}`],
          ['Sorte', `${formatValue(character.sorteAtual)} / ${formatValue(character.sorteMaxima)}`],
          ['Humanidade', `${formatValue(character.humanidadeAtual)} / ${formatValue(character.humanidadeMaxima)}`],
        ],
      })),
    [characters]
  );

  async function loadControlData(idSessao: number) {
    setLoading(true);
    try {
      const [sessionData, people] = await Promise.all([getPublicSessionById(idSessao), getSessionPeople(idSessao)]);
      setSession(sessionData);
      setCharacters(people);
    } finally {
      setLoading(false);
    }
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError('');

    if (email.trim().toLowerCase() !== masterEmail || !Number.isFinite(numericSessionId) || numericSessionId <= 0) {
      setLoginError('Credenciais invalidas para controle do mestre.');
      return;
    }

    setAuthorized(true);
    await loadControlData(numericSessionId);
  }

  function playDiceRollSound() {
    const audio = diceRollAudioRef.current;

    if (!audio) return;

    audio.volume = 0.18;
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }

  function rollQuickDie(die: number) {
    playDiceRollSound();
    setQuickResult(Math.floor(Math.random() * die) + 1);
  }

  function selectCharacter(character: Character) {
    setSelectedCharacter(character);
    setActiveAction('dano');
    setFormValues({});
    setActionFeedback('');
    setActionError('');
  }

  function updateField(key: string, value: string | boolean) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  async function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCharacter) return;

    const idPersonagem = Number(selectedCharacter.idPersonagem ?? selectedCharacter.id);

    setActionFeedback('');
    setActionError('');

    try {
      if (activeAction === 'maximos') {
        await atualizaDadosMaximo({
          idPersonagem,
          hpMaximo: toNumber(formValues.hpMaximo),
          protecaoMaxima: toNumber(formValues.protecaoMaxima),
          sorteMaxima: toNumber(formValues.sorteMaxima),
          humanidade: toNumber(formValues.humanidade),
        });
      }

      if (activeAction === 'dano') {
        await infligirDano({
          idPersonagem,
          danoHp: toNumber(formValues.danoHp),
          danoProtecao: toNumber(formValues.danoProtecao),
          danoSorte: toNumber(formValues.danoSorte),
          humanidade: toNumber(formValues.humanidade),
        });
      }

      if (activeAction === 'infligirFerimento') {
        await infligirFerimentosCriticos({ idPersonagem, ferimento: String(formValues.ferimento ?? '') });
      }

      if (activeAction === 'curarFerimento') {
        await curarFerimentosCriticos({
          idPersonagem,
          ferimento: String(formValues.ferimento ?? ''),
          curarTodos: Boolean(formValues.curarTodos),
        });
      }

      if (activeAction === 'curarHp') {
        await curarHp({ idPersonagem, hpCurado: toNumber(formValues.hpCurado), hpTotal: Boolean(formValues.hpTotal) });
      }

      if (activeAction === 'curarProtecao') {
        await curarProtecaoArmaduraMaxima({
          idPersonagem,
          protecaoCurada: toNumber(formValues.protecaoCurada),
          protecaoTotal: Boolean(formValues.protecaoTotal),
        });
      }

      if (activeAction === 'curarSorte') {
        await curarSorte({ idPersonagem, sorteCurada: toNumber(formValues.sorteCurada), sorteTotal: Boolean(formValues.sorteTotal) });
      }

      if (activeAction === 'curarHumanidade') {
        await curarHumanidade({
          idPersonagem,
          humanidadeCurada: toNumber(formValues.humanidadeCurada),
          humanidadeTotal: Boolean(formValues.humanidadeTotal),
        });
      }

      await loadControlData(numericSessionId);
      setActionFeedback('Dados Atualizados.');
    } catch {
      setActionError('Nao foi possivel executar a acao.');
    }
  }

  useEffect(() => {
    setPassword(sessionId ?? password);
  }, [sessionId]);

  if (!authorized) {
    return (
      <AppShell>
        <PageContainer>
          <Card className="master-login-panel">
            <h1 className="cy-title">Controle do mestre</h1>
            <form className="form-grid" onSubmit={submitLogin}>
              <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Usuario" />
              <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha / idSessao" />
              {loginError ? <p className="auth-error-message">{loginError}</p> : null}
              <Button type="submit">Acessar mesa</Button>
            </form>
          </Card>
        </PageContainer>
      </AppShell>
    );
  }

  if (loading && !session) return <LoadingScreen label="Carregando controle do mestre..." />;

  return (
    <AppShell>
      <audio ref={diceRollAudioRef} src="/mp3/dice-roll.mp3" preload="auto" />
      <PageContainer>
        <div className={`session-dashboard-grid master-dashboard-grid ${sessionPanelCollapsed ? 'session-dashboard-grid-briefing-collapsed' : 'session-dashboard-grid-briefing-expanded'}`}>
          <Card className="session-transparent-card session-info-card" style={{ marginTop: 0 }}>
            <div className={`session-info-panel ${sessionPanelCollapsed ? 'session-info-panel-collapsed' : 'session-info-panel-expanded'}`}>
              <div className="session-info-toolbar">
                <div>
                  <h1 className="cy-title">{session?.titulo ?? 'Mesa do mestre'}</h1>
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>Mestre: {session?.mestre ?? masterEmail}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="session-panel-toggle session-panel-icon-button"
                  aria-label={sessionPanelCollapsed ? 'Expandir briefing' : 'Minimizar briefing'}
                  title={sessionPanelCollapsed ? 'Expandir briefing' : 'Minimizar briefing'}
                  onClick={() => setSessionPanelCollapsed((current) => !current)}
                >
                  <span className={`session-panel-toggle-icon ${sessionPanelCollapsed ? 'session-panel-toggle-icon-expand' : 'session-panel-toggle-icon-collapse'}`} aria-hidden="true" />
                </Button>
              </div>
              <div className={`session-info-body ${sessionPanelCollapsed ? 'session-info-body-briefing-collapsed' : 'session-info-body-briefing-expanded'}`}>
                <div className="session-info-media">
                  <img src={sessionCoverImage} alt="" className="session-info-image" />
                  <div className="session-matrix-code" aria-hidden="true">
                    {matrixLines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </div>
                </div>
                <div className="session-info-copy">
                  <div className={`session-briefing-header ${sessionPanelCollapsed ? 'session-briefing-header-collapsed' : 'session-briefing-header-expanded'}`}>
                    <p className={`cy-subtitle session-briefing-text ${sessionPanelCollapsed ? 'session-briefing-text-collapsed' : ''}`}>
                      {sessionBriefing}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className={`session-transparent-card session-chat-log-panel ${chatLogPanelCollapsed ? 'session-chat-log-panel-collapsed' : 'session-chat-log-panel-expanded'}`} style={{ marginTop: 0 }}>
            <div className="session-panel-card-toolbar">
              <h2 className="cy-title">Chat-log</h2>
              <div className="session-chat-log-actions">
                <span className="session-chat-live-status">
                  <i aria-hidden="true" />
                  NO AR
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  className="session-panel-toggle session-panel-icon-button"
                  aria-label={chatLogPanelCollapsed ? 'Expandir chat-log' : 'Minimizar chat-log'}
                  title={chatLogPanelCollapsed ? 'Expandir chat-log' : 'Minimizar chat-log'}
                  onClick={() => setChatLogPanelCollapsed((current) => !current)}
                >
                  <span className={`session-panel-toggle-icon ${chatLogPanelCollapsed ? 'session-panel-toggle-icon-expand' : 'session-panel-toggle-icon-collapse'}`} aria-hidden="true" />
                </Button>
              </div>
            </div>
            <div className="session-chat-log-body">
              <div className="session-chat-log-stream" aria-live="polite">
                <p>Nenhuma transmissao registrada.</p>
              </div>
              <form className="session-chat-composer">
                <label htmlFor="master-chat-message">Mensagem</label>
                <div className="session-chat-input-row">
                  <textarea id="master-chat-message" placeholder="Mensagem global da mesa" rows={2} />
                  <div className="session-chat-tools" aria-label="Anexos e midia">
                    <label className="session-chat-tool-button session-chat-file-button" aria-label="Adicionar imagem ou GIF" title="Imagem ou GIF">
                      <input type="file" accept="image/*,.gif" />
                      <span>Anexar midia</span>
                    </label>
                    <Button type="button" className="session-chat-send-button" aria-label="Enviar mensagem" title="Enviar">
                      Enviar
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </Card>

          <Card className="session-transparent-card master-characters-panel" style={{ marginTop: 0 }}>
            <div className="session-panel-card-toolbar">
              <h2 className="cy-title">Personagens</h2>
              <span className="master-panel-count">{characters.length}</span>
            </div>
            <div className="master-character-grid">
              {characterCards.map(({ character, stats }) => (
                <button type="button" className="master-character-card" key={character.id} onClick={() => selectCharacter(character)}>
                  <span>{formatValue(character.papel)}</span>
                  <strong>{formatValue(character.nome)}</strong>
                  <div>
                    {stats.map(([label, value]) => (
                      <small key={label}>
                        {label}: {value}
                      </small>
                    ))}
                  </div>
                  <em>Ferimentos: {formatValue(character.ferimentosCriticos)}</em>
                </button>
              ))}
            </div>
          </Card>

          <Card className={`session-transparent-card session-quick-roll-panel ${quickRollPanelCollapsed ? 'session-quick-roll-panel-collapsed' : 'session-quick-roll-panel-expanded'}`} style={{ marginTop: 0 }}>
            <div className="session-panel-card-toolbar">
              <h2 className="cy-title">Rolagens rapidas</h2>
              <Button
                type="button"
                variant="ghost"
                className="session-panel-toggle session-panel-icon-button"
                aria-label={quickRollPanelCollapsed ? 'Expandir rolagens rapidas' : 'Minimizar rolagens rapidas'}
                title={quickRollPanelCollapsed ? 'Expandir rolagens rapidas' : 'Minimizar rolagens rapidas'}
                onClick={() => setQuickRollPanelCollapsed((current) => !current)}
              >
                <span className={`session-panel-toggle-icon ${quickRollPanelCollapsed ? 'session-panel-toggle-icon-expand' : 'session-panel-toggle-icon-collapse'}`} aria-hidden="true" />
              </Button>
            </div>
            <div className="session-quick-roll-body">
              <div className="dice-grid">
                {quickDice.map((die) => (
                  <Button key={die} type="button" title={`Rolar d${die}`} onClick={() => rollQuickDie(die)}>
                    d{die}
                  </Button>
                ))}
              </div>
              <div className={`roll-result ${quickResult ? '' : 'roll-result-empty'}`}>
                <span>{quickResult ? 'Resultado do mestre' : 'Aguardando rolagem'}</span>
                <strong>{quickResult ?? '-'}</strong>
              </div>
            </div>
          </Card>
        </div>

        <Link className="session-back-link master-control-exit-link" to="/sessoes">
          <Button style={{ width: '100%', borderColor: 'var(--primary)', color: '#060606', background: 'var(--primary)', fontWeight: 900, padding: '0.85rem 1rem' }}>
            Sair do controle
          </Button>
        </Link>

        {selectedCharacter ? (
          <Modal maxWidth={900}>
            <div className="master-action-modal">
              <Button type="button" variant="ghost" aria-label="Fechar" title="Fechar" className="modal-close-button" onClick={() => setSelectedCharacter(null)}>
                X
              </Button>
              <h2 className="cy-title">{actionTitle}</h2>
              <div className="master-action-tabs">
                {(Object.keys(actionLabels) as MasterActionKey[]).map((key) => (
                  <Button
                    key={key}
                    type="button"
                    variant={activeAction === key ? 'primary' : 'ghost'}
                    onClick={() => {
                      setActiveAction(key);
                      setFormValues({});
                      setActionFeedback('');
                      setActionError('');
                    }}
                  >
                    {actionLabels[key]}
                  </Button>
                ))}
              </div>
              <form className="master-action-form" onSubmit={submitAction}>
                {activeAction === 'maximos' ? (
                  <>
                    <Input type="number" placeholder="HP maximo" onChange={(event) => updateField('hpMaximo', event.target.value)} />
                    <Input type="number" placeholder="Protecao maxima" onChange={(event) => updateField('protecaoMaxima', event.target.value)} />
                    <Input type="number" placeholder="Sorte maxima" onChange={(event) => updateField('sorteMaxima', event.target.value)} />
                    <Input type="number" placeholder="Humanidade" onChange={(event) => updateField('humanidade', event.target.value)} />
                  </>
                ) : null}

                {activeAction === 'dano' ? (
                  <>
                    <Input type="number" placeholder="Dano HP" onChange={(event) => updateField('danoHp', event.target.value)} />
                    <Input type="number" placeholder="Dano protecao" onChange={(event) => updateField('danoProtecao', event.target.value)} />
                    <Input type="number" placeholder="Dano sorte" onChange={(event) => updateField('danoSorte', event.target.value)} />
                    <Input type="number" placeholder="Humanidade" onChange={(event) => updateField('humanidade', event.target.value)} />
                  </>
                ) : null}

                {activeAction === 'infligirFerimento' || activeAction === 'curarFerimento' ? (
                  <>
                    <Input placeholder="Ferimento critico" onChange={(event) => updateField('ferimento', event.target.value)} />
                    {activeAction === 'curarFerimento' ? (
                      <label className="master-action-check">
                        <input type="checkbox" onChange={(event) => updateField('curarTodos', event.target.checked)} />
                        Curar todos
                      </label>
                    ) : null}
                  </>
                ) : null}

                {activeAction === 'curarHp' ? (
                  <>
                    <Input type="number" placeholder="HP curado" onChange={(event) => updateField('hpCurado', event.target.value)} />
                    <label className="master-action-check">
                      <input type="checkbox" onChange={(event) => updateField('hpTotal', event.target.checked)} />
                      Curar HP total
                    </label>
                  </>
                ) : null}

                {activeAction === 'curarProtecao' ? (
                  <>
                    <Input type="number" placeholder="Protecao curada" onChange={(event) => updateField('protecaoCurada', event.target.value)} />
                    <label className="master-action-check">
                      <input type="checkbox" onChange={(event) => updateField('protecaoTotal', event.target.checked)} />
                      Curar protecao total
                    </label>
                  </>
                ) : null}

                {activeAction === 'curarSorte' ? (
                  <>
                    <Input type="number" placeholder="Sorte curada" onChange={(event) => updateField('sorteCurada', event.target.value)} />
                    <label className="master-action-check">
                      <input type="checkbox" onChange={(event) => updateField('sorteTotal', event.target.checked)} />
                      Curar sorte total
                    </label>
                  </>
                ) : null}

                {activeAction === 'curarHumanidade' ? (
                  <>
                    <Input type="number" placeholder="Humanidade curada" onChange={(event) => updateField('humanidadeCurada', event.target.value)} />
                    <label className="master-action-check">
                      <input type="checkbox" onChange={(event) => updateField('humanidadeTotal', event.target.checked)} />
                      Curar humanidade total
                    </label>
                  </>
                ) : null}

                {actionFeedback ? <p className="character-briefing-message">{actionFeedback}</p> : null}
                {actionError ? <p className="auth-error-message">{actionError}</p> : null}
                <Button type="submit">Executar acao</Button>
              </form>
            </div>
          </Modal>
        ) : null}
      </PageContainer>
    </AppShell>
  );
}
