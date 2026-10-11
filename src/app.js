'use strict';
const $=id=>document.getElementById(id),wait=ms=>new Promise(r=>setTimeout(r,ms));
const storage={get(k,f){try{return JSON.parse(localStorage.getItem(k))??f;}catch{return f;}},set(k,v){localStorage.setItem(k,JSON.stringify(v));}};
let selected='rainsoft',category='Tümü',favorites=storage.get('hero84-favorites',[]),profiles=storage.get('hero84-profiles',[]);
let device=null,backup=null,running=false,busy=false,loopPromise=null,dirty=false,frames=0,lastRate=performance.now();
let barCurrent=null,barSyncLast=-Infinity,barSyncRGB=null;
const BACKUP='hero84-original-v1';
let animationTime=0,clockPrevious=performance.now();
function clock(now){if(selected==='mario')marioTick(now);else marioLast=now;const dt=Math.max(0,(now-clockPrevious)/1000);clockPrevious=now;const o=options();animationTime+=dt*o.speed*(o.reverse?-1:1);return animationTime;}
function smoothFrame(colors,previous,dt){const alpha=1-Math.exp(-Math.min(.1,Math.max(0,dt))/.065),next={};for(const k of KEYS)next[k.id]=colors[k.id].map((v,j)=>previous?.[k.id]?previous[k.id][j]+(v-previous[k.id][j])*alpha:v);return next;}
function log(s){$('log').textContent=(new Date().toLocaleTimeString()+' '+s+'\n'+$('log').textContent).slice(0,10000);}
function status(s){$('status').textContent=s;log(s);}
function options(){return{speed:+$('speed').value/100,brightness:+$('brightness').value/100,scale:+$('scale').value/100,saturation:+$('saturation').value/100,color:$('color').value,color2:$('color2').value,reverse:$('reverse').checked};}
function controls(){const ready=!!device?.opened;barControls();$('connect').disabled=busy||ready;$('start').disabled=busy||!ready||running||dirty;$('stop').disabled=busy||!ready||(!running&&!dirty);$('recover').disabled=busy||!ready||running||!storage.get(BACKUP,null);}
function packet(command){const p=new Uint8Array(63);p.set(command);p[62]=255-((9+p.slice(0,62).reduce((a,b)=>a+b,0))%256);return p;}
function hasReport(c){return c.some(x=>(x.outputReports||[]).some(r=>r.reportId===9)||hasReport(x.children||[]));}
function query(command,timeout=1800){
 const target=device;
 return new Promise((resolve,reject)=>{
  if(!target?.opened){reject(new Error('Klavyeyle bağlantı yok.'));return;}
  let timer,done=false;
  const finish=(err,p)=>{if(done)return;done=true;clearTimeout(timer);target.removeEventListener('inputreport',receive);err?reject(err):resolve(p);};
  const receive=e=>{if(e.reportId!==9)return;const p=Array.from(new Uint8Array(e.data.buffer,e.data.byteOffset,e.data.byteLength));if(p.length<13||p[0]!==command[0]||p[1]!==command[1]||p[3]!==command[3]||p[4]!==command[4])return;finish(null,p);};
  target.addEventListener('inputreport',receive);timer=setTimeout(()=>finish(new Error('USB yanıtı zaman aşımına uğradı. Diğer RGB uygulamalarını kapat.')),timeout);
  target.sendReport(9,packet(command)).catch(e=>finish(e));
 });
}
async function readColors(){
 const colors={};
 for(let i=0;i<KEYS.length;i+=11){const keys=KEYS.slice(i,i+11),ids=keys.flatMap(k=>[k.id>>8,k.id&255]);const p=await query([134,0,0,1,0,ids.length,...ids]);
  for(let o=6;o+4<p.length-1;o+=5){const id=p[o]*256+p[o+1];if(keys.some(k=>k.id===id))colors[id]=p.slice(o+2,o+5);}
  if(keys.some(k=>!colors[k.id]))throw new Error('Tuş renkleri eksiksiz yedeklenemedi. Efekt başlatılmadı.');
 }
 return colors;
}
function framePalette(colors){
 // Captures only demonstrate up to 3 x 56 payload bytes. 84 IDs leave
 // room for at most 21 RGB/count groups (84 + 21*4 = 168 bytes).
 const exact=new Map();
 for(const k of KEYS){const rgb=colors[k.id].map(v=>Math.round(clamp(v,0,255))),sig=rgb.join(',');if(!exact.has(sig))exact.set(sig,{rgb,ids:[]});exact.get(sig).ids.push(k.id);}
 const groups=[...exact.values()];
 // Merge the nearest colors, weighted by affected key count. No color dithering
 // or black filler frames: every physical key keeps a color in every frame.
 while(groups.length>21){let best=Infinity,ai=0,bi=1;
  for(let a=0;a<groups.length;a++)for(let b=a+1;b<groups.length;b++){const x=groups[a],y=groups[b],weight=x.ids.length*y.ids.length/(x.ids.length+y.ids.length);let d=0;for(let j=0;j<3;j++)d+=(x.rgb[j]-y.rgb[j])**2;d*=weight;if(d<best){best=d;ai=a;bi=b;}}
  const a=groups[ai],b=groups[bi],n=a.ids.length+b.ids.length;a.rgb=a.rgb.map((v,j)=>(v*a.ids.length+b.rgb[j]*b.ids.length)/n);a.ids.push(...b.ids);groups.splice(bi,1);
 }
 return groups.map(g=>({rgb:g.rgb.map(Math.round),ids:g.ids}));
}
function livePackets(colors){
 // Captured HERO live protocol: RGB, count, one-byte key IDs; 56-byte chunks.
 const data=[];for(const {rgb,ids} of framePalette(colors))data.push(...rgb,ids.length,...ids);
 const total=Math.ceil(data.length/56),packets=[];
 if(total>3)throw new Error('RGB kare boyutu sınırı aşıldı.');
 for(let i=0;i<total;i++){const chunk=data.slice(i*56,i*56+56);packets.push(packet([8,1,0,total,i,chunk.length,...chunk]));}
 return packets;
}
async function sendLiveColors(colors){
 for(const p of livePackets(colors)){await device.sendReport(9,p);await wait(2);}
}
async function sendColors(colors){
 const total=Math.ceil(KEYS.length/11);
 for(let chunk=0;chunk<total;chunk++){const keys=KEYS.slice(chunk*11,chunk*11+11),data=keys.flatMap(k=>[k.id>>8,k.id&255,...colors[k.id].map(Math.round)]),command=[6,0,0,total,chunk,data.length,...data];
  // Configuration writes are used only when restoring the saved colors.
  await query(command);
 }
}
async function restore(){
 if(!backup)backup=storage.get(BACKUP,null);
 if(!backup||backup.uuid!==18691697672197||!Array.isArray(backup.mode)||backup.mode.length!==7||KEYS.some(k=>!Array.isArray(backup.colors[k.id])||backup.colors[k.id].length!==3))throw new Error('Geçerli ışık yedeği bulunamadı.');
 await restoreSyncedBar();await sendColors(backup.colors);await query([4,1,0,1,0,7,...backup.mode]);dirty=false;backup.pending=false;storage.set(BACKUP,backup);status('Önceki ışık ayarları geri yüklendi.');
}
$('connect').onclick=async()=>{
 busy=true;barCurrent=null;controls();let candidate;
 try{
  if(!navigator.hid)throw new Error('Bu dosyayı güncel Chrome veya Edge ile aç.');
  const devices=await navigator.hid.requestDevice({filters:[{vendorId:0x372e,productId:0x103e}]});
  if(!devices.length){status('Cihaz seçilmedi.');return;}
  candidate=devices.find(d=>hasReport(d.collections));if(!candidate)throw new Error('RGB arayüzü bulunamadı.');
  await candidate.open();device=candidate;
  const p=await query([130,1,0,1,0,6]);const uuid=p.slice(6,12).reduce((a,b)=>a*256+b,0);
  if(uuid!==18691697672197)throw new Error('Bu uygulama yalnızca doğrulanmış HERO84 HE modeli için.');
  const cap=await query([130,9,0,1,0,0]);if(cap.length<24||cap[23]<1)throw new Error('Canlı ışık desteği doğrulanamadı.');
  backup=storage.get(BACKUP,null);dirty=!!backup?.pending;status(dirty?'Önceki oturum yarım kalmış. Önce “Yedekten geri yükle” kullan.':'HERO84 bağlı. Bir efekt seçip başlatabilirsin.');
 }catch(e){if(candidate?.opened)await candidate.close().catch(()=>{});device=null;status(e.message);}finally{busy=false;controls();}
};
$('start').onclick=async()=>{
 busy=true;controls();
 try{
  status('Mevcut ışık ayarları yedekleniyor…');
  const p=await query([132,1,0,1,0,0]);backup={uuid:18691697672197,mode:p.slice(6,13),colors:await readColors(),pending:true};storage.set(BACKUP,backup);
  // Live frames replace repeated custom-mode configuration writes.
  dirty=true;barSyncLast=-Infinity;barSyncRGB=null;running=true;
  status('Efekt akışı başladı. Görsel sonucu klavyede kontrol et.');
  loopPromise=run();if(selected==='mario'&&!mario.auto)$('preview').focus();
 }catch(e){status(e.message);if(dirty){try{await restore();}catch(err){status('Geri yükleme tamamlanamadı: '+err.message);}}}
 finally{busy=false;controls();}
};
async function run(){
 frames=0;lastRate=performance.now();let previous=null,previousTime=performance.now();
 try{while(running){const begun=performance.now(),opt={...options(),speed:1,reverse:false},time=clock(begun),colors={};KEYS.forEach((k,i)=>colors[k.id]=colorAt(selected,k,i,time,opt));previous=smoothFrame(colors,previous,(begun-previousTime)/1000);previousTime=begun;await sendLiveColors(previous);await syncBarFrame(previous);frames++;
  if(performance.now()-lastRate>2000){$('status').textContent='Akış açık · '+(frames*1000/(performance.now()-lastRate)).toFixed(1)+' kare/sn · '+EFFECTS.find(e=>e.id===selected).name;frames=0;lastRate=performance.now();}
  // Always leave idle time after the complete frame, even after a slow write.
  await wait(Math.max(30,1000/Math.min(20,+$('fps').value)-(performance.now()-begun)));}
 }catch(e){running=false;status('Efekt durdu: '+e.message);try{await restore();}catch(err){status('Bağlanıp “Yedekten geri yükle” kullan. '+err.message);}}
 finally{controls();}
}
$('stop').onclick=async()=>{busy=true;running=false;controls();try{await loopPromise;await wait(60);await restore();}catch(e){status('Geri yükleme tamamlanamadı: '+e.message);}finally{busy=false;controls();}};
$('recover').onclick=async()=>{busy=true;controls();try{await restore();}catch(e){status(e.message);}finally{busy=false;controls();}};
navigator.hid?.addEventListener('disconnect',e=>{if(e.device===device){running=false;device=null;status('USB bağlantısı kesildi. Yeniden bağlanıp yedeği geri yükle.');controls();}});
window.addEventListener('beforeunload',e=>{if(dirty||storage.get('hero84-bar-v1',null)?.pending){e.preventDefault();e.returnValue='';}});
function choose(id){if(id!==selected&&(id==='spidermask'||id==='bunnygroove'||id==='astolfojump'||id==='mikustage')){animationTime=0;clockPrevious=performance.now();}selected=id;marioLast=performance.now();$('gamePanel').hidden=id!=='mario';$('effectTitle').textContent=EFFECTS.find(e=>e.id===id).name;$('favorite').textContent=favorites.includes(id)?'★ Favoriden çıkar':'☆ Favoriye ekle';renderEffects();}
function renderEffects(){
 const list=EFFECTS.filter(e=>(category==='Tümü'||category==='Favoriler'&&favorites.includes(e.id)||e.category===category)&&(e.name+' '+tr(e.name)).toLocaleLowerCase('tr').includes($('search').value.toLocaleLowerCase('tr')));
 $('count').textContent=list.length+' / '+EFFECTS.length;$('libraryStats').textContent=EFFECTS.length+' efekt · '+new Set(EFFECTS.map(e=>e.category)).size+' kategori · '+favorites.length+' favori';$('effects').replaceChildren();
 for(const e of list){const btn=document.createElement('button');btn.className='effect'+(selected===e.id?' active':'');btn.setAttribute('aria-pressed',String(selected===e.id));const line=document.createElement('i'),title=document.createElement('b'),sub=document.createElement('span');title.textContent=e.name;sub.textContent=e.category+(favorites.includes(e.id)?' · ★':'');btn.append(line,title,sub);btn.onclick=()=>choose(e.id);$('effects').append(btn);}
}
for(const cat of ['Tümü','Favoriler',...new Set(EFFECTS.map(e=>e.category))]){const btn=document.createElement('button');btn.textContent=cat;if(cat===category)btn.className='active';btn.onclick=()=>{category=cat;[...$('filters').children].forEach(b=>b.classList.toggle('active',b===btn));renderEffects();};$('filters').append(btn);}
$('search').oninput=renderEffects;
for(const id of ['speed','brightness','scale','saturation'])$(id).oninput=()=>{$(id+'Value').textContent=['brightness','saturation'].includes(id)?$(id).value+'%':(+$(id).value/100).toFixed(1)+'×';};
$('favorite').onclick=()=>{favorites=favorites.includes(selected)?favorites.filter(x=>x!==selected):[...favorites,selected];try{storage.set('hero84-favorites',favorites);}catch{status('Favoriler bu tarayıcıda kaydedilemedi.');}choose(selected);};
$('save').onclick=()=>{const name=prompt(tr('Profil adı'),EFFECTS.find(e=>e.id===selected).name);if(!name?.trim())return;profiles.push({name:name.trim().slice(0,40),effect:selected,options:options()});profiles=profiles.slice(-16);try{storage.set('hero84-profiles',profiles);renderProfiles();}catch{status('Profil kaydedilemedi.');}};
function renderProfiles(){$('profiles').replaceChildren();for(const p of profiles){const btn=document.createElement('button');btn.textContent=p.name;btn.onclick=()=>{for(const id of ['speed','brightness','scale','saturation']){$(id).value=(p.options[id]??(id==='saturation'?1.5:1))*100;$(id).oninput();}for(const id of ['color','color2'])$(id).value=p.options[id];$('reverse').checked=p.options.reverse;choose(p.effect);};$('profiles').append(btn);}}
const ctx=$('preview').getContext('2d');let lastPreview=0;
function draw(t){requestAnimationFrame(draw);if(t-lastPreview<33)return;lastPreview=t;gameHud();ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,690,280);const opt={...options(),speed:1,reverse:false},time=clock(performance.now());KEYS.forEach((k,i)=>{const c=colorAt(selected,k,i,time,opt),rgb=`rgb(${c.join(',')})`;ctx.fillStyle='#0b101b';ctx.beginPath();ctx.roundRect(k.x,k.y,k.w,k.h,4);ctx.fill();ctx.strokeStyle=rgb;ctx.lineWidth=2;ctx.shadowColor=rgb;ctx.shadowBlur=9;ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=rgb;ctx.globalAlpha=.18;ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#cbd4e5';ctx.font='8px Segoe UI';ctx.textAlign='center';ctx.fillText(k.label.replace('L_','').replace('R_',''),k.x+k.w/2,k.y+k.h/2+3);});}
choose(selected);renderProfiles();requestAnimationFrame(draw);controls();

function gameHud(){if(selected!=='mario')return;const label=mario.state==='win'?'Bölüm tamamlandı!':mario.state==='over'?'Oyun bitti':mario.paused?'Duraklatıldı':mario.auto?'Otomatik demo':'Sen oynuyorsun';$('gameScore').textContent=label+' · Can '+mario.lives+' · Altın '+mario.coins.size+'/'+MARIO_LEVEL.coins.length+' · Puan '+mario.score;$('gamePause').textContent=mario.paused?'Devam et':'Duraklat';}
$('gamePlay').onclick=()=>{marioReset(false);$('preview').focus();gameHud();};
$('gameDemo').onclick=()=>{marioReset(true);gameHud();};
$('gameRestart').onclick=()=>{marioReset(mario.auto);$('preview').focus();gameHud();};
$('gamePause').onclick=()=>{mario.paused=!mario.paused;mario.input.left=false;mario.input.right=false;marioLast=performance.now();if(!mario.paused)$('preview').focus();gameHud();};
function clearGameInput(){mario.input.left=false;mario.input.right=false;mario.jump=false;}
window.addEventListener('keydown',e=>{if(selected!=='mario'||mario.auto||e.target?.isContentEditable||['INPUT','TEXTAREA','SELECT','BUTTON'].includes(e.target?.tagName))return;if(!['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW','KeyR','Escape'].includes(e.code))return;e.preventDefault();if(e.code==='Escape'&&!e.repeat){mario.paused=!mario.paused;clearGameInput();}else if(e.code==='KeyR'&&!e.repeat)marioReset(false);else if(!mario.paused){if(['ArrowLeft','KeyA'].includes(e.code))mario.input.left=true;if(['ArrowRight','KeyD'].includes(e.code))mario.input.right=true;if(['ArrowUp','Space','KeyW'].includes(e.code)&&!e.repeat)mario.jump=true;}gameHud();});
window.addEventListener('keyup',e=>{if(['ArrowLeft','KeyA'].includes(e.code))mario.input.left=false;if(['ArrowRight','KeyD'].includes(e.code))mario.input.right=false;});
window.addEventListener('blur',()=>{clearGameInput();if(selected==='mario'&&!mario.auto){mario.paused=true;gameHud();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&selected==='mario'&&!mario.auto){clearGameInput();mario.paused=true;gameHud();}});

$('randomEffect').onclick=()=>{const pool=EFFECTS.filter(e=>e.id!==selected&&e.id!=='mario');choose(pool[Math.floor(Math.random()*pool.length)].id);};
$('vivid').onclick=()=>{$('saturation').value=150;$('saturation').oninput();};
$('neutral').onclick=()=>{$('saturation').value=100;$('saturation').oninput();};




// Official AULA edge-light config: read 84/06, write 04/06. Never stream it.

function barControls(){const blocked=busy||running||!device?.opened;$('barRead').disabled=blocked;$('barApply').disabled=blocked||!barCurrent;$('barRestore').disabled=blocked||!storage.get('hero84-bar-v1',null)?.pending;}
async function readBar(){const p=await query([132,6,0,1,0,0]);if(p[5]<7)throw new Error('Üst bar ayarı doğrulanamadı; değişiklik yapılmadı.');return p.slice(6,13);}
function barShow(raw){$('barColor').value='#'+raw.slice(2,5).map(v=>v.toString(16).padStart(2,'0')).join('');$('barMode').value=[0,1,2,3,4,5].includes(raw[0])?String(raw[0]):'keep';$('barSpeed').value=raw[6]<=4?String(raw[6]):'keep';$('barLevel').value=raw[5]<=4?String(raw[5]):'keep';$('barInfo').textContent='Bar ayarı okundu. Efektini seçip Uygula düğmesine bas. Sabit ışık akışı durdurur.';}
async function barAction(action){if(busy||running||!device?.opened)return;busy=true;controls();try{await action();}catch(e){$('barInfo').textContent=e.message;}finally{busy=false;controls();}}
$('barRead').onclick=()=>barAction(async()=>{barCurrent=null;barCurrent=await readBar();barShow(barCurrent);});
$('barApply').onclick=()=>barAction(async()=>{
 if(!barCurrent)throw new Error('Önce bar ayarını oku.');
 const before=await readBar();let saved=storage.get('hero84-bar-v1',null);
 if(!saved?.pending){saved={uuid:18691697672197,raw:before,pending:true};storage.set('hero84-bar-v1',saved);}
 if(saved.uuid!==18691697672197)throw new Error('Üst bar yedeği bu modele ait değil.');
 const pick=(id,old,max)=>{const value=$(id).value;if(value==='keep')return old;const n=Number(value);if(value===''||!Number.isInteger(n)||n<0||n>max)throw new Error('Geçersiz bar ayarı.');return n;};
 const raw=[pick('barMode',before[0],5),0,...hex($('barColor').value),pick('barLevel',before[5],4),pick('barSpeed',before[6],4)];
 await query([4,6,0,1,0,7,...raw]);
 const actual=await readBar();if(actual.some((v,i)=>v!==raw[i]))throw new Error('Bar ayarı geri okumayla doğrulanamadı. Eski bar ayarını geri yükleyebilirsin.');
 $('barInfo').textContent='Bar ayarı gönderildi ve geri okundu. Fiziksel ışığı kontrol et. Yedek saklanıyor.';
});
$('barRestore').onclick=()=>barAction(async()=>{
 const saved=storage.get('hero84-bar-v1',null);
 if(saved?.uuid!==18691697672197||!Array.isArray(saved.raw)||saved.raw.length!==7||saved.raw.some(v=>!Number.isInteger(v)||v<0||v>255))throw new Error('Geçerli üst bar yedeği yok.');
 await query([4,6,0,1,0,7,...saved.raw]);const actual=await readBar();if(actual.some((v,i)=>v!==saved.raw[i]))throw new Error('Bar geri yüklemesi doğrulanamadı. Yedek korundu.');
 saved.pending=false;storage.set('hero84-bar-v1',saved);barCurrent=actual;barShow(actual);$('barInfo').textContent='Önceki üst bar ayarı geri yüklendi.';
});
barControls();


function barFrameColor(colors){
 // Brightness-weighted average: black surroundings do not wash out a character.
 let total=0,sum=[0,0,0];for(const rgb of Object.values(colors)){const w=Math.max(...rgb)/255;total+=w;for(let j=0;j<3;j++)sum[j]+=rgb[j]*w;}
 return sum.map(v=>Math.round(total?v/total:0));
}
async function restoreSyncedBar(){
 if(!backup?.syncBar)return;
 const original=backup.syncBar;await query([4,6,0,1,0,7,...original]);
 const actual=await readBar();if(actual.some((v,i)=>v!==original[i]))throw new Error('Eşlenen bar geri yüklenemedi; yedek korunuyor.');
 delete backup.syncBar;storage.set(BACKUP,backup);barSyncRGB=null;
 $('barInfo').textContent='Eşleme öncesindeki bar ayarı geri yüklendi.';
}
async function syncBarFrame(colors){
 if(!$('barSync').checked){await restoreSyncedBar();return;}
 const now=performance.now();if(now-barSyncLast<1000)return;
 const style=$('barSyncStyle').value;const palette=barDominantColors(colors);const rgb=palette[style==='palette'?Math.floor(now/2500)%palette.length:0],mode=style==='palette'?3:Number(style||3);
 if(![1,3,4].includes(mode))throw new Error('Geçersiz bar eşleme modu.');
 if(barSyncRGB&&barSyncRGB.mode===mode&&rgb.every((v,i)=>Math.abs(v-barSyncRGB.rgb[i])<12))return;
 if(!backup.syncBar){const original=await readBar();backup.syncBar=original;storage.set(BACKUP,backup);}
 // Serialized after the complete key frame; never interleave USB packets.
 await query([4,6,0,1,0,7,mode,0,...rgb,backup.syncBar[5],backup.syncBar[6]]);
 barSyncLast=performance.now();barSyncRGB={rgb,mode};
 $('barInfo').textContent='Deneysel eşleme açık · en fazla saniyede 1 renk güncellemesi. Kesinti olursa tiki kapat.';
}

function barDominantColors(colors){
 const groups=new Map();for(const c of Object.values(colors)){if(Math.max(...c)<15)continue;const key=c.map(v=>Math.round(v/48)).join(',');let g=groups.get(key);if(!g){g={n:0,rgb:[0,0,0]};groups.set(key,g);}g.n++;c.forEach((v,j)=>g.rgb[j]+=v);}
 return [...groups.values()].sort((a,b)=>b.n-a.n).slice(0,3).map(g=>g.rgb.map(v=>Math.round(v/g.n))).concat(groups.size?[]:[[0,0,0]]);
}

initStudio();
