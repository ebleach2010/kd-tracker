const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+path.resolve(__dirname,'../index.html')); await p.waitForTimeout(300);
  const out=await p.evaluate(()=>{ Store.reset();
    const dk=dayKey(Date.now());
    setMeal(dk,'breakfast','ate'); setMeal(dk,'lunch','skipped'); setMealIntent(dk,'lunch',false); setMeal(dk,'dinner','ate');
    const rec=D().mealDays[dk];
    // feed into engine: seed some days with meals + a symptom, check vars appear
    Store.reset(); Dev.seed(30);
    const now=Date.now();
    for(let i=0;i<30;i++){ const d=dayKey(now-i*DAY); D().mealDays[d]={breakfast:{ate:Math.random()<0.8},lunch:{ate:Math.random()<0.7},dinner:{ate:true},quality:Math.round(4+Math.random()*4)}; }
    Store.saveNow();
    const vecs=Insights.dayVectors(); const withMeals=vecs.filter(v=>v.mealsAte!=null).length;
    const V=Insights.vars(); const hasVars=['breakfast_ate','mealsAte','mealsSkipUnintent'].every(k=>V[k]);
    return { recorded:rec, engineDays:withMeals, hasMealVars:hasVars };
  });
  // render meals tab + confirm tab bar has Meals not Events
  await p.evaluate(()=>go('mealtab')); await p.waitForTimeout(120);
  const ui=await p.evaluate(()=>({ mealCards:document.querySelectorAll('#view .card').length,
    tabs:[...document.querySelectorAll('.tabbar button')].map(b=>b.textContent),
    eventsReachable: typeof Views.events==='function' }));
  console.log(JSON.stringify({errs,out,ui},null,2));
  await b.close(); if(errs.length)process.exit(2);
})();
