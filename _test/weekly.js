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
  const res = await p.evaluate(() => {
    const out = {};
    // steps
    Assess.active = { cadence: 'weekly', forTs: Date.now() };
    out.weeklySteps = Assess.buildSteps('weekly').map(s => s.t + (s.test ? ':' + s.test : '') + (s.quiz ? ':' + s.quiz : ''));
    // render each cog test into a detached container
    Assess.active = { cadence: 'weekly', startTs: Date.now(), forTs: Date.now(), step: 0, draft: { objective: {}, questionnaires: {} }, steps: [] };
    const tests = ['stroop', 'symbol', 'span', 'trails', 'search'];
    out.cogRender = {};
    for (const t of tests) {
      try { const c = document.createElement('div'); Cog[t](c, (() => { let s = 1; return () => (s = s * 48271 % 2147483647) / 2147483647; })(), () => {}, Assess); out.cogRender[t] = c.querySelectorAll('button,div').length > 0; }
      catch (e) { out.cogRender[t] = 'ERR ' + e.message; }
    }
    // quiz scoring sanity
    out.quiz = {};
    for (const q of ['dass21', 'pcl5', 'ders16', 'bfi10']) {
      const ans = {}; QUIZ[q].items.forEach((_, i) => ans[i] = i % (QUIZ[q].scale.length));
      out.quiz[q] = { items: QUIZ[q].items.length, score: QUIZ[q].score(ans) };
    }
    return out;
  });
  console.log(JSON.stringify({ errs, res }, null, 2));
  await b.close();
  if (errs.length) process.exit(2);
})();
