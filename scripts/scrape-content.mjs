import * as cheerioModule from 'cheerio';
import { writeFileSync, mkdirSync } from 'fs';

const cheerio = cheerioModule.default || cheerioModule;
const BASE = 'https://xn--12cmal7ftbft4d7etb1fxav2ej.com';

const PAGES = {
  home: '/',
  about: '/%e0%b9%80%e0%b8%81%e0%b8%b5%e0%b9%88%e0%b8%a2%e0%b8%a7%e0%b8%81%e0%b8%b1%e0%b8%9a%e0%b9%80%e0%b8%a3%e0%b8%b2/',
  services: '/%e0%b8%9a%e0%b8%a3%e0%b8%b4%e0%b8%81%e0%b8%b2%e0%b8%a3/',
  gallery: '/%e0%b8%9c%e0%b8%a5%e0%b8%87%e0%b8%b2%e0%b8%99/',
  blog: '/%e0%b8%9a%e0%b8%97%e0%b8%84%e0%b8%a7%e0%b8%b2%e0%b8%a1/',
  contact: '/%e0%b8%95%e0%b8%b4%e0%b8%94%e0%b8%95%e0%b9%88%e0%b8%ad%e0%b9%80%e0%b8%a3%e0%b8%b2/',
};

const DATA_DIR = 'src/data';

async function fetchText(url) {
  const resp = await fetch(url);
  if (!resp.ok) return null;
  return await resp.text();
}

// Extract actual image URLs from WordPress HTML (handles lazy-loading)
function extractImageSrc($, imgEl) {
  // Check data-src (lazy loading), then src, then data-lazy-src
  const dataSrc = imgEl.attr('data-src');
  if (dataSrc && !dataSrc.startsWith('data:')) return dataSrc;
  const src = imgEl.attr('src');
  if (src && !src.startsWith('data:')) return src;
  const srcset = imgEl.attr('data-srcset') || imgEl.attr('srcset');
  if (srcset) {
    const firstUrl = srcset.split(',')[0].trim().split(' ')[0];
    return firstUrl;
  }
  return null;
}

// Extract all real image URLs from HTML content
function extractAllImages(html) {
  const urls = new Set();
  const regex = /https:\/\/xn--12cmal7ftbft4d7etb1fxav2ej\.com\/wp-content\/uploads\/[^"'\s)]+/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = match[0].split('?')[0]; // remove query params
    if (url && !url.includes('.svg')) {
      urls.add(url);
    }
  }
  return [...urls];
}

function extractHero($) {
  const banner = $('.banner').first();
  const heroImg = banner.find('.banner-bg img.bg').first();
  const bg = extractImageSrc($, heroImg) || heroImg.attr('src') || '';
  const textBox = banner.find('.text-box .text-inner');
  const title = textBox.find('h1, h2, h3, h4, strong').first().text().trim();
  const subtitle = textBox.find('p').first().text().trim();
  const cta = textBox.find('a.button').first();
  return {
    background: bg,
    title: title || '',
    subtitle: subtitle || '',
    ctaText: cta.text().trim() || '',
    ctaUrl: cta.attr('href') || '',
  };
}

function extractSocialLinks($) {
  const links = new Set();
  $('a[href*="facebook.com"], a[href*="instagram.com"], a[href*="tiktok.com"], a[href*="line.me"]').each((i, el) => {
    const href = $(el).attr('href');
    if (href && !href.includes('sharer') && !href.includes('share.php')) {
      links.add(href);
    }
  });
  return [...links];
}

