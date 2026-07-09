const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+path.resolve(__dirname,'../index.html')); await p.waitForTimeout(300);
  const out=await p.evaluate(()=>{ Store.reset(); Dev.seed(10);
    const now=Date.now();
    // add several items TODAY + one yesterday to confirm only-today clears
    D().assessments.push({id:uid(),ts:now,cadence:'quick',sliders:{agitation:5}});
    D().medLogs.push({medId:'concerta',dose:36,ts:now,deviation:'added'});
    D().vitals.push({type:'glucose',ts:now,value:100,slot:'Wake'});
    D().moodLogs.push({type:'wake',ts:now,value:6});
    D().episodes.push({id:uid(),kind:'illness',startTs:now,endTs:null});
    D().assessments.push({id:uid(),ts:now-DAY,cadence:'quick',sliders:{agitation:4}}); // yesterday
    Store.saveNow();
    const yb=D().assessments.filter(a=>dayKey(a.ts)===dayKey(now-DAY)).length;
    const beforeToday=D().assessments.filter(a=>dayKey(a.ts)===dayKey(now)).length;
    return { beforeTodayAssess:beforeToday, yesterdayAssess:yb }; });
  // trigger clear-all-today then confirm (click the confirm dialog Yes)
  const cleared=await p.evaluate(()=>{ go('home'); clearAllToday();
    const yes=[...document.querySelectorAll('.scrim .btn')].find(b=>b.textContent.includes('Yes')); yes&&yes.click();
    const t=dayKey(Date.now());
    return { todayAssess:D().assessments.filter(a=>dayKey(a.ts)===t).length,
      todayMed:D().medLogs.filter(e=>dayKey(e.ts)===t).length, todayVit:D().vitals.filter(e=>dayKey(e.ts)===t).length,
      todayMood:D().moodLogs.filter(e=>dayKey(e.ts)===t).length, todayEpisodeStart:D().episodes.filter(e=>dayKey(e.startTs)===t).length,
      yesterdayStillThere:D().assessments.filter(a=>dayKey(a.ts)===dayKey(Date.now()-DAY)).length }; });
  // clearMenu renders
  const menu=await p.evaluate(()=>{ Store.reset(); Dev.seed(5); D().assessments.push({id:uid(),ts:Date.now(),cadence:'quick',sliders:{}}); clearMenu();
    return { hasDialog:!!document.querySelector('.scrim .dlg'), clearBtns:[...document.querySelectorAll('.scrim .btn')].filter(b=>b.textContent==='Clear').length }; });
  console.log(JSON.stringify({errs,out,cleared,menu},null,2));
  await b.close(); if(errs.length)process.exit(2);
})();
