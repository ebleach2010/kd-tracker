const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL='file://'+path.resolve(__dirname,'../index.html');
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[];
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push('PE '+e.message));
  await p.goto(URL); await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{
    Store.reset();
    const out={};
    // working toggle never used -> editable false (nothing to edit)
    go('home');
    out.workingIsBuiltin = D().toggleTypes.some(t=>t.id==='working');
    out.iceIsBuiltin = D().toggleTypes.some(t=>t.id==='icebrain');
    // before flip: does working have any episode?
    out.beforeEpisodes = D().episodes.filter(e=>e.kind==='working').length;
    // flip working ON
    Toggles.flip('working');
    out.afterEpisodes = D().episodes.filter(e=>e.kind==='working').length;
    const open = Derive.openEpisode('working');
    out.openHasStart = !!(open && open.startTs);
    // can we edit its time? open the editor and change start, confirm it persists
    let err=null;
    try{
      episodeTimesEditor('"Working" times', open, (s,e)=>{ open.startTs=s; open.endTs=e; });
      // simulate confirm: find the Confirm btn in the editor scrim
      const btns=[...document.querySelectorAll('.scrim button')];
      const confirm=btns.find(x=>/Confirm/.test(x.textContent));
      out.editorOpened = !!confirm;
      // set start via changing then confirm
      const newStart = open.startTs - 2*3600000;
      // directly emulate the onSave path
      open.startTs = newStart; open.endTs = null;
      if(confirm) confirm.click();
    }catch(e){ err=e.message; }
    out.editErr=err;
    // same for icebrain
    Toggles.flip('icebrain');
    const io=Derive.openEpisode('icebrain');
    out.iceEditable = !!io;
    document.querySelectorAll('.scrim').forEach(s=>s.remove());
    return out;
  });
  console.log(JSON.stringify({errs,r},null,2));
  await b.close();
})();
