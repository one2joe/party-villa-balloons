import { test, expect } from '@playwright/test';
import { extractReferenceData, loadReferenceBaseline } from '../utils/reference';
import { goto, hideDynamicContent } from '../utils/setup';

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/เกี่ยวกับเรา/' },
  { name: 'services', path: '/บริการ/' },
  { name: 'portfolio', path: '/ผลงาน/' },
  { name: 'blog', path: '/บทความ/' },
  { name: 'contact', path: '/ติดต่อเรา/' },
];

function urlPath(u: string): string {
  try { return decodeURIComponent(new URL(u).pathname); } catch { try { return decodeURIComponent(u); } catch { return u; } }
}

test.describe('diff all fields', () => {
  for (const p of PAGES) {
    test(`${p.name} desktop`, async ({ page }) => {
      await goto(page, p.path);
      await hideDynamicContent(page);
      const astro = await extractReferenceData(page);
      const wp = await loadReferenceBaseline(p.name, 'desktop');
      const label = `[${p.name}/desktop]`;
      const errors: string[] = [];

      function check(field: string, ok: boolean, detail?: string) {
        if (!ok) errors.push(`${label} ${field}${detail ? ': ' + detail : ''}`);
      }

      check('title', astro.title === wp.title, `"${astro.title}" vs "${wp.title}"`);
      check('headings count', astro.headings.length === wp.headings.length, `${astro.headings.length} vs ${wp.headings.length}`);

      check('socialLinks count', astro.socialLinks.length === wp.socialLinks.length, `${astro.socialLinks.length} vs ${wp.socialLinks.length}`);
      if (astro.socialLinks.length === wp.socialLinks.length) {
        for (let i = 0; i < astro.socialLinks.length; i++) {
          check(`social[${i}] platform`, astro.socialLinks[i].platform === wp.socialLinks[i].platform, `"${astro.socialLinks[i].platform}" vs "${wp.socialLinks[i].platform}"`);
          const cp = urlPath(astro.socialLinks[i].url).replace(/\/+$/, '');
          const bp = urlPath(wp.socialLinks[i].url).replace(/\/+$/, '');
          check(`social[${i}] path`, cp === bp, `"${cp}" vs "${bp}"`);
        }
      }

      check('hasHero', astro.hasHero === wp.hasHero, `${astro.hasHero} vs ${wp.hasHero}`);
      if (wp.heroStyles.backgroundColor) {
        check('hero bg color', astro.heroStyles.backgroundColor === wp.heroStyles.backgroundColor, `"${astro.heroStyles.backgroundColor}" vs "${wp.heroStyles.backgroundColor}"`);
      }
      if (wp.heroStyles.backgroundImage) {
        check('hero bg image', astro.heroStyles.backgroundImage === wp.heroStyles.backgroundImage, `"${String(astro.heroStyles.backgroundImage).substring(0,60)}" vs "${String(wp.heroStyles.backgroundImage).substring(0,60)}"`);
      }

      check('navLinks count', astro.navLinks.length === wp.navLinks.length, `${astro.navLinks.length} vs ${wp.navLinks.length}`);
      if (astro.navLinks.length === wp.navLinks.length) {
        for (let i = 0; i < astro.navLinks.length; i++) {
          check(`nav[${i}] text`, astro.navLinks[i].text === wp.navLinks[i].text, `"${astro.navLinks[i].text}" vs "${wp.navLinks[i].text}"`);
          const cp = urlPath(astro.navLinks[i].href).replace(/\/+$/, '');
          const bp = urlPath(wp.navLinks[i].href).replace(/\/+$/, '');
          check(`nav[${i}] path`, cp === bp, `"${cp}" vs "${bp}"`);
        }
      }

      check('sections count', astro.sections.length === wp.sections.length, `${astro.sections.length} vs ${wp.sections.length}`);

      check('hasFloatingWidget', astro.hasFloatingWidget === wp.hasFloatingWidget, `${astro.hasFloatingWidget} vs ${wp.hasFloatingWidget}`);

      check('tiktokEmbeds count', astro.tiktokEmbeds.length === wp.tiktokEmbeds.length, `${astro.tiktokEmbeds.length} vs ${wp.tiktokEmbeds.length}`);
      for (let i = 0; i < Math.min(astro.tiktokEmbeds.length, wp.tiktokEmbeds.length); i++) {
        check(`tiktok[${i}] id`, astro.tiktokEmbeds[i].videoId === wp.tiktokEmbeds[i].videoId, `"${astro.tiktokEmbeds[i].videoId}" vs "${wp.tiktokEmbeds[i].videoId}"`);
      }

      check('buttons count', astro.buttons.length === wp.buttons.length, `${astro.buttons.length} vs ${wp.buttons.length}`);
      if (astro.buttons.length === wp.buttons.length) {
        for (let i = 0; i < astro.buttons.length; i++) {
          check(`button[${i}] text`, astro.buttons[i].text === wp.buttons[i].text, `"${astro.buttons[i].text.substring(0,40)}" vs "${wp.buttons[i].text.substring(0,40)}"`);
          check(`button[${i}] icons`, JSON.stringify(astro.buttons[i].iconClasses) === JSON.stringify(wp.buttons[i].iconClasses), `[${astro.buttons[i].iconClasses}] vs [${wp.buttons[i].iconClasses}]`);
          const ch = astro.buttons[i].href ? urlPath(astro.buttons[i].href).replace(/\/+$/, '') : null;
          const bh = wp.buttons[i].href ? urlPath(wp.buttons[i].href).replace(/\/+$/, '') : null;
          check(`button[${i}] href`, ch === bh, `"${ch}" vs "${bh}"`);
        }
      }

      check('images count', astro.images.length === wp.images.length, `${astro.images.length} vs ${wp.images.length}`);

      check('footerLinks count', astro.footerLinks.length === wp.footerLinks.length, `${astro.footerLinks.length} vs ${wp.footerLinks.length}`);

      if (errors.length > 0) {
        console.log(`\n${p.name} desktop — ${errors.length} failures:`);
        errors.forEach(e => console.log(`  ${e}`));
      }
      expect(errors, `${label} ${errors.length} failures`).toHaveLength(0);
    });
  }
});