function cleanText(text) {
  return text
    .replace(/\t/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/#text[^}]+}|@media[^}]+}|\.(col-inner|banner|section|row)[^}]+}[^}]*}/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function extractSections($) {
  const sections = [];
  $('.section').each((i, el) => {
    const textEls = $(el).find('.section-content');
    const textContent = cleanText(textEls.text());
    const titleEl = $(el).find('h1, h2, h3, h4, strong').first();
    const title = titleEl.text().trim();
    if (textContent && textContent.length > 30 && title) {
      sections.push({ title, content: textContent });
    }
  });
  return sections;
}

// ── SCRAPE ──

async function scrapeHome(html, $) {
  const hero = extractHero($);
  const allImages = extractAllImages(html);
  const heroBg = hero.background;

  // All real images on the page (exclude hero background, logo, SVG)
  const galleryImages = allImages
    .filter(url => url !== heroBg && !url.includes('Logo') && !url.includes('favicon'))
    .map(url => ({ src: url, alt: '' }));

  // Pinky image
  const pinkyImg = allImages.find(url => url.includes('pinky') || url.includes('Pinky')) || '';

  // Intro text
  const introEl = $('.section-content p strong').first().parent();
  const intro = cleanText(introEl.text());

  // FAQ extracted from page text on first run

  return {
    hero,
    intro: intro || '',
    galleryImages,
    pinky: { image: pinkyImg },
  };
}

async function scrapeAbout(html, $) {
  const hero = extractHero($);
  const allImages = extractAllImages(html);
  const textSections = extractSections($);

  return { hero, images: allImages, textSections };
}

async function scrapeServices(html, $) {
  const hero = extractHero($);
  const allImages = extractAllImages(html);
  const text = $.text();

  const pricingUrl = $('a[href*="canva"]').first().attr('href') || '';

  return { hero, images: allImages, pricingUrl, fullText: text };
}

async function scrapeGallery(html, $) {
  const hero = extractHero($);
  const allImages = extractAllImages(html);

  // Gallery categories from the page text
  const categories = [
    'ขอแต่งงาน, งานแต่งงาน, วันครบรอบ',
    'ลูกโป่งตกแต่งโชว์รูมรถ',
    'งานวันเกิด และงานปาร์ตี้ งานแสดงความยินดี',
    'Baby Shower, Welcome Baby, ลูกโป่งทายเพศ',
    'งานองค์กร และกิจกรรม',
    'แบคดรอป ซุ้มลูกโป่ง และเสาลูกโป่ง',
    'ลูกโป่งเอฟเฟกต์',
  ];

  // Try to find which images belong to which category
  // Since Flatsome loads images via JS, we'll create categories with all gallery images
  // and let the Astro pages use all images with the category labels
  const galleryImages = allImages.filter(url => !url.includes('Logo') && !url.includes('favicon') && !url.includes('bg.webp'));

  return {
    hero,
    categories,
    images: galleryImages.map(src => ({ src, alt: '' })),
  };
}

async function scrapeBlog(html, $) {
  const hero = extractHero($);
  const allImages = extractAllImages(html);

  // Extract blog post entries from the blog listing
  const posts = [];

  // Look for post-item structure in Flatsome blog
  $('.post-item, .large-9 .col, .blog-wrapper article').each((i, el) => {
    const link = $(el).find('a').first().attr('href');
    const title = $(el).find('h5 a, h3 a, .post-title a').first().text().trim();
    const dateEl = $(el).find('time, .post-date, .from_the_blog_date');
    let date = dateEl.text().trim();

    if (title && link && link.includes(BASE)) {
      // Try to extract date from the date element or nearby text
      if (!date) {
        const parentText = $(el).text();
        const dateMatch = parentText.match(/(\d{1,2})\s+(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)/);
        if (dateMatch) date = dateMatch[0];
      }
      posts.push({ title, link, date });
    }
  });

  // If that failed, try parsing from raw HTML for Flatsome blog structure
  if (posts.length === 0) {
    const rawHtml = html;
    const rx = /<h5[^>]*>.*?<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g;
    let m;
    while ((m = rx.exec(rawHtml)) !== null) {
      const link = m[1];
      const title = m[2].replace(/<[^>]+>/g, '').trim();
      if (title && link && link.includes(BASE) && !posts.some(p => p.link === link)) {
        const context = rawHtml.substring(Math.max(0, m.index - 500), m.index);
        const dateM = context.match(/(\d{1,2})\s+(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)/);
        posts.push({ title, link, date: dateM ? dateM[0] : '' });
      }
    }
  }

  return { hero, images: allImages, posts };
}

async function scrapeBlogPost(url) {
  const html = await fetchText(url);
  if (!html) return null;
  const $ = cheerio.load(html);

  const title = $('.entry-title, h1').first().text().trim();
  const article = $('.entry-content, article').first();
  const body = cleanText(article.text());
  const date = $('time, .entry-date, .post-date').first().text().trim() || '';
  const allImages = extractAllImages(html);
  const image = allImages.find(img => !img.includes('Logo')) || '';
  const slug = decodeURIComponent(url.split('/').filter(Boolean).pop() || '');

  // Structured body
  const bodyParts = [];
  article.find('> :where(h1,h2,h3,h4,h5,h6,p,ul,ol)').each((i, el) => {
    const tag = $(el).prop('tagName').toLowerCase();
    if (tag.startsWith('h')) {
      bodyParts.push({ type: 'heading', text: $(el).text().trim() });
    } else if (tag === 'p') {
      const t = $(el).text().trim();
      if (t) bodyParts.push({ type: 'paragraph', text: t });
    } else if (tag === 'ul' || tag === 'ol') {
      const items = [];
      $(el).find('li').each((j, li) => items.push($(li).text().trim()));
      if (items.length) bodyParts.push({ type: 'list', items });
    }
  });

  return { title, date, slug, image, body, bodyParts };
}

async function scrapeContact(html, $) {
  const hero = extractHero($);
  const text = $.text();
  const allImages = extractAllImages(html);
  const pinkyImage = allImages.find(u => u.includes('pinky') || u.includes('Pinky')) || '';

  // Extract contact info from text
  const address = (text.match(/ที่อยู่\s*:?\s*([^\n]+)/) || [])[1]?.trim() || '';
  const phone = (text.match(/โทร\s*:?\s*([^\n]+)/) || [])[1]?.trim() || '';
  const line = (text.match(/LINE\s*:?\s*([^\n]+)/) || [])[1]?.trim() || '';
  const facebook = (text.match(/Facebook\s*:?\s*([^\n]+)/) || [])[1]?.trim() || '';
  const tiktok = (text.match(/TikTok\s*:?\s*([^\n]+)/) || [])[1]?.trim() || '';

  return { hero, address, phone, line, facebook, tiktok, pinkyImage, allImages };
}

// ── MAIN ──
async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  // HOMEPAGE
  console.log('1/6 Homepage...');
  const homeHtml = await fetchText(BASE + PAGES.home);
  const $home = cheerio.load(homeHtml);
  const homeData = await scrapeHome(homeHtml, $home);

  // NAVIGATION
  const navItems = [];
  $home('.header-nav-main a.nav-top-link').each((i, el) => {
    const href = $home(el).attr('href');
    const label = $home(el).text().trim();
    if (href && label) navItems.push({ label, href: href.replace(BASE, '') });
  });
  const socialLinks = extractSocialLinks($home);
  const logo = $home('.header_logo').first().attr('src') || '';
  const trackingHtml = homeHtml;
  const gtm = (trackingHtml.match(/GTM-[A-Z0-9]+/) || [])[0] || '';
  const ga = (trackingHtml.match(/GT-[A-Z0-9]+/g) || [])[0] || '';
  const pixel = (trackingHtml.match(/fbq\('init',\s*'(\d+)'\)/) || [])[1] || '';

  // ABOUT
  console.log('2/6 About...');
  const aboutHtml = await fetchText(BASE + PAGES.about);
  const aboutData = aboutHtml ? await scrapeAbout(aboutHtml, cheerio.load(aboutHtml)) : {};

  // SERVICES
  console.log('3/6 Services...');
  const servicesHtml = await fetchText(BASE + PAGES.services);
  const servicesData = servicesHtml ? await scrapeServices(servicesHtml, cheerio.load(servicesHtml)) : {};

  // GALLERY
  console.log('4/6 Gallery...');
  const galleryHtml = await fetchText(BASE + PAGES.gallery);
  const galleryData = galleryHtml ? await scrapeGallery(galleryHtml, cheerio.load(galleryHtml)) : {};

  // BLOG
  console.log('5/6 Blog...');
  const blogHtml = await fetchText(BASE + PAGES.blog);
  const blogData = blogHtml ? await scrapeBlog(blogHtml, cheerio.load(blogHtml)) : {};

  // Individual blog posts
  console.log('  Fetching individual posts...');
  const blogPosts = [];
  for (const post of blogData.posts || []) {
    console.log(`    ${post.title}`);
    const full = await scrapeBlogPost(post.link);
    if (full) blogPosts.push(full);
  }

  // CONTACT
  console.log('6/6 Contact...');
  const contactHtml = await fetchText(BASE + PAGES.contact);
  const contactData = contactHtml ? await scrapeContact(contactHtml, cheerio.load(contactHtml)) : {};

  // ── WRITE JSON FILES ──
  const write = (name, data) => {
    writeFileSync(`${DATA_DIR}/${name}`, JSON.stringify(data, null, 2));
    console.log(`  ✓ ${name}`);
  };

  // navigation.json
  write('navigation.json', { logo, navItems, socialLinks });

  // site-settings.json
  write('site-settings.json', {
    name: 'Party Villa Balloons',
    description: 'บริการจัดลูกโป่งเชียงใหม่ ครบวงจร รับจัดลูกโป่งทุกโอกาส',
    url: BASE,
    logo,
    tracking: { gtm, ga, metaPixel: pixel },
    socialLinks,
  });

  // home-content.json
  write('home-content.json', {
    hero: homeData.hero,
    intro: homeData.intro || '🎈✨ ยินดีต้อนรับสู่ "ปาร์ตี้ วิลล่า บอลลูน" 🎉🎊 คุณกำลังมองหาการตกแต่งงานปาร์ตี้ที่สวยงามและน่าประทับใจอยู่ใช่ไหม? มาหาเราที่ "ปาร์ตี้ วิลล่า บอลลูน" ร้านลูกโป่งเชียงใหม่ เรามีลูกโป่งหลากหลายแบบ สีสันสดใส และการตกแต่งที่สร้างสรรค์ที่จะทำให้ทุกงานของคุณเป็นที่น่าจดจำ!',
    galleryImages: homeData.galleryImages.slice(0, 10),
    pinky: homeData.pinky,
  });

  // faq.json
  write('faq.json', [
    { question: 'ควรรับลูกโป่งก่อนงานกี่ชั่วโมง?', answer: 'แนะนำให้ลูกค้ารับลูกโป่งก่อนเวลาเริ่มงานประมาณ 1-2 ชั่วโมง เพื่อความสวยงาม และความสมบูรณ์แบบของลูกโป่งที่สุดค่ะ' },
    { question: 'หากรับลูกโป่งไปแล้วใช้ไม่ทัน หรือทิ้งไว้นานเกินไป จะเกิดอะไรขึ้น?', answer: 'ลูกโป่งอาจลอยไม่สวย หรือแตกได้ หากไม่ใช้ตามเวลาที่ทางร้านแนะนำ ถ้าหากเกิดปัญหาขึ้นจากการที่ลูกค้าทิ้งลูกโป่งไว้นานเกินไป ทางร้านขอสงวนสิทธิ์ไม่รับผิดชอบในกรณีดังกล่าวทุกกรณีค่ะ' },
    { question: 'ลูกโป่งใช้งานกลางแจ้งได้ไหม?', answer: 'ทางร้านไม่แนะนำให้ใช้ลูกโป่งกลางแจ้งในช่วงกลางวัน เนื่องจากแสงแดด และความร้อนอาจทำให้ลูกโป่งเสื่อมสภาพเร็ว หากจำเป็น ควรเลือกงานช่วงเย็น หรือที่มีร่มเงาค่ะ' },
    { question: 'สามารถปรับเปลี่ยนสี และข้อความบนลูกโป่งได้ไหม?', answer: 'ลูกค้าสามารถปรับเปลี่ยนรูปแบบได้ตามต้องการเลยค่ะ ทั้งโทนสี ข้อความ และลวดลาย เพียงแจ้งความต้องการล่วงหน้า 1-3 วัน' },
    { question: 'การจองงานต้องทำอย่างไรบ้าง?', answer: 'ลูกค้าสามารถจองคิวงานล่วงหน้าได้ตามช่องทางต่าง ๆ ของทางร้าน เราจะทำการรันคิวงานตามลำดับการชำระเงิน และแนะนำให้ลูกค้าจองล่วงหน้าอย่างน้อยสัก 7-14 วัน ก่อนเริ่มวันงานค่ะ' },
    { question: 'ต้องการใบกำกับภาษีต้องทำอย่างไร?', answer: 'แจ้งพนักงานตอนสั่งซื้อได้เลยค่ะ เราสามารถออกใบกำกับภาษีให้ทุกครั้งที่ลูกค้าร้องขอ' },
  ]);

  // about-content.json
  write('about-content.json', {
    hero: aboutData.hero || {},
    images: aboutData.images || [],
    sections: aboutData.textSections || [],
  });

  // services-content.json
  write('services-content.json', {
    hero: servicesData.hero || {},
    images: servicesData.images || [],
    pricingUrl: servicesData.pricingUrl || '',
  });

  // services.json — 3 main service cards
  write('services.json', [
    {
      title: 'บริการจัดงานมาตรฐาน (Basic Balloon Decor)',
      description: 'ครอบคลุมงานทั่วไป ตั้งแต่งานวันเกิด งานแต่ง งานเปิดร้าน ไปจนถึงงานอีเวนต์ขององค์กร ใช้ลูกโป่งฮีเลียมปลอดภัยไม่ติดไฟ 100%',
      features: ['ลูกโป่งฮีเลียมปลอดภัยไม่ติดไฟ 100%', 'ซุ้มลูกโป่ง', 'เสาลูกโป่ง', 'แบคดรอปลูกโป่ง'],
      icon: '🎈',
    },
    {
      title: 'ลูกโป่งเอฟเฟกต์ (SnapBloom)',
      description: 'SnapBloom by Party Villa — บริการลูกโป่งเอฟเฟกต์พิเศษที่สามารถสั่งให้ลูกโป่งแตกได้ด้วยรีโมท โดยไม่ต้องใช้ของแหลมหรือเข็มเจาะ สร้างจังหวะว้าวที่สมบูรณ์แบบ',
      features: ['สั่งแตกด้วยรีโมท', 'ไม่ต้องใช้เข็ม', 'เหมาะกับงานเปิดตัว งานแต่ง งานเฉลิมฉลอง'],
      icon: '🎉',
    },
    {
      title: 'บริการจัดส่งและติดตั้ง (Pinky Delivery)',
      description: 'บริการส่งโดย Pinky รถบริการลูกโป่งเชียงใหม่ พร้อมติดตั้งหน้างานโดยทีมช่างมืออาชีพ รับประกันลูกโป่งสดใหม่ 100%',
      features: ['ส่งด้วยรถ Pinky พร้อมถังฮีเลียมคุณภาพ', 'บริการติดตั้งหน้างานโดยช่างมืออาชีพ', 'รับประกันลูกโป่งสดใหม่ 100%'],
      icon: '🚗',
    },
  ]);

  // gallery.json
  write('gallery.json', {
    hero: galleryData.hero || {},
    categories: galleryData.categories || [],
    images: galleryData.images || [],
  });

  // blog-posts.json
  write('blog-posts.json', blogPosts);

  // contact-content.json
  write('contact-content.json', contactData);

  // portfolio-content.json (needed by portfolio page)
  write('portfolio-content.json', {
    hero: galleryData.hero || {},
    categories: galleryData.categories || [],
  });

  console.log('\n=== DONE ===');
  console.log(`Total blog posts: ${blogPosts.length}`);
  console.log(`Gallery images: ${(galleryData.images || []).length}`);
}

main().catch(err => { console.error('FAILED:', err); process.exit(1); });
