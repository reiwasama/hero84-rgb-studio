'use strict';
// A small original platform level, rendered on the keyboard's six physical rows.
const MARIO_LEVEL={length:78,gaps:[[17,19],[34,36],[58,60]],platforms:[{x:9,y:3,w:3},{x:26,y:3,w:3},{x:46,y:3,w:4},{x:65,y:3,w:3}],pipes:[{x:22,y:4,w:2},{x:41,y:4,w:2},{x:54,y:4,w:2}],coins:[{x:10,y:2},{x:11,y:2},{x:12,y:2},{x:18,y:3},{x:27,y:2},{x:28,y:2},{x:35,y:3},{x:47,y:2},{x:49,y:2},{x:59,y:3},{x:66,y:2},{x:67,y:2}]};
function newMario(){return{x:2,feet:5,vy:0,ground:true,camera:0,coins:new Set(),lives:3,score:0,state:'play',auto:true,paused:false,t:0,respawn:0,invincible:0,jump:false,input:{left:false,right:false},enemies:[{x:14,base:14,alive:true},{x:31,base:31,alive:true},{x:51,base:51,alive:true},{x:70,base:70,alive:true}]};}
let mario=newMario(),marioLast=performance.now();
function marioReset(auto=mario.auto){mario=newMario();mario.auto=auto;marioLast=performance.now();}
function marioGap(x){return MARIO_LEVEL.gaps.some(([a,b])=>x>=a&&x<b);}
function marioSolid(x,y){if(y>=5&&y<6&&!marioGap(x))return true;return [...MARIO_LEVEL.platforms,...MARIO_LEVEL.pipes].some(p=>x>=p.x&&x<p.x+p.w&&y>=p.y&&y<p.y+(MARIO_LEVEL.pipes.includes(p)?5-p.y:1));}
function marioDie(){mario.lives--;if(mario.lives<=0){mario.state='over';mario.respawn=0;return;}mario.x=2;mario.feet=5;mario.vy=0;mario.ground=true;mario.invincible=1.5;mario.input.left=false;mario.input.right=false;}
function marioStep(dt){
 if(mario.paused)return;
 mario.t+=dt;mario.invincible=Math.max(0,mario.invincible-dt);
 if(mario.state!=='play'){mario.respawn+=dt;if(mario.auto&&mario.respawn>3)marioReset(true);return;}
 for(const e of mario.enemies)if(e.alive)e.x=e.base+Math.sin(mario.t*1.1+e.base)*.6;
 let direction=mario.auto?1:(+mario.input.right-+mario.input.left);
 if(mario.auto&&mario.ground){const ahead=mario.x+1.6;const obstacle=marioSolid(ahead,mario.feet-.6)||marioSolid(ahead,mario.feet-1.3);const gap=marioGap(ahead)&&mario.feet>4.9;const enemy=mario.enemies.some(e=>e.alive&&e.x>mario.x&&e.x-mario.x<1.8);if(obstacle||gap||enemy)mario.jump=true;}
 if(mario.jump&&mario.ground){mario.vy=-8.7;mario.ground=false;}mario.jump=false;
 const oldFeet=mario.feet,nextX=Math.max(.5,Math.min(MARIO_LEVEL.length-1,mario.x+direction*4*dt));
 const edge=nextX+direction*.35;
 if(direction===0||(!marioSolid(edge,mario.feet-.12)&&!marioSolid(edge,mario.feet-1.3)))mario.x=nextX;
 mario.vy+=18*dt;mario.feet+=mario.vy*dt;mario.ground=false;
 if(mario.vy>=0){
  const surfaces=[5,...MARIO_LEVEL.platforms.map(p=>p.y),...MARIO_LEVEL.pipes.map(p=>p.y)].sort((a,b)=>a-b);
  for(const y of surfaces)if(oldFeet<=y+.02&&mario.feet>=y&&(marioSolid(mario.x-.25,y+.01)||marioSolid(mario.x+.25,y+.01))){mario.feet=y;mario.vy=0;mario.ground=true;break;}
 }else if(marioSolid(mario.x,mario.feet-1.5)){mario.feet=Math.floor(mario.feet-1.5)+1+1.5;mario.vy=0;}
 for(let i=0;i<MARIO_LEVEL.coins.length;i++){const coin=MARIO_LEVEL.coins[i];if(!mario.coins.has(i)&&Math.abs(coin.x+.5-mario.x)<.85&&coin.y+.5>mario.feet-1.8&&coin.y+.5<mario.feet+.25){mario.coins.add(i);mario.score+=100;}}
 for(const e of mario.enemies)if(e.alive&&Math.abs(e.x-mario.x)<.65&&mario.feet>4.05&&mario.feet-1.5<5){if(mario.vy>0&&oldFeet<=4.35){e.alive=false;mario.vy=-6.2;mario.score+=200;}else if(mario.invincible<=0){marioDie();break;}}
 if(mario.feet>8)marioDie();
 if(mario.x>=MARIO_LEVEL.length-3){mario.state='win';mario.score+=500;}
 mario.camera=Math.max(0,Math.min(MARIO_LEVEL.length-16,mario.x-4.5));
}
function marioTick(now){const elapsed=Math.min(.1,Math.max(0,(now-marioLast)/1000));marioLast=now;let remaining=elapsed;while(remaining>0){const step=Math.min(1/120,remaining);marioStep(step);remaining-=step;}}
function marioColor(key,opt){
 const local=(key.x+key.w/2-20)/40,x=mario.camera+local,row=Math.max(0,Math.min(5,Math.round((key.y-37)/38))),tile=Math.floor(x);
 let c=[2,8,22];
 if(row===0&&Math.sin(tile*.8)>.7)c=[14,28,40];
 if(row===5&&!marioGap(x))c=[70,30,5];
 if(row===4&&!marioGap(x))c=[4,17,5];
 if(MARIO_LEVEL.platforms.some(p=>x>=p.x&&x<p.x+p.w&&row===p.y))c=[185,66,8];
 if(MARIO_LEVEL.pipes.some(p=>x>=p.x&&x<p.x+p.w&&row>=p.y&&row<5))c=[10,170,30];
 for(let i=0;i<MARIO_LEVEL.coins.length;i++){const coin=MARIO_LEVEL.coins[i];if(!mario.coins.has(i)&&tile===coin.x&&row===coin.y)c=[255,170+Math.round(40*Math.sin(mario.t*4)),6];}
 for(const e of mario.enemies)if(e.alive&&Math.abs(x-e.x)<.65&&row===4)c=[160,45,10];
 if(Math.abs(x-(MARIO_LEVEL.length-3))<.55&&row>=1&&row<=4)c=[130,150,165];
 if(x>=MARIO_LEVEL.length-3&&x<MARIO_LEVEL.length-1&&row===1)c=[25,255,75];
 // Use each key's physical span so the character remains visible on wide keys.
 const left=mario.camera+(key.x-20)/40,right=left+key.w/40;
 if(mario.x+.25>=left&&mario.x-.25<=right){
  if(row===Math.floor(mario.feet-1.35))c=[255,20,12];
  if(row===Math.floor(mario.feet-.35))c=[15,65,255];
 }
 if(mario.state==='win'&&row===0)c=[15,200,65];
 if(mario.state==='over'&&row===0)c=[160,12,20];
 return c.map(v=>Math.round(v*opt.brightness));
}
