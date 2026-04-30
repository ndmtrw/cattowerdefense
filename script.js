const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 960, H = 560;

const AC = new (window.AudioContext || window.webkitAudioContext)();
let muted = false;
let bgPlaying = false;
let bgTimeout = null;
let musicStarted = false;
let melodyIndex = 0;
let audioReady = false;
const BACKGROUND_MELODY = [262, 294, 330, 349, 392, 440, 494, 523, 494, 440, 392, 349, 330, 294];

function createTone(frequency, duration, type = 'sine', volume = 0.14) {
  if (muted) return;
  try {
    const oscillator = AC.createOscillator();
    const gainNode = AC.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(AC.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.setValueAtTime(volume, AC.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + duration);
    oscillator.start(AC.currentTime);
    oscillator.stop(AC.currentTime + duration);
  } catch (e) {}
}

function playBackgroundNote() {
  if (!bgPlaying || muted) return;
  const main = BACKGROUND_MELODY[melodyIndex];
  const bass = main * 0.5;
  createTone(main, 0.48, 'sine', 0.055);
  createTone(bass, 0.52, 'triangle', 0.028);
  melodyIndex = (melodyIndex + 1) % BACKGROUND_MELODY.length;
  bgTimeout = setTimeout(playBackgroundNote, 560);
}

function startBg() {
  if (bgPlaying || muted) return;
  bgPlaying = true;
  if (AC.state === 'suspended') {
    AC.resume().then(() => {
      audioReady = true;
      playBackgroundNote();
    }).catch(() => {});
  } else {
    audioReady = true;
    playBackgroundNote();
  }
}

function stopBg() {
  bgPlaying = false;
  if (bgTimeout) clearTimeout(bgTimeout);
  bgTimeout = null;
}

function ensureAudioStarted() {
  if (musicStarted && audioReady) return;
  musicStarted = true;
  if (AC.state === 'suspended') {
    AC.resume().then(() => {
      audioReady = true;
      if (gameRunning && !gamePaused && bgPlaying) playBackgroundNote();
    }).catch(() => {});
  } else {
    audioReady = true;
  }
}

document.addEventListener('pointerdown', ensureAudioStarted);
document.addEventListener('keydown', ensureAudioStarted);

function sfxShoot() {
  createTone(620, 0.07, 'square', 0.09);
  setTimeout(() => createTone(440, 0.05, 'square', 0.07), 50);
}

function sfxHit() {
  createTone(180, 0.12, 'sawtooth', 0.12);
}

function sfxKill() {
  [988, 1319].forEach((f, i) => setTimeout(() => createTone(f, i === 0 ? 0.1 : 0.2, 'square', 0.11), i * 100));
}

function sfxPlace() {
  createTone(200, 0.1, 'square', 0.09);
  setTimeout(() => createTone(400, 0.1, 'square', 0.09), 50);
}

function sfxWave() {
  [262, 330, 392, 523].forEach((f, i) => setTimeout(() => createTone(f, 0.2, 'triangle', 0.12), i * 100));
}

function sfxBoss() {
  [196, 165, 131].forEach((f, i) => setTimeout(() => createTone(f, 0.28, 'sawtooth', 0.13), i * 110));
}

function sfxOver() {
  if (muted) return;
  try {
    const noise = AC.createBufferSource();
    const buffer = AC.createBuffer(1, AC.sampleRate * 0.35, AC.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const gainNode = AC.createGain();
    gainNode.gain.setValueAtTime(0.22, AC.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + 0.35);
    noise.connect(gainNode);
    gainNode.connect(AC.destination);
    noise.start();
  } catch (e) {}
  [262, 247, 220, 196].forEach((f, i) => setTimeout(() => createTone(f, 0.3, 'sawtooth', 0.09), i * 130));
}

function toggleMute() {
  muted = !muted;
  document.getElementById('muteBtn').textContent = muted ? 'SOUND OFF' : 'SOUND ON';
  if (muted) stopBg();
  else if (gameRunning && !gamePaused) startBg();
}

function drawCat(ctx, x, y, r, color, eyeColor='#fff', hat=null, angry=false) {
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(0,r*0.3,r*0.75,r*0.6,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(0,-r*0.3,r*0.6,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-r*0.5,-r*0.8); ctx.lineTo(-r*0.7,-r*1.3); ctx.lineTo(-r*0.15,-r*0.85); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(r*0.5,-r*0.8); ctx.lineTo(r*0.7,-r*1.3); ctx.lineTo(r*0.15,-r*0.85); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#ffb3c6'; ctx.beginPath(); ctx.moveTo(-r*0.48,-r*0.85); ctx.lineTo(-r*0.62,-r*1.18); ctx.lineTo(-r*0.2,-r*0.9); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(r*0.48,-r*0.85); ctx.lineTo(r*0.62,-r*1.18); ctx.lineTo(r*0.2,-r*0.9); ctx.closePath(); ctx.fill();
  ctx.fillStyle=angry?'#ff4444':'#2c2c2c'; ctx.beginPath(); ctx.ellipse(-r*0.22,-r*0.35,r*0.14,angry?r*0.08:r*0.18,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(r*0.22,-r*0.35,r*0.14,angry?r*0.08:r*0.18,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=eyeColor; ctx.beginPath(); ctx.arc(-r*0.19,-r*0.38,r*0.06,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(r*0.25,-r*0.38,r*0.06,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#ff8fab'; ctx.beginPath(); ctx.moveTo(0,-r*0.18); ctx.lineTo(-r*0.08,-r*0.1); ctx.lineTo(r*0.08,-r*0.1); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#2d1f00'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(-r*0.12,-r*0.08); ctx.quadraticCurveTo(-r*0.06,-r*0.02,0,-r*0.07); ctx.stroke(); ctx.beginPath(); ctx.moveTo(r*0.12,-r*0.08); ctx.quadraticCurveTo(r*0.06,-r*0.02,0,-r*0.07); ctx.stroke();
  if(hat==='wizard'){ ctx.fillStyle='#5b21b6'; ctx.beginPath(); ctx.moveTo(-r*0.5,-r*0.9); ctx.lineTo(r*0.5,-r*0.9); ctx.lineTo(r*0.3,-r*1.8); ctx.lineTo(-r*0.3,-r*1.8); ctx.closePath(); ctx.fill(); ctx.fillStyle='#7c3aed'; ctx.beginPath(); ctx.ellipse(0,-r*0.9,r*0.55,r*0.1,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fbbf24'; ctx.beginPath(); ctx.arc(-r*0.1,-r*1.4,r*0.08,0,Math.PI*2); ctx.fill();}
  else if(hat==='crown'){ ctx.fillStyle='#fbbf24'; ctx.fillRect(-r*0.45,-r*1.15,r*0.9,r*0.3); [-r*0.35,-r*0.05,r*0.25].forEach(cx=>{ ctx.beginPath(); ctx.moveTo(cx,-r*0.85); ctx.lineTo(cx+r*0.12,-r*1.2); ctx.lineTo(cx+r*0.24,-r*0.85); ctx.closePath(); ctx.fill(); }); ctx.fillStyle='#ef4444'; ctx.beginPath(); ctx.arc(-r*0.05,-r*0.95,r*0.06,0,Math.PI*2); ctx.fill();}
  else if(hat==='helmet'){ ctx.fillStyle='#374151'; ctx.beginPath(); ctx.arc(0,-r*0.35,r*0.65,Math.PI,0); ctx.closePath(); ctx.fill(); ctx.fillStyle='#9ca3af'; ctx.fillRect(-r*0.65,-r*0.4,r*1.3,r*0.12);}
  else if(hat==='ninja'){ ctx.fillStyle='#111827'; ctx.beginPath(); ctx.arc(0,-r*0.35,r*0.65,Math.PI*1.1,Math.PI*1.9); ctx.closePath(); ctx.fill(); ctx.fillRect(-r*0.65,-r*0.45,r*1.3,r*0.2);}
  else if(hat==='archer'){ ctx.fillStyle='#065f46'; ctx.beginPath(); ctx.ellipse(0,-r*0.5,r*0.55,r*0.12,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(0,-r*0.62); ctx.lineTo(-r*0.12,-r*1.2); ctx.lineTo(r*0.12,-r*1.2); ctx.closePath(); ctx.fill();}
  ctx.restore();
}
function drawDog(ctx, x, y, r, type) {
  ctx.save(); ctx.translate(x,y);
  const col=type==='fast'?'#c2410c':type==='boss'?'#7c2d12':'#92400e';
  ctx.fillStyle=col; ctx.beginPath(); ctx.ellipse(0,r*0.3,r*0.8,r*0.55,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(0,-r*0.2,r*0.65,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=type==='boss'?'#9a3412':'#a16207'; ctx.beginPath(); ctx.ellipse(0,r*0.05,r*0.35,r*0.25,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=type==='boss'?'#7c2d12':'#78350f'; ctx.beginPath(); ctx.ellipse(-r*0.55,-r*0.2,r*0.25,r*0.45,-.3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(r*0.55,-r*0.2,r*0.25,r*0.45,.3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=type==='boss'?'#ff0000':'#1e1b4b'; ctx.beginPath(); ctx.arc(-r*0.24,-r*0.3,r*0.12,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(r*0.24,-r*0.3,r*0.12,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(-r*0.2,-r*0.33,r*0.05,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(r*0.28,-r*0.33,r*0.05,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.ellipse(0,r*0.0,r*0.12,r*0.08,0,0,Math.PI*2); ctx.fill();
  if(type==='boss'){ ctx.fillStyle='#ef4444'; for(let a=0;a<Math.PI*2;a+=Math.PI/6){ ctx.save(); ctx.rotate(a); ctx.fillRect(-r*0.05,r*0.35,r*0.1,r*0.25); ctx.restore(); } }
  ctx.restore();
}

const TOWERS = [
  {id:1,name:'Basic Cat',cost:90,dmg:22,range:100,cd:34,color:'#f59e0b',hat:'archer',proj:'#fbbf24',emoji:'🐱',desc:'Balanced attacker',special:'none',unlocked:true,limit:3},
  {id:2,name:'Swift Cat',cost:140,dmg:13,range:115,cd:14,color:'#06b6d4',hat:'ninja',proj:'#67e8f9',emoji:'⚡',desc:'High fire rate',special:'none',unlocked:true,limit:3},
  {id:3,name:'Heavy Cat',cost:230,dmg:58,range:85,cd:56,color:'#8b5cf6',hat:'wizard',proj:'#c4b5fd',emoji:'💪',desc:'High damage',special:'none',unlocked:true,limit:3},
  {id:4,name:'Sniper Cat',cost:280,dmg:40,range:215,cd:58,color:'#10b981',hat:'helmet',proj:'#6ee7b7',emoji:'🎯',desc:'Long range pierce',special:'pierce',unlocked:true,limit:3},
  {id:5,name:'Royal Cat',cost:440,dmg:88,range:130,cd:46,color:'#f43f5e',hat:'crown',proj:'#fda4af',emoji:'👑',desc:'Critical hits',special:'crit',unlocked:true,limit:3},
  {id:6,name:'Frost Cat',cost:200,dmg:17,range:115,cd:32,color:'#93c5fd',hat:'wizard',proj:'#bfdbfe',emoji:'❄️',desc:'Slows enemies',special:'slow',unlocked:true,limit:3},
  {id:7,name:'Venom Cat',cost:220,dmg:15,range:125,cd:28,color:'#84cc16',hat:'ninja',proj:'#bef264',emoji:'☠️',desc:'Poison damage',special:'poison',unlocked:true,limit:3},
  {id:8,name:'Bomb Cat',cost:360,dmg:48,range:105,cd:70,color:'#fb923c',hat:'helmet',proj:'#fdba74',emoji:'💣',desc:'Splash damage',special:'splash',unlocked:true,limit:3},
  {id:9,name:'Ice Sentinel',cost:1500,dmg:0,range:145,cd:90,color:'#7dd3fc',hat:'helmet',proj:'#e0f2fe',emoji:'🧊',desc:'Shields nearby cats',special:'shieldAura',unlocked:false,limit:3,element:true},
  {id:10,name:'Water Medic',cost:1500,dmg:0,range:135,cd:75,color:'#38bdf8',hat:'wizard',proj:'#bae6fd',emoji:'💧',desc:'Heals nearby cats',special:'healAura',unlocked:false,limit:3,element:true},
  {id:11,name:'Grass Sage',cost:1500,dmg:10,range:145,cd:30,color:'#22c55e',hat:'archer',proj:'#bbf7d0',emoji:'🌿',desc:'Slows enemies in aura',special:'slowAura',unlocked:false,limit:3,element:true},
  {id:12,name:'Fire Lynx',cost:1500,dmg:38,range:135,cd:38,color:'#ef4444',hat:'crown',proj:'#fed7aa',emoji:'🔥',desc:'Cone damage',special:'cone',unlocked:false,limit:3,element:true}
];

const ELEMENT_REWARDS = [9,10,11,12];
const MAPS = [
  {name:'Moon Road',bg:['#0a0620','#1e2c4a'],road:'#b97f10',dash:'#eab308',path:[{x:0,y:100},{x:160,y:100},{x:160,y:220},{x:320,y:220},{x:320,y:100},{x:500,y:100},{x:500,y:340},{x:720,y:340},{x:720,y:200},{x:960,y:200}]},
  {name:'Frozen Pass',bg:['#082f49','#0f172a'],road:'#64748b',dash:'#bae6fd',path:[{x:0,y:420},{x:150,y:420},{x:150,y:270},{x:330,y:270},{x:330,y:420},{x:520,y:420},{x:520,y:170},{x:760,y:170},{x:760,y:320},{x:960,y:320}]},
  {name:'Forest Spiral',bg:['#052e16','#1f2937'],road:'#854d0e',dash:'#84cc16',path:[{x:0,y:280},{x:150,y:280},{x:150,y:130},{x:380,y:130},{x:380,y:430},{x:610,y:430},{x:610,y:120},{x:810,y:120},{x:810,y:260},{x:960,y:260}]}
];
let currentMap=0;
let PATH = MAPS[currentMap].path;
const MUTATIONS = [
  {name:'Wild',tag:'WILD',color:'#f87171',dmg:1.22,range:1,cd:1,reward:1,effect:'Damage +22%.'},
  {name:'Longpaw',tag:'RANGE',color:'#38bdf8',dmg:1,range:1.18,cd:1,reward:1,effect:'Range +18%.'},
  {name:'Lightning',tag:'FAST',color:'#fde047',dmg:1,range:1,cd:0.82,reward:1,effect:'Shoots 18% faster.'},
  {name:'Golden',tag:'GOLD',color:'#fbbf24',dmg:1.06,range:1.04,cd:0.96,reward:1.35,effect:'Earns +35% money from kills and gains small stat boosts.'},
  {name:'Titan',tag:'TITAN',color:'#c084fc',dmg:1.12,range:1.08,cd:0.92,reward:1.1,effect:'Damage +12%, range +8%, speed +8%, money +10%.'}
];
const BOSS_TYPES = ['fire','ice','water','nature'];

let gameRunning=false, gamePaused=false;
let money=300, lives=20, score=0, wave=0;
let enemies=[], towers=[], projectiles=[];
let selectedTower=1, waveActive=false, hovTower=null, selectedCat=null;
let particles=[], frame=0;
let mouseX=W/2, mouseY=H/2;
function getTowerData(id){ return TOWERS.find(t=>t.id===id); }
function getPlacedCount(id){ return towers.filter(t=>t.type===id).length; }
function isTowerAvailable(id){ const t=getTowerData(id); return !!t&&t.unlocked&&getPlacedCount(id)<t.limit; }

class Enemy {
  constructor(type='normal', bossType=null) {
    this.pi=0; this.prog=0; this.x=PATH[0].x; this.y=PATH[0].y; this.type=type; this.bossType=bossType; this.dead=false; this.slowTimer=0; this.slowPower=1; this.poisonTimer=0; this.poisonDmg=0; this.spawnTimer=0; this.healTimer=0; this.shieldTimer=0;
    if(type==='normal'){ this.spd=1.4+wave*0.025; this.hp=60+wave*8; this.maxhp=this.hp; this.val=40+wave*2; this.r=14; }
    else if(type==='fast'){ this.spd=2.8+wave*0.03; this.hp=35+wave*6; this.maxhp=this.hp; this.val=60+wave*2; this.r=11; }
    else if(type==='tank'){ this.spd=0.72+wave*0.015; this.hp=200+wave*25; this.maxhp=this.hp; this.val=120+wave*4; this.r=18; }
    else if(type==='boss'){
      const scale=1+wave*0.21;
      this.spd=0.82; this.hp=Math.floor(520*scale); this.maxhp=this.hp; this.val=290+wave*24; this.r=25;
      if(bossType==='fire'){ this.spd=0.9; this.hp=Math.floor(this.hp*1.05); this.maxhp=this.hp; this.val+=70; }
      if(bossType==='ice'){ this.spd=0.68; this.hp=Math.floor(this.hp*1.35); this.maxhp=this.hp; this.val+=95; this.r=28; }
      if(bossType==='water'){ this.spd=0.78; this.hp=Math.floor(this.hp*1.15); this.maxhp=this.hp; this.val+=85; }
      if(bossType==='nature'){ this.spd=0.86; this.hp=Math.floor(this.hp*1.22); this.maxhp=this.hp; this.val+=90; }
    }
    this.flashTimer=0;
  }
  update() {
    if(this.pi>=PATH.length-1) return true;
    if(this.slowTimer>0) this.slowTimer--; else this.slowPower=1;
    if(this.poisonTimer>0){ this.poisonTimer--; if(this.poisonTimer%24===0) this.hit(this.poisonDmg,false); }
    if(this.type==='boss') this.bossSkill();
    const s=PATH[this.pi], e=PATH[this.pi+1];
    const dx=e.x-s.x, dy=e.y-s.y, d=Math.hypot(dx,dy);
    this.prog+=(this.spd*this.slowPower)/d;
    if(this.prog>=1){ this.prog=0; this.pi++; if(this.pi>=PATH.length-1) return true; }
    this.x=s.x+(e.x-s.x)*this.prog; this.y=s.y+(e.y-s.y)*this.prog;
    if(this.flashTimer>0) this.flashTimer--;
    return false;
  }
  bossSkill(){
    if(this.bossType==='water'){ this.healTimer++; if(this.healTimer>=95){ this.healTimer=0; for(const e of enemies){ if(e!==this&&!e.dead&&Math.hypot(e.x-this.x,e.y-this.y)<105){ e.hp=Math.min(e.maxhp,e.hp+Math.floor(e.maxhp*0.14)); e.flashTimer=12; } } } }
    if(this.bossType==='nature'){ this.spawnTimer++; if(this.spawnTimer>=145){ this.spawnTimer=0; const n=new Enemy(Math.random()<0.5?'fast':'normal'); n.pi=this.pi; n.prog=this.prog; n.x=this.x; n.y=this.y; enemies.push(n); } }
    if(this.bossType==='ice'){ this.shieldTimer++; if(this.shieldTimer>=115){ this.shieldTimer=0; for(const e of enemies){ if(e!==this&&!e.dead&&Math.hypot(e.x-this.x,e.y-this.y)<95){ e.hp=Math.min(e.maxhp,e.hp+45+wave*5); e.flashTimer=12; } } } }
    if(this.bossType==='fire'&&frame%90===0){ let target=null,best=9999; for(const t of towers){ const d=Math.hypot(t.x-this.x,t.y-this.y); if(d<best){ best=d; target=t; } } if(target&&best<170) target.takeDamage(18+wave*2); }
  }
  draw() {
    if(this.dead) return;
    ctx.save();
    if(this.flashTimer>0) ctx.globalAlpha=0.5+0.5*Math.sin(this.flashTimer*0.8);
    drawDog(ctx,this.x,this.y,this.r,this.type);
    if(this.type==='boss'){
      const labels={fire:'FIRE',ice:'ICE',water:'WATER',nature:'NATURE'};
      ctx.fillStyle='#fbbf24'; ctx.font='bold 9px sans-serif'; ctx.textAlign='center'; ctx.fillText(labels[this.bossType]||'BOSS',this.x,this.y-this.r-22);
      if(this.bossType==='ice'){ ctx.strokeStyle='rgba(96,165,250,0.55)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(this.x,this.y,this.r+9,0,Math.PI*2); ctx.stroke(); }
      if(this.bossType==='water'){ ctx.strokeStyle='rgba(34,197,94,0.45)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(this.x,this.y,this.r+11,0,Math.PI*2); ctx.stroke(); }
    }
    if(this.poisonTimer>0){ ctx.fillStyle='#84cc16'; ctx.font='bold 8px sans-serif'; ctx.textAlign='center'; ctx.fillText('POISON',this.x,this.y+this.r+15); }
    if(this.slowTimer>0){ ctx.fillStyle='#bfdbfe'; ctx.font='bold 8px sans-serif'; ctx.textAlign='center'; ctx.fillText('SLOW',this.x,this.y+this.r+25); }
    const bw=this.r*2+8; ctx.fillStyle='#1f2937'; ctx.fillRect(this.x-bw/2,this.y-this.r-14,bw,6); ctx.fillStyle=this.hp/this.maxhp>0.5?'#22c55e':'#ef4444'; ctx.fillRect(this.x-bw/2,this.y-this.r-14,bw*Math.max(0,this.hp/this.maxhp),6); ctx.restore();
  }
  hit(dmg, flash=true) {
    let finalDmg=dmg;
    if(this.type==='boss'&&this.bossType==='ice'&&this.shieldTimer<60) finalDmg*=0.72;
    this.hp-=finalDmg;
    if(flash) this.flashTimer=8;
    if(this.hp<=0){ this.dead=true; return true; }
    return false;
  }
}
class Tower {
  constructor(x,y,typeId){
    this.x=x; this.y=y; this.type=typeId; this.base=getTowerData(typeId); this.level=1; this.xp=0; this.cd=0; this.shootAnim=0; this.hp=100; this.maxHp=100; this.shield=0; this.mutation=Math.random()<0.25?MUTATIONS[Math.floor(Math.random()*MUTATIONS.length)]:null; this.recalc();
  }
  recalc(){
    const l=this.level-1;
    const m=this.mutation||{dmg:1,range:1,cd:1,reward:1};
    this.data={...this.base};
    this.data.dmg=Math.floor(this.base.dmg*(1+l*0.32)*m.dmg);
    this.data.range=Math.floor(this.base.range*(1+l*0.08)*m.range);
    this.data.cd=Math.max(8,Math.floor(this.base.cd*(1-l*0.055)*m.cd));
  }
  needXp(){ return 70+this.level*55+this.base.cost*0.25; }
  gainXp(v){
    if(this.level>=5) return;
    this.xp+=v;
    while(this.level<5&&this.xp>=this.needXp()){
      this.xp-=this.needXp(); this.level++; this.recalc();
      for(let i=0;i<10;i++) particles.push({x:this.x,y:this.y,vx:(Math.random()-.5)*3,vy:(Math.random()-.8)*3,life:28,color:'#fbbf24'});
    }
  }
  takeDamage(v){
    if(this.shield>0){ this.shield=Math.max(0,this.shield-v); return; }
    this.hp=Math.max(0,this.hp-v);
  }
  supportUpdate(){
    if(this.data.special==='shieldAura'){ for(const t of towers){ if(t!==this&&Math.hypot(t.x-this.x,t.y-this.y)<=this.data.range) t.shield=Math.min(70,t.shield+0.22); } }
    if(this.data.special==='healAura'){ for(const t of towers){ if(t!==this&&Math.hypot(t.x-this.x,t.y-this.y)<=this.data.range) t.hp=Math.min(t.maxHp,t.hp+0.18); } }
    if(this.data.special==='slowAura'){ for(const e of enemies){ if(!e.dead&&Math.hypot(e.x-this.x,e.y-this.y)<=this.data.range){ e.slowTimer=Math.max(e.slowTimer,8); e.slowPower=Math.min(e.slowPower,0.68); } } }
  }
  update() {
    if(this.hp<=0) return;
    this.supportUpdate();
    if(this.data.special==='shieldAura'||this.data.special==='healAura'||this.data.special==='slowAura') return;
    if(this.cd>0) this.cd--;
    if(this.shootAnim>0) this.shootAnim--;
    if(this.cd>0) return;
    let target=null;
    let best=-1;
    for(let e of enemies){
      if(e.dead) continue;
      const dx=e.x-this.x, dy=e.y-this.y;
      const dist=Math.hypot(dx,dy);
      if(dist<=this.data.range){
        const value=e.pi*1000+e.prog*1000+(e.type==='boss'?500:0);
        if(value>best){ best=value; target=e; }
      }
    }
    if(!target) return;
    const dx=target.x-this.x, dy=target.y-this.y;
    const dist=Math.max(1,Math.hypot(dx,dy));
    this.cd=this.data.cd;
    this.shootAnim=8;
    const dmg=this.data.special==='crit'&&Math.random()<0.22?this.data.dmg*2:this.data.dmg;
    if(this.data.special==='cone'){
      const angle=Math.atan2(dy,dx);
      for(const e of enemies){
        if(e.dead) continue;
        const ex=e.x-this.x, ey=e.y-this.y, d=Math.hypot(ex,ey);
        const a=Math.abs(Math.atan2(Math.sin(Math.atan2(ey,ex)-angle),Math.cos(Math.atan2(ey,ex)-angle)));
        if(d<=this.data.range&&a<0.48) applyProjectileHit({dmg:dmg,owner:this,special:'none'},e);
      }
      projectiles.push({x:this.x,y:this.y,px:this.x,py:this.y,tx:target,vx:Math.cos(angle)*12,vy:Math.sin(angle)*12,color:this.data.proj,dmg:0,life:12,owner:this,special:'visual',hitIds:new Set()});
      sfxShoot();
      return;
    }
    const spd=this.data.special==='pierce'?14:10;
    const vx=dx/dist*spd, vy=dy/dist*spd;
    projectiles.push({x:this.x,y:this.y,px:this.x,py:this.y,tx:target,vx:vx,vy:vy,color:this.data.proj,dmg:dmg,life:80,owner:this,special:this.data.special,hitIds:new Set()});
    sfxShoot();
  }
  draw() {
    if(this.data.special==='shieldAura'||this.data.special==='healAura'||this.data.special==='slowAura'){ ctx.strokeStyle=this.data.special==='shieldAura'?'rgba(125,211,252,0.32)':this.data.special==='healAura'?'rgba(56,189,248,0.32)':'rgba(34,197,94,0.32)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(this.x,this.y,this.data.range,0,Math.PI*2); ctx.stroke(); }
    if(this===hovTower){ ctx.strokeStyle='rgba(255,215,0,0.4)'; ctx.lineWidth=2; ctx.setLineDash([6,8]); ctx.beginPath(); ctx.arc(this.x,this.y,this.data.range,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]); }
    ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(this.x,this.y+2,20,8,0,0,Math.PI*2); ctx.fill();
    const sc=1+(this.shootAnim>0?this.shootAnim*0.018:0); ctx.save(); ctx.translate(this.x,this.y); ctx.scale(sc,sc); ctx.translate(-this.x,-this.y); drawCat(ctx,this.x,this.y,19,this.data.color,'#fff',this.data.hat,this.shootAnim>4); ctx.restore();
    if(this.hp<=0){ ctx.globalAlpha=0.45; ctx.fillStyle='#ef4444'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center'; ctx.fillText('DISABLED',this.x,this.y-34); ctx.globalAlpha=1; }
    ctx.fillStyle='#fbbf24'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center'; ctx.fillText('LVL '+this.level,this.x,this.y+32);
    ctx.fillStyle='#111827'; ctx.fillRect(this.x-20,this.y+44,40,4); ctx.fillStyle='#22c55e'; ctx.fillRect(this.x-20,this.y+44,40*Math.max(0,this.hp/this.maxHp),4);
    if(this.shield>0){ ctx.strokeStyle='rgba(125,211,252,0.65)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(this.x,this.y,25,0,Math.PI*2); ctx.stroke(); }
    if(this.mutation){ ctx.fillStyle=this.mutation.color; ctx.font='bold 9px sans-serif'; ctx.fillText(this.mutation.tag,this.x,this.y-34); }
    if(this.level<5){ ctx.fillStyle='#111827'; ctx.fillRect(this.x-20,this.y+38,40,4); ctx.fillStyle='#22c55e'; ctx.fillRect(this.x-20,this.y+38,40*Math.min(1,this.xp/this.needXp()),4); }
  }
  upgrade() {
    const cost=this.upgradeCost();
    if(money>=cost && this.level<5){ money-=cost; this.level++; this.xp=0; this.recalc(); sfxPlace(); updateHUD(); updateCatMenu(); }
  }
  upgradeCost(){ return Math.floor(this.base.cost*(0.45+this.level*0.25)); }
}
function drawMap() {
  PATH=MAPS[currentMap].path;
  const map=MAPS[currentMap];
  const grad=ctx.createLinearGradient(0,0,0,H); grad.addColorStop(0,map.bg[0]); grad.addColorStop(1,map.bg[1]); ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
  for(let i=0;i<90;i++){ ctx.fillStyle=`rgba(255,255,200,${0.05+Math.abs(Math.sin(frame*0.01+i))*0.18})`; ctx.beginPath(); ctx.arc((i*131)%W,(i*37)%H,1.2+Math.sin(frame*0.01+i)*0.5,0,Math.PI*2); ctx.fill();}
  ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.font='bold 14px sans-serif'; ctx.textAlign='right'; ctx.fillText(map.name,W-20,26);
  ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=46; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(PATH[0].x,PATH[0].y); PATH.slice(1).forEach(p=>ctx.lineTo(p.x,p.y)); ctx.stroke();
  ctx.strokeStyle=map.road; ctx.lineWidth=38; ctx.beginPath(); ctx.moveTo(PATH[0].x,PATH[0].y); PATH.slice(1).forEach(p=>ctx.lineTo(p.x,p.y)); ctx.stroke();
  ctx.setLineDash([20,25]); ctx.strokeStyle=map.dash; ctx.lineWidth=34; ctx.beginPath(); ctx.moveTo(PATH[0].x,PATH[0].y); PATH.slice(1).forEach(p=>ctx.lineTo(p.x,p.y)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle='#22c55e'; ctx.beginPath(); ctx.arc(PATH[0].x,PATH[0].y,16,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; ctx.font='bold 9px sans-serif'; ctx.textAlign='center'; ctx.fillText('START',PATH[0].x,PATH[0].y);
  ctx.fillStyle='#ef4444'; ctx.beginPath(); ctx.arc(PATH[PATH.length-1].x,PATH[PATH.length-1].y,22,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; ctx.fillText('EXIT',PATH[PATH.length-1].x,PATH[PATH.length-1].y);
}
function validPos(x,y){ for(let i=0;i<PATH.length-1;i++){ const a=PATH[i],b=PATH[i+1]; const abx=b.x-a.x,aby=b.y-a.y,apx=x-a.x,apy=y-a.y; const t=Math.max(0,Math.min(1,(apx*abx+apy*aby)/(abx*abx+aby*aby))); const px=a.x+abx*t,py=a.y+aby*t; if(Math.hypot(x-px,y-py)<34) return false; } for(const t of towers) if(Math.hypot(t.x-x,t.y-y)<38) return false; if(x<25||x>W-25||y<25||y>H-25) return false; return true; }
function spawnWave(){
  wave++;
  currentMap=Math.floor((wave-1)/3)%MAPS.length;
  PATH=MAPS[currentMap].path;
  sfxWave();
  showWaveMsg('WAVE '+wave+' - '+MAPS[currentMap].name);
  let count=7+Math.floor(wave*2.6);
  const delay=Math.max(210,360-wave*7);
  for(let i=0;i<count;i++){
    setTimeout(()=>{
      if(!gameRunning) return;
      let r=Math.random();
      if(wave>=2&&r<0.32) enemies.push(new Enemy('fast'));
      else if(wave>=4&&r<0.28) enemies.push(new Enemy('tank'));
      else enemies.push(new Enemy('normal'));
    }, i*delay+Math.random()*120);
  }
  setTimeout(()=>{
    if(gameRunning){
      const bossType=BOSS_TYPES[(wave-1)%BOSS_TYPES.length];
      enemies.push(new Enemy('boss',bossType));
      showWaveMsg('BOSS: '+bossType.toUpperCase()); sfxBoss();
    }
  }, count*delay+450);
}
function showWaveMsg(msg){ let el=document.getElementById('waveMsg'); el.textContent=msg; el.style.opacity='1'; setTimeout(()=>el.style.opacity='0',2000); }
function updateHUD(){ document.getElementById('moneyVal').textContent=money; document.getElementById('livesVal').textContent=lives; document.getElementById('scoreVal').textContent=score; document.getElementById('waveVal').textContent=wave; updateCatMenu(); }
function pointSegmentDistance(px,py,ax,ay,bx,by){ const abx=bx-ax, aby=by-ay; const len=abx*abx+aby*aby; if(len===0) return Math.hypot(px-ax,py-ay); const t=Math.max(0,Math.min(1,((px-ax)*abx+(py-ay)*aby)/len)); return Math.hypot(px-(ax+abx*t),py-(ay+aby*t)); }
function closeCatMenu(){ selectedCat=null; document.getElementById('catMenu').style.display='none'; }
function selectCat(t){ selectedCat=t; updateCatMenu(); document.getElementById('catMenu').style.display='block'; }
function updateCatMenu(){
  if(!selectedCat||!towers.includes(selectedCat)){ if(document.getElementById('catMenu')) document.getElementById('catMenu').style.display='none'; return; }
  const t=selectedCat;
  document.getElementById('catMenuTitle').textContent=t.base.emoji+' '+t.base.name;
  document.getElementById('catMenuLevel').textContent='Level '+t.level+(t.level>=5?' / MAX':' / 5');
  document.getElementById('catMenuXp').style.width=t.level>=5?'100%':Math.floor(Math.min(1,t.xp/t.needXp())*100)+'%';
  document.getElementById('catMenuStats').textContent='Damage: '+t.data.dmg+' | Range: '+t.data.range+' | Cooldown: '+t.data.cd+' | HP: '+Math.floor(t.hp)+'/'+t.maxHp;
  if(t.mutation){
    document.getElementById('catMenuMutation').textContent='Mutation: '+t.mutation.name+' ('+t.mutation.tag+')';
    document.getElementById('catMenuMutation').style.color=t.mutation.color;
    document.getElementById('catMenuMutationEffect').textContent=t.mutation.effect;
  } else {
    document.getElementById('catMenuMutation').textContent='Mutation: none';
    document.getElementById('catMenuMutation').style.color='#d1d5db';
    document.getElementById('catMenuMutationEffect').textContent='This cat has no random buff.';
  }
  const btn=document.getElementById('catUpgradeBtn');
  if(t.hp<=0){ btn.textContent='DISABLED'; btn.disabled=true; btn.style.opacity='0.55'; }
  else if(t.level>=5){ btn.textContent='MAX LEVEL'; btn.disabled=true; btn.style.opacity='0.65'; }
  else { const cost=t.upgradeCost(); btn.textContent='UPGRADE - '+cost+'$'; btn.disabled=money<cost; btn.style.opacity=money>=cost?'1':'0.55'; }
  const sellBtn=document.getElementById('catSellBtn');
  const refund=sellValue(t);
  sellBtn.textContent='SELL +'+refund+'$';
  sellBtn.disabled=false;
  sellBtn.style.opacity='1';
}
function sellValue(t){
  const hpRatio=Math.max(0.25,t.hp/t.maxHp);
  return Math.floor((t.base.cost*0.55+(t.level-1)*t.upgradeCost()*0.25)*hpRatio);
}
function sellSelectedCat(){
  if(!selectedCat) return;
  const index=towers.indexOf(selectedCat);
  if(index===-1){ closeCatMenu(); return; }
  money+=sellValue(selectedCat);
  towers.splice(index,1);
  selectedCat=null;
  closeCatMenu();
  updateHUD();
  buildTowerPanel();
}
function countTowerType(id){ return getPlacedCount(id); }
function buildTowerPanel(){
  const panel=document.getElementById('towerPanel');
  panel.innerHTML='';
  TOWERS.forEach(t=>{
    const count=countTowerType(t.id);
    const locked=!t.unlocked;
    const capped=count>=t.limit;
    const div=document.createElement('div');
    div.className='tcard'+(selectedTower===t.id?' selected':'')+(locked?' locked':'')+(capped?' full':'');
    div.style.opacity=locked?'0.45':capped?'0.72':'1';
    const priceText=locked?'LOCKED':capped?'FULL':'💰 '+t.cost;
    div.innerHTML=`<div style="font-size:22px">${t.emoji}</div><div style="font-weight:900">${t.name}</div><div class="cost">${priceText}</div><div class="desc">${count}/${t.limit} placed</div><div class="desc">${t.desc}</div>`;
    div.onclick=()=>{ if(!locked&&!capped){ selectedTower=t.id; buildTowerPanel(); } };
    panel.appendChild(div);
  });
}

function startGame(){ TOWERS.forEach(t=>{ if(t.element) t.unlocked=false; }); money=260; lives=15; score=0; wave=0; currentMap=0; PATH=MAPS[currentMap].path; enemies=[]; towers=[]; projectiles=[]; particles=[]; selectedCat=null; closeCatMenu(); waveActive=false; gameRunning=true; gamePaused=false; selectedTower=1; document.getElementById('overlay').style.display='none'; document.getElementById('hud').style.display='flex'; document.getElementById('towerPanel').style.display='flex'; document.getElementById('btnRow').style.display='flex'; buildTowerPanel(); updateHUD(); ensureAudioStarted(); startBg(); requestAnimationFrame(gameLoop); }
function restartGame(){ document.getElementById('gameOverScreen').style.display='none'; startGame(); }
function showMenu(){ gameRunning=false; selectedCat=null; closeCatMenu(); stopBg(); document.getElementById('overlay').style.display='flex'; document.getElementById('menuScreen').style.display='block'; document.getElementById('gameOverScreen').style.display='none'; document.getElementById('pauseScreen').style.display='none'; document.getElementById('hud').style.display='none'; document.getElementById('towerPanel').style.display='none'; document.getElementById('btnRow').style.display='none'; }
function startWave(){ if(!waveActive&&gameRunning&&!gamePaused){ waveActive=true; spawnWave(); } }
function togglePause(){ if(!gameRunning) return; gamePaused=!gamePaused; if(gamePaused){ stopBg(); document.getElementById('overlay').style.display='flex'; document.getElementById('pauseScreen').style.display='block'; } else { document.getElementById('overlay').style.display='none'; document.getElementById('pauseScreen').style.display='none'; startBg(); requestAnimationFrame(gameLoop); } }
function resumeGame(){ gamePaused=false; document.getElementById('overlay').style.display='none'; document.getElementById('pauseScreen').style.display='none'; if(!muted) startBg(); requestAnimationFrame(gameLoop); }

canvas.addEventListener('click',e=>{ if(!gameRunning||gamePaused) return; const rect=canvas.getBoundingClientRect(); const sx=canvas.width/rect.width, sy=canvas.height/rect.height; const mx=(e.clientX-rect.left)*sx, my=(e.clientY-rect.top)*sy; for(const t of towers){ if(Math.hypot(t.x-mx,t.y-my)<24){ selectCat(t); return; } } closeCatMenu(); const td=getTowerData(selectedTower); if(!td||!td.unlocked||getPlacedCount(td.id)>=td.limit) return; if(money>=td.cost&&validPos(mx,my)){ const nt=new Tower(mx,my,selectedTower); towers.push(nt); money-=td.cost; selectCat(nt); sfxPlace(); updateHUD(); buildTowerPanel(); } });
canvas.addEventListener('mousemove',e=>{ const rect=canvas.getBoundingClientRect(); mouseX=(e.clientX-rect.left)*(canvas.width/rect.width); mouseY=(e.clientY-rect.top)*(canvas.height/rect.height); hovTower=null; for(const t of towers) if(Math.hypot(t.x-mouseX,t.y-mouseY)<22) hovTower=t; });
window.addEventListener('keydown',e=>{ const k=parseInt(e.key); if(k>=1&&k<=9&&isTowerAvailable(k)){ selectedTower=k; buildTowerPanel(); } if(e.key==='Escape') togglePause(); if(e.key===' ') { e.preventDefault(); startWave(); } });

function rollBossReward(){
  if(Math.random()>=0.25) return;
  const locked=ELEMENT_REWARDS.filter(id=>!TOWERS[id-1].unlocked);
  const pool=locked.length?locked:ELEMENT_REWARDS;
  const id=pool[Math.floor(Math.random()*pool.length)];
  TOWERS[id-1].unlocked=true;
  showWaveMsg('UNLOCKED: '+TOWERS[id-1].name);
  buildTowerPanel();
}
function applyProjectileHit(p,e){
  if(e.dead) return false;
  if(p.special==='slow'){ e.slowTimer=95; e.slowPower=0.55; }
  if(p.special==='poison'){ e.poisonTimer=150; e.poisonDmg=Math.max(e.poisonDmg,Math.floor(p.dmg*0.32)); }
  if(p.special==='splash'){
    for(const e2 of enemies){
      if(e2!==e&&!e2.dead&&Math.hypot(e2.x-e.x,e2.y-e.y)<58){
        const k2=e2.hit(p.dmg*0.45);
        if(k2){ score+=e2.val; money+=Math.floor(e2.val*(p.owner?.mutation?.reward||1)); p.owner?.gainXp(30); if(e2.type==='boss') rollBossReward(); }
      }
    }
  }
  const killed=e.hit(p.dmg);
  sfxHit();
  p.owner?.gainXp(4);
  if(killed){ score+=e.val; money+=Math.floor(e.val*(p.owner?.mutation?.reward||1)); p.owner?.gainXp(e.type==='boss'?140:35); if(e.type==='boss') rollBossReward(); sfxKill(); updateHUD(); }
  return killed;
}
function gameLoop(){ if(!gameRunning||gamePaused) return; frame++; if(selectedCat&&frame%15===0) updateCatMenu(); drawMap(); towers.forEach(t=>{ t.update(); t.draw(); }); for(let i=projectiles.length-1;i>=0;i--){ const p=projectiles[i]; p.px=p.x; p.py=p.y; p.x+=p.vx; p.y+=p.vy; p.life--; let removed=false; let hits=0; const candidates=p.special==='visual'?[]:enemies.filter(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<Math.max(80,e.r+36)).sort((a,b)=>pointSegmentDistance(a.x,a.y,p.px,p.py,p.x,p.y)-pointSegmentDistance(b.x,b.y,p.px,p.py,p.x,p.y)); for(const e of candidates){ if(p.hitIds.has(e)) continue; const hitRadius=e.r+(p.special==='splash'?9:7); if(pointSegmentDistance(e.x,e.y,p.px,p.py,p.x,p.y)<=hitRadius){ p.hitIds.add(e); applyProjectileHit(p,e); hits++; if(p.special!=='pierce'||hits>=3){ projectiles.splice(i,1); removed=true; } break; } } if(removed) continue; if(p.tx.dead&&p.special!=='pierce'){ projectiles.splice(i,1); continue; } if(p.life<=0||p.x<-40||p.x>W+40||p.y<-40||p.y>H+40){ projectiles.splice(i,1); continue; } ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.special==='splash'?7:5,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=0.4; ctx.beginPath(); ctx.arc(p.x-p.vx*2,p.y-p.vy*2,3,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; } for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; p.x+=p.vx; p.y+=p.vy; p.life--; ctx.globalAlpha=Math.max(0,p.life/28); ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; if(p.life<=0) particles.splice(i,1); } for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(e.dead){ enemies.splice(i,1); continue; } const reached=e.update(); if(reached){ lives-=(e.type==='boss'?4:1); enemies.splice(i,1); updateHUD(); if(lives<=0){ gameRunning=false; stopBg(); sfxOver(); document.getElementById('overlay').style.display='flex'; document.getElementById('gameOverScreen').style.display='block'; document.getElementById('finalScore').textContent=score; document.getElementById('finalWaves').textContent=wave; buildEndPreview(); document.getElementById('hud').style.display='none'; document.getElementById('towerPanel').style.display='none'; document.getElementById('btnRow').style.display='none'; closeCatMenu(); return; } continue; } e.draw(); } if(waveActive&&enemies.length===0&&frame%60===0){ waveActive=false; money+=50+wave*20; updateHUD(); showWaveMsg(`WAVE ${wave} CLEARED! +${50+wave*20}$`); setTimeout(()=>{ if(gameRunning&&!gamePaused&&!waveActive){ waveActive=true; spawnWave(); } },4000); } const td=getTowerData(selectedTower); if(td&&!hovTower){ ctx.globalAlpha=0.3; ctx.fillStyle=money>=td.cost?'#22c55e':'#ef4444'; ctx.beginPath(); ctx.arc(mouseX,mouseY,18,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; } requestAnimationFrame(gameLoop); }

document.getElementById('startBtn').onclick=startGame;
document.getElementById('waveBtn').onclick=startWave;
document.getElementById('muteBtn').onclick=toggleMute;
document.getElementById('catUpgradeBtn').onclick=()=>{ if(selectedCat) selectedCat.upgrade(); };
document.getElementById('catSellBtn').onclick=sellSelectedCat;
document.getElementById('catCloseBtn').onclick=closeCatMenu;

function makeCatCard(t,small=false){
  const div=document.createElement('div');
  div.className='hero-card';
  const c=document.createElement('canvas');
  c.className='cat-preview-canvas';
  c.width=small?58:70;
  c.height=small?66:80;
  const cx=c.getContext('2d');
  cx.clearRect(0,0,c.width,c.height);
  cx.fillStyle='rgba(12,8,34,0.95)';
  cx.fillRect(0,0,c.width,c.height);
  drawCat(cx,c.width/2,small?43:50,small?18:22,t.color,'#fff',t.hat);
  const name=document.createElement('strong');
  name.textContent=t.name;
  const cost=document.createElement('p');
  cost.textContent=t.cost;
  div.appendChild(c);
  div.appendChild(name);
  div.appendChild(cost);
  return div;
}
function buildStartPreview(){ const preview=document.getElementById('heroPreview'); preview.innerHTML=''; TOWERS.forEach(t=>preview.appendChild(makeCatCard(t))); }
function buildEndPreview(){ const preview=document.getElementById('endPreview'); preview.innerHTML=''; const used=[...new Set(towers.map(t=>t.type))].map(id=>getTowerData(id)).filter(Boolean); const list=used.length?used:TOWERS.slice(0,8); list.forEach(t=>preview.appendChild(makeCatCard(t,true))); }
buildStartPreview();
drawMap();
