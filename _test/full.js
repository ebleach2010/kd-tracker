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
  const dl = [];
  p.on('download', d => dl.push(d.suggestedFilename()));
  await p.goto(URL);
  await p.waitForTimeout(300);
  await p.evaluate(() => { Store.reset(); Dev.seed(70); });

  const visited = {};
  const tabs = ['home', 'trends', 'insights', 'history', 'events', 'sources', 'settings'];
  for (const t of tabs) {
    await p.evaluate(t => go(t), t);
    await p.waitForTimeout(140);
    visited[t] = await p.$$eval('.card,.banner,.empty', els => els.length);
  }
  // sub-screens
  await p.evaluate(() => go('insights', 'modelcard')); await p.waitForTimeout(120);
  visited.modelcard = await p.$$eval('.card', e => e.length);
  await p.evaluate(() => { const a = D().assessments[0]; go('history', 'a:' + a.id); }); await p.waitForTimeout(120);
  visited.detail = await p.$$eval('.card', e => e.length);
  // list view
  await p.evaluate(() => { go('history'); histState.view = 'list'; render(); }); await p.waitForTimeout(120);
  visited.list = await p.$$eval('.card', e => e.length);
  // insight filters
  await p.evaluate(() => { go('insights'); insightState.filter = 'delayed'; render(); }); await p.waitForTimeout(120);
  const delayedCount = await p.$$eval('.card', e => e.length);

  // exports (JSON + CSV + ICS) — trigger and capture download filenames
  await p.evaluate(() => Export.json()); await p.waitForTimeout(150);
  await p.evaluate(() => Export.csv('all')); await p.waitForTimeout(150);
  await p.evaluate(() => Export.ics()); await p.waitForTimeout(150);

  // toggle an episode on/off
  const epBefore = await p.evaluate(() => D().episodes.length);
  await p.evaluate(() => Toggles.flip('illness'));
  const epAfter = await p.evaluate(() => D().episodes.length);

  console.log(JSON.stringify({ errs, visited, delayedCount, downloads: dl, epBefore, epAfter }, null, 2));
  await b.close();
  if (errs.length) process.exit(2);
})();
