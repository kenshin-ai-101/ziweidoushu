'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';
import { getChartToken } from '@/lib/ziwei/chart-token';
import {
  buildFocusCacheKey,
  buildSelectionFollowUpPrompt,
  normalizeSelectionText,
  readInterpretStream,
  requestInterpret,
  writeInterpretCache,
} from '@/lib/ziwei/interpret-client';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';
import { buildTimeOverlay, getTemporalGanzhiInfo, getTimeOverlayLabel } from '@/lib/ziwei/sihua';
import {
  CHART_TOPIC_TABS_ALL,
  COLLAPSIBLE_SECTION_TITLES,
  PALACE_ROLES,
  PALACE_TO_TOPIC,
  type TopicKey,
} from '@/lib/ziwei/db-analysis';
import ChatPanel, { type ChatPanelHandle } from '@/components/ChatPanel';

interface SelectedSiHua {
  starName: string;
  siHua: string;
  view: TimeView;
}

type PanelMode = 'analysis' | 'chat';
type AnalysisCache = Partial<Record<string, string>>;

interface SelectionBubble {
  text: string;
  top: number;
  left: number;
}

interface ParsedAnalysisText {
  dingdiao: string;
  lundian: string;
  yiju: string;
  chuchu: string;
  raw: string;
  hasMarkers: boolean;
}

const OVERVIEW_AXES = [
  { key: 'career', label: '事业' },
  { key: 'wealth', label: '财运' },
  { key: 'love', label: '感情' },
  { key: 'personality', label: '性格' },
  { key: 'health', label: '健康' },
  { key: 'overall', label: '综合' },
] as const;

function palaceMajorText(chart: ZiweiChart, palaceName: string) {
  const palace = chart.palaces.find(p => p.name === palaceName || (palaceName === '仆役' && p.name === '交友'));
  const majors = palace?.stars.filter(s => s.type === 'major').map(s => s.name) ?? [];
  if (majors.length > 0) return majors.join('·');
  if (palace?.borrowedStars?.length) return `借${palace.borrowedStars.join('·')}`;
  return '借天机';
}

function getOverviewHeadline(chart: ZiweiChart) {
  const ming = chart.palaces.find(p => p.isMingGong || p.branch === chart.mingGongBranch);
  const names = new Set([...(ming?.stars ?? []).map(s => s.name), ...(ming?.borrowedStars ?? [])]);
  if (names.has('天机') && names.has('巨门')) return '机敏善谋，智珠在握';
  if (names.has('紫微')) return '帝星临命，格局自开';
  if (names.has('武曲')) return '刚毅守成，财星有力';
  return '天机为智慧星，宜辅佐不宜独当，最忌善变而无成。';
}

function makeAnalysisCacheKey(
  topic: TopicKey,
  options: {
    view: TimeView;
    liunianYear: number;
    liuyueMonth: number;
    liuriDay: number;
    liushiHour: number;
  },
) {
  return [
    topic,
    options.view,
    options.liunianYear,
    options.liuyueMonth,
    options.liuriDay,
    options.liushiHour,
  ].join(':');
}

function parseAnalysisText(text: string): ParsedAnalysisText {
  const out: ParsedAnalysisText = {
    dingdiao: '',
    lundian: '',
    yiju: '',
    chuchu: '',
    raw: text,
    hasMarkers: false,
  };
  if (!text || text.startsWith('正在生成')) return out;

  const re = /\*\*【([^】]+)】\*\*/g;
  const parts: { name: string; start: number; markerEnd: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    parts.push({ name: match[1], start: match.index, markerEnd: match.index + match[0].length });
  }

  if (parts.length === 0) {
    out.lundian = text.trim();
    return out;
  }

  out.hasMarkers = true;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const end = i + 1 < parts.length ? parts[i + 1].start : text.length;
    const body = text.slice(part.markerEnd, end).trim();
    if (part.name.includes('一句话定调') || part.name.includes('一句话结论')) out.dingdiao = body;
    else if (part.name.includes('核心论断') || part.name.includes('核心判断')) out.lundian = body;
    else if (part.name.includes('命盘依据')) out.yiju = body;
    else if (part.name.includes('经典出处')) out.chuchu = body;
  }
  return out;
}

function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}|\n(?=[·◇◆▸\-])/)
    .map(line => line.replace(/\*\*/g, '').trim())
    .filter(Boolean);
}

function firstParagraph(text: string) {
  return splitParagraphs(text)[0] ?? '';
}

function findPalace(chart: ZiweiChart, palaceName: string) {
  return chart.palaces.find(p => p.name === palaceName || (palaceName === '仆役' && p.name === '交友'));
}

function findPalaceByBranch(chart: ZiweiChart, branch: number) {
  return chart.palaces.find(p => p.branch === branch);
}

function mingPalace(chart: ZiweiChart) {
  return chart.palaces.find(p => p.isMingGong || p.branch === chart.mingGongBranch) ?? chart.palaces[0];
}

function palaceMajorNames(palace?: Palace) {
  const majors = palace?.stars.filter(s => s.type === 'major').map(s => s.name) ?? [];
  if (majors.length > 0) return majors;
  return palace?.borrowedStars ?? [];
}

