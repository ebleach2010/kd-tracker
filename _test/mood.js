const { chromium } = require('playwright-core');
const path=require('path'); const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL='file://'+path.resolve(__dirname,'../index.html');
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto(URL); await p.waitForTimeout(300);
  const out=await p.evaluate(()=>{ Store.reset(); Dev.seed(70);
    const sc=Score.seriesAll(); const ins=Insights.compute();
    const mood=ins.findings.filter(f=>f.pk.startsWith('mood')||f.ok==='moodEnd').slice(0,4).map(f=>`${f.pLabel}→${f.oLabel} r=${f.r} ${f.conf}% [${f.timing}]${f.chronic?' chronic':''}`);
    const chronicN=ins.findings.filter(f=>f.chronic).length, acuteN=ins.findings.filter(f=>!f.chronic).length;
    return { qol:Math.round(sc[sc.length-1].qol), moodFindings:mood, chronicN, acuteN };
  });
  // morning mood quick log
  const ml=await p.evaluate(()=>{ const before=D().moodLogs.length; MoodLog.openWake();
    document.querySelector('.scrim input[type=range]'); const btn=[...document.querySelectorAll('.scrim .btn.primary')][0]; btn.click();
    return { before, after:D().moodLogs.length, wakeToday:hasWakeMoodToday() }; });
  console.log(JSON.stringify({errs,out,ml},null,2));
  await b.close(); if(errs.length)process.exit(2);
})();
