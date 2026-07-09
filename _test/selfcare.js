const { chromium } = require('playwright-core');
const path = require('path');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = 'file://' + path.resolve(__dirname, '../index.html');
(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { Store.reset(); });
  const res = await p.evaluate(() => {
    const inTypes = D().selfCareTypes.includes('Self care');
    const vars = Insights.vars ? Insights.vars() : {};
    const predictor = Object.keys(vars).includes('sc_Self care');
    // walk the daily assessment to the self-care step
    Assess.start('daily', null, 'pm');
    let found = false;
    for (let i=0;i<30 && Assess.active;i++){
      const b = document.body.innerText;
      if (b.includes('Self-care today') && b.includes('Self care')) { found = true; break; }
      const nextBtn = [...document.querySelectorAll('button')].find(x=>/Next|Continue/.test(x.textContent));
      if (nextBtn) nextBtn.click(); else break;
    }
    return { inTypes, predictor, foundInStep: found };
  });
  console.log(JSON.stringify({ errs, res }, null, 2));
  await b.close();
  if (errs.length) process.exit(2);
})();
