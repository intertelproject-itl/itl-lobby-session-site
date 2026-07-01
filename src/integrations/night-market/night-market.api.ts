import { apiClient } from '../http/apiClient';
import '../http/authInterceptor';
import {
  NightMarketArmor,
  NightMarketCategory,
  NightMarketCyberware,
  NightMarketCyberWeapon,
  NightMarketDisplayItem,
  NightMarketResponse,
  NightMarketWeapon,
  BuyMarketItemPayload,
} from './night-market.types';

function hasValue(value: unknown) {
  return value !== null && value !== undefined && value !== '';
}

function toSpec(label: string, value: unknown) {
  return hasValue(value) ? { label, value: String(value) } : null;
}

function compactSpecs(specs: Array<ReturnType<typeof toSpec>>) {
  return specs.filter((spec): spec is { label: string; value: string } => Boolean(spec));
}

function mapWeaponSpecs(item: NightMarketWeapon) {
  return compactSpecs([
    toSpec('Dano', item.dano),
    toSpec('Pericia', item.pericia),
    toSpec('Grupo', item.grupo),
    toSpec('DV 0-6m', item.dv0_6m),
    toSpec('DV 7-12m', item.dv7_12m),
    toSpec('DV 13-25m', item.dv13_25m),
    toSpec('DV 26-50m', item.dv26_50m),
    toSpec('DV 51-100m', item.dv51_100m),
    toSpec('DV 101-200m', item.dv101_200m),
  ]);
}

function mapArmorSpecs(item: NightMarketArmor) {
  return compactSpecs([
    toSpec('PA', item.pa),
    toSpec('Penalidade', item.penalidade),
    toSpec('Cobertura', item.cobertura),
  ]);
}

function mapCyberWeaponSpecs(item: NightMarketCyberWeapon) {
  return compactSpecs([
    ...mapWeaponSpecs(item).map((spec) => toSpec(spec.label, spec.value)),
    toSpec('Instalacao', item.instalacao),
    toSpec('Humanidade', item.custoHumanidade),
  ]);
}

function mapCyberwareSpecs(item: NightMarketCyberware) {
  return compactSpecs([
    toSpec('Categoria', item.categoria),
    toSpec('Slot', item.slot),
    toSpec('Pericia', item.pericia),
    toSpec('Humanidade', item.custoHumanidade),
  ]);
}

function mapItems<T extends { id?: string | null; nome?: string | null }>(
  items: T[] | null | undefined,
  category: NightMarketCategory,
  mapSpecs: (item: T) => NightMarketDisplayItem['specs']
) {
  return (items ?? []).map<NightMarketDisplayItem>((item, index) => ({
    ...item,
    displayId: `${category}-${item.id ?? item.nome ?? index}`,
    category,
    nome: item.nome ?? 'Item sem nome',
    specs: mapSpecs(item),
  }));
}

export function flattenNightMarket(data: NightMarketResponse | null | undefined) {
  if (!data) return [];

  return [
    ...mapItems(data.armas, 'Armas', mapWeaponSpecs),
    ...mapItems(data.armaduras, 'Armaduras', mapArmorSpecs),
    ...mapItems(data.armasCiberneticas, 'Armas Ciberneticas', mapCyberWeaponSpecs),
    ...mapItems(data.ciberneticas, 'Ciberneticas', mapCyberwareSpecs),
  ];
}

export async function getNightMarket(): Promise<NightMarketDisplayItem[]> {
  const { data } = await apiClient.get<NightMarketResponse | null>('/LojaNoturna/obterLojaNoturna');

  return flattenNightMarket(data);
}

export async function getCommonMarket(): Promise<NightMarketDisplayItem[]> {
  const { data } = await apiClient.get<NightMarketResponse | null>('/LojaNoturna/obterLojaComun');

  return flattenNightMarket(data);
}

export async function buyNightMarketItem(payload: BuyMarketItemPayload): Promise<void> {
  await apiClient.post('/LojaNoturna/comprarLojaNoturna', payload);
}

export async function buyCommonMarketItem(payload: BuyMarketItemPayload): Promise<void> {
  await apiClient.post('/LojaNoturna/comprarItemComum', payload);
}