function formatStars(palace?: Palace, includeMinor = true) {
  if (!palace) return '无';
  const selected = includeMinor ? palace.stars : palace.stars.filter(s => s.type === 'major');
  const stars = selected.map(s => `${s.name}${s.siHua ? `化${s.siHua}` : ''}${s.brightnessLabel ? `（${s.brightnessLabel}）` : ''}`);
  if (stars.length > 0) return stars.join('、');
  if (palace.borrowedStars?.length) return `空宫，借${palace.borrowedFromName ?? '对宫'}：${palace.borrowedStars.join('、')}`;
  return '空宫';
}

function getOppositePalace(chart: ZiweiChart, palace: Palace) {
  return findPalaceByBranch(chart, (palace.branch + 6) % 12);
}

function getSanFangSiZheng(chart: ZiweiChart) {
  const ming = mingPalace(chart);
  const branches = [ming.branch, (ming.branch + 4) % 12, (ming.branch + 8) % 12, (ming.branch + 6) % 12];
  const roles = ['本宫', '三合位', '三合位', '对宫'];
  return branches.map((branch, index) => ({
    role: roles[index],
    palace: findPalaceByBranch(chart, branch),
  }));
}

function collectSihua(chart: ZiweiChart) {
  return chart.palaces.flatMap(palace => palace.stars
    .filter(star => star.siHua)
    .map(star => ({
      palace,
      starName: star.name,
      siHua: star.siHua!,
      brightnessLabel: star.brightnessLabel,
    })));
}

function sihuaTone(sihua: string) {
  if (sihua === '禄') return '机缘、财气与顺势资源';
  if (sihua === '权') return '掌控、执行与话语权';
  if (sihua === '科') return '名声、文书与贵人认可';
  return '阻滞、执念与需要修正的课题';
}

function starOverviewCopy(chart: ZiweiChart, starNames: string[], parsed: ParsedAnalysisText) {
  const key = starNames.join('');
  const dbDingdiao = firstParagraph(parsed.dingdiao);
  const dbLundian = parsed.lundian.trim();
  if (key.includes('天机') && key.includes('巨门')) {
    return {
      summary: firstParagraph(dbLundian) || '你是天生的智多星，思维敏锐，洞察力强，善于分析和策划，在需要动脑的事情上往往能想到别人没想到的角度。最突出的天赋是灵活变通，能在变化中找到机会；性格弱点是想得多、行动慢，容易因为过度分析错失窗口。',
      oneLine: dbDingdiao || '天机为智慧星，宜辅佐不宜独当，最忌善变而无成。',
      core: dbLundian || '天机主智慧、谋略、变动，巨门主口才、辨析、是非；两星同参，形成“以脑力和表达立身”的结构。适合策划、咨询、技术、法律、教学、传媒等需要分析与说服的领域。',
      comboTitle: '天机巨门',
      comboBrief: '智星配暗星，口才犀利、善辩是非，宜法律传媒。',
      comboLine: '机巨同宫，聪明犀利善辩论，一生多口舌是非，但也能靠口才与专业成就。',
    };
  }
  return {
    summary: firstParagraph(dbLundian) || `${starNames.join('、') || '命宫'}为本盘性格核心，先天优势在于把本宫主星的气质稳定发挥；若命宫空宫，则需借对宫星曜入事，人生主题更容易被外部环境、人际互动和迁移变化引动。`,
    oneLine: dbDingdiao || getOverviewHeadline(chart),
    core: dbLundian || '命盘判断以命宫为体、三方四正为用；再看本命四化落点，确认哪些领域被强化，哪些领域需要修正。',
    comboTitle: starNames.join('') || '命宫格局',
    comboBrief: '以命宫主星、对宫借星与三方四正合参。',
    comboLine: '本盘需从命宫主星、三方四正和四化路径共同判断，不可只看单颗主星。',
  };
}

function palaceScore(palace?: Palace) {
  if (!palace) return 50;
  let score = 52;
  const stars = palace.stars.length > 0 ? palace.stars : (palace.borrowedStars ?? []).map(name => ({ name, type: 'major' as const }));
  for (const star of stars) {
    if (star.type === 'major') score += 9;
    else if (star.type === 'lucky') score += 6;
    else if (star.type === 'sha') score -= 7;
    else score += 1;
    if ('brightness' in star && star.brightness === 'bright') score += 6;
    if ('brightness' in star && star.brightness === 'dim') score -= 6;
    if ('siHua' in star && star.siHua === '禄') score += 8;
    if ('siHua' in star && star.siHua === '权') score += 6;
    if ('siHua' in star && star.siHua === '科') score += 5;
    if ('siHua' in star && star.siHua === '忌') score -= 10;
  }
  return Math.max(32, Math.min(92, score));
}

function timeViewLabel(view: TimeView) {
  if (view === 'mingpan') return '本命';
  if (view === 'daxian') return '大限';
  if (view === 'liunian') return '流年';
  if (view === 'liuyue') return '流月';
  if (view === 'liuri') return '流日';
  if (view === 'liushi') return '流时';
  return getTimeOverlayLabel(view) ?? '本命';
}

