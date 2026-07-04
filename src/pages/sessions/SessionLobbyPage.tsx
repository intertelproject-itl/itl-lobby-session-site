import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../design/components/layout/AppShell';
import { PageContainer } from '../../design/components/layout/PageContainer';
import { AttributeGrid } from '../../design/components/character/AttributeGrid';
import { CharacterSummary } from '../../design/components/character/CharacterSummary';
import { InventoryGallery } from '../../design/components/character/InventoryGallery';
import { InventoryItemDetails } from '../../design/components/character/InventoryItemDetails';
import { SkillList } from '../../design/components/character/SkillList';
import { Button } from '../../design/components/ui/Button';
import { Card } from '../../design/components/ui/Card';
import { LoadingScreen } from '../../design/components/ui/LoadingScreen';
import { Modal } from '../../design/components/ui/Modal';
import { Input } from '../../design/components/ui/Input';
import { sendDiscordRoll } from '../../integrations/discord/discord.api';
import {
  getCharacterAttributesSheetBySessionAndCharacter,
  getCharacterSkillsSheetBySessionAndCharacter,
  updateCharacterAttributes,
  updateCharacterSkills,
} from '../../integrations/character/character.api';
import { getInventoryAssets } from '../../integrations/inventory/inventory.api';
import { InventoryAsset } from '../../integrations/inventory/inventory.types';
import { buyCommonMarketItem, buyNightMarketItem, getCommonMarket, getNightMarket } from '../../integrations/night-market/night-market.api';
import { NightMarketCategory, NightMarketDisplayItem } from '../../integrations/night-market/night-market.types';
import { getSessionChat, getSessionPeople, sendSessionChatMessage } from '../../integrations/sessions/sessions.api';
import { ensureChatHubConnected, getChatHubConnection } from '../../integrations/signalr/signalr.api';
import { Character, SkillSheetRow, SkillSheetValues } from '../../integrations/character/character.types';
import { findCharacterPortraitUrl, defaultPortraitImage } from '../../integrations/character/portrait';
import { useSessionDashboard } from '../../scripts/hooks/useSessionDashboard';
import { useAuthStore } from '../../scripts/store/auth.store';

type SheetModal = 'basic' | 'attributes' | 'skills' | 'inventory' | 'contacts' | 'nightMarket' | 'commonMarket' | null;
type QuickDie = 4 | 6 | 8 | 10 | 12 | 20 | 100;
type RollTone = 'critical' | 'failure' | 'neutral';
type MarketKind = 'night' | 'common';
type WeaponGroup = 'Distancia' | 'CorpoACorpo' | 'Outros';
type ChatMessage = {
  id: string;
  timestamp?: string | null;
  characterName: string;
  message: string;
};
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
const marketCategories: NightMarketCategory[] = ['Armas', 'Armaduras', 'Armas Ciberneticas', 'Ciberneticas'];
const weaponGroups: WeaponGroup[] = ['Distancia', 'CorpoACorpo', 'Outros'];
const defaultMarketCollapsedCategories: Record<NightMarketCategory, boolean> = {
  Armas: true,
  Armaduras: true,
  'Armas Ciberneticas': true,
  Ciberneticas: true,
};
const defaultWeaponGroupCollapsed: Record<WeaponGroup, boolean> = {
  Distancia: false,
  CorpoACorpo: false,
  Outros: false,
};

function formatMultilineText(value?: string | null) {
  return value?.replace(/\\r\\n|\\n|\\r/g, '\n').replace(/\r\n|\r/g, '\n') ?? '';
}

function normalizeSearchText(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function itemMatchesMarketSearch(item: NightMarketDisplayItem, search: string) {
  if (!search) return true;

  return normalizeSearchText([
    item.nome,
    item.category,
    item.tipo,
    item.preco,
    item.raridade,
    item.detalhe,
    item.observacao,
    ...item.specs.flatMap((spec) => [spec.label, spec.value]),
  ].join(' ')).includes(search);
}

function toChatMessage(raw: { id?: string | null; nomePersonagem?: string | null; mensagem?: string | null; dataCriacao?: string | null }, fallbackIndex = 0): ChatMessage {
  return {
    id: raw.id ?? `${raw.dataCriacao ?? Date.now()}-${fallbackIndex}`,
    timestamp: raw.dataCriacao,
    characterName: raw.nomePersonagem ?? 'Sistema',
    message: raw.mensagem ?? '',
  };
}

function formatChatTimestamp(value?: string | null) {
  if (!value) return '';

  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 16);
  }

  const pad = (part: number) => String(part).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getSessionEventNumber(value: unknown) {
  if (typeof value === 'object' && value !== null) {
    const payload = value as { sessao?: unknown; idSessao?: unknown; sessionId?: unknown };
    return Number(payload.sessao ?? payload.idSessao ?? payload.sessionId);
  }

  return Number(value);
}

