const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL='file://'+path.resolve(__dirname,'../index.html');
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(300);
  // status carryover with DISTINCT timestamps (real usage) + stopped=0
  const carry=await p.evaluate(()=>{
    Store.reset(); const DAY=86400000, now=Date.now();
    const hy=D().meds.find(m=>/hydromorph/i.test(m.name));
    // continuing set 3 days ago
    D().regimenLog.push({ts:now-3*DAY,medId:hy.id,dose:2,freq:'q4h',status:'continuing'});
    D().assessments.push({id:'a',ts:now,cadence:'daily',sliders:{fatigue:5},exertion:{},sleep:{},meals:{},meds:[],supplements:[],glucose:[]});
    let v=Insights.dayVectors().slice(-1)[0]; const contActive=v['rx_'+hy.id+'_active'];
    // stopped yesterday
    D().regimenLog.push({ts:now-DAY,medId:hy.id,dose:2,freq:'q4h',status:'stopped'});
    v=Insights.dayVectors().slice(-1)[0]; const stoppedActive=v['rx_'+hy.id+'_active'];
    return { contActive, stoppedActive };
  });
  // migration via real boot path: write localStorage then reload
  await p.evaluate(()=>{
    localStorage.setItem('neuro_v1', JSON.stringify({schemaVersion:1, regimen:[
      {id:'x',medId:'caffeine',dose:70,freq:'acute',status:'continuing'},
      {id:'y',medId:'concerta',dose:18,freq:'stopped',status:'continuing'},
      {id:'z',medId:'hydromorphone',dose:2,freq:'q4h',status:'continuing'}]}));
  });
  await p.reload(); await p.waitForTimeout(300);
  const mig=await p.evaluate(()=>D().regimen.map(r=>({med:r.medId,freq:r.freq,status:r.status})));
  console.log(JSON.stringify({errs,carry,mig},null,2));
  await b.close();
})();
