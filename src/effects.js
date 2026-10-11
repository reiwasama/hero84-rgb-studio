'use strict';
const EFFECTS=[
 ['userstudio','Benim efektim · Stüdyo','Custom Scenes'],
 ['mario','Mario · Klavye Macerası','Oyun'],
 ['spidermask','Spider-Man · Göz Kırp & Swing','Custom Scenes'],
 ['mikustage','Hatsune Miku · Sahne','Custom Scenes'],
 ['bunnygroove','Bunny Groove · GIF Dansı','Custom Scenes'],
 ['spiderswing','Spider-Man Swing','Custom Scenes'],
 ['rainsoft','İpeksi Yağmur · Gece Serenadı','Parçacık'],
 ['rainbow','Gökkuşağı dalga','Dalga'],['vertical','Dikey spektrum','Dalga'],['diagonal','Çapraz akış','Dalga'],['radial','Renk halkaları','Geometri'],['spiral','Renk spirali','Geometri'],['aurora','Kuzey ışıkları','Atmosfer'],['ocean','Okyanus','Atmosfer'],['lava','Lav akışı','Atmosfer'],['fire','Kor ateşi','Atmosfer'],['ice','Buz kristalleri','Atmosfer'],
 ['matrix','Matrix yağmuru','Parçacık'],['rain','Neon yağmur','Parçacık'],['snow','Kar taneleri','Parçacık'],['stars','Yıldız tarlası','Parçacık'],['comet','Kuyruklu yıldız','Parçacık'],['meteor','Meteor sürüsü','Parçacık'],['scanner','Tarayıcı','Tarama'],['radar','Radar','Tarama'],['double','Çift tarayıcı','Tarama'],['snake','Yılan izi','Tarama'],
 ['breath','Nefes','Sakin'],['heartbeat','Kalp atışı','Sakin'],['sunset','Gün batımı','Sakin'],['candy','Pamuk şeker','Sakin'],['duotone','İki renk akış','Dalga'],['checker','Dama','Geometri'],['diamonds','Elmas halkalar','Geometri'],['plasma','Plazma','Geometri'],['vortex','Girdap','Geometri'],['ripple','Su damlaları','Dalga'],
 ['equalizer','Ritim çubukları','Geometri'],['confetti','Konfeti','Parçacık'],['embers','Uçuşan korlar','Parçacık'],['fireflies','Ateş böcekleri','Parçacık'],['tunnel','Neon tünel','Geometri'],['curtain','Işık perdesi','Dalga'],['gradient','Renk gradyanı','Sakin'],['solid','Sabit renk','Sakin'],['rowchase','Satır takibi','Tarama'],['orbit','Yörünge','Geometri']
].map(([id,name,category])=>({id,name,category}));
EFFECTS.push(...EXTRA_EFFECTS);
const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n)),fract=n=>n-Math.floor(n),wave=n=>(Math.sin(n)+1)/2;
function hsv(h,s=1,v=1){h=fract(h)*6;const c=v*s,x=c*(1-Math.abs(h%2-1)),m=v-c;const a=[[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][Math.floor(h)];return a.map(n=>255*(n+m));}
const mix=(a,b,f)=>a.map((v,i)=>v*(1-clamp(f))+b[i]*clamp(f));
const hex=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
const noise=n=>fract(Math.sin(n*127.1+311.7)*43758.5453);
function segmentDistance(x,y,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,q=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1));return Math.hypot(x-ax-q*dx,y-ay-q*dy);}
function swingPose(t){const theta=Math.sin(t*1.15)*1.02;return{x:.5+Math.sin(theta)*.48,y:-.13+Math.cos(theta)*.63,lean:Math.cos(t*1.15)*.045};}
// Two continuous depth layers. Periodic copies keep wrap points off the board;
// Gaussian trails and impact envelopes never abruptly clear a key.
const SILK_DROPS=Array.from({length:28},(_,i)=>{
 const near=i<16,n=near?16:12,k=near?i:i-16;
 return {x:(k+.35+.3*noise(i+710))/n,phase:noise(i+820),
  velocity:(near?.32:.20)+noise(i+930)*(near?.18:.11),
  width:near?.032:.043,tail:.22+noise(i+1040)*.16,
  gain:(near?.83:.29)*(.7+.3*noise(i+1150)),tint:noise(i+1260),near};
});
function silkyRain(key,t,scale){
 const x=(key.x+key.w/2-20)/650,y=(key.y-37)/195;
 const density=Math.sqrt(scale),period=3.6;
 // Saturated midnight blue stays very dim, without a breathing/full-board pulse.
 let blue=0,teal=0,headLight=0,reflection=0;
 for(const drop of SILK_DROPS){
  const head=(fract(t*drop.velocity*density/period+drop.phase))*period-.8;
  // A slight, continuous lean evokes wind without shaking entire columns.
  const lane=drop.x+.013*Math.sin(t*.19+drop.phase*6.283)+.012*(y-.5);
  const side=Math.exp(-(((x-lane)/drop.width)**2));
  for(let copy=-1;copy<=1;copy++){
   const pos=head+copy*period,d=pos-y;
   const pearl=Math.exp(-((d/.115)**2));
   const trail=Math.exp(-(((d-.18)/drop.tail)**2));
   const glow=side*drop.gain*(.52*pearl+.54*trail);
   blue+=glow*(1-drop.tint*.48);teal+=glow*drop.tint*.48;
   headLight+=side*drop.gain*pearl*.11;
   if(drop.near){
    // Impact centred just after the last row; spreading rings fade on both
    // sides of the event, including when time or direction is reversed.
    const age=(pos-1.025)/drop.velocity;
    const envelope=Math.exp(-(((age-.26)/.28)**2));
    const radius=.018+.075*(age+.35);
    const ring=Math.exp(-(((Math.abs(x-lane)-radius)/.034)**2));
    reflection+=ring*envelope*Math.exp(-(((y-.98)/.105)**2))*.12;
   }
  }
 }
 // Exponential exposure avoids hard clipping when drops overlap.
 const intensity=blue+teal,exposure=(1-Math.exp(-intensity*1.15))/(intensity||1);
 return [2+20*headLight+3*reflection,
  8+(blue*100+teal*225)*exposure+30*headLight+55*reflection,
  21+(blue*228+teal*200)*exposure+32*headLight+85*reflection];
}

