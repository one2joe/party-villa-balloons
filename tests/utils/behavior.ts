import { Page, expect } from '@playwright/test';

export async function testFaqAccordion(page: Page): Promise<void> {
  const faqItems = page.locator('.faq-item');
  const count = await faqItems.count();
  if (count === 0) return;

  for (let i = 0; i < count; i++) {
    const item = faqItems.nth(i);
    const btn = item.locator('.faq-question');

    const initiallyOpen = await item.evaluate((el: HTMLElement) => el.classList.contains('open'));
    if (initiallyOpen) continue;

    await btn.click();
    await page.waitForTimeout(350);

    const nowOpen = await item.evaluate((el: HTMLElement) => el.classList.contains('open'));
    expect(nowOpen).toBeTruthy();

    await btn.click();
    await page.waitForTimeout(350);

    const nowClosed = await item.evaluate((el: HTMLElement) => !el.classList.contains('open'));
    expect(nowClosed).toBeTruthy();
  }
}

export async function testMobileMenu(page: Page): Promise<void> {
  const hamburger = page.locator('[data-hamburger]');
  if (await hamburger.count() === 0) return;

  const overlay = page.locator('[data-mobile-overlay]');

  const initiallyOpen = await overlay.evaluate((el: HTMLElement) => el.classList.contains('open'));
  expect(initiallyOpen).toBeFalsy();

  await hamburger.click();
  await page.waitForTimeout(350);

  const afterOpen = await overlay.evaluate((el: HTMLElement) => el.classList.contains('open'));
  expect(afterOpen).toBeTruthy();

  const closeBtn = page.locator('[data-mobile-close]');
  if (await closeBtn.count() > 0) {
    await closeBtn.click();
    await page.waitForTimeout(350);
    const afterClose = await overlay.evaluate((el: HTMLElement) => el.classList.contains('open'));
    expect(afterClose).toBeFalsy();
  }
}

export async function testContactFormValidation(page: Page): Promise<void> {
  const form = page.locator('form#contactForm');
  if (await form.count() === 0) return;

  const inputs = await form.locator('input, textarea').count();
  expect(inputs).toBeGreaterThan(0);

  const action = await form.getAttribute('action');
  expect(action).toContain('api.party-villa-balloons.pages.dev');
}

export async function testGallerySidebar(page: Page): Promise<void> {
  const sidebar = page.locator('.gallery-sidebar');
  if (await sidebar.count() === 0) return;

  const sidebarLinks = sidebar.locator('a.sidebar-link');
  const count = await sidebarLinks.count();
  expect(count).toBeGreaterThan(0);

  const firstLinkHref = await sidebarLinks.first().getAttribute('href');
  if (!firstLinkHref?.startsWith('#')) return;

  const targetId = firstLinkHref.slice(1);
  const target = page.locator(`[id="${targetId}"]`);
  if (await target.count() > 0) {
    await expect(target).toBeVisible();
  }
}

export async function testHeadingStructure(page: Page): Promise<void> {
  const headings = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map(h => ({ level: parseInt(h.tagName[1]), text: h.textContent?.trim() || '' }));
  });

  expect(headings.length, 'Page has no headings').toBeGreaterThan(0);
}
