/* POST-AI director edition: local prerecorded audio, media-clock captions, canvas recording. */
(() => {
'use strict';
const rounds=__ROUNDS_JSON__;
const hasAudio=rounds.length>0, preview=!hasAudio;
const byCue=new Map();rounds.forEach((r,ri)=>r.cue_indices.forEach((i,part)=>byCue.set(i,{r,ri,part})));
if(hasAudio&&byCue.size!==DATA.cues.length)throw Error('配音清单未覆盖完整剧本，停止初始化。');
const base={stop:stopSpeech,update:updateControls,enter:enter,go:go,advance:advance,pause:pause,play:play,render:renderCue,settings:openSettings};
const a=new Audio();a.preload='auto';a.preservesPitch=true;
let activeRound=-1,needSeek=true,playGen=0,syncing=false,cueProgress=0,loading=false,loadPromise=null;
let audioCtx=null,mix=null,source=null,service=null;
let rec=null,recordStop=-1,allowJump=false,wake=null,exportCanvas=null;
let lastResult=null,lastObjectURL=null,view='concept',recordSettings={scope:'chapter',layout:'wide',quality:'balanced',format:'auto'};
const wrap=document.createElement('div');wrap.className='director-toolbar';wrap.innerHTML=`<div class="tabs"><button id="conceptView" aria-pressed="true">论证动画</button><button id="peopleView" aria-pressed="false">人物舞台</button><span class="toolbar-label">DIRECTOR EDITION / 25 个论证节点</span></div><div class="tabs"><button id="insightBtn">停下来想</button><button id="recordBtn" class="rec-action">● 录制视频</button></div>`;
const theatre=document.querySelector('.theatre');theatre.prepend(wrap);
const stage=document.createElement('section');stage.className='director-stage';stage.setAttribute('aria-label','随对白推进的论证动画');stage.innerHTML=`${preview?'<div class="director-preview-note">动画预览 · 不含你本机已生成的配音。安装升级包后自动接入原音轨。</div>':''}<canvas id="filmCanvas" width="1280" height="720" aria-label="概念动画和完整字幕"></canvas><div class="director-detail"><div><p><strong id="beatLabel"></strong><br><span id="beatBoundary" class="concept-bound"></span></p></div><div class="director-step"><button class="director-action" id="stepPrev">← 上个论点</button><button class="director-action" id="stepNext">下个论点 →</button></div></div>`;
wrap.after(stage);
const strip=document.createElement('div');strip.className='record-strip';strip.id='recordStrip';strip.innerHTML='<span class="rec-dot"></span><span class="grow" id="recordStatus">准备录制</span><button class="director-action" id="recPause">暂停</button><button class="director-action" id="recStop">结束并保存</button>';
document.querySelector('.heading').after(strip);
const film=$('filmCanvas'),fctx=film.getContext('2d',{alpha:false});
function sizeFilm(){const vertical=innerWidth<=780;const w=vertical?810:1280,h=vertical?1080:720;if(film.width!==w){film.width=w;film.height=h;}film.style.aspectRatio=w+'/'+h;}
sizeFilm();window.addEventListener('resize',sizeFilm);document.body.classList.add('director-mode');
function selectView(v){view=v;document.body.classList.toggle('director-mode',v==='concept');$('conceptView').setAttribute('aria-pressed',v==='concept');$('peopleView').setAttribute('aria-pressed',v!=='concept');resizeCanvas();}
$('conceptView').onclick=()=>selectView('concept');$('peopleView').onclick=()=>selectView('people');
function shares(r){const ws=r.cue_indices.map(i=>Math.max(1,DATA.cues[i].weight));let sum=ws.reduce((s,v)=>s+v,0),n=0;return [0,...ws.map(v=>(n+=v)/sum)];}
rounds.forEach(r=>{r._ratios=shares(r);});
function setRate(){const r=Number(state.speed)||1;a.defaultPlaybackRate=r;a.playbackRate=r;a.preservesPitch=true;}
function waitMetadata(){return new Promise((resolve,reject)=>{if(a.readyState>=1)return resolve();let timer=setTimeout(()=>done(Error('音频加载超过 30 秒，请检查本地文件。')),30000);function done(e){clearTimeout(timer);a.removeEventListener('loadedmetadata',ok);a.removeEventListener('error',fail);e?reject(e):resolve();}function ok(){done();}function fail(){done(Error('无法读取音频文件。'));}a.addEventListener('loadedmetadata',ok,{once:true});a.addEventListener('error',fail,{once:true});});}
async function prepareCurrent(force=false){
 const entry=byCue.get(state.index);if(!entry)throw Error('当前对白没有配音。');
 if(activeRound!==entry.ri){
   activeRound=entry.ri;needSeek=true;a.pause();a.src=entry.r.audio;loading=true;a.load();
   loadPromise=waitMetadata().finally(()=>{loading=false;});
 }
 if(loadPromise)await loadPromise;
 if(activeRound!==entry.ri || entry.r.cue_indices[entry.part]!==state.index)throw Error('播放位置已切换。');
 if(!Number.isFinite(a.duration)||a.duration<=0)throw Error('音频长度无效。');
 // load() resets playbackRate to defaultPlaybackRate in common browsers.
 // Set both properties and reapply after metadata; changing rate never reloads a clip.
 setRate();
 if(force||needSeek){a.currentTime=Math.min(a.duration-.005,a.duration*entry.r._ratios[entry.part]);needSeek=false;cueProgress=0;}
 return entry;
}
function failure(err){loading=false;state.playing=false;a.pause();state.speechPending=false;state.speechDone=true;updateControls();if(rec)finishRecording('音频错误，已保留已录部分');toast('配音未能播放：'+(err?.message||'请检查 audio 文件夹。'));}
stopSpeech=function(){++playGen;a.pause();base.stop();};
startSpeech=function(){
 if(syncing||!hasAudio||!state.voice||!state.playing)return;
 const gen=++playGen;state.speechPending=true;state.speechDone=false;
 (async()=>{await prepareCurrent();if(gen!==playGen||!state.playing||!state.voice)return;if(audioCtx?.state==='suspended')await audioCtx.resume();await a.play();})().catch(e=>{if(gen===playGen)failure(e);});
};
a.addEventListener('loadedmetadata',setRate);a.addEventListener('play',setRate);
a.addEventListener('ended',()=>{
 const r=rounds[activeRound];if(!r||!state.voice)return;
 const last=r.cue_indices.at(-1);if(state.index!==last){syncing=true;state.index=last;renderCue();syncing=false;}
 cueProgress=1;state.speechPending=false;state.speechDone=true;state.speechEndAt=performance.now();revealAll();
});
function syncAudio(){
 const r=rounds[activeRound];if(!r||!Number.isFinite(a.duration)||a.duration<=0||!state.voice)return;
 let frac=Math.min(.999999,Math.max(0,a.currentTime/a.duration));let j=r.cue_indices.length-1;
 for(let k=0;k<r.cue_indices.length;k++){if(frac<r._ratios[k+1]){j=k;break;}}
 const i=r.cue_indices[j];
 if(i!==state.index&&!a.ended){syncing=true;state.index=i;renderCue();syncing=false;state.speechPending=true;state.speechDone=false;}
 const lo=r._ratios[j],hi=r._ratios[j+1];cueProgress=a.ended?1:Math.min(1,Math.max(0,(frac-lo)/(hi-lo)));
 if(state.typewriter&&!state.reduce)showChars(Math.floor(currentChars.length*cueProgress));else revealAll();
 $('lineFill').style.width=cueProgress*100+'%';
}
const baseRender=renderCue;renderCue=function(){baseRender();const b=PostAIFilm.getBeat(state.index);$('beatLabel').textContent=String(b.id+1).padStart(2,'0')+' / '+PostAIFilm.beats.length+' · '+b.title;$('beatBoundary').textContent=b.boundary;};
updateControls=function(){base.update();$('modeLabel').textContent=state.voice?'豆包原配音':'无声阅读';$('voiceBtn').title=state.voice?'关闭已生成配音':'播放已生成的豆包配音';$('statusText').textContent=state.ended?'全剧终 · 追问仍在继续':state.playing?(state.voice?'豆包配音 · '+state.speed+'×':'无声阅读 · '+state.speed+'×'):'已暂停 · 可以慢慢想';if(rec)$('recPause').textContent=state.playing?'暂停':'继续';};
go=function(index,keepPlaying=state.playing){if(rec&&!allowJump){toast('录制期间不能跳段；可以暂停，或结束并保存片段。');return;}needSeek=true;cueProgress=0;base.go(index,keepPlaying);};
play=function(){if(rec?.mr.state==='paused')rec.mr.resume();base.play();};
pause=function(){base.pause();if(rec?.mr.state==='recording')rec.mr.pause();};
advance=function(){if(rec&&state.index>=recordStop){state.ended=recordStop===DATA.cues.length-1;pause();finishRecording('所选范围录制完成');return;}allowJump=true;try{base.advance();}finally{allowJump=false;}};
enter=function(index=0,autoplay=true){state.voice=hasAudio&&autoplay;base.enter(index,autoplay);};
toggleVoice=function(){if(rec)return;if(!hasAudio){toast('预览文件未带配音；升级你本机的 output_full 后即可使用。');return;}state.voice=!state.voice;stopSpeech();updateControls();if(state.voice&&state.playing)startSpeech();persist();};
$('voiceBtn').onclick=toggleVoice;
$('speed').onchange=e=>{if(rec)return;state.speed=Number(e.target.value);setRate();updateControls();persist();toast('已即时切换到 '+state.speed+'×，不重新加载对白。');};
$('startBtn').textContent=hasAudio?'进入动画剧场 · 原配音':'查看动画 · 无声预览';$('startBtn').onclick=()=>enter(0,true);$('readBtn').onclick=()=>enter(0,false);$('resumeBtn').onclick=()=>enter(saved.index,true);
$('welcomeMeta').textContent='九幕 · 四位人物 · 25 个论证节点 · 字幕与声音同步';
document.querySelector('.welcome-note').innerHTML=hasAudio?'沿用已生成的四角色配音，不重新合成。<br>支持论证动画、即时倍速和带声音的视频录制。<br>所有推演和图形均为概念示意，非测量数据。':'这是动画与交互预览，不包含你本机的配音。<br>升级包会接入现有音频，不需要再次调用豆包。<br>所有推演和图形均为概念示意，非测量数据。';
function step(d){const b=PostAIFilm.getBeat(state.index),n=Math.max(0,Math.min(PostAIFilm.beats.length-1,b.id+d));go(PostAIFilm.beats[n].start,false);revealAll();}
$('stepPrev').onclick=()=>step(-1);$('stepNext').onclick=()=>step(1);
$('insightBtn').onclick=()=>{const b=PostAIFilm.getBeat(state.index);openDialog('停下来想 · '+b.title,`<div class="director-insight"><h3>${esc(b.question)}</h3><p>${esc(b.claim)}</p><div class="director-key">证据边界：${esc(b.boundary)}</div><p class="dialog-intro">这些动画是对对白的解释，不增加实证结论，也不改变原配音。关闭后可继续原来的发言。</p></div>`);};
openSettings=function(){base.settings();const note=document.createElement('p');note.className='director-summary';note.textContent='导演版：人物声线沿用既有豆包音频；下方的“系统声音选择”不改变这些配音。速度直接调整当前音轨并保持音高。长发言的字幕按文字权重分配音频时间，未做逐字强制对齐。动画画面显示完整字幕页。';$('dialogBody').prepend(note);};$('settingsBtn').onclick=openSettings;
if(location.protocol.startsWith('http')&&['localhost','127.0.0.1','[::1]'].includes(location.hostname))fetch('/__postai/config').then(r=>r.ok?r.json():null).then(v=>{if(v?.application==='postai-director')service=v;}).catch(()=>{});
function mimeOptions(format){let m=[];if(format!=='webm')m.push('video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4;codecs=avc1.42001f,mp4a.40.2','video/mp4');if(format!=='mp4')m.push('video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm');return m.filter(v=>window.MediaRecorder&&MediaRecorder.isTypeSupported(v));}
function rangeFor(scope){const ch=DATA.chapters[DATA.cues[state.index].chapter];return scope==='all'?[0,DATA.cues.length-1]:scope==='chapter'?[ch.start,ch.end]:[state.index,DATA.cues.length-1];}
function rangeDuration(st,en){let n=0;rounds.forEach(r=>r.cue_indices.forEach((c,i)=>{if(c>=st&&c<=en)n+=r.duration*(r._ratios[i+1]-r._ratios[i]);}));return n/Math.max(.1,state.speed);}
const quality={small:{v:800000,a:64000},balanced:{v:1500000,a:96000},clear:{v:2800000,a:128000}};
function timeText(s){s=Math.max(0,Math.floor(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function recordDialog(){
 if(rec){toast('正在录制，可使用上方的暂停或结束按钮。');return;}
 if(!hasAudio){openDialog('视频录制',`<p class="director-summary">此文件是无声动画预览。请在你的已配音目录运行升级包，然后打开 <b>theatre_director.html</b>。录制会使用你已经生成的四种声音，不会重新合成。</p>`);return;}
 if(!('MediaRecorder' in window)||!film.captureStream){toast('此浏览器没有可用的画布录制能力，请在桌面 Chrome / Edge 中打开。');return;}
 openDialog('录制与下载视频',`<p class="dialog-intro">直接录下动画画布、人物、字幕与原配音，不录桌面，不申请摄像头或麦克风。录制实时进行，暂停会同时暂停音画与录制。</p><div class="director-form"><label class="director-field">录制范围<select id="recScope"><option value="chapter">当前整幕</option><option value="all">完整九幕</option><option value="here">当前字幕至全剧结束</option></select></label><label class="director-field">视频画幅<select id="recLayout"><option value="wide">横版 1280 × 720 · 16:9</option><option value="portrait">竖版 810 × 1080 · 3:4</option></select></label><label class="director-field">压缩档位<select id="recQuality"><option value="small">小体积 · 0.8 Mbps + 64 kbps</option><option value="balanced">均衡 · 1.5 Mbps + 96 kbps</option><option value="clear">清晰 · 2.8 Mbps + 128 kbps</option></select></label><label class="director-field">录制容器<select id="recFormat"><option value="auto">自动：优先 MP4，回退 WebM</option><option value="mp4">MP4（需浏览器原生支持）</option><option value="webm">WebM</option></select></label></div><div class="director-summary" id="recEstimate"></div><p class="dialog-intro">默认按当前 ${state.speed}× 速度录制。请保持页面在前台；切到后台会自动暂停。整剧较长时，分幕录制更稳妥。视频采用 24 帧/秒，实际体积由浏览器编码器决定。</p><p id="recError" class="director-error"></p><div class="director-buttons"><button class="primary-action" id="recStart">开始录制</button><button id="recCancel">取消</button></div>`);
 for(const [id,key] of [['recScope','scope'],['recLayout','layout'],['recQuality','quality'],['recFormat','format']]){$(id).value=recordSettings[key];$(id).onchange=()=>{recordSettings[key]=$(id).value;estimate();};}
 function estimate(){const [st,en]=rangeFor(recordSettings.scope),seconds=rangeDuration(st,en),q=quality[recordSettings.quality];let mb=seconds*(q.v+q.a)/8/1048576;$('recEstimate').textContent=`按当前配音长度与速度，所选范围约 ${timeText(seconds)}。按目标码率估算约 ${Math.round(mb)} MiB，非大小保证。${service?.ffmpeg?'本地 FFmpeg 可用，录完可压缩为兼容 MP4。':'录完可直接下载；FFmpeg 可用时还可转为兼容 MP4。'}`;}
 estimate();$('recCancel').onclick=()=>closeDialog();$('recStart').onclick=async()=>{let button=$('recStart');button.disabled=true;try{await beginRecording(recordSettings);}catch(e){button.disabled=false;if($('recError'))$('recError').textContent=e.message;else toast(e.message);}};
}
$('recordBtn').onclick=recordDialog;
async function graph(){if(!audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('浏览器不支持音频混流。');audioCtx=new AC();mix=audioCtx.createMediaStreamDestination();source=audioCtx.createMediaElementSource(a);source.connect(audioCtx.destination);source.connect(mix);}await audioCtx.resume();if(audioCtx.state!=='running')throw Error('音频未获浏览器授权。请先播放一段配音，再开始录制。');}
async function beginRecording(settings){
 if(location.protocol==='file:'&&!rounds.every(r=>r.audio.startsWith('data:')))throw Error('相对路径音频的录制需要同源环境，以免录出无声视频。请双击升级包的 run_windows.bat，用它自动打开的本地页面录制。普通播放仍可直接打开 HTML。');
 const options=mimeOptions(settings.format);if(!options.length)throw Error('当前浏览器不支持所选录制格式，请选择“自动”或 WebM。');
 const previousPauseChapter=state.pauseChapter;
 const [st,en]=rangeFor(settings.scope),dims=settings.layout==='portrait'?[810,1080]:[1280,720];
 await graph();closeDialog(false);allowJump=true;state.voice=true;state.auto=true;state.pauseChapter=false;try{if(!state.started)enter(st,false);else go(st,false);state.voice=true;state.auto=true;}finally{allowJump=false;}
 await prepareCurrent(true);
 exportCanvas=document.createElement('canvas');exportCanvas.width=dims[0];exportCanvas.height=dims[1];const eg=exportCanvas.getContext('2d',{alpha:false});PostAIFilm.draw(eg,...dims,{index:state.index,progress:0,time:sceneTime,playing:false});
 let stream=exportCanvas.captureStream(24);mix.stream.getAudioTracks().forEach(t=>stream.addTrack(t.clone()));
 const q=quality[settings.quality];let mr,lastError;for(const mimeType of options){try{mr=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:q.v,audioBitsPerSecond:q.a});break;}catch(e){lastError=e;}}
 if(!mr){stream.getTracks().forEach(t=>t.stop());throw Error('无法启动编码器：'+(lastError?.message||'未支持'));}
 rec={mr,stream,chunks:[],bytes:0,started:performance.now(),reason:'',start:st,end:en,settings:{...settings},ctx:eg,dims,previousPauseChapter};recordStop=en;
 mr.ondataavailable=e=>{if(rec&&e.data?.size){rec.chunks.push(e.data);rec.bytes+=e.data.size;if(rec.bytes>550*1048576)finishRecording('录制达到安全内存阈值，已保存片段；余下内容请分幕录制。');}};
 mr.onerror=e=>finishRecording('编码器发生错误，已尽量保留可用部分：'+(e.error?.message||''));
 mr.onstop=()=>completeRecording();
 mr.start(1000);document.body.classList.add('recording');strip.classList.add('active');$('dialog').close();
 try{wake=await navigator.wakeLock?.request('screen');}catch(e){}
 state.playing=true;state.speechDone=false;state.speechPending=true;updateControls();
 try{await a.play();}catch(e){finishRecording('浏览器没有开始音频播放');throw e;}
}
function finishRecording(reason='手动结束，已保存录制片段'){
 if(!rec||rec.mr.state==='inactive')return;rec.reason=reason;state.playing=false;a.pause();updateControls();rec.mr.stop();
}
function completeRecording(){
 if(!rec)return;const r=rec;rec=null;recordStop=-1;document.body.classList.remove('recording');strip.classList.remove('active');state.pauseChapter=r.previousPauseChapter;
 r.stream.getTracks().forEach(t=>t.stop());wake?.release().catch(()=>{});wake=null;exportCanvas=null;
 if(lastObjectURL)URL.revokeObjectURL(lastObjectURL);
 let mime=r.mr.mimeType||r.chunks[0]?.type||'video/webm',blob=new Blob(r.chunks,{type:mime});const ext=mime.includes('mp4')?'mp4':'webm';
 const title=r.settings.scope==='all'?'全剧':DATA.chapters[DATA.cues[r.start].chapter].label;let name='后AI_谁教会机器知道轻重_'+title+'_'+new Date().toISOString().replace(/[:.]/g,'-').slice(0,19)+'.'+ext;
 lastResult={blob,name,mime,reason:r.reason,width:r.dims[0],height:r.dims[1]};lastObjectURL=URL.createObjectURL(blob);showRecordingResult();
}
function showRecordingResult(){
 if(!lastResult)return;const r=lastResult;openDialog('视频已生成 · 保存在本机',`<p class="director-summary">${esc(r.reason)}<br>${r.width} × ${r.height} · ${(r.blob.size/1048576).toFixed(1)} MiB · ${esc(r.mime)}</p><video class="director-player" controls playsinline src="${lastObjectURL}"></video><div class="director-buttons"><a class="director-download" href="${lastObjectURL}" download="${esc(r.name)}">下载原始录制 ${r.mime.includes('mp4')?'MP4':'WebM'}</a><button id="compressBtn" ${service?.ffmpeg?'':'disabled'}>压缩成兼容 MP4</button></div><p class="dialog-intro" id="compressStatus">${service?.ffmpeg?'使用现有本地 FFmpeg 转为 H.264 / AAC，CRF 28。无需联网，不上传云端；二次编码不保证比原文件更小。':'原始文件已经是压缩视频。MP4 容器本身不保证 H.264 / AAC 兼容性；检测到本地 FFmpeg 后可转码，不会自动安装依赖。'}</p><p class="dialog-intro">浏览器下载可能需要你点击保存。关闭前请先下载；页面刷新会释放未保存的视频。录制文件不包含播放器按钮或桌面内容。</p>`);
 $('compressBtn').onclick=compress;
}
async function compress(){
 const btn=$('compressBtn'),info=$('compressStatus');btn.disabled=true;info.textContent='正在发送到本机 FFmpeg 转码，请保持工作室终端开启。';
 try{const res=await fetch('/__postai/transcode',{method:'POST',headers:{'Content-Type':'application/octet-stream','X-PostAI-Token':service.token,'X-PostAI-Container':lastResult.mime.includes('mp4')?'mp4':'webm'},body:lastResult.blob});let result=await res.json();if(!res.ok)throw Error(result.error||'本地转换失败。');info.textContent='转换完成，文件也已保存在 output_full/videos 中。';const link=document.createElement('a');link.className='director-download';link.href=result.url;link.download=result.filename;link.textContent='下载压缩 MP4 · '+(result.bytes/1048576).toFixed(1)+' MiB';btn.replaceWith(link);}catch(e){info.textContent='转换未完成：'+e.message+'。原始录制仍可下载。';btn.disabled=false;}
}
$('recPause').onclick=()=>state.playing?pause():play();$('recStop').onclick=()=>finishRecording();
window.addEventListener('beforeunload',e=>{if(rec){e.preventDefault();e.returnValue='';}});
// Replace the old independent subtitle timer: audio is the clock whenever voice is on.
frame=function(now){
 const dt=Math.min((now-lastFrame)/1000||0,.1);lastFrame=now;
 if(!state.reduce&&(state.playing||!state.started))sceneTime+=dt*(state.playing?state.speed:1);
 if(view!=='concept')drawScene(sceneTime);
 if(state.playing&&!$('dialog').open){
   if(state.voice&&hasAudio){if(!loading)syncAudio();if(state.speechDone&&!state.speechPending&&now-state.speechEndAt>180/Math.max(.5,state.speed)){if(state.auto)advance();else pause();}}
   else{state.elapsed+=dt*state.speed;let total=Math.max(4.2,DATA.cues[state.index].weight/5.4+1.5);cueProgress=Math.min(1,state.elapsed/total);if(state.typewriter&&!state.reduce)showChars(Math.floor(currentChars.length*Math.min(1,cueProgress*1.5)));else revealAll();$('lineFill').style.width=cueProgress*100+'%';if(cueProgress>=1){if(state.auto)advance();else pause();}}
 }
 let shot={index:state.index,progress:cueProgress,time:state.reduce?0:sceneTime,playing:state.playing&&!state.reduce};
 if(view==='concept'||!state.started)PostAIFilm.draw(fctx,film.width,film.height,shot);
 if(rec){PostAIFilm.draw(rec.ctx,...rec.dims,shot);$('recordStatus').textContent=(rec.mr.state==='paused'?'已暂停':'录制中')+' · '+DATA.chapters[DATA.cues[state.index].chapter].label+' · 字幕 '+(state.index+1)+'/'+(recordStop+1)+' · '+(rec.bytes/1048576).toFixed(1)+' MiB';}
 requestAnimationFrame(frame);
};
renderCue();updateControls();
window.PostAIDirector={
 version:'2.0.0',getState:()=>({index:state.index,playing:state.playing,voice:state.voice,speed:state.speed,actualRate:a.playbackRate,currentTime:a.currentTime,round:activeRound,cueProgress,hasAudio,recording:rec?.mr.state||null,service:!!service}),
 setSpeed:r=>{state.speed=r;$('speed').value=String(r);setRate();persist();updateControls();},
 seek:(i,playing=false)=>{if(!state.started)enter(i,playing);else go(i,playing);},play:()=>play(),pause:()=>pause(),
 record:opts=>beginRecording({...recordSettings,...opts}),stopRecord:()=>finishRecording(),openRecording:recordDialog,
 getRecording:()=>lastResult,renderAt:(index,progress=0,time=0,width=1280,height=720)=>{const c=document.createElement('canvas');c.width=width;c.height=height;PostAIFilm.draw(c.getContext('2d'),width,height,{index,progress,time,playing:true});return c.toDataURL('image/png');},
 showResult:showRecordingResult, getAudio:()=>a
};
})();
