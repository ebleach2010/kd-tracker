const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+path.resolve(__dirname,'../index.html')); await p.waitForTimeout(300);
  const out=await p.evaluate(()=>{ Store.reset(); Dev.seed(40);
    const before=Score.seriesAll(); const beforeNii=Neuro.series();
    logUnwell();
    const A=Score.seriesAll(); const last=A[A.length-1]; const nii=Neuro.series();
    const ins=Insights.compute(); const uw=ins.findings.filter(f=>f.pk==='tooUnwell').slice(0,2).map(f=>`${f.pLabel}→${f.oLabel} r=${f.r} ${f.conf}%`);
    return { unwellDayScore:{qol:Math.round(last.qol),cog:Math.round(last.cog)}, unwellNii:Math.round(nii[nii.length-1].nii),
      typicalQol:Math.round(before[before.length-1].qol), unwellFindings:uw, count:D().assessments.length }; });
  console.log(JSON.stringify({errs,out},null,2));
  await b.close(); if(errs.length)process.exit(2);
})();