// Visual adaptation of UnrealHero's Spider Man profile, video 4:00–4:30.
// Explicit key masks preserve the two slanted lenses on the staggered HERO84.
const SPIDER_LENSES=new Set([15,16,17,25,26,29,30,31,32,37,38,39,40,43,44,45,46,50,51,52,53,57,58,59,62,63,64]);
const SPIDER_RIM=new Set([2,3,10,11,14,18,24,27,28,33,36,41,42,47,49,54,56,60,61,65,69,70,71]);
function spiderMaskColor(key,t){
 const x=(key.x+key.w/2-20)/650,y=(key.y-37)/195;
 // A travelling cool sheen replaces the video's interactive/audio modulation.
 // The red mask and eyes remain visible throughout; no full-board blackouts.
 const sweep=wave(t*.66)*1.5-.25;
 const shine=Math.exp(-(((x-sweep)/.17)**2));
 if(SPIDER_LENSES.has(key.id)){
  const white=.40+.32*shine+.09*wave(t*.8+y*3);
  const level=232+23*white;return [level,level,level];
 }
 if(SPIDER_RIM.has(key.id))return [3,3,3];
 return [178+48*shine,2+4*shine,7+8*shine];
}

function spiderSwingColor(key,t,dark=false){
 const px=(key.x+key.w/2-20)/650,py=(key.y-37)/195,pose=swingPose(t);let c;

  const column=Math.floor(px*16),roof=.80-noise(column+401)*.16;
  c=py>roof?[5,13,32]:[1,2,8];
  if(py>roof&&noise(column*7+Math.round(py*5))>.65)c=[18,18,28];
  if(dark)c=[0,0,0];
  // Pale web from a fixed anchor to the raised hand.
  const web=segmentDistance(px,py,.5,-.12,pose.x,pose.y+.03);
  c=mix(c,[165,200,240],Math.exp(-((web/.022)**2))*.8);
  for(let n=4;n>=1;n--){const old=swingPose(t-n*.11),d=((px-old.x)/.08)**2+((py-old.y-.14)/.16)**2;c=mix(c,[90,8,38],Math.exp(-d)*(5-n)*.035);}
  const sx=pose.x,sy=pose.y,lean=pose.lean;
  const line=(ax,ay,bx,by,w)=>Math.exp(-((segmentDistance(px,py,ax,ay,bx,by)/w)**2));
  const legs=Math.max(line(sx+lean,sy+.21,sx-.065+lean,sy+.36,.036),line(sx+lean,sy+.21,sx+.085+lean,sy+.32,.036));
  c=mix(c,[12,75,255],legs);
  const body=Math.exp(-(((px-sx-lean*.5)/.05)**2+((py-sy-.14)/.105)**2));
  const head=Math.exp(-(((px-sx)/.05)**2+((py-sy)/.075)**2));
  const arms=Math.max(line(sx+lean*.5,sy+.1,sx-.025,sy-.065,.029),line(sx+lean*.5,sy+.1,sx+.11,sy+.045,.027));
  c=mix(c,[255,16,36],Math.max(head,body,arms));
  // A small cool highlight reads as the mask at low keyboard resolution.
  const mask=Math.exp(-(((px-sx-.012)/.024)**2+((py-sy+.012)/.027)**2));
  c=mix(c,[225,240,255],mask*.85);return c;
 }


