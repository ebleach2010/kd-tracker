const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+path.resolve(__dirname,'../index.html')); await p.waitForTimeout(300);
  const steps=await p.evaluate(()=>{ Assess.active={cadence:'weekly',variant:'am'}; return Assess.buildSteps('weekly','am').map(s=>s.t+(s.test?':'+s.test:'')+(s.quiz?':'+s.quiz:'')); });
  // confirm morning excludes meals/selfcare/exertion/mood(end), includes sleep+cog+quiz
  const has=k=>steps.includes(k);
  const check={ noMeals:!has('meals'), noSelfcare:!has('selfcare'), noExertion:!has('exertion'), noEndMood:!has('mood'),
    hasSleep:has('sleep'), hasMoodwake:has('moodwake'), hasCog:steps.some(s=>s.startsWith('cog')), hasQuiz:steps.some(s=>s.startsWith('quiz')), hasVitals:has('vitals') };
  // AM slider keys used
  const amSliderSteps=await p.evaluate(()=>Assess.buildSteps('weekly','am').filter(s=>s.t==='sliders').flatMap(s=>s.keys));
  console.log(JSON.stringify({errs, stepCount:steps.length, check, amSliders:amSliderSteps},null,2));
  await b.close(); if(errs.length)process.exit(2);
})();
