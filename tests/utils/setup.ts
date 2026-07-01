import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export const IS_BASELINE = process.env.BASELINE === 'true';

export function pathFor(p: string): string {
  return p;
}

export async function goto(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  try {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch {
    // some sites never reach networkidle (streaming, long-polling)
  }
}

export async function hideDynamicContent(page: Page): Promise<void> {
  const selectors = [
    '.tiktok-embed',
    '.cf-turnstile',
    '#turnstile-wrapper',
    '[data-turnstile]',
    'iframe[src*="tiktok"]',
    'iframe[src*="turnstile"]',
  ];
  for (const selector of selectors) {
    const els = page.locator(selector);
    const count = await els.count();
    for (let i = 0; i < count; i++) {
      await els.nth(i).evaluate((el: HTMLElement) => {
        el.style.visibility = 'hidden';
      });
    }
  }
}

const BASELINE_DIR = path.resolve(process.cwd(), 'tests/baseline/data');

export interface PageContent {
  url: string;
  title: string;
  metaDescription: string;
  h1s: string[];
  h2s: string[];
  h3s: string[];
  mainText: string;
}

export async function extractContent(page: Page): Promise<PageContent> {
  return page.evaluate(() => {
    const metaDesc = document.querySelector('meta[name="description"]');
    const clone = document.body?.cloneNode(true) as HTMLElement;
    if (clone) {
      clone.querySelectorAll('script, style, noscript, iframe, svg, .chaty, .chaty-widget, [class*="chaty"], [id*="chaty"]').forEach(el => el.remove());
    }
    return {
      url: window.location.href,
      title: document.title,
      metaDescription: metaDesc?.getAttribute('content') || '',
      h1s: Array.from(clone?.querySelectorAll('h1') || []).map(h => h.textContent?.trim() || ''),
      h2s: Array.from(clone?.querySelectorAll('h2') || []).map(h => h.textContent?.trim() || ''),
      h3s: Array.from(clone?.querySelectorAll('h3') || []).map(h => h.textContent?.trim() || ''),
      mainText: (clone?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
}

export async function saveBaseline(name: string, content: PageContent): Promise<void> {
  await fs.promises.mkdir(BASELINE_DIR, { recursive: true });
  const filePath = path.join(BASELINE_DIR, `${name}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(content, null, 2), 'utf-8');
}

export async function loadBaseline(name: string): Promise<PageContent> {
  const filePath = path.join(BASELINE_DIR, `${name}.json`);
  const data = await fs.promises.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

export async function verifyContent(current: PageContent, name: string): Promise<void> {
  const baseline = await loadBaseline(name);

  expect(current.title, `[${name}] title mismatch`).toBe(baseline.title);
  expect(current.metaDescription, `[${name}] meta description mismatch`).toBe(baseline.metaDescription);
}
