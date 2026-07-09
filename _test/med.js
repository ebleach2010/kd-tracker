const { chromium } = require('playwright-core');
const path=require('path'); const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL='file://'+path.resolve(__dirname,'../index.html');
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[];
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push('PE '+e.message));
  await p.goto(URL); await p.waitForTimeout(300);
  const out=await p.evaluate(()=>{
    Store.reset(); Dev.seed(70);
    const ins=Insights.compute();
    const concerta=ins.findings.filter(f=>f.pk.includes('concerta'));
    const afterStop=ins.findings.filter(f=>f.pk.endsWith('_afterStop'));
    const streak=ins.findings.filter(f=>f.pk.endsWith('_streakLen'));
    return { concertaFindings: concerta.slice(0,4).map(f=>`${f.pLabel} → ${f.oLabel} r=${f.r} conf=${f.conf}% ${f.after?'[after]':''}`),
      afterStopCount: afterStop.length, streakCount: streak.length,
      sampleAfter: afterStop.slice(0,3).map(f=>`${f.pLabel} → ${f.oLabel} r=${f.r} conf=${f.conf}%`) };
  });
  // render a weekly med step to confirm mg input UI
  const medUI=await p.evaluate(()=>{ Assess.start('daily'); Assess.active.step=1; Assess.render();
    const html=document.querySelector('#view').innerHTML;
    return { hasMg: html.includes('mg'), hasChangeType: html.includes('Acute change')||html.includes('Chronic'), hasSkipNote: html.includes('0 = skipped') };
  });
  console.log(JSON.stringify({errs,out,medUI},null,2));
  await b.close(); if(errs.length)process.exit(2);
})();
