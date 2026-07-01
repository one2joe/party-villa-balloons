import { test, expect } from '@playwright/test';
import {
  pathFor, goto, hideDynamicContent,
  extractContent, saveBaseline, verifyContent, IS_BASELINE
} from '../utils/setup';
import { testFaqAccordion, testMobileMenu, testHeadingStructure } from '../utils/behavior';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, pathFor('/'));
    await hideDynamicContent(page);
  });

  test('visual match', async ({ page }) => {
    await expect(page).toHaveScreenshot('fullpage.png', { maxDiffPixelRatio: 0.005 });
    if (IS_BASELINE) {
      await saveBaseline('home', await extractContent(page));
    }
  });

  test('content match', async ({ page }) => {
    if (!IS_BASELINE) {
      await verifyContent(await extractContent(page), 'home');
    }
  });

  test('heading structure', async ({ page }) => {
    if (IS_BASELINE) return;
    await testHeadingStructure(page);
  });

  test('FAQ accordion', async ({ page }) => {
    if (IS_BASELINE) return;
    await testFaqAccordion(page);
  });

  test('mobile menu', async ({ page }) => {
    if (IS_BASELINE) return;
    await page.setViewportSize({ width: 375, height: 812 });
    await goto(page, pathFor('/'));
    await testMobileMenu(page);
  });
});
