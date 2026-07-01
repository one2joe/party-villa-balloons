import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASELINE_DIR = path.resolve(__dirname, '..', 'tests/baseline');
const DATA_DIR = path.join(BASELINE_DIR, 'data');
const SCREENSHOT_DIR = path.join(BASELINE_DIR, 'screenshots');

const REFERENCE_BASE = 'https://xn--12cmal7ftbft4d7etb1fxav2ej.com';
const DEPLOYED_BASE = 'https://party-villa-balloons.pages.dev';

const PATH_MAP = {
  '/': '/',
  '/เกี่ยวกับเรา/': '/about-us/',
  '/บริการ/': '/our-services/',
  '/ผลงาน/': '/gallery/',
  '/บทความ/': '/blog/',
  '/ติดต่อเรา/': '/contact-us/',
};

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

function deployedToReference(deployedPath) {
  if (deployedPath === '/') return '/';
  for (const [thai, eng] of Object.entries(PATH_MAP)) {
    if (deployedPath.startsWith(thai)) {
      const suffix = deployedPath.slice(thai.length);
      return suffix ? `${eng}${suffix}` : eng;
    }
  }
  return deployedPath;
}

async function waitForPageReady(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

async function extractPageContent(page) {
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
        .map(a => ({ text: a.textContent?.trim() || '', href: a.href })),
      images: Array.from(document.querySelectorAll('img[src]'))
        .filter(img => img.offsetParent !== null || img.src.startsWith('http'))
        .map(img => ({ src: img.src, alt: img.alt || '' })),
      mainText: (document.body?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
}

async function collectBlogSlugs(page) {
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="/blog/"], a[href*="/%E0%B8%9A%E0%B8%97%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A1/"]'))
      .map(a => a.getAttribute('href'))
      .filter(href => href)
      .map(href => {
        const url = new URL(href, window.location.origin);
        return url.pathname;
      })
      .filter((path, i, arr) => arr.indexOf(path) === i);
  });
  return links;
}

const IGNORE_SELECTORS = [
  '.tiktok-embed',
  '.cf-turnstile',
  '#turnstile-wrapper',
  '[data-turnstile]',
  'iframe[src*="tiktok"]',
];

async function hideDynamicContent(page) {
  for (const selector of IGNORE_SELECTORS) {
    const els = page.locator(selector);
    const count = await els.count();
    for (let i = 0; i < count; i++) {
      await els.nth(i).evaluate(el => { el.style.opacity = '0'; });
    }
  }
}

async function main() {
  console.log('=== Baseline Capture ===\n');
  console.log(`Reference: ${REFERENCE_BASE}`);
  console.log(`Deployed:  ${DEPLOYED_BASE}\n`);

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  // ---- Capture reference site ----
  console.log('--- Reference Site ---');
  const refContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const refPage = await refContext.newPage();

  for (const [deployedPath, refPath] of Object.entries(PATH_MAP)) {
    const refUrl = `${REFERENCE_BASE}${refPath}`;
    const pageName = deployedPath === '/' ? 'home' : deployedPath.replace(/\//g, '');

    console.log(`  ${pageName}: ${refUrl}`);
    await refPage.goto(refUrl, { waitUntil: 'networkidle' });
    await waitForPageReady(refPage);

    const content = await extractPageContent(refPage);
    const dataFile = path.join(DATA_DIR, `${pageName}.json`);
    fs.writeFileSync(dataFile, JSON.stringify(content, null, 2));
    console.log(`    -> saved content data`);

    for (const vp of VIEWPORTS) {
      await refPage.setViewportSize({ width: vp.width, height: vp.height });
      await refPage.waitForTimeout(500);
      await hideDynamicContent(refPage);

      const screenshotDir = path.join(SCREENSHOT_DIR, `${pageName}`);
      fs.mkdirSync(screenshotDir, { recursive: true });
      await refPage.screenshot({
        path: path.join(screenshotDir, `${vp.name}.png`),
        fullPage: true,
      });
      console.log(`    -> screenshot [${vp.name}]`);
    }
  }

  // ---- Capture blog slugs ----
  console.log('\n  Capturing blog post slugs...');
  const blogRefUrl = `${REFERENCE_BASE}${PATH_MAP['/บทความ/']}`;
  await refPage.goto(blogRefUrl, { waitUntil: 'networkidle' });
  await waitForPageReady(refPage);
  const refBlogLinks = await collectBlogSlugs(refPage);
  const refSlugs = refBlogLinks.map(p => p.replace(/\/blog\//, '').replace(/\/$/, ''));
  const blogSlugsFile = path.join(DATA_DIR, 'blog-slugs.json');
  fs.writeFileSync(blogSlugsFile, JSON.stringify(refSlugs, null, 2));
  console.log(`    -> ${refSlugs.length} blog slugs saved`);

  await refContext.close();

  // ---- Capture blog post content from both sites ----
  if (refSlugs.length > 0) {
    const refBlogContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const refBlogPage = await refBlogContext.newPage();

    for (const slug of refSlugs) {
      const refPostUrl = `${REFERENCE_BASE}/blog/${slug}/`;
      console.log(`\n  Blog post: ${slug}`);
      await refBlogPage.goto(refPostUrl, { waitUntil: 'networkidle' });
      await waitForPageReady(refBlogPage);
      const content = await extractPageContent(refBlogPage);

      const dataFile = path.join(DATA_DIR, `blog-${slug}.json`);
      fs.writeFileSync(dataFile, JSON.stringify(content, null, 2));
      console.log(`    -> saved content data`);

      for (const vp of VIEWPORTS) {
        await refBlogPage.setViewportSize({ width: vp.width, height: vp.height });
        await refBlogPage.waitForTimeout(500);
        await hideDynamicContent(refBlogPage);

        const screenshotDir = path.join(SCREENSHOT_DIR, `blog-${slug}`);
        fs.mkdirSync(screenshotDir, { recursive: true });
        await refBlogPage.screenshot({
          path: path.join(screenshotDir, `${vp.name}.png`),
          fullPage: true,
        });
        console.log(`    -> screenshot [${vp.name}]`);
      }
    }
    await refBlogContext.close();
  }

  await browser.close();
  console.log('\n=== Baseline capture complete ===');
}

main().catch(err => {
  console.error('Baseline capture failed:', err);
  process.exit(1);
});
