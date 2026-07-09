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
  await p.evaluate(() => { Store.reset(); Dev.seed(30); });

  // Working is a built-in toggle, shows in the Home cluster, and can be flipped
  await p.evaluate(() => go('home')); await p.waitForTimeout(120);
  const res = await p.evaluate(() => {
    const hasType = D().toggleTypes.some(t => t.id === 'working' && t.label === 'Working');
    const inCluster = document.body.innerText.includes('Working');
    // flip it on
    const before = D().episodes.filter(e=>e.kind==='working').length;
    Toggles.flip('working');
    const openEp = Derive.openEpisode('working');
    // predictor variable exists
    const vars = Insights.vars ? Insights.vars() : null;
    const predictor = vars ? Object.keys(vars).some(k => k.startsWith('ep_working')) : 'n/a';
    return { hasType, inCluster, madeEpisode: !!openEp, predictor };
  });

  // built-in (non-removable) in settings toggle editor
  await p.evaluate(() => go('settings')); await p.waitForTimeout(120);
  const builtin = await p.evaluate(() => {
    const rows = [...document.querySelectorAll('.card')].find(c=>c.textContent.includes('State toggles'));
    return rows ? rows.textContent.includes('Working') : false;
  });

  console.log(JSON.stringify({ errs, res, builtin }, null, 2));
  await b.close();
  if (errs.length) process.exit(2);
})();
