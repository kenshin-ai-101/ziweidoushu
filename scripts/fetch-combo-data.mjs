#!/usr/bin/env node
/**
 * 从生产环境抓取 24 组双星同宫 combo 页内容
 * URL: https://wdyziweidoushu666.com/knowledge/combo/{slug}
 */
import fs from 'fs';
import path from 'path';

const BASE = 'https://wdyziweidoushu666.com';

const COMBO_SLUGS = [
  'ziwei-tianfu', 'ziwei-tianxiang', 'ziwei-tanlang', 'ziwei-qisha', 'ziwei-pojun',
  'tianji-taiyin', 'tianji-jumen', 'tianji-tianliang',
  'taiyang-taiyin', 'taiyang-jumen', 'taiyang-tianliang',
  'wuqu-tianfu', 'wuqu-tanlang', 'wuqu-tianxiang', 'wuqu-qisha', 'wuqu-pojun',
  'tiantong-taiyin', 'tiantong-jumen', 'tiantong-tianliang',
  'lianzhen-tianfu', 'lianzhen-tanlang', 'lianzhen-tianxiang', 'lianzhen-qisha', 'lianzhen-pojun',
];

const TOPICS = ['mingGong', 'fuQi', 'guanLu', 'caiBo'];

function stripHtml(chunk) {
  return chunk
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--.*?-->/g, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sectionText(block, startLabel, endLabel) {
  const start = block.indexOf(startLabel);
  if (start < 0) return '';
  const from = start + startLabel.length;
  const end = endLabel ? block.indexOf(endLabel, from) : block.length;
  let chunk = block.slice(from, end < 0 ? block.length : end);
  return stripHtml(chunk).trim();
}

function parseTopicBlock(html, topic, nextTopic) {
  const start = html.indexOf(`id="${topic}"`);
  if (start < 0) return null;
  const end = nextTopic ? html.indexOf(`id="${nextTopic}"`, start + 1) : html.indexOf('想看你命盘中有没有', start);
  const block = html.slice(start, end < 0 ? html.length : end);
  const dingdiao = sectionText(block, '一句话定调', '核心论断');
  const lundian = sectionText(block, '核心论断', '命盘依据');
  const yiju = sectionText(block, '命盘依据', '经典出处');
  let chuchu = sectionText(block, '经典出处', '');
  chuchu = chuchu.replace(/\n<div[\s\S]*$/i, '').trim();
  if (!dingdiao && !lundian) return null;
  return { dingdiao, lundian, yiju, chuchu };
}

function parseComboPage(html) {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
  const h1Match = html.match(/letter-spacing:0\.1em;line-height:1\.2">([^<]+)</);
  const briefMatch = html.match(/lineHeight:1\.8[^>]*>([^<]{8,120})</);

  const topics = {};
  for (let i = 0; i < TOPICS.length; i++) {
    const topic = TOPICS[i];
    const next = TOPICS[i + 1];
    const block = parseTopicBlock(html, topic, next);
    if (block) topics[topic] = block;
  }

  return {
    title: titleMatch?.[1] ?? '',
    description: descMatch?.[1] ?? '',
    name: h1Match?.[1]?.trim() ?? '',
    brief: briefMatch?.[1]?.trim() ?? '',
    topics,
  };
}

async function fetchCombo(slug) {
  const url = `${BASE}/knowledge/combo/${slug}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return parseComboPage(await res.text());
}

async function main() {
  const registryPath = path.join(process.cwd(), 'lib/seo/combo-registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const data = {};
  for (const slug of COMBO_SLUGS) {
    process.stdout.write(`fetch ${slug}... `);
    const parsed = await fetchCombo(slug);
    const reg = registry.find(r => r.slug === slug);
    const stars = reg?.searchText?.split(' ').slice(1, 3) ?? slug.split('-').map(s => s);
    data[slug] = {
      slug,
      name: reg?.name ?? parsed.name,
      palace: reg?.palace ?? '',
      brief: reg?.brief ?? parsed.brief,
      stars,
      searchText: reg?.searchText ?? '',
      topics: parsed.topics,
    };
    console.log('ok', Object.keys(parsed.topics).length, 'topics');
    await new Promise(r => setTimeout(r, 150));
  }
  const entries = Object.values(data);
  const outPath = path.join(process.cwd(), 'lib/seo/combo-data.generated.ts');
  fs.writeFileSync(
    outPath,
    `// AUTO-GENERATED — node scripts/fetch-combo-data.mjs\n\nexport type ComboTopicKey = 'mingGong' | 'fuQi' | 'guanLu' | 'caiBo';\n\nexport interface ComboTopicContent {\n  dingdiao: string;\n  lundian: string;\n  yiju: string;\n  chuchu: string;\n}\n\nexport interface ComboEntry {\n  slug: string;\n  name: string;\n  palace: string;\n  brief: string;\n  stars: [string, string];\n  searchText: string;\n  topics: Partial<Record<ComboTopicKey, ComboTopicContent>>;\n}\n\nexport const COMBO_REGISTRY: ComboEntry[] = ${JSON.stringify(entries, null, 2)};\n\nexport const COMBO_BY_SLUG: Record<string, ComboEntry> = Object.fromEntries(COMBO_REGISTRY.map(c => [c.slug, c]));\n`,
  );
  console.log('Wrote', outPath, entries.length, 'combos');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
