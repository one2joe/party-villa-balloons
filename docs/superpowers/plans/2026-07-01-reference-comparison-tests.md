# Reference Comparison Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create Playwright tests that compare every page of the local Astro site against the WordPress reference site at detailed structural/content/visual level, saving reference baselines from `https://xn--12cmal7ftbft4d7etb1fxav2ej.com`

**Architecture:** One new utility file (`reference.ts`) handles data extraction, baseline save/load, and comparison. One new spec file (`reference.spec.ts`) drives 18 test cases (6 pages × 3 viewports). Reference baselines stored in `tests/baseline/reference/`.

**Tech Stack:** Playwright, TypeScript, JSON baselines

---

### Task 1: Create reference.ts — data extraction utility

**Files:**
- Create: `tests/utils/reference.ts`

- [ ] **Step 1: Define ReferenceData interface and constants**

```typescript
import { Page } from '@playwright/test';

export const REFERENCE_BASE = 'https://xn--12cmal7ftbft4d7etb1fxav2ej.com';

export const REFERENCE_PATHS: Record<string, string> = {
  '/': '/',
  '/เกี่ยวกับเรา/': '/about-us/',
  '/บริการ/': '/our-services/',
  '/ผลงาน/': '/gallery/',
  '/บทความ/': '/blog/',
  '/ติดต่อเรา/': '/contact-us/',
};

export function localToReferencePath(localPath: string): string {
  if (localPath === '/') return '/';
  const match = Object.entries(REFERENCE_PATHS).find(([thai]) => localPath.startsWith(thai));
  if (match) {
    const [thai, eng] = match;
    return localPath === thai ? eng : localPath;
  }
  return localPath;
}

export const isReferenceMode = () => process.env.REFERENCE === 'true';

export interface ReferenceData {
  url: string;
  title: string;
  metaDescription: string;
  headings: { level: number; text: string }[];
  navLinks: { text: string; href: string }[];
  socialLinks: { platform: string; url: string }[];
  hasHero: boolean;
  heroStyles: { backgroundColor: string | null; backgroundImage: string | null };
  sections: { tagName: string; classList: string[]; childCount: number }[];
  images: { src: string; alt: string; width: number; height: number }[];
  buttons: { text: string; iconClasses: string[]; href: string | null }[];
  hasFloatingWidget: boolean;
  floatingChannels: string[];
  tiktokEmbeds: { videoId: string }[];
  footerText: string;
  footerLinks: { text: string; href: string }[];
  mainText: string;
}
```

- [ ] **Step 2: Implement extractReferenceData**

