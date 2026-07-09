const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL='file://'+path.resolve(__dirname,'../index.html');
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:390,height:844}});
  const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push('PE '+e.message));
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(()=>{ Store.reset(); });
  // is hydromorphone a default med? what freq options exist?
  const meds = await p.evaluate(()=>({ meds:D().meds.map(m=>m.name), freqs: (typeof FREQS!=='undefined')?FREQS.map(f=>f[0]):null }));
  // add a regimen row, set it to hydromorphone q4h continuing, verify it persists across render
  const freqEdit = await p.evaluate(()=>{
    Rx.addRow();
    const row = D().regimen[D().regimen.length-1];
    const hy = D().meds.find(m=>/hydromorph/i.test(m.name));
    row.medId = hy? hy.id : row.medId;
    row.freq='q4h'; row.status='continuing'; Store.saveNow();
    // simulate what the select onchange does + re-render
    go('meds');
    const after = D().regimen[D().regimen.length-1];
    return { medId:after.medId, hydromorph: hy?hy.name:'(none)', freq:after.freq, status:after.status };
  });
  // new logDose dialog: has Acute/Chronic seg + editable time
  const doseDlg = await p.evaluate(()=>{
    const row=D().regimen[D().regimen.length-1];
    Rx.logDose(row);
    const txt=document.body.innerText;
    const has={acute:txt.includes('Acute'),chronic:txt.includes('Chronic'),timeTaken:txt.includes('Time taken'),editBtn:[...document.querySelectorAll('.scrim button')].some(b=>b.textContent.trim()==='Edit')};
    document.querySelector('.scrim')&&document.querySelector('.scrim').remove();
    return has;
  });
  console.log(JSON.stringify({errs,meds,freqEdit,doseDlg},null,2));
  await b.close();
})();
