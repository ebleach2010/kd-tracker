// Headless smoke/e2e driver. Usage: node _test/drive.js [script]
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = 'file://' + path.resolve(__dirname, '../index.html');

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  await page.goto(URL);
  await page.waitForTimeout(400);

  const scenario = process.argv[2] || 'smoke';
  const out = {};

  if (scenario === 'smoke') {
    out.tabs = await page.$$eval('.tabbar button', bs => bs.map(b => b.textContent));
    out.title = await page.$eval('.hdr h1', h => h.textContent);
    // click through every tab
    const n = out.tabs.length;
    for (let i = 0; i < n; i++) {
      await page.$$eval('.tabbar button', (bs, i) => bs[i].click(), i);
      await page.waitForTimeout(120);
    }
  }

  if (scenario === 'seed') {
    // expose a seed if present
    const has = await page.evaluate(() => typeof window.Dev !== 'undefined' && !!Dev.seed);
    if (has) { await page.evaluate(() => Dev.seed(70)); out.seeded = true; }
    else out.seeded = false;
  }

  // allow arbitrary inline evaluation passed as 3rd arg file
  if (scenario === 'eval' && process.argv[3]) {
    const code = fs.readFileSync(process.argv[3], 'utf8');
    out.result = await page.evaluate(code);
  }

  console.log(JSON.stringify({ errors, out }, null, 2));
  await browser.close();
  if (errors.length) process.exit(2);
})();
