import { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

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

export function isReferenceMode(): boolean {
  return process.env.REFERENCE === 'true';
}

export interface ReferenceData {
  title: string;
  metaDescription: string;
  headings: { level: number; text: string }[];
  navLinks: { text: string; href: string }[];
  socialLinks: { platform: string; url: string }[];
  hasHero: boolean;
  heroStyles: { backgroundColor: string | null; backgroundImage: string | null };
  sections: { tagName: string; classList: string[]; childCount: number }[];
  images: { fullSrc: string; alt: string }[];
  buttons: { text: string; iconClasses: string[]; href: string | null }[];
  hasFloatingWidget: boolean;
  floatingChannels: string[];
  tiktokEmbeds: { videoId: string }[];
  footerText: string;
  footerLinks: { text: string; href: string }[];
  mainText: string;
}

function urlPath(u: string): string {
  try { return decodeURIComponent(new URL(u).pathname); } catch { try { return decodeURIComponent(u); } catch { return u; } }
}

export async function extractReferenceData(page: Page): Promise<ReferenceData> {
  return page.evaluate(() => {
    const metaDesc = document.querySelector('meta[name="description"]');

    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map(h => ({ level: parseInt(h.tagName[1]), text: h.textContent?.trim() || '' }));

    const navLinks: { text: string; href: string }[] = [];
    const seenNav = new Set<string>();
    document.querySelectorAll('nav a[href], .nav a[href]').forEach(a => {
      const text = a.textContent?.trim();
      const href = (a as HTMLAnchorElement).href;
      const hrefPath = href.replace(/https?:\/\/[^/]+/, '');
      const key = text + '|' + hrefPath;
      if (text && href && !seenNav.has(key)) {
        seenNav.add(key);
        navLinks.push({ text, href });
      }
    });

    const socialLinks: { platform: string; url: string }[] = [];
    const socialEl = document.querySelector('.social-icons, .follow-icons');
    if (socialEl) {
      socialEl.querySelectorAll('a[href]').forEach(a => {
        const href = (a as HTMLAnchorElement).href;
        const cls = a.className || '';
        let platform = '';
        if (cls.includes('facebook')) platform = 'facebook';
        else if (cls.includes('instagram')) platform = 'instagram';
        else if (cls.includes('tiktok')) platform = 'tiktok';
        else if (href.includes('line.me')) platform = 'line';
        else if (cls.includes('line')) platform = 'line';
        if (platform) socialLinks.push({ platform, url: href });
      });
    }

    const hero = document.querySelector('.banner, .hero, section.hero, [class*="hero-banner"], [class*="hero-parallax"], section.hero-parallax');
    const hasHero = !!hero;
    let heroStyles = { backgroundColor: null as string | null, backgroundImage: null as string | null };
    if (hero) {
      const cs = getComputedStyle(hero);
      heroStyles = {
        backgroundColor: cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent' ? cs.backgroundColor : null,
        backgroundImage: cs.backgroundImage && cs.backgroundImage !== 'none' ? cs.backgroundImage : null,
      };
    }

    const sections = Array.from(document.querySelectorAll('body > div, section, .section, .row, main > *'))
      .filter(el => el.children.length > 0 && el.textContent?.trim())
      .slice(0, 50)
      .map(el => ({
        tagName: el.tagName.toLowerCase(),
        classList: Array.from(el.classList),
        childCount: el.children.length,
      }));

    const images: { fullSrc: string; alt: string }[] = [];
    document.querySelectorAll('img').forEach(img => {
      const realSrc = img.getAttribute('data-src') || img.getAttribute('src') || '';
      if (!realSrc || realSrc.startsWith('data:')) return;
      images.push({
        fullSrc: realSrc,
        alt: (img as HTMLImageElement).alt || '',
      });
    });

    function cleanTextContent(el: HTMLElement): string {
      const clone = el.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('style').forEach(s => s.remove());
      return clone.textContent?.trim() || '';
    }

    const buttons: { text: string; iconClasses: string[]; href: string | null }[] = [];
    document.querySelectorAll('a.button, button, [class*="button"]').forEach(btn => {
      const el = btn as HTMLElement;
      const text = cleanTextContent(el);
      if (!text && !el.querySelector('i, svg, img')) return;
      const iconClasses: string[] = [];
      el.querySelectorAll('i').forEach(i => iconClasses.push(...Array.from(i.classList)));
      el.querySelectorAll('svg').forEach(s => {
        const cls = s.getAttribute('class');
        if (cls) iconClasses.push(cls);
      });
      buttons.push({
        text,
        iconClasses,
        href: (el as HTMLAnchorElement).href || null,
      });
    });

    const floatEl = document.querySelector('.chaty-widget, [id^="chaty"], [class*="chaty"]');
    const hasFloatingWidget = !!floatEl;
    let floatingChannels: string[] = [];
    if (floatEl) {
      const html = floatEl.outerHTML;
      const matches = html.match(/"channel_type":"(\w+)"/g);
      if (matches) {
        floatingChannels = [...new Set(matches.map(m =>
          m.replace('"channel_type":"', '').replace('"', '')
        ))];
      }
    }

    const tiktokEmbeds = Array.from(document.querySelectorAll('.tiktok-embed[data-video-id]'))
      .map(el => ({ videoId: (el as HTMLElement).getAttribute('data-video-id') || '' }));

    const footer = document.querySelector('footer, .footer-wrapper');
    const footerText = footer ? (footer.textContent || '').replace(/\s+/g, ' ').trim() : '';
    const footerLinks: { text: string; href: string }[] = footer
      ? Array.from(footer.querySelectorAll('a[href]'))
          .filter(a => a.textContent?.trim())
          .map(a => ({ text: a.textContent!.trim(), href: (a as HTMLAnchorElement).href }))
      : [];

    const mainText = (document.body?.textContent || '').replace(/\s+/g, ' ').trim();

    return {
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

  expect(current.title, `${label} title mismatch`).toBe(baseline.title);
  expect(current.metaDescription, `${label} meta description mismatch`).toBe(baseline.metaDescription);

  expect(current.headings, `${label} headings mismatch`).toEqual(baseline.headings);

  const sortSocial = (a: { platform: string; url: string }, b: { platform: string; url: string }) =>
    a.platform.localeCompare(b.platform);
  const curSocial = [...current.socialLinks].sort(sortSocial);
  const baseSocial = [...baseline.socialLinks].sort(sortSocial);
  expect(curSocial.length, `${label} social link count`).toBe(baseSocial.length);
  for (let i = 0; i < curSocial.length; i++) {
    expect(curSocial[i].platform, `${label} social[${i}] platform`).toBe(baseSocial[i].platform);
    const curPath = urlPath(curSocial[i].url).replace(/\/+$/, '');
    const basePath = urlPath(baseSocial[i].url).replace(/\/+$/, '');
    expect(curPath, `${label} social[${i}] path`).toBe(basePath);
  }

  expect(current.hasHero, `${label} hasHero mismatch`).toBe(baseline.hasHero);
  if (current.hasHero) {
    if (baseline.heroStyles.backgroundColor) {
      expect(current.heroStyles.backgroundColor, `${label} hero bg color`).toBe(baseline.heroStyles.backgroundColor);
    }
    if (baseline.heroStyles.backgroundImage) {
      expect(current.heroStyles.backgroundImage, `${label} hero bg image`).toBe(baseline.heroStyles.backgroundImage);
    }
  }

  expect(current.navLinks.length, `${label} nav link count`).toBe(baseline.navLinks.length);
  for (let i = 0; i < Math.min(current.navLinks.length, baseline.navLinks.length); i++) {
    expect(current.navLinks[i].text, `${label} nav[${i}] text`).toBe(baseline.navLinks[i].text);
    const curNp = urlPath(current.navLinks[i].href).replace(/\/+$/, '');
    const baseNp = urlPath(baseline.navLinks[i].href).replace(/\/+$/, '');
    expect(curNp, `${label} nav[${i}] path`).toBe(baseNp);
  }

  const sectionRatio = current.sections.length / baseline.sections.length;
  expect(sectionRatio, `${label} section count ratio ${sectionRatio.toFixed(2)}`).toBeGreaterThan(0.2);
  expect(sectionRatio, `${label} section count ratio ${sectionRatio.toFixed(2)}`).toBeLessThan(1.8);

  expect(current.hasFloatingWidget, `${label} floating widget mismatch`).toBe(baseline.hasFloatingWidget);
  if (current.hasFloatingWidget) {
    const curChannels = [...current.floatingChannels].sort();
    const baseChannels = [...baseline.floatingChannels].sort();
    expect(curChannels, `${label} floating channels`).toEqual(baseChannels);
  }

  expect(current.tiktokEmbeds.length, `${label} tiktok embed count`).toBe(baseline.tiktokEmbeds.length);
  for (let i = 0; i < Math.min(current.tiktokEmbeds.length, baseline.tiktokEmbeds.length); i++) {
    expect(current.tiktokEmbeds[i].videoId, `${label} tiktok[${i}] videoId`).toBe(baseline.tiktokEmbeds[i].videoId);
  }

  const btnRatio = current.buttons.length / baseline.buttons.length;
  expect(btnRatio, `${label} button count ratio ${btnRatio.toFixed(2)}`).toBeGreaterThan(0.5);
  expect(btnRatio, `${label} button count ratio ${btnRatio.toFixed(2)}`).toBeLessThan(1.5);

  expect(current.images.length, `${label} image count`).toBe(baseline.images.length);
  for (let i = 0; i < Math.min(current.images.length, baseline.images.length); i++) {
    expect(current.images[i].alt, `${label} image[${i}] alt`).toBe(baseline.images[i].alt);
  }

  const sortLinks = (a: { text: string; href: string }, b: { text: string; href: string }) =>
    a.text.localeCompare(b.text);
  const curFooter = [...current.footerLinks].sort(sortLinks);
  const baseFooter = [...baseline.footerLinks].sort(sortLinks);
  expect(curFooter.length, `${label} footer link count`).toBe(baseFooter.length);
  for (let i = 0; i < Math.min(curFooter.length, baseFooter.length); i++) {
    expect(curFooter[i].text, `${label} footer[${i}] text`).toBe(baseFooter[i].text);
    const curFp = urlPath(curFooter[i].href).replace(/\/+$/, '');
    const baseFp = urlPath(baseFooter[i].href).replace(/\/+$/, '');
    expect(curFp, `${label} footer[${i}] path`).toBe(baseFp);
  }

  const keyFooterTerms = ['Party Villa', 'โทร', 'LINE', 'Facebook', 'TikTok', '093'];
  for (const term of keyFooterTerms) {
    expect(current.footerText, `${label} footerText should contain "${term}"`).toContain(term);
  }

  const lenRatio = current.mainText.length / baseline.mainText.length;
  expect(lenRatio, `${label} mainText length ratio ${lenRatio.toFixed(2)}`).toBeGreaterThan(0.04);
  expect(lenRatio, `${label} mainText length ratio ${lenRatio.toFixed(2)}`).toBeLessThan(3);
}
