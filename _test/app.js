const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL='file://'+path.resolve(__dirname,'../index.html');
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[];
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push('PE '+e.message));
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(()=>{ Store.reset(); Dev.seed(30); });
  // tabs render
  const tabs=['home','trends','history','settings'];
  const visited={};
  for(const t of tabs){ await p.evaluate(t=>go(t),t); await p.waitForTimeout(120); visited[t]=await p.$$eval('.card,.empty,.banner',e=>e.length); }
  // science page
  await p.evaluate(()=>go('science')); await p.waitForTimeout(120);
  const science=await p.$$eval('.card',e=>e.length);
  // assessment detail
  await p.evaluate(()=>{ const a=D().assessments[0]; go('history','a:'+a.id); }); await p.waitForTimeout(120);
  const detail=await p.$$eval('.card',e=>e.length);
  // scoring sanity + IVIG diamonds + tab count
  const chk=await p.evaluate(()=>{
    const cog=Cognition.latest(), best=Cognition.best(), mh=MentalHealth.latest();
    const cogSeries=Cognition.series().length, mhSeries=MentalHealth.series().length;
    return { tabCount:TABS.length, tabIds:TABS.map(t=>t.id), cog:cog&&cog.val, best, mh:mh&&mh.val,
      cogSeries, mhSeries, ivigCount:D().ivig.length,
      chartHasDiamond:(()=>{ go('trends'); return document.querySelector('#chartbox svg rect')!=null; })(),
      dassBand:MentalHealth.dassBand('dep',30), pclBand:MentalHealth.pclBand(40) };
  });
  // drive a full assessment quickly (auto-answer)
  const asmtBefore=await p.evaluate(()=>D().assessments.length);
  await p.evaluate(()=>Assess.start()); await p.waitForTimeout(100);
  // step through: for cog steps we can't auto-play easily; just verify the engine starts + can reach a quiz + finish via direct push
  const started=await p.evaluate(()=>Assess.active!=null && Assess.active.steps.length);
  await p.evaluate(()=>{ Assess.active=null; }); // abort
  // export
  const dl=[]; p.on('download',d=>dl.push(d.suggestedFilename()));
  await p.evaluate(()=>go('settings')); await p.waitForTimeout(80);
  await p.evaluate(()=>Export.csv()); await p.waitForTimeout(120);
  await p.evaluate(()=>Export.json()); await p.waitForTimeout(120);
  console.log(JSON.stringify({errs,visited,science,detail,chk,started,downloads:dl},null,2));
  await b.close();
  if(errs.length) process.exit(2);
})();
