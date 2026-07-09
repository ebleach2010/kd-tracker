const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+path.resolve(__dirname,'../index.html')); await p.waitForTimeout(300);
  const out=await p.evaluate(()=>{ Store.reset();
    // ice brain toggle present?
    const iceTog=D().toggleTypes.some(t=>t.id==='icebrain');
    // partial finish: start daily pm, advance 2 steps, finish partial
    Assess.start('daily',null,'pm'); Assess.active.step=2;
    Assess.active.draft.partial=true; Assess.finish();
    const a=D().assessments[D().assessments.length-1];
    return { iceToggle:iceTog, partialSaved:a.partial===true, cadence:a.cadence };
  });
  // normalization: simulate old data without icebrain toggle -> reload adds it
  const norm=await p.evaluate(()=>{ const d=JSON.parse(localStorage.getItem('neuro_v1'));
    d.toggleTypes=d.toggleTypes.filter(t=>t.id!=='icebrain'); localStorage.setItem('neuro_v1',JSON.stringify(d)); return d.toggleTypes.some(t=>t.id==='icebrain'); });
  await p.reload(); await p.waitForTimeout(300);
  const afterReload=await p.evaluate(()=>D().toggleTypes.some(t=>t.id==='icebrain'));
  // partial finish button visible mid-assessment
  const btn=await p.evaluate(()=>{ Assess.start('daily',null,'pm'); Assess.active.step=1; Assess.render();
    return [...document.querySelectorAll('button')].some(b=>b.textContent.includes('Too unwell to finish')); });
  console.log(JSON.stringify({errs,out,normRemoved:norm,afterReloadHasIce:afterReload,partialBtn:btn},null,2));
  await b.close(); if(errs.length)process.exit(2);
})();
