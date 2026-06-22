export type WenmoConfig = {
  brightnessSchool: 'default' | 'QS' | 'XD1' | 'ZZ' | 'XD2';
  gengYearSihua: 'GYWYT' | 'GYWTY' | 'GYWFT' | 'GYWFX' | 'GYWTX';
  tianmaSchool: 'year-branch' | 'month-branch';
  tiankongSchool: 'normal' | 'shun-jia-shi';
  jiekongSchool: 'double' | 'single' | 'zhanyan';
  kuiyueSchool: 'qs1' | 'qs2' | 'zhong-yiming' | 'network';
  tianshiTianshang: 'normal' | 'zhongzhou';
  changshengSchool: 'yin-yang-shun-ni' | 'shui-tu' | 'huo-tu';
  lateZishi: 'next-day' | 'current-day' | 'all-current' | 'day-cur-time-next';
  leapMonth: 'prev-month' | 'split' | 'next-month' | 'origin-month';
};

export const DEFAULT_WENMO_CONFIG: WenmoConfig = {
  brightnessSchool: 'default',
  gengYearSihua: 'GYWYT',
  tianmaSchool: 'year-branch',
  tiankongSchool: 'normal',
  jiekongSchool: 'double',
  kuiyueSchool: 'qs1',
  tianshiTianshang: 'normal',
  changshengSchool: 'yin-yang-shun-ni',
  lateZishi: 'next-day',
  leapMonth: 'prev-month',
};

export const WENMO_STORAGE_KEY = 'ziwei-wenmo-config-v1';

const QUERY_KEYS: Record<keyof WenmoConfig, string> = {
  brightnessSchool: 'bs',
  gengYearSihua: 'gys',
  tianmaSchool: 'tm',
  tiankongSchool: 'tk',
  jiekongSchool: 'jk',
  kuiyueSchool: 'ky',
  tianshiTianshang: 'tst',
  changshengSchool: 'cs',
  lateZishi: 'lz',
  leapMonth: 'lm',
};

export const WENMO_GROUP_LABELS: Record<keyof WenmoConfig, string> = {
  brightnessSchool: '14 主星亮度表',
  gengYearSihua: '庚年四化',
  tianmaSchool: '安天马',
  tiankongSchool: '安天空',
  jiekongSchool: '安截空旬空',
  kuiyueSchool: '安魁钺',
  tianshiTianshang: '安天使天伤',
  changshengSchool: '长生十二神',
  lateZishi: '晚子时',
  leapMonth: '闰月归属',
};

