const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL='file://'+path.resolve(__dirname,'../index.html');
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); await p.goto(URL); await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{
    Store.reset();
    const V=Insights.vars();
    const byKind={};
    Object.keys(V).forEach(k=>{ const kind=V[k].kind; (byKind[kind]=byKind[kind]||[]).push(V[k].label+'  ['+k+']'); });
    return {
      correlationVars: byKind,
      sliders: CONFIG.sliders.map(s=>s.label+(s.range?' (1–'+s.range+')':' (1–10)')),
      meds: D().meds.map(m=>m.name),
      supplements: D().supplements.map(m=>m.name),
      toggles: D().toggleTypes.map(t=>t.label),
      selfCare: D().selfCareTypes,
      eventTypes: D().eventTypes,
      glucoseSlots: CONFIG.glucoseSlots,
      glucoseRel: CONFIG.glucoseRel,
      questionnaires: ['DASS-21','PCL-5','DERS-16','BFI-10'],
      cognitive: Object.keys(CONFIG.neuroWeights).filter(k=>k.startsWith('obj_')),
      counts: { correlationTotal: Object.keys(V).length }
    };
  });
  console.log(JSON.stringify(r,null,2));
  await b.close();
})();
