# Party Villa Balloons — Static Site Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate WordPress site (Flatsome theme) to static Astro site, deployed on Cloudflare Pages, with exact 1:1 replica of original content and design.

**Architecture:** Astro static site with `.astro` components for each page. Shared layout/wrapper for global styles (IBM Plex Sans Thai Looped), header, and footer. Data (gallery, blog posts, FAQ, services) stored as JSON in `src/data/`. Contact form submitted via Turnstile + Cloudflare Workers endpoint. All images hosted on Cloudflare Images.

**Tech Stack:** Astro 4+, Cloudflare Pages, Cloudflare Images, Cloudflare Workers, Cloudflare Turnstile, IBM Plex Sans Thai Looped (Google Fonts)

**Key constraint:** 1:1 replica of existing WordPress site — no extra features, no missing content.

---

### Task 0: Scrape & extract all content from WordPress site

**Files:**
- `scripts/scrape-content.js` (temporary, can be deleted after)
- `src/data/navigation.json`
- `src/data/gallery.json`
- `src/data/services.json`
- `src/data/faq.json`
- `src/data/blog-posts.json`
- `src/data/site-settings.json`
- `src/data/home-content.json`
- `src/data/about-content.json`
- `src/data/services-content.json`
- `src/data/contact-content.json`

- [ ] **Step 0a: Create scripts directory and install cheerio**

```bash
mkdir scripts
cd D:\www\party-villa-balloons
npm init -y
npm install cheerio node-fetch
```

- [ ] **Step 0b: Write scraper script that fetches all 6 pages and extracts structured content**

The scraper script should visit each URL and extract:
- Page title, hero text, section content, images (src + alt), gallery images by category, blog posts (title, date, body, slug), FAQ items, contact info, social links, tracking IDs

```javascript
// scripts/scrape-content.js
import * as fs from 'fs';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';

const BASE = 'https://xn--12cmal7ftbft4d7etb1fxav2ej.com';
const PAGES = {
  home: '/',
  about: '/about-us/',
  services: '/our-services/',
  portfolio: '/gallery/',
  blog: '/blog/',
  contact: '/contact-us/',
};

// ... full scraper that extracts sections, images, blog posts, FAQ, gallery categories
```

Run: `node scripts/scrape-content.js`

Expected: All JSON files created under `src/data/` with structured content extracted from the live WordPress site.

- [ ] **Step 0c: Review extracted data and fix any gaps**

```bash
cat src/data/navigation.json | head -50
cat src/data/gallery.json | head -80
```

Expected: All content present — hero banners, gallery image URLs, blog slugs, FAQ items, service descriptions, social links.

---

### Task 1: Initialize Astro project with Cloudflare adapter

**Files:**
- `package.json`
- `astro.config.mjs`
- `tsconfig.json`
- `src/env.d.ts`

- [ ] **Step 1a: Create Astro project**

```bash
cd D:\www\party-villa-balloons
npx create-astro@latest . --template basics --yes
```

Expected: Astro scaffold created.

- [ ] **Step 1b: Install Cloudflare adapter and needed dependencies**

```bash
npm install @astrojs/cloudflare
npm install astro-icon
```

- [ ] **Step 1c: Configure astro.config.mjs for Cloudflare Pages static output**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  adapter: cloudflare({
    mode: 'directory',
  }),
  build: {
    assets: 'assets',
  },
});
```

- [ ] **Step 1d: Verify build works**

Run: `npm run build` (or `npx astro build`)
Expected: Project builds successfully with output in `dist/`.

---

### Task 2: Global CSS, Layout, and Fonts

**Files:**
- Modify: `src/layouts/Layout.astro`
- `src/styles/global.css`

- [ ] **Step 2a: Set up global CSS with IBM Plex Sans Thai Looped, Flatsome-like variables**

```css
/* src/styles/global.css */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai+Looped:wght@400;700&display=swap');

:root {
  --primary: #fb3c8b;
  --primary-hover: #e62e7a;
  --secondary: #8a5d3b;
  --success: #dd9933;
  --alert: #dd3333;
  --bg-light: #f8f8f8;
  --bg-dark: #333;
  --text-color: #333;
  --text-light: #fff;
  --border-color: #e0e0e0;
  --header-height: 80px;
  --font-main: 'IBM Plex Sans Thai Looped', sans-serif;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 14px rgba(0,0,0,0.12);
  --shadow-lg: 0 10px 40px rgba(0,0,0,0.15);
  --radius: 8px;
  --max-width: 1200px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-main);
  color: var(--text-color);
  line-height: 1.8;
  overflow-x: hidden;
}

a { text-decoration: none; color: inherit; }
ul { list-style: none; }
img { max-width: 100%; height: auto; display: block; }

.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 20px;
}

/* Hero section */
.hero-parallax {
  position: relative;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

.hero-parallax::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: #fff;
  padding: 40px 20px;
}

