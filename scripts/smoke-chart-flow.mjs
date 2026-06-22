#!/usr/bin/env node
/**
 * 验证生产「立即起盘」完整链路（与 /chart 页一致）：
 * 排盘 → chartToken → lookup-tabs → analysis → interpret 流式
 *
 * 用法: node scripts/smoke-chart-flow.mjs [baseUrl]
 * 默认 baseUrl = http://localhost:3100
 */
const BASE = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';

const BIRTH = { year: 1990, month: 5, day: 15, hour: 6, gender: 'male' };

async function postJson(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

function mingMainStar(chart) {
  const ming = chart.palaces?.find(p => p.isMingGong);
  const majors = ming?.stars?.filter(s => s.type === 'major').map(s => s.name) ?? [];
  if (majors.length) return majors[0];
  return ming?.borrowedStars?.[0] ?? '?';
}

async function main() {
  console.log(`\n🔮 起盘流程 smoke test → ${BASE}\n`);

  const pageRes = await fetch(`${BASE}/chart`);
  console.log(`1. GET /chart          ${pageRes.ok ? '✓' : '✗'} HTTP ${pageRes.status}`);
  if (!pageRes.ok) process.exit(1);

  const gen = await postJson('/api/generate', BIRTH);
  console.log(`2. POST /api/generate  ${gen.ok ? '✓' : '✗'} HTTP ${gen.status}`);
  if (!gen.ok) {
    console.error(gen.data);
    process.exit(1);
  }

  const chart = gen.data;
  const token = chart._chartToken;
  const star = mingMainStar(chart);
  console.log(`   命宫主星: ${star}  chartToken: ${token}`);

  const tabs = await postJson('/api/lookup-tabs', { chart, chartToken: token });
  const tabCount = tabs.data?.tabs ? Object.keys(tabs.data.tabs).length : 0;
  console.log(
    `3. POST /api/lookup-tabs ${tabs.ok ? '✓' : '✗'} source=${tabs.data?.source} tabs=${tabCount}`,
  );

  const analysis = await postJson('/api/analysis', { chart, chartToken: token, topic: 'overview' });
  const preview = typeof analysis.data?.text === 'string' ? analysis.data.text.slice(0, 48) : '';
  console.log(
    `4. POST /api/analysis   ${analysis.ok ? '✓' : '✗'} len=${analysis.data?.text?.length ?? 0} 「${preview}…」`,
  );

  const interpretRes = await fetch(`${BASE}/api/interpret`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Quota-Prefer': 'bonus',
    },
    body: JSON.stringify({
      chart,
      chartToken: token,
      messages: [{ role: 'user', content: '用一句话概括命格' }],
    }),
  });
  const quotaRemaining = interpretRes.headers.get('X-Quota-Remaining');
  let streamOk = interpretRes.ok && interpretRes.body;
  let streamText = '';
  if (streamOk) {
    const reader = interpretRes.body.getReader();
    const decoder = new TextDecoder();
    while (streamText.length < 80) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value, { stream: true }).split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') break;
        try {
          streamText += JSON.parse(payload).delta?.text ?? '';
        } catch { /* skip */ }
      }
    }
    reader.cancel().catch(() => {});
  }
  console.log(
    `5. POST /api/interpret  ${streamOk && streamText ? '✓' : '✗'} quota=${quotaRemaining ?? '?'} stream「${streamText.slice(0, 40)}…」`,
  );

  const allOk = tabs.data?.source === 'db' && tabCount === 13 && analysis.ok && streamText;
  console.log(allOk ? '\n✅ 生产起盘链路全部通过\n' : '\n⚠️  部分步骤未通过，请检查 .env.local 与 dev 服务\n');
  process.exit(allOk ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
