import { chromium } from 'playwright';

const REF = 'https://xn--12cmal7ftbft4d7etb1fxav2ej.com';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(REF, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const internal = anchors
      .map(a => ({ text: a.textContent?.trim(), href: a.getAttribute('href') || '' }))
      .filter(l => {
        try {
          const u = new URL(l.href.startsWith('http') ? l.href : new URL(l.href, window.location.origin).href);
          return u.hostname.includes('xn--12cmal7ftbft4d7etb1fxav2ej.com') && u.pathname !== '/';
        } catch { return false; }
      });
    const uniqueMap = new Map();
    internal.forEach(l => uniqueMap.set(l.href, l));
    return Array.from(uniqueMap.values());
  });

  console.log('\n=== Internal navigation links ===\n');
  for (const l of links) {
    const url = new URL(l.href);
    console.log(`  ${decodeURIComponent(url.pathname)}  (${l.text})`);
  }

  const pathsToTest = [
    '/about-us/', '/about/', '/about-us',
    '/our-services/', '/services/', '/services',
    '/gallery/', '/portfolio/', '/portfolio',
    '/blog/', '/blogs/', '/articles/',
    '/contact-us/', '/contact/', '/contact',
  ];

  console.log('\n=== Testing known paths ===\n');
  for (const p of pathsToTest) {
    try {
      const resp = await page.goto(`${REF}${p}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const status = resp?.status();
      const title = await page.title();
      console.log(`  ${p} -> ${status} (${title})`);
    } catch (e) {
      console.log(`  ${p} -> ERROR`);
    }
  }

  await browser.close();
}

main().catch(console.error);