.hero-content h1 {
  font-size: 3rem;
  margin-bottom: 16px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.hero-content p {
  font-size: 1.2rem;
  max-width: 700px;
  margin: 0 auto 24px;
  opacity: 0.9;
}

/* Buttons */
.btn {
  display: inline-block;
  padding: 14px 32px;
  background: var(--primary);
  color: #fff;
  border-radius: 40px;
  font-weight: 700;
  font-size: 1rem;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
  font-family: var(--font-main);
}

.btn:hover { background: var(--primary-hover); transform: translateY(-2px); }

.btn-outline {
  background: transparent;
  border: 2px solid #fff;
  color: #fff;
}

.btn-outline:hover { background: #fff; color: var(--primary); }

/* Section spacing */
.section-padding { padding: 80px 0; }
.section-title {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 12px;
  color: var(--text-color);
}
.section-subtitle {
  text-align: center;
  color: #777;
  margin-bottom: 40px;
  font-size: 1.1rem;
}

/* Grids */
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 768px) {
  .grid-3, .grid-4 { grid-template-columns: repeat(2, 1fr); }
  .hero-content h1 { font-size: 2rem; }
}

@media (max-width: 480px) {
  .grid-3, .grid-4 { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2b: Create Layout.astro with SEO meta, Google Fonts, tracking scripts**

```astro
---
// src/layouts/Layout.astro
export interface Props {
  title?: string;
  description?: string;
  image?: string;
}

const { title = 'Party Villa Balloons | ลูกโป่งเชียงใหม่', description = 'บริการจัดลูกโป่งเชียงใหม่ รับจัดลูกโป่งทุกโอกาส', image } = Astro.props;
---

<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="robots" content="index, follow" />

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai+Looped:wght@400;700&display=swap" rel="stylesheet" />

  <!-- Google Tag Manager -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=GT-MR4FG2RM"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GT-MR4FG2RM');
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-P2J84NJ8');
  </script>

  <!-- Meta Pixel -->
  <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '279646752446906');
    fbq('track', 'PageView');
  </script>

  <link rel="stylesheet" href="/styles/global.css" />
  <link rel="canonical" href={`https://party-villa-balloons.pages.dev${Astro.url.pathname}`} />
</head>
<body>
  <!-- GTM noscript -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-P2J84NJ8" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

  <slot />
</body>
</html>
```

- [ ] **Step 2c: Build test page to verify styles load**

Run: `npx astro dev` and open browser to see a basic page with the font and variables applied.
Expected: IBM Plex Sans Thai Looped renders, CSS variables accessible.

---

### Task 3: Header component

**Files:**
- Create: `src/components/Header.astro`

- [ ] **Step 3a: Build header with logo, 6 nav items, social icons, mobile hamburger menu**

```astro
---
// src/components/Header.astro
const navItems = [
  { label: 'หน้าแรก', href: '/' },
  { label: 'เกี่ยวกับเรา', href: '/about' },
  { label: 'บริการ', href: '/services' },
  { label: 'ผลงาน', href: '/portfolio' },
  { label: 'บทความ', href: '/blog' },
  { label: 'ติดต่อเรา', href: '/contact' },
];

const { currentPath = '/' } = Astro.props;
---

<header class="site-header">
  <div class="header-inner container">
    <a href="/" class="logo">
      <img src="/images/logo.png" alt="Party Villa Balloons" height="50" />
    </a>

    <nav class="desktop-nav">
      <ul>
        {navItems.map(item => (
          <li>
            <a href={item.href} class:list={{ active: currentPath === item.href }}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>

    <div class="social-icons">
      <a href="https://www.facebook.com/partyvillaballoon" target="_blank" rel="noopener" aria-label="Facebook">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      </a>
      <a href="https://www.tiktok.com/@partyvillaballoon" target="_blank" rel="noopener" aria-label="TikTok">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
      </a>
      <a href="https://line.me/R/ti/p/@partyvilla" target="_blank" rel="noopener" aria-label="LINE">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19.365 9.863c-1.107-1.453-2.944-2.215-5.602-2.215H10.24c-.749 0-1.112.345-1.112.987v8.857c0 .642.363.987 1.112.987h3.523c.749 0 1.112-.345 1.112-.987v-4.137h2.8c1.009 0 1.509-.415 1.509-1.25v-2.068c0-.835-.5-1.35-1.509-1.621zm-11.81.543c0-.642-.364-.987-1.112-.987H3.229c-.457 0-.774.118-.966.363-.184.245-.273.585-.273 1.022v7.382c0 .643.363.988 1.113.988h3.523c.749 0 1.112-.345 1.112-.988v-1.605H5.937v-1.411h3.589c.749 0 1.112-.345 1.112-.987V10.39l-.005.015z"/></svg>
      </a>
    </div>

    <button class="hamburger" aria-label="Menu" id="menuToggle">
      <span></span>
      <span></span>
      <span></span>
    </button>
  </div>

  <!-- Mobile menu overlay -->
  <div class="mobile-menu-overlay" id="mobileMenu">
    <button class="close-btn" id="closeMenu">&times;</button>
    <nav>
      <ul>
        {navItems.map(item => (
          <li>
            <a href={item.href} class:list={{ active: currentPath === item.href }}
               onclick="document.getElementById('mobileMenu').classList.remove('open')">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
      <div class="mobile-social">
        <a href="https://www.facebook.com/partyvillaballoon" target="_blank">Facebook</a>
        <a href="https://www.tiktok.com/@partyvillaballoon" target="_blank">TikTok</a>
        <a href="https://line.me/R/ti/p/@partyvilla" target="_blank">LINE</a>
      </div>
    </nav>
  </div>
</header>

<script>
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileMenu');
  const close = document.getElementById('closeMenu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => menu.classList.toggle('open'));
    close.addEventListener('click', () => menu.classList.remove('open'));
  }
</script>

<style>
  .site-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1000;
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border-color);
    height: var(--header-height);
  }

  .header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
  }

  .logo img { height: 45px; }

  .desktop-nav ul { display: flex; gap: 28px; }
  .desktop-nav a {
    font-weight: 500;
    padding: 8px 0;
    position: relative;
    transition: color 0.3s;
  }
  .desktop-nav a:hover,
  .desktop-nav a.active { color: var(--primary); }
  .desktop-nav a.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--primary);
  }

  .social-icons { display: flex; gap: 12px; }
  .social-icons a {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--bg-light);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
  }
  .social-icons a:hover { background: var(--primary); color: #fff; }

  .hamburger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 8px; }
  .hamburger span { width: 24px; height: 2px; background: var(--text-color); display: block; transition: 0.3s; }

  .mobile-menu-overlay {
    position: fixed;
    inset: 0;
    background: #fff;
    z-index: 2000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    padding: 40px 30px;
  }
  .mobile-menu-overlay.open { transform: translateX(0); }

  .close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    background: none;
    border: none;
    font-size: 2rem;
    cursor: pointer;
  }

  .mobile-menu-overlay nav ul { display: flex; flex-direction: column; gap: 20px; margin-top: 60px; }
  .mobile-menu-overlay nav a { font-size: 1.2rem; font-weight: 500; }

  .mobile-social { margin-top: 40px; display: flex; gap: 20px; }
  .mobile-social a { color: var(--primary); }

  @media (max-width: 768px) {
    .desktop-nav { display: none; }
    .social-icons { display: none; }
    .hamburger { display: flex; }
  }
</style>
```

---

### Task 4: Footer component

**Files:**
- Create: `src/components/Footer.astro`

- [ ] **Step 4a: Build footer with logo, social links, contact channels, copyright**

```astro
---
// src/components/Footer.astro
---

<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-col">
        <img src="/images/logo-white.png" alt="Party Villa Balloons" height="45" style="margin-bottom: 16px; filter: brightness(0) invert(1);" />
        <p>บริการจัดลูกโป่งเชียงใหม่ รับจัดลูกโป่งทุกโอกาส ครบวงจร ตั้งแต่จัดสถานที่ จนถึงบริการส่งถึงที่</p>
      </div>

      <div class="footer-col">
        <h4>ช่องทางติดต่อ</h4>
        <ul>
          <li>โทร: <a href="tel:0930518591">093-0518591</a></li>
          <li>LINE: <a href="https://line.me/R/ti/p/@partyvilla">@partyvilla</a></li>
          <li>Facebook: <a href="https://www.facebook.com/partyvillaballoon" target="_blank">Party Villa Balloons</a></li>
          <li>TikTok: <a href="https://www.tiktok.com/@partyvillaballoon" target="_blank">@partyvillaballoon</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>บริการของเรา</h4>
        <ul>
          <li><a href="/services">จัดลูกโป่งมาตรฐาน</a></li>
          <li><a href="/services">SnapBloom ลูกโป่งเอฟเฟกต์</a></li>
          <li><a href="/services">บริการส่งและติดตั้ง</a></li>
          <li><a href="/portfolio">ดูผลงานทั้งหมด</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>พื้นที่ให้บริการ</h4>
        <p>เชียงใหม่และจังหวัดใกล้เคียง</p>
        <div class="footer-social" style="margin-top: 16px;">
          <a href="https://www.facebook.com/partyvillaballoon" target="_blank">FB</a>
          <a href="https://www.tiktok.com/@partyvillaballoon" target="_blank">TT</a>
          <a href="https://line.me/R/ti/p/@partyvilla" target="_blank">LINE</a>
        </div>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container">
      <p>&copy; {new Date().getFullYear()} Party Villa Balloons. All rights reserved.</p>
    </div>
  </div>
</footer>

<style>
  .site-footer {
    background: var(--bg-dark);
    color: rgba(255,255,255,0.8);
    padding-top: 60px;
  }

  .footer-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr 1fr;
    gap: 40px;
    padding-bottom: 40px;
  }

  .footer-col h4 {
    color: #fff;
    margin-bottom: 16px;
    font-size: 1.1rem;
  }

  .footer-col ul { display: flex; flex-direction: column; gap: 10px; }
  .footer-col a:hover { color: var(--primary); }

  .footer-social { display: flex; gap: 12px; }
  .footer-social a {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    transition: 0.3s;
  }
  .footer-social a:hover { background: var(--primary); }

  .footer-bottom {
    border-top: 1px solid rgba(255,255,255,0.1);
    padding: 20px 0;
    text-align: center;
    font-size: 0.9rem;
  }

  @media (max-width: 768px) {
    .footer-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 480px) {
    .footer-grid { grid-template-columns: 1fr; }
  }
</style>
```

---

### Task 5: Homepage

**Files:**
- Create: `src/pages/index.astro`

- [ ] **Step 5a: Build homepage with hero banner, intro, gallery slider, Pinky section, TikTok embeds, FAQ accordion, CTA section**

```astro
---
// src/pages/index.astro
import Layout from '../layouts/Layout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';

import faq from '../data/faq.json';
import homeContent from '../data/home-content.json';

const galleryImages = homeContent.gallerySlider || [];
const tiktokEmbeds = homeContent.tiktokEmbeds || [];
---

<Layout title="Party Villa Balloons | รับจัดลูกโป่งเชียงใหม่ ครบวงจร">
  <Header currentPath={Astro.url.pathname} />

  <!-- Hero -->
  <section class="hero-parallax" style={`background-image: url('${homeContent.hero?.background || "/images/hero-bg.jpg"}');`}>
    <div class="hero-content">
      <h1>{homeContent.hero?.title || "Party Villa Balloons"}</h1>
      <p>{homeContent.hero?.subtitle || "บริการจัดลูกโป่งครบวงจรในเชียงใหม่"}</p>
      <a href="/portfolio" class="btn btn-outline">ดูผลงานของเรา</a>
    </div>
  </section>

  <!-- Welcome intro -->
  <section class="section-padding" style="text-align:center;">
    <div class="container">
      <p style="font-size:1.2rem; max-width:800px; margin:0 auto; line-height:2;">{homeContent.intro || ""}</p>
      <div style="margin-top:30px; display:flex; justify-content:center; gap:12px;">
        <a href="https://www.facebook.com/sharer/sharer.php?u=https://xn--12cmal7ftbft4d7etb1fxav2ej.com/" target="_blank" class="btn">แชร์ Facebook</a>
        <a href="https://line.me/R/msg/text/?Party%20Villa%20Balloons%20https://xn--12cmal7ftbft4d7etb1fxav2ej.com/" target="_blank" class="btn" style="background:#00B900;">แชร์ LINE</a>
      </div>
    </div>
  </section>

  <!-- Gallery slider -->
  <section class="section-padding" style="background:var(--bg-light);">
    <div class="container">
      <h2 class="section-title">ผลงานของเรา</h2>
      <p class="section-subtitle">ภาพตัวอย่างการจัดลูกโป่งในโอกาสต่างๆ</p>
      <div class="gallery-slider">
        {galleryImages.slice(0, 10).map(img => (
          <div class="slider-item">
            <img src={img.src} alt={img.alt} loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  </section>

  <!-- Pinky section -->
  <section class="section-padding" style="text-align:center;">
    <div class="container">
      <h2 class="section-title">จุดเด่นของเรา</h2>
      <p class="section-subtitle">{homeContent.pinky?.title || "น้องพิ้งกี้ รถบริการลูกโป่งเชียงใหม่"}</p>
      <div style="max-width:600px; margin:0 auto;">
        <img src={homeContent.pinky?.image || "/images/pinky-car.jpg"} alt="Pinky car" style="border-radius:var(--radius); box-shadow:var(--shadow-md);" />
      </div>
      <p style="margin-top:24px; max-width:700px; margin-inline:auto;">{homeContent.pinky?.description || ""}</p>
    </div>
  </section>

  <!-- TikTok embeds -->
  <section class="section-padding" style="background:var(--bg-light);">
    <div class="container">
      <h2 class="section-title">ติดตามเราบน TikTok</h2>
      <p class="section-subtitle">@partyvillaballoon</p>
      <div class="tiktok-grid">
        {tiktokEmbeds.slice(0, 5).map(t => (
          <div class="tiktok-embed-wrapper">
            <blockquote class="tiktok-embed" cite={t.url} data-video-id={t.id}>
              <section><a target="_blank" href={t.url}>@{t.handle}</a></section>
            </blockquote>
          </div>
        ))}
      </div>
      <div style="text-align:center; margin-top:30px;">
        <a href="https://www.tiktok.com/@partyvillaballoon" target="_blank" class="btn">ดูเพิ่มเติมบน TikTok</a>
      </div>
    </div>
    <!-- TikTok embed script -->
    <script async src="https://www.tiktok.com/embed.js"></script>
  </section>

  <!-- FAQ -->
  <section class="section-padding">
    <div class="container" style="max-width:800px;">
      <h2 class="section-title">คำถามที่พบบ่อย</h2>
      <p class="section-subtitle">FAQ</p>
      <div class="faq-list">
        {faq.map((item, i) => (
          <div class="faq-item">
            <button class="faq-question" onclick="this.parentElement.classList.toggle('open')">
              <span>{item.question}</span>
              <span class="faq-icon">+</span>
            </button>
            <div class="faq-answer">
              <p>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>

  <!-- CTA contact -->
  <section class="section-padding" style="background:var(--primary); color:#fff; text-align:center;">
    <div class="container">
      <h2 style="font-size:1.8rem; margin-bottom:16px;">มีคำถามเกี่ยวกับการจัดลูกโป่ง?</h2>
      <p style="font-size:1.1rem; margin-bottom:24px;">อุ้มตอบเองทุกข้อความ</p>
      <a href="https://line.me/R/ti/p/@partyvilla" target="_blank" class="btn" style="background:#fff; color:var(--primary);">พูดคุยกับเรา</a>
    </div>
  </section>

  <Footer currentPath={Astro.url.pathname} />
</Layout>

<script>
  function openFaq(btn) {
    btn.parentElement.classList.toggle('open');
  }
</script>

<style>
  .gallery-slider {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
  .slider-item {
    border-radius: var(--radius);
    overflow: hidden;
    aspect-ratio: 1;
  }
  .slider-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }
  .slider-item:hover img { transform: scale(1.05); }

  .tiktok-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
  }
  .tiktok-embed-wrapper {
    min-height: 400px;
  }

  @media (max-width: 768px) {
    .tiktok-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 480px) {
    .tiktok-grid { grid-template-columns: 1fr; }
  }

  .faq-list { display: flex; flex-direction: column; gap: 8px; }
  .faq-item {
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .faq-question {
    width: 100%;
    padding: 18px 20px;
    background: none;
    border: none;
    font-family: var(--font-main);
    font-size: 1rem;
    text-align: left;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
  }
  .faq-icon { font-size: 1.3rem; transition: transform 0.3s; }
  .faq-item.open .faq-icon { transform: rotate(45deg); }
  .faq-answer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
    padding: 0 20px;
  }
  .faq-item.open .faq-answer {
    max-height: 300px;
    padding: 0 20px 18px;
  }
</style>
```

---

### Task 6: About page

**Files:**
- Create: `src/pages/about.astro`

- [ ] **Step 6a: Build About page**

```astro
---
// src/pages/about.astro
import Layout from '../layouts/Layout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import aboutContent from '../data/about-content.json';
---

<Layout title="เกี่ยวกับเรา | Party Villa Balloons">
  <Header currentPath={Astro.url.pathname} />

  <section class="hero-parallax" style={`background-image: url('${aboutContent.hero?.background || "/images/about-hero.jpg"}');`}>
    <div class="hero-content">
      <h1>เกี่ยวกับเรา</h1>
      <p>รู้จักกับ Party Villa Balloons</p>
    </div>
  </section>

  <section class="section-padding">
    <div class="container" style="max-width:800px;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:40px; align-items:center;">
        <div>
          <img src={aboutContent.ownerImage || "/images/owner.jpg"} alt="อุ้ม - เจ้าของ Party Villa Balloons" style="border-radius:var(--radius); box-shadow:var(--shadow-md);" />
        </div>
        <div>
          {aboutContent.sections?.map(section => (
            <>
              <h3 style="color:var(--primary); margin-bottom:12px;">{section.title}</h3>
              <div style="margin-bottom:24px;">{section.content}</div>
            </>
          ))}
        </div>
      </div>
    </div>
  </section>

  <Footer />
</Layout>
```

---

### Task 7: Services page

**Files:**
- Create: `src/pages/services.astro`

- [ ] **Step 7a: Build Services page with 3 service cards and pricing link**

```astro
---
// src/pages/services.astro
import Layout from '../layouts/Layout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import services from '../data/services.json';
import servicesContent from '../data/services-content.json';
---

<Layout title="บริการ | Party Villa Balloons">
  <Header currentPath={Astro.url.pathname} />

  <section class="hero-parallax" style={`background-image: url('${servicesContent.hero?.background || "/images/services-hero.jpg"}');`}>
    <div class="hero-content">
      <h1>บริการของเรา</h1>
      <p>บริการจัดลูกโป่งครบวงจร</p>
    </div>
  </section>

  <section class="section-padding">
    <div class="container">
      <div class="grid-3">
        {services.map(s => (
          <div class="service-card">
            <div class="service-icon">{s.icon}</div>
            <h3>{s.title}</h3>
            <p>{s.description}</p>
            <ul class="service-features">
              {s.features?.map(f => <li>{f}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>

  <section class="section-padding" style="background:var(--bg-light); text-align:center;">
    <div class="container">
      <h2 class="section-title">รองรับทุกรูปแบบงาน</h2>
      <p class="section-subtitle">{servicesContent.ctaText || "ดูราคาและแพ็กเกจทั้งหมด"}</p>
      <a href={servicesContent.pricingUrl || "https://www.canva.com/..."} target="_blank" class="btn">ดูราคาและแพ็กเกจ</a>
    </div>
  </section>

  <Footer />
</Layout>

<style>
  .service-card {
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    padding: 40px 30px;
    text-align: center;
    transition: all 0.3s;
  }
  .service-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-5px);
  }
  .service-icon { font-size: 2.5rem; margin-bottom: 16px; }
  .service-card h3 { color: var(--primary); margin-bottom: 12px; }
  .service-card p { margin-bottom: 16px; color: #666; }
  .service-features { display: flex; flex-direction: column; gap: 6px; }
  .service-features li::before { content: "✓ "; color: var(--success); }
</style>
```

---

### Task 8: Portfolio / Gallery page with sticky sidebar

**Files:**
- Create: `src/pages/portfolio.astro`

- [ ] **Step 8a: Build Portfolio page with sticky sidebar gallery**

```astro
---
// src/pages/portfolio.astro
import Layout from '../layouts/Layout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import gallery from '../data/gallery.json';
import portfolioContent from '../data/portfolio-content.json';
---

<Layout title="ผลงาน | Party Villa Balloons">
  <Header currentPath={Astro.url.pathname} />

  <section class="hero-parallax" style={`background-image: url('${portfolioContent.hero?.background || "/images/portfolio-hero.jpg"}');`}>
    <div class="hero-content">
      <h1>ผลงานของเรา</h1>
      <p>รวมผลงานการจัดลูกโป่งทุกรูปแบบ</p>
    </div>
  </section>

  <section class="section-padding">
    <div class="container" style="display:flex; gap:30px;">
      <!-- Sidebar -->
      <aside class="gallery-sidebar">
        <h3>หมวดหมู่</h3>
        <nav>
          <ul>
            {gallery.map((cat, i) => (
              <li><a href={`#cat-${i}`}>{cat.category}</a></li>
            ))}
          </ul>
        </nav>
        <div class="sidebar-cta">
          <p>สนใจจัดลูกโป่ง?</p>
          <a href="/contact" class="btn" style="font-size:0.9rem; padding:10px 20px;">ติดต่อเรา</a>
        </div>
      </aside>

      <!-- Gallery content -->
      <div class="gallery-main">
        {gallery.map((cat, i) => (
          <div id={`cat-${i}`} class="gallery-category">
            <h2 class="category-title">{cat.category}</h2>
            <div class="gallery-masonry">
              {cat.images?.map(img => (
                <a href={img.src} class="gallery-item" data-lightbox={`cat-${i}`} data-title={img.alt}>
                  <img src={img.src} alt={img.alt} loading="lazy" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>

  <Footer />
</Layout>

<style>
  .gallery-sidebar {
    width: 260px;
    position: sticky;
    top: 100px;
    height: fit-content;
    flex-shrink: 0;
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    padding: 24px;
  }

  .gallery-sidebar h3 {
    margin-bottom: 16px;
    color: var(--primary);
  }

  .gallery-sidebar nav ul { display: flex; flex-direction: column; gap: 8px; }
  .gallery-sidebar nav a {
    padding: 8px 12px;
    display: block;
    border-radius: 4px;
    transition: background 0.3s;
    font-size: 0.95rem;
  }
  .gallery-sidebar nav a:hover { background: var(--bg-light); color: var(--primary); }

  .sidebar-cta {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color);
    text-align: center;
  }
  .sidebar-cta p { margin-bottom: 12px; font-weight: 500; }

  .gallery-main { flex: 1; min-width: 0; }

  .category-title {
    font-size: 1.5rem;
    margin-bottom: 20px;
    color: var(--text-color);
    padding-bottom: 8px;
    border-bottom: 2px solid var(--primary);
  }

  .gallery-category { margin-bottom: 50px; }

  .gallery-masonry {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .gallery-item {
    border-radius: 6px;
    overflow: hidden;
    aspect-ratio: 1;
    cursor: pointer;
  }

  .gallery-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }
  .gallery-item:hover img { transform: scale(1.08); }

  @media (max-width: 768px) {
    .container[style*="flex"] { flex-direction: column; }
    .gallery-sidebar { width: 100%; position: static; }
    .gallery-masonry { grid-template-columns: repeat(2, 1fr); }
  }
</style>
```

---

### Task 9: Blog index and individual post pages

**Files:**
- Create: `src/pages/blog/index.astro`
- Create: `src/pages/blog/[slug].astro`

- [ ] **Step 9a: Build blog index page**

```astro
---
// src/pages/blog/index.astro
import Layout from '../../layouts/Layout.astro';
import Header from '../../components/Header.astro';
import Footer from '../../components/Footer.astro';
import posts from '../../data/blog-posts.json';
---

<Layout title="บทความ | Party Villa Balloons">
  <Header currentPath={Astro.url.pathname} />

  <section class="hero-parallax" style="background-image: url('/images/blog-hero.jpg');">
    <div class="hero-content">
      <h1>บทความ</h1>
      <p>ความรู้และเคล็ดลับเกี่ยวกับลูกโป่ง</p>
    </div>
  </section>

  <section class="section-padding">
    <div class="container" style="display:flex; gap:30px;">
      <main class="blog-main">
        <div class="blog-list">
          {posts.map(post => (
            <article class="blog-card">
              {post.image && <img src={post.image} alt={post.title} class="blog-card-image" />}
              <div class="blog-card-body">
                <time>{post.date}</time>
                <h3><a href={`/blog/${post.slug}`}>{post.title}</a></h3>
                <p>{post.excerpt}</p>
                <a href={`/blog/${post.slug}`} class="read-more">อ่านต่อ →</a>
              </div>
            </article>
          ))}
        </div>
      </main>

      <aside class="blog-sidebar">
        <div class="sidebar-widget">
          <h3>บทความล่าสุด</h3>
          <ul>
            {posts.slice(0, 5).map(post => (
              <li><a href={`/blog/${post.slug}`}>{post.title}</a></li>
            ))}
          </ul>
        </div>
        <div class="sidebar-widget" style="margin-top:20px; text-align:center;">
          <h3>ดูผลงานของเรา</h3>
          <p>รวมผลงานการจัดลูกโป่งทุกรูปแบบ</p>
          <a href="/portfolio" class="btn" style="font-size:0.9rem; padding:10px 20px; margin-top:12px;">ดูผลงาน</a>
        </div>
      </aside>
    </div>
  </section>

  <Footer />
</Layout>

<style>
  .blog-main { flex: 1; min-width: 0; }

  .blog-list { display: flex; flex-direction: column; gap: 24px; }

  .blog-card {
    display: flex;
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    overflow: hidden;
    transition: box-shadow 0.3s;
  }
  .blog-card:hover { box-shadow: var(--shadow-sm); }

  .blog-card-image {
    width: 280px;
    min-height: 200px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .blog-card-body { padding: 24px; }
  .blog-card-body time { color: #999; font-size: 0.9rem; }
  .blog-card-body h3 { margin: 8px 0; }
  .blog-card-body h3 a:hover { color: var(--primary); }
  .blog-card-body p { color: #666; margin-bottom: 12px; }

  .read-more { color: var(--primary); font-weight: 500; }

  .blog-sidebar {
    width: 280px;
    flex-shrink: 0;
  }

  .sidebar-widget {
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    padding: 24px;
  }

  .sidebar-widget h3 { margin-bottom: 12px; color: var(--primary); font-size: 1.1rem; }
  .sidebar-widget ul { display: flex; flex-direction: column; gap: 8px; }
  .sidebar-widget a:hover { color: var(--primary); }

  @media (max-width: 768px) {
    .container[style*="flex"] { flex-direction: column; }
    .blog-card { flex-direction: column; }
    .blog-card-image { width: 100%; min-height: 180px; }
    .blog-sidebar { width: 100%; }
  }
</style>
```

- [ ] **Step 9b: Build dynamic blog post page using Astro params**

```astro
---
// src/pages/blog/[slug].astro
import Layout from '../../layouts/Layout.astro';
import Header from '../../components/Header.astro';
import Footer from '../../components/Footer.astro';
import posts from '../../data/blog-posts.json';

export function getStaticPaths() {
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const recentPosts = posts.filter(p => p.slug !== post.slug).slice(0, 5);
---

<Layout title={`${post.title} | Party Villa Balloons`}>
  <Header currentPath={Astro.url.pathname} />

  <section class="section-padding">
    <div class="container" style="max-width:900px;">
      <article class="blog-post">
        <time style="color:#999;">{post.date}</time>
        <h1 style="margin:12px 0 24px;">{post.title}</h1>
        {post.image && <img src={post.image} alt={post.title} style="width:100%; border-radius:var(--radius); margin-bottom:30px;" />}
        <div class="post-body">
          {post.body}
        </div>
      </article>

      <hr style="margin:40px 0; border:none; border-top:1px solid var(--border-color);" />

      <div style="margin-bottom:40px;">
        <h3>บทความอื่นๆ</h3>
        <div style="display:flex; gap:16px; margin-top:16px; flex-wrap:wrap;">
          {recentPosts.map(p => (
            <a href={`/blog/${p.slug}`} style="padding:8px 16px; background:var(--bg-light); border-radius:20px; font-size:0.9rem;">
              {p.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  </section>

  <Footer />
</Layout>

<style>
  .blog-post { line-height: 2; }
  .post-body h2 { margin: 24px 0 12px; color: var(--primary); }
  .post-body p { margin-bottom: 16px; }
  .post-body ul { margin-bottom: 16px; padding-left: 20px; list-style: disc; }
  .post-body ol { margin-bottom: 16px; padding-left: 20px; list-style: decimal; }
  .post-body img { max-width: 100%; border-radius: var(--radius); margin: 16px 0; }
</style>
```

---

### Task 10: Contact page with form

**Files:**
- Create: `src/pages/contact.astro`

- [ ] **Step 10a: Build Contact page with form, Turnstile, contact info**

```astro
---
// src/pages/contact.astro
import Layout from '../layouts/Layout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import contactContent from '../data/contact-content.json';
---

<Layout title="ติดต่อเรา | Party Villa Balloons">
  <Header currentPath={Astro.url.pathname} />

  <section class="hero-parallax" style={`background-image: url('${contactContent.hero?.background || "/images/contact-hero.jpg"}');`}>
    <div class="hero-content">
      <h1>ติดต่อเรา</h1>
      <p>พูดคุยกับเราได้ทุกช่องทาง</p>
    </div>
  </section>

  <section class="section-padding">
    <div class="container">
      <div class="contact-grid">
        <div class="contact-info">
          <div class="info-card">
            <h3>ที่อยู่</h3>
            <p>{contactContent.address || "เชียงใหม่"}</p>
          </div>
          <div class="info-card">
            <h3>โทรศัพท์</h3>
            <p><a href="tel:0930518591">093-0518591</a></p>
          </div>
          <div class="info-card">
            <h3>LINE</h3>
            <p><a href="https://line.me/R/ti/p/@partyvilla">@partyvilla</a></p>
          </div>
          <div class="info-card">
            <h3>Facebook</h3>
            <p><a href="https://www.facebook.com/partyvillaballoon" target="_blank">Party Villa Balloons</a></p>
          </div>
          <div class="info-card">
            <h3>TikTok</h3>
            <p><a href="https://www.tiktok.com/@partyvillaballoon" target="_blank">@partyvillaballoon</a></p>
          </div>

          <div style="margin-top:24px;">
            <img src={contactContent.pinkyImage || "/images/pinky-car.jpg"} alt="Pinky Car" style="border-radius:var(--radius); box-shadow:var(--shadow-md);" />
          </div>
        </div>

        <div class="contact-form-wrapper">
          <h2>ส่งข้อความถึงเรา</h2>
          <form id="contactForm" action="https://api.party-villa-balloons.pages.dev/contact" method="POST">
            <div class="form-group">
              <label for="name">ชื่อ *</label>
              <input type="text" id="name" name="name" required />
            </div>
            <div class="form-group">
              <label for="phone">เบอร์โทรศัพท์ *</label>
              <input type="tel" id="phone" name="phone" required />
            </div>
            <div class="form-group">
              <label for="message">รายละเอียด *</label>
              <textarea id="message" name="message" rows="5" required></textarea>
            </div>

            <!-- Turnstile widget -->
            <div class="cf-turnstile" data-sitekey="0x4AAAAAAA..." data-theme="light"></div>

            <button type="submit" class="btn" style="width:100%;">ส่งข้อความ</button>
          </form>
          <div id="formStatus" style="margin-top:12px; display:none;"></div>
        </div>
      </div>
    </div>
  </section>

  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

  <Footer />
</Layout>

<script>
  document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const status = document.getElementById('formStatus');
    const btn = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);

    btn.disabled = true;
    btn.textContent = 'กำลังส่ง...';
    status.style.display = 'none';

    try {
      const res = await fetch('https://api.party-villa-balloons.pages.dev/contact', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        status.textContent = 'ส่งข้อความสำเร็จ! เราจะติดต่อกลับโดยเร็ว';
        status.style.color = 'green';
        form.reset();
        turnstile.reset();
      } else {
        throw new Error('ส่งไม่สำเร็จ');
      }
    } catch (err) {
      status.textContent = 'เกิดข้อผิดพลาด กรุณาลองใหม่หรือติดต่อผ่าน LINE';
      status.style.color = 'red';
    }
    status.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'ส่งข้อความ';
  });
</script>

<style>
  .contact-grid {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 40px;
    align-items: start;
  }

  .info-card {
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    padding: 20px;
    margin-bottom: 12px;
  }

  .info-card h3 { color: var(--primary); margin-bottom: 8px; font-size: 1rem; }
  .info-card a { color: var(--text-color); }
  .info-card a:hover { color: var(--primary); }

  .contact-form-wrapper {
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    padding: 40px;
  }

  .contact-form-wrapper h2 { margin-bottom: 24px; color: var(--text-color); }

  .form-group { margin-bottom: 20px; }
  .form-group label { display: block; margin-bottom: 6px; font-weight: 500; }
  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-family: var(--font-main);
    font-size: 1rem;
    transition: border-color 0.3s;
  }
  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--primary);
  }

  .cf-turnstile { margin-bottom: 20px; }

  @media (max-width: 768px) {
    .contact-grid { grid-template-columns: 1fr; }
  }
</style>
```

---

### Task 11: Cloudflare Workers contact form handler

**Files:**
- Create: `workers/contact-form/src/index.ts`
- Create: `workers/contact-form/wrangler.toml`

- [ ] **Step 11a: Create Workers function to handle form submission**

```ts
// workers/contact-form/src/index.ts
interface Env {
  TURNSTILE_SECRET: string;
  CONTACT_EMAIL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const message = formData.get('message') as string;
    const turnstileToken = formData.get('cf-turnstile-response') as string;

    // Validate required fields
    if (!name || !phone || !message) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Verify Turnstile
    const turnstileRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET,
          response: turnstileToken,
        }),
      }
    );
    const turnstileData = await turnstileRes.json();

    if (!turnstileData.success) {
      return new Response('Invalid captcha', { status: 400 });
    }

    // Send email (using SendGrid or similar)
    const emailBody = `
      ชื่อ: ${name}
      เบอร์โทร: ${phone}
      ข้อความ: ${message}
    `;

    // Send email via email provider or forward to Slack/LINE
    console.log('Contact form submission:', { name, phone, message });

    return new Response('OK', { status: 200 });
  },
};
```

- [ ] **Step 11b: Create wrangler.toml for the Worker**

```toml
# workers/contact-form/wrangler.toml
name = "contact-form-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
CONTACT_EMAIL = "partyvillaballoons@gmail.com"

[env.production.vars]
TURNSTILE_SECRET = "" # Set via wrangler secret
```

---

### Task 12: Configure Cloudflare Pages deployment

**Files:**
- Modify: `astro.config.mjs`
- Create: `wrangler.toml` (project root for Pages)

- [ ] **Step 12a: Create project-level wrangler config for Cloudflare Pages**

```toml
# D:\www\party-villa-balloons\wrangler.toml
name = "party-villa-balloons"
compatibility_date = "2024-01-01"

pages_build_output_dir = "dist"
```

- [ ] **Step 12b: Build and verify**

```bash
npm run build
```

Expected: `dist/` directory contains all static HTML/CSS/JS assets with correct structure.

---

### Task 13: Add placeholder data files with content structure

**Files:**
- Create: `src/data/navigation.json`
- Create: `src/data/gallery.json`
- Create: `src/data/services.json`
- Create: `src/data/faq.json`
- Create: `src/data/blog-posts.json`
- Create: `src/data/home-content.json`
- Create: `src/data/about-content.json`
- Create: `src/data/services-content.json`
- Create: `src/data/portfolio-content.json`
- Create: `src/data/contact-content.json`

(These will be populated with scraped content from Task 0 — each file contains the exact Thai text, image URLs, gallery categories, and blog post data extracted from the WordPress site.)
