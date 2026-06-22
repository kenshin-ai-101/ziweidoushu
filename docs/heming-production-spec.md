# Heming Production Capture And Local Parity Spec

Date: 2026-06-22

## Evidence Sources

- Production page HTML: `curl -L https://wdyziweidoushu666.com/heming`
- Production client chunk: `/_next/static/chunks/app/heming/page-88ee568bf54cdcfb.js`
- Production `/api/generate` sample calls with browser-like headers
- Production `/api/heming` anonymous call with generated `chartA` and `chartB`
- Local source comparison:
  - `lib/ziwei/heming-knowledge.ts`
  - `app/api/interpret/route.ts`
  - `lib/ziwei/interpret-prompts.ts`

The in-app Browser was used for direct production page inspection. It did not expose a DevTools network panel in this session, so request/response evidence comes from production HTML/chunk inspection plus curl with browser headers.

## Production Page Flow

Observable `/heming` page:

1. Header: `METIS`, nav links `起盘`, `合盘`, button `普通版`, mobile menu button.
2. Page title: `02 / SYNASTRY`, `紫微合盘`, subtitle `感情 · 合伙 · 亲子 · 朋友`.
3. Two `BirthForm` panels:
   - `甲方 — A`
   - `乙方 — B`
4. Analysis panel:
   - Header `◉ 合盘分析 · HEMING`
   - Quota chip title: `合盘每日免费 10 次，北京时间 0 点重置`
   - Empty state text: `填好双方出生信息后，点击下方按钮 / AI 将基于倪师体系深度分析两人缘分匹配度`
   - CTA: `开始合盘分析`
5. After analysis, quick follow-ups are visible:
   - `感情匹配度如何？`
   - `适合合伙创业吗？`
   - `两人结婚是否合适？`
   - `哪方面最容易产生矛盾？`
   - `财运是否互补？`

Production stores transient client state in localStorage:

- `heming_session_v1`: form/chart/main analysis/follow-up state, expires after 7 days.
- `heming_history_v1`: recent form pair history, max 10.
- `heming_*`: per-pair cached analysis/follow-up text, expires after 30 days.

## Production Request Contract

### `/api/generate`

Method: `POST`

Headers required for curl reproduction:

```text
Content-Type: application/json
Origin: https://wdyziweidoushu666.com
Referer: https://wdyziweidoushu666.com/heming
User-Agent: Mozilla/5.0 AppleWebKit/537.36 Chrome/126 Safari/537.36
```

Sample body:

```json
{
  "year": 1990,
  "month": 1,
  "day": 1,
  "hour": 4,
  "gender": "male",
  "name": "A",
  "province": "北京",
  "city": "北京",
  "longitude": 116.4
}
```

Observed status: `200`. Response is a full `ZiweiChart` with keys including `birthInfo`, `lunarInfo`, `mingGongBranch`, `shenGongBranch`, `wuxingJu`, `wuxingJuName`, `ziweiPos`, `palaces`, and `_chartToken`.

Without browser-like headers, production returned `403`.

### `/api/heming`

Production client chunk sends:

```ts
fetch('/api/heming', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(preferBonus ? { 'X-Quota-Prefer': 'bonus' } : {}),
  },
  body: JSON.stringify({
    chartA,
    chartB,
    question: question || undefined,
    previousAnalysis: isFollowUp ? mainAnalysis : undefined,
  }),
  signal,
});
```

The production page checks login before calling `/api/heming`. Direct anonymous curl with valid generated charts returned:

```http
HTTP/2 401
content-type: application/json
```

```json
{"error":"登录后可使用合盘","code":"NEED_LOGIN"}
```

Because anonymous production cannot stream `/api/heming`, production output headings could not be captured without a logged-in browser session. The local implementation therefore matches the observable client parser and section style, and documents this as an acceptable gap.

## SSE Protocol

Production client parser:

```ts
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

buffer += decoder.decode(value, { stream: true });
const lines = buffer.split('\n');
buffer = lines.pop() ?? '';

for (const line of lines) {
  if (!line.startsWith('data: ')) continue;
  const data = line.slice(6);
  if (data === '[DONE]') done = true;
  else text += JSON.parse(data).delta?.text ?? '';
}
```

