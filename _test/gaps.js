const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL='file://'+path.resolve(__dirname,'../index.html');
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{
    Store.reset();
    const DAY=86400000, now=Date.now();
    // two assessments 5 days apart => 4 blank days between
    D().assessments.push({id:'1',ts:now-5*DAY,cadence:'daily',sliders:{fatigue:5},exertion:{},sleep:{},meals:{},meds:[],supplements:[],glucose:[]});
    D().assessments.push({id:'2',ts:now,cadence:'daily',sliders:{fatigue:5},exertion:{},sleep:{},meals:{},meds:[],supplements:[],glucose:[]});
    const vecs=Insights.dayVectors();
    const before=Insights.gapDays(vecs);
    // mark 2 of those blank days "too busy"
    D().skips.push({id:'b1',ts:now-4*DAY,kind:'busy'});
    D().skips.push({id:'b2',ts:now-3*DAY,kind:'busy'});
    const after=Insights.gapDays(vecs);
    return { before, after };
  });
  console.log(JSON.stringify({errs,r}));
  await b.close();
})();
