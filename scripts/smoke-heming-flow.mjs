#!/usr/bin/env node
/**
 * 合盘流程 smoke test：页面 → 匿名门禁 → 登录 → 双盘起盘 → 主分析 SSE → 追问 SSE
 *
 * 用法: node scripts/smoke-heming-flow.mjs [baseUrl]
 *
 * 可选环境变量:
 * - SMOKE_SESSION_COOKIE — 已有 metis_session，跳过 dev 注册
 */
const BASE = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';

const BIRTH_A = { year: 1990, month: 5, day: 15, hour: 6, gender: 'male' };
const BIRTH_B = { year: 1992, month: 8, day: 20, hour: 4, gender: 'female' };

function encodeClientPassword(password) {
  return Buffer.from(encodeURIComponent(password), 'utf8').toString('base64');
}

function extractSessionCookie(headers) {
  const rawList = typeof headers.getSetCookie === 'function'
    ? headers.getSetCookie()
    : [headers.get('set-cookie')].filter(Boolean);
  for (const raw of rawList) {
    const match = String(raw).match(/metis_session=([^;]+)/);
    if (match) return `metis_session=${match[1]}`;
  }
  return null;
}

async function ensureSmokeSession() {
  if (process.env.SMOKE_SESSION_COOKIE) {
    return process.env.SMOKE_SESSION_COOKIE;
  }

  const email = `smoke-heming-${Date.now()}@example.com`;
  const password = 'smoke123456';

  const codeRes = await fetch(`${BASE}/api/auth/send-email-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const codeData = await codeRes.json().catch(() => ({}));
  if (!codeRes.ok || !codeData.devCode) {
    console.warn('   dev 注册跳过：无法获取验证码（需 AUTH_DEV_MODE）');
    return null;
  }

  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      p: encodeClientPassword(password),
      code: codeData.devCode,
    }),
  });
  if (!regRes.ok) {
    console.warn('   dev 注册失败', regRes.status);
    return null;
  }

  return extractSessionCookie(regRes.headers);
}

async function postJson(path, body, cookie = '') {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data, headers: res.headers };
}

function quotaCookies(used = 0, bonus = 0) {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const payload = encodeURIComponent(JSON.stringify({ date, used, bonus }));
  return `ziwei_ai_quota=${payload}; ziwei_heming_quota=${payload}`;
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

  const anonRes = await postJson('/api/heming', { chartA: genA.data, chartB: genB.data });
  const anonBlocked = anonRes.status === 401 && anonRes.data?.code === 'NEED_LOGIN';
  console.log(`3. 匿名 POST /api/heming ${anonBlocked ? '✓' : '✗'} HTTP ${anonRes.status}`);

  const sessionCookie = await ensureSmokeSession();
  if (!sessionCookie) {
    console.log('4–5. 跳过登录后 SSE（无 session）');
    const ok = pageRes.ok && genA.ok && genB.ok && anonBlocked;
    console.log(ok ? '\n✅ 门禁链路通过（SSE 需登录 session）\n' : '\n⚠️  部分步骤未通过\n');
    process.exit(ok ? 0 : 1);
  }

  const authCookie = `${sessionCookie}; ${quotaCookies(0, 0)}`;

  const mainRes = await fetch(`${BASE}/api/heming`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: authCookie,
    },
    body: JSON.stringify({ chartA: genA.data, chartB: genB.data }),
  });
  const mainQuota = mainRes.headers.get('X-Quota-Remaining');
  const mainText = await readSse(mainRes);
  const hasSections = /【合盘总览】|【命宫互看】|【夫妻宫互参】/.test(mainText);
  const mainDaily = mainRes.headers.get('X-Quota-Daily');
  const mainQuotaNum = Number(mainQuota);
  const mainQuotaUnchanged = Number.isFinite(mainQuotaNum)
    && mainDaily != null
    && mainQuotaNum === Number(mainDaily);
  console.log(
    `4. POST /api/heming     ${mainRes.ok && mainText ? '✓' : '✗'} quota=${mainQuota ?? '?'} (no consume) 「${mainText.slice(0, 50)}…」`,
  );
  console.log(`   quota unchanged        ${mainQuotaUnchanged ? '✓' : '✗'}`);
  console.log(`   sections               ${hasSections ? '✓' : '✗'}`);

  const followRes = await fetch(`${BASE}/api/heming`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Quota-Prefer': 'bonus',
      Cookie: authCookie,
    },
    body: JSON.stringify({
      chartA: genA.data,
      chartB: genB.data,
      question: '感情匹配度如何？',
      previousAnalysis: mainText,
    }),
  });
  const followQuota = followRes.headers.get('X-Quota-Remaining');
  const followText = await readSse(followRes, 600);
  const followOk = /感情|匹配|命宫|夫妻/.test(followText);
  const followQuotaConsumed = Number.isFinite(mainQuotaNum)
    && followQuota === String(mainQuotaNum - 1);
  console.log(
    `5. POST follow-up       ${followRes.ok && followOk ? '✓' : '✗'} quota=${followQuota ?? '?'} 「${followText.slice(0, 50)}…」`,
  );
  console.log(`   quota consumed         ${followQuotaConsumed ? '✓' : '✗'}`);

  const ok = pageRes.ok && genA.ok && genB.ok && anonBlocked && mainRes.ok && mainText && hasSections
    && mainQuotaUnchanged && followRes.ok && followOk && followQuotaConsumed;
  console.log(ok ? '\n✅ 合盘链路通过\n' : '\n⚠️  部分步骤未通过\n');
  process.exit(ok ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