export function SessionLobbyPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const userId = useAuthStore((state) => Number(state.user?.idUsuario ?? 0));
  const numericSessionId = Number(sessionId);
  const { loading, session, character, needsCharacter, refreshDashboard, refreshSession } = useSessionDashboard(numericSessionId, userId);
  const [activeModal, setActiveModal] = useState<SheetModal>(null);
  const [sessionPanelCollapsed, setSessionPanelCollapsed] = useState(true);
  const [sheetPanelCollapsed, setSheetPanelCollapsed] = useState(false);
  const briefingCollapsed = sessionPanelCollapsed;
  const [chatLogPanelCollapsed, setChatLogPanelCollapsed] = useState(false);
  const [quickRollPanelCollapsed, setQuickRollPanelCollapsed] = useState(false);
  const [quickResult, setQuickResult] = useState<DisplayRoll | null>(null);
  const [pendingRoll, setPendingRoll] = useState<DisplayRoll | null>(null);
  const [scrambleValue, setScrambleValue] = useState('--');
  const [rollCooldown, setRollCooldown] = useState(0);
  const [currentAttributes, setCurrentAttributes] = useState<Record<string, number>>({});
  const [currentSkills, setCurrentSkills] = useState<SkillSheetValues>({});
  const [attributesEditable, setAttributesEditable] = useState(false);
  const [skillsEditable, setSkillsEditable] = useState(false);
  const [updatingAttributes, setUpdatingAttributes] = useState(false);
  const [updatingSkills, setUpdatingSkills] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
  const [inventory, setInventory] = useState<InventoryAsset[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryAsset | null>(null);
  const [contacts, setContacts] = useState<Character[]>([]);
  const [contactPortraits, setContactPortraits] = useState<Record<string, string>>({});
  const [contactsLoading, setContactsLoading] = useState(false);
  const [nightMarket, setNightMarket] = useState<NightMarketDisplayItem[]>([]);
  const [nightMarketFilter, setNightMarketFilter] = useState('');
  const [nightMarketCollapsedCategories, setNightMarketCollapsedCategories] = useState<Record<NightMarketCategory, boolean>>(defaultMarketCollapsedCategories);
  const [nightMarketCollapsedWeaponGroups, setNightMarketCollapsedWeaponGroups] = useState<Record<WeaponGroup, boolean>>(defaultWeaponGroupCollapsed);
  const [commonMarket, setCommonMarket] = useState<NightMarketDisplayItem[]>([]);
  const [commonMarketLoading, setCommonMarketLoading] = useState(false);
  const [commonMarketError, setCommonMarketError] = useState(false);
  const [commonMarketFilter, setCommonMarketFilter] = useState('');
  const [commonMarketCollapsedCategories, setCommonMarketCollapsedCategories] = useState<Record<NightMarketCategory, boolean>>(defaultMarketCollapsedCategories);
  const [commonMarketCollapsedWeaponGroups, setCommonMarketCollapsedWeaponGroups] = useState<Record<WeaponGroup, boolean>>(defaultWeaponGroupCollapsed);
  const [buyingMarketItemId, setBuyingMarketItemId] = useState<string | null>(null);
  const [marketPurchaseMessage, setMarketPurchaseMessage] = useState<string | null>(null);
  const [marketPurchaseError, setMarketPurchaseError] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [portraitVersion, setPortraitVersion] = useState(0);
  const diceRollAudioRef = useRef<HTMLAudioElement | null>(null);
  const chatStreamRef = useRef<HTMLDivElement | null>(null);
  const lastChatEventKeyRef = useRef<string | null>(null);
  const signalRHandlersRef = useRef({
    characterId: undefined as number | undefined,
    refreshCommonMarket: async () => undefined as void,
    refreshCurrentAttributes: async () => undefined as void,
    refreshCurrentInventory: async () => undefined as void,
    refreshCurrentSkills: async () => undefined as void,
    refreshDashboard: async (_options?: { silent?: boolean }) => undefined as void,
    refreshNightMarket: async () => undefined as void,
    refreshSession: async () => undefined as void,
    refreshSessionChat: async () => undefined as void,
  });

  const nightMarketStatus = session?.loja_noturna ?? session?.lojaNoturna;
  const commonMarketStatus = session?.loja_comun ?? session?.lojaComun;
  const isNightMarketEnabled = Number(nightMarketStatus) === 1 || nightMarketStatus === true;
  const isCommonMarketEnabled = Number(commonMarketStatus) === 1 || commonMarketStatus === true;
  const characterCredits = Number(character?.dinheiro ?? 0);
  const sessionBriefing = formatMultilineText(session?.Briefing ?? session?.briefing ?? session?.resumo);
  const criticalStats = character ? [
    { label: 'HP', current: character.hpAtual, maximum: character.hpMaximo },
    { label: 'Armadura', current: character.protecaoArmaduraAtual, maximum: character.protecaoArmaduraMaximo },
    { label: 'Sorte', current: character.sorteAtual, maximum: character.sorteMaxima },
    { label: 'Humanidade', current: character.humanidadeAtual, maximum: character.humanidadeMaxima },
    { label: 'Creditos', current: formatNightMarketPrice(characterCredits), maximum: null },
  ] : [];
  const criticalInjuries = character?.ferimentosCriticos ?? '...';
  const filteredNightMarket = useMemo(() => {
    const search = normalizeSearchText(nightMarketFilter.trim());

    return nightMarket.filter((item) => itemMatchesMarketSearch(item, search));
  }, [nightMarket, nightMarketFilter]);
  const filteredCommonMarket = useMemo(() => {
    const search = normalizeSearchText(commonMarketFilter.trim());

    return commonMarket.filter((item) => itemMatchesMarketSearch(item, search));
  }, [commonMarket, commonMarketFilter]);

  function formatCriticalValue(value: unknown) {
    return value === null || value === undefined || value === '' ? '-' : String(value);
  }

  function formatNightMarketPrice(value: unknown) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? `${numberValue.toLocaleString('pt-BR')} eb` : '-';
  }

  function canAffordMarketItem(item: NightMarketDisplayItem) {
    const price = Number(item.preco);
    return !Number.isFinite(price) || price <= characterCredits;
  }

  function getNightMarketRarityClass(rarity?: string | null) {
    const normalized = (rarity ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    if (normalized === 'comum') return 'night-market-item-common';
    if (normalized === 'incomum') return 'night-market-item-uncommon';
    if (normalized === 'raro') return 'night-market-item-rare';
    if (normalized === 'epico') return 'night-market-item-epic';
    if (normalized === 'lendario') return 'night-market-item-legendary';
    return 'night-market-item-common';
  }

  function getContactKey(person: Character) {
    return `${person.idPersonagem}-${person.idUsuario}`;
  }

  function getItemsByCategory(items: NightMarketDisplayItem[], category: NightMarketCategory) {
    return items.filter((item) => item.category === category);
  }

  function toggleCommonMarketCategory(category: NightMarketCategory) {
    setCommonMarketCollapsedCategories((current) => ({ ...current, [category]: !current[category] }));
  }

  function toggleNightMarketCategory(category: NightMarketCategory) {
    setNightMarketCollapsedCategories((current) => ({ ...current, [category]: !current[category] }));
  }

  function toggleMarketWeaponGroup(group: WeaponGroup, market: MarketKind) {
    if (market === 'night') {
      setNightMarketCollapsedWeaponGroups((current) => ({ ...current, [group]: !current[group] }));
      return;
    }

    setCommonMarketCollapsedWeaponGroups((current) => ({ ...current, [group]: !current[group] }));
  }

  async function buyMarketItem(item: NightMarketDisplayItem, market: MarketKind) {
    if (!character || buyingMarketItemId || !canAffordMarketItem(item)) return;

    const purchaseId = `${market}-${item.displayId}`;
    setBuyingMarketItemId(purchaseId);
    setMarketPurchaseMessage(null);
    setMarketPurchaseError(false);

    try {
      const payload = {
        idMongo: item.id,
        categoria: item.category,
        valor: typeof item.preco === 'number' ? item.preco : 0,
        idPersonagem: character.id,
      };

      if (market === 'night') {
        await buyNightMarketItem(payload);
      } else {
        await buyCommonMarketItem(payload);
      }

      setMarketPurchaseMessage(`${item.nome} comprado com sucesso.`);
      void refreshDashboard({ silent: true });
    } catch {
      setMarketPurchaseMessage(`Nao foi possivel comprar ${item.nome}.`);
      setMarketPurchaseError(true);
    } finally {
      setBuyingMarketItemId(null);
    }
  }

  function getWeaponGroup(item: NightMarketDisplayItem): WeaponGroup {
    const normalized = normalizeSearchText(item.grupo).replace(/\s/g, '');

    if (normalized === 'distancia') return 'Distancia';
    if (normalized === 'corpoacorpo') return 'CorpoACorpo';
    return 'Outros';
  }

  function renderMarketItem(item: NightMarketDisplayItem, market: MarketKind) {
    const canAfford = canAffordMarketItem(item);

    return (
      <article className={`night-market-item ${getNightMarketRarityClass(item.raridade)}`} key={item.displayId}>
        <div className="night-market-item-header">
          <span>{item.category}</span>
          <em>{item.raridade ?? 'Comum'}</em>
        </div>
        <h3>{item.nome}</h3>
        <div className="night-market-item-meta">
          <strong>{formatNightMarketPrice(item.preco)}</strong>
          {item.tipo ? <small>{item.tipo}</small> : null}
        </div>
        {item.specs.length > 0 ? (
          <dl>
            {item.specs.map((spec) => (
              <div key={`${item.displayId}-${spec.label}`}>
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {item.detalhe ? <p>{item.detalhe}</p> : null}
        {item.observacao ? <p>{item.observacao}</p> : null}
        <Button
          type="button"
          className="market-buy-button"
          disabled={buyingMarketItemId !== null || !canAfford}
          title={canAfford ? 'Comprar' : 'Creditos insuficientes'}
          onClick={() => buyMarketItem(item, market)}
        >
          {buyingMarketItemId === `${market}-${item.displayId}` ? 'Comprando...' : canAfford ? 'Comprar' : 'Creditos insuficientes'}
        </Button>
      </article>
    );
  }

  function renderMarketCategoryItems(items: NightMarketDisplayItem[], category: NightMarketCategory, market: MarketKind) {
    if (category !== 'Armas') {
      return <div className="night-market-grid">{items.map((item) => renderMarketItem(item, market))}</div>;
    }

    const collapsedWeaponGroups = market === 'night' ? nightMarketCollapsedWeaponGroups : commonMarketCollapsedWeaponGroups;

    return (
      <div className="market-weapon-group-stack">
        {weaponGroups.map((group) => {
          const groupItems = items.filter((item) => getWeaponGroup(item) === group);
          const collapsed = collapsedWeaponGroups[group];

          if (groupItems.length === 0) return null;

          return (
            <section className="market-weapon-group" key={group}>
              <button
                type="button"
                className="market-weapon-group-header"
                aria-expanded={!collapsed}
                onClick={() => toggleMarketWeaponGroup(group, market)}
              >
                <span className={`common-market-category-chevron ${collapsed ? '' : 'common-market-category-chevron-open'}`} aria-hidden="true" />
                <h4>{group}</h4>
                <span>{groupItems.length} itens</span>
              </button>
              {!collapsed ? <div className="night-market-grid">{groupItems.map((item) => renderMarketItem(item, market))}</div> : null}
            </section>
          );
        })}
      </div>
    );
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
    const d10 = Math.floor(Math.random() * 10) + 1;

    const nextRoll = {
      die: 10,
      value: d10,
      modifier: value,
      label,
      total: d10 + value,
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
    setCurrentSkills((current) => {
      if (Array.isArray(current)) {
        return current.map((skill) =>
          skill.id === key ? { ...skill, nivel: clampSheetValue(skill.nivel + delta, 0) } : skill
        );
      }

      return { ...current, [key]: clampSheetValue((current[key] ?? 0) + delta, 0) };
    });
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
      const skillPayload = Array.isArray(currentSkills)
        ? currentSkills.reduce<Record<string, Record<string, unknown>>>((payload, skill: SkillSheetRow) => {
            payload[skill.categoryKey] = {
              ...(payload[skill.categoryKey] ?? skill.categoryFields),
              [skill.baseKey]: skill.base,
              [skill.nivelKey]: skill.nivel,
            };

            return payload;
          }, {})
        : currentSkills;

      await updateCharacterSkills(Array.isArray(currentSkills) ? skillPayload : { idPersonagem: character.id, ...skillPayload });
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

  async function sendChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = chatDraft.trim();

    if (!message || !character) return;

    setChatDraft('');

    try {
      await sendSessionChatMessage(numericSessionId, character.nome ?? 'Personagem', message);
    } catch {
      setChatMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-erro`,
          timestamp: new Date().toISOString(),
          characterName: 'Sistema',
          message: 'Nao foi possivel enviar a mensagem.',
        },
      ]);
    }
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

  const refreshCurrentAttributes = useCallback(async () => {
    if (!character) return;

    try {
      const data = await getCharacterAttributesSheetBySessionAndCharacter(numericSessionId, character.id);

      setCurrentAttributes(data.values);
      setAttributesEditable(data.editavel);
    } catch {
      setCurrentAttributes(character.atributos ?? {});
      setAttributesEditable(false);
    }
  }, [character, numericSessionId]);

  const refreshCurrentSkills = useCallback(async () => {
    if (!character) return;

    try {
      const data = await getCharacterSkillsSheetBySessionAndCharacter(numericSessionId, character.id);

      setCurrentSkills(data.values);
      setSkillsEditable(data.editavel);
    } catch {
      setCurrentSkills(character.pericias ?? {});
      setSkillsEditable(false);
    }
  }, [character, numericSessionId]);

  const refreshCurrentInventory = useCallback(async () => {
    if (!character) return;

    setInventoryLoading(true);

    try {
      const assets = await getInventoryAssets(numericSessionId, character.id);
      setInventory(assets);
    } finally {
      setInventoryLoading(false);
    }
  }, [character, numericSessionId]);

  const refreshNightMarket = useCallback(async () => {
    if (!character || !isNightMarketEnabled) {
      setNightMarket([]);
      return;
    }

    try {
      const items = await getNightMarket();
      setNightMarket(items);
    } catch {
      setNightMarket([]);
    }
  }, [character, isNightMarketEnabled]);

  const refreshCommonMarket = useCallback(async () => {
    if (!character || !isCommonMarketEnabled) {
      setCommonMarket([]);
      return;
    }

    setCommonMarketLoading(true);
    setCommonMarketError(false);

    try {
      const items = await getCommonMarket();
      setCommonMarket(items);
    } catch {
      setCommonMarket([]);
      setCommonMarketError(true);
    } finally {
      setCommonMarketLoading(false);
    }
  }, [character, isCommonMarketEnabled]);

  const refreshSessionChat = useCallback(async () => {
    if (!numericSessionId) return;

    const messages = await getSessionChat(numericSessionId);
    setChatMessages(messages.map(toChatMessage));
  }, [numericSessionId]);

  useEffect(() => {
    signalRHandlersRef.current = {
      characterId: character?.id,
      refreshCommonMarket,
      refreshCurrentAttributes,
      refreshCurrentInventory,
      refreshCurrentSkills,
      refreshDashboard,
      refreshNightMarket,
      refreshSession,
      refreshSessionChat,
    };
  }, [
    character?.id,
    refreshCommonMarket,
    refreshCurrentAttributes,
    refreshCurrentInventory,
    refreshCurrentSkills,
    refreshDashboard,
    refreshNightMarket,
    refreshSession,
    refreshSessionChat,
  ]);

  useEffect(() => {
    if (!character || activeModal !== 'attributes') return;

    void refreshCurrentAttributes();
  }, [activeModal, character, refreshCurrentAttributes]);

  useEffect(() => {
    if (!character || activeModal !== 'skills') return;

    void refreshCurrentSkills();
  }, [activeModal, character, refreshCurrentSkills]);

  useEffect(() => {
    if (!character || activeModal !== 'inventory') return;

    void refreshCurrentInventory();
  }, [activeModal, character, refreshCurrentInventory]);

  useEffect(() => {
    if (activeModal !== 'inventory') {
      setSelectedInventoryItem(null);
    }
  }, [activeModal]);

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
    void refreshNightMarket();
  }, [refreshNightMarket]);

  useEffect(() => {
    void refreshSessionChat().catch(() => undefined);
  }, [refreshSessionChat]);

  useEffect(() => {
    const stream = chatStreamRef.current;

    if (!stream) return;

    stream.scrollTop = stream.scrollHeight;
  }, [chatMessages]);

  useEffect(() => {
    if (activeModal !== 'nightMarket') return;

    setNightMarketFilter('');
    setNightMarketCollapsedCategories(defaultMarketCollapsedCategories);
    setNightMarketCollapsedWeaponGroups(defaultWeaponGroupCollapsed);
    setMarketPurchaseMessage(null);
    setMarketPurchaseError(false);
  }, [activeModal]);

  useEffect(() => {
    if (!character || activeModal !== 'commonMarket') return;

    setCommonMarketFilter('');
    setCommonMarketCollapsedCategories(defaultMarketCollapsedCategories);
    setCommonMarketCollapsedWeaponGroups(defaultWeaponGroupCollapsed);
    setMarketPurchaseMessage(null);
    setMarketPurchaseError(false);

    void refreshCommonMarket();
  }, [activeModal, character, refreshCommonMarket]);

  useEffect(() => {
    if (activeModal === 'nightMarket' && !isNightMarketEnabled) {
      setActiveModal(null);
    }

    if (activeModal === 'commonMarket' && !isCommonMarketEnabled) {
      setActiveModal(null);
    }
  }, [activeModal, isCommonMarketEnabled, isNightMarketEnabled]);

  useEffect(() => {
    if (!numericSessionId) return;

    const connection = getChatHubConnection();

    function isCurrentCharacter(idPersonagem: number) {
      const currentCharacterId = signalRHandlersRef.current.characterId;

      if (!currentCharacterId) return false;
      return Number(idPersonagem) === Number(currentCharacterId);
    }

    function isCurrentSession(sessao: unknown) {
      const eventSessionId = getSessionEventNumber(sessao);

      if (!Number.isFinite(eventSessionId)) {
        console.info('[SignalR] Evento sem id de sessao numerico, aceitando no lobby atual.', { sessao, numericSessionId });

        return true;
      }

      return eventSessionId === Number(numericSessionId);
    }

    function handleAtualizaFicha(idPersonagem: number) {
      if (!isCurrentCharacter(idPersonagem)) return;

      void signalRHandlersRef.current.refreshDashboard({ silent: true });
    }

    function handleAtualizaPericia(idPersonagem: number) {
      if (!isCurrentCharacter(idPersonagem)) return;

      void signalRHandlersRef.current.refreshCurrentSkills();
      void signalRHandlersRef.current.refreshDashboard({ silent: true });
    }

    function handleAtualizaAtributos(idPersonagem: number) {
      if (!isCurrentCharacter(idPersonagem)) return;

      void signalRHandlersRef.current.refreshCurrentAttributes();
      void signalRHandlersRef.current.refreshDashboard({ silent: true });
    }

    function handleAtualizaInventario(idPersonagem: number) {
      if (!isCurrentCharacter(idPersonagem)) return;

      void signalRHandlersRef.current.refreshCurrentInventory();
    }

    function handleLigarLojaNoturna(sessao: number) {
      if (!isCurrentSession(sessao)) return;

      void signalRHandlersRef.current.refreshSession();
    }

    function handleDesligarLojaNoturna(sessao: number) {
      if (!isCurrentSession(sessao)) return;

      setNightMarket([]);
      setActiveModal((current) => (current === 'nightMarket' ? null : current));
      void signalRHandlersRef.current.refreshSession();
    }

    function handleAtualizarLojaNoturna(sessao: number) {
      if (!isCurrentSession(sessao)) return;

      void signalRHandlersRef.current.refreshSession();
      void signalRHandlersRef.current.refreshNightMarket();
    }

    function handleLigarLojaComun(sessao: number) {
      if (!isCurrentSession(sessao)) return;

      void signalRHandlersRef.current.refreshSession();
    }

    function handleDesligarLojaComun(sessao: number) {
      if (!isCurrentSession(sessao)) return;

      setCommonMarket([]);
      setActiveModal((current) => (current === 'commonMarket' ? null : current));
      void signalRHandlersRef.current.refreshSession();
    }

    function handleAtualizarLojaComun(sessao: number) {
      if (!isCurrentSession(sessao)) return;

      void signalRHandlersRef.current.refreshSession();
      void signalRHandlersRef.current.refreshCommonMarket();
    }

    function handleNovaMensagem(sessao: unknown, dataHora: string, nomePersonagem?: string, mensagem?: string) {
      const hasTimestampPayload = mensagem !== undefined;
      const eventTimestamp = hasTimestampPayload ? dataHora : new Date().toISOString();
      const eventCharacterName = hasTimestampPayload ? nomePersonagem ?? 'Sistema' : dataHora;
      const eventMessage = hasTimestampPayload ? mensagem ?? '' : nomePersonagem ?? '';

      console.log('[SignalR] NovaMensagem recebida na pagina', {
        sessao,
        dataHora: eventTimestamp,
        nomePersonagem: eventCharacterName,
        mensagem: eventMessage,
        numericSessionId,
      });

      if (!isCurrentSession(sessao)) {
        console.info('[SignalR] NovaMensagem ignorada por sessao diferente', { sessao, numericSessionId });

        return;
      }

      const eventKey = `${String(sessao)}|${eventTimestamp}|${eventCharacterName}|${eventMessage}`;

      if (lastChatEventKeyRef.current === eventKey) {
        return;
      }

      lastChatEventKeyRef.current = eventKey;

      setChatMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-${current.length}`,
          timestamp: eventTimestamp,
          characterName: eventCharacterName,
          message: eventMessage,
        },
      ]);
    }

    connection.on('AtualizaFicha', handleAtualizaFicha);
    connection.on('AtualizaPericia', handleAtualizaPericia);
    connection.on('AtualizaAtributos', handleAtualizaAtributos);
    connection.on('AtualizaInventario', handleAtualizaInventario);
    connection.on('LigarLojaNoturna', handleLigarLojaNoturna);
    connection.on('DesligarLojaNoturna', handleDesligarLojaNoturna);
    connection.on('AtualizarLojaNoturna', handleAtualizarLojaNoturna);
    connection.on('LigarLojaComun', handleLigarLojaComun);
    connection.on('DesligarLojaComun', handleDesligarLojaComun);
    connection.on('AtualizarLojaComun', handleAtualizarLojaComun);
    connection.on('NovaMensagem', handleNovaMensagem);

    void ensureChatHubConnected()
      .then(() => {
        console.info('[SignalR] Conectado ao /chathub', { connectionId: connection.connectionId, numericSessionId });
      })
      .catch((error) => {
        if (String(error?.message ?? error).includes('stopped during negotiation')) {
          console.info('[SignalR] Negociacao cancelada porque a conexao anterior foi desmontada.', { numericSessionId });
          return;
        }

        console.error('[SignalR] Falha ao conectar /chathub', error);
      });

    return () => {
      connection.off('AtualizaFicha', handleAtualizaFicha);
      connection.off('AtualizaPericia', handleAtualizaPericia);
      connection.off('AtualizaAtributos', handleAtualizaAtributos);
      connection.off('AtualizaInventario', handleAtualizaInventario);
      connection.off('LigarLojaNoturna', handleLigarLojaNoturna);
      connection.off('DesligarLojaNoturna', handleDesligarLojaNoturna);
      connection.off('AtualizarLojaNoturna', handleAtualizarLojaNoturna);
      connection.off('LigarLojaComun', handleLigarLojaComun);
      connection.off('DesligarLojaComun', handleDesligarLojaComun);
      connection.off('AtualizarLojaComun', handleAtualizarLojaComun);
      connection.off('NovaMensagem', handleNovaMensagem);
    };
  }, [
    numericSessionId,
  ]);

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
            <div className={`session-dashboard-grid ${briefingCollapsed ? 'session-dashboard-grid-briefing-collapsed' : 'session-dashboard-grid-briefing-expanded'}`}>
              <div className="session-content-stack">
                <Card className="session-transparent-card session-info-card" style={{ marginTop: 0 }}>
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

                    <div className={`session-info-body ${briefingCollapsed ? 'session-info-body-briefing-collapsed' : 'session-info-body-briefing-expanded'}`}>
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
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className={`session-transparent-card session-chat-log-panel ${chatLogPanelCollapsed ? 'session-chat-log-panel-collapsed' : 'session-chat-log-panel-expanded'}`} style={{ marginTop: 0 }}>
                  <div className="session-chat-log-header">
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
                  <div className="session-chat-log-stream" aria-live="polite" ref={chatStreamRef}>
                    {chatMessages.length === 0 ? (
                      <p>Nenhuma transmissao registrada.</p>
                    ) : (
                      chatMessages.map((chatMessage) => (
                        <article className="session-chat-message" key={chatMessage.id}>
                          <p>
                            <time>[{formatChatTimestamp(chatMessage.timestamp)}]</time>
                            <strong>{chatMessage.characterName}:</strong>
                            <span>{chatMessage.message}</span>
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                  <form className="session-chat-composer" onSubmit={sendChatMessage}>
                    <label htmlFor="session-chat-message">Mensagem</label>
                    <div className="session-chat-input-row">
                      <textarea
                        id="session-chat-message"
                        value={chatDraft}
                        placeholder="O que você está sentindo tchum?"
                        rows={2}
                        onChange={(event) => setChatDraft(event.target.value)}
                      />
                      <div className="session-chat-tools" aria-label="Anexos e midia">
                        <Button type="submit" className="session-chat-send-button" aria-label="Enviar mensagem" title="Enviar" disabled={!chatDraft.trim()}>
                          Enviar
                        </Button>
                      </div>
                    </div>
                  </form>
                  </div>
                </Card>
              </div>

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
                                {stat.maximum !== null ? <small> / {formatCriticalValue(stat.maximum)}</small> : null}
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
                  </div>
                </Card>
              </div>
            </div>

            {character ? (
              <div className="session-actions">
                {isNightMarketEnabled ? (
                  <Button type="button" className="session-night-market-button" aria-label="Loja Noturna" title="Loja Noturna" onClick={() => setActiveModal('nightMarket')}>
                    <span className="session-night-market-button-kicker">Sinal clandestino</span>
                    <strong>Loja Noturna</strong>
                  </Button>
                ) : null}
                {isCommonMarketEnabled ? (
                  <Button type="button" className="session-common-market-button" aria-label="Equipamentos iniciais" title="Equipamentos iniciais" onClick={() => setActiveModal('commonMarket')}>
                    <span className="session-night-market-button-kicker">Sinal clandestino</span>
                    <strong>Comprar Equipamentos</strong>
                  </Button>
                ) : null}
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
              Sair da sessão
            </Button>
          </Link>
        </div>

        {character && activeModal ? (
          <Modal maxWidth={activeModal === 'skills' ? 960 : activeModal === 'attributes' ? 720 : activeModal === 'nightMarket' || activeModal === 'commonMarket' ? 1080 : 900}>
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
                  allowBriefingUpdate
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
                selectedInventoryItem ? (
                  <InventoryItemDetails
                    asset={selectedInventoryItem}
                    character={character}
                    sessionId={numericSessionId}
                    onBack={() => setSelectedInventoryItem(null)}
                    onTransferred={() => void refreshCurrentInventory()}
                  />
                ) : (
                  <InventoryGallery assets={inventory} loading={inventoryLoading} onSelect={setSelectedInventoryItem} />
                )
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
              {activeModal === 'nightMarket' ? (
                <div className="night-market-modal">
                  <div className="night-market-header">
                    <div>
                      <span>Transmissao ilegal ativa</span>
                      <h2 className="cy-title">Loja Noturna</h2>
                    </div>
                    <div className="market-wallet">
                      <strong>{formatNightMarketPrice(characterCredits)}</strong>
                      <span>{filteredNightMarket.length} itens</span>
                    </div>
                  </div>
                  <div className="common-market-content">
                    {marketPurchaseMessage ? (
                      <p className={`market-purchase-message ${marketPurchaseError ? 'market-purchase-message-error' : 'market-purchase-message-success'}`}>
                        {marketPurchaseMessage}
                      </p>
                    ) : null}
                    <div className="common-market-filter">
                      <Input
                        type="search"
                        value={nightMarketFilter}
                        placeholder="Filtrar item por nome, tipo, preco ou detalhe"
                        aria-label="Filtrar item da loja noturna"
                        onChange={(event) => setNightMarketFilter(event.target.value)}
                      />
                    </div>
                    {filteredNightMarket.length === 0 ? (
                      <p className="cy-subtitle">Nenhum item encontrado.</p>
                    ) : (
                      <div className="common-market-category-stack">
                        {marketCategories.map((category) => {
                          const items = getItemsByCategory(filteredNightMarket, category);
                          const collapsed = nightMarketCollapsedCategories[category];

                          if (items.length === 0) return null;

                          return (
                            <section className="common-market-category" key={category}>
                              <button
                                type="button"
                                className="common-market-category-header"
                                aria-expanded={!collapsed}
                                onClick={() => toggleNightMarketCategory(category)}
                              >
                                <span className={`common-market-category-chevron ${collapsed ? '' : 'common-market-category-chevron-open'}`} aria-hidden="true" />
                                <h3>{category}</h3>
                                <span>{items.length} itens</span>
                              </button>
                              {!collapsed ? (
                                items.length > 0 ? (
                                  renderMarketCategoryItems(items, category, 'night')
                                ) : (
                                  <p className="cy-subtitle">Nenhum item nesta categoria para o filtro atual.</p>
                                )
                              ) : null}
                            </section>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
              {activeModal === 'commonMarket' ? (
                <div className="night-market-modal">
                  <div className="night-market-header">
                    <div>
                      <span>Catalogo de campanha</span>
                      <h2 className="cy-title">Equipamentos iniciais</h2>
                    </div>
                    <div className="market-wallet">
                      <strong>{formatNightMarketPrice(characterCredits)}</strong>
                      <span>{filteredCommonMarket.length} itens</span>
                    </div>
                  </div>
                  {commonMarketLoading ? (
                    <p className="cy-subtitle">Carregando equipamentos...</p>
                  ) : commonMarketError ? (
                    <p className="cy-subtitle">Nao foi possivel carregar a loja comum.</p>
                  ) : commonMarket.length === 0 ? (
                    <p className="cy-subtitle">Nenhum equipamento disponivel.</p>
                  ) : (
                    <div className="common-market-content">
                      {marketPurchaseMessage ? (
                        <p className={`market-purchase-message ${marketPurchaseError ? 'market-purchase-message-error' : 'market-purchase-message-success'}`}>
                          {marketPurchaseMessage}
                        </p>
                      ) : null}
                      <div className="common-market-filter">
                        <Input
                          type="search"
                          value={commonMarketFilter}
                          placeholder="Filtrar item por nome, tipo, preco ou detalhe"
                          aria-label="Filtrar item"
                          onChange={(event) => setCommonMarketFilter(event.target.value)}
                        />
                      </div>
                      {filteredCommonMarket.length === 0 ? (
                        <p className="cy-subtitle">Nenhum item encontrado.</p>
                      ) : (
                        <div className="common-market-category-stack">
                          {marketCategories.map((category) => {
                            const items = getItemsByCategory(filteredCommonMarket, category);
                            const collapsed = commonMarketCollapsedCategories[category];

                            if (items.length === 0) return null;

                            return (
                              <section className="common-market-category" key={category}>
                                <button
                                  type="button"
                                  className="common-market-category-header"
                                  aria-expanded={!collapsed}
                                  onClick={() => toggleCommonMarketCategory(category)}
                                >
                                  <span className={`common-market-category-chevron ${collapsed ? '' : 'common-market-category-chevron-open'}`} aria-hidden="true" />
                                  <h3>{category}</h3>
                                  <span>{items.length} itens</span>
                                </button>
                                {!collapsed ? (
                                  items.length > 0 ? (
                                    renderMarketCategoryItems(items, category, 'common')
                                  ) : (
                                    <p className="cy-subtitle">Nenhum item nesta categoria para o filtro atual.</p>
                                  )
                                ) : null}
                              </section>
                            );
                          })}
                        </div>
                      )}
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
