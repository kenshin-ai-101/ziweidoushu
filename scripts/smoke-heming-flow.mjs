#!/usr/bin/env node
/**
 * 合盘流程 smoke test：页面 → 双盘起盘 → 主分析 SSE → 追问 SSE
 *
 * 用法: node scripts/smoke-heming-flow.mjs [baseUrl]
 */
const BASE = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';

const BIRTH_A = { year: 1990, month: 5, day: 15, hour: 6, gender: 'male' };
const BIRTH_B = { year: 1992, month: 8, day: 20, hour: 4, gender: 'female' };

async function postJson(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

function quotaCookie(used = 0, bonus = 0) {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return `ziwei_heming_quota=${encodeURIComponent(JSON.stringify({ date, used, bonus }))}`;
}

async function readSse(res, maxChars = 900) {
  let text = '';
  if (!res.ok || !res.body) return text;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (text.length < maxChars) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') return text;
        try { text += JSON.parse(payload).delta?.text ?? ''; } catch { /* skip */ }
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  return text;
}

async function main() {
  console.log(`\n💞 合盘 smoke test → ${BASE}\n`);

  const pageRes = await fetch(`${BASE}/heming`);
  console.log(`1. GET /heming           ${pageRes.ok ? '✓' : '✗'} HTTP ${pageRes.status}`);

  const [genA, genB] = await Promise.all([
    postJson('/api/generate', BIRTH_A),
    postJson('/api/generate', BIRTH_B),
  ]);
  console.log(`2. POST /api/generate×2  ${genA.ok && genB.ok ? '✓' : '✗'}`);
  if (!genA.ok || !genB.ok) process.exit(1);

  const mainRes = await fetch(`${BASE}/api/heming`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: quotaCookie(0, 0),
    },
    body: JSON.stringify({ chartA: genA.data, chartB: genB.data }),
  });
  const mainQuota = mainRes.headers.get('X-Quota-Remaining');
  const mainText = await readSse(mainRes);
  const hasSections = /【合盘总览】|【命宫互看】|【夫妻宫互参】/.test(mainText);
  console.log(
    `3. POST /api/heming     ${mainRes.ok && mainText ? '✓' : '✗'} quota=${mainQuota ?? '?'} 「${mainText.slice(0, 50)}…」`,
  );
  console.log(`   sections               ${hasSections ? '✓' : '✗'}`);

  const followRes = await fetch(`${BASE}/api/heming`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Quota-Prefer': 'bonus',
      Cookie: quotaCookie(1, 1),
    },
    body: JSON.stringify({
      chartA: genA.data,
      chartB: genB.data,
      question: '感情匹配度如何？',
      previousAnalysis: mainText,
      messages: [
        { role: 'user', content: '请对甲乙双方进行完整紫微合盘分析' },
        { role: 'assistant', content: mainText },
      ],
    }),
  });
  const followQuota = followRes.headers.get('X-Quota-Remaining');
  const followText = await readSse(followRes, 600);
  const followOk = /感情|匹配|命宫|夫妻/.test(followText);
  console.log(
    `4. POST follow-up       ${followRes.ok && followOk ? '✓' : '✗'} quota=${followQuota ?? '?'} 「${followText.slice(0, 50)}…」`,
  );

  const ok = pageRes.ok && genA.ok && genB.ok && mainRes.ok && mainText && hasSections && followRes.ok && followOk;
  console.log(ok ? '\n✅ 合盘链路通过\n' : '\n⚠️  部分步骤未通过\n');
  process.exit(ok ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
