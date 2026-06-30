# Party Villa Balloons — Static Site Migration

## Overview
Migrate WordPress site (partyvillaballoons.com) to a static Astro site hosted on Cloudflare Pages. All content scraped from existing site. Exact 1:1 replica — no new features beyond what the current WordPress site provides.

## Tech Stack
- **Framework:** Astro (static site generation)
- **Hosting:** Cloudflare Pages (`party-villa-balloons.pages.dev`)
- **Images:** Cloudflare Images (migrated from WordPress wp-content/uploads)
- **Contact Form:** Cloudflare Turnstile + Cloudflare Workers (serverless email)
- **Font:** IBM Plex Sans Thai Looped (Google Fonts, same as original)
- **Analytics:** Google Analytics (GTM), Meta Pixel — same tracking codes as original

## Design System
- **Primary color:** #fb3c8b (pink)
- **Secondary:** #8a5d3b (brown)
- **Success:** #dd9933 (gold)
- **Alert:** #dd3333 (red)
- **Font:** IBM Plex Sans Thai Looped (400/700 weight)
- **Layout:** Sticky header → content → footer (Flatsome-style equivalent)

## Pages (6 pages total)

### 1. Home (`/`)
- Hero banner (parallax, overlay 50% black) with text + CTA button "ดูผลงานของเรา"
- Welcome intro text + social share buttons
- Image gallery slider (10 service images showing various balloon types)
- "จุดเด่นของเรา" section — Pinky delivery car highlight
- TikTok embeds (5 posts from @partyvillaballoon)
- FAQ accordion (6 questions-answers)
- Contact CTA section ("มีคำถาม...อุ้มตอบเองทุกข้อความ")
- Footer

### 2. About (`/about`)
- Hero banner (parallax) — owner photo
- Owner story (อุ้ม — from engineer to balloon artist)
- Image gallery (2 images: shop, owner portrait)
- Vision/mission section

### 3. Services (`/services`)
- Hero banner (parallax)
- 3 service cards in grid:
  - Standard Balloon Decor (helium, arches, columns, backdrops)
  - SnapBloom (remote-controlled balloon drop effects)
  - Pinky Delivery (delivery & installation)
- Pricing link to Canva document
- "รองรับทุกรูปแบบงาน" CTA section

### 4. Portfolio (`/portfolio`)
- Hero banner (parallax)
- Sticky sidebar with anchor links (7 categories):
  - ขอแต่งงาน/แต่งงาน/วันครบรอบ
  - ลูกโป่งตกแต่งโชว์รูมรถ
  - งานวันเกิด/ปาร์ตี้
  - Baby Shower/Welcome Baby/ลูกโป่งทายเพศ
  - งานองค์กรและกิจกรรม
  - แบคดรอป/ซุ้มลูกโป่ง/เสาลูกโป่ง
  - ลูกโป่งเอฟเฟกต์
- Gallery grid with lightbox (same images as WordPress)

### 5. Blog (`/blog`)
- Hero banner (parallax)
- Sidebar with recent posts list + CTA banner to portfolio
- Blog post list (5 articles):
  1. แก๊สที่ใช้ในลูกโป่งมีกี่แบบ?
  2. "น้องพิ้งกี้" รถบริการลูกโป่งเชียงใหม่
  3. 6 ไอเดียลูกโป่งสำหรับงานเปิดตัวสินค้า
  4. ลูกโป่งฮีเลียม vs ลูกโป่งลม
  5. SnapBloom by Party Villa — เจ้าแรกในประเทศไทย
- Individual blog post pages at `/blog/[slug]`

### 6. Contact (`/contact`)
- Hero banner (parallax)
- Contact info: address, phone (093-0518591), LINE (@partyvilla), Facebook, TikTok
- Pinky car image
- Contact form (name, phone, details) with Cloudflare Turnstile
- Cloudflare Workers function to handle form submission (email forwarding)

## Shared Components
- **Header:** Logo, 6 nav items (หน้าแรก, เกี่ยวกับเรา, บริการ, ผลงาน, บทความ, ติดต่อเรา), social icons (FB, IG, TikTok)
- **Footer:** Logo, social links, contact channels, service area, copyright
- **Mobile:** Hamburger menu (slide-out drawer, same as Flatsome)

## Data Files (scraped content as JSON)
- `src/data/services.json` — service descriptions/icons
- `src/data/gallery.json` — gallery images by category
- `src/data/blog-posts.json` — blog content (title, date, body, slug)
- `src/data/faq.json` — FAQ questions/answers

## Deployment
- Static export via `astro build`
- Deploy to Cloudflare Pages via wrangler or Git integration
- Domain: `party-villa-balloons.pages.dev`
- Contact form Worker deployed separately to same Pages project

## Tracking (identical to current site)
- Google Analytics (GT-MR4FG2RM)
- Google Tag Manager (GTM-P2J84NJ8)
- Meta Pixel (279646752446906)
- Rank Math SEO structured data (schema.org)
