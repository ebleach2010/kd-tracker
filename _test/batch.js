const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL='file://'+path.resolve(__dirname,'../index.html');
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:390,height:844}});
  const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push('PE '+e.message));
  await p.goto(URL); await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{
    Store.reset();
    const dupSliders=[];
    ['fatigue','cogFatigue','brainFog','depression','anxiety','overstim','visualDistortion','emotStressors','envStressors','generalStress','maritalStress','rumination','agitation','iceBrain','pem','sleepQuality','emotEngagement','socializing','mental','physical'].forEach(k=>{
      const arr=CONFIG.sliderDesc[k].slice(1,11);
      const uniq=new Set(arr.filter(Boolean));
      if(arr.some(x=>!x) || uniq.size<10) dupSliders.push(k+':'+uniq.size);
    });
    const V=Insights.vars();
    return { dupSliders, slots:CONFIG.glucoseSlots, glucoseKind:V.glucoseMean.kind,
      sleepHours:!!V.sleepHours, sleepMinGone:!V.sleepMin, sleep1:CONFIG.sliderDesc.sleepQuality[1], sleep10:CONFIG.sliderDesc.sleepQuality[10] };
  });
  // glucose now testable as an outcome (meal -> glucose)
  const outcomeCheck=await p.evaluate(()=>{
    const V=Insights.vars(); const keys=Object.keys(V);
    const outcomes=keys.filter(k=>V[k].kind==='symptom'||V[k].kind==='objective'||V[k].kind==='metric');
    return outcomes.includes('glucoseMean') && outcomes.includes('glucoseStability');
  });
  const sleepStep=await p.evaluate(()=>{
    Store.reset(); Assess.start('daily',null,'pm'); let found=false;
    for(let i=0;i<30 && Assess.active;i++){ if(document.body.innerText.includes('Average hours of sleep')){found=true;break;}
      const n=[...document.querySelectorAll('button')].find(x=>/Next|Continue/.test(x.textContent)); if(n)n.click(); else break; }
    return found;
  });
  console.log(JSON.stringify({errs,r,outcomeCheck,sleepStep},null,2));
  await b.close();
})();
