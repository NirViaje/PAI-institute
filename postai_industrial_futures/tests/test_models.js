'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const M=require('../src/model.js');
const D=JSON.parse(fs.readFileSync(path.join(root,'data/research.json'),'utf8'));
let checks=0;
function near(a,b,tol=1e-7){assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);checks++;}
function ok(a,msg){assert.ok(a,msg);checks++;}
let baseline=[];
for(const [id,r]of Object.entries(D.regions)){
 const s=M.simulate(D.regions,{region:id});
 near(s.last.completion,r.expected,1e-12);
 if(id==='LAND')near(s.last.debt,9.16435141758285,1e-11);
 for(const x of s.rows){near(x.investment,x.imports+x.domestic);near(x.cash,x.startCash+x.ownCash+x.grant+x.draw-x.payment-x.investment);near(x.fx,x.startFx+x.ownFx+x.grant+x.draw-x.payment-x.imports);near(x.debt,x.startDebt+x.draw-x.principalPaid+x.interest-x.interestPaid);ok(x.completion>=0&&x.completion<=1.000000001);}
 baseline.push({id,name:r.name,expected:r.expected,actual:s.last.completion,debt:s.last.debt});
}
const c=M.aiCompute();near(c.cards,925925.925925926);near(c.twh,12.166666666666666);near(c.pv,6.944444444444444);near(c.area,138.88888888888889);
const cheap=M.aiCompute({price:.06});near(cheap.cards,c.cards);near(cheap.gw,c.gw);near(cheap.priceIndex,6);
near(M.aiCompute({burden:100}).twh,c.twh*100);near(M.aiCompute({adoption:0}).cards,0);
near(M.costModel().cut,.305);near(M.costModel({realized:0}).index,1);
const copper=M.mineral();near(copper.revenue,360);near(copper.fcf,130);near(copper.plan,32.5);near(copper.stressedPlan,14.5);near(copper.change,-.5538461538461539);
near(M.mineral({price:4000,cost:8000}).plan,0);ok(M.mineral({price:4000,cost:8000}).fcf<0);
const ag=M.agriculture();near(ag.after,297500);near(ag.replacement,80000);near(ag.exportTonnes,47500);near(ag.reinvest,7.775);near(ag.fx,27.875);near(ag.water,90);near(ag.pumping,15.09230769230769);
near(M.agriculture({exports:false}).exportTonnes,0);near(M.agriculture({exports:false}).unsold,47500);ok(M.agriculture({waterBudget:50}).waterMargin<0);ok(M.agriculture({yield:1}).reinvest===0);
const e=M.energy();near(e.pvMW,1297.2187629721875);near(e.batteryMWh,1200);near(e.finalSoc,e.initialSoc+e.chargeTotal*e.chargeEff-e.dischargeTotal/e.dischargeEff);near(e.loads,e.rows.reduce((s,x)=>s+x.served+x.unserved,0));
for(const weather of ['normal','cloud'])for(const hours of [0,5.256,12,24,48]){const v=M.energy({weather,batteryHours:hours});for(const r of v.rows){near(r.solar+r.firm+r.discharge,r.served+r.charge+r.curtail);ok(r.soc>=-1e-8&&r.soc<=v.batteryMWh*.9+1e-8);ok(r.unserved>=-1e-8);}near(v.finalSoc,v.initialSoc+v.chargeTotal*v.chargeEff-v.dischargeTotal/v.dischargeEff);ok(v.servedShare>=0&&v.servedShare<=1);}
ok(M.energy({weather:'cloud'}).unserved>e.unserved);ok(M.energy({batteryHours:24}).unserved<e.unserved);
const soc=M.social();near(soc.wagesNet+soc.privateProfit+soc.tax+soc.publicDividend,300);near(soc.revenue,78.15);near(soc.gap,21.85);near(soc.afterHousing,59.25);
let seed=20261023;function random(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}
for(let i=0;i<200;i++){
 const id=Object.keys(D.regions)[i%6];const s=M.simulate(D.regions,{region:id,rate:random()*15,grant:random()*2000,loan:random()*2000,costCut:random()*50,importShift:random()*40-20,returnMult:random()*200,mineMult:random()*200,growthAdd:random()*5-2,publicSpend:random()*200,localization:i%2?'time':'progress',shock:['none','resource','provider','drought'][i%4]});
 for(const x of s.rows){ok(Object.values(x).filter(v=>typeof v==='number').every(Number.isFinite),'no NaN');ok(x.investment>=-1e-8&&x.debt>=-1e-8&&x.cash>=-1e-8&&x.fx>=-1e-8);ok(x.completion>=0&&x.completion<=1.00000001);near(x.investment,x.imports+x.domestic);near(x.debt,x.startDebt+x.draw-x.principalPaid+x.interest-x.interestPaid);}
}
const result={test:'postai-industrial-model-regression',checks,passed:true,baseline,defaultEnergy:{servedShare:e.servedShare,pvMW:e.pvMW,batteryMWh:e.batteryMWh},scope:'Pure model regression, conservation identities and 200 deterministic randomized parameter stress tests; no empirical validation claimed.'};
fs.writeFileSync(path.join(__dirname,'model_results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
