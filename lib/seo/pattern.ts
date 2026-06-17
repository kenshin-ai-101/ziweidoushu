import { PATTERN_REGISTRY, type PatternEntry } from './pattern-data.generated';

export const PATTERN_GROUPS = [
  { key: 'excellent', label: '上格' },
  { key: 'good', label: '中格' },
  { key: 'support', label: '助力格' },
  { key: 'caution', label: '恶格' },
  { key: 'basic', label: '基础格局' },
] as const;

export type PatternGroupKey = (typeof PATTERN_GROUPS)[number]['key'];

export function getPatternBySlug(slug: string): PatternEntry | null {
  return PATTERN_REGISTRY.find(p => p.slug === slug) ?? null;
}

export function getPatternsInGroup(group: string, excludeSlug?: string): PatternEntry[] {
  return PATTERN_REGISTRY.filter(p => p.group === group && p.slug !== excludeSlug);
}

export function getFortuneLabel(meta: string): string {
  return meta.split(' · ')[0]?.trim() ?? meta;
}

export function getOtherPatternsInGroup(slug: string): PatternEntry[] {
  const current = getPatternBySlug(slug);
  if (!current) return [];
  return PATTERN_REGISTRY.filter(p => p.group === current.group && p.slug !== slug);
}

export function getRelatedGroupSections(current: PatternEntry) {
  const currentIdx = PATTERN_GROUPS.findIndex(g => g.key === current.group);
  const sections: { key: string; title: string; items: PatternEntry[] }[] = [];

  const ownGroup = getPatternsInGroup(current.group, current.slug);
  if (ownGroup.length) {
    sections.push({
      key: current.group,
      title: current.group === 'excellent' ? '其他上格' : current.groupLabel,
      items: ownGroup,
    });
  }

  for (let idx = 0; idx < PATTERN_GROUPS.length; idx++) {
    if (idx === currentIdx) continue;
    const group = PATTERN_GROUPS[idx];
    const items = PATTERN_REGISTRY.filter(p => p.group === group.key);
    if (items.length) {
      sections.push({ key: group.key, title: group.label, items });
    }
  }

  return sections;
}

export { PATTERN_REGISTRY };
