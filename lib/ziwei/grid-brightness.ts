import type { Palace, Star } from './types';

/** 地支索引（子=0）→ 寅起宫位索引（寅=0） */
export function branchToYinIndex(branch: number): number {
  return (branch - 2 + 12) % 12;
}

/** 辅星/煞星亮度：自生产 API 穷举采样（混合亮度表 default） */
export const GRID_AUX_BRIGHTNESS: Record<string, (string | undefined)[]> = {
  '三台': [undefined, '陷', '庙', '平', '旺', '庙', '旺', '庙', '旺', '平', '平', '庙'],
  '八座': ['庙', '平', '旺', '庙', '旺', '平', '庙', '庙', '平', '庙', undefined, '庙'],
  '凤阁': ['庙', '旺', '陷', '庙', '平', '陷', '闲', '庙', '庙', '旺', '庙', '平'],
  '华盖': [undefined, undefined, '庙', undefined, undefined, '陷', undefined, undefined, '平', undefined, undefined, '陷'],
  '右弼': [undefined, undefined, undefined, undefined, '旺', undefined, undefined, '旺', '庙', undefined, undefined, undefined],
  '咸池': [undefined, '平', undefined, undefined, '陷', undefined, undefined, '平', undefined, undefined, '陷', undefined],
  '地劫': [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, '旺', undefined, undefined],
  '地空': [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, '陷', undefined, undefined],
  '天伤': [undefined, undefined, undefined, undefined, undefined, '陷', '平', undefined, undefined, '旺', undefined, undefined],
  '天使': [undefined, undefined, undefined, undefined, undefined, undefined, undefined, '陷', '陷', undefined, undefined, '陷'],
  '天哭': ['平', '庙', '平', '闲', '陷', '平', '庙', '闲', '平', '平', '平', '庙'],
  '天官': ['平', '旺', '旺', '旺', '庙', '庙', undefined, '平', '平', '旺', undefined, undefined],
  '天寿': ['旺', '陷', '庙', '平', '平', undefined, '旺', '平', undefined, '旺', '平', '庙'],
  '天德': ['平', '平', '庙', '旺', '旺', '庙', '平', '闲', '庙', '平', '庙', '庙'],
  '天才': ['庙', '旺', '陷', '庙', '旺', undefined, '庙', '旺', undefined, '庙', '旺', '平'],
  '天福': ['旺', '平', undefined, '旺', '平', undefined, '庙', '庙', undefined, '庙', '平', undefined],
  '天空': ['陷', '平', '庙', '庙', '庙', '陷', '旺', '旺', '陷', '平', '陷', '平'],
  '天虚': ['旺', '庙', '陷', '旺', '平', '陷', '庙', '旺', '陷', '平', '陷', '庙'],
  '天贵': ['平', '旺', '旺', '平', '庙', '旺', '陷', '庙', '旺', '平', '庙', '旺'],
  '天钺': [undefined, undefined, undefined, '庙', '庙', '旺', '庙', '庙', undefined, undefined, undefined, undefined],
  '天马': ['旺', undefined, undefined, '平', undefined, undefined, '旺', undefined, undefined, '平', undefined, undefined],
  '天魁': ['庙', '庙', undefined, undefined, undefined, undefined, undefined, undefined, undefined, '庙', '庙', '旺'],
  '孤辰': ['平', undefined, undefined, '陷', undefined, undefined, '平', undefined, undefined, '陷', undefined, undefined],
  '寡宿': [undefined, undefined, '陷', undefined, undefined, '闲', undefined, undefined, '陷', undefined, undefined, '平'],
  '左辅': [undefined, undefined, '庙', '旺', undefined, undefined, '旺', undefined, undefined, undefined, undefined, undefined],
  '年解': ['庙', '庙', '庙', '旺', '庙', '平', '闲', '旺', '庙', '平', '庙', '平'],
  '恩光': ['平', '庙', '庙', '平', '庙', '旺', '平', '陷', '庙', '闲', '平', '庙'],
  '擎羊': [undefined, '陷', '庙', undefined, '陷', '庙', undefined, '陷', '庙', undefined, '陷', '庙'],
  '文昌': [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, '陷', undefined, undefined, undefined],
  '文曲': [undefined, undefined, '旺', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
  '月德': ['陷', '闲', '平', '陷', '旺', '平', '陷', '闲', '平', '陷', '旺', '平'],
  '火星': ['庙', '旺', undefined, undefined, undefined, undefined, undefined, '平', undefined, undefined, undefined, '平'],
  '破碎': [undefined, undefined, undefined, '陷', undefined, undefined, undefined, '平', undefined, undefined, undefined, '陷'],
  '禄存': ['庙', '旺', undefined, '庙', '旺', undefined, '庙', '旺', undefined, '庙', '旺', undefined],
  '红鸾': ['旺', '庙', '庙', '旺', '旺', '陷', '庙', '旺', '陷', '庙', '庙', '陷'],
  '铃星': [undefined, '旺', undefined, undefined, undefined, undefined, undefined, undefined, '庙', undefined, undefined, undefined],
  '陀罗': ['陷', undefined, '庙', '陷', undefined, '庙', '陷', undefined, '庙', '陷', undefined, '庙'],
  '龙池': ['平', '庙', '庙', '陷', '闲', '庙', '平', '庙', '陷', '旺', '旺', '平'],
};

const IZTRO_MINOR_LABELS: Record<string, string[]> = {
  文昌: ['陷', '利', '得', '庙', '陷', '利', '得', '庙', '陷', '利', '得', '庙'],
  文曲: ['平', '旺', '得', '庙', '陷', '旺', '得', '庙', '陷', '旺', '得', '庙'],
  火星: ['庙', '利', '陷', '得', '庙', '利', '陷', '得', '庙', '利', '陷', '得'],
  铃星: ['庙', '利', '陷', '得', '庙', '利', '陷', '得', '庙', '利', '陷', '得'],
  擎羊: ['', '陷', '庙', '', '陷', '庙', '', '陷', '庙', '', '陷', '庙'],
  陀罗: ['陷', '', '庙', '陷', '', '庙', '陷', '', '庙', '陷', '', '庙'],
};

function labelToBrightness(label: string): Star['brightness'] {
  if (label === '庙' || label === '旺') return 'bright';
  if (label === '陷' || label === '不') return 'dim';
  return 'normal';
}

export function lookupGridAuxBrightness(starName: string, branch: number): string | undefined {
  const yin = branchToYinIndex(branch);
  const row = GRID_AUX_BRIGHTNESS[starName] ?? IZTRO_MINOR_LABELS[starName];
  if (!row) return undefined;
  const label = row[yin];
  return label || undefined;
}

function applyBrightnessToStar(star: Star, label: string) {
  star.brightnessLabel = label;
  star.brightnessRaw = label;
  star.brightness = labelToBrightness(label);
}

/** 为命盘网格辅星/煞星补齐生产环境亮度（主星由 iztro 混合亮度表负责） */
export function applyGridBrightness(palaces: Palace[]) {
  for (const palace of palaces) {
    for (const star of palace.stars) {
      if (star.type === 'major') {
        if (star.brightnessLabel) {
          star.brightnessRaw = star.brightnessLabel;
        }
        continue;
      }
      const label = lookupGridAuxBrightness(star.name, palace.branch);
      if (label) applyBrightnessToStar(star, label);
    }
  }
}