const ease01=n=>{const q=clamp(n);return q*q*(3-2*q);};
function spiderSequenceState(t){
 const p=fract(t/20)*20;
 const swing=ease01((p-5)/1.1)*(1-ease01((p-12.9)/1.1));
 let blink=0;
 for(const at of [1.6,3.25,15.6,17.1]){
  const d=Math.abs(p-at);blink=Math.max(blink,1-ease01((d-.045)/.24));
 }
 return {p,swing,aperture:1-blink};
}
function spiderSequenceColor(key,t){
 const state=spiderSequenceState(t),x=(key.x+key.w/2-20)/650,y=(key.y-37)/195;
 let mask=spiderMaskColor(key,Math.sin(state.p*Math.PI/10));
 if(SPIDER_LENSES.has(key.id)){
  // The lids close from both edges, retaining the angled eye silhouette.
  const center=.47+.20*(.25-Math.abs(x-.5));
  const halfHeight=.37*state.aperture;
  const opening=ease01((halfHeight-Math.abs(y-center))/.065)*ease01(state.aperture/.12);
  mask=mix([4,1,4],mask,opening);
 }
 return mix(mask,spiderSwingColor(key,state.p-6,true),state.swing);
}
function bunnyGrooveColor(key,t){
 // Re-drawn for six keyboard rows: pink hair, floppy ears, dark outfit and
 // raspberry ribbons. Original GIF pixels and lettering are not embedded.
 const p=t*Math.PI*2/3.6,x=(key.x+key.w/2-20)/650,y=(key.y-37)/195;
 const sway=.065*Math.sin(p),bob=.035*Math.cos(p*2),cx=.5+sway;
 let c=[31+12*wave(x*8+p),1,9+5*wave(y*6-p)];
 const ribbon=Math.exp(-(((y-(.5+.23*Math.sin(x*5-p)))/.09)**2));
 c=mix(c,[115,3,31],ribbon*.65);
 const line=(ax,ay,bx,by,w)=>Math.exp(-((segmentDistance(x,y,ax,ay,bx,by)/w)**2));
 const blob=(ax,ay,rx,ry)=>Math.exp(-(((x-ax)/rx)**4+((y-ay)/ry)**4));
 // Ears tilt in opposing arcs, with broad soft edges between physical keys.
 for(const side of [-1,1]){
  const flap=.065*Math.sin(p+.6*side);
  const ear=line(cx+side*.06,.24+bob,cx+side*(.20+.04*Math.cos(p)),.05+bob+flap,.044);
  c=mix(c,[223,107,157],ear);
  c=mix(c,[104,28,65],line(cx+side*.065,.23+bob,cx+side*.19,.07+bob+flap,.017)*.8);
  const hair=blob(cx+side*.12,.46+bob,.065,.24);
  c=mix(c,[208,106,145],hair*.88);
 }
 c=mix(c,[7,13,22],blob(cx-sway*.22,.81+bob,.15,.30));
 c=mix(c,[65,101,119],blob(cx,.73+bob,.105,.10)*.7);
 const face=blob(cx,.35+bob,.105,.16);
 c=mix(c,[237,167,180],face);
 const fringe=blob(cx,.23+bob,.115,.08);c=mix(c,[218,128,162],fringe);
 for(const side of [-1,1]){
  const eye=line(cx+side*.065,.36+bob,cx+side*.022,.38+bob,.012);
  c=mix(c,[35,10,31],eye*.95);
 }
 c=mix(c,[239,73,121],blob(cx,.43+bob,.021,.022)*.7);
 const bow=line(cx-.055,.57+bob,cx+.055,.57+bob,.02);c=mix(c,[145,55,105],bow*.7);
 return c;
}