function OverviewToggle({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overview-toggle">
      <button type="button" aria-expanded={open} onClick={() => setOpen(v => !v)}>
        <span>{title}</span>
        <span className="overview-toggle-chevron">{open ? '⌄' : '›'}</span>
      </button>
      {open && <div className="overview-toggle-body">{children}</div>}
    </div>
  );
}

function OverviewDetail({
  chart,
  text,
  timeView,
  liunianYear,
  liuyueMonth,
  liuriDay,
  liushiHour,
}: {
  chart: ZiweiChart;
  text: string;
  timeView: TimeView;
  liunianYear: number;
  liuyueMonth: number;
  liuriDay: number;
  liushiHour: number;
}) {
  const ming = mingPalace(chart);
  const opposite = getOppositePalace(chart, ming);
  const mainStars = palaceMajorNames(ming);
  const parsed = parseAnalysisText(text);
  const copy = starOverviewCopy(chart, mainStars, parsed);
  const shen = findPalaceByBranch(chart, chart.shenGongBranch);
  const sihuas = collectSihua(chart);
  const sanfang = getSanFangSiZheng(chart);
  const yearStem = STEMS[chart.lunarInfo.yearStem] ?? '';
  const hasEmptyMing = ming?.isEmpty || !ming?.stars.some(s => s.type === 'major');
  const temporal = getTemporalGanzhiInfo(liunianYear, liuyueMonth, liuriDay, liushiHour);
  const overlay = buildTimeOverlay({ view: timeView, chart, liunianYear, liuyueMonth, liuriDay, liushiHour });
  const overlayEntries = (['禄', '权', '科', '忌'] as const)
    .map(siHua => {
      const starName = Object.keys(overlay).find(name => overlay[name] === siHua);
      return starName ? { starName, siHua } : null;
    })
    .filter(Boolean) as { starName: string; siHua: string }[];

  return (
    <div className="overview-detail">
      <div className="overview-audit">
        <strong>已逐条核对</strong>
        <span>{mainStars[0] ?? '命宫'} · 命格总览</span>
        <span>{parsed.hasMarkers ? '本地知识库已命中' : '本地知识库兜底'}</span>
        <span>{timeViewLabel(timeView)}</span>
        <span>{STEMS[temporal.yearStem]}{BRANCHES[temporal.yearBranch]}年</span>
      </div>

      <section className="overview-section">
        <h3>命格总览</h3>
        <p>{copy.summary}</p>
      </section>

      <section className="overview-section overview-callout">
        <h3>一句话定调</h3>
        <p>{copy.oneLine}</p>
      </section>

      <section className="overview-section">
        <h3>核心论断</h3>
        {splitParagraphs(copy.core).map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        <p>本盘命宫{hasEmptyMing ? '为空宫，需借对宫入事；' : `坐${formatStars(ming, false)}；`}对宫为{opposite?.name ?? '迁移'}，见{formatStars(opposite, false)}。这表示“自我定位”与外部场域联动很强，越是在真实协作、表达、流动和问题解决中，越能看见命盘优势。</p>
      </section>

      <section className="overview-section">
        <h3>身宫 · 后天追求</h3>
        <p>你的身宫落在{shen?.name ?? '本宫'}，{chart.shenGongBranch === chart.mingGongBranch ? '与命宫同宫，先天格局就是后天追求，人生主线集中，35 岁后更像把命宫主题继续放大与深化。' : `后天追求会转向${shen?.name ?? '身宫'}主管的领域，需把命宫天赋落实到该宫位的人生场景。`}身宫不是另一个命盘，而是中年以后更明显的行动重心。</p>
      </section>

      <section className="overview-section">
        <h3>命盘推演</h3>
        <p>本宫主星：{formatStars(ming, false)}，{chart.wuxingJuName}同参。</p>
        <p>第二主星：{mainStars[1] ? `${mainStars[1]}——与${mainStars[0]}共同决定命宫气质。` : '以三方四正与对宫借星补足命宫判断。'}{hasEmptyMing ? ` 命宫空宫时，借${opposite?.name ?? '对宫'}的${palaceMajorNames(opposite).join('、') || '主星'}论事。` : ''}</p>
      </section>

      <section className="overview-section">
        <h3>三方四正联动</h3>
        <div className="overview-proof-grid">
          {sanfang.map(item => (
            <div key={`${item.role}-${item.palace?.branch}`}>
              <strong>{item.role} · {item.palace?.name ?? '宫位'}</strong>
              <p>{formatStars(item.palace)}</p>
            </div>
          ))}
        </div>
        <p>本盘合参：命宫本宫为体、对宫为用，三合会官禄与财帛，四化落点决定哪一宫被引动。判断顺序为命宫定性、三方四正定格局、四化定路径。</p>
      </section>

      <section className="overview-section">
        <h3>四化路径分析 · 落到你这盘</h3>
        {sihuas.length > 0 ? sihuas.map(item => (
          <div className={`overview-sihua-row overview-sihua-row--${item.siHua}`} key={`${item.starName}-${item.siHua}-${item.palace.branch}`}>
            <span>化{item.siHua}</span>
            <p>{item.starName}落{item.palace.name}{item.brightnessLabel ? ` · ${item.brightnessLabel}` : ''}，{sihuaTone(item.siHua)}会通过{PALACE_ROLES[item.palace.name] ?? item.palace.name}显现。</p>
          </div>
        )) : <p>本盘未识别到年干四化落星，请回到首页重新起盘后再试。</p>}
      </section>

      <section className="overview-section">
        <h3>年干四化 · 关键宫位影响</h3>
        <p>{yearStem}年四化以出生年干为准，本命四化固定不动，大限与流年只是在不同阶段引动它。</p>
        {sihuas.map(item => (
          <p key={`year-${item.starName}-${item.siHua}-${item.palace.branch}`}>{item.starName}化{item.siHua}在{item.palace.name}：{sihuaTone(item.siHua)}，重点观察{PALACE_ROLES[item.palace.name] ?? item.palace.name}。</p>
        ))}
        {timeView !== 'mingpan' && overlayEntries.length > 0 && (
          <div className="overview-time-layer">
            <strong>{timeViewLabel(timeView)}四化</strong>
            {overlayEntries.map(item => <span key={`${item.starName}-${item.siHua}`}>{item.starName}化{item.siHua}</span>)}
          </div>
        )}
      </section>

      <OverviewToggle title="命盘依据">
        {(parsed.yiju ? splitParagraphs(parsed.yiju) : [
          `出生四柱：${chart.birthPillars?.join(' · ') ?? `${STEMS[chart.lunarInfo.yearStem]}${BRANCHES[chart.lunarInfo.yearBranch]}年`}；命宫在${BRANCHES[chart.mingGongBranch]}，身宫在${BRANCHES[chart.shenGongBranch]}，五行局为${chart.wuxingJuName}。`,
          `宫位依据：命宫${formatStars(ming)}；对宫${opposite?.name ?? '迁移'}${formatStars(opposite)}；三方四正取命、财、官、迁四宫合参。`,
        ]).map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      </OverviewToggle>

      <OverviewToggle title="经典出处">
        {(parsed.chuchu ? splitParagraphs(parsed.chuchu) : [
          '《紫微斗数全书》以命宫主星定先天性情，以三方四正定事业财官格局，以四化定吉凶路径。',
          '倪海夏《天纪》体系重视命身、三方四正与四化同参：空宫不作空论，须借对宫星曜入事。',
        ]).map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      </OverviewToggle>

      <section className="overview-section overview-risk">
        <h3>风险提醒</h3>
        <p>紫微斗数讲究阴阳互见，下方为基于本盘特征的中性提醒，知所警惕方能转危为安。</p>
        {hasEmptyMing && <p>本宫空宫，能量需借对宫论事，命格走势比一般人更易受外缘、迁移、人际反馈牵动，自主定锚尤其重要。</p>}
        {mainStars.includes('天机') && <p>天机重思考与变化，优点是机敏，风险是多谋少决；真正的破局点在于把分析变成稳定行动。</p>}
        {mainStars.includes('巨门') && <p>巨门重表达与辨析，优点是口才，风险是口舌是非；越有能力争辩，越要学会选择何时不争。</p>}
      </section>

      <section className="overview-section overview-combo">
        <h3>针对你的命盘</h3>
        <p>{hasEmptyMing ? `命宫空宫借${opposite?.name ?? '对宫'}——你命宫无主星，需借${opposite?.name ?? '对宫'}的${palaceMajorNames(opposite).join('、') || '主星'}论事。` : `命宫坐${mainStars.join('、')}——这是本盘自我、性格与先天格局的主轴。`}你这盘的特点是：自我定位需要在真实事务中被校准，越能走出去沟通、协作、解决问题，越容易显出命宫优势。</p>
        <div className="overview-combo-card">
          <strong>双星同宫 · 「{copy.comboTitle}」</strong>
          <span>{copy.comboBrief}</span>
          <p>{copy.comboLine}</p>
        </div>
      </section>
    </div>
  );
}

function OverviewVisual({
  chart,
  text,
  timeView,
  liunianYear,
  liuyueMonth,
  liuriDay,
  liushiHour,
}: {
  chart: ZiweiChart;
  text: string;
  timeView: TimeView;
  liunianYear: number;
  liuyueMonth: number;
  liuriDay: number;
  liushiHour: number;
}) {
  const center = 130;
  const radii = [34, 55, 76, 96];
  const axisPalace: Record<string, string> = {
    career: '官禄',
    wealth: '财帛',
    love: '夫妻',
    personality: '命宫',
    health: '疾厄',
    overall: '迁移',
  };
  const values = OVERVIEW_AXES.map(axis => palaceScore(findPalace(chart, axisPalace[axis.key])));
  const points = OVERVIEW_AXES.map((_, i) => {
    const angle = -Math.PI / 2 + i * (Math.PI * 2 / OVERVIEW_AXES.length);
    const r = values[i] / 100 * 96;
    return [center + Math.cos(angle) * r, center + Math.sin(angle) * r];
  });
  const grid = radii.map(r => OVERVIEW_AXES.map((_, i) => {
    const angle = -Math.PI / 2 + i * (Math.PI * 2 / OVERVIEW_AXES.length);
    return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
  }).join(' '));

  return (
    <div className="overview-visual">
      <div className="overview-kicker">
        命宫主星 · {palaceMajorText(chart, '命宫')}（智星）
        <span>机月同梁</span>
        <span>命宫空宫 · 借星论</span>
      </div>
      <h2 className="overview-title">{getOverviewHeadline(chart)}</h2>
      <div className="overview-radar-wrap">
        <svg className="overview-radar" viewBox="0 0 260 260" aria-hidden="true">
          {grid.map((pts, i) => (
            <polygon key={i} points={pts} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
          ))}
          {OVERVIEW_AXES.map((_, i) => {
            const angle = -Math.PI / 2 + i * (Math.PI * 2 / OVERVIEW_AXES.length);
            return (
              <line
                key={_.key}
                x1={center}
                y1={center}
                x2={center + Math.cos(angle) * 108}
                y2={center + Math.sin(angle) * 108}
                stroke="rgba(0,0,0,0.07)"
              />
            );
          })}
          <polygon points={points.map(p => p.join(',')).join(' ')} fill="rgba(85,91,210,0.16)" stroke="rgb(86,91,206)" strokeWidth="2" />
          {points.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="rgb(86,91,206)" />)}
        </svg>
        {OVERVIEW_AXES.map((axis, i) => {
          const angle = -Math.PI / 2 + i * (Math.PI * 2 / OVERVIEW_AXES.length);
          const x = center + Math.cos(angle) * 126;
          const y = center + Math.sin(angle) * 116;
          return (
            <div key={axis.key} className="overview-axis-label" style={{ left: `${x / 260 * 100}%`, top: `${y / 260 * 100}%` }}>
              <strong>{axis.label}</strong>
              <span>{palaceMajorText(chart, axisPalace[axis.key])}</span>
            </div>
          );
        })}
      </div>
      <p className="overview-footnote">六维强度依本盘星曜庙旺与格局推算，仅供参考</p>
      <div className="overview-cards">
        <div>
          <span>优</span>
          <strong>核心优势</strong>
          <p>策划应变一流，能于乱中看见先机，是天生的军师。</p>
        </div>
        <div>
          <span>合</span>
          <strong>关系模式</strong>
          <p>重沟通、喜知心，遇善解人意者方能交心。</p>
        </div>
        <div>
          <span>课</span>
          <strong>成长课题</strong>
          <p>思虑过动易摇摆，定守一处、做深一件，方能成器。</p>
        </div>
      </div>
      <OverviewDetail
        chart={chart}
        text={text}
        timeView={timeView}
        liunianYear={liunianYear}
        liuyueMonth={liuyueMonth}
        liuriDay={liuriDay}
        liushiHour={liushiHour}
      />
    </div>
  );
}

function isCollapsibleSection(title: string): boolean {
  return COLLAPSIBLE_SECTION_TITLES.some(k => title.includes(k));
}

function AiSection({
  section,
  index,
  streaming,
}: {
  section: { title: string; level: 'h1' | 'h2'; body: string[]; collapsible: boolean };
  index: number;
  streaming?: boolean;
}) {
  const [open, setOpen] = useState(!section.collapsible);
  const isOverview = section.title.includes('总览');
  const isH2 = section.level === 'h2';

  if (!section.title) {
    return (
      <>
        {section.body.map((line, i) => (
          <AiLine key={i} line={line} streaming={streaming && i === section.body.length - 1} />
        ))}
      </>
    );
  }

  return (
    <div style={{ paddingTop: index === 0 ? 0 : isH2 ? 20 : 18, paddingBottom: 6 }}>
      <div
        role={section.collapsible ? 'button' : undefined}
        tabIndex={section.collapsible ? 0 : undefined}
        aria-expanded={section.collapsible ? open : undefined}
        onClick={section.collapsible ? () => setOpen(v => !v) : undefined}
        onKeyDown={section.collapsible ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(v => !v);
          }
        } : undefined}
        className={section.collapsible ? 'insight-section-toggle' : undefined}
      >
        <span
          className={
            isOverview
              ? 'insight-section-title insight-section-title--overview'
              : isH2
                ? 'insight-section-title insight-section-title--h2'
                : 'insight-section-title'
          }
        >
          {section.title.startsWith('【') ? section.title : `【${section.title}】`}
        </span>
        {section.collapsible && (
          <span className="insight-section-chevron" style={{ transform: open ? 'rotate(90deg)' : 'none' }}>
            ›
          </span>
        )}
      </div>
      {(!section.collapsible || open) && section.body.map((line, i) => (
        <AiLine key={i} line={line} streaming={streaming && i === section.body.length - 1} />
      ))}
    </div>
  );
}

