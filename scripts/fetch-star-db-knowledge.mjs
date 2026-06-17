#!/usr/bin/env node
/**
 * 从生产环境公开 SEO 知识页抓取 STAR_DB 六类（命宫/性格/夫妻/官禄/财帛/疾厄）
 * URL: https://wdyziweidoushu666.com/knowledge/{slug}/{topic}
 *
 * 用法: node scripts/fetch-star-db-knowledge.mjs
 * 合并: node scripts/fetch-star-db-knowledge.mjs --merge
 */
import fs from 'fs';
import path from 'path';

const BASE = 'https://wdyziweidoushu666.com';

const STAR_TO_SLUG = {
  紫微: 'ziwei', 天机: 'tianji', 太阳: 'taiyang', 武曲: 'wuqu', 天同: 'tiantong',
  廉贞: 'lianzhen', 天府: 'tianfu', 太阴: 'taiyin', 贪狼: 'tanlang', 巨门: 'jumen',
  天相: 'tianxiang', 天梁: 'tianliang', 七杀: 'qisha', 破军: 'pojun',
};

const TOPIC_TO_FIELD = {
  overview: 'mingGong',
  personality: 'personality',
  love: 'fuQi',
  career: 'guanLu',
  wealth: 'caiBo',
  health: 'jiE',
};

function stripHtml(chunk) {
  return chunk
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function sectionText(html, startLabel, endLabel) {
  const start = html.indexOf(startLabel);
  if (start < 0) return '';
  const from = start + startLabel.length;
  const end = endLabel ? html.indexOf(endLabel, from) : html.length;
  let chunk = html.slice(from, end < 0 ? html.length : end);
  // drop heading duplicate
  chunk = chunk.replace(new RegExp(`^\\s*${startLabel}\\s*`), '');
  let text = stripHtml(chunk);
  // trim CTA / footer noise
  for (const stop of ['想看你自己命盘', '立即起盘', '的其他宫位解读', '同主星其他']) {
    const i = text.indexOf(stop);
    if (i > 80) text = text.slice(0, i).trim();
  }
  return text;
}

function parseKnowledgePage(html) {
  const dingdiao = sectionText(html, '一句话定调', '核心论断');
  const lundian = sectionText(html, '核心论断', '命盘依据');
  const yiju = sectionText(html, '命盘依据', '经典出处');
  const chuchu = sectionText(html, '经典出处', '想看你自己命盘');
  if (!dingdiao && !lundian) return null;
  return `**【一句话定调】**\n${dingdiao}\n\n**【核心论断】**\n${lundian}\n\n**【命盘依据】**\n${yiju}\n\n**【经典出处】**\n${chuchu}`;
}

async function fetchPage(slug, topic) {
  const url = `${BASE}/knowledge/${slug}/${topic}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

async function scrapeAll() {
  const out = {};
  for (const [star, slug] of Object.entries(STAR_TO_SLUG)) {
    out[star] = {};
    for (const [topic, field] of Object.entries(TOPIC_TO_FIELD)) {
      process.stderr.write(`fetch ${star} ${field}... `);
      const html = await fetchPage(slug, topic);
      const text = parseKnowledgePage(html);
      if (!text) {
        process.stderr.write('MISS\n');
        continue;
      }
      // 知识页为默认男命口径；女命暂无独立页，先与男命同文
      out[star][field] = { male: text, female: text };
      process.stderr.write('ok\n');
      await new Promise(r => setTimeout(r, 120));
    }
  }
  return out;
}

function loadExistingGenerated() {
  const p = path.join(process.cwd(), 'lib/ziwei/star-db.generated.ts');
  const src = fs.readFileSync(p, 'utf8');
  const m = src.match(/export const STAR_DB[^=]*=\s*(\{[\s\S]*\});\s*\n\s*export const COMBO/);
  if (!m) throw new Error('Could not parse existing star-db.generated.ts');
  return new Function(`return ${m[1]}`)();
}

function writeGenerated(merged, combo) {
  const fields = [
    'mingGong', 'personality', 'fuQi', 'guanLu', 'caiBo', 'jiE',
    'xiongDi', 'ziNv', 'qianYi', 'jiaoYou', 'tianZhai', 'fuDe', 'fuMu',
  ];
  const outPath = path.join(process.cwd(), 'lib/ziwei/star-db.generated.ts');
  const out = `// AUTO-GENERATED — bundle (7 topics) + knowledge pages (6 topics)
// Run: node scripts/extract-star-db.mjs && node scripts/fetch-star-db-knowledge.mjs --merge

export type GenderedText = { male: string; female: string };

export type StarDbEntry = Partial<Record<
  ${fields.map(f => `'${f}'`).join(' | ')},
  GenderedText
>>;

export const STAR_DB: Record<string, StarDbEntry> = ${JSON.stringify(merged, null, 2)};

export const COMBO_STAR_DB: Record<string, Record<string, string>> = ${JSON.stringify(combo, null, 2)};
`;
  fs.writeFileSync(outPath, out);
  console.log('Wrote', outPath);
}

async function main() {
  const merge = process.argv.includes('--merge');
  const scraped = await scrapeAll();
  const outJson = path.join(process.cwd(), 'lib/ziwei/star-db-knowledge-scraped.json');
  fs.writeFileSync(outJson, JSON.stringify(scraped, null, 2));
  console.log('Wrote', outJson);

  if (!merge) {
    console.log('Run with --merge to update lib/ziwei/star-db.generated.ts');
    return;
  }

  const existing = loadExistingGenerated();
  const comboMatch = fs.readFileSync(path.join(process.cwd(), 'lib/ziwei/star-db.generated.ts'), 'utf8')
    .match(/export const COMBO_STAR_DB[^=]*=\s*(\{[\s\S]*\});/);
  const combo = comboMatch ? new Function(`return ${comboMatch[1]}`)() : {};

  const merged = { ...existing };
  for (const [star, fields] of Object.entries(scraped)) {
    merged[star] = { ...(merged[star] || {}), ...fields };
  }
  writeGenerated(merged, combo);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
