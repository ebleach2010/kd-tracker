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
  const out = await p.evaluate(() => {
    Store.reset(); Dev.seed(70);
    const nii = Neuro.series();
    const scores = Score.seriesAll();
    const ins = Insights.compute();
    return {
      assessments: D().assessments.length,
      niiCalibrated: nii.calibrated,
      niiLast: nii.length ? Math.round(nii[nii.length - 1].nii) : null,
      niiMin: Math.round(Math.min(...nii.map(n => n.nii))),
      niiMax: Math.round(Math.max(...nii.map(n => n.nii))),
      scoreLast: scores.length ? { qol: Math.round(scores[scores.length-1].qol), cog: Math.round(scores[scores.length-1].cog) } : null,
      insightsLocked: ins.locked,
      nDays: ins.nDays,
      findingCount: ins.findings ? ins.findings.length : 0,
      top5: ins.findings ? ins.findings.slice(0, 5).map(f => `${f.pLabel} → ${f.oLabel} [${f.timing}] r=${f.r} n=${f.n} conf=${f.conf}%`) : [],
    };
  });
  // render trends + insights tabs to catch render errors
  await p.evaluate(() => go('trends')); await p.waitForTimeout(150);
  await p.evaluate(() => go('insights')); await p.waitForTimeout(150);
  console.log(JSON.stringify({ errs, out }, null, 2));
  await b.close();
  if (errs.length) process.exit(2);
})();
