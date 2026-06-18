'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import BirthForm, { type BirthFormState } from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import ChartTopbar from '@/components/ChartTopbar';
import ChartTimeDrill from '@/components/ChartTimeDrill';
import InsightPanel from '@/components/InsightPanel';
import ShareModal from '@/components/ShareModal';
import FamousPersonCard from '@/components/FamousPersonCard';
import PatternsLink from '@/components/PatternsLink';
import { OracleChrome, OracleHero } from '@/components/OracleSubpage';
import { formToSearchParams, searchParamsToForm, formToBirthInfo } from '@/lib/ziwei/share';
import { useHistory } from '@/lib/ziwei/history';
import { findFamousPersonMatch } from '@/lib/ziwei/famous';
import {
  DEFAULT_WENMO_CONFIG,
  loadStoredWenmoConfig,
  saveStoredWenmoConfig,
  searchParamsToWenmoConfig,
  wenmoConfigToSearchParams,
  type WenmoConfig,
} from '@/lib/ziwei/school-config';
import type { BirthInfo, Palace, Star, ZiweiChart } from '@/lib/ziwei/types';
import type { TimeView } from '@/components/TimeNav';

interface SelectedSiHua {
  starName: string;
  siHua: string;
  view: TimeView;
}

function getCurrentShichenBranch(): number {
  const hour = new Date().getHours();
  if (hour === 23 || hour === 0) return 0;
  return Math.floor((hour + 1) / 2) % 12;
}

