const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL='file://'+path.resolve(__dirname,'../index.html');
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{
    Store.reset();
    // descriptor direction now higher=better for sleep/engagement
    const sleep1=CONFIG.sliderDesc.sleepQuality[1], sleep10=CONFIG.sliderDesc.sleepQuality[10];
    const eng1=CONFIG.sliderDesc.emotEngagement[1], eng10=CONFIG.sliderDesc.emotEngagement[10];
    // scoring check: a GOOD sleep night (high value) should LOWER burden / RAISE QOL vs a bad night
    const hist=[]; for(let i=0;i<8;i++) hist.push({sliders:{sleepQuality:5}});
    const good={sliders:{sleepQuality:10}}, bad={sliders:{sleepQuality:1}};
    const sGood=Score.compute(good,hist), sBad=Score.compute(bad,hist);
    // higher sleepQuality => higher QOL
    const sleepRaisesQol = sGood.qol > sBad.qol;
    // glucose stability guard: <3 readings => undefined
    const mk=(vals)=>({ts:Date.now(),cadence:'daily',sliders:{},exertion:{},sleep:{},meals:{},meds:[],supplements:[],glucose:vals.map((x,i)=>({slot:'s'+i,value:x,ts:Date.now()}))});
    Store.reset();
    D().assessments.push(mk([100,110]));           // 2 readings -> no stability
    let v=Insights.dayVectors().slice(-1)[0]; const stab2=v.glucoseStability;
    Store.reset();
    D().assessments.push(mk([100,110,105,120]));   // 4 readings -> stability present
    v=Insights.dayVectors().slice(-1)[0]; const stab4=v.glucoseStability;
    return { sleep1, sleep10, eng1, eng10, sleepRaisesQol, stab2, stab4:Math.round(stab4) };
  });
  console.log(JSON.stringify({errs,r},null,2));
  await b.close();
})();
