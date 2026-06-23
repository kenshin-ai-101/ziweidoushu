'use client';

import { useEffect, useState } from 'react';
import RightDrawer from '@/components/RightDrawer';
import {
  DEFAULT_WENMO_CONFIG,
  WENMO_GROUP_LABELS,
  WENMO_GROUP_OPTIONS,
  clearStoredWenmoConfig,
  loadStoredWenmoConfig,
  saveStoredWenmoConfig,
  type WenmoConfig,
} from '@/lib/ziwei/school-config';

interface WenmoSchoolDrawerProps {
  open: boolean;
  onClose: () => void;
  onChange?: (config: WenmoConfig) => void;
}

export default function WenmoSchoolDrawer({ open, onClose, onChange }: WenmoSchoolDrawerProps) {
  const [config, setConfig] = useState<WenmoConfig>(DEFAULT_WENMO_CONFIG);

  useEffect(() => {
    if (!open) return;
    setConfig(loadStoredWenmoConfig());
  }, [open]);

  const update = (key: keyof WenmoConfig, value: string) => {
    const next = { ...config, [key]: value } as WenmoConfig;
    setConfig(next);
    saveStoredWenmoConfig(next);
    onChange?.(next);
  };

  const reset = () => {
    clearStoredWenmoConfig();
    setConfig(DEFAULT_WENMO_CONFIG);
    onChange?.(DEFAULT_WENMO_CONFIG);
  };

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title="✦ 排盘流派切换"
      subtitle="默认对齐文墨流派 · 已 20 例验证一致"
      width={440}
      footerClassName="chart-school-footer"
      footer={(
        <>
          <button type="button" className="chart-school-footer-reset" onClick={reset}>
            ↺ 重置为默认
          </button>
          <button type="button" className="chart-school-footer-done" onClick={onClose}>
            完成
          </button>
        </>
      )}
    >
      <div className="chart-school-body">
        {(Object.keys(WENMO_GROUP_OPTIONS) as (keyof WenmoConfig)[]).map(key => (
          <fieldset key={key}>
            <legend>{WENMO_GROUP_LABELS[key]}</legend>
            <div className="chart-school-options">
              {WENMO_GROUP_OPTIONS[key].map(option => (
                <label key={option.value} className={config[key] === option.value ? 'active' : ''}>
                  <input
                    type="radio"
                    name={key}
                    checked={config[key] === option.value}
                    onChange={() => update(key, option.value)}
                  />
                  <span>
                    {option.label}
                    {option.desc && <small>{option.desc}</small>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </RightDrawer>
  );
}
