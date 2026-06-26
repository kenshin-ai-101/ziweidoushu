'use client';

import { useState } from 'react';
import {
  CREDIBILITY_META,
  topicCredibilityLabel,
  type CredibilityLevel,
  type CredibilityRecord,
} from '@/lib/ziwei/source-credibility';
import type { TopicKey } from '@/lib/ziwei/db-analysis';

function SegmentBadge({
  label,
  level,
}: {
  label: string;
  level: CredibilityLevel;
}) {
  const meta = CREDIBILITY_META[level];
  const color = meta.shortLabel === '已核对' ? 'var(--tx-3)' : meta.color;
  return (
    <span
      title={`${label}：${meta.label} — ${meta.description}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: '12px',
        color,
        fontWeight: 400,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ opacity: 0.6 }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{meta.shortLabel}</span>
    </span>
  );
}

function SegmentRow({
  name,
  level,
}: {
  name: string;
  level: CredibilityLevel;
}) {
  const meta = CREDIBILITY_META[level];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
      <span style={{ color: 'var(--tx-2)' }}>{name}</span>
      <span style={{ marginLeft: 'auto', color: meta.color, fontWeight: 500 }}>{meta.label}</span>
    </div>
  );
}

export default function SourceCredibilityBar({
  primaryStarName,
  topic,
  record,
}: {
  primaryStarName: string;
  topic: TopicKey;
  record: CredibilityRecord;
}) {
  const [open, setOpen] = useState(false);
  const meta = CREDIBILITY_META[record.level];
  const topicLabel = topicCredibilityLabel(topic);

  return (
    <div
      className="source-credibility-bar"
      onClick={() => setOpen(v => !v)}
      title={meta.description}
      role="button"
      tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setOpen(v => !v);
        }
      }}
    >
      <span className="source-credibility-bar__label">{meta.label}</span>
      <span className="source-credibility-bar__topic">
        {primaryStarName} · {topicLabel}
      </span>
      <span className="source-credibility-bar__spacer" />
      <div className="source-credibility-bar__segments">
        {record.segments.dingdiao && (
          <SegmentBadge label="定调" level={record.segments.dingdiao} />
        )}
        {record.segments.lundian && (
          <SegmentBadge label="论断" level={record.segments.lundian} />
        )}
        {record.segments.yiju && (
          <SegmentBadge
            label={record.segments.yiju === 'traditional' ? '古籍' : '依据'}
            level={record.segments.yiju}
          />
        )}
        {record.segments.chuchu && (
          <SegmentBadge label="出处" level={record.segments.chuchu} />
        )}
      </div>
      <span className="source-credibility-bar__chevron">{open ? '▲' : '▼'}</span>

      {open && (
        <div
          className="source-credibility-bar__panel"
          onClick={event => event.stopPropagation()}
        >
          <div className="source-credibility-bar__panel-head">
            <div className="source-credibility-bar__panel-title">
              <span className="source-credibility-bar__dot" style={{ background: meta.color }} />
              <span style={{ color: meta.color }}>{meta.label}</span>
            </div>
            <p>{meta.description}</p>
          </div>

          {(record.niSource || record.classicSource) && (
            <div className="source-credibility-bar__sources">
              {record.niSource && (
                <div>
                  <div className="source-credibility-bar__source-label">倪师出处</div>
                  <div
                    className="source-credibility-bar__source-body"
                    style={{ borderLeftColor: `${meta.color}70` }}
                  >
                    {record.niSource}
                  </div>
                </div>
              )}
              {record.classicSource && (
                <div>
                  <div className="source-credibility-bar__source-label">古籍出处</div>
                  <div
                    className="source-credibility-bar__source-body"
                    style={{ borderLeftColor: `${meta.color}70` }}
                  >
                    {record.classicSource}
                  </div>
                </div>
              )}
            </div>
          )}

          {record.note && (
            <div className="source-credibility-bar__note">
              <span>注</span>
              {record.note}
            </div>
          )}

          <div className="source-credibility-bar__structure">
            <div className="source-credibility-bar__source-label">4 段子结构 · 各段核对状态</div>
            <div className="source-credibility-bar__structure-grid">
              {record.segments.dingdiao && (
                <SegmentRow name="一句话定调" level={record.segments.dingdiao} />
              )}
              {record.segments.lundian && (
                <SegmentRow name="核心论断" level={record.segments.lundian} />
              )}
              {record.segments.yiju && (
                <SegmentRow name="命盘依据" level={record.segments.yiju} />
              )}
              {record.segments.chuchu && (
                <SegmentRow name="经典出处" level={record.segments.chuchu} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
