'use strict';
const EXTRA_EFFECTS=[
 ['nyan','Nyan Cat','Meme'],['amongus','Among Us · Sus','Meme'],['pepe','Pepe','Meme'],['doge','Doge · Much RGB','Meme'],['banana','Dans Eden Muz','Meme'],['invader','Space Invader','Retro'],['pacman','Pac-Man','Retro'],['ghost','Hayalet Takibi','Retro'],['kirby','Kirby','Karakter'],['pokeball','Poké Ball','Karakter'],['batman','Yarasa Sinyali','Karakter'],['sonic','Sonic Koşusu','Karakter'],
 ['gg','GG WP','Meme Yazı'],['ez','EZ','Meme Yazı'],['bruh','BRUH','Meme Yazı'],['lol','LOL','Meme Yazı'],['afk','AFK','Meme Yazı'],['pressf','PRESS F','Meme Yazı'],['error404','404 NOT FOUND','Meme Yazı'],['rickroll','Never Gonna Give You Up','Meme Yazı'],['stonks','STONKS','Meme Yazı'],['catjam','CAT JAM','Meme Yazı'],['bonk','BONK','Meme Yazı'],['sus','SUS','Meme Yazı'],
 ['synthwave','Synthwave Ufku','Atmosfer'],['neonroad','Neon Otoyol','Atmosfer'],['wiregrid','Lazer Izgarası','Geometri'],['blackhole','Kara Delik','Uzay'],['galaxy','Galaksi Kolları','Uzay'],['supernova','Süpernova','Uzay'],['solarflare','Güneş Patlaması','Uzay'],['nebula','Bulutsu','Uzay'],['warp','Warp Yolculuğu','Uzay'],['thunder','Şimşek Yolu','Atmosfer'],['clouds','Bulut Denizi','Atmosfer'],['forest','Derin Orman','Doğa'],['biolume','Biyolüminesans','Doğa'],['coral','Mercan Resifi','Doğa'],['tropical','Tropik Sahil','Doğa'],['honeycomb','Bal Peteği','Geometri'],['mandala','Mandala','Geometri'],['moire','Dalga Girişimi','Geometri'],['kaleido','Kaleydoskop','Geometri'],['yinyang','Yin Yang','Geometri'],['helix','Çift Sarmal','Geometri'],['circuit','Devre Akışı','Teknoloji'],['glitch','Dijital Kayma','Teknoloji'],['progress','İndirme Çubuğu','Teknoloji'],['loading','Yükleniyor…','Teknoloji'],['pong','Pong Rallisi','Retro'],['tetris','Düşen Bloklar','Retro'],['fireworks','Renk Çiçekleri','Parçacık'],['bubbles','Baloncuklar','Parçacık'],['waterfall','Şelale','Doğa'],['spectrumtest','Saf RGB Testi','Teknoloji'],['heatmap','Isı Dalgası','Atmosfer'],['raindrops','Yağmur Halkaları','Doğa']
].map(([id,name,category])=>({id,name,category}));
const PIXEL_ART={
 nyan:['..PPPPP.C.C.','RRPPPPPGGGG.','OOPPPPPGKGK.','YYPPPPPGGGG.','GG..P.P..G.G'],
 amongus:['..RRR..','RRWWCR.','RRWWCR.','RRRRRR.','..R.R..'],
 pepe:['.GG.GG.','GWWGWWG','GKG.GKG','GGGGGGG','.RRRRR.'],
 doge:['Y.....Y','YYYYYYY','YKY.YKY','YYYKYYY','.YRRRY.'],
 banana:['....YY.','...YYY.','..YYYY.','.YYYY..','YY..Y..'],
 invader:['.G...G.','..GGG..','.GKGKG.','GGGGGGG','G.G.G.G'],
 pacman:['..YYYY.','.YYYY..','YYYY...','.YYYY..','..YYYY.'],
 ghost:['..PPP..','.PPPPP.','PPWPWPP','PPKPKPP','P.P.P.P'],
 kirby:['..PPP..','.PPPPP.','PPKPKPP','.PRRRP.','RR...RR'],
 pokeball:['..RRR..','.RRRRR.','KKKWKKK','.WWWWW.','..WWW..'],
 batman:['K.....K','KK.K.KK','KKKKKKK','.KKKKK.','...K...'],
 sonic:['..BBBB.','.BBK...','BBBCBB.','..BBB..','.RR.RR.']
};
const PIXEL_COLORS={R:[255,8,15],G:[10,240,45],B:[10,65,255],Y:[255,190,0],P:[255,12,135],C:[0,220,255],O:[255,65,0],W:[215,235,255],K:[1,1,3]};
const MEME_TEXT={gg:'GG WP',ez:'EZ',bruh:'BRUH',lol:'LOL',afk:'AFK',pressf:'PRESS F',error404:'404 NOT FOUND',rickroll:'NEVER GONNA GIVE YOU UP',stonks:'STONKS',catjam:'CAT JAM',bonk:'BONK',sus:'SUS'};
const FONT3={A:['010','101','111','101','101'],B:['110','101','110','101','110'],C:['011','100','100','100','011'],D:['110','101','101','101','110'],E:['111','100','110','100','111'],F:['111','100','110','100','100'],G:['011','100','101','101','011'],H:['101','101','111','101','101'],I:['111','010','010','010','111'],J:['001','001','001','101','010'],K:['101','101','110','101','101'],L:['100','100','100','100','111'],M:['101','111','111','101','101'],N:['101','111','111','111','101'],O:['010','101','101','101','010'],P:['110','101','110','100','100'],Q:['010','101','101','111','011'],R:['110','101','110','101','101'],S:['011','100','010','001','110'],T:['111','010','010','010','010'],U:['101','101','101','101','111'],V:['101','101','101','101','010'],W:['101','101','111','111','101'],X:['101','101','010','101','101'],Y:['101','101','010','010','010'],Z:['111','001','010','100','111'],'0':['111','101','101','101','111'],'4':['101','101','111','001','001'],' ':['000','000','000','000','000']};
function pixelSample(rows,x,y,palette){const col=Math.floor(x),row=Math.round(y),f=x-col;const sample=c=>palette[rows[row]?.[c]]||[0,0,0];return mix(sample(col),sample(col+1),f);}
function extraColor(id,key,index,t,opt){
 const x=(key.x+key.w/2-20)/650,y=(key.y-37)/195,xx=x*opt.scale,yy=y*opt.scale,a=hex(opt.color),b=hex(opt.color2),dx=x-.5,dy=(y-.5)*.65,r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);let c=null,v=1;
 if(PIXEL_ART[id]){const rows=PIXEL_ART[id],width=rows[0].length,offset=(16-width)/2+Math.sin(t*.85)*Math.min(3,(16-width)/2);const px=x*16-offset,py=y*5;
  c=pixelSample(rows,px,py,PIXEL_COLORS);
  if(id==='nyan'&&px<2&&py>0&&py<4)c=mix(hsv(py*.2-t*.12),c,.45);
  if(id==='batman')c=mix([240,170,0],c,rows[Math.round(py)]?.[Math.floor(px)]==='K'?1:.1);
  if(id==='banana')c=pixelSample(rows,px+Math.sin(py*.8+t*3)*.6,py,PIXEL_COLORS);
  return c;
 }
 if(MEME_TEXT[id]){const text=MEME_TEXT[id],width=text.length*4,at=x*16+fract(t*2.8/(width+16))*(width+16)-16,col=Math.floor(at),row=Math.round(y*5);const bit=n=>{const char=text[Math.floor(n/4)];return FONT3[char]?.[row]?.[((n%4)+4)%4]==='1'?1:0;};const ink=bit(col)*(1-fract(at))+bit(col+1)*fract(at);return hsv(t*.05+x*.5,1,ink);}
 switch(id){
 case 'synthwave':c=y<.5?mix([120,0,160],[255,30,5],wave(r*8-t*.2)):hsv(.82,.95,.1+.9*Math.pow(wave(yy*23-t*2),10));break;
 case 'neonroad':{const edge=Math.abs(dx)-(.03+y*.48);v=Math.exp(-(((edge/.03)**2)))+.35*Math.pow(wave(yy*18-t*3),12);c=mix([240,0,145],[0,130,255],x);break;}
 case 'wiregrid':v=Math.max(Math.pow(wave(xx*30+t),14),Math.pow(wave(yy*22-t),14));c=mix(a,b,y);break;
 case 'blackhole':v=clamp((r-.12)*5)*(.15+.85*Math.pow(wave(r*35+angle*3-t*2),5));c=hsv(.08+r*.8-t*.03);break;
 case 'galaxy':c=hsv(.65+r*.6+Math.sin(angle*2+r*13-t)*.1);v=.08+.92*Math.pow(wave(angle*3+r*20-t),6);break;
 case 'supernova':v=Math.exp(-(((r-(.15+.45*wave(t*.6)))/.075)**2));c=mix([255,30,0],[190,70,255],r*2);break;
 case 'solarflare':c=hsv(.025+.09*wave(angle*4+r*15-t*2));v=.25+.75*wave(angle*7+r*25-t);break;
 case 'nebula':c=hsv(.7+.15*Math.sin(xx*6+t*.3)+.1*Math.cos(yy*8-t*.2));v=.2+.8*wave(xx*9+yy*5+Math.sin(t*.4));break;
 case 'warp':v=Math.pow(wave(angle*16),8)*Math.pow(wave(r*25-t*5),4);c=mix([20,20,255],[100,235,255],r);break;
 case 'thunder':v=Math.exp(-(((x-(.5+.15*Math.sin(y*18+t*2)))/.045)**2));c=[115,80,255];break;
 case 'clouds':v=.25+.75*wave(xx*6+Math.sin(yy*4+t*.3)+t*.3);c=mix([10,40,135],[80,185,255],v);break;
 case 'forest':c=hsv(.27+.09*wave(xx*4+yy*8+t*.3),1,.12+.88*wave(xx*9-yy*2+t*.5));break;
 case 'biolume':v=Math.pow(wave(xx*14+yy*6+Math.sin(t*.5)),5);c=mix([0,255,120],[0,95,255],wave(t*.3+xx));break;
 case 'coral':c=mix([255,20,55],[255,90,0],wave(xx*9+yy*4-t*.5));v=.3+.7*wave(yy*9+Math.sin(xx*6+t));break;
 case 'tropical':c=y<.5?mix([255,120,0],[230,0,150],x):mix([0,255,150],[0,90,255],wave(xx*8-t));break;
 case 'honeycomb':v=Math.pow(wave(xx*27+Math.sin(yy*20))+wave(yy*20),3)/8;c=[255,135,0];break;
 case 'mandala':c=hsv(r*4+angle*.4+t*.08);v=.2+.8*Math.pow(wave(angle*8+Math.sin(r*20-t)),4);break;
 case 'moire':v=wave(xx*25+yy*10+t)*wave(xx*23-yy*11-t*.7);c=mix(a,b,wave(xx*4+t));break;
 case 'kaleido':c=hsv(Math.abs(Math.sin(angle*3))*1.2+r*3-t*.1);break;
 case 'yinyang':c=mix(a,b,.5+.5*Math.tanh(Math.sin(angle-t)*8+Math.sin(r*14)));break;
 case 'helix':{const d=Math.min(Math.abs(y-wave(xx*9-t*2)),Math.abs(y-(1-wave(xx*9-t*2))));v=Math.exp(-(((d/.095)**2)));c=y<.5?a:b;break;}
 case 'circuit':v=Math.pow(wave(Math.floor(y*5)*1.7+xx*12-t*2),8);c=[0,255,145];break;
 case 'glitch':c=hsv(xx*.7+Math.sin(Math.floor(y*5)*3+t*1.4)*.22);v=.35+.65*wave(t+yy*4);break;
 case 'progress':v=1/(1+Math.exp(clamp((x-wave(t*.7))*60,-60,60)));c=hsv(.32-y*.06);break;
 case 'loading':v=Math.pow(wave(angle-t*2),8);c=mix(a,b,r*2);break;
 case 'pong':{const bx=wave(t*1.3),by=wave(t*1.9);v=Math.exp(-((((x-bx)/.045)**2+((y-by)/.1)**2)));if(x<.06&&Math.abs(y-wave(t*1.9+.2))<.22||x>.94&&Math.abs(y-wave(t*1.9-.2))<.22)v=1;c=[10,255,70];break;}
 case 'tetris':{const phase=fract(t*.25),col=Math.floor(t*.25);v=Math.abs(x-(.15+noise(col)*.7))<.1&&Math.abs(y-phase)<.18?1:.025;c=hsv(noise(col+6));break;}
 case 'fireworks':{const ph=fract(t*.3),cx=.2+noise(Math.floor(t*.3))*.6,rr=Math.hypot(x-cx,(y-.4)*.6);v=Math.exp(-(((rr-ph*.7)/.05)**2))*Math.sin(ph*Math.PI);c=hsv(angle/(2*Math.PI)+t*.05);break;}
 case 'bubbles':c=[0,0,0];for(let n=0;n<4;n++){const bx=.15+n*.24,by=fract(t*.13+noise(n)),rr=Math.hypot((x-bx)*.8,(y-by)*.5);c=c.map((v,j)=>v+hsv(n*.22+t*.03)[j]*Math.exp(-(((rr-.1)/.02)**2)));}break;
 case 'waterfall':v=.1+.9*Math.pow(wave(yy*13-t*3+noise(Math.round(x*15))*6),6);c=mix([0,85,255],[0,255,210],x);break;
 case 'spectrumtest':c=x<1/3?[255,0,0]:x<2/3?[0,255,0]:[0,0,255];break;
 case 'heatmap':c=hsv(.65*wave(xx*5+yy*3+Math.sin(t*.6)));break;
 case 'raindrops':{c=[0,0,0];for(let n=0;n<3;n++){const rr=Math.hypot(x-noise(n+4),(y-noise(n+10))*.6),ph=fract(t*.3+n/3);const power=Math.exp(-(((rr-ph*.8)/.035)**2))*Math.sin(ph*Math.PI);c=c.map((v,j)=>v+[0,115,255][j]*power);}break;}
 }
 return c?.map(n=>clamp(n*v,0,255))??null;
}
