const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+path.resolve(__dirname,'../index.html')); await p.waitForTimeout(300);
  const out=await p.evaluate(()=>{ Store.reset();
    // craft data where caffeine + concerta together drive agitation
    const now=Date.now(); const A=[];
    for(let day=60; day>=0; day--){ const ts=now-day*DAY;
      const caf=Math.random()<0.5?1:0, con=Math.random()<0.5?1:0;
      const agit=Math.round(2 + caf*1 + con*1 + caf*con*5 + Math.random()*1); // synergy term
      const sleepBad=caf?Math.round(3+Math.random()*2):Math.round(7+Math.random()*2); // caffeine -> poor sleep
      const anx=Math.round(3 + (10-sleepBad)*0.4 + Math.random()); // poor sleep -> anxiety
      const a={id:uid(),ts,cadence:'daily',sliders:{agitation:Math.min(10,agit),anxiety:Math.min(10,anx),sleepQuality:sleepBad,fatigue:Math.round(3+Math.random()*3)},meds:[]};
      if(caf)a.meds.push({medId:'caffeine',dose:100,unit:'mg',ts,deviation:'added',changeType:'acute'});
      if(con)a.meds.push({medId:'concerta',dose:36,unit:'mg',ts,deviation:'added',changeType:'acute'});
      A.push(a); }
    D().assessments=A; Store.saveNow();
    const ins=Insights.compute();
    return { interactions:(ins.interactions||[]).slice(0,4).map(it=>`${it.aLabel} + ${it.bLabel} → ${it.oLabel} ${it.conf}% (vs ${it.mainA}/${it.mainB})`),
      pathways:(ins.pathways||[]).slice(0,4).map(p=>`${p.xLabel} → ${p.mLabel} → ${p.yLabel} ${p.conf}%`),
      findingCount:ins.findings.length }; });
  console.log(JSON.stringify({errs,out},null,2));
  await b.close(); if(errs.length)process.exit(2);
})();
