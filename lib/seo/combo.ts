import { COMBO_REGISTRY } from './combo-data.generated';
import type { ComboEntry } from './combo-data.generated';

export const COMBO_TOPIC_META = {
  mingGong: { palace: '命宫', label: '命宫总览' },
  fuQi: { palace: '夫妻宫', label: '夫妻感情' },
  guanLu: { palace: '官禄宫', label: '事业职业' },
  caiBo: { palace: '财帛宫', label: '财富运势' },
} as const;

export const COMBO_TOPIC_ORDER = ['mingGong', 'fuQi', 'guanLu', 'caiBo'] as const;

export function getComboBySlug(slug: string): ComboEntry | null {
  return COMBO_REGISTRY.find(c => c.slug === slug) ?? null;
}

export function getOtherCombos(slug: string): ComboEntry[] {
  return COMBO_REGISTRY.filter(c => c.slug !== slug);
}

export { COMBO_REGISTRY };
