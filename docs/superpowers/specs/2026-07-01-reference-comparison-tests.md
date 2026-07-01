# Cross-Site Reference Comparison Tests

## Goal
Create Playwright tests that compare the local Astro site against the WordPress reference site at every structural, content, behavioral, and visual level — detecting differences at the level exemplified by the 9 known items (social links, hero color, floating button, row layout, etc.).

## Approach: Baseline-based cross-site comparison

- One environment variable: `REFERENCE=true` — visits reference site, saves structured data as baseline JSON
- Normal run: visits local site, extracts same data, compares against reference baselines
- Baseline stored per page + per viewport in `tests/baseline/reference/{pageName}.{viewport}.json`
- Fail on any mismatch with clear error messages

## Data Extracted (per page × viewport)

```typescript
interface ReferenceData {
  url: string;
  title: string;
  metaDescription: string;
  headings: { level: number; text: string }[];
  navLinks: { text: string; href: string }[];
  socialLinks: { platform: string; url: string }[];
  hasHero: boolean;
  heroStyles: { backgroundColor: string | null; backgroundImage: string | null };
  sections: { tagName: string; classList: string[]; childCount: number }[];
  images: { src: string; alt: string; width: number; height: number }[];
  buttons: { text: string; iconClasses: string[]; href: string | null }[];
  hasFloatingWidget: boolean;
  floatingChannels: string[];
  tiktokEmbeds: { videoId: string }[];
  footerText: string;
  footerLinks: { text: string; href: string }[];
  mainText: string;
  visibleLinks: { text: string; href: string }[];
}
```

## Test Structure

### New file: `tests/utils/reference.ts`

- `REFERENCE_BASE = 'https://xn--12cmal7ftbft4d7etb1fxav2ej.com'`
- `extractReferenceData(page, viewport): Promise<ReferenceData>`
- `saveReferenceBaseline(pageName, viewport, data)`
- `loadReferenceBaseline(pageName, viewport): Promise<ReferenceData>`
- `verifyReferenceMatch(current, baseline, pageName, viewport)`
- `isReferenceMode: boolean` (reads `REFERENCE` env var)
- Path mapping Thai → English for reference site navigation

### New file: `tests/pages/reference.spec.ts`

Single test file with:

1. **One describe block per page** (home, about, services, portfolio, blog, contact)
2. **Each describe has 3 tests** (desktop, tablet, mobile)
3. Each test:
   - In reference mode: visits reference URL → extracts → saves baseline
   - In test mode: visits local URL → extracts → compares

### Reference URL mapping

| Local (Astro) | Reference (WordPress) |
|---|---|
| `/` | `/` |
| `/เกี่ยวกับเรา/` | `/about-us/` |
| `/บริการ/` | `/our-services/` |
| `/ผลงาน/` | `/gallery/` |
| `/บทความ/` | `/blog/` |
| `/ติดต่อเรา/` | `/contact-us/` |

### Comparison rules

Each field checked with appropriate strictness:

- **title, metaDescription**: exact string match
- **headings**: array of {level, text} exact match (order matters)
- **navLinks**: array of {text, href} — match by text, check href contains expected
- **socialLinks**: must have same platforms, each with matching URL
- **hasHero**: boolean match
- **heroStyles**: compare resolved CSS values
- **sections**: compare count, tagNames, class patterns
- **images**: for service pages, check `<img>` exists (not icon)
- **buttons**: check text + icon classes match
- **hasFloatingWidget**: boolean match; if true, check channels match
- **tiktokEmbeds**: count match; if >0, check videoIds
- **footerText**: trimmed text match
- **footerLinks**: array of {text, href}
- **mainText**: fuzzy text comparison (both contain same key phrases)

## Execution

```bash
# Capture reference baselines (one-time, 18 page×viewport combos)
REFERENCE=true npx playwright test tests/pages/reference.spec.ts

# Run comparison
npx playwright test tests/pages/reference.spec.ts
```
