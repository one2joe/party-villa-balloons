import { test, expect } from '@playwright/test';
import {
  pathFor, goto, hideDynamicContent,
  extractContent, saveBaseline, verifyContent, IS_BASELINE
} from '../utils/setup';
import { testGallerySidebar, testHeadingStructure } from '../utils/behavior';

test.describe('Portfolio Page', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, pathFor('/ผลงาน/'));
    await hideDynamicContent(page);
  });

  test('visual match', async ({ page }) => {
    await expect(page).toHaveScreenshot('fullpage.png', { maxDiffPixelRatio: 0.005 });
    if (IS_BASELINE) {
      await saveBaseline('portfolio', await extractContent(page));
    }
  });

  test('content match', async ({ page }) => {
    if (!IS_BASELINE) {
      await verifyContent(await extractContent(page), 'portfolio');
    }
  });

  test('heading structure', async ({ page }) => {
    if (IS_BASELINE) return;
    await testHeadingStructure(page);
  });

  test('gallery sidebar', async ({ page }) => {
    if (IS_BASELINE) return;
    await testGallerySidebar(page);
  });
});
