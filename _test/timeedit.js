const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL='file://'+path.resolve(__dirname,'../index.html');
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto(URL); await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{
    Store.reset();
    let confirmedTs=null;
    timeDateEditor('Test', Date.now(), t=>{ confirmedTs=t; });
    const input=document.querySelector('.scrim input[type=time]');
    input.setAttribute('data-marker','keepme');
    // change 3 times
    const setV=(v)=>{ input.value=v; input.dispatchEvent(new Event('change',{bubbles:true})); };
    setV('08:15');
    const sameNode1 = document.querySelector('.scrim input[type=time]')===input && input.getAttribute('data-marker')==='keepme';
    const marked1 = document.querySelector('.scrim').innerText.includes('Marked:');
    setV('09:30');
    const sameNode2 = document.querySelector('.scrim input[type=time]')===input;
    // confirm
    [...document.querySelectorAll('.scrim button')].find(x=>/Confirm/.test(x.textContent)).click();
    const d=new Date(confirmedTs);
    document.querySelectorAll('.scrim').forEach(s=>s.remove());
    return { sameNode1, sameNode2, marked1, confirmedHour:d.getHours(), confirmedMin:d.getMinutes() };
  });
  // episode editor: same check
  const r2=await p.evaluate(()=>{
    let saved=null;
    const ep={startTs:Date.now(),endTs:null};
    episodeTimesEditor('Ep', ep, (s,e)=>{ saved={s,e}; });
    const input=document.querySelector('.scrim input[type=time]');
    input.value='06:45'; input.dispatchEvent(new Event('change',{bubbles:true}));
    const sameNode=document.querySelector('.scrim input[type=time]')===input;
    [...document.querySelectorAll('.scrim button')].find(x=>/Confirm/.test(x.textContent)).click();
    document.querySelectorAll('.scrim').forEach(s=>s.remove());
    return { sameNode, savedHour:saved?new Date(saved.s).getHours():null };
  });
  console.log(JSON.stringify({errs,r,r2},null,2));
  await b.close();
})();
