'use client';

import { useState, useEffect, useCallback } from 'react';
import BirthForm, { type BirthFormState } from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import InsightPanel from '@/components/InsightPanel';
import ShareModal from '@/components/ShareModal';
import PatternsCard from '@/components/PatternsCard';
import { OracleChrome, OracleHero } from '@/components/OracleSubpage';
import { generateChart } from '@/lib/ziwei/algorithm';
import { formToSearchParams, searchParamsToForm, formToBirthInfo } from '@/lib/ziwei/share';
import { useHistory } from '@/lib/ziwei/history';
import type { Palace, Star, ZiweiChart } from '@/lib/ziwei/types';
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

  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [selectedSiHua, setSelectedSiHua] = useState<SelectedSiHua | null>(null);

  const [timeView, setTimeView] = useState<TimeView>('mingpan');
  const [liunianYear, setLiunianYear] = useState(new Date().getFullYear());
  const [liuyueMonth, setLiuyueMonth] = useState(new Date().getMonth() + 1);
  const [liuriDay, setLiuriDay] = useState(new Date().getDate());
  const [liushiHour, setLiushiHour] = useState(getCurrentShichenBranch);

  const { save: saveHistory, syncCloud } = useHistory();

  const loadChart = useCallback((info: Parameters<typeof generateChart>[0]) => {
    const data = generateChart(info);
    setChart(data);
    setSelectedPalace(null);
    setSelectedSiHua(null);
    setTimeView('mingpan');
    setLiushiHour(getCurrentShichenBranch());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const formData = searchParamsToForm(params);
    if (!formData?.year) return;
    const fullForm: BirthFormState = {
      name: '', year: '', month: '', day: '',
      clockHour: '8', clockMinute: '0', unknownTime: false,
      province: '', city: '', longitude: 120, gender: 'male',
      calendarType: 'solar',
      ...formData,
    };
    setSavedForm(fullForm);
    loadChart(formToBirthInfo(fullForm));
  }, [loadChart]);

  const handleFormSave = (form: BirthFormState) => {
    setSavedForm(form);
    if (form.year && form.month && form.day) {
      saveHistory(form);
      syncCloud(form);
      const params = formToSearchParams(form);
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', `/chart?${params.toString()}`);
      }
    }
  };

  const handleSubmit = (info: Parameters<typeof generateChart>[0]) => {
    loadChart(info);
  };

  const handleReset = () => {
    setChart(null);
    setSavedForm(null);
    setSelectedPalace(null);
    setSelectedSiHua(null);
    setFormKey(k => k + 1);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/chart');
    }
  };

  const shareUrl = savedForm && typeof window !== 'undefined'
    ? `${window.location.origin}/chart?${formToSearchParams(savedForm).toString()}`
    : '';

  if (chart) {
    return (
      <OracleChrome tone="gold" compact>
        <section className="oracle-chart-workspace">
          <div className="oracle-chart-main">
            <div className="oracle-chart-toolbar">
              <button className="oracle-back-home" type="button" onClick={handleReset}>
                ← 重新起盘
              </button>
              {savedForm && (
                <button
                  type="button"
                  className="oracle-share-btn"
                  onClick={() => setShareModalOpen(true)}
                >
                  分享命盘
                </button>
              )}
            </div>

            <ChartBoard
              chart={chart}
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

            <PatternsCard chart={chart} />
          </div>

          <InsightPanel
            chart={chart}
            timeView={timeView}
            liunianYear={liunianYear}
            liuyueMonth={liuyueMonth}
            liuriDay={liuriDay}
            liushiHour={liushiHour}
            selectedPalace={selectedPalace}
            selectedSiHua={selectedSiHua}
          />
        </section>

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
      </OracleChrome>
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
