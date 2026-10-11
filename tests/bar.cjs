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
 let raw=[2,7,100,90,80,80,3],initial=[...raw],sent=[];
 mock.sendReport=async(id,p)=>{sent.push([...p]);assert.equal(p[1],6);assert([132,4].includes(p[0]));if(p[0]===4)raw=[...p.slice(6,13)];const r=new Uint8Array(p);r[5]=7;r.set(raw,6);setTimeout(()=>[...listeners].forEach(fn=>fn({reportId:9,data:new DataView(r.buffer)})),0);};
 vm.runInContext('device=mock;controls()',sandbox);
 await els.get('barRead').onclick();assert(!els.get('barApply').disabled);
 els.get('barColor').value='#ff0000';els.get('barMode').value='3';els.get('barSpeed').value='4';els.get('barLevel').value='2';await els.get('barApply').onclick();assert.deepEqual(raw,[3,0,255,0,0,2,4]);assert(JSON.parse(saved.get('hero84-bar-v1')).pending);
 for(const modeId of [0,1,2,3,4,5]){els.get('barMode').value=String(modeId);await els.get('barApply').onclick();assert.equal(raw[0],modeId);}
 await els.get('barRestore').onclick();assert.deepEqual(raw,initial);assert(!JSON.parse(saved.get('hero84-bar-v1')).pending);
 const count=sent.length;vm.runInContext('running=true',sandbox);await els.get('barApply').onclick();assert.equal(sent.length,count);vm.runInContext('running=false',sandbox);
 mock.sendReport=async(id,p)=>{const r=new Uint8Array(p);r[5]=0;setTimeout(()=>[...listeners].forEach(fn=>fn({reportId:9,data:new DataView(r.buffer)})),0);};await els.get('barRead').onclick();assert(els.get('barApply').disabled);
 vm.runInContext("for(const k of KEYS.filter(k=>SPIDER_LENSES.has(k.id))){const c=spiderMaskColor(k,2);if(c[0]!==c[1]||c[1]!==c[2])throw Error('Eyes not white');}",sandbox);
 console.log('PASS: bar read, backup before write, six explicit modes, speed/brightness levels, readback, exact restore, streaming interlock, short-response rejection, neutral white eyes');
})().catch(e=>{console.error(e);process.exitCode=1});