// Enlarged portrait: explicit hair, pale face, violet eyes and dark collar.
const ASTOLFO_PORTRAIT=[
 '..DKP......PKD..',
 '..PPHPPHHPPHPP..',
 '.PHHFFFHHFFFHHP.',
 '.PPFVVFFFFVVFPP.',
 '..PPFFFRRFFFPP..',
 '..PPDKWWWWKDPP..'
];
const ASTOLFO_INK={D:[64,22,78],K:[17,8,28],P:[255,55,136],H:[255,133,191],F:[255,218,185],V:[106,20,188],R:[210,24,77],W:[205,224,255]};
function sampleSprite(rows,palette,x,y,bg){
 const row=Math.floor(y),col=Math.floor(x),fx=fract(x),fy=fract(y);
 const at=(xx,yy)=>palette[rows[yy]?.[xx]]||bg;
 return mix(mix(at(col,row),at(col+1,row),fx),mix(at(col,row+1),at(col+1,row+1),fx),fy);
}

const MIKU_FACE=[
 '.TTTTPPTTPPTTTT.',
 '.TTPHHHHHHHPTTT.',
 'TTTHFFHHFFHHTTTT',
 'TTTFVVFFVVFFTTTT',
 'TTTHFFFRRFFHTTTT',
 'TTT..KKTTKK..TTT'
];
const MIKU_INK={T:[0,195,172],H:[20,255,210],P:[226,10,105],F:[255,224,201],V:[12,75,112],R:[232,64,119],K:[14,24,35]};
function mikuStageColor(key,t){
 const phase=fract(t/27)*27,x=(key.x+key.w/2-20)/650*16,y=(key.y-37)/195*5;
 const bg=[0,3,5];let ink=0;
 // 5-row capitals move right-to-left, all 12 characters pass through.
 const text='HATSUNE MIKU',at=x+phase*4.8-16,col=Math.floor(at),row=Math.round(y);
 const bit=n=>{const ch=text[Math.floor(n/4)];return FONT3[ch]?.[row]?.[((n%4)+4)%4]==='1'?1:0;};
 ink=bit(col)*(1-fract(at))+bit(col+1)*fract(at);
 const lettering=mix(bg,[30,255,222],ink);
 let close=0;for(const b of [17.0,18.5,22.1,23.6])close=Math.max(close,1-ease01((Math.abs(phase-b)-.06)/.22));
 const portrait=sampleSprite(MIKU_FACE,MIKU_INK,x,y,bg);
 // Both lenses close together; hair and face stay visible.
 if(Math.abs(y-3)<.45&&((x>3.5&&x<6.4)||(x>7.4&&x<10.4)))for(let j=0;j<3;j++)portrait[j]=portrait[j]*(1-close)+MIKU_INK.F[j]*close;
 const enter=ease01((phase-13.2)/1.0),exit=1-ease01((phase-25.5)/1.5);
 return mix(lettering,portrait,enter).map((v,j)=>bg[j]+(v-bg[j])*exit);
}