Local `/api/heming` emits the same frame shape as `/api/interpret`:

```text
data: {"delta":{"text":"..."}}

data: [DONE]
```

## Production UI State Machine

- Not logged in: open login modal, do not call `/api/heming`.
- Incomplete forms: show `请先填写双方完整出生信息`.
- Invalid date: show `甲方出生日期不存在，请重新选择` or `乙方出生日期不存在，请重新选择`.
- Start analysis:
  - Generate both charts through `/api/generate`, in parallel.
  - Build a cache key from both birth infos plus optional question.
  - If cache hit, render cached text.
  - Else call `/api/heming`.
- Main streaming:
  - Show progress copy such as `正在对比双方命盘…`, `正在分析宫位互应…`, `AI 深度推理中，请稍候…`.
  - Render accumulated text.
- Follow-up streaming:
  - Keep main analysis.
  - Append a user bubble and assistant answer under `合盘追问`.
- Error handling:
  - `401`: login required, or chart token invalid if code is `CHART_TOKEN_INVALID`.
  - `402`: quota exhausted, show server error text.
  - `429`: `请求过于频繁，请等几秒再试`.
  - `5xx`: `AI 服务器繁忙，请稍后重试`.
- Quota:
  - Fetches `/api/quota` only when logged in.
  - Reads `X-Quota-Remaining` from `/api/heming`.
  - Supports `X-Quota-Prefer: bonus`.

## Local Implementation

Local files:

- `app/api/heming/route.ts`
- `lib/ziwei/heming-prompts.ts`
- `lib/ai/heming-quota.ts`
- `lib/ziwei/heming-quota-client.ts`
- `app/heming/page.tsx`

Local behavior:

- No login/payment/SMS gate.
- `/api/generate` remains unchanged.
- `/api/heming` accepts:

```ts
{
  chartA: ZiweiChart;
  chartB: ZiweiChart;
  question?: string;
  previousAnalysis?: string;
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}
```

- Main analysis uses `buildInitialHemingMessages()`.
- Follow-ups send `messages` history plus `question` and `previousAnalysis`.
- The route uses `DeepSeekStream`, not a mock.
- The route uses a separate `ziwei_heming_quota` cookie and `HEMING_FREE_DAILY_QUOTA`, default `10`.
- On model failure, quota is rolled back.

## Prompt Outline

Local prompt is not copied from production server code. It is derived from:

- Observable production page structure and renderer.
- `lib/ziwei/heming-knowledge.ts`.
- Existing `/api/interpret` prompt style.

The local system prompt includes:

- Both chart summaries: birth info, five-element bureau, current `大限`, `命宫`, `身宫`, `夫妻宫`, `福德宫`, `官禄宫`, `财帛宫`.
- Relevant spouse-palace star knowledge from `STAR_IN_FUQI_GU`.
- `SIHUA_IN_FUQI_GU`.
- `HEMING_METHODOLOGY`.
- Output rules:
  - Four rating lines like `感情：★★★（3/5）`.
  - Sections `**【合盘总览】**`, `**【命宫互看】**`, `**【夫妻宫互参】**`, `**【福德宫耐久度】**`, `**【四化与大限同步】**`, `**【风险与建议】**`.

No new Ni Hai Xia quotes were invented. Any quote-like material comes from the existing local `heming-knowledge.ts`.

## Verification Log

