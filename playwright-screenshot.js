const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  // Screenshot Homepage
  console.log('Taking homepage screenshot...');
  await page.goto('http://172.19.154.93:3300/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.screenshot({ path: 'screenshots/01-homepage.png', fullPage: false });
  
  // Screenshot dengan scroll
  await page.screenshot({ path: 'screenshots/02-homepage-full.png', fullPage: true });
  
  // Screenshot Admin Login
  console.log('Taking admin login screenshot...');
  await page.goto('http://172.19.154.93:3300/backend/tpsadmin', { waitUntil: 'networkidle', timeout: 60000 });
  await page.screenshot({ path: 'screenshots/03-admin-login.png' });
  
  // Screenshot Berita
  console.log('Taking berita screenshot...');
  await page.goto('http://172.19.154.93:3300/berita/press-release', { waitUntil: 'networkidle', timeout: 60000 });
  await page.screenshot({ path: 'screenshots/04-berita.png' });
  
  // Screenshot Karir
  console.log('Taking karir screenshot...');
  await page.goto('http://172.19.154.93:3300/karir', { waitUntil: 'networkidle', timeout: 60000 });
  await page.screenshot({ path: 'screenshots/05-karir.png' });
  
  // Screenshot Layanan
  console.log('Taking layanan screenshot...');
  await page.goto('http://172.19.154.93:3300/layanan/container-services', { waitUntil: 'networkidle', timeout: 60000 });
  await page.screenshot({ path: 'screenshots/06-layanan.png' });
  
  await browser.close();
  console.log('Screenshots saved to screenshots/');
})();
