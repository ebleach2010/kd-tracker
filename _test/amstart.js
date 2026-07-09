const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+path.resolve(__dirname,'../index.html')); await p.waitForTimeout(300);
  const r=await p.evaluate(async()=>{ Assess.start('weekly',null,'am');
    // advance through the first non-cognitive pages (sleep, vitals, 3 slider groups, moodwake)
    let out=[];
    for(let i=0;i<7;i++){ document.querySelectorAll('input[type=range]').forEach(e=>{e.value=4;e.dispatchEvent(new Event('input',{bubbles:true}));});
      out.push(Assess.active.steps[Assess.active.step].t);
      const btn=[...document.querySelectorAll('.btn.primary')].find(x=>!x.disabled&&/Next|Finish/.test(x.textContent)); if(!btn)break; btn.click(); await new Promise(r=>setTimeout(r,20)); }
    return { variant:Assess.active.draft.variant, reached:out, atStep:Assess.active.steps[Assess.active.step].t }; });
  console.log(JSON.stringify({errs, r},null,2));
  await b.close(); if(errs.length)process.exit(2);
})();
