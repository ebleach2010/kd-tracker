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
  await p.evaluate(() => { Store.reset(); Dev.seed(40); });

  // IVIG card is the LAST card on home
  await p.evaluate(() => go('home')); await p.waitForTimeout(150);
  const ivigLast = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('#view .card')];
    const last = cards[cards.length - 1];
    return { lastCardHasIVIG: !!last && /IVIG/.test(last.textContent), totalCards: cards.length };
  });

  // report HTML generates without throwing and contains the sections
  const report = await p.evaluate(() => {
    const h = ReportDoc.html();
    return { len: h.length, hasAsmt: h.includes('Assessments & indices'), hasVitals: h.includes('Vitals'), hasIVIG: h.includes('IVIG infusions'), doctype: h.startsWith('<!doctype') };
  });

  // erase flow: step through the dialogs, confirm data is wiped only at the end
  await p.evaluate(() => go('settings')); await p.waitForTimeout(120);
  const flow = await p.evaluate(async () => {
    const clickBtn = (txt) => { const btns=[...document.querySelectorAll('.scrim .dlg button')]; const b=btns.find(x=>x.textContent.trim()===txt); if(b){b.click();return true;} return false; };
    eraseAllFlow();
    await new Promise(r=>setTimeout(r,60));
    const step1 = document.body.innerText.includes('Erase all data?');
    clickBtn('Yes');
    await new Promise(r=>setTimeout(r,60));
    const step2 = document.body.innerText.includes('Export a copy before erasing?');
    clickBtn('No, skip');
    await new Promise(r=>setTimeout(r,60));
    const step3 = document.body.innerText.includes('Ready to erase');
    const stillHasData = D().assessments.length > 0; // NOT yet erased
    // cancel out without erasing
    clickBtn('Cancel');
    return { step1, step2, step3, stillHasData, dataAfterCancel: D().assessments.length };
  });

  // now actually confirm erase
  const erased = await p.evaluate(async () => {
    const clickBtn = (txt) => { const btns=[...document.querySelectorAll('.scrim .dlg button')]; const b=btns.find(x=>x.textContent.trim()===txt); if(b){b.click();return true;} return false; };
    eraseAllFlow();
    await new Promise(r=>setTimeout(r,50)); clickBtn('Yes');
    await new Promise(r=>setTimeout(r,50)); clickBtn('No, skip');
    await new Promise(r=>setTimeout(r,50)); clickBtn('Confirm — erase all data');
    await new Promise(r=>setTimeout(r,80));
    return { assessments: D().assessments.length };
  });

  console.log(JSON.stringify({ errs, ivigLast, report, flow, erased }, null, 2));
  await b.close();
  if (errs.length) process.exit(2);
})();
