import { test, TestInfo } from '@playwright/test';
import {
  isReferenceMode, extractReferenceData, saveReferenceBaseline,
  loadReferenceBaseline, verifyReferenceMatch, REFERENCE_BASE,
  localToReferencePath,
} from '../utils/reference';
import { goto, hideDynamicContent } from '../utils/setup';

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

function vpName(info: TestInfo): string {
  return info.project.name;
}

for (const pageDef of PAGES) {
  test.describe(`${pageDef.name} page`, () => {
    test('reference comparison', async ({ page }, testInfo) => {
      const viewport = vpName(testInfo);

      if (isReferenceMode()) {
        const refPath = localToReferencePath(pageDef.localPath);
        const refUrl = `${REFERENCE_BASE}${refPath}`;
        await goto(page, refUrl);
        await hideDynamicContent(page);
        const data = await extractReferenceData(page);
        await saveReferenceBaseline(pageDef.name, viewport, data);
      } else {
        await goto(page, pageDef.localPath);
        await hideDynamicContent(page);
        const current = await extractReferenceData(page);
        const baseline = await loadReferenceBaseline(pageDef.name, viewport);
        await verifyReferenceMatch(current, baseline, pageDef.name, viewport);
      }
    });
  });
}