export const WENMO_GROUP_OPTIONS: {
  [K in keyof WenmoConfig]: { value: WenmoConfig[K]; label: string; desc?: string }[];
} = {
  brightnessSchool: [
    { value: 'default', label: '混合亮度表', desc: '默认 · 全书 + 文墨安星码 8GDPB 交叉验证' },
    { value: 'QS', label: '《斗数全书》派', desc: '古籍原始记载' },
    { value: 'XD1', label: '现代修正 v1', desc: '文墨口径' },
    { value: 'ZZ', label: '中州派', desc: '中州派理论' },
    { value: 'XD2', label: '现代修正 v2', desc: '另一种现代修正' },
  ],
  gengYearSihua: [
    { value: 'GYWYT', label: '阳武阴同', desc: '默认 · 与 iztro / 主流一致' },
    { value: 'GYWTY', label: '阳武同阴', desc: '科忌互换说' },
    { value: 'GYWFT', label: '阳武府同' },
    { value: 'GYWFX', label: '阳武府相' },
    { value: 'GYWTX', label: '阳武同相' },
  ],
  tianmaSchool: [
    { value: 'year-branch', label: '依据年支', desc: '默认 · 年支起天马' },
    { value: 'month-branch', label: '依据月支' },
  ],
  tiankongSchool: [
    { value: 'normal', label: '常规排法', desc: '默认 · 常规起天空' },
    { value: 'shun-jia-shi', label: '顺加生时' },
  ],
  jiekongSchool: [
    { value: 'double', label: '正副双星', desc: '默认 · 正副双星并用' },
    { value: 'single', label: '常规单星' },
    { value: 'zhanyan', label: '占验派' },
  ],
  kuiyueSchool: [
    { value: 'qs1', label: '《斗数全书》理解 1', desc: '默认 · 全书歌诀理解一' },
    { value: 'qs2', label: '《斗数全书》理解 2', desc: '差异仅在庚辛壬癸年生人' },
    { value: 'zhong-yiming', label: '钟义明先生书籍排法' },
    { value: 'network', label: '网络流传排法' },
  ],
  tianshiTianshang: [
    { value: 'normal', label: '常规排法', desc: '默认 · 身宫 ±5 位' },
    { value: 'zhongzhou', label: '中州派排法', desc: '生月奇偶 × 性别 交换' },
  ],
  changshengSchool: [
    { value: 'yin-yang-shun-ni', label: '区分阴阳顺逆', desc: '默认 · 阴阳顺逆起长生' },
    { value: 'shui-tu', label: '水土共长生', desc: '土五局起点 = 水二局起点 (申)' },
    { value: 'huo-tu', label: '火土共长生', desc: '土五局起点 = 火六局起点 (寅)' },
  ],
  lateZishi: [
    { value: 'next-day', label: '视为次日', desc: '默认 · 文墨 + 主流' },
    { value: 'current-day', label: '视为当日', desc: '倪师派' },
    { value: 'all-current', label: '日柱当日 / 时柱当日（八字）' },
    { value: 'day-cur-time-next', label: '日柱当日 / 时柱次日（八字）' },
  ],
  leapMonth: [
    { value: 'prev-month', label: '视为本月', desc: '默认 · 对齐文墨（闰四月当四月普通月排，2.6 万盘穷举验证）' },
    { value: 'split', label: '视为分半', desc: 'iztro 分半口径（前 15 天归上月 / 后 15 天归下月）' },
    { value: 'next-month', label: '视为下月', desc: '倪师派（闰四月整月当五月排）' },
    { value: 'origin-month', label: '保持闰月', desc: '不调整，闰四月仍标闰月' },
  ],
};

function isConfigKey(key: string): key is keyof WenmoConfig {
  return key in DEFAULT_WENMO_CONFIG;
}

export function normalizeWenmoConfig(value: unknown): WenmoConfig {
  const next = { ...DEFAULT_WENMO_CONFIG };
  if (!value || typeof value !== 'object') return next;
  for (const [key, raw] of Object.entries(value)) {
    if (!isConfigKey(key)) continue;
    if (typeof raw === 'string' && raw) {
      (next as Record<string, string>)[key] = raw;
    }
  }
  return next;
}

export function wenmoConfigToSearchParams(config: WenmoConfig): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const key of Object.keys(DEFAULT_WENMO_CONFIG) as (keyof WenmoConfig)[]) {
    if (config[key] !== DEFAULT_WENMO_CONFIG[key]) {
      entries[QUERY_KEYS[key]] = config[key];
    }
  }
  return entries;
}

export function searchParamsToWenmoConfig(params: URLSearchParams): WenmoConfig {
  const value = { ...DEFAULT_WENMO_CONFIG };
  for (const key of Object.keys(DEFAULT_WENMO_CONFIG) as (keyof WenmoConfig)[]) {
    const raw = params.get(QUERY_KEYS[key]);
    if (raw) {
      (value as Record<string, string>)[key] = raw;
    }
  }
  return normalizeWenmoConfig(value);
}

export function loadStoredWenmoConfig(): WenmoConfig {
  if (typeof window === 'undefined') return DEFAULT_WENMO_CONFIG;
  try {
    return normalizeWenmoConfig(JSON.parse(localStorage.getItem(WENMO_STORAGE_KEY) || 'null'));
  } catch {
    return DEFAULT_WENMO_CONFIG;
  }
}

export function saveStoredWenmoConfig(config: WenmoConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WENMO_STORAGE_KEY, JSON.stringify(config));
  } catch {}
}
