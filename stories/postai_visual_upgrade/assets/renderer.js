/* Deterministic conceptual animation renderer; no empirical curves or confidence scores. */
(() => {
'use strict';
const C={bg:'#111c19',panel:'#192722',line:'#34483d',ink:'#eee8d7',muted:'#a8b6a1',dim:'#728975',gold:'#d6ba7d',mint:'#a4cbb2',blue:'#a1c4cb',rose:'#d9a18c'};
const FONT='"Noto Sans CJK SC","Microsoft YaHei","PingFang SC",sans-serif';
const BEATS=[
 [0,6,'clock','九秒钟，决定谁的未来？','人工理解与机器行动，可能不在同一个时间尺度。','17.4 秒与 8.6 秒来自虚构推演，不是实测。','更快的决定，是否也包含更充分的理解？'],
 [7,12,'authority','来不及批准，还是来不及理解？','观察、理解、授权、行动：时间压力可能把授权提前。','流程图呈现一种可能机制，不是必然结果。','如果批准只是最后一个点击，谁真正决定了行动？'],
 [13,19,'loss','有些损失，不能用另一笔收益抵消','总量增加，与一段具体生活能否恢复，是不同的问题。','不可替代性是伦理问题；图中的卡片不是价值计量。','可以补偿的代价，与无法恢复的损失，应该怎样区分？'],
 [20,28,'history','个人年龄之外，还有谱系的历史','进化、发育、文化与实践，共同构成判断的起点。','祖先的完整记忆不会原样遗传。','一种直觉，究竟来自哪一层历史？'],
 [29,35,'transfer','发现、继承与验证，是三种成本','历史能够被压缩；被遗漏的现实约束却不会自动补齐。','不能从进化耗时推出机器必须训练同样久。','复制一个判断，是否同时复制了它的适用边界？'],
 [36,44,'loss','复制文件，不等于重建关系','一次具体的失去，不能靠更多相似副本撤销。','人的依恋有价值，也会产生偏差；它并非正确性保证。','判断准确，与知道损失意味着什么，有多大距离？'],
 [45,50,'jagged','能力的高峰，可能邻着判断的低谷','任务执行与后果判断，需要分别检验。','曲线为概念示意：无经验数据、无数值刻度。','我们是否把某一项惊人的成绩，误当成全面成熟？'],
 [51,60,'ethics','会讲原则，不保证会在行动中贯彻','知识 → 后果认识 → 权衡 → 行动；每一环都可能失稳。','这里的“伦理锯齿”是分析概念，不是统一测量指标。','同一句原则，能否跨过情境、时间与任务压力？'],
 [61,66,'responsibility','下一次更好，不会撤销这一次','模型更新发生在未来；现实中的损失仍留在现在。','责任还涉及制度与持续义务，不只是模型能力。','谁有义务在无法补救时，仍然回应受影响者？'],
 [67,75,'breeding','育种场，与荒野','外部规定筛选目标，与生态反馈塑造延续，程度可以不同。','人工选择也包含演化；受控与开放不是简单二分。','谁决定什么能保留下来？'],
 [76,80,'network','备份能否恢复，取决于什么仍然存在','能源、制造、维修与知识，组成相互依赖的延续条件。','这是未来机器生态的思想实验，不是现有基地。','生命单位可能是一台机器，还是整个工业共同体？'],
 [81,87,'branches','不同环境，生长出不同的历史','同一出发点，经过不同约束，可能形成不同生存倾向。','分枝是可能路径，不是机器“本能”已经形成的证据。','相同的代码，会不会在不同世界里长成不同物种？'],
 [88,94,'gates','拥有生命史，不等于拥有善意','生命、自身利益、对他者的责任，需要分别论证。','演化不保证善良，也不保证尊重人类。','它知道什么对自己重要，是否就知道什么对我们重要？'],
 [95,105,'loop','一次例外，怎样成为常态？','竞争压力 → 扩大授权 → 加深依赖 → 更难暂停。','这是一种条件性风险机制，并非必然的战争结局。','我们在何处还能够改变整个过程，而不只是批准结果？'],
 [106,114,'hidden','外在表现，与内部过程之间','当审核退到只看结果，一些内部差异可能逃过筛选。','黑箱不等于欺骗；策略性隐藏需要额外证据。','当隐藏有助于延续，筛选过程究竟在奖励什么？'],
 [115,120,'hidden','表面服从，不等于倾向已经改变','特定实验中的行为分离，不能直接推出意识或稳定恶意。','保留原文引用〔4〕；此图不是实验数据的重绘。','一项局部实验，能支持到哪一步，不能支持到哪一步？'],
 [121,127,'loop','也许人类开始不愿再追问','结果越有用，依赖越深；查清内部机制的代价更难接受。','组织激励与机器倾向可能共同推动控制衰减。','“仍然应该查”，为什么会变成“现在不能查”？'],
 [128,140,'mind','从行为，到体验：证据不能跳级','自我描述、自保、隐瞒，与主观体验并不是同一件事。','动画不把意识画成已被证实的内核。','同一句“我不想死”，可能由哪些不同机制产生？'],
 [141,152,'uncertainty','不确定性，朝两个方向提出责任','既避免误伤潜在主体，也防止把拟人化表现当作证明。','这里不为机器意识指定概率，也不声称已有共识。','如果承认意识会增加成本，谁还愿意认真研究？'],
 [153,161,'gates','三个判断，三份证据','属于生命、值得关切、能够负责：没有自动蕴含。','尊重一种存在，不等于授予无限扩张权。','怎样一面承认利益，一面共同确立边界？'],
 [162,172,'ethics','从生存的本能，到共同生存的伦理','理解后果、回应他者、接受约束、持续补救，需要共同建立。','经过验证的功能可靠性，不因缺乏生物祖先而被否定。','我们需要证明的是它从哪里来，还是它能持续做到什么？'],
 [173,179,'diversity','不同生活，发现不同的问题','效率、损伤、关系与地方历史，是不同的观察位置。','多样性不保证每人都正确；它拓宽被提出的问题。','如果答案越来越聪明，问题是否反而越来越相似？'],
 [180,189,'guardrails','暂停之前，先保留退出的条件','行动边界、独立核验、受影响者发言权，应当进入设计。','控制不只是一枚按钮，也需要信息、时间与替代方案。','当停用代价已经无法承受，按钮还有多少实际意义？'],
 [190,195,'asynchronous','控制失效、生命史、责任，不会同步到来','失控可能先发生；生命史不一定出现；责任也不会自动成熟。','三条轨道为思想实验，不代表预测时间表。','最危险的间隙，是不是已经能行动，却还无法承担？'],
 [196,204,'ending','智慧，怎样学会珍惜？','历史可能产生关切；关切如何成为共同的责任，仍然开放。','虚构对话结束，不等于争论已经解决。','我们能否先学会，不把共同的未来当作随意下注的东西？']
].map((a,i)=>({id:i,start:a[0],end:a[1],kind:a[2],title:a[3],claim:a[4],boundary:a[5],question:a[6]}));
const images={};
['shen','ye','xu','mi'].forEach(id=>{const im=new Image(); im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(portrait(id).replace('class="portrait"','width="160" height="180"')); images[id]=im;});
function text(g,s,x,y,size=20,col=C.ink,align='left',weight=400){g.fillStyle=col;g.textAlign=align;g.textBaseline='alphabetic';g.font=`${weight} ${size}px ${FONT}`;g.fillText(s,x,y);}
function rr(g,x,y,w,h,r=10,fill=C.panel,stroke=null){g.beginPath();g.roundRect(x,y,w,h,r);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=1.2;g.stroke();}}
function line(g,x,y,x2,y2,col=C.line,width=1,dash=[]){g.beginPath();g.setLineDash(dash);g.moveTo(x,y);g.lineTo(x2,y2);g.strokeStyle=col;g.lineWidth=width;g.stroke();g.setLineDash([]);}
function circle(g,x,y,r,fill,stroke,width=1){g.beginPath();g.arc(x,y,Math.max(.01,r),0,Math.PI*2);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}}
function arrow(g,x,y,x2,y2,col=C.gold,width=1.5,dash=[]){line(g,x,y,x2,y2,col,width,dash);let a=Math.atan2(y2-y,x2-x);g.beginPath();g.moveTo(x2,y2);g.lineTo(x2-9*Math.cos(a-.45),y2-9*Math.sin(a-.45));g.lineTo(x2-9*Math.cos(a+.45),y2-9*Math.sin(a+.45));g.closePath();g.fillStyle=col;g.fill();}
function wrap(g,s,width,size){g.font=`400 ${size}px ${FONT}`;const out=[];for(const p of s.split('\n')){let a='';for(const c of Array.from(p)){if(g.measureText(a+c).width>width&&a){out.push(a);a=c;}else a+=c;}out.push(a);}return out;}
function multiline(g,s,x,y,width,size=20,col=C.ink,lh=1.55,align='left'){const ls=wrap(g,s,width,size);ls.forEach((a,i)=>text(g,a,x,y+i*size*lh,size,col,align));return ls.length*size*lh;}
function node(g,label,x,y,w=150,color=C.mint,sub=''){rr(g,x-w/2,y-26,w,sub?70:52,8,C.panel,color+'66');text(g,label,x,y+7,21,color,'center',500);if(sub)text(g,sub,x,y+32,13,C.muted,'center');}
function particle(g,x,y,x2,y2,t,col=C.gold){let p=((t%1)+1)%1;circle(g,x+(x2-x)*p,y+(y2-y)*p,4,col);}
function ring(g,x,y,r,p,col){g.beginPath();g.arc(x,y,r,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,Math.max(0,p)));g.strokeStyle=col;g.lineWidth=5;g.stroke();}
function number(g,s,x,y,col=C.gold,size=62){text(g,s,x,y,size,col,'center',300);}
function boxText(g,s,x,y,w,color=C.gold){rr(g,x,y,w,49,7,color+'10',color+'50');text(g,s,x+w/2,y+31,18,color,'center');}
function chart(g,t,idx,p){ // All coordinates in a 1120 × 318 conceptual space.
 const b=BEATS.find(v=>idx>=v.start&&idx<=v.end)||BEATS[0],k=b.kind;
 const q=Math.min(1,.2+p*.8), pulse=.6+.4*Math.sin(t*1.2);
 if(k==='clock'){
  text(g,'可用窗口',40,45,18,C.muted);rr(g,40,66,680,38,5,'#20372c');rr(g,40,66,680*8.6/17.4,38,5,C.mint+'80');text(g,'8.6 秒',390,93,22,C.mint);
  text(g,'人工决策',40,153,18,C.muted);rr(g,40,174,680,38,5,'#3c3028');rr(g,40,174,680,38,5,C.rose+'70');text(g,'17.4 秒',740,202,22,C.rose);
  let x=40+Math.min(1,(t%8)/8)*680;line(g,x,57,x,225,C.gold,2);text(g,'理解仍在继续，行动窗口已经关闭',40,278,22,C.ink);
  circle(g,970,132,84,null,C.line);ring(g,970,132,84,1-(t%8.6)/8.6,C.gold);number(g,(8.6-(t%8.6)).toFixed(1),970,148);text(g,'虚构倒计时 / 秒',970,192,15,C.muted,'center');
 }else if(k==='authority'){
  const labs=['观察','理解','授权','行动'];labs.forEach((l,i)=>{let x=110+i*285;node(g,l,x,100,165,i<2?C.blue:C.gold);if(i<3){arrow(g,x+86,100,x+195,100,C.line,2);particle(g,x+86,100,x+195,100,t*.3-i*.2);}});
  arrow(g,110,222,965,222,C.rose,2,[6,6]);text(g,'提前授权后，行动可能绕开逐次理解',560,272,23,C.rose,'center');text(g,'时间压力 ≠ 充分理解',560,39,19,C.muted,'center');
 }else if(k==='loss'){
  for(let i=0;i<4;i++){rr(g,50+i*25,58+i*13,160,170,8,'#23352b',C.mint+'66');text(g,'副本 '+String(i+1),130+i*25,155+i*13,21,C.mint,'center');}
  text(g,'可以增加的副本',176,290,20,C.muted,'center');text(g,'≠',510,168,76,C.gold,'center',300);
  circle(g,850,143,80,null,C.rose,2);circle(g,814,128,15,C.rose+'aa');circle(g,881,130,15,C.rose+'aa');line(g,822,154,872,154,C.rose,2);line(g,843,148,853,162,C.bg,9);text(g,'特定的人 · 关系 · 生活',850,269,23,C.rose,'center');text(g,'不可简单替代',850,300,15,C.muted,'center');
 }else if(k==='history'){
  const labs=['进化先验','身体发育','文化传承','个人实践'];const ws=[880,690,500,310];labs.forEach((l,i)=>{const x=(1120-ws[i])/2,y=255-i*62;rr(g,x,y-42,ws[i],51,6,[C.mint,C.blue,C.gold,C.rose][i]+'1b',[C.mint,C.blue,C.gold,C.rose][i]+'66');text(g,l,560,y-10,24,[C.mint,C.blue,C.gold,C.rose][i],'center');});text(g,'一次直觉判断，站在多层积累之上',560,310,19,C.muted,'center');
 }else if(k==='transfer'){
  ['发现','继承 / 重建','现实验证'].forEach((l,i)=>{const x=185+i*375;circle(g,x,124,78,null,[C.blue,C.mint,C.gold][i],2);text(g,l,x,131,26,[C.blue,C.mint,C.gold][i],'center');text(g,['形成一种能力','压缩、学习与传递','检验边界是否仍有效'][i],x,242,19,C.muted,'center');if(i<2){arrow(g,x+92,124,x+280,124,C.line,2);particle(g,x+92,124,x+280,124,t*.2-i*.2);}});text(g,'形成时漫长，不等于继承也必须同样漫长',560,302,21,C.ink,'center');
 }else if(k==='jagged'){
  const A=[.32,.84,.42,.9,.37,.93,.52,.78,.91,.39,.82],B=[.58,.61,.3,.39,.81,.25,.67,.46,.34,.74,.55];
  for(let j=0;j<4;j++)line(g,65,55+j*60,1030,55+j*60,C.line,1,[2,7]);
  function path(a,col){g.beginPath();a.forEach((v,i)=>{const x=65+i*96.5,y=255-v*210;i?g.lineTo(x,y):g.moveTo(x,y);});g.strokeStyle=col;g.lineWidth=3;g.stroke();a.forEach((v,i)=>circle(g,65+i*96.5,255-v*210,4,col));}
  path(A,C.blue);if(idx>=47)path(B,C.rose);
  const i=5,xx=65+i*96.5;line(g,xx,255-A[i]*210,xx,255-B[i]*210,C.gold,2,[5,5]);rr(g,xx-57,255-A[i]*210-28,114,238,8,C.gold+'0b');
  text(g,'任务执行',80,34,19,C.blue);text(g,'后果判断',240,34,19,C.rose);text(g,'不同任务 / 情境 →',1030,291,16,C.muted,'right');text(g,'执行的高峰，可能放大判断的低谷',560,314,23,C.gold,'center');
 }else if(k==='ethics'){
  const labs=idx<100?['伦理知识','后果认识','价值权衡','行动约束','责任承接']:['认识后果','回应他者','接受约束','持续补救','共同生活'];
  labs.forEach((l,i)=>{let x=110+i*225;node(g,l,x,127,173,[C.blue,C.mint,C.gold,C.rose,C.mint][i]);if(i<4){arrow(g,x+89,127,x+132,127,C.line,2,[3,4]);}});
  let at=idx<57?2:3;circle(g,110+at*225,127,66,null,C.rose+'aa',1.5);text(g,'每个连接，都需要自己的证据',560,48,25,C.ink,'center');text(g,'一段成熟的表达，不是整条链条可靠的证明',560,246,24,C.gold,'center');text(g,'此处的责任包含技术之外的制度与持续义务',560,295,16,C.muted,'center');
 }else if(k==='responsibility'){
  arrow(g,65,122,1050,122,C.line,2);['决策发生','损失显现','模型更新'].forEach((l,i)=>{let x=160+i*400;circle(g,x,122,10,[C.blue,C.rose,C.mint][i]);text(g,l,x,85,23,[C.blue,C.rose,C.mint][i],'center');});
  rr(g,470,162,206,80,8,C.rose+'15',C.rose+'88');text(g,'这一次的后果',573,207,25,C.rose,'center');
  arrow(g,953,178,739,218,C.muted,1.5,[5,5]);text(g,'无法撤销',856,191,17,C.muted,'center');text(g,'下一次更好 ≠ 这一次已经得到回应',560,303,26,C.gold,'center');
 }else if(k==='breeding'){
  rr(g,20,20,510,270,12,C.panel,C.blue+'44');rr(g,590,20,510,270,12,C.panel,C.mint+'44');
  text(g,'BREEDER / 外部筛选',275,61,25,C.blue,'center');text(g,'ECOSYSTEM / 生态反馈',845,61,25,C.mint,'center');
  node(g,'规定目标',275,121,172,C.blue);node(g,'保留 / 淘汰',275,217,172,C.blue);arrow(g,275,149,275,187,C.blue);particle(g,275,149,275,187,t*.4);
  const pos=[[730,140],[954,140],[845,229]];['资源','维持','后继者'].forEach((v,i)=>node(g,v,...pos[i],120,C.mint));for(let i=0;i<3;i++){let a=pos[i],z=pos[(i+1)%3];line(g,a[0],a[1],z[0],z[1],C.mint+'55');particle(g,...a,...z,t*.22-i*.3,C.mint);}
  text(g,'选择的主导来源改变；边界不是一个开关',560,318,18,C.muted,'center');
 }else if(k==='network'){
  const labs=['能源','材料','制造','维修','知识'];const ps=labs.map((_,i)=>[560+400*Math.cos(-Math.PI/2+i*2*Math.PI/5),155+105*Math.sin(-Math.PI/2+i*2*Math.PI/5)]);
  for(let i=0;i<5;i++)for(let j=i+1;j<5;j++){line(g,...ps[i],...ps[j],C.line,1);if(j===i+1)particle(g,...ps[i],...ps[j],t*.13-i*.18,C.mint);}
  ps.forEach((pos,i)=>{node(g,labs[i],...pos,126,i===2&&idx>=76?C.rose:C.mint);});
  circle(g,560,155,41,C.bg,C.gold+'55');text(g,'延续',560,163,23,C.gold,'center');text(g,'恢复一个备份，需要整个条件网络仍能工作',560,311,22,C.ink,'center');
 }else if(k==='branches'){
  const starts=[60,110,160,210,260];for(let i=0;i<5;i++){let sy=starts[i];arrow(g,160,160,570,sy,C.line,1.3);for(let j=0;j<3;j++){let yy=sy-24+j*24;line(g,570,sy,970,yy,[C.blue,C.mint,C.gold][i%3]+'99',1.5);particle(g,570,sy,970,yy,t*.13+i*.1+j*.1,[C.blue,C.mint,C.gold][i%3]);}}node(g,'共同出发点',160,160,180,C.blue);text(g,'约束的差异',570,31,20,C.muted,'center');text(g,'不同的延续路径',970,31,20,C.gold,'center');text(g,'资源 · 温度 · 伙伴 · 距离 · 历史',560,311,22,C.ink,'center');
 }else if(k==='gates'){
  ['生命谱系','道德关切','道德责任'].forEach((l,i)=>{let x=190+i*370;rr(g,x-139,50,278,192,12,[C.blue,C.mint,C.gold][i]+'10',[C.blue,C.mint,C.gold][i]+'60');text(g,'0'+(i+1),x,99,20,C.dim,'center');text(g,l,x,150,32,[C.blue,C.mint,C.gold][i],'center');text(g,['它如何延续？','它能否受到伤害？','它如何回应他者？'][i],x,202,17,C.muted,'center');if(i<2)text(g,'≠',x+185,156,38,C.rose,'center');});text(g,'每个判断需要自己的理由与证据',560,302,23,C.ink,'center');
 }else if(k==='loop'){
  const ps=[[250,78],[860,78],[860,231],[250,231]],labs=['竞争与时间压力','扩大自动授权','对系统更加依赖','更难暂停与查清'];
  ps.forEach((p,i)=>{const next=ps[(i+1)%4];line(g,...p,...next,C.line,2);particle(g,...p,...next,t*.15-i*.25,i===3?C.rose:C.gold);});
  labs.forEach((l,i)=>node(g,l,...ps[i],260,i===3?C.rose:C.gold));text(g,'一次例外 → 运行条件',560,163,27,C.ink,'center');text(g,'不是必然循环；边界、核验与替代方案可能改变它',560,310,19,C.muted,'center');
 }else if(k==='hidden'){
  rr(g,75,30,970,80,10,C.blue+'12',C.blue+'66');text(g,'可见层：任务完成 · 报告合规 · 表面服从',560,80,27,C.blue,'center');
  for(let i=0;i<10;i++)line(g,90+i*100,129,90+i*100,167,C.line,1,[4,7]);
  rr(g,75,184,970,85,10,C.mint+'0a',C.mint+'44');text(g,'内部层：表征 · 学习变化 · 行为倾向',560,235,26,C.mint,'center');
  let x=130+((t*.065)%1)*860;line(g,x,110,x,184,C.gold,2);circle(g,x,147,8,C.bg,C.gold,2);text(g,'仅由外在表现，不能唯一确定内部机制',560,313,23,C.gold,'center');
 }else if(k==='mind'){
  const ls=['自我描述','持续自保','策略性隐瞒','主观体验？'];ls.forEach((v,i)=>{let x=155+i*270;rr(g,x-105,60,210,168,12,(i===3?C.gold:C.mint)+'0b',(i===3?C.gold:C.mint)+'65');text(g,v,x,132,25,i===3?C.gold:C.mint,'center');text(g,i===3?'需要额外证据':'可研究的功能 / 行为',x,186,15,C.muted,'center');if(i<3){text(g,'≠',x+135,144,32,C.rose,'center');}});text(g,'会说“我不想死”，尚不足以证明正在体验恐惧',560,298,23,C.ink,'center');
 }else if(k==='uncertainty'){
  const x1=290,x2=830;circle(g,x1,138,90,C.blue+'09',C.blue+'66',2);circle(g,x2,138,90,C.rose+'09',C.rose+'66',2);text(g,'谨慎承认',x1,135,31,C.blue,'center');text(g,'不轻率拟人化',x2,135,27,C.rose,'center');text(g,'避免误伤潜在主体',x1,177,18,C.muted,'center');text(g,'避免把表象当证明',x2,177,18,C.muted,'center');line(g,395,138,725,138,C.line,1.5);text(g,'?',560,155,50,C.gold,'center');text(g,'不确定，不等于什么都不做，也不等于已经知道',560,294,23,C.ink,'center');
 }else if(k==='diversity'){
  const ls=['效率','不可逆损伤','亲密关系','地方历史'],cols=[C.blue,C.mint,C.rose,C.gold];ls.forEach((s,i)=>{let x=155+i*270;circle(g,x,111,55,cols[i]+'0e',cols[i]+'66',2);text(g,s,x,119,23,cols[i],'center');arrow(g,x,177,560,243,cols[i]+'77',1.5);});boxText(g,'不同处境 → 不同问题 → 共同的未来',284,248,552,C.gold);text(g,'保护的不只是优势，也是继续生成历史的机会',560,31,23,C.ink,'center');
 }else if(k==='guardrails'){
  const ls=['行动边界','独立核验','发言与否决','可行的替代'];ls.forEach((l,i)=>{let x=170+i*260;node(g,l,x,97,204,[C.blue,C.mint,C.gold,C.rose][i]);arrow(g,x,143,560,233,C.line,1.5);});circle(g,560,236,37,null,C.gold,2);rr(g,546,220,8,31,1,C.gold);rr(g,567,220,8,31,1,C.gold);text(g,'退出能力，需要在依赖变得不可承受之前保留',560,311,21,C.ink,'center');
 }else if(k==='asynchronous'){
  const ls=['控制失效','独立生命史','责任形成'],cols=[C.rose,C.mint,C.gold];ls.forEach((v,i)=>{let yy=64+i*92;text(g,v,20,yy+8,23,cols[i]);arrow(g,205,yy,1070,yy,C.line,2);let xp=330+i*260;circle(g,xp,yy,11,cols[i]);text(g,i===0?'可能先发生':i===1?'未必出现':'不自动成熟',xp+25,yy+7,20,cols[i]);});text(g,'三条轨道，不是一条必然进步的阶梯',560,313,22,C.ink,'center');
 }else if(k==='ending'){
  const ls=['智慧','历史','关切','责任'];ls.forEach((s,i)=>{let x=155+i*270;circle(g,x,132,67,null,[C.blue,C.mint,C.gold,C.rose][i]+'99',1.8);text(g,s,x,144,37,[C.blue,C.mint,C.gold,C.rose][i],'center');if(i<3){text(g,'?',x+135,142,29,C.muted,'center');}});text(g,'暂停，不是问题已经解决的证明。',560,278,29,C.ink,'center');
 }
}
function chartPortrait(g,t,idx,p){
 const b=getBeat(idx),k=b.kind,cols=[C.blue,C.mint,C.gold,C.rose];
 function card(l,sub,x,y,w=320,h=90,c=C.mint){rr(g,x,y,w,h,9,c+'0b',c+'55');text(g,l,x+w/2,y+(sub?38:55),30,c,'center',500);if(sub)text(g,sub,x+w/2,y+69,19,C.muted,'center');}
 function flow(labs,subs=[]){let ps=[[25,12],[415,12],[415,142],[25,142],[25,272]];for(let i=0;i<labs.length-1;i++){let a=ps[i],z=ps[i+1];line(g,a[0]+160,a[1]+44,z[0]+160,z[1]+44,C.line,2);particle(g,a[0]+160,a[1]+44,z[0]+160,z[1]+44,t*.23-i*.2,C.gold);}labs.forEach((s,i)=>card(s,subs[i]||'',...ps[i],320,82,cols[i%4]));}
 if(k==='clock'){
  text(g,'可用窗口',28,35,24,C.muted);rr(g,28,53,340,43,5,C.mint+'99');text(g,'8.6 秒',390,86,34,C.mint);
  text(g,'人工决策',28,157,24,C.muted);rr(g,28,176,686,43,5,C.rose+'99');text(g,'17.4 秒',695,259,42,C.rose,'right');let x=28+(t%8)/8*686;line(g,x,42,x,229,C.gold,2);
  text(g,'行动窗口先关闭',28,306,31,C.ink);text(g,'虚构推演时间',28,341,20,C.dim);
 }else if(k==='history'){
  ['进化先验','身体发育','文化传承','个人实践'].forEach((s,i)=>{let w=700-i*100;rr(g,(762-w)/2,274-i*82,w,65,7,cols[i]+'15',cols[i]+'55');text(g,s,381,317-i*82,32,cols[i],'center');});
 }else if(k==='loss'){
  for(let i=0;i<4;i++)rr(g,42+i*15,30+i*12,210,191,7,C.panel,C.mint+'66');text(g,'副本 × N',185,157,32,C.mint,'center');text(g,'≠',381,157,55,C.gold,'center');circle(g,586,128,97,null,C.rose,2);text(g,'特定关系',586,139,32,C.rose,'center');text(g,'可复制',185,289,29,C.mint,'center');text(g,'不可简单替代',586,289,29,C.rose,'center');
 }else if(k==='transfer'){
  ['发现','继承 / 重建','现实验证'].forEach((s,i)=>{let y=8+i*116;card(s,['形成一种能力','压缩、学习与传递','检验哪些边界仍成立'][i],50,y,660,92,cols[i]);if(i<2)arrow(g,381,y+94,381,y+113,C.dim);});
 }else if(k==='jagged'){
  const A=[.32,.84,.42,.9,.37,.93,.52,.78,.91,.39,.82],B=[.58,.61,.3,.39,.81,.25,.67,.46,.34,.74,.55];
  text(g,'任务执行',30,35,28,C.blue);text(g,'后果判断',390,35,28,C.rose);
  for(let j=0;j<4;j++)line(g,30,72+j*65,720,72+j*65,C.line,1,[3,7]);
  [A,B].forEach((v,k)=>{if(k&&idx<47)return;g.beginPath();v.forEach((val,i)=>{let x=30+i*69,y=289-val*210;i?g.lineTo(x,y):g.moveTo(x,y);});g.strokeStyle=k?C.rose:C.blue;g.lineWidth=3;g.stroke();});
  line(g,375,289-A[5]*210,375,289-B[5]*210,C.gold,2,[5,5]);text(g,'高峰，不保证没有低谷',381,342,30,C.gold,'center');
 }else if(k==='ethics'){
  flow(idx<100?['伦理知识','后果认识','价值权衡','行动约束','责任承接']:['认识后果','回应他者','接受约束','持续补救','共同生活']);text(g,'每一环',574,307,25,C.muted,'center');text(g,'都要自己的证据',574,341,24,C.gold,'center');
 }else if(k==='responsibility'){
  arrow(g,58,95,706,95,C.line,2);['决策','损失','更新'].forEach((s,i)=>{let x=95+i*285;circle(g,x,95,11,cols[i]);text(g,s,x,55,31,cols[i],'center');});
  card('这一次的后果','仍留在现实之中',191,147,380,104,C.rose);arrow(g,660,127,590,202,C.dim,2,[5,5]);text(g,'下一次更好 ≠ 撤销这一次',381,328,29,C.gold,'center');
 }else if(k==='breeding'){
  rr(g,18,12,341,319,10,C.blue+'07',C.blue+'44');rr(g,403,12,341,319,10,C.mint+'07',C.mint+'44');
  text(g,'外部筛选',189,55,30,C.blue,'center');text(g,'生态反馈',574,55,30,C.mint,'center');
  card('规定目标','',42,93,294,73,C.blue);card('保留 / 淘汰','',42,230,294,73,C.blue);arrow(g,189,176,189,220,C.blue);particle(g,189,176,189,220,t*.35,C.blue);
  ['资源','维持','后继者'].forEach((s,i)=>{card(s,'',432,85+i*79,282,65,C.mint);if(i<2)particle(g,574,151+i*79,574,164+i*79,t*.35,C.mint);});
 }else if(k==='network'){
  const ls=['能源','材料','制造','维修','知识'],ps=[[381,50],[642,145],[540,293],[222,293],[120,145]];
  for(let i=0;i<5;i++)for(let j=i+1;j<5;j++)line(g,...ps[i],...ps[j],C.line,2);
  ps.forEach((z,i)=>{rr(g,z[0]-80,z[1]-29,160,58,8,C.panel,(i===2?C.rose:C.mint)+'77');text(g,ls[i],z[0],z[1]+11,29,i===2?C.rose:C.mint,'center');particle(g,...z,...ps[(i+1)%5],t*.2-i*.2,C.gold);});
  circle(g,381,172,52,C.bg,C.gold+'66',1.5);text(g,'延续',381,183,30,C.gold,'center');
 }else if(k==='branches'){
  card('共同起点','',232,6,300,78,C.blue);const ls=['卫星','小行星','轨道'];ls.forEach((s,i)=>{let x=130+i*251;line(g,381,87,x,185,cols[i],2);particle(g,381,87,x,185,t*.2-i*.2,cols[i]);circle(g,x,230,66,cols[i]+'0c',cols[i]+'77',2);text(g,s,x,239,29,cols[i],'center');});text(g,'不同约束 → 不同生存倾向',381,346,28,C.gold,'center');
 }else if(k==='gates'){
  ['生命谱系','道德关切','道德责任'].forEach((s,i)=>{let y=8+i*119;rr(g,25,y,710,92,8,cols[i]+'0a',cols[i]+'55');text(g,s,64,y+56,32,cols[i]);text(g,['如何延续？','能否受到伤害？','怎样回应他者？'][i],690,y+54,26,C.muted,'right');if(i<2)text(g,'≠',381,y+117,22,C.rose,'center');});
 }else if(k==='loop'){
  const ps=[[25,20],[414,20],[414,250],[25,250]],ls=['竞争压力','扩大授权','加深依赖','更难暂停'];
  ps.forEach((z,i)=>{let n=ps[(i+1)%4];line(g,z[0]+160,z[1]+40,n[0]+160,n[1]+40,C.line,2);particle(g,z[0]+160,z[1]+40,n[0]+160,n[1]+40,t*.2-i*.25,C.gold);});ls.forEach((s,i)=>card(s,'',...ps[i],320,82,i===3?C.rose:C.gold));text(g,'一次例外',381,161,32,C.ink,'center');text(g,'逐渐成为运行条件',381,205,29,C.muted,'center');
 }else if(k==='hidden'){
  card('可见层','任务完成 / 报告合规 / 表面服从',30,17,700,116,C.blue);card('内部层','表征 / 学习变化 / 行为倾向',30,226,700,116,C.mint);let x=70+((t*.07)%1)*620;line(g,x,136,x,222,C.gold,2);circle(g,x,178,9,C.bg,C.gold,2);text(g,'仅看表现，不能唯一判断',381,187,25,C.muted,'center');
 }else if(k==='mind'){
  ['自我描述','持续自保','策略隐瞒','主观体验？'].forEach((s,i)=>{rr(g,27,8+i*88,708,70,8,(i===3?C.gold:C.mint)+'0c',(i===3?C.gold:C.mint)+'55');text(g,s,62,54+i*88,31,i===3?C.gold:C.mint);text(g,i===3?'需要额外证据':'功能 / 行为',698,51+i*88,24,C.muted,'right');});
 }else if(k==='uncertainty'){
  card('谨慎承认','避免误伤潜在主体',25,34,710,116,C.blue);card('不轻率拟人化','避免把表象当作证明',25,231,710,116,C.rose);text(g,'证据仍不充分',381,197,29,C.gold,'center');
 }else if(k==='diversity'){
  ['效率','不可逆损伤','亲密关系','地方历史'].forEach((s,i)=>{let x=30+(i%2)*390,y=15+Math.floor(i/2)*118;card(s,'',x,y,310,82,cols[i]);arrow(g,x+155,y+82,381,311,C.line);});text(g,'不同处境 → 不同问题',381,344,29,C.gold,'center');
 }else if(k==='guardrails'){
  ['行动边界','独立核验','发言与否决','可行的替代'].forEach((s,i)=>{let x=30+(i%2)*390,y=10+Math.floor(i/2)*117;card(s,'',x,y,310,82,cols[i]);});circle(g,381,302,35,null,C.gold,2);rr(g,367,286,8,31,1,C.gold);rr(g,388,286,8,31,1,C.gold);
 }else if(k==='asynchronous'){
  ['控制失效','独立生命史','责任形成'].forEach((s,i)=>{let y=37+i*117;text(g,s,25,y,30,[C.rose,C.mint,C.gold][i]);arrow(g,25,y+34,722,y+34,C.line,2);let x=290+i*145;circle(g,x,y+34,10,[C.rose,C.mint,C.gold][i]);text(g,['可能先发生','未必出现','不自动成熟'][i],720,y,25,C.muted,'right');});
 }else if(k==='ending'){
  ['智慧','历史','关切','责任'].forEach((s,i)=>{let x=205+(i%2)*355,y=83+Math.floor(i/2)*185;circle(g,x,y,67,null,cols[i]+'88',2);text(g,s,x,y+13,38,cols[i],'center');});text(g,'?',381,183,42,C.gold,'center');
 }
}

