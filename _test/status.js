const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL='file://'+path.resolve(__dirname,'../index.html');
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[];
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push('PE '+e.message));
  await p.goto(URL); await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{
    Store.reset();
    Rx.addRow(); const row=D().regimen[0];
    const defaultStatus=row.status;
    // status dropdown options
    go('meds');
    const statOpts=[...document.querySelectorAll('#view select')].map(s=>[...s.options].map(o=>o.textContent)).find(a=>a.includes('Acute')&&a.includes('Continuing')&&a.includes('Stopped'));
    // acute → rx_active should be 0 (no carryover); continuing → 1; stopped → 0
    const DAY=86400000, now=Date.now();
    const hy=D().meds.find(m=>/hydromorph/i.test(m.name)); row.medId=hy.id;
    // acute state today
    row.status='acute'; Rx.logChange(row);
    // add an assessment today so a dayVector exists
    D().assessments.push({id:'a1',ts:now,cadence:'daily',sliders:{fatigue:5},exertion:{},sleep:{},meals:{},meds:[],supplements:[],glucose:[]});
    let vecs=Insights.dayVectors(); let v=vecs[vecs.length-1];
    const acuteActive=v['rx_'+hy.id+'_active'];
    // promote to continuing
    row.status='continuing'; Rx.logChange(row);
    vecs=Insights.dayVectors(); v=vecs[vecs.length-1];
    const contActive=v['rx_'+hy.id+'_active'];
    // stop it
    row.status='stopped'; Rx.logChange(row);
    vecs=Insights.dayVectors(); v=vecs[vecs.length-1];
    const stoppedActive=v['rx_'+hy.id+'_active'];
    return { defaultStatus, statOpts, acuteActive, contActive, stoppedActive };
  });
  // migration test
  const mig=await p.evaluate(()=>{
    const raw={schemaVersion:1, regimen:[{id:'x',medId:'caffeine',dose:70,freq:'acute',status:'continuing'},{id:'y',medId:'concerta',dose:18,freq:'stopped',status:'continuing'}]};
    Store.load(JSON.parse(JSON.stringify(raw)));
    // reload through normalizer by reading D()
    const r=D().regimen;
    return r.map(x=>({freq:x.freq,status:x.status}));
  });
  console.log(JSON.stringify({errs,r,mig},null,2));
  await b.close();
})();
