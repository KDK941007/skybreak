const GAME=document.getElementById('game');
const STAGE_WORLD=document.getElementById('stageWorld');
const PLAYER=document.getElementById('player'), ENEMY=document.getElementById('enemy');
const PLAYER_IMG=document.getElementById('playerImg'), ENEMY_IMG=document.getElementById('enemyImg');
const PLAYER_SHADOW=document.getElementById('playerShadow'), ENEMY_SHADOW=document.getElementById('enemyShadow');
const GUARD_BUBBLE=document.getElementById('guardBubble'), GUARD_BTN=document.getElementById('guardBtn');
const VFX_BACK=document.getElementById('vfxBackLayer'), VFX_FRONT=document.getElementById('vfxFrontLayer'), PROJECTILES=document.getElementById('projectileLayer');
const playerHp=document.getElementById('playerHp'), enemyHp=document.getElementById('enemyHp');
const path=n=>'./assets/'+n;
const sprites={
  p:{
    idle:['rex_idle0.png','rex_idle1.png'],
    run:['rex_run0.png','rex_run1.png'],
    jump:'rex_jump.png',
    fall:'rex_fall.png',
    attack:['rex_idle1.png','rex_run0.png','rex_run1.png','rex_idle0.png']
  },
  e:{idle:['aion_idle0.png'],hit:'aion_hit.png'}
};
const fx={slash:'fx_blue_slash.png',shot:'fx_blast_fire.png',hit:'fx_hit_orange.png'};
const input={x:0,y:0,left:false,right:false,down:false};
const FIXED=1/120, WORLD_SCREENS=4, GROUND=.655, FOOT_SINK=5;
let last=performance.now(),acc=0,projectiles=[],cameraX=0;
const state={
  p:{x:.48,y:GROUND,prevX:.48,prevY:GROUND,vx:0,vy:0,on:true,jumps:2,attack:0,special:0,face:1,guard:false,crouch:false},
  e:{x:1.05,y:GROUND,hp:100,hit:0},
  php:100
};

function rect(){const r=GAME.getBoundingClientRect();return{w:r.width,h:r.height}}
function setSrc(img,src){if(img.dataset.src!==src){img.src=path(src);img.dataset.src=src}}
function screenPos(wx,ny){const r=rect();return{x:wx*r.w-cameraX,y:ny*r.h}}
function safeFx(wx,ny,size){const r=rect(),p=screenPos(wx,ny),half=size*.52,margin=10;return{x:Math.max(half+margin,Math.min(r.w-half-margin,p.x)),y:Math.max(half+margin,Math.min(r.h-half-margin,p.y))}}
function spawnFx(layer,src,wx,ny,size,rot=0,special=false){const r=rect();const max=Math.min(r.w,r.h);const s=Math.min(size,max*.34);const p=safeFx(wx,ny,s);const d=document.createElement('div');d.className='fx'+(special?' specialFx':'');d.style.left=p.x+'px';d.style.top=p.y+'px';d.style.width=s+'px';d.style.height=s+'px';d.style.setProperty('--rot',rot+'deg');const im=document.createElement('img');im.src=path(src);d.appendChild(im);layer.appendChild(d);setTimeout(()=>d.remove(),special?440:320)}
function ring(wx,ny,size,color){const p=safeFx(wx,ny,size),d=document.createElement('div');d.className='ring';d.style.left=p.x+'px';d.style.top=p.y+'px';d.style.width=size+'px';d.style.height=size+'px';d.style.borderColor=color;d.style.boxShadow=`0 0 18px ${color}`;VFX_FRONT.appendChild(d);setTimeout(()=>d.remove(),270)}
function pop(wx,ny,val){const p=screenPos(wx,ny),d=document.createElement('div');d.className='damagePop';d.style.left=p.x+'px';d.style.top=p.y+'px';d.textContent='+'+val;VFX_FRONT.appendChild(d);setTimeout(()=>d.remove(),540)}
function landingFx(wx){const p=screenPos(wx,GROUND),d=document.createElement('div');d.className='landingDust';d.style.left=p.x+'px';d.style.top=(p.y+3)+'px';VFX_FRONT.appendChild(d);setTimeout(()=>d.remove(),300)}
function hitEnemy(amount,blue=false){if(state.e.hit>0)return;state.e.hp=Math.max(0,state.e.hp-amount);state.e.hit=.22;enemyHp.style.width=state.e.hp+'%';spawnFx(VFX_FRONT,fx.hit,state.e.x,state.e.y-.16,blue?118:104,0,blue);ring(state.e.x,state.e.y-.16,blue?76:64,blue?'rgba(113,220,255,.9)':'rgba(255,218,112,.9)');pop(state.e.x,state.e.y-.22,amount)}

