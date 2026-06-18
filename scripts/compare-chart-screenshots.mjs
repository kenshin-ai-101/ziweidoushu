#!/usr/bin/env node
/**
 * Capture production vs local chart page screenshots for visual diff.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'layout-capture');
mkdirSync(OUT_DIR, { recursive: true });

const CHART_URL =
  '/chart?y=1986&m=9&d=7&u=1&p=%E6%B5%99%E6%B1%9F%E7%9C%81&c=%E5%8F%B0%E5%B7%9E&lo=121.4&g=m';

const TARGETS = [
  { name: 'production', base: 'https://wdyziweidoushu666.com' },
  { name: 'local', base: 'http://localhost:3100' },
];

async function capture(name, base, width, height) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height } });
  const url = base + CHART_URL;

  await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(5000);

  const shot = join(OUT_DIR, `${name}-${width}x${height}.png`);
  await page.screenshot({ path: shot, fullPage: false });

  const metrics = await page.evaluate(() => {
    const pick = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        top: Math.round(r.top),
        left: Math.round(r.left),
        display: cs.display,
        gridCols: cs.gridTemplateColumns,
        fontSize: cs.fontSize,
        fontFamily: cs.fontFamily,
        bg: cs.backgroundColor,
        color: cs.color,
        padding: cs.padding,
      };
    };

    const buttons = [...document.querySelectorAll('button, [role="tab"]')]
      .map((el) => el.textContent?.trim())
      .filter((t) => t && t.length < 20);

    return {
      url: location.href,
      title: document.title,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      htmlDataTheme: document.documentElement.getAttribute('data-theme'),
      topbar: pick('.chart-topbar, header'),
      workspace: pick('.chart-workspace'),
      left: pick('.chart-workspace-left'),
      right: pick('.chart-workspace-right'),
      insight: pick('.insight-panel-root'),
      grid: pick('.chart-board--production .grid, .grid.rounded-xl'),
      buttons: buttons.slice(0, 50),
      hasProLock: !!document.body.innerText.match(/专业版|🔒|解锁/),
    };
  });

  await browser.close();
  return { shot, metrics };
}

const results = {};
for (const t of TARGETS) {
  results[t.name] = {
    desktop: await capture(t.name, t.base, 1440, 900),
    mobile: await capture(t.name, t.base, 390, 844),
  };
}

console.log(JSON.stringify(results, null, 2));
