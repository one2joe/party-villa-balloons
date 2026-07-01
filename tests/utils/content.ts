import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export interface PageContent {
  url: string;
  title: string;
  metaDescription: string;
  h1s: string[];
  h2s: string[];
  h3s: string[];
  visibleLinks: { text: string; href: string }[];
  images: { src: string; alt: string }[];
  mainText: string;
}

export async function extractContent(page: Page): Promise<PageContent> {
  return page.evaluate(() => {
    const metaDesc = document.querySelector('meta[name="description"]');
    return {
      url: window.location.href,
      title: document.title,
      metaDescription: metaDesc?.getAttribute('content') || '',
      h1s: Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim() || ''),
      h2s: Array.from(document.querySelectorAll('h2')).map(h => h.textContent?.trim() || ''),
      h3s: Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim() || ''),
      visibleLinks: Array.from(document.querySelectorAll('a[href]'))
        .filter(a => a.offsetParent !== null || a.getAttribute('href')?.startsWith('http'))
        .map(a => ({
          text: a.textContent?.trim() || '',
          href: (a as HTMLAnchorElement).href,
        })),
      images: Array.from(document.querySelectorAll('img[src]'))
        .filter(img => img.offsetParent !== null || (img as HTMLImageElement).src.startsWith('http'))
        .map(img => ({
          src: (img as HTMLImageElement).src,
          alt: (img as HTMLImageElement).alt || '',
        })),
      mainText: (document.body?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
}

const BASELINE_DIR = path.resolve(process.cwd(), 'tests/baseline/data');

export async function saveBaseline(pageName: string, content: PageContent): Promise<void> {
  const filePath = path.join(BASELINE_DIR, `${pageName}.json`);
  await fs.promises.mkdir(BASELINE_DIR, { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify(content, null, 2), 'utf-8');
}

export async function loadBaseline(pageName: string): Promise<PageContent> {
  const filePath = path.join(BASELINE_DIR, `${pageName}.json`);
  const data = await fs.promises.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

export function baselineExists(pageName: string): boolean {
  const filePath = path.join(BASELINE_DIR, `${pageName}.json`);
  return fs.existsSync(filePath);
}

export async function extractImages(page: Page): Promise<{ src: string; alt: string }[]> {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('img[src]'))
      .filter(img => (img as HTMLImageElement).src.startsWith('http'))
      .map(img => ({
        src: (img as HTMLImageElement).src,
        alt: (img as HTMLImageElement).alt || '',
      }));
  });
}

export async function extractLinks(page: Page): Promise<{ text: string; href: string }[]> {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]'))
      .map(a => ({
        text: a.textContent?.trim() || '',
        href: (a as HTMLAnchorElement).href,
      }));
  });
}