```typescript
export async function extractReferenceData(page: Page): Promise<ReferenceData> {
  return page.evaluate(() => {
    const metaDesc = document.querySelector('meta[name="description"]');

    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map(h => ({ level: parseInt(h.tagName[1]), text: h.textContent?.trim() || '' }));

    const navLinks = Array.from(document.querySelectorAll('nav a, .nav a, .header a[href]'))
      .filter(a => a.textContent?.trim())
      .map(a => ({ text: a.textContent!.trim(), href: (a as HTMLAnchorElement).href }));

    const socialLinks: { platform: string; url: string }[] = [];
    const socialEl = document.querySelector('.social-icons, .follow-icons');
    if (socialEl) {
      socialEl.querySelectorAll('a[href]').forEach(a => {
        const href = (a as HTMLAnchorElement).href;
        const classes = a.className || '';
        let platform = '';
        if (classes.includes('facebook')) platform = 'facebook';
        else if (classes.includes('instagram')) platform = 'instagram';
        else if (classes.includes('tiktok')) platform = 'tiktok';
        else if (classes.includes('line')) platform = 'line';
        else if (href.includes('facebook')) platform = 'facebook';
        else if (href.includes('instagram')) platform = 'instagram';
        else if (href.includes('tiktok')) platform = 'tiktok';
        else if (href.includes('line.me')) platform = 'line';
        if (platform) socialLinks.push({ platform, url: href });
      });
    }

    const hero = document.querySelector('.banner, .hero, [class*="hero"]');
    const hasHero = !!hero;
    let heroStyles = { backgroundColor: null as string | null, backgroundImage: null as string | null };
    if (hero) {
      const cs = getComputedStyle(hero);
      heroStyles = {
        backgroundColor: cs.backgroundColor,
        backgroundImage: cs.backgroundImage && cs.backgroundImage !== 'none' ? cs.backgroundImage : null,
      };
    }

    const sections = Array.from(document.querySelectorAll('section, .section, .row, .col'))
      .slice(0, 50)
      .map(el => ({
        tagName: el.tagName.toLowerCase(),
        classList: Array.from(el.classList),
        childCount: el.children.length,
      }));

    const images = Array.from(document.querySelectorAll('img[src]'))
      .filter(img => {
        const src = (img as HTMLImageElement).src;
        return src.startsWith('http') && !src.includes('svg+xml');
      })
      .slice(0, 30)
      .map(img => ({
        src: (img as HTMLImageElement).src,
        alt: (img as HTMLImageElement).alt || '',
        width: (img as HTMLImageElement).naturalWidth || 0,
        height: (img as HTMLImageElement).naturalHeight || 0,
      }));

    const buttons = Array.from(document.querySelectorAll('a.button, button, [class*="button"]'))
      .slice(0, 20)
      .map(btn => {
        const el = btn as HTMLElement;
        const iconClasses = Array.from(el.querySelectorAll('i, svg'))
          .flatMap(icon => Array.from(icon.classList));
        return {
          text: el.textContent?.trim() || '',
          iconClasses,
          href: (el as HTMLAnchorElement).href || null,
        };
      });

    const hasFloatingWidget = !!document.querySelector('.chaty-widget, [id^="chaty"], [class*="chaty"]');
    const floatEl = document.querySelector('[class*="chaty"]');
    let floatingChannels: string[] = [];
    if (floatEl) {
      const html = floatEl.innerHTML;
      const channelMatches = html.match(/"channel_type":"(\w+)"/g);
      if (channelMatches) {
        floatingChannels = channelMatches.map(m => m.replace('"channel_type":"', '').replace('"', ''));
      }
    }

    const tiktokEmbeds = Array.from(document.querySelectorAll('.tiktok-embed[data-video-id]'))
      .map(el => ({ videoId: (el as HTMLElement).getAttribute('data-video-id') || '' }));

    const footer = document.querySelector('footer, .footer-wrapper');
    const footerText = footer?.textContent?.replace(/\s+/g, ' ').trim() || '';
    const footerLinks = footer
      ? Array.from(footer.querySelectorAll('a[href]'))
          .map(a => ({ text: a.textContent?.trim() || '', href: (a as HTMLAnchorElement).href }))
      : [];

    const mainText = (document.body?.textContent || '').replace(/\s+/g, ' ').trim();

    return {
      url: window.location.href,
      title: document.title,
      metaDescription: metaDesc?.getAttribute('content') || '',
      headings,
      navLinks,
      socialLinks,
      hasHero,
      heroStyles,
      sections,
      images,
      buttons,
      hasFloatingWidget,
      floatingChannels,
      tiktokEmbeds,
      footerText,
      footerLinks,
      mainText,
    };
  });
}
```

- [ ] **Step 3: Implement save, load, verify**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { expect } from '@playwright/test';

const BASELINE_DIR = path.resolve(process.cwd(), 'tests/baseline/reference');

