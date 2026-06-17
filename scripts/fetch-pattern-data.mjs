#!/usr/bin/env node
/**
 * 从生产环境抓取 37 种古典格局 pattern 页内容
 * URL: https://wdyziweidoushu666.com/knowledge/pattern/{slug}
 */
import fs from 'fs';
import path from 'path';

const BASE = 'https://wdyziweidoushu666.com';

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

function parsePatternPage(html) {
  const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
  const h1Match = html.match(/letter-spacing:0\.1em;line-height:1\.2">([^<]+)</);

  const articleStart = html.indexOf('<article');
  const articleEnd = html.indexOf('</article>', articleStart);
  const article = articleStart >= 0 ? html.slice(articleStart, articleEnd) : html;

  const headerEnd = article.indexOf('一句话定调');
  const header = headerEnd > 0 ? article.slice(0, headerEnd) : article;

  const linkedStars = [];
  for (const m of header.matchAll(/href="\/knowledge\/([^/]+)\/overview"[^>]*>([^<]*(?:<!-- -->)?[^<]*)</g)) {
    const slug = m[1];
    const name = m[2].replace(/<!-- -->/g, '').replace(/星$/, '').trim();
    if (!linkedStars.some(s => s.slug === slug)) {
      linkedStars.push({ slug, name: name || slug });
    }
  }

  const auxiliaryStars = [];
  const badgeBlock = header.match(/<\/h1>[\s\S]*?<\/header>/);
  if (badgeBlock) {
    for (const m of badgeBlock[0].matchAll(/<span[^>]*>([^<]+)<\/span>/g)) {
      const text = m[1].trim();
      if (text && !auxiliaryStars.includes(text)) auxiliaryStars.push(text);
    }
  }

  const relatedStars = [];
  const relatedStart = article.indexOf('涉及星曜的详细知识');
  if (relatedStart >= 0) {
    const relatedBlock = article.slice(relatedStart, relatedStart + 2000);
    for (const m of relatedBlock.matchAll(/href="\/knowledge\/([^/]+)\/overview"[^>]*>([^<]*(?:<!-- -->)?[^<]*)</g)) {
      const slug = m[1];
      const name = m[2].replace(/<!-- -->/g, '').replace(/星 · 全面解读 →/g, '').replace(/星$/, '').trim();
      if (!relatedStars.some(s => s.slug === slug)) {
        relatedStars.push({ slug, name: name || slug });
      }
    }
  }

  const contentEnd = article.indexOf('想看你命盘有没有');
  const contentBlock = contentEnd > 0 ? article.slice(0, contentEnd) : article;

  const dingdiao = sectionText(contentBlock, '一句话定调', '核心论断');
  const lundian = sectionText(contentBlock, '核心论断', '命盘依据');
  const yiju = sectionText(contentBlock, '命盘依据', '经典出处');
  let chuchu = sectionText(contentBlock, '经典出处', '涉及星曜的详细知识');
  if (!chuchu) chuchu = sectionText(contentBlock, '经典出处', '');
  chuchu = chuchu.replace(/\n<div[\s\S]*$/i, '').trim();

  return {
    name: h1Match?.[1]?.trim() ?? '',
    brief: descMatch?.[1]?.trim() ?? dingdiao,
    linkedStars,
    auxiliaryStars,
    relatedStars,
    content: { dingdiao, lundian, yiju, chuchu },
  };
}

async function fetchPattern(slug) {
  const url = `${BASE}/knowledge/pattern/${slug}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return parsePatternPage(await res.text());
}

async function main() {
  const registryPath = path.join(process.cwd(), 'lib/seo/pattern-registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const entries = [];

  for (const reg of registry) {
    process.stdout.write(`fetch ${reg.slug}... `);
    const parsed = await fetchPattern(reg.slug);
    entries.push({
      slug: reg.slug,
      name: reg.name,
      meta: reg.meta,
      searchText: reg.searchText,
      level: reg.level,
      group: reg.group,
      groupLabel: reg.groupLabel,
      brief: parsed.brief,
      linkedStars: parsed.linkedStars,
      auxiliaryStars: parsed.auxiliaryStars,
      relatedStars: parsed.relatedStars.length ? parsed.relatedStars : parsed.linkedStars,
      content: parsed.content,
    });
    console.log('ok');
    await new Promise(r => setTimeout(r, 120));
  }

  const outPath = path.join(process.cwd(), 'lib/seo/pattern-data.generated.ts');
  fs.writeFileSync(
    outPath,
    `// AUTO-GENERATED — node scripts/fetch-pattern-data.mjs\n\nexport interface PatternStarLink {\n  slug: string;\n  name: string;\n}\n\nexport interface PatternContent {\n  dingdiao: string;\n  lundian: string;\n  yiju: string;\n  chuchu: string;\n}\n\nexport interface PatternEntry {\n  slug: string;\n  name: string;\n  meta: string;\n  searchText: string;\n  level: string;\n  group: string;\n  groupLabel: string;\n  brief: string;\n  linkedStars: PatternStarLink[];\n  auxiliaryStars: string[];\n  relatedStars: PatternStarLink[];\n  content: PatternContent;\n}\n\nexport const PATTERN_REGISTRY: PatternEntry[] = ${JSON.stringify(entries, null, 2)};\n\nexport const PATTERN_BY_SLUG: Record<string, PatternEntry> = Object.fromEntries(PATTERN_REGISTRY.map(p => [p.slug, p]));\n`,
  );
  console.log('Wrote', outPath, entries.length, 'patterns');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
