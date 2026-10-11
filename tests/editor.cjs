require('./language.cjs');
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=require('path').join(__dirname,'../src/');
const els=new Map(),saved=new Map();
const values={speed:'100',brightness:'100',saturation:'150',scale:'100',color:'#a68bff',color2:'#38d9ff',fps:'20',search:''};
function element(id){return {value:values[id]||'',checked:false,textContent:'',children:[],disabled:false,className:'',classList:{toggle(){}},append(...c){this.children.push(...c)},replaceChildren(){this.children=[]},setAttribute(){},handlers:{},addEventListener(n,f){this.handlers[n]=f;},getBoundingClientRect(){return{left:0,top:0,width:690,height:280};},setPointerCapture(){},getContext(){return new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});}};}
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
 const value=x=>JSON.parse(vm.runInContext('JSON.stringify('+x+')',sandbox));
 assert.equal(+els.get('brightness').value,100);
 els.get('studioBrush').value='#ff0000';els.get('studioFill').onclick();assert.deepEqual(value('studioProject.frames[0].colors[1]'),[255,0,0]);
 els.get('studioAdd').onclick();assert.equal(value('studioProject.frames.length'),2);els.get('studioClear').onclick();assert.deepEqual(value('studioProject.frames[1].colors[1]'),[0,0,0]);
 els.get('studioBack').onclick();assert.deepEqual(value('studioProject.frames[1].colors[1]'),[255,0,0]);
 els.get('studioBrush').value='#00ff00';els.get('studioCanvas').handlers.pointerdown({button:0,pointerId:1,clientX:30,clientY:45});els.get('studioCanvas').handlers.pointerup();assert.deepEqual(value('studioProject.frames[1].colors[1]'),[0,255,0]);
 els.get('studioDuration').value='100';els.get('studioDuration').onchange();assert.equal(value('studioProject.frames[1].duration'),100);
 els.get('studioDuration').value='-1';els.get('studioDuration').onchange();assert.equal(value('studioProject.frames[1].duration'),100);
 const savedProject=JSON.parse(saved.get('hero84-studio-v1'));assert.equal(savedProject.frames.length,2);
 sandbox.sample=savedProject;assert.equal(vm.runInContext('studioValidate(sample).frames.length',sandbox),2);
 for(const bad of [{...savedProject,version:2},{...savedProject,frames:[]},{...savedProject,frames:[{duration:50,colors:{}}]}]){sandbox.sample=bad;assert.throws(()=>vm.runInContext('studioValidate(sample)',sandbox));}
 vm.runInContext("choose('rainbow')",sandbox);els.get('studioCapture').onclick();assert.equal(value('studioProject.frames.length'),24);
 els.get('studioPlay').onclick();assert.equal(vm.runInContext('selected',sandbox),'userstudio');
 vm.runInContext("for(let t=-1;t<5;t+=.05)for(const k of KEYS){const c=userStudioColor(k,t);if(c.some(v=>!Number.isFinite(v)||v<0||v>255))throw Error('invalid studio playback');}",sandbox);
 const html=fs.readFileSync(root+'index.html','utf8');assert(!/id="(?:astolfo|silk|miku|spider|bunny)Preset"/.test(html));assert(html.includes('value="100"'));
 console.log('PASS: full brightness, painting, fill, copy, clear, undo, duration validation, local save, import validation, effect capture, playback, normal scene cards');
})().catch(e=>{console.error(e);process.exitCode=1});
