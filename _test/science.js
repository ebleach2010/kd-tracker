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
  await p.evaluate(() => { Store.reset(); Dev.seed(70); });

  // science page renders
  await p.evaluate(() => go('science'));
  await p.waitForTimeout(200);
  const sci = await p.evaluate(() => ({
    cards: document.querySelectorAll('.card').length,
    h2s: [...document.querySelectorAll('h2')].map(h => h.textContent),
    links: document.querySelectorAll('a[target=_blank]').length,
    hasCurve: document.body.innerText.includes('E(t) = wA'),
    hasFcgr: document.body.innerText.includes('FcγR blockade'),
    backBtn: document.body.innerText.includes('Back'),
  }));

  // reachable from settings + model card
  await p.evaluate(() => go('settings')); await p.waitForTimeout(120);
  const fromSettings = await p.evaluate(() => document.body.innerText.includes('The science, in the open'));
  await p.evaluate(() => go('insights','modelcard')); await p.waitForTimeout(120);
  const fromModelCard = await p.evaluate(() => document.body.innerText.includes('Full methods'));

  // glucose meal-relation: quicklog dialog has the relation select
  await p.evaluate(() => go('home')); await p.waitForTimeout(100);
  const glucoseRel = await p.evaluate(() => {
    QuickLog.open('vital');
    const has = document.body.innerText.includes('Relation to food');
    const opts = [...document.querySelectorAll('.scrim select')].flatMap(s => [...s.options].map(o=>o.textContent));
    document.querySelector('.scrim') && document.querySelector('.scrim').remove();
    return { has, hasAfterMeal: opts.includes('After meal'), hasBeforeSnack: opts.includes('Before snack') };
  });

  console.log(JSON.stringify({ errs, sci, fromSettings, fromModelCard, glucoseRel }, null, 2));
  await b.close();
  if (errs.length) process.exit(2);
})();