function setGuard(on){
  const p=state.p;
  p.guard=!!on&&p.on&&p.attack<=0&&p.special<=0&&!p.crouch;
  GUARD_BTN.classList.toggle('active',p.guard);
}
function attack(){
  const p=state.p;
  if(p.attack>0||p.special>0||p.guard||p.crouch)return;
  p.attack=.42;
  const wx=p.x+p.face*.105;
  ring(wx-p.face*.018,p.y-.16,58,'rgba(255,180,85,.72)');
  setTimeout(()=>spawnFx(VFX_BACK,fx.slash,p.x+p.face*.12,p.y-.17,132,p.face<0?180:0,false),65);
  setTimeout(()=>{if(Math.abs(state.e.x-p.x)<.25)hitEnemy(9,false)},95);
}
function special(){
  const p=state.p;
  if(p.attack>0||p.special>0||p.guard||p.crouch)return;
  p.special=.44;
  ring(p.x+p.face*.025,p.y-.16,70,'rgba(255,180,85,.82)');
  setTimeout(()=>{projectiles.push({x:p.x+p.face*.11,y:p.y-.17,vx:p.face*.66,el:null})},85);
}
function jump(){
  const p=state.p;
  if(p.guard)p.guard=false;
  p.crouch=false;
  GUARD_BTN.classList.remove('active');
  if(p.on){p.vy=-1.48;p.on=false;p.jumps=1;return}
  if(p.jumps>0){p.vy=-1.28;p.jumps--}
}
function fixedUpdate(dt){
  const p=state.p;
  p.prevX=p.x;p.prevY=p.y;
  const stickDown=input.y>.48||input.down;
  const rawMove=Math.abs(input.x)>.07?input.x:((input.right?1:0)-(input.left?1:0));
  p.crouch=p.on&&stickDown&&Math.abs(rawMove)<.72&&!p.guard&&p.attack<=0&&p.special<=0;
  let m=p.crouch?0:rawMove;
  if(p.guard&&Math.abs(m)>.24)setGuard(false);
  if(p.guard)m=0;

  if(Math.abs(m)>.07){
    p.face=m>0?1:-1;
    p.vx+=m*1.72*dt;
    p.vx=Math.max(-.61,Math.min(.61,p.vx));
  }else p.vx*=Math.pow(.0008,dt);

  p.vy+=2.55*dt;
  p.x+=p.vx*dt;
  p.y+=p.vy*dt;
  const landed=!p.on&&p.y>=GROUND;
  if(p.y>=GROUND){p.y=GROUND;p.vy=0;p.on=true;p.jumps=2}else p.on=false;
  if(landed)landingFx(p.x);

  p.x=Math.max(.15,Math.min(WORLD_SCREENS-.15,p.x));
  if(p.attack>0)p.attack=Math.max(0,p.attack-dt);
  if(p.special>0)p.special=Math.max(0,p.special-dt);
  if(state.e.hit>0)state.e.hit=Math.max(0,state.e.hit-dt);
  updateProjectiles(dt);

  const r=rect();
  const target=Math.max(0,Math.min((WORLD_SCREENS-1)*r.w,p.x*r.w-r.w*.45));
  cameraX+=(target-cameraX)*(1-Math.exp(-8*dt));
}
function updateProjectiles(dt){
  for(let i=projectiles.length-1;i>=0;i--){
    const q=projectiles[i];
    q.x+=q.vx*dt;
    const p=screenPos(q.x,q.y);
    if(!q.el){
      q.el=document.createElement('div');q.el.className='projectile';
      const im=document.createElement('img');im.src=path(fx.shot);q.el.appendChild(im);PROJECTILES.appendChild(q.el);
    }
    q.el.style.transform=`translate3d(${p.x}px,${p.y}px,0) translate(-50%,-50%)`;
    if((performance.now()/42|0)%2===0){
      const t=document.createElement('div');t.className='trail';t.style.left=p.x+'px';t.style.top=p.y+'px';t.style.width='12px';t.style.height='12px';t.style.background='radial-gradient(circle,#ffd66a,#ff6b43 65%,transparent 72%)';PROJECTILES.appendChild(t);setTimeout(()=>t.remove(),220);
    }
    if(Math.abs(q.x-state.e.x)<.065){hitEnemy(13,true);spawnFx(VFX_FRONT,fx.shot,q.x,q.y,108,0,true);q.el.remove();projectiles.splice(i,1);continue}
    if(q.x<-.1||q.x>WORLD_SCREENS+.1){q.el.remove();projectiles.splice(i,1)}
  }
}
function frame(){
  const p=state.p;
  if(p.attack>0){
    const progress=1-p.attack/.42;
    if(progress<.20)return sprites.p.attack[0];
    if(progress<.48)return sprites.p.attack[1];
    if(progress<.76)return sprites.p.attack[2];
    return sprites.p.attack[3];
  }
  if(!p.on)return p.vy<0?sprites.p.jump:sprites.p.fall;
  if(p.crouch)return sprites.p.idle[1];
  if(Math.abs(p.vx)>.06)return(performance.now()/78|0)%2?sprites.p.run[0]:sprites.p.run[1];
  return(performance.now()/210|0)%2?sprites.p.idle[0]:sprites.p.idle[1];
}
function renderShadow(el,wx,airY,crouch=false){
  const p=screenPos(wx,GROUND);
  const height=Math.max(0,GROUND-airY);
  const shrink=Math.max(.46,1-height*2.2);
  const wide=crouch?1.18:1;
  el.style.left=p.x+'px';
  el.style.top=(p.y+5)+'px';
  el.style.opacity=String(Math.max(.18,.62-height*1.55));
  el.style.transform=`translate(-50%,-50%) scale(${shrink*wide},${shrink})`;
}
function render(alpha){
  const r=rect(),p=state.p,e=state.e;
  setSrc(PLAYER_IMG,frame());
  setSrc(ENEMY_IMG,state.e.hit>0?sprites.e.hit:sprites.e.idle[0]);
  STAGE_WORLD.style.transform=`translate3d(${-cameraX}px,0,0)`;

  const pw=PLAYER.offsetWidth,ph=PLAYER.offsetHeight,ew=ENEMY.offsetWidth,eh=ENEMY.offsetHeight;
  const rx=p.prevX+(p.x-p.prevX)*alpha,ry=p.prevY+(p.y-p.prevY)*alpha;
  const px=rx*r.w-cameraX-pw*.5,py=ry*r.h-ph+FOOT_SINK;
  const ex=e.x*r.w-cameraX-ew*.5,ey=e.y*r.h-eh+FOOT_SINK;

  const speed=Math.min(1,Math.abs(p.vx)/.61);
  const bob=p.on&&!p.crouch&&speed>.08?Math.sin(performance.now()/72)*speed*1.6:0;
  const lean=p.face*Math.min(4,Math.abs(p.vx)*7);
  const attackProgress=p.attack>0?1-p.attack/.42:0;
  const strike=Math.sin(Math.min(1,attackProgress)*Math.PI);
  const lunge=p.attack>0?strike*34*p.face:0;
  const attackTilt=p.attack>0?strike*11*p.face:0;
  const specialBrace=p.special>0?Math.sin((1-p.special/.44)*Math.PI)*7*p.face:0;
  const crouchScale=p.crouch?.70:1;
  const crouchShift=p.crouch?2:0;

  PLAYER.style.transform=`translate3d(${px+lunge+specialBrace}px,${py+bob+crouchShift}px,0) scaleX(${p.face}) scaleY(${crouchScale}) rotate(${lean+attackTilt}deg)`;
  ENEMY.style.transform=`translate3d(${ex}px,${ey}px,0)`;
  ENEMY.classList.toggle('hitFlash',e.hit>0);

  renderShadow(PLAYER_SHADOW,rx,ry,p.crouch);
  renderShadow(ENEMY_SHADOW,e.x,e.y,false);

  if(p.guard){
    const gp=screenPos(rx,ry-.18);
    GUARD_BUBBLE.style.display='block';
    GUARD_BUBBLE.style.left=gp.x+'px';
    GUARD_BUBBLE.style.top=gp.y+'px';
  }else GUARD_BUBBLE.style.display='none';
}
function loop(t){
  let frameDt=Math.min(.05,(t-last)/1000||.016);
  last=t;acc+=frameDt;
  let guard=0;
  while(acc>=FIXED&&guard<8){fixedUpdate(FIXED);acc-=FIXED;guard++}
  render(Math.min(1,acc/FIXED));
  requestAnimationFrame(loop);
}

