const { chromium } = require('playwright-core');
const path = require('path');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = 'file://' + path.resolve(__dirname, '../index.html');
(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto(URL);
  await p.waitForTimeout(300);
  // start daily
  await p.evaluate(() => Assess.start('daily'));
  await p.waitForTimeout(200);
  let steps = 0;
  for (let i = 0; i < 40; i++) {
    // interact minimally: set any range inputs to a value
    await p.$$eval('input[type=range]', els => els.forEach(e => { e.value = Math.max(e.min, 3); e.dispatchEvent(new Event('input', { bubbles: true })); }));
    const nextBtn = await p.$('.btn.primary:not([disabled])');
    const title = await p.$eval('h2', h => h.textContent).catch(() => '');
    if (!nextBtn) { break; }
    const label = await nextBtn.textContent();
    await nextBtn.click();
    await p.waitForTimeout(120);
    steps++;
    if (label.includes('Finish')) break;
  }
  await p.waitForTimeout(200);
  const saved = await p.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('neuro_v1'));
    const a = d.assessments[d.assessments.length - 1];
    return d.assessments.length ? { count: d.assessments.length, cadence: a.cadence, sliders: Object.keys(a.sliders).length, hasSleep: !!a.sleep, tab: State.tab } : null;
  });
  console.log(JSON.stringify({ errs, steps, saved }, null, 2));
  await b.close();
  if (errs.length) process.exit(2);
})();