function rawColorAt(id,key,index,time,opt){
 const x=(key.x-20)/650,y=(key.y-37)/195,xx=x*opt.scale,yy=y*opt.scale,t=time*opt.speed*(opt.reverse?-1:1),dx=x-.5,dy=(y-.5)*.6,r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),a=hex(opt.color),b=hex(opt.color2);let c=a,v=1,h=0;
 const extra=extraColor(id,key,index,t,opt);if(extra!==null)return extra.map(n=>Math.round(clamp(n*opt.brightness,0,255)));
 switch(id){
 case 'userstudio':c=userStudioColor(key,t);break;
 case 'mikustage':c=mikuStageColor(key,t);break;

 case 'spidermask':c=spiderSequenceColor(key,t);break;
 case 'bunnygroove':c=bunnyGrooveColor(key,t);break;
 case 'mario':return marioColor(key,opt);
 case 'spiderswing':c=spiderSwingColor(key,t);break;
 case 'rainbow':c=hsv(xx*.8-t*.13);break;
 case 'vertical':c=hsv(yy*.8-t*.13);break;
 case 'diagonal':c=hsv((xx+yy)*.6-t*.15);break;
 case 'radial':c=hsv(r*3*opt.scale-t*.2);break;
 case 'spiral':c=hsv(angle/(Math.PI*2)+r*3*opt.scale-t*.15);break;
 case 'aurora':h=wave(xx*5+t*.5+Math.sin(yy*4-t*.3));c=mix([0,245,160],[155,55,255],h);v=.15+.85*wave(yy*5+Math.sin(xx*8+t)*2);break;
 case 'ocean':c=mix([0,25,90],[30,235,255],wave(xx*7+yy*3-t*1.1));v=.45+.55*wave(xx*12-yy*5+t*.7);break;
 case 'lava':c=mix([150,0,65],[255,125,0],wave(xx*8+Math.sin(yy*6+t)+t*.7));break;
 case 'fire':v=clamp((1-y)*.2+.55+.25*Math.sin(xx*15+t*3)+.18*Math.sin(yy*10-t*4));c=hsv(.01+v*.1,1,v);break;
 case 'ice':c=mix([15,55,150],[180,250,255],Math.pow(wave(xx*15+yy*9+Math.sin(t)),4));break;
 case 'matrix':{const col=Math.round(x*15),head=fract(t*(.16+noise(col)*.2)+noise(col+2));const d=fract(head-y);v=Math.pow(1-d,12);c=[30,255,65];if(d<.05)c=[190,255,240];break;}
 case 'rainsoft':c=silkyRain(key,t,opt.scale);break;
 case 'rain':{
  // Drops enter above and leave below the board. No modulo jump on a visible row.
  c=[0,0,0];const px=(key.x+key.w/2-20)/650;
  for(let lane=0;lane<16;lane++){
   const lx=(lane+.5)/16,side=Math.exp(-(((px-lx)/.032)**2));
   if(side<.005)continue;
   const travel=t*(.23+noise(lane+42)*.17)*Math.sqrt(opt.scale)+noise(lane+9)*3;
   const phase=fract(travel),tail=.19+noise(lane+70)*.19;
   for(let cycle=-1;cycle<=1;cycle++){
    const head=(phase+cycle)*2.7-.65,d=head-y;
    const lead=Math.exp(-((d/.11)**2));
    const trail=Math.exp(-Math.max(0,d)/tail)/(1+Math.exp(clamp(-d*42,-60,60)));
    const intensity=side*(.75*lead+.60*trail)*(.65+.35*noise(lane+4));
    const base=mix(a,b,noise(lane));
    const drop=mix(base,[210,245,255],lead*.65);
    c=c.map((n,j)=>n+drop[j]*intensity);
   }
  }
  break;
 }
 case 'snow':{const p=fract(y-t*.17-noise(Math.round(x*20)));v=Math.pow(1-p,20);c=[180,215,255];break;}
 case 'stars':v=Math.pow(wave(t*(.5+noise(index))+noise(index+5)*20),18);c=mix([255,210,125],[170,200,255],noise(index));break;
 case 'comet':{const d=fract(t*.2-xx);v=Math.pow(1-d,10);c=mix(a,b,1-d);break;}
 case 'meteor':{const d=fract(t*.33-xx-yy*.4);v=Math.pow(1-d,16);c=hsv(noise(Math.floor(t*.33-xx-yy*.4))*.9);break;}
 case 'scanner':v=Math.exp(-Math.pow((x-wave(t*1.8))*10*opt.scale,2));c=a;break;
 case 'radar':{const d=fract((angle-t*2)/(Math.PI*2));v=Math.pow(1-d,7);c=mix([10,60,20],[80,255,80],1-d);break;}
 case 'double':v=Math.max(Math.exp(-Math.pow((x-wave(t))*15,2)),Math.exp(-Math.pow((x-(1-wave(t)))*15,2)));c=x<.5?a:b;break;
 case 'snake':{const row=Math.round(y*5),u=(row+(row%2?1-x:x))/6;v=Math.pow(1-fract(t*.15-u),12);c=hsv(u-t*.1);break;}
 case 'breath':v=.05+.95*wave(t*1.6);c=a;break;
 case 'heartbeat':{const p=fract(t*.55);v=.08+.8*Math.exp(-(((p-.18)/.065)**2))+.6*Math.exp(-(((p-.4)/.08)**2));c=a;break;}
 case 'sunset':c=mix([255,95,20],[135,20,160],clamp(y*.7+wave(t*.2+x)*.3));break;
 case 'candy':c=mix([255,110,180],[95,210,255],wave(xx*5-t*.4));break;
 case 'duotone':c=mix(a,b,wave(xx*6+yy*2-t));break;
 case 'checker':c=(Math.floor(xx*8+t*.5)+Math.floor(yy*4))%2?a:b;v=.3+.7*wave(t+xx);break;
 case 'diamonds':c=mix(a,b,wave((Math.abs(dx)+Math.abs(dy))*20*opt.scale-t*2));break;
 case 'plasma':h=(Math.sin(xx*9+t)+Math.sin(yy*7-t)+Math.sin((xx+yy)*6+t*.5))/6+.5;c=hsv(h+t*.04);break;
 case 'vortex':h=angle/(2*Math.PI)+.12/(r+.09)*opt.scale+t*.12;c=hsv(h);v=.3+.7*wave(h*12);break;
 case 'ripple':v=Math.pow(wave(r*28*opt.scale-t*3),6);c=mix(a,b,r*2);break;
 case 'equalizer':{const height=.1+.9*wave(xx*10+t*1.6+Math.sin(xx*15-t*2));v=1-y<height?1:.025;c=hsv(.33-y*.33);break;}
 case 'confetti':{const beat=Math.floor(t*3),rnd=noise(index+beat*84);v=rnd>.78?1:.025;c=hsv(noise(index*3+beat));break;}
 case 'embers':v=Math.pow(wave(index*2.31-t*2-y*3),12);c=mix([255,20,0],[255,165,20],noise(index));break;
 case 'fireflies':v=Math.pow(wave(t*.9+noise(index)*40),10)*(.3+.7*wave(xx*7+yy*4-t));c=[160,255,45];break;
 case 'tunnel':{const d=Math.max(Math.abs(dx)*1.2,Math.abs(dy)*2);v=Math.pow(wave(d*30*opt.scale-t*3),5);c=hsv(d*2-t*.1);break;}
 case 'curtain':c=mix(a,b,wave(yy*5+Math.sin(xx*8+t)*2-t));v=.3+.7*wave(xx*9+t);break;
 case 'gradient':c=mix(a,b,clamp(x*.7+y*.3));break;
 case 'solid':c=a;break;
 case 'rowchase':v=Math.pow(1-fract(t*.3-y*.8),6);c=mix(a,b,y);break;
 case 'orbit':{const ox=.5+.42*Math.cos(t),oy=.5+.4*Math.sin(t);v=Math.exp(-((x-ox)**2+(y-oy)**2)*35*opt.scale);c=mix(a,b,wave(t));break;}
 }
 return c.map(n=>Math.round(clamp(n*v*opt.brightness,0,255)));
}

function gradeColor(rgb,saturation=1){const hi=Math.max(...rgb),lo=Math.min(...rgb);if(hi===lo)return rgb.map(Math.round);const factor=Math.min(Math.max(0,saturation),hi/(hi-lo));return rgb.map(v=>Math.round(clamp(hi-(hi-v)*factor,0,255)));}
function colorAt(id,key,index,time,opt){return gradeColor(rawColorAt(id,key,index,time,opt),opt.saturation??1);}