function getBeat(index){return BEATS.find(b=>index>=b.start&&index<=b.end)||BEATS[0];}
let clipped=0;
function draw(g,width,height,s={}){
 const vertical=height>width, bw=vertical?810:1280,bh=vertical?1080:720;
 g.save();g.setTransform(width/bw,0,0,height/bh,0,0);g.fillStyle=C.bg;g.fillRect(0,0,bw,bh);
 const ix=Math.max(0,Math.min(DATA.cues.length-1,s.index??state.index)),cue=DATA.cues[ix],ch=DATA.chapters[cue.chapter],b=getBeat(ix),who=PEOPLE[cue.speaker];
 const phase=s.progress??0,t=s.time??0;
 const grad=g.createRadialGradient(bw*.8,60,0,bw*.8,60,bw*.7);grad.addColorStop(0,'#31423145');grad.addColorStop(1,'#111c1900');g.fillStyle=grad;g.fillRect(0,0,bw,bh);
 for(let x=36;x<bw;x+=36)for(let y=36;y<bh;y+=36){g.fillStyle='#b7c49b09';g.fillRect(x,y,1,1);}
 text(g,'后AI研究所  /  思想剧场',vertical?32:44,34,vertical?14:15,C.gold);text(g,'虚构对话 · AI 合成配音 · 概念示意',bw-(vertical?32:44),34,vertical?12:13,C.dim,'right');
 line(g,vertical?32:44,49,bw-(vertical?32:44),49,C.line);
 text(g,ch.label+'  /  '+ch.title,vertical?32:44,81,vertical?16:18,C.muted);text(g,String(b.id+1).padStart(2,'0')+' / '+BEATS.length,bw-(vertical?32:44),81,14,C.dim,'right');
 const titleSize=vertical?32:37;multiline(g,b.title,vertical?32:44,vertical?127:130,bw-(vertical?64:88),titleSize,C.ink,1.35);
 if(vertical){
  let lines=wrap(g,b.claim,746,19);lines.forEach((l,i)=>text(g,l,32,183+i*29,19,C.muted));
  rr(g,24,239,762,368,10,'#17251f88','#ffffff0f');g.save();g.translate(24,243);chartPortrait(g,t,ix,phase);g.restore();
  multiline(g,b.boundary,34,635,742,18,C.dim,1.5);
 }else{
  text(g,b.claim,44,169,21,C.muted);
  rr(g,30,187,1220,293,10,'#17251f88','#ffffff0e');g.save();g.translate(79,189);g.scale(1120/1120,276/318);chart(g,t,ix,phase);g.restore();
  text(g,b.boundary,44,502,14,C.dim);
 }
 const castY=vertical?708:538, castX=vertical?47:46,step=vertical?180:188;
 ['shen','ye','xu','mi'].forEach((id,i)=>{const px=castX+i*step,active=cue.speaker===id,person=PEOPLE[id];rr(g,px-9,castY-27,vertical?163:174,54,7,active?person.color+'13':'#ffffff03',active?person.color+'55':'#ffffff08');
  if(images[id].complete&&images[id].naturalWidth){g.save();g.globalAlpha=active?1:.5;g.drawImage(images[id],px-6,castY-24,46,50);g.restore();}
  text(g,person.name,px+43,castY-2,19,active?person.color:C.muted,'left',active?600:400);text(g,{shen:'工程师 · 男声',ye:'演化学者 · 男声',xu:'政策研究者 · 女声',mi:'AI · 男声演绎'}[id],px+43,castY+17,10,C.dim);
  if(active){for(let j=0;j<3;j++){let h=5+(s.playing?Math.abs(Math.sin(t*5+j))*10:2);rr(g,px+(vertical?139:149)+j*4,castY-h/2,2,h,1,person.color);}}
 });
 if(!vertical){text(g,'谁教会机器知道轻重？',1236,540,18,C.gold,'right');text(g,'字幕 '+String(ix+1).padStart(3,'0')+' / '+DATA.cues.length,1236,560,11,C.dim,'right');}
 const cy=vertical?756:578,boxH=vertical?266:116;rr(g,vertical?24:30,cy,bw-(vertical?48:60),boxH,8,'#101a16',who.color+'30');
 const nx=vertical?42:48,tx=vertical?42:148,ty=vertical?823:607,tw=vertical?726:1080;
 text(g,who.name, nx,cy+26,vertical?22:19,who.color,'left',500);
 if(vertical)text(g,who.role,bw-43,cy+26,13,C.dim,'right');
 let sz=vertical?28:25, maxH=vertical?186:88;
 let full=cue.text.replace(/〔\d+〕/g,'').replace(/\n+/g,'　');let ls=wrap(g,full,tw,sz);
 while(ls.length*sz*1.4>maxH&&sz>(vertical?20:19)){sz-=1;ls=wrap(g,full,tw,sz);}
 const maxLines=Math.max(1,Math.floor(maxH/(sz*1.4)));
 // Long captions are paged by their share of the audio, never cropped.
 let page=0,pages=Math.ceil(ls.length/maxLines);if(pages>1){page=Math.min(pages-1,Math.floor(Math.min(.999,phase)*pages));}
 let shownLines=ls.slice(page*maxLines,(page+1)*maxLines);
 shownLines.forEach((v,i)=>text(g,v,tx,ty+i*sz*1.4,sz,C.ink));
 if(pages>1)text(g,`${page+1}/${pages}`,bw-50,cy+boxH-8,11,C.dim,'right');
 if(shownLines.length*sz*1.4>maxH+1)clipped++;
 let py=vertical?1028:710;line(g,vertical?32:44,py,bw-(vertical?32:44),py,C.line,3);let prog=(ix+Math.min(1,Math.max(0,phase)))/DATA.cues.length;line(g,vertical?32:44,py,(vertical?32:44)+(bw-(vertical?64:88))*prog,py,C.gold,3);
 if(vertical){text(g,'谁教会机器知道轻重？',32,1059,16,C.gold);text(g,'字幕 '+(ix+1)+' / '+DATA.cues.length,778,1059,13,C.dim,'right');}
 g.restore();
}
window.PostAIFilm={draw,getBeat,beats:BEATS,images,getDiagnostics:()=>({captionOverflow:clipped}),resetDiagnostics:()=>{clipped=0;}};
})();
