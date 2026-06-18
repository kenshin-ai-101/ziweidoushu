#!/usr/bin/env node
/**
 * One-off automation: fill chart form and capture layout screenshots.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'layout-capture');
mkdirSync(OUT_DIR, { recursive: true });

const URL = 'https://wdyziweidoushu666.com/chart';

async function fillAndSubmit(page) {
  await page.locator('select').nth(0).selectOption('1990');
  await page.locator('select').nth(1).selectOption({ label: '5 月' });
  await page.locator('select').nth(2).selectOption({ label: '15 日' });
  await page.locator('select').nth(3).selectOption({ label: '08 时' });

  await page.getByRole('button', { name: /选择出生地/ }).click();
  await page.waitForTimeout(400);
  await page.getByText('北京', { exact: true }).first().click();
  await page.waitForTimeout(300);

  const maleBtn = page.getByRole('button', { name: '♂ 男' });
  if ((await maleBtn.getAttribute('aria-pressed')) !== 'true') {
    await maleBtn.click();
  }

  await page.getByRole('button', { name: /立即起盘/ }).click();
  await page.waitForSelector('[data-testid="chart-workspace"], .chart-workspace, [class*="ChartWorkspace"]', {
    timeout: 60000,
  }).catch(async () => {
    await page.waitForTimeout(8000);
  });
}

async function extractLayoutCSS(page) {
  return page.evaluate(() => {
    const pick = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        selector: sel,
        width: Math.round(r.width),
        height: Math.round(r.height),
        left: Math.round(r.left),
        top: Math.round(r.top),
        display: cs.display,
        gridTemplateColumns: cs.gridTemplateColumns,
        flexDirection: cs.flexDirection,
        gap: cs.gap,
        padding: cs.padding,
        background: cs.backgroundColor,
        color: cs.color,
        borderRadius: cs.borderRadius,
        fontSize: cs.fontSize,
      };
    };

    const allText = (sel) =>
      [...document.querySelectorAll(sel)].map((el) => ({
        text: el.textContent?.trim().slice(0, 40),
        classes: el.className,
        locked: !!el.querySelector('[class*="lock"], svg, [aria-label*="锁"]'),
        pro: /pro|vip|会员|🔒|锁/i.test(el.textContent || ''),
      }));

    const candidates = [
      'header',
      '[class*="topBar"]',
      '[class*="TopBar"]',
      '[class*="workspace"]',
      '[class*="Workspace"]',
      '[class*="chart-grid"]',
      '[class*="ChartGrid"]',
      '[class*="insight"]',
      '[class*="Insight"]',
      '[class*="topic"]',
      '[class*="Topic"]',
      '[class*="flip"]',
      '[class*="Flip"]',
    ];

    const found = {};
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el) found[sel] = pick(sel);
    }

    const tabs = [...document.querySelectorAll('button, [role="tab"], a')]
      .filter((el) => el.textContent && el.textContent.trim().length < 20)
      .slice(0, 40)
      .map((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          text: el.textContent.trim(),
          top: Math.round(r.top),
          left: Math.round(r.left),
          width: Math.round(r.width),
          height: Math.round(r.height),
          bg: cs.backgroundColor,
          color: cs.color,
          borderRadius: cs.borderRadius,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          padding: cs.padding,
        };
      });

    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const root = document.querySelector('#main-content, main, [class*="workspace"]');

    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      bodyBg,
      found,
      tabs,
      url: location.href,
      title: document.title,
      htmlClasses: document.documentElement.className,
    };
  });
}

async function runViewport(name, width, height) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await fillAndSubmit(page);
  await page.waitForTimeout(3000);

  const shot = join(OUT_DIR, `${name}-workspace.png`);
  await page.screenshot({ path: shot, fullPage: false });

  const css = await extractLayoutCSS(page);
  css.screenshot = shot;

  await browser.close();
  return css;
}

const desktop = await runViewport('desktop-1440', 1440, 900);
const mobile = await runViewport('mobile-390', 390, 844);

console.log(JSON.stringify({ desktop, mobile }, null, 2));
