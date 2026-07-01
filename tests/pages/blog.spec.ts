import { test, expect } from '@playwright/test';
import {
  pathFor, goto, hideDynamicContent,
  extractContent, saveBaseline, verifyContent, IS_BASELINE
} from '../utils/setup';
import { testHeadingStructure } from '../utils/behavior';

test.describe('Blog Index', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, pathFor('/บทความ/'));
    await hideDynamicContent(page);
  });

  test('visual match', async ({ page }) => {
    await expect(page).toHaveScreenshot('fullpage.png', { maxDiffPixelRatio: 0.005 });
    if (IS_BASELINE) {
      await saveBaseline('blog', await extractContent(page));
    }
  });

  test('content match', async ({ page }) => {
    if (!IS_BASELINE) {
      await verifyContent(await extractContent(page), 'blog');
    }
  });

  test('heading structure', async ({ page }) => {
    if (IS_BASELINE) return;
    await testHeadingStructure(page);
  });
});
