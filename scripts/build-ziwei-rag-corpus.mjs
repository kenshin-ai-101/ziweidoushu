#!/usr/bin/env node

import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { createHash } from 'node:crypto';
import { readdir } from 'node:fs/promises';

const DEFAULT_TOPICS = [
  'overview',
  'personality',
  'love',
  'career',
  'wealth',
  'health',
  'family',
  'children',
  'move',
  'friends',
  'home',
  'spirit',
  'parents',
];

const args = parseArgs(process.argv.slice(2));
const inputDir = args.input || 'data/ziwei-samples-toolkit/samples-out';
const outputPath = args.output || 'data/ziwei-rag-corpus/chunks.jsonl';
const topics = (args.topics ? args.topics.split(',') : DEFAULT_TOPICS).map(s => s.trim()).filter(Boolean);
const maxRecords = args['max-records'] ? Number(args['max-records']) : Infinity;
const minChars = args['min-chars'] ? Number(args['min-chars']) : 80;

if (!existsSync(inputDir)) {
  fail(`Input directory does not exist: ${inputDir}`);
}

mkdirSync(dirname(outputPath), { recursive: true });

const files = await listJsonlGz(inputDir);
const out = createWriteStream(outputPath, { encoding: 'utf8' });
const seen = new Set();

let recordsRead = 0;
let chunksWritten = 0;
let chunksSkippedDuplicate = 0;
let chunksSkippedShort = 0;

for (const file of files) {
  if (recordsRead >= maxRecords) break;

  const rl = createInterface({
    input: createReadStream(file).pipe(createGunzip()),
    crlfDelay: Infinity,
  });

  let lineNumber = 0;
  for await (const line of rl) {
    lineNumber += 1;
    if (recordsRead >= maxRecords) break;
    if (!line.trim()) continue;

    let sample;
    try {
      sample = JSON.parse(line);
    } catch (error) {
      console.warn(`[skip] ${file}:${lineNumber} invalid JSON: ${error.message}`);
      continue;
    }

    recordsRead += 1;
    const metadata = buildMetadata(sample);

    for (const topic of topics) {
      const text = sample.topics?.[topic];
      if (!text || text.length < minChars) {
        chunksSkippedShort += 1;
        continue;
      }

      const normalizedText = normalizeText(text);
      const id = sha256(`${topic}\n${normalizedText}`);
      if (seen.has(id)) {
        chunksSkippedDuplicate += 1;
        continue;
      }
      seen.add(id);

      const chunk = {
        id,
        source: {
          path: file,
          line: lineNumber,
        },
        topic,
        text: normalizedText,
        metadata: {
          ...metadata,
          fingerprint: buildFingerprint(metadata, topic),
        },
      };

      out.write(`${JSON.stringify(chunk)}\n`);
      chunksWritten += 1;
    }

    if (recordsRead % 10000 === 0) {
      console.error(`[progress] records=${recordsRead} chunks=${chunksWritten} duplicates=${chunksSkippedDuplicate}`);
    }
  }
}

await new Promise(resolve => out.end(resolve));

console.error(JSON.stringify({
  inputDir,
  outputPath,
  files: files.length,
  recordsRead,
  chunksWritten,
  chunksSkippedDuplicate,
  chunksSkippedShort,
}, null, 2));

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = 'true';
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

async function listJsonlGz(root) {
  const found = [];

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.jsonl.gz')) {
        found.push(fullPath);
      }
    }
  }

  await walk(root);
  return found.sort();
}

function buildMetadata(sample) {
  const chart = sample.chart || {};
  const birthInfo = sample.birthInfo || chart.birthInfo || {};
  const palaces = {};
  const sihua = [];

  for (const palace of chart.palaces || []) {
    const palaceStars = [];
    for (const star of palace.stars || []) {
      const encoded = [star.name, star.siHua || '', star.brightness || ''].join(':');
      palaceStars.push(encoded);
      if (star.siHua) {
        sihua.push(`${star.name}:${star.siHua}`);
      }
    }
    palaces[palace.name] = palaceStars;
  }

  const currentDaXian = Array.isArray(chart.daXians)
    ? chart.daXians[chart.currentDaXianIndex]
    : null;

  return {
    system: sample.system || '倪海厦紫微斗数',
    gender: birthInfo.gender || null,
    birthYear: birthInfo.year || null,
    birthMonth: birthInfo.month || null,
    birthDay: birthInfo.day || null,
    birthHour: birthInfo.hour ?? null,
    lunarYear: chart.lunarInfo?.lunarYear || null,
    lunarMonth: chart.lunarInfo?.lunarMonth || null,
    yearStem: chart.lunarInfo?.yearStem ?? null,
    yearBranch: chart.lunarInfo?.yearBranch ?? null,
    wuxingJu: chart.wuxingJu || null,
    wuxingJuName: chart.wuxingJuName || null,
    mingGongBranch: chart.mingGongBranch ?? null,
    shenGongBranch: chart.shenGongBranch ?? null,
    currentDaXian: currentDaXian
      ? `${currentDaXian.startAge}-${currentDaXian.endAge}:${currentDaXian.palaceName}`
      : null,
    palaces,
    sihua: Array.from(new Set(sihua)).sort(),
  };
}

function buildFingerprint(metadata, topic) {
  const parts = [
    `topic:${topic}`,
    metadata.gender ? `gender:${metadata.gender}` : null,
    metadata.wuxingJuName ? `wuxing:${metadata.wuxingJuName}` : null,
    metadata.currentDaXian ? `daxian:${metadata.currentDaXian}` : null,
  ];

  for (const palaceName of ['命宫', '身宫', '夫妻', '官禄', '财帛', '疾厄', '迁移', '福德']) {
    const stars = metadata.palaces?.[palaceName] || [];
    for (const star of stars) {
      const [name, hua] = star.split(':');
      if (!name) continue;
      parts.push(hua ? `${palaceName}:${name}:${hua}` : `${palaceName}:${name}`);
    }
  }

  return parts.filter(Boolean);
}

function normalizeText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
