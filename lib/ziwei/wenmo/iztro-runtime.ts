import { astro } from 'iztro';
import type { WenmoConfig } from '@/lib/ziwei/school-config';
import { buildBrightnessConfig } from '@/lib/ziwei/wenmo/brightness';
import { buildMutagenConfig } from '@/lib/ziwei/wenmo/mutagens';
import { resolveDayDivide } from '@/lib/ziwei/wenmo/params';

type IztroConfigSnapshot = ReturnType<typeof astro.getConfig>;
type IztroConfigInput = Parameters<typeof astro.config>[0];

export function buildIztroConfig(wenmo: WenmoConfig): IztroConfigInput {
  const config: IztroConfigInput = {
    dayDivide: resolveDayDivide(wenmo.lateZishi),
    mutagens: buildMutagenConfig(wenmo.gengYearSihua) as IztroConfigInput['mutagens'],
    algorithm: wenmo.tianshiTianshang === 'zhongzhou' ? 'zhongzhou' : 'default',
  };

  const brightness = buildBrightnessConfig(wenmo.brightnessSchool);
  if (brightness) config.brightness = brightness;

  return config;
}

function restoreIztroConfig(snapshot: IztroConfigSnapshot) {
  astro.config(snapshot as unknown as IztroConfigInput);
}

let queue: Promise<unknown> = Promise.resolve();

export function runWithIztroConfig<T>(wenmo: WenmoConfig, fn: () => T): Promise<T> {
  const next = queue.then(async () => {
    const snapshot = astro.getConfig();
    astro.config(buildIztroConfig(wenmo));
    try {
      return fn();
    } finally {
      restoreIztroConfig(snapshot);
    }
  });
  queue = next.catch(() => undefined);
  return next as Promise<T>;
}

export function runWithIztroConfigSync<T>(wenmo: WenmoConfig, fn: () => T): T {
  const snapshot = astro.getConfig();
  astro.config(buildIztroConfig(wenmo));
  try {
    return fn();
  } finally {
    restoreIztroConfig(snapshot);
  }
}
