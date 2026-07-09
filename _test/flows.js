const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
async function drive(p, cad, variant){
  return await p.evaluate(async(args)=>{ Assess.start(args.cad,null,args.variant||undefined); let n=0;
    for(let i=0;i<30;i++){ document.querySelectorAll('input[type=range]').forEach(e=>{e.value=4;e.dispatchEvent(new Event('input',{bubbles:true}));});
      const btn=[...document.querySelectorAll('.btn.primary')].find(x=>!x.disabled&&/Next|Finish/.test(x.textContent)); if(!btn)break; const lab=btn.textContent; btn.click(); n++; await new Promise(r=>setTimeout(r,15)); if(lab.includes('Finish'))break; }
    const a=D().assessments[D().assessments.length-1]; return {steps:n,cadence:a&&a.cadence,variant:a&&a.variant}; }, {cad,variant});
}
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+path.resolve(__dirname,'../index.html')); await p.waitForTimeout(300);
  await p.evaluate(()=>Store.reset());
  const quick=await drive(p,'quick');
  const am=await drive(p,'daily','am');
  const pm=await drive(p,'daily','pm');
  // toggle time editor: open episode, open editor, confirm a new time
  const tog=await p.evaluate(()=>{ Toggles.flip('illness'); go('home');
    const open=Derive.openEpisode('illness'); const before=open.startTs;
    timeDateEditor('t', open.startTs, ts=>{ open.startTs=ts-3600000; Store.saveNow(); });
    // simulate confirm by calling onConfirm path directly: click green confirm
    const btns=[...document.querySelectorAll('.scrim .btn')]; const green=btns.find(x=>x.textContent.includes('Confirm')); green&&green.click();
    return { changed:Derive.openEpisode('illness').startTs!==before, dialogExisted:!!green }; });
  console.log(JSON.stringify({errs,quick,am,pm,tog},null,2));
  await b.close(); if(errs.length)process.exit(2);
})();