const sb=document.getElementById('stickBase'),sk=document.getElementById('stickKnob');
let active=false,rad=1;
function refresh(){rad=sb.getBoundingClientRect().width*.28}
function moveStick(e){
  const r=sb.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  let dx=e.clientX-cx,dy=e.clientY-cy,d=Math.hypot(dx,dy)||1;
  if(d>rad){dx=dx/d*rad;dy=dy/d*rad}
  sk.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
  input.x=Math.abs(dx/rad)<.06?0:Math.max(-1,Math.min(1,dx/rad));
  input.y=Math.abs(dy/rad)<.06?0:Math.max(-1,Math.min(1,dy/rad));
}
function reset(){active=false;input.x=0;input.y=0;sk.style.transform='translate(-50%,-50%)'}
refresh();
addEventListener('resize',refresh);
sb.onpointerdown=e=>{active=true;sb.setPointerCapture(e.pointerId);moveStick(e)};
sb.onpointermove=e=>{if(active)moveStick(e)};
sb.onpointerup=reset;sb.onpointercancel=reset;sb.onlostpointercapture=reset;

document.getElementById('jumpBtn').onpointerdown=e=>{e.preventDefault();jump()};
document.getElementById('attackBtn').onpointerdown=e=>{e.preventDefault();attack()};
document.getElementById('specialBtn').onpointerdown=e=>{e.preventDefault();special()};
GUARD_BTN.onpointerdown=e=>{e.preventDefault();GUARD_BTN.setPointerCapture(e.pointerId);setGuard(true)};
GUARD_BTN.onpointerup=()=>setGuard(false);
GUARD_BTN.onpointercancel=()=>setGuard(false);
GUARD_BTN.onlostpointercapture=()=>setGuard(false);

addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(k==='a'||k==='arrowleft')input.left=true;
  if(k==='d'||k==='arrowright')input.right=true;
  if(k==='s'||k==='arrowdown')input.down=true;
  if(k==='w'||k==='arrowup'||k===' ')jump();
  if(k==='j'||k==='z')attack();
  if(k==='k'||k==='x')special();
  if(k==='shift')setGuard(true);
});
addEventListener('keyup',e=>{
  const k=e.key.toLowerCase();
  if(k==='a'||k==='arrowleft')input.left=false;
  if(k==='d'||k==='arrowright')input.right=false;
  if(k==='s'||k==='arrowdown')input.down=false;
  if(k==='shift')setGuard(false);
});
playerHp.style.width='100%';
enemyHp.style.width='100%';
requestAnimationFrame(loop);