export async function saveReferenceBaseline(pageName: string, viewport: string, data: ReferenceData): Promise<void> {
  await fs.promises.mkdir(BASELINE_DIR, { recursive: true });
  const filePath = path.join(BASELINE_DIR, `${pageName}.${viewport}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function loadReferenceBaseline(pageName: string, viewport: string): Promise<ReferenceData> {
  const filePath = path.join(BASELINE_DIR, `${pageName}.${viewport}.json`);
  const raw = await fs.promises.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

export async function verifyReferenceMatch(current: ReferenceData, baseline: ReferenceData, pageName: string, viewport: string): Promise<void> {
  const label = `[${pageName}/${viewport}]`;

  expect(current.title, `${label} title`).toBe(baseline.title);
  expect(current.metaDescription, `${label} meta description`).toBe(baseline.metaDescription);

  expect(current.headings, `${label} headings`).toEqual(baseline.headings);

  expect(current.socialLinks.sort((a, b) => a.platform.localeCompare(b.platform)),
    `${label} social links`).toEqual(baseline.socialLinks.sort((a, b) => a.platform.localeCompare(b.platform)));

  expect(current.hasHero, `${label} has hero`).toBe(baseline.hasHero);

  expect(current.hasFloatingWidget, `${label} floating widget`).toBe(baseline.hasFloatingWidget);
  if (current.hasFloatingWidget) {
    expect(current.floatingChannels.sort(), `${label} floating channels`).toEqual(baseline.floatingChannels.sort());
  }

  expect(current.tiktokEmbeds.length, `${label} tiktok count`).toBe(baseline.tiktokEmbeds.length);

  expect(current.buttons.length, `${label} button count`).toBe(baseline.buttons.length);
  for (let i = 0; i < Math.min(current.buttons.length, baseline.buttons.length); i++) {
    expect(current.buttons[i].text, `${label} button[${i}] text`).toBe(baseline.buttons[i].text);
  }

  expect(current.footerText, `${label} footer`).toBe(baseline.footerText);

  expect(current.images.length, `${label} image count`).toBe(baseline.images.length);
}
```

- [ ] **Step 4: Verify the file compiles**

Run: `npx tsc --noEmit tests/utils/reference.ts 2>&1 || npx playwright test --dry-run`

Expected: No type errors

---

### Task 2: Create reference.spec.ts — comparison tests

**Files:**
- Create: `tests/pages/reference.spec.ts`

- [ ] **Step 1: Write the page list and test skeleton**

```typescript
import { test } from '@playwright/test';
import {
  isReferenceMode, extractReferenceData, saveReferenceBaseline,
  loadReferenceBaseline, verifyReferenceMatch, REFERENCE_BASE,
  localToReferencePath,
} from '../utils/reference';
import { goto, hideDynamicContent } from '../utils/setup';
import { deployedUrl } from '../utils/paths';

interface PageDef {
  name: string;
  localPath: string;
}

const PAGES: PageDef[] = [
  { name: 'home', localPath: '/' },
  { name: 'about', localPath: '/เกี่ยวกับเรา/' },
  { name: 'services', localPath: '/บริการ/' },
  { name: 'portfolio', localPath: '/ผลงาน/' },
  { name: 'blog', localPath: '/บทความ/' },
  { name: 'contact', localPath: '/ติดต่อเรา/' },
];

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
```

- [ ] **Step 2: Write the test generation loop**

```typescript
for (const pageDef of PAGES) {
  test.describe(`${pageDef.name} page`, () => {
    const viewports: { name: string; width: number; height: number }[] = [
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 812 },
    ];

    for (const vp of viewports) {
      test(`${vp.name} — full comparison`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        if (isReferenceMode()) {
          const refPath = localToReferencePath(pageDef.localPath);
          const refUrl = `${REFERENCE_BASE}${refPath}`;
          await goto(page, refUrl);
          await hideDynamicContent(page);
          await sleep(1000);
          const data = await extractReferenceData(page);
          await saveReferenceBaseline(pageDef.name, vp.name, data);
        } else {
          const localUrl = pageDef.localPath;
          await goto(page, localUrl);
          await hideDynamicContent(page);
          await sleep(1000);
          const current = await extractReferenceData(page);
          const baseline = await loadReferenceBaseline(pageDef.name, vp.name);
          await verifyReferenceMatch(current, baseline, pageDef.name, vp.name);
        }
      });
    }
  });
}
```

- [ ] **Step 3: Run dry check**

Run: `npx playwright test tests/pages/reference.spec.ts --list`

Expected: Lists 18 tests (6 pages × 3 viewports)

---

### Task 3: Capture reference baselines

**Files:**
- Creates: `tests/baseline/reference/{page}.{viewport}.json` (18 files)

- [ ] **Step 1: Run reference capture**

Run: `$env:REFERENCE="true"; npx playwright test tests/pages/reference.spec.ts --reporter=list`

Expected: 18 passed (all in reference mode, saving baselines)

- [ ] **Step 2: Verify baseline files exist**

Run: `Get-ChildItem tests/baseline/reference/*.json`

Expected: 18 JSON files

---

### Task 4: Run comparison tests

- [ ] **Step 1: Run comparison against local Astro**

Run: `$env:REFERENCE="false"; npx playwright test tests/pages/reference.spec.ts --reporter=list`

Expected: 18 passed — all extracted data from local site matches reference baselines

---

### Task 5: Commit and push

- [ ] **Step 1: Stage and commit**

```bash
git add tests/utils/reference.ts tests/pages/reference.spec.ts tests/baseline/reference/
git add docs/superpowers/specs/2026-07-01-reference-comparison-tests.md
git commit -m "feat: add cross-site reference comparison tests (6 pages × 3 viewports)"
git push
```
