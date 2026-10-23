/* Post-AI industrial futures — transparent conditional models, version 1.0.
 * Amounts in the finance model: million constant USD per 1 million residents.
 * These functions do not fetch data, execute AI, or infer country forecasts.
 */
(function(root){
'use strict';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const DEFAULT_FINANCE={region:'CU',rate:3,grant:250,loan:500,costCut:0,importShift:0,returnMult:100,mineMult:100,growthAdd:0,localization:'time',publicSpend:0,shock:'none'};
function simulate(regions,input={}){
 const p={...DEFAULT_FINANCE,...input},r=regions[p.region];
 if(!r)throw Error('未知区域原型');
 const base=24370.54794520548,target=base*(1-p.costCut/100);
 let cash=0,fx=0,debt=0,built=0,plan=0,unpaidSum=0,totalImports=0,paidInterestSum=0,maintenanceGapSum=0,fxOperatingGapSum=0;
 const rows=[];
 for(let y=1;y<=25;y++){
  const frac=y<=5?.02:y<=15?.035:.055,annualPlan=target*frac;plan+=annualPlan;
  const progress=built/target;
  const localFraction=p.localization==='progress'?progress:(y-1)/24;
  const imp=clamp(r.mi0+(r.mi1-r.mi0)*localFraction+p.importShift/100,.05,.95);
  const ag=r.ag*Math.pow(1+r.g+p.growthAdd/100,y-1);
  const other=r.other*Math.pow(1+r.g+p.growthAdd/100,y-1);
  let mine=r.mine*p.mineMult/100,returns=p.returnMult/100,exportMult=1;
  if(p.shock==='resource'&&y>=8&&y<=10)mine*=.5;
  if(p.shock==='provider'&&y>=8&&y<=9){returns*=.5;exportMult=.5;}
  if(p.shock==='drought'&&y>=8&&y<=10)exportMult=.6;
  const productive=built*r.prod,opCash=productive*r.ret*returns;
  const maintenance=built*(1-r.prod)*.01;
  const actualAg=(p.shock==='drought'&&y>=8&&y<=10)?ag*.5:ag;
  const ownCash=actualAg+other+mine+opCash-maintenance-p.publicSpend;
  const ownFx=r.fx*Math.pow(1+r.fg+p.growthAdd/100,y-1)*exportMult+mine+productive*r.fxret*returns-p.publicSpend*.15;
  const grant=y<=5?p.grant/5:0,draw=y<=5?p.loan/5:0;
  const startCash=cash,startFx=fx,startDebt=debt,startBuilt=built;
  const maintenanceGap=Math.max(0,-(cash+ownCash+grant+draw));
  maintenanceGapSum+=maintenanceGap;
  const fxOperatingGap=Math.max(0,-(fx+ownFx+grant+draw));fxOperatingGapSum+=fxOperatingGap;
  let availableCash=Math.max(0,cash+ownCash+grant+draw),availableFx=Math.max(0,fx+ownFx+grant+draw);
  const interest=debt*p.rate/100,principal=y>5?Math.min(debt,p.loan/20):0;
  const due=interest+principal,payment=Math.max(0,Math.min(due,availableCash,availableFx));
  const interestPaid=Math.min(interest,payment),principalPaid=Math.max(0,payment-interestPaid);
  const unpaid=Math.max(0,due-payment);unpaidSum+=unpaid;paidInterestSum+=interestPaid;
  availableCash-=payment;availableFx-=payment;
  const need=Math.max(0,Math.min(plan-built,annualPlan*1.25,target-built));
  const fxBudget=availableFx/imp;
  const investment=Math.max(0,Math.min(need,availableCash,fxBudget));
  const imports=investment*imp;totalImports+=imports;
  cash=availableCash-investment;fx=availableFx-imports;
  debt=Math.max(0,debt+draw-principalPaid+(interest-interestPaid));
  built+=investment;
  let binding=need<1e-8?'计划完成':investment>=need-1e-7?'年度计划/施工能力':availableCash<=fxBudget?'资金':'外汇';
  if(unpaid>1e-7)binding+=' / 偿债不足';
  rows.push({year:2026+y,y,annualPlan,plan,need,imp,ag:actualAg,other,mine,productive,opCash,maintenance,publicSpend:p.publicSpend,ownCash,ownFx,grant,draw,startCash,startFx,startDebt,startBuilt,interest,principal,due,payment,interestPaid,principalPaid,unpaid,investment,imports,domestic:investment-imports,cash,fx,debt,built,completion:built/target,planProgress:plan/target,target,binding,maintenanceGap,fxOperatingGap,
   solarMW:2953.767123287671*built/target,batteryMWh:4109.589041095891*built/target,housingM2:18e6*built/target,cementT:5.6e6*built/target,steelT:1.38e6*built/target});
 }
 return {params:p,rows,last:rows[24],target,totalImports,unpaidSum,paidInterestSum,maintenanceGapSum,fxOperatingGapSum};
}
function aiCompute(p={}){
 const v={population:4e9,tokens:1e5,burden:1,adoption:1,cloud:1,inputRatio:10,cache:.8,prefill:60000,decode:15000,util:.5,kw:1.25,pue:1.2,cf:.2,land:20,price:1,socialMWh:6,...p};
 const output=v.population*v.adoption*v.cloud*v.tokens;
 const input=output*v.inputRatio*(1-v.cache);
 const cards=(output/v.decode+input/v.prefill)*v.burden/(86400*v.util);
 const gw=cards*v.kw*v.pue/1e6,twh=gw*8.76,pv=gw/v.cf,area=pv*v.land;
 const societyTWh=v.population*v.socialMWh/1e6;
 return {cards,gw,twh,pv,area,priceIndex:v.price*100,societyTWh,share:societyTWh?twh/societyTWh:0,output,input};
}
function costModel(p={}){
 const v={knowledge:90,materials:20,delivery:30,realized:100,...p},f=v.realized/100;
 const parts=[{name:'材料与通用设备',weight:.55,cut:v.materials},{name:'设计与知识服务',weight:.15,cut:v.knowledge},{name:'安装与调试',weight:.20,cut:v.delivery},{name:'其他成本',weight:.10,cut:0}].map(a=>({...a,residual:a.weight*(1-a.cut/100*f)}));
 const index=parts.reduce((a,b)=>a+b.residual,0);
 return {parts,index,cut:1-index};
}
function mineral(p={}){
 const v={quantity:40000,price:9000,cost:5000,sustain:750,retention:50,allocation:50,...p};
 const revenue=v.quantity*v.price/1e6,operating=v.quantity*v.cost/1e6,reserve=v.quantity*v.sustain/1e6;
 const fcf=revenue-operating-reserve,distributable=Math.max(0,fcf),local=distributable*v.retention/100,plan=local*v.allocation/100;
 const stressedFcf=v.quantity*(v.price*.8-v.cost-v.sustain)/1e6;
 const stressedPlan=Math.max(0,stressedFcf)*v.retention/100*v.allocation/100;
 return {revenue,operating,reserve,fcf,local,plan,stressedPlan,change:plan?(stressedPlan/plan-1):null};
}
function agriculture(p={}){
 const v={yield:3.5,loss:15,irrigation:30000,waterBudget:100,exports:true,...p};
 const population=1e6,hectares=1e5,baseSupply=hectares*2*.85,demand=population*.25,after=hectares*v.yield*(1-v.loss/100);
 const oldImports=Math.max(0,demand-baseSupply),newImports=Math.max(0,demand-after);
 const replacement=oldImports-newImports,exportTonnes=v.exports?Math.max(0,after-demand):0,unsold=v.exports?0:Math.max(0,after-demand);
 const incremental=Math.max(0,after-baseSupply),sales=(replacement+exportTonnes)*250/1e6;
 const operations=8+incremental*30/1e6+2.5,fcf=sales-operations-2,reinvest=Math.max(0,fcf)*.5;
 const fx=sales-4,water=v.irrigation*3000/1e6,pumping=1000*9.81*40*water*1e6/.65/3.6e12;
 return {baseSupply,demand,after,replacement,oldImports,newImports,exportTonnes,unsold,sales,operations,fcf,reinvest,fx,water,pumping,waterMargin:v.waterBudget-water};
}
function crf(r,n){return Math.abs(r)<1e-10?1/n:r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);}
function energy(p={}){
 const v={demand:2,pvShare:100,cf:22,batteryHours:5.256,solarCost:800,storageCost:250,rate:5,weather:'normal',...p};
 const annualMWh=v.demand*1e6,avgMW=annualMWh/8760,pvMW=annualMWh*v.pvShare/100/(8760*v.cf/100*.8);
 const batteryMWh=avgMW*v.batteryHours,usable=batteryMWh*.9,chargeEff=Math.sqrt(.9),dischargeEff=Math.sqrt(.9),powerMW=avgMW*1.5;
 const dailyLoad=[.77,.74,.72,.72,.75,.82,.95,1.1,1.18,1.2,1.2,1.15,1.1,1.1,1.12,1.18,1.23,1.26,1.18,1.1,.99,.9,.84,.79];
 const meanLoad=dailyLoad.reduce((a,b)=>a+b,0)/24;
 const solar=Array.from({length:24},(_,h)=>Math.max(0,Math.sin(Math.PI*(h+.5-6)/12)));
 const meanSolar=solar.reduce((a,b)=>a+b,0)/24;
 const weather=v.weather==='cloud'?[1,1,.2,.15,.2,1,1]:[1,.95,1,.9,1,.95,1];
 let soc=usable/2,unserved=0,curtailed=0,loads=0,solarEnergy=0,chargeTotal=0,dischargeTotal=0;
 const initialSoc=soc,rows=[];
 for(let h=0;h<168;h++){
  const d=Math.floor(h/24),t=h%24,load=avgMW*dailyLoad[t]/meanLoad;
  const gen=pvMW*solar[t]/meanSolar*(v.cf/100)*weather[d]*.9;
  const firm=avgMW*(1-v.pvShare/100),net=gen+firm-load;
  let charge=0,discharge=0,shortage=0,curtail=0;
  if(net>=0){charge=Math.min(net,powerMW,Math.max(0,(usable-soc)/chargeEff));soc+=charge*chargeEff;curtail=net-charge;}
  else {discharge=Math.min(-net,powerMW,soc*dischargeEff);soc-=discharge/dischargeEff;shortage=-net-discharge;}
  soc=clamp(soc,0,usable);unserved+=shortage;curtailed+=curtail;loads+=load;solarEnergy+=gen;chargeTotal+=charge;dischargeTotal+=discharge;
  rows.push({hour:h,day:d+1,time:t,load,solar:gen,firm,charge,discharge,soc,unserved:shortage,curtail,served:load-shortage});
 }
 const pvCapexM=pvMW*v.solarCost/1000,storageCapexM=batteryMWh*v.storageCost/1000;
 const lcoe=(v.solarCost*crf(v.rate/100,25)+12)/(8760*v.cf/100);
 return {avgMW,pvMW,batteryMWh,powerMW,area:pvMW/1000*20,pvCapexM,storageCapexM,lcoe,rows,unserved,curtailed,loads,solarEnergy,servedShare:1-unserved/loads,initialSoc,finalSoc:soc,chargeTotal,dischargeTotal,chargeEff,dischargeEff};
}
function social(p={}){
 const v={valueAdded:300,labor:35,tax:15,publicEquity:20,targetServices:100,housing:30,...p};
 const wage=v.valueAdded*v.labor/100,profit=v.valueAdded-wage,tax=v.valueAdded*v.tax/100;
 const wagesNet=wage*(1-v.tax/100),profitsNet=profit*(1-v.tax/100);
 const publicDividend=profitsNet*v.publicEquity/100,privateProfit=profitsNet-publicDividend,revenue=tax+publicDividend;
 const delivered=Math.min(v.targetServices,revenue),gap=Math.max(0,v.targetServices-revenue);
 return {wage,profit,tax,wagesNet,profitsNet,publicDividend,privateProfit,revenue,delivered,gap,afterHousing:wagesNet-v.housing};
}
const api={DEFAULT_FINANCE,simulate,aiCompute,costModel,mineral,agriculture,energy,social,crf};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.PostAIModel=api;
})(typeof window!=='undefined'?window:globalThis);