function AiLine({ line, streaming }: { line: string; streaming?: boolean }) {
  if (line.trim() === '') return <div className="h-1" />;
  const sectionMatch = line.match(/^\*\*【(.+?)】\*\*$/);
  if (sectionMatch) {
    return (
      <div className="pt-2 pb-0.5">
        <span className="insight-inline-marker">
          【{sectionMatch[1]}】
        </span>
      </div>
    );
  }
  const parts = line.split(/\*\*(.+?)\*\*/);
  return (
    <div className="insight-body-line">
      {parts.map((part, j) =>
        j % 2 === 0
          ? part
          : <strong key={j}>{part}</strong>,
      )}
      {streaming && (
        <span
          className="inline-block w-1.5 h-3 ml-0.5 animate-pulse rounded-sm align-middle"
          style={{ background: 'var(--t-gold)', opacity: 0.6 }}
        />
      )}
    </div>
  );
}

function parseSections(text: string) {
  const lines = text.split('\n');
  const sections: {
    title: string;
    level: 'h1' | 'h2';
    body: string[];
    collapsible: boolean;
  }[] = [];
  let current: (typeof sections)[number] | null = null;

  const flush = () => {
    if (current) sections.push(current);
    current = null;
  };

  for (const line of lines) {
    const h1 = line.match(/^\*\*【(.+?)】\*\*$/);
    if (h1) {
      flush();
      current = { title: h1[1], level: 'h1', body: [], collapsible: isCollapsibleSection(h1[1]) };
      continue;
    }
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flush();
      current = { title: h2[1], level: 'h2', body: [], collapsible: isCollapsibleSection(h2[1]) };
      continue;
    }
    if (!current) {
      current = { title: '', level: 'h1', body: [], collapsible: false };
    }
    current.body.push(line);
  }
  flush();
  return sections;
}

