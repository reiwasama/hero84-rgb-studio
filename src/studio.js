'use strict';
const studioBlank=()=>Object.fromEntries(KEYS.map(k=>[k.id,[0,0,0]]));
let studioProject={version:1,name:'Benim efektim',smooth:true,frames:[{duration:500,colors:studioBlank()}]},studioIndex=0,studioUndo=[],studioPainting=false;
function studioValidate(p){
 if(!p||p.version!==1||typeof p.name!=='string'||p.name.length>60||typeof p.smooth!=='boolean'||!Array.isArray(p.frames)||p.frames.length<1||p.frames.length>60)throw new Error('Geçerli bir HERO84 efekt dosyası değil.');
 return {version:1,name:p.name,smooth:p.smooth,frames:p.frames.map(f=>{if(!Number.isInteger(f.duration)||f.duration<50||f.duration>5000)throw new Error('Kare süresi 50–5000 ms olmalı.');const colors={};for(const k of KEYS){const c=f.colors?.[k.id];if(!Array.isArray(c)||c.length!==3||c.some(v=>!Number.isInteger(v)||v<0||v>255))throw new Error('Tuş renkleri eksik veya geçersiz.');colors[k.id]=[...c];}return{duration:f.duration,colors};})};
}
function userStudioColor(key,t){
 const frames=studioProject.frames,total=frames.reduce((n,f)=>n+f.duration,0);let ms=((t*1000%total)+total)%total,index=0;
 while(index<frames.length-1&&ms>=frames[index].duration){ms-=frames[index].duration;index++;}
 const f=frames[index],next=frames[(index+1)%frames.length];return mix(f.colors[key.id],next.colors[key.id],studioProject.smooth?ease01((ms/f.duration-.7)/.3):0);
}
function studioSnapshot(){studioUndo.push(JSON.stringify(studioProject));if(studioUndo.length>30)studioUndo.shift();}
function studioMessage(s){document.getElementById('studioMessage').textContent=s;}
function studioSave(){try{localStorage.setItem('hero84-studio-v1',JSON.stringify(studioProject));studioMessage('Bu tarayıcıya kaydedildi. Paylaşmak için Efekti indir kullan.');}catch{studioMessage('Tarayıcıya kaydedilemedi. Efekti indir ile dosya olarak sakla.');}}
function studioDraw(){
 const canvas=document.getElementById('studioCanvas'),ctx=canvas.getContext('2d');ctx.clearRect(0,0,690,280);ctx.fillStyle='#080d16';ctx.fillRect(0,0,690,280);
 for(const k of KEYS){const c=studioProject.frames[studioIndex].colors[k.id];ctx.fillStyle='rgb('+c.join(',')+')';ctx.beginPath();ctx.roundRect(k.x,k.y,k.w,k.h,4);ctx.fill();ctx.strokeStyle='#53617a';ctx.stroke();ctx.fillStyle=Math.max(...c)>150?'#080d16':'#ffffff';ctx.font='9px Segoe UI';ctx.textAlign='center';ctx.fillText(k.label,k.x+k.w/2,k.y+k.h/2+3);}
}
function studioRender(){
 const by=id=>document.getElementById(id);by('studioName').value=studioProject.name;by('studioSmooth').checked=studioProject.smooth;by('studioDuration').value=studioProject.frames[studioIndex].duration;by('studioFrames').replaceChildren();
 studioProject.frames.forEach((f,i)=>{const b=document.createElement('button');b.textContent=(i+1)+' · '+f.duration+' ms';b.className=i===studioIndex?'primary':'';b.onclick=()=>{studioIndex=i;studioRender();};by('studioFrames').append(b);});
 by('studioCount').textContent=studioProject.frames.length+'/60 kare · '+(studioProject.frames.reduce((n,f)=>n+f.duration,0)/1000).toFixed(1)+' saniye';studioDraw();
}
function initStudio(){
 const by=id=>document.getElementById(id);try{const p=localStorage.getItem('hero84-studio-v1');if(p)studioProject=studioValidate(JSON.parse(p));}catch{studioMessage('Eski stüdyo kaydı açılamadı; boş çalışma hazır.');}
 by('studioBrush').value='#00e5c8';
 const edit=fn=>{studioSnapshot();fn();studioSave();studioRender();};
 const paint=e=>{const canvas=by('studioCanvas'),rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*690/rect.width,y=(e.clientY-rect.top)*280/rect.height;const key=KEYS.find(k=>x>=k.x&&x<=k.x+k.w&&y>=k.y&&y<=k.y+k.h);if(key){studioProject.frames[studioIndex].colors[key.id]=hex(by('studioBrush').value);studioDraw();}};
 by('studioCanvas').addEventListener('pointerdown',e=>{if(e.button!==0)return;studioSnapshot();studioPainting=true;by('studioCanvas').setPointerCapture(e.pointerId);paint(e);});
 by('studioCanvas').addEventListener('pointermove',e=>{if(studioPainting)paint(e);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])by('studioCanvas').addEventListener(event,()=>{if(studioPainting){studioPainting=false;studioSave();}});
 by('studioFill').onclick=()=>edit(()=>{const c=hex(by('studioBrush').value);for(const k of KEYS)studioProject.frames[studioIndex].colors[k.id]=[...c];});
 by('studioClear').onclick=()=>edit(()=>{studioProject.frames[studioIndex].colors=studioBlank();});
 by('studioAdd').onclick=()=>{if(studioProject.frames.length>=60){studioMessage('En fazla 60 kare eklenebilir.');return;}edit(()=>{studioProject.frames.splice(studioIndex+1,0,JSON.parse(JSON.stringify(studioProject.frames[studioIndex])));studioIndex++;});};
 by('studioDelete').onclick=()=>{if(studioProject.frames.length===1){studioMessage('En az bir kare kalmalı.');return;}edit(()=>{studioProject.frames.splice(studioIndex,1);studioIndex=Math.min(studioIndex,studioProject.frames.length-1);});};
 by('studioBack').onclick=()=>{if(!studioUndo.length)return;studioProject=JSON.parse(studioUndo.pop());studioIndex=Math.min(studioIndex,studioProject.frames.length-1);studioSave();studioRender();};
 by('studioDuration').onchange=()=>{const n=Number(by('studioDuration').value);if(!Number.isInteger(n)||n<50||n>5000){studioMessage('Süre 50–5000 ms arasında olmalı.');studioRender();return;}edit(()=>{studioProject.frames[studioIndex].duration=n;});};
 by('studioName').onchange=()=>edit(()=>{studioProject.name=by('studioName').value.trim().slice(0,60)||'Benim efektim';});
 by('studioSmooth').onchange=()=>edit(()=>{studioProject.smooth=by('studioSmooth').checked;});
 by('studioPlay').onclick=()=>{animationTime=0;clockPrevious=performance.now();choose('userstudio');studioMessage('Efekt seçildi. Klavyede oynatmak için üstte Efekti başlat kullan.');};
 by('studioCapture').onclick=()=>{if(selected==='userstudio'){studioMessage('Önce kütüphaneden örnek almak istediğin başka bir efekt seç.');return;}edit(()=>{const opt={...options(),brightness:1,speed:1,reverse:false};studioProject.frames=Array.from({length:24},(_,n)=>({duration:150,colors:Object.fromEntries(KEYS.map((k,i)=>[k.id,colorAt(selected,k,i,animationTime+n*.15,opt)]))}));studioProject.name=EFFECTS.find(e=>e.id===selected).name.slice(0,45)+' · kopyam';studioIndex=0;});studioMessage('Seçili efektin 3,6 saniyelik örneği 24 kareye alındı. Her kareyi boyayabilirsin.');};
 by('studioExport').onclick=()=>{const blob=new Blob([JSON.stringify(studioProject,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='HERO84-efekt.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);};
 by('studioImport').onchange=async e=>{try{const f=e.target.files?.[0];if(!f)return;if(f.size>1000000)throw new Error('Efekt dosyası 1 MB sınırını aşıyor.');const p=studioValidate(JSON.parse(await f.text()));edit(()=>{studioProject=p;studioIndex=0;});}catch(err){studioMessage(err.message);}finally{e.target.value='';}};
 studioRender();
}
