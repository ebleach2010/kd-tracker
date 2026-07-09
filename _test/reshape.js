const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+path.resolve(__dirname,'../index.html')); await p.waitForTimeout(300);
  const out=await p.evaluate(()=>{ Store.reset();
    const r={};
    // buildSteps shapes
    Assess.active={cadence:'quick'}; r.quick=Assess.buildSteps('quick').map(s=>s.t);
    Assess.active={cadence:'daily',variant:'am'}; r.dailyAm=Assess.buildSteps('daily','am').map(s=>s.t);
    Assess.active={cadence:'daily',variant:'pm'}; r.dailyPm=Assess.buildSteps('daily','pm').map(s=>s.t);
    r.dailyPmNoMeds=!r.dailyPm.includes('meds'); r.dailyPmNoCog=!r.dailyPm.some(s=>s==='cog');
    Assess.active={cadence:'weekly',variant:'pm'}; r.weeklyHasCog=Assess.buildSteps('weekly','pm').some(s=>s==='cog');
    // regimen add
    Rx.addRow(); r.regimenLen=D().regimen.length; r.regimenLogLen=D().regimenLog.length;
    D().regimen[0].freq='q6h'; Rx.logChange(D().regimen[0]); Store.saveNow();
    r.rxStateFreq=(rxStateOn(D().regimen[0].medId, Date.now())||{}).freq;
    return r; });
  // render meds tab, home (tabs incl Meds), run a quick check-in end to end
  await p.evaluate(()=>go('meds')); await p.waitForTimeout(120);
  const medsCards=await p.$$eval('#view .card',e=>e.length);
  const tabLabels=await p.$$eval('.tabbar button',bs=>bs.map(b=>b.textContent));
  // quick check-in flow
  const quick=await p.evaluate(async()=>{ Assess.start('quick'); let n=0;
    for(let i=0;i<6;i++){ document.querySelectorAll('input[type=range]').forEach(e=>{e.value=4;e.dispatchEvent(new Event('input',{bubbles:true}));});
      const btn=[...document.querySelectorAll('.btn.primary')].find(x=>!x.disabled&&/Next|Finish/.test(x.textContent)); if(!btn)break; const lab=btn.textContent; btn.click(); n++; await new Promise(r=>setTimeout(r,20)); if(lab.includes('Finish'))break; }
    const a=D().assessments[D().assessments.length-1]; return { steps:n, cadence:a&&a.cadence, hasAgitation:a&&a.sliders.agitation!=null, hasWellbeing:a&&a.sliders.moodEnd!=null }; });
  console.log(JSON.stringify({errs,out,medsCards,tabLabels,quick},null,2));
  await b.close(); if(errs.length)process.exit(2);
})();
