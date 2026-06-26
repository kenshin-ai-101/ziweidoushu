#!/usr/bin/env node
/**
 * 从生产 chart 页 bundle 提取星曜 archetype（e9/te）数据
 * 用法: node scripts/extract-star-archetype.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const bundlePath = path.resolve('.tmp-prod-chart-page.js');
const source = fs.readFileSync(bundlePath, 'utf8');

function extractObject(name) {
  const start = source.indexOf(`${name}={`);
  if (start < 0) throw new Error(`missing ${name}`);
  let depth = 0;
  for (let i = start + name.length + 1; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') {
      depth--;
      if (depth === 0) {
        return Function(`return ${source.slice(start + name.length + 1, i + 1)}`)();
      }
    }
  }
  throw new Error(`unclosed ${name}`);
}

const STAR_ARCHETYPES = extractObject('e9');
const STAR_ARCHETYPE_BRIGHTNESS = extractObject('te');
const CHART_SYSTEM_NOTES = extractObject('tt');
const CHART_SIHUA_NOTES = extractObject('ta');

const out = `// AUTO-GENERATED from .tmp-prod-chart-page.js (production star archetype system)
// Run: node scripts/extract-star-archetype.mjs

export interface StarArchetype {
  star: string;
  alias: string;
  gist: string;
  advantage: string;
  relation: string;
  growth: string;
}

export interface StarArchetypeBrightnessVariant {
  advantage: string;
  relation: string;
  growth: string;
}

export const STAR_ARCHETYPES: Record<string, StarArchetype> = ${JSON.stringify(STAR_ARCHETYPES, null, 2)};

export const STAR_ARCHETYPE_BRIGHTNESS: Record<string, {
  bright?: StarArchetypeBrightnessVariant;
  dim?: StarArchetypeBrightnessVariant;
}> = ${JSON.stringify(STAR_ARCHETYPE_BRIGHTNESS, null, 2)};

export const CHART_SYSTEM_NOTES: Record<string, string> = ${JSON.stringify(CHART_SYSTEM_NOTES, null, 2)};

export const CHART_SIHUA_NOTES: Record<string, string> = ${JSON.stringify(CHART_SIHUA_NOTES, null, 2)};
`;

fs.writeFileSync(path.resolve('lib/ziwei/star-archetype.generated.ts'), out);
console.log(`✓ wrote ${Object.keys(STAR_ARCHETYPES).length} star archetypes`);
