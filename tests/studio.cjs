const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=require('path').join(__dirname,'../src/');
const els=new Map(),saved=new Map();
const values={speed:'100',brightness:'100',saturation:'150',scale:'100',color:'#a68bff',color2:'#38d9ff',fps:'20',search:''};
function element(id){return {value:values[id]||'',checked:false,textContent:'',children:[],disabled:false,className:'',classList:{toggle(){}},append(...c){this.children.push(...c)},replaceChildren(){this.children=[]},setAttribute(){},addEventListener(){},getContext(){return new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});}};}
const writes=[],listeners=new Set(),original=Object.fromEntries(Array.from({length:104},(_,i)=>[i,[i%256,60,90]]));let mode=[3,7,40,70,100,10,2];
const mock={opened:true,collections:[{outputReports:[{reportId:9}]}],open:async()=>{mock.opened=true},close:async()=>{mock.opened=false},addEventListener:(t,fn)=>listeners.add(fn),removeEventListener:(t,fn)=>listeners.delete(fn),async sendReport(id,p){
 assert.equal(id,9);assert.equal(p.length,63);assert.equal((9+[...p].reduce((a,b)=>a+b,0))%256,255);writes.push([...p]);
 const response=new Uint8Array(63);response.set(p);
 if(p[0]===130&&p[1]===1){let n=18691697672197;const a=Array(6).fill(0);for(let i=5;i>=0;i--){a[i]=n%256;n=Math.floor(n/256)}response.set(a,6);}
 else if(p[0]===130&&p[1]===9)response[23]=1;
 else if(p[0]===132)response.set(mode,6);
 else if(p[0]===134){response.fill(0,6);for(let o=0;o<p[5];o+=2){const id=p[6+o]*256+p[7+o];response.set([id>>8,id&255,...original[id]],6+o/2*5);}}
 else if(p[0]===4)mode=[...p.slice(6,13)];
 else if(p[0]===6){for(let o=6;o<6+p[5];o+=5)original[p[o]*256+p[o+1]]=[...p.slice(o+2,o+5)];}
 else if(p[0]===8){assert.equal(p[1],1);return;}
 else throw Error('Unexpected command '+p[0]);
 setTimeout(()=>[...listeners].forEach(fn=>fn({reportId:9,data:new DataView(response.buffer)})),0);
}};
const sandbox={console,Uint8Array,Date,Math,performance,setTimeout,clearTimeout,requestAnimationFrame(){},prompt:()=>null,navigator:{hid:{requestDevice:async()=>[mock],addEventListener(){}}},window:{addEventListener(){}},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},document:{addEventListener(){},getElementById(id){if(!els.has(id))els.set(id,element(id));return els.get(id)},createElement:()=>element('')},mock};
vm.createContext(sandbox);for(const f of ['i18n.js','keys.js','game.js','extras.js','effects.js','studio.js','app.js'])vm.runInContext(fs.readFileSync(root+f,'utf8'),sandbox,{filename:f});
(async()=>{
 assert.equal(+els.get('speed').value,100);assert.equal(+els.get('brightness').value,100);assert.equal(+els.get('saturation').value,150);assert.equal(sandbox.document.getElementById('fps').value,'20');assert.equal(writes.length,0);

 const out=vm.runInContext(`(()=>{let samples=0; if(EFFECTS.length!==104||KEYS.length!==84)throw Error('Counts');if(new Set(KEYS.map(k=>k.id)).size!==84)throw Error('Duplicate keys');for(const e of EFFECTS)for(const t of [0,.5,3,10,250])for(const reverse of [false,true])for(const scale of [.3,1,2.5])for(let i=0;i<KEYS.length;i++){const c=colorAt(e.id,KEYS[i],i,t,{speed:3,brightness:1,scale,color:'#a68bff',color2:'#38d9ff',reverse});if(c.length!==3||c.some(v=>!Number.isInteger(v)||v<0||v>255))throw Error(e.id+' invalid RGB');samples++;}return samples;})()`,sandbox);
 await els.get('connect').onclick();assert(mock.opened);assert(!els.get('start').disabled);
 const before=JSON.stringify(original),beforeMode=[...mode];await els.get('start').onclick();await new Promise(r=>setTimeout(r,35));assert(writes.some(p=>p[0]===8));assert(!writes.some(p=>p[0]===6||p[0]===4));await els.get('stop').onclick();assert.equal(JSON.stringify(original),before);assert.deepEqual(mode,beforeMode);assert.equal(JSON.parse(saved.get('hero84-original-v1')).pending,false);assert(!els.get('start').disabled);
 assert(writes.some(p=>p[0]===6&&p[3]===8&&p[4]===7&&p[5]===35));
 // Failed responses must release listeners and reject rather than hanging.
 sandbox.silent={opened:true,addEventListener:(t,fn)=>listeners.add(fn),removeEventListener:(t,fn)=>listeners.delete(fn),sendReport:async()=>{}};
 vm.runInContext('device=silent',sandbox);await assert.rejects(vm.runInContext('query([130,1,0,1,0,6],5)',sandbox));assert.equal(listeners.size,0);
 // Streaming must complete even when the mock emits no input reports.
 await vm.runInContext('sendLiveColors(Object.fromEntries(KEYS.map(k=>[k.id,[10,20,30]])))',sandbox);
 function decode(packets){const bytes=[];packets.forEach((p,i)=>{assert.equal(p.length,63);assert.equal(p[0],8);assert.equal(p[1],1);assert.equal(p[3],packets.length);assert.equal(p[4],i);assert(p[5]<=56);assert.equal((9+p.reduce((a,b)=>a+b,0))%256,255);bytes.push(...p.slice(6,6+p[5]));});const colors={};for(let i=0;i<bytes.length;){const rgb=bytes.slice(i,i+3),count=bytes[i+3];assert(count>0&&i+4+count<=bytes.length);for(const id of bytes.slice(i+4,i+4+count))colors[id]=rgb;i+=4+count;}return colors;}
 let captureFrames=0;
 let checkedFrames=0,maxError=0;const ids=vm.runInContext('EFFECTS.map(e=>e.id)',sandbox);for(const id of ids)for(let frame=0;frame<20;frame++){sandbox.checkEffect=id;sandbox.checkTime=frame*.37;const input=vm.runInContext("Object.fromEntries(KEYS.map((k,i)=>[k.id,colorAt(checkEffect,k,i,checkTime,{speed:1,brightness:.45,saturation:1.5,scale:1,color:'#a68bff',color2:'#38d9ff',reverse:false})]))",sandbox);sandbox.checkColors=input;const packets=vm.runInContext('livePackets(checkColors)',sandbox),output=decode(Array.from(packets,p=>Array.from(p)));assert(packets.length<=3);assert.equal(Object.keys(output).length,84);for(const [key,rgb] of Object.entries(input))for(let j=0;j<3;j++)maxError=Math.max(maxError,Math.abs(output[key][j]-rgb[j]));if(Object.values(input).some(c=>c.some(v=>v>=10)))assert(Object.values(output).some(c=>c.some(v=>v>0)),'unintended black frame '+id);checkedFrames++;}
 const single=vm.runInContext('livePackets(Object.fromEntries(KEYS.map(k=>[k.id,[10,20,30]])))',sandbox);assert.equal(single.length,2);assert.equal(Object.keys(decode(Array.from(single,p=>Array.from(p)))).length,84);
 vm.runInContext(`(()=>{
 const black=Object.fromEntries(KEYS.map(k=>[k.id,[0,0,0]])),white=Object.fromEntries(KEYS.map(k=>[k.id,[255,255,255]]));
 const eased=smoothFrame(white,black,1/30);if(eased[1][0]<=0||eased[1][0]>=150)throw Error('Smoothing absent');
 let jump=0;const opt={speed:1,brightness:1,scale:1,color:'#a68bff',color2:'#38d9ff',reverse:false};
 for(let t=0;t<10;t+=.03)for(let i=0;i<KEYS.length;i++){const a=colorAt('rainsoft',KEYS[i],i,t,opt),b=colorAt('rainsoft',KEYS[i],i,t+.001,opt);jump=Math.max(jump,...a.map((v,j)=>Math.abs(v-b[j])));}
 if(jump>5)throw Error('Rain has a discontinuity: '+jump);
 if(new Set(EFFECTS.map(e=>e.id)).size!==104)throw Error('Duplicate effect IDs');
 for(const s of [0,1,1.5,2.5])for(const c of [[0,0,0],[255,255,255],[30,90,120],[255,0,0]]){const out=gradeColor(c,s);if(out.some(v=>!Number.isInteger(v)||v<0||v>255)||Math.max(...out)!==Math.max(...c))throw Error('Saturation range/brightness');if(c.every(v=>v===c[0])&&out.some((v,i)=>v!==c[i]))throw Error('Neutral color changed');}
 profiles=[{name:'legacy',effect:'rainsoft',options:{speed:1,brightness:.45,scale:1,color:'#ff0000',color2:'#0000ff',reverse:false}},{name:'vivid',effect:'rainsoft',options:{speed:1,brightness:.45,scale:1,saturation:2,color:'#ff0000',color2:'#0000ff',reverse:false}}];renderProfiles();$('profiles').children[0].onclick();if(+$('saturation').value!==150)throw Error('Legacy saturation fallback');$('profiles').children[1].onclick();if(+$('saturation').value!==200)throw Error('Profile saturation lost');
 const prior=animationTime;$('speed').value='300';clock(clockPrevious);if(animationTime!==prior)throw Error('Speed changed phase without elapsed time');
 })()`,sandbox);
 console.log(JSON.stringify({rgbSamples:out,effects:104,keys:84,captureFrames,checkedFrames,maxChannelErrorAt45Percent:maxError,passed:['all 104 effects fit 3 packets','84 keys included in every frame','no unintended full-black frames','no configuration writes during animation','same-color compression across packet boundaries','backup and restore colors + mode','timeout cleanup','checksum on every report','stream without ACK waits','transition smoothing','rain continuity','speed change continuity'],mockedUSB:true},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});