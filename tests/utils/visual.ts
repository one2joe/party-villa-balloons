import { Page } from '@playwright/test';

export interface IgnoreZone {
  selector: string;
}

export const COMMON_IGNORE_ZONES: IgnoreZone[] = [
  { selector: '.tiktok-embed' },
  { selector: '.cf-turnstile' },
  { selector: '#turnstile-wrapper' },
  { selector: '[data-turnstile]' },
  { selector: 'iframe[src*="tiktok"]' },
];

export async function applyIgnoreZones(page: Page, extraZones: IgnoreZone[] = []): Promise<void> {
  const allZones = [...COMMON_IGNORE_ZONES, ...extraZones];
  for (const zone of allZones) {
    const elements = page.locator(zone.selector);
    const count = await elements.count();
    for (let i = 0; i < count; i++) {
      await elements.nth(i).evaluate((el: HTMLElement) => {
        el.style.opacity = '0';
      });
    }
  }
}
