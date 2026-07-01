export const REFERENCE_BASE = 'https://xn--12cmal7ftbft4d7etb1fxav2ej.com';
export const DEPLOYED_BASE = 'https://party-villa-balloons.pages.dev';

export const PATH_MAP: Record<string, string> = {
  '/': '/',
  '/เกี่ยวกับเรา/': '/about-us/',
  '/บริการ/': '/our-services/',
  '/ผลงาน/': '/gallery/',
  '/บทความ/': '/blog/',
  '/ติดต่อเรา/': '/contact-us/',
};

export function deployedToReference(deployedPath: string): string {
  if (deployedPath === '/') return '/';
  const match = Object.entries(PATH_MAP).find(([thai]) => deployedPath.startsWith(thai));
  if (match) {
    const [thai, eng] = match;
    const suffix = deployedPath.slice(thai.length);
    return suffix ? `${eng}${suffix}` : eng;
  }
  return deployedPath;
}

export function referenceUrl(path: string): string {
  return `${REFERENCE_BASE}${path}`;
}

export function deployedUrl(path: string): string {
  return `${DEPLOYED_BASE}${path}`;
}

export const VIEWPORTS: { name: string; width: number; height: number }[] = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

export const VIEWPORT_NAMES = ['desktop', 'tablet', 'mobile'] as const;
export type ViewportName = (typeof VIEWPORT_NAMES)[number];