function AiContent({ text, streaming }: { text: string; streaming?: boolean }) {
  const sections = parseSections(text);
  return (
    <div className={`space-y-0.5${streaming ? ' ai-streaming' : ''}`}>
      {sections.map((section, i) => (
        <AiSection key={i} section={section} index={i} streaming={streaming} />
      ))}
    </div>
  );
}

function extractHeadline(text: string): string | null {
  const match = text.match(/\*\*【一句话定调】\*\*\s*\n(.+?)(?:\n|$)/);
  return match?.[1]?.trim() ?? null;
}

async function fetchAnalysis(
  chart: ZiweiChart,
  topic: TopicKey,
  options: {
    view: TimeView;
    liunianYear: number;
    liuyueMonth: number;
    liuriDay: number;
    liushiHour: number;
  },
): Promise<string> {
  const chartToken = getChartToken(chart);
  if (!chartToken) return '会话已过期，请回到首页重新填写生辰起盘。';

  const res = await fetch('/api/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chart, chartToken, topic, options }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))).error;
    throw new Error(err || `分析获取失败 (${res.status})`);
  }

  const data = await res.json();
  return data.text as string;
}

export default function InsightPanel({
  chart,
  timeView = 'mingpan',
  liunianYear = new Date().getFullYear(),
  liuyueMonth = new Date().getMonth() + 1,
  liuriDay = new Date().getDate(),
  liushiHour = 0,
  selectedPalace,
  selectedSiHua,
  onExport,
}: {
  chart: ZiweiChart;
  timeView?: TimeView;
  liunianYear?: number;
  liuyueMonth?: number;
  liuriDay?: number;
  liushiHour?: number;
  selectedPalace?: Palace | null;
  selectedSiHua?: SelectedSiHua | null;
  onExport?: () => void;
}) {
  const [panelMode, setPanelMode] = useState<PanelMode>('analysis');
  const [tabCache, setTabCache] = useState<AnalysisCache>({});
  const tabCacheRef = useRef(tabCache);
  tabCacheRef.current = tabCache;

  const [content, setContent] = useState('');
  const [activeTopic, setActiveTopic] = useState<TopicKey>('overview');
  const [loading, setLoading] = useState(false);
  const [followUp, setFollowUp] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [selectionBubble, setSelectionBubble] = useState<SelectionBubble | null>(null);

  const activeTopicRef = useRef<TopicKey>('overview');
  const bodyRef = useRef<HTMLDivElement>(null);
  const chatPanelRef = useRef<ChatPanelHandle>(null);
  const lastFocusKey = useRef('');
  const skipTopicEffect = useRef(false);
  const chartToken = getChartToken(chart);

  const analysisOptions = {
    view: timeView,
    liunianYear,
    liuyueMonth,
    liuriDay,
    liushiHour,
  };

  const loadTopic = useCallback(async (topic: TopicKey) => {
    const cacheKey = makeAnalysisCacheKey(topic, analysisOptions);
    const cached = tabCacheRef.current[cacheKey];
    if (cached) {
      setContent(cached);
      return;
    }
    setContent('正在生成…');
    try {
      const text = await fetchAnalysis(chart, topic, analysisOptions);
      if (activeTopicRef.current !== topic) return;
      setTabCache(prev => ({ ...prev, [cacheKey]: text }));
      setContent(text);
    } catch (err) {
      if (activeTopicRef.current !== topic) return;
      setContent(err instanceof Error ? err.message : '分析获取失败，请稍后重试');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart, chartToken, timeView, liunianYear, liuyueMonth, liuriDay, liushiHour]);

  useEffect(() => {
    if (!chartToken) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/lookup-tabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chart, chartToken }),
        });
        if (cancelled || !res.ok) return;
        const data = await res.json();
        if (data?.source === 'db' && data.tabs) {
          const seededTabs = Object.fromEntries(
            Object.entries(data.tabs as Record<TopicKey, string>).map(([topic, text]) => [
              makeAnalysisCacheKey(topic as TopicKey, analysisOptions),
              text,
            ]),
          );
          setTabCache(prev => ({ ...seededTabs, ...prev }));
          const current = activeTopicRef.current;
          if (data.tabs[current] && analysisOptions.view === 'mingpan') setContent(data.tabs[current]);
        }
      } catch { /* fallback */ }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [chart, chartToken, timeView, liunianYear, liuyueMonth, liuriDay, liushiHour]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    activeTopicRef.current = 'overview';
    setActiveTopic('overview');
    void loadTopic('overview');
  }, [chart, chartToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (skipTopicEffect.current) {
      skipTopicEffect.current = false;
      return;
    }
    if (lastFocusKey.current) return;
    void loadTopic(activeTopic);
  }, [activeTopic, loadTopic]);

  const streamFollowUp = async (prompt: string) => {
    setFollowUpLoading(true);
    const prefixRef = { value: '' };
    setContent(prev => {
      prefixRef.value = prev && !prev.startsWith('正在生成') ? `${prev}\n\n---\n\n` : '';
      return prefixRef.value;
    });

    const cacheKey = buildFocusCacheKey(chartToken, prompt);
    let assistantText = '';

    try {
      const result = await requestInterpret({
        chart,
        messages: [{ role: 'user', content: prompt }],
        cacheKey,
      });

      if (!result.ok) {
        setContent(`${prefixRef.value}${result.error}`);
        return;
      }

      if (result.cached) {
        setContent(`${prefixRef.value}${result.text}`);
        return;
      }

      assistantText = await readInterpretStream(result.reader, text => {
        setContent(`${prefixRef.value}${text}`);
      });
      if (assistantText) writeInterpretCache(cacheKey, assistantText);
    } catch {
      setContent(`${prefixRef.value}解读失败，请稍后重试。`);
    } finally {
      setFollowUpLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPalace) {
      const key = `palace-${selectedPalace.branch}`;
      if (key === lastFocusKey.current) return;
      lastFocusKey.current = key;

      const majors = selectedPalace.stars.filter(s => s.type === 'major');
      const starDesc = majors.length > 0
        ? majors.map(s => `${s.name}${s.siHua ? `化${s.siHua}` : ''}`).join('、')
        : '空宫（借对宫）';
      const role = PALACE_ROLES[selectedPalace.name] ?? '';
      const topic = PALACE_TO_TOPIC[selectedPalace.name] ?? 'overview';

      skipTopicEffect.current = true;
      activeTopicRef.current = topic;
      setActiveTopic(topic);
      setPanelMode('analysis');

      const prompt = `请重点分析【${selectedPalace.name}】（主管：${role}），主星：${starDesc}，按结构输出：
**【一句话结论】** **【核心判断】** **【命盘依据】** **【风险提醒】** **【行动建议】**`;

      setContent('正在生成…');
      void streamFollowUp(prompt);
      return;
    }

    if (selectedSiHua) {
      const key = `sihua-${selectedSiHua.starName}-${selectedSiHua.siHua}-${selectedSiHua.view}`;
      if (key === lastFocusKey.current) return;
      lastFocusKey.current = key;

      const palaceOfStar = chart.palaces.find(p => p.stars.some(s => s.name === selectedSiHua.starName));
      const palaceName = palaceOfStar?.name ?? '';
      const viewLabel =
        selectedSiHua.view === 'daxian' ? '大限'
          : selectedSiHua.view === 'liunian' ? '流年'
            : selectedSiHua.view === 'liuyue' ? '流月'
              : selectedSiHua.view === 'liuri' ? '流日'
                : selectedSiHua.view === 'liushi' ? '流时'
                  : '本命';

      setPanelMode('analysis');
      const prompt = `请分析【${viewLabel}${selectedSiHua.starName}化${selectedSiHua.siHua}】落于【${palaceName}】的飞化影响，按结构输出：
**【一句话结论】** **【核心判断】** **【命盘依据】** **【风险提醒】** **【行动建议】**`;

      setContent('正在生成…');
      void streamFollowUp(prompt);
    }
  }, [selectedPalace, selectedSiHua, chart]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTopicClick = async (topic: TopicKey) => {
    lastFocusKey.current = '';
    activeTopicRef.current = topic;
    setActiveTopic(topic);
    setPanelMode('analysis');
    setLoading(true);
    bodyRef.current && (bodyRef.current.scrollTop = 0);
    await loadTopic(topic);
    setLoading(false);
  };

  const handleFollowUp = () => {
    const text = followUp.trim();
    if (!text || followUpLoading) return;
    setFollowUp('');
    void streamFollowUp(text);
  };

  const updateSelectionBubble = useCallback(() => {
    const root = bodyRef.current;
    const sel = window.getSelection();
    if (!root || !sel || sel.isCollapsed || sel.rangeCount === 0) {
      setSelectionBubble(null);
      return;
    }

    const text = normalizeSelectionText(sel.toString());
    if (!text) {
      setSelectionBubble(null);
      return;
    }

    const range = sel.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) {
      setSelectionBubble(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setSelectionBubble(null);
      return;
    }

    setSelectionBubble({
      text,
      top: rect.bottom + 8,
      left: Math.min(
        Math.max(rect.left + rect.width / 2, 72),
        window.innerWidth - 72,
      ),
    });
  }, []);

  useEffect(() => {
    if (panelMode !== 'analysis') {
      setSelectionBubble(null);
      return;
    }

    const onMouseUp = () => {
      requestAnimationFrame(updateSelectionBubble);
    };
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel?.toString().trim()) setSelectionBubble(null);
    };
    const onScroll = () => setSelectionBubble(null);
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.insight-followup-bubble')) return;
      if (!target?.closest('.insight-analysis-body')) setSelectionBubble(null);
    };

    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('selectionchange', onSelectionChange);
    window.addEventListener('scroll', onScroll, true);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('selectionchange', onSelectionChange);
      window.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [panelMode, updateSelectionBubble, content, activeTopic]);

  const handleSelectionFollowUp = () => {
    if (!selectionBubble) return;
    const prompt = buildSelectionFollowUpPrompt(selectionBubble.text);
    window.getSelection()?.removeAllRanges();
    setSelectionBubble(null);
    setPanelMode('chat');
    queueMicrotask(() => {
      void chatPanelRef.current?.sendMessage(prompt);
    });
  };

  const headline = activeTopic === 'overview' ? extractHeadline(content) : null;

  return (
    <div className={`insight-panel-root${panelMode === 'chat' ? ' insight-panel-root--chat' : ''}`}>
      <div className="insight-flip-bar">
        <div className="insight-flip-seg">
          <button
            type="button"
            className={panelMode === 'analysis' ? 'active' : ''}
            onClick={() => setPanelMode('analysis')}
          >
            命盘分析
          </button>
          <button
            type="button"
            className={panelMode === 'chat' ? 'active' : ''}
            onClick={() => setPanelMode('chat')}
          >
            AI 对话
          </button>
        </div>
        <button type="button" className="insight-flip-util" aria-label="下载命盘" onClick={onExport}>↓</button>
      </div>

      <div className={panelMode === 'analysis' ? 'insight-analysis-pane' : 'insight-analysis-pane insight-analysis-pane--hidden'}>
        <div className="insight-topics">
          <div className="insight-topic-seg insight-topic-seg--wrap">
            {CHART_TOPIC_TABS_ALL.map(t => (
              <button
                key={t.key}
                type="button"
                className={activeTopic === t.key ? 'seg-active' : ''}
                onClick={() => void handleTopicClick(t.key)}
                disabled={loading || followUpLoading}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {selectionBubble && (
          <button
            type="button"
            className="insight-followup-bubble"
            style={{
              top: selectionBubble.top,
              left: selectionBubble.left,
            }}
            onMouseDown={event => event.preventDefault()}
            onClick={handleSelectionFollowUp}
          >
            追问这点
          </button>
        )}

        <div ref={bodyRef} className="insight-analysis-body insight-analysis-body--selectable">
          {!content && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-3" style={{ color: 'var(--t-gold)', opacity: 0.1 }}>✦</div>
              <p className="insight-loading-text animate-pulse">命格解读生成中…</p>
            </div>
          )}
          {content && activeTopic === 'overview' && !followUpLoading && !content.startsWith('正在生成') && (
            <OverviewVisual
              chart={chart}
              text={content}
              timeView={timeView}
              liunianYear={liunianYear}
              liuyueMonth={liuyueMonth}
              liuriDay={liuriDay}
              liushiHour={liushiHour}
            />
          )}
          {content && activeTopic !== 'overview' && (
            <>
              {headline && (
                <h2 className="insight-headline">{headline}</h2>
              )}
              <div className="insight-kicker mb-2 flex items-center gap-1.5">
                <span className="insight-kicker-mark">✦</span>
                命理解读
              </div>
              <AiContent text={content} streaming={followUpLoading} />
            </>
          )}
        </div>

        <div className="insight-ai-input">
          <div className="flex gap-2">
            <input
              type="text"
              value={followUp}
              onChange={e => setFollowUp(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleFollowUp()}
              placeholder="继续追问，如：今年的事业格局有什么特点？"
              disabled={followUpLoading || loading}
            />
            <button
              type="button"
              onClick={handleFollowUp}
              disabled={followUpLoading || loading || !followUp.trim()}
            >
              {followUpLoading ? '…' : '追问'}
            </button>
          </div>
        </div>
      </div>

      <div className={panelMode === 'chat' ? 'insight-chat-pane' : 'insight-chat-pane insight-chat-pane--hidden'}>
        <ChatPanel ref={chatPanelRef} chart={chart} embedded />
      </div>
    </div>
  );
}
