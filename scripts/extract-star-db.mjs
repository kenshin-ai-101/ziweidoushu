#!/usr/bin/env node
/**
 * 从生产 chart page bundle 提取 STAR_DB + COMBO_STAR_DB
 * 用法: node scripts/extract-star-db.mjs [path-to-chart-prod.js]
 */
import fs from 'fs';
import path from 'path';

const input = process.argv[2] || '/tmp/chart-prod.js';
if (!fs.existsSync(input)) {
  console.error('Missing bundle:', input);
  process.exit(1);
}

const s = fs.readFileSync(input, 'utf8');

function extractBalanced(str, openIdx) {
  let depth = 0, inStr = false, quote = '', esc = false;
  for (let i = openIdx; i < str.length; i++) {
    const c = str[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === quote) inStr = false;
      continue;
    }
    if (c === "'" || c === '"') { inStr = true; quote = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return str.slice(openIdx, i + 1); }
  }
  return null;
}

const FIELD_MAP = {
  children: 'ziNv', move: 'qianYi', friends: 'jiaoYou', home: 'tianZhai',
  spirit: 'fuDe', parents: 'fuMu', family: 'xiongDi',
};

const hits = [];
let pos = 0;
while (true) {
  const i = s.indexOf('{紫微:{male:{', pos);
  if (i < 0) break;
  hits.push(i);
  pos = i + 1;
}

const merged = {};
for (const idx of hits) {
  const raw = extractBalanced(s, idx);
  const fm = raw.match(/male:\{(\w+):'/);
  const srcField = fm?.[1];
  const dstField = FIELD_MAP[srcField];
  if (!dstField) continue;
  const chunk = (new Function(`return ${raw}`))();
  for (const [star, genders] of Object.entries(chunk)) {
    if (!merged[star]) merged[star] = {};
    merged[star][dstField] = {
      male: genders.male?.[srcField] ?? '',
      female: genders.female?.[srcField] ?? '',
    };
  }
}

const xi = s.indexOf('X={紫微:');
const comboRaw = extractBalanced(s, xi + 2);
const combo = comboRaw ? (new Function(`return ${comboRaw}`))() : {};

const outPath = path.join(process.cwd(), 'lib/ziwei/star-db.generated.ts');
const out = `// AUTO-GENERATED — run: node scripts/extract-star-db.mjs
// 7/13 topics from client bundle; mingGong/fuQi/guanLu/caiBo/jiE/personality are server-only on production

export type GenderedText = { male: string; female: string };

export type StarDbEntry = Partial<Record<
  'ziNv' | 'qianYi' | 'jiaoYou' | 'tianZhai' | 'fuDe' | 'fuMu' | 'xiongDi',
  GenderedText
>>;

export const STAR_DB: Record<string, StarDbEntry> = ${JSON.stringify(merged, null, 2)};

export const COMBO_STAR_DB: Record<string, Record<string, string>> = ${JSON.stringify(combo, null, 2)};
`;

fs.writeFileSync(outPath, out);
console.log('Wrote', outPath, 'stars:', Object.keys(merged).length, 'combo:', Object.keys(combo).length);
