export type WenmoConfig = {
  brightnessSchool: 'zhongzhou' | 'wenmo';
  gengYearSihua: 'tiantong-ji' | 'tianxiang-ji';
  tianmaSchool: 'default' | 'annual';
  tiankongSchool: 'default' | 'none';
  jiekongSchool: 'default' | 'xunkong';
  kuiyueSchool: 'default' | 'birth-year';
  tianshiTianshang: 'default' | 'disabled';
  changshengSchool: 'default' | 'gender-yinyang';
  lateZishi: 'next-day' | 'same-day';
  leapMonth: 'prev-month' | 'split' | 'next-month' | 'origin-month';
};

export const DEFAULT_WENMO_CONFIG: WenmoConfig = {
  brightnessSchool: 'zhongzhou',
  gengYearSihua: 'tiantong-ji',
  tianmaSchool: 'default',
  tiankongSchool: 'default',
  jiekongSchool: 'default',
  kuiyueSchool: 'default',
  tianshiTianshang: 'default',
  changshengSchool: 'default',
  lateZishi: 'next-day',
  leapMonth: 'prev-month',
};

export const WENMO_STORAGE_KEY = 'ziwei_wenmo_config_v1';

const QUERY_KEYS: Record<keyof WenmoConfig, string> = {
  brightnessSchool: 'bs',
  gengYearSihua: 'gs',
  tianmaSchool: 'tm',
  tiankongSchool: 'tk',
  jiekongSchool: 'jk',
  kuiyueSchool: 'ky',
  tianshiTianshang: 'ts',
  changshengSchool: 'cs',
  lateZishi: 'lz',
  leapMonth: 'lm',
};

function isConfigKey(key: string): key is keyof WenmoConfig {
  return key in DEFAULT_WENMO_CONFIG;
}

export function normalizeWenmoConfig(value: unknown): WenmoConfig {
  const next = { ...DEFAULT_WENMO_CONFIG };
  if (!value || typeof value !== 'object') return next;
  for (const [key, raw] of Object.entries(value)) {
    if (!isConfigKey(key)) continue;
    const defaultValue = DEFAULT_WENMO_CONFIG[key];
    if (typeof raw === 'string') {
      (next as Record<string, string>)[key] = raw || defaultValue;
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
