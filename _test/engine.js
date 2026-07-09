const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+path.resolve(__dirname,'../index.html')); await p.waitForTimeout(300);
  const out=await p.evaluate(()=>{
    // unit checks
    const x=[],y=[]; for(let i=0;i<40;i++){ x.push(i); y.push(i*2+Math.random()); }
    const kTau=Stats.kendall(x,y).r;
    const u=[],w=[]; for(let i=-20;i<20;i++){ u.push(i); w.push(i*i+Math.random()*5); } // U-shape
    const uTau=Stats.kendall(u,w).r, uDcor=Stats.distanceCorr(u,w);
    const bh=Stats.bh([{p:0.001},{p:0.02},{p:0.04},{p:0.5}],0.1).map(i=>i.fdr);
    Store.reset(); Dev.seed(70);
    const t0=Date.now(); const ins=Insights.compute(); const ms=Date.now()-t0;
    const f=ins.findings[0];
    return { kendallLinear:+kTau.toFixed(2), uShapeTau:+uTau.toFixed(2), uShapeDcor:+uDcor.toFixed(2),
      bhFlags:bh, computeMs:ms, findingCount:ins.findings.length, wellSampled:ins.wellSampled, laterUnlocked:ins.laterUnlocked,
      sampleFinding: f?{type:f.typeLabel, def:f.definition, conf:f.conf, fdr:f.fdr} : null };
  });
  console.log(JSON.stringify({errs,out},null,2));
  await b.close(); if(errs.length)process.exit(2);
})();
