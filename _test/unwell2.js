const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+path.resolve(__dirname,'../index.html')); await p.waitForTimeout(300);
  const out=await p.evaluate(()=>{ Store.reset(); Dev.seed(40); logUnwell();
    const uw=D().assessments.find(a=>a.tooUnwell);
    const s=Score.seriesAll().find(x=>x.id===uw.id);
    const nii=Neuro.series().find(x=>x.id===uw.id);
    return { crashDay:{qol:Math.round(s.qol),cog:Math.round(s.cog),nii:Math.round(nii.nii)}, cadence:uw.cadence }; });
  // render calendar + home to confirm no errors, and the unwell button exists
  await p.evaluate(()=>go('home')); await p.waitForTimeout(100);
  const hasBtn=await p.evaluate(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Too unwell')));
  await p.evaluate(()=>{go('history');histState.view='calendar';render();}); await p.waitForTimeout(100);
  console.log(JSON.stringify({errs,out,hasBtn},null,2));
  await b.close(); if(errs.length)process.exit(2);
})();
