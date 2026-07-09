const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+path.resolve(__dirname,'../index.html')); await p.waitForTimeout(300);
  const out=await p.evaluate(()=>{ Store.reset(); Dev.seed(30);
    // PK curve sanity for concerta (onset60 peak420 dur720)
    const pk={onset:60,peak:420,duration:720};
    const pkCurve=[10,60,120,420,600,720,800].map(min=>({min, ...Med.pkEffect(pk,min)}));
    // log a concerta dose 30 min ago, then check cogMedContext
    D().medLogs.push({medId:'concerta',dose:36,unit:'mg',ts:Date.now()-30*60000,deviation:'changed',changeType:'acute'});
    Store.saveNow();
    const ctx=Derive.cogMedContext(Date.now());
    return { pkCurve:pkCurve.map(c=>`${c.min}m: ${Math.round(c.level*100)}% ${c.phase}`), context:ctx.map(c=>`${c.name} ${c.effect}% ${c.phase} (${c.minsSince}m)`) };
  });
  // render a day view for today + a past day; render calendar (today diamond)
  const ui=await p.evaluate(()=>{ go('history'); histState.view='calendar'; render();
    const goldDiamond=document.querySelector('#view button span[style*="rotate(45deg)"]')?true:false;
    // open today day view
    const today=dayKey(Date.now()); go('history','day:'+today);
    const dayViewCards=document.querySelectorAll('#view .card').length;
    const hasAddButtons=[...document.querySelectorAll('#view button')].some(b=>b.textContent.includes('Full check-in'));
    return { goldDiamond, dayViewCards, hasAddButtons }; });
  console.log(JSON.stringify({errs,out,ui},null,2));
  await b.close(); if(errs.length)process.exit(2);
})();
