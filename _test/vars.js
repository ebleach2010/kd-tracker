const { chromium } = require('playwright-core');
const path=require('path'); const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+path.resolve(__dirname,'../index.html')); await p.waitForTimeout(300);
  const out=await p.evaluate(()=>{ Store.reset(); Dev.seed(70); const ins=Insights.compute();
    const sc=ins.findings.filter(f=>f.pk.startsWith('sc_')).slice(0,3).map(f=>`${f.pLabel}→${f.oLabel} r=${f.r} ${f.conf}%`);
    const glu=ins.findings.filter(f=>f.pk.startsWith('glucose')).slice(0,3).map(f=>`${f.pLabel}→${f.oLabel} r=${f.r} ${f.conf}%`);
    return { selfCare:sc, glucose:glu, total:ins.findings.length }; });
  // drive a full daily incl selfcare+mood
  const daily=await p.evaluate(async()=>{ Assess.start('daily'); let n=0;
    for(let i=0;i<40;i++){ document.querySelectorAll('input[type=range]').forEach(e=>{e.value=4;e.dispatchEvent(new Event('input',{bubbles:true}));});
      const btn=[...document.querySelectorAll('.btn.primary')].find(x=>!x.disabled); if(!btn)break; const lab=btn.textContent; btn.click(); n++; await new Promise(r=>setTimeout(r,20)); if(lab.includes('Finish'))break; }
    const a=D().assessments[D().assessments.length-1]; return { steps:n, hasSelfCare:!!a.selfCare, moodEnd:a.sliders.moodEnd!=null }; });
  console.log(JSON.stringify({errs,out,daily},null,2));
  await b.close(); if(errs.length)process.exit(2);
})();
