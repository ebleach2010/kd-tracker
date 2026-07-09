const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+path.resolve(__dirname,'../index.html')); await p.waitForTimeout(300);
  const out=await p.evaluate(()=>{ Store.reset();
    // PK curve at several days (IV)
    const curve=[0,1,3,7,14,28].map(d=>({d, ...Med.ivigEffect(d,'iv')}));
    // log an IVIG today and check context + toggle state
    D().ivig.push({id:'x',ts:Date.now()-3*DAY,schedule:'biweekly',route:'iv',setting:'home'}); Store.saveNow();
    const ctx=Derive.ivigContext(Date.now());
    // engine picks up ivig covariate
    Dev.seed(40); const V=Insights.vars(); const hasIvigVars=['ivig_effect','ivig_acute','ivig_sustained'].every(k=>V[k]);
    return { curve:curve.map(c=>`d${c.d}: total ${Math.round(c.total*100)}% (acute ${Math.round(c.acute*100)}, sust ${Math.round(c.sustained*100)})`),
      ctxDaysSince:ctx.daysSince, ctxTotal:Math.round(ctx.total*100), hasIvigVars }; });
  // toggle renders on Home
  await p.evaluate(()=>{Store.reset();go('home');}); await p.waitForTimeout(120);
  const ui=await p.evaluate(()=>({ ivigCard:[...document.querySelectorAll('#view h2')].some(h=>h.textContent==='IVIG') }));
  console.log(JSON.stringify({errs,out,ui},null,2));
  await b.close(); if(errs.length)process.exit(2);
})();
