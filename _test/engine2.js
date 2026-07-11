const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL='file://'+path.resolve(__dirname,'../index.html');
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[];
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push('PE '+e.message));
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(()=>Store.reset());
  // start + intro
  await p.evaluate(()=>Assess.start()); await p.waitForTimeout(80);
  const introText=await p.evaluate(()=>document.body.innerText.includes('Five cognitive tasks'));
  // click Begin -> stroop renders
  await p.evaluate(()=>{[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Begin').click();});
  await p.waitForTimeout(120);
  const stroopRenders=await p.evaluate(()=>document.body.innerText.includes('Tap the INK color'));
  // simulate a finished assessment via the engine's finish (populate draft objective+questionnaires, jump to notes, finish)
  const saved=await p.evaluate(async()=>{
    Assess.active.draft.objective={stroop_rtMean:800,stroop_acc:0.9,symbol_correct:38,span_forward:6,span_backward:5,trails_sec:24,trails_errors:1,search_rtMean:1200,recall_correct:7,obj_recall:3};
    Assess.active.draft.questionnaires={dass21:{dep:12,anx:8,stress:16},pcl5:{total:22}};
    Assess.active.step=Assess.active.steps.length-1; // notes step
    Assess.render();
    const notesRenders=document.body.innerText.includes('Anything worth noting');
    // click Finish
    [...document.querySelectorAll('button')].find(x=>/Finish/.test(x.textContent)).click();
    await new Promise(r=>setTimeout(r,80));
    const a=D().assessments[D().assessments.length-1];
    return { notesRenders, count:D().assessments.length, cog:Cognition.index(a.objective), mh:MentalHealth.index(a.questionnaires), onHistory:State.tab==='history' };
  });
  console.log(JSON.stringify({errs,introText,stroopRenders,saved},null,2));
  await b.close();
  if(errs.length) process.exit(2);
})();
