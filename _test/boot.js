const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const ctx=await b.newContext(); // clean profile, no prior storage
  const p=await ctx.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+path.resolve(__dirname,'../index.html'));
  await p.waitForTimeout(500);
  const viewLen=await p.evaluate(()=>document.querySelector('#view')?document.querySelector('#view').children.length:'NO #view');
  const tabs=await p.$$eval('.tabbar button',b=>b.length).catch(()=>'none');
  const bodyText=await p.evaluate(()=>document.body.innerText.slice(0,60));
  console.log(JSON.stringify({errs,viewChildren:viewLen,tabs,bodyText},null,2));
  await b.close();
})();