export function ChartOraclePage() {
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [savedForm, setSavedForm] = useState<BirthFormState | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [wenmoConfig, setWenmoConfig] = useState<WenmoConfig>(DEFAULT_WENMO_CONFIG);
  const latestFormRef = useRef<BirthFormState | null>(null);

  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [selectedSiHua, setSelectedSiHua] = useState<SelectedSiHua | null>(null);

  const [timeView, setTimeView] = useState<TimeView>('mingpan');
  const [liunianYear, setLiunianYear] = useState(new Date().getFullYear());
  const [liuyueMonth, setLiuyueMonth] = useState(new Date().getMonth() + 1);
  const [liuriDay, setLiuriDay] = useState(new Date().getDate());
  const [liushiHour, setLiushiHour] = useState(getCurrentShichenBranch);

  const { save: saveHistory, syncCloud } = useHistory();

  const buildChartUrl = useCallback((form: BirthFormState, config: WenmoConfig) => {
    const params = formToSearchParams(form);
    for (const [key, value] of Object.entries(wenmoConfigToSearchParams(config))) {
      params.set(key, value);
    }
    return `/chart?${params.toString()}`;
  }, []);

  const loadChart = useCallback(async (info: BirthInfo, sourceForm: BirthFormState | undefined, config: WenmoConfig) => {
    setGenerating(true);
    setGenerateError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...info,
          brightnessSchool: config.brightnessSchool,
          wenmoConfig: config,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || '命盘生成失败');
      }
      const data = await res.json() as ZiweiChart;
      setChart(data);
      setSelectedPalace(null);
      setSelectedSiHua(null);
      setTimeView('mingpan');
      setLiushiHour(getCurrentShichenBranch());
      if (sourceForm) {
        saveHistory(sourceForm);
        syncCloud(sourceForm);
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', buildChartUrl(sourceForm, config));
        }
      }
      if (typeof window !== 'undefined') {
        window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 60);
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : '生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  }, [buildChartUrl, saveHistory, syncCloud]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const config = params.toString() ? searchParamsToWenmoConfig(params) : loadStoredWenmoConfig();
    setWenmoConfig(config);
    saveStoredWenmoConfig(config);
    const formData = searchParamsToForm(params);
    if (!formData?.year) return;
    const fullForm: BirthFormState = {
      name: '', year: '', month: '', day: '',
      clockHour: '8', clockMinute: '0', unknownTime: false,
      province: '', city: '', longitude: 120, gender: 'male',
      calendarType: 'solar',
      ...formData,
    };
    latestFormRef.current = fullForm;
    setSavedForm(fullForm);
    void loadChart(formToBirthInfo(fullForm), fullForm, config);
  }, [loadChart]);

  const handleFormSave = (form: BirthFormState) => {
    latestFormRef.current = form;
    setSavedForm(form);
    if (form.year && form.month && form.day) {
      saveHistory(form);
      syncCloud(form);
      const params = formToSearchParams(form);
      if (typeof window !== 'undefined') {
        for (const [key, value] of Object.entries(wenmoConfigToSearchParams(wenmoConfig))) {
          params.set(key, value);
        }
        window.history.replaceState({}, '', `/chart?${params.toString()}`);
      }
    }
  };

  const handleSubmit = (info: BirthInfo) => {
    void loadChart(info, latestFormRef.current ?? savedForm ?? undefined, wenmoConfig);
  };

  const handleSchoolConfigChange = (config: WenmoConfig) => {
    setWenmoConfig(config);
    saveStoredWenmoConfig(config);
    if (typeof window !== 'undefined' && savedForm) {
      window.history.replaceState({}, '', buildChartUrl(savedForm, config));
    }
  };

  const handleSchoolConfigApply = (config: WenmoConfig) => {
    handleSchoolConfigChange(config);
    if (savedForm) {
      void loadChart(formToBirthInfo(savedForm), savedForm, config);
    }
  };

  const handleReset = () => {
    setChart(null);
    setSavedForm(null);
    setSelectedPalace(null);
    setSelectedSiHua(null);
    setGenerateError('');
    setGenerating(false);
    setFormKey(k => k + 1);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/chart');
    }
  };

  const shareUrl = savedForm && typeof window !== 'undefined'
    ? `${window.location.origin}${buildChartUrl(savedForm, wenmoConfig)}`
    : '';

  const famousPerson = useMemo(() => {
    if (!chart) return null;
    return findFamousPersonMatch({
      name: chart.birthInfo.name,
      year: chart.birthInfo.year,
      month: chart.birthInfo.month,
      day: chart.birthInfo.day,
    });
  }, [chart]);

  useEffect(() => {
    if (!chart) return;
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.style.background = '#fafafa';
    document.body.style.background = '#fafafa';
  }, [chart]);

  if (chart) {
    return (
      <div className="chart-page-root">
        <ChartTopbar
          chart={chart}
          view={timeView}
          liunianYear={liunianYear}
          liuyueMonth={liuyueMonth}
          liuriDay={liuriDay}
          liushiHour={liushiHour}
          onViewChange={v => {
            setTimeView(v);
            setSelectedPalace(null);
            setSelectedSiHua(null);
          }}
          onYearChange={setLiunianYear}
          onMonthChange={setLiuyueMonth}
          onDayChange={setLiuriDay}
          onHourChange={setLiushiHour}
          onBack={handleReset}
          onShare={savedForm ? () => setShareModalOpen(true) : undefined}
          schoolConfig={wenmoConfig}
          onSchoolConfigChange={handleSchoolConfigChange}
          onSchoolConfigApply={handleSchoolConfigApply}
        />

        <div className="chart-workspace">
          <div className="chart-workspace-left">
            <ChartBoard
              chart={chart}
              variant="production"
              hideTimeNav
              timeView={timeView}
              liunianYear={liunianYear}
              liuyueMonth={liuyueMonth}
              liuriDay={liuriDay}
              liushiHour={liushiHour}
              onTimeViewChange={setTimeView}
              onYearChange={setLiunianYear}
              onMonthChange={setLiuyueMonth}
              onDayChange={setLiuriDay}
              onHourChange={setLiushiHour}
              onPalaceSelect={setSelectedPalace}
              onStarSelect={(star: Star, palace: Palace) => {
                setSelectedPalace(palace);
              }}
              onSiHuaClick={(starName, siHua, view) => {
                setSelectedSiHua({ starName, siHua, view });
              }}
            />
            <PatternsLink chart={chart} />
            <ChartTimeDrill
              chart={chart}
              view={timeView}
              liunianYear={liunianYear}
              liuyueMonth={liuyueMonth}
              liuriDay={liuriDay}
              liushiHour={liushiHour}
              onViewChange={v => {
                setTimeView(v);
                setSelectedPalace(null);
                setSelectedSiHua(null);
              }}
              onYearChange={setLiunianYear}
              onMonthChange={setLiuyueMonth}
              onDayChange={setLiuriDay}
              onHourChange={setLiushiHour}
            />
            <div className="chart-reset-wrap">
              <button type="button" className="chart-reset-btn" onClick={handleReset}>
                重新起盘
              </button>
            </div>
          </div>

          <div className="chart-workspace-right">
            {famousPerson && (
              <div className="chart-workspace-stickytop">
                <FamousPersonCard person={famousPerson} />
              </div>
            )}
            <div className="chart-workspace-insight">
              <InsightPanel
                chart={chart}
                timeView={timeView}
                liunianYear={liunianYear}
                liuyueMonth={liuyueMonth}
                liuriDay={liuriDay}
                liushiHour={liushiHour}
                selectedPalace={selectedPalace}
                selectedSiHua={selectedSiHua}
                onExport={savedForm ? () => setShareModalOpen(true) : undefined}
              />
            </div>
          </div>
        </div>

        {savedForm && (
          <ShareModal
            open={shareModalOpen}
            onClose={() => setShareModalOpen(false)}
            shareUrl={shareUrl}
            chart={chart}
            birth={{
              year: savedForm.year,
              month: savedForm.month,
              day: savedForm.day,
              hour: savedForm.clockHour,
              minute: savedForm.clockMinute,
              gender: savedForm.gender,
              city: savedForm.city || undefined,
            }}
          />
        )}
        <div className="chart-bottom-disclaimer" aria-hidden="true">
          AI 解读仅供学习参考，不构成医疗、投资、婚姻或法律建议
        </div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="chart-generating-screen">
        <div className="chart-generating-spinner" aria-hidden />
        <div>正在排盘…</div>
      </div>
    );
  }

  return (
    <OracleChrome tone="gold" variant="chart">
      <OracleHero
        align="center"
        eyebrow="01 / DESTINY ENGINE"
        title="起紫微命盘"
        description="输入出生年月日时 · 以公历为准"
        showDivider
        hideSubtitle
      />
      <section className="oracle-content-band">
        <div className="oracle-form-grid oracle-form-grid--centered">
          <div className="oracle-form-card">
            <BirthForm
              key={formKey}
              appearance="light"
              onSubmit={handleSubmit}
              onFormSave={handleFormSave}
              initialData={savedForm ?? undefined}
            />
            {generateError && (
              <div className="chart-generate-error" role="alert">
                {generateError}
              </div>
            )}
          </div>
        </div>

        <div className="oracle-form-note">
          <p>登录后自动保存命盘 · 换设备也能看记录</p>
          <span>未登录时排盘不会保存，刷新即失</span>
        </div>
      </section>
    </OracleChrome>
  );
}
