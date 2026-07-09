const { chromium } = require('playwright-core'); const path=require('path');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL='file://'+path.resolve(__dirname,'../index.html');
(async()=>{ const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox']});
  const p=await b.newPage(); await p.goto(URL); await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{ Store.reset(); Dev.seed(60);
    const V=Insights.vars(); const keys=Object.keys(V);
    const outcomes=new Set(keys.filter(k=>V[k].kind==='symptom'||V[k].kind==='objective'));
    const predictors=new Set(keys.filter(k=>V[k].kind!=='objective'));
    // a prior is "live" if a=predictor & b=outcome OR b=predictor & a=outcome
    const dead=D().priors.filter(pr=>{
      const ab=(predictors.has(pr.a)&&outcomes.has(pr.b));
      const ba=(predictors.has(pr.b)&&outcomes.has(pr.a));
      return !(ab||ba);
    });
    return { total:D().priors.length, dead };
  });
  console.log(JSON.stringify(r,null,2)); await b.close();
})();
