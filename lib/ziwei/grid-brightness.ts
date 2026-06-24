import type { Palace, Star } from './types';
import type { WenmoConfig } from './school-config';
import { lookupMajorBrightness } from './wenmo/brightness';
import { GRID_AUX_BRIGHTNESS, GRID_MAJOR_BRIGHTNESS } from './grid-brightness-tables.generated';

/** 地支索引（子=0）→ 寅起宫位索引（寅=0），iztro 亮度表使用 */
export function branchToYinIndex(branch: number): number {
  return (branch - 2 + 12) % 12;
}

/**
 * iztro 默认十四辅星亮度（寅起索引）。
 * 当生产采样表无覆盖时，作为通用回退。
 */
const IZTRO_MINOR_BRIGHTNESS: Record<string, string[]> = {
  文昌: ['陷', '利', '得', '庙', '陷', '利', '得', '庙', '陷', '利', '得', '庙'],
  文曲: ['平', '旺', '得', '庙', '陷', '旺', '得', '庙', '陷', '旺', '得', '庙'],
  左辅: ['庙', '旺', '陷', '闲', '庙', '旺', '陷', '闲', '庙', '旺', '陷', '闲'],
  右弼: ['旺', '陷', '闲', '庙', '旺', '陷', '闲', '庙', '旺', '陷', '闲', '庙'],
  天魁: ['旺', '庙', '庙', '旺', '旺', '庙', '庙', '旺', '旺', '庙', '庙', '旺'],
  天钺: ['庙', '旺', '旺', '庙', '庙', '旺', '旺', '庙', '庙', '旺', '旺', '庙'],
  禄存: ['庙', '旺', '庙', '旺', '庙', '旺', '庙', '旺', '庙', '旺', '庙', '旺'],
  天马: ['旺', '陷', '旺', '陷', '旺', '陷', '旺', '陷', '旺', '陷', '旺', '陷'],
  地空: ['陷', '庙', '陷', '庙', '陷', '庙', '陷', '庙', '陷', '庙', '陷', '庙'],
  地劫: ['庙', '陷', '庙', '陷', '庙', '陷', '庙', '陷', '庙', '陷', '庙', '陷'],
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

/**
 * 网格辅星/杂耀亮度（通用规则，非单命盘补丁）：
 * 1. 生产环境采样表（子起地支索引）
 * 2. iztro 十四辅星默认表（寅起索引）
 */
export function lookupGridAuxBrightness(starName: string, branch: number): string | undefined {
  const gridLabel = GRID_AUX_BRIGHTNESS[starName]?.[branch];
  if (gridLabel) return gridLabel;

  const yin = branchToYinIndex(branch);
  const iztroLabel = IZTRO_MINOR_BRIGHTNESS[starName]?.[yin];
  return iztroLabel || undefined;
}

/** 生产子起表与 iztro HYBRID 寅起表冲突时，这三颗主星以 iztro 为准 */
const HYBRID_ON_MAJOR_CONFLICT = new Set(['破军', '廉贞', '贪狼']);

/**
 * 网格主星亮度（通用规则）：
 * 1. 生产完整主星表（子起地支）
 * 2. 与 iztro HYBRID 冲突时，破军/廉贞/贪狼取 HYBRID（寅起）
 * 3. 其余缺省回退 iztro HYBRID
 */
export function lookupGridMajorBrightness(
  school: WenmoConfig['brightnessSchool'],
  starName: string,
  branch: number,
): string | undefined {
  if (school !== 'default') {
    return lookupMajorBrightness(school, starName, branchToYinIndex(branch));
  }

  const yin = branchToYinIndex(branch);
  const gridLabel = GRID_MAJOR_BRIGHTNESS[starName]?.[branch];
  const hybridLabel = lookupMajorBrightness('default', starName, yin);

  if (gridLabel && hybridLabel && gridLabel !== hybridLabel) {
    return HYBRID_ON_MAJOR_CONFLICT.has(starName) ? hybridLabel : gridLabel;
  }
  return gridLabel ?? hybridLabel;
}

function applyBrightnessToStar(star: Star, label: string) {
  star.brightnessLabel = label;
  star.brightnessRaw = label;
  star.brightness = labelToBrightness(label);
}

/** 为命盘网格补齐亮度：主星/辅星均按星曜所在宫位地支查表 */
export function applyGridBrightness(
  palaces: Palace[],
  brightnessSchool: WenmoConfig['brightnessSchool'] = 'default',
) {
  for (const palace of palaces) {
    for (const star of palace.stars) {
      if (star.type === 'major') {
        const label = lookupGridMajorBrightness(brightnessSchool, star.name, palace.branch);
        if (label) applyBrightnessToStar(star, label);
        else if (star.brightnessLabel) star.brightnessRaw = star.brightnessLabel;
        continue;
      }
      const label = lookupGridAuxBrightness(star.name, palace.branch);
      if (label) applyBrightnessToStar(star, label);
      else if (star.brightnessLabel) star.brightnessRaw = star.brightnessLabel;
    }
  }
}