- In-app Browser:
  - Successfully opened `https://wdyziweidoushu666.com/heming`.
  - Visible DOM confirmed `METIS`, `02 / SYNASTRY`, `紫微合盘`, `甲方 — A`, `乙方 — B`, `合盘分析 · HEMING`, and `开始合盘分析`.
  - Attempts to open local `http://localhost:3100/heming`, `http://127.0.0.1:3100/heming`, and `http://[::1]:3100/heming` inside in-app Browser were blocked by the Browser runtime with `net::ERR_BLOCKED_BY_CLIENT`. The same local service responded through curl, so this is a Browser-localhost access limitation, not a Next/page failure.
  - An earlier local page load through LAN URL `http://192.168.3.13:3100/heming` confirmed the local DOM: `METIS`, `紫微合盘`, two birth forms, `合盘分析 · HEMING`, quota chip `今日剩余 10 次`, and `开始合盘分析`.
  - Later app-in-browser sessions timed out on the same LAN URL and on production navigation through CDP. The same local service responded through curl and the smoke script, so this is recorded as a Browser runtime/session limitation rather than a Next/page failure.
  - Browser automation previously filled required DOM select values for A/B birth dates and focused the start button, but click/Enter/Space activation did not fire the React handler in that in-app Browser session. No console errors were reported. Local API verification below proves the backend chart-to-main-to-follow-up path; full visual button-trigger E2E remains a Browser interaction gap.
- Production `/api/generate`:
  - First curl without browser headers: `403`.
  - Curl with browser headers: `200`.
- Production `/api/heming`:
  - Anonymous POST with valid generated charts: `401 {"error":"登录后可使用合盘","code":"NEED_LOGIN"}`.
  - Logged-in in-app Browser UI run on `https://wdyziweidoushu666.com/heming` filled sample A/B birth forms and clicked `开始合盘分析`.
  - The logged-in page did not show a login modal, but returned the quota state `今日次数已用完` and `今日免费次数（3 次）已用完，明日 0 点（北京时间）重置`.
  - Because the logged-in account quota was exhausted, no production `/api/heming` SSE body or final AI section headings were produced in this run.
- Local `/api/generate`:
  - POST sample A: `200`.
  - POST sample B: `200`.
- Local `/api/heming` main analysis:
  - POST `{ chartA, chartB }`: `200`.
  - Headers included `content-type: text/event-stream`, `set-cookie: ziwei_heming_quota=...used:1...`, `x-quota-remaining: 9`.
  - Sample SSE:

```text
data: {"delta":{"text":"好的"}}
data: {"delta":{"text":"，"}}
data: {"delta":{"text":"根据"}}
...
data: {"delta":{"text":"感情"}}
data: {"delta":{"text":"："}}
data: {"delta":{"text":"★★"}}
data: {"delta":{"text":"★"}}
data: {"delta":{"text":"（"}}
data: {"delta":{"text":"3"}}
```

- Local `/api/heming` follow-up:
  - POST `{ chartA, chartB, question, previousAnalysis, messages }` with `X-Quota-Prefer: bonus` and a test bonus cookie: `200`.
  - Headers included `content-type: text/event-stream`, `set-cookie: ziwei_heming_quota=...bonus:0...`, `x-quota-remaining: 9`.
  - Sample SSE:

```text
data: {"delta":{"text":"好的"}}
data: {"delta":{"text":"，"}}
data: {"delta":{"text":"针对"}}
...
data: {"delta":{"text":"###"}}
data: {"delta":{"text":" **"}}
data: {"delta":{"text":"【"}}
data: {"delta":{"text":"命"}}
...
data: [DONE]
```

- Local build:
  - First `npm run build` failed on stale `.next/server` missing chunk.
  - After deleting generated `.next`, `npm run build` passed.
  - After `/api/heming` and follow-up UI changes, `npm run build` passed again.
- Local smoke script:
  - `npm run smoke:heming -- http://localhost:3100` passed on 2026-06-22.
  - Verified `GET /heming`, two `/api/generate` calls, main `/api/heming` SSE, section detection, and follow-up `/api/heming` SSE.
  - Observed `x-quota-remaining: 9` in the current development environment.

## Remaining Gaps

- Production `/api/heming` full streamed LLM text and exact server prompt cannot be captured anonymously because production returns `NEED_LOGIN`.
- Local does not implement login/payment/SMS, by design.
- Local quota is cookie/localStorage based and observable, not account-backed like production.
- Production appears to send only `previousAnalysis` for follow-up context; local additionally sends structured `messages` history to satisfy the local parity goal for follow-up history.
