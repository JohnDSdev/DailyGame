(() => {
  'use strict';

  const WORLD = { w: 1000, h: 650 };
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const stage = document.querySelector('#stage');
  const ui = {
    intro: document.querySelector('#intro'), picker: document.querySelector('#picker'), levelList: document.querySelector('#levelList'),
    levelName: document.querySelector('#levelName'), distance: document.querySelector('#distance'), best: document.querySelector('#best'),
    brief: document.querySelector('#brief'), flash: document.querySelector('#flash'), toast: document.querySelector('#toast'),
    start: document.querySelector('#startBtn'), restart: document.querySelector('#restartBtn'), next: document.querySelector('#nextBtn'),
    levels: document.querySelector('#levelsBtn'), closePicker: document.querySelector('#closePicker'), sound: document.querySelector('#soundBtn')
  };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const colors = { water:'#031115', grid:'#0d2b31', coast:'#d7ceb6', land:'#0a0c0b', rust:'#ff6a3d', lamp:'#ffd36b', buoy:'#6be0d0', fog:'#8ba2a1', ink:'#f2ead5' };

  const levels = [
    {
      name:'Leave the pier', brief:'Reach the white dock. Drag toward where you want the bow to go; release and everything stops.',
      start:[105,530], goal:[890,120],
      islands:[{x:310,y:210,w:250,h:250}], patrols:[], mines:[], buoys:[], fog:[]
    },
    {
      name:'The first lamp', brief:'The amber wedge is a patrol light. Cross behind it, or stop and wait forever. Waiting does not move the lamp.',
      start:[100,520], goal:[900,120],
      islands:[{x:390,y:0,w:210,h:245},{x:390,y:405,w:210,h:245}],
      patrols:[{a:[500,325],b:[780,325],period:6.2,range:230,cone:.47,phase:.15}], mines:[], buoys:[], fog:[]
    },
    {
      name:'Narrow water', brief:'Searchlights cannot see through islands. The safest route is often longer than the obvious one.',
      start:[95,325], goal:[915,325],
      islands:[{x:260,y:120,w:165,h:410},{x:575,y:120,w:165,h:410}],
      patrols:[{a:[500,125],b:[500,525],period:7.5,range:265,cone:.42,phase:.0}], mines:[], buoys:[], fog:[]
    },
    {
      name:'Signal first', brief:'Collect the cyan signal buoy before entering the dock. A closed dock is outlined in red.',
      start:[105,535], goal:[890,535],
      islands:[{x:300,y:260,w:400,h:115}],
      patrols:[{a:[310,120],b:[690,120],period:7,range:220,cone:.45,phase:.22}],
      mines:[], buoys:[[500,115]], fog:[]
    },
    {
      name:'Fog bank', brief:'Patrol light scatters in fog. Once your boat is inside the gray bank, the lamps lose you.',
      start:[110,520], goal:[900,135],
      islands:[{x:325,y:180,w:120,h:310},{x:650,y:180,w:120,h:310}],
      patrols:[{a:[515,105],b:[515,545],period:6.6,range:285,cone:.48,phase:.31}],
      mines:[], buoys:[], fog:[{x:545,y:335,r:110}]
    },
    {
      name:'Drift mines', brief:'Mines move with the same strange clock as the patrols. Stop to inspect the gap; move when it opens.',
      start:[100,325], goal:[905,325],
      islands:[{x:335,y:0,w:115,h:215},{x:335,y:435,w:115,h:215},{x:650,y:0,w:115,h:215},{x:650,y:435,w:115,h:215}],
      patrols:[],
      mines:[{x:510,y:325,axis:'y',amp:155,speed:1.25,phase:0},{x:590,y:325,axis:'y',amp:155,speed:1.25,phase:Math.PI}], buoys:[], fog:[]
    },
    {
      name:'Two watchers', brief:'Two patrol boats share the channel. Their cycles are different, so a route that is safe once may not stay safe.',
      start:[95,555], goal:[910,95],
      islands:[{x:285,y:205,w:170,h:285},{x:585,y:160,w:150,h:310}],
      patrols:[
        {a:[220,105],b:[780,105],period:7.4,range:230,cone:.42,phase:.08},
        {a:[795,545],b:[505,545],period:5.7,range:220,cone:.43,phase:.44}
      ], mines:[], buoys:[[510,325]], fog:[{x:185,y:285,r:78}]
    },
    {
      name:'Blackwater', brief:'One buoy, two lights, moving mines, a patch of fog. There is room to improvise. There is also room to sink.',
      start:[85,565], goal:[920,90],
      islands:[{x:230,y:235,w:155,h:250},{x:455,y:80,w:120,h:245},{x:620,y:330,w:150,h:245}],
      patrols:[
        {a:[160,110],b:[420,110],period:6.1,range:225,cone:.44,phase:.2},
        {a:[830,540],b:[830,210],period:7.8,range:245,cone:.43,phase:.52}
      ],
      mines:[{x:540,y:455,axis:'x',amp:125,speed:1.4,phase:.7},{x:690,y:180,axis:'y',amp:90,speed:1.1,phase:2.2}],
      buoys:[[410,525]], fog:[{x:550,y:360,r:82}]
    }
  ];

  let view = { scale:1, ox:0, oy:0, dpr:1 };
  let levelIndex = Math.min(Number(localStorage.getItem('night-ferry-last') || 0), levels.length - 1);
  let unlocked = Math.min(Math.max(1, Number(localStorage.getItem('night-ferry-unlocked') || 1)), levels.length);
  let bests = {};
  try { bests = JSON.parse(localStorage.getItem('night-ferry-bests') || '{}') || {}; } catch (_) {}
  let soundOn = localStorage.getItem('night-ferry-sound') !== 'off';
  let audioCtx = null;
  let state = null;
  let lastFrame = performance.now();
  let pointer = { active:false, x:0, y:0 };
  const keys = new Set();
  let wake = [];

  function resize() {
    const rect = stage.getBoundingClientRect();
    view.dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * view.dpr));
    canvas.height = Math.max(1, Math.round(rect.height * view.dpr));
    const s = Math.min(rect.width / WORLD.w, rect.height / WORLD.h);
    view.scale = s;
    view.ox = (rect.width - WORLD.w * s) / 2;
    view.oy = (rect.height - WORLD.h * s) / 2;
  }
  addEventListener('resize', resize);
  resize();

  function tone(freq, duration=.08, type='sine', volume=.035, slide=0) {
    if (!soundOn) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, audioCtx.currentTime + duration);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + duration);
      osc.connect(gain).connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + duration);
    } catch (_) {}
  }
  function vibrate(ms) { if (navigator.vibrate) navigator.vibrate(ms); }
  function showFlash() { ui.flash.classList.remove('on'); void ui.flash.offsetWidth; ui.flash.classList.add('on'); }
  function showToast(text) { ui.toast.textContent = text; ui.toast.classList.remove('on'); void ui.toast.offsetWidth; ui.toast.classList.add('on'); }

  function resetLevel() {
    const l = levels[levelIndex];
    state = {
      player:{x:l.start[0],y:l.start[1],r:13,heading:0},
      worldTime:0, distance:0, collected:new Set(), won:false, failed:false, moving:false
    };
    pointer.active = false; keys.clear(); wake = [];
    ui.levelName.textContent = `${String(levelIndex+1).padStart(2,'0')} / ${l.name}`;
    ui.brief.textContent = l.brief;
    ui.distance.textContent = '0';
    ui.best.textContent = bests[levelIndex] ? Math.round(bests[levelIndex]).toString() : '—';
    ui.next.disabled = levelIndex >= unlocked - 1 && levelIndex < levels.length - 1;
    localStorage.setItem('night-ferry-last', String(levelIndex));
    renderLevelPicker();
  }

  function loadLevel(i) {
    if (i < 0 || i >= levels.length || i >= unlocked) return;
    levelIndex = i; resetLevel(); ui.picker.classList.add('hidden'); tone(330,.06,'triangle',.025,70);
  }

  function renderLevelPicker() {
    ui.levelList.innerHTML = levels.map((l,i) => {
      const locked = i >= unlocked;
      const best = bests[i] ? `${Math.round(bests[i])} m best` : (locked ? 'locked' : 'open');
      return `<button data-level="${i}" ${locked?'disabled':''}><strong>${String(i+1).padStart(2,'0')}</strong>${l.name}<span>${best}</span></button>`;
    }).join('');
    ui.levelList.querySelectorAll('button[data-level]').forEach(b => b.addEventListener('click', () => loadLevel(Number(b.dataset.level))));
  }

  function toWorld(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x:(clientX-r.left-view.ox)/view.scale, y:(clientY-r.top-view.oy)/view.scale };
  }
  canvas.addEventListener('pointerdown', e => {
    const p = toWorld(e.clientX,e.clientY); pointer = {active:true,x:p.x,y:p.y};
    canvas.setPointerCapture?.(e.pointerId); e.preventDefault(); tone(120,.025,'sine',.008,20);
  });
  canvas.addEventListener('pointermove', e => { if (!pointer.active) return; const p=toWorld(e.clientX,e.clientY); pointer.x=p.x; pointer.y=p.y; e.preventDefault(); });
  const endPointer = e => { pointer.active=false; e?.preventDefault?.(); };
  canvas.addEventListener('pointerup', endPointer); canvas.addEventListener('pointercancel', endPointer);
  addEventListener('keydown', e => {
    const k=e.key.toLowerCase(); if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)) { keys.add(k); e.preventDefault(); }
    if (k==='r') resetLevel();
    if (k==='l') ui.picker.classList.remove('hidden');
  });
  addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));

  function circleRect(x,y,r,q) {
    const nx=Math.max(q.x,Math.min(x,q.x+q.w)), ny=Math.max(q.y,Math.min(y,q.y+q.h));
    return (x-nx)*(x-nx)+(y-ny)*(y-ny) < r*r;
  }
  function insideFog(x,y,l) { return l.fog.some(f => (x-f.x)**2 + (y-f.y)**2 < f.r*f.r); }
  function lineHitsRect(x1,y1,x2,y2,q) {
    const steps = 26;
    for (let i=1;i<steps;i++) { const t=i/steps, x=x1+(x2-x1)*t, y=y1+(y2-y1)*t; if (x>q.x&&x<q.x+q.w&&y>q.y&&y<q.y+q.h) return true; }
    return false;
  }
  function blocked(x1,y1,x2,y2,l) { return l.islands.some(q => lineHitsRect(x1,y1,x2,y2,q)); }

  function patrolPose(p,t) {
    let raw = ((t / p.period + p.phase) % 1 + 1) % 1;
    let u = raw * 2;
    let dir = 1;
    if (u > 1) { u = 2-u; dir = -1; }
    const x=p.a[0]+(p.b[0]-p.a[0])*u, y=p.a[1]+(p.b[1]-p.a[1])*u;
    const base=Math.atan2((p.b[1]-p.a[1])*dir,(p.b[0]-p.a[0])*dir);
    const angle=base + Math.sin(t*1.6+p.phase*9)*.24;
    return {x,y,angle};
  }
  function minePose(m,t) {
    const off=Math.sin(t*m.speed+m.phase)*m.amp;
    return {x:m.x+(m.axis==='x'?off:0), y:m.y+(m.axis==='y'?off:0)};
  }
  function angleDelta(a,b) { return Math.atan2(Math.sin(a-b),Math.cos(a-b)); }

  function fail(reason) {
    if (state.failed || state.won) return;
    state.failed=true; pointer.active=false; showFlash(); showToast(reason); tone(95,.32,'sawtooth',.045,-45); vibrate([35,45,80]);
    setTimeout(resetLevel, 720);
  }
  function win() {
    if (state.won || state.failed) return;
    state.won=true; pointer.active=false;
    const meters=Math.round(state.distance);
    if (!bests[levelIndex] || meters < bests[levelIndex]) { bests[levelIndex]=meters; localStorage.setItem('night-ferry-bests',JSON.stringify(bests)); }
    if (levelIndex + 1 < levels.length) {
      unlocked=Math.max(unlocked,levelIndex+2); localStorage.setItem('night-ferry-unlocked',String(unlocked)); ui.next.disabled=false;
    }
    ui.best.textContent=String(Math.round(bests[levelIndex]));
    showToast(levelIndex === levels.length-1 ? 'river crossed' : 'dock reached');
    tone(440,.09,'triangle',.03,160); setTimeout(()=>tone(660,.12,'triangle',.025,100),90); vibrate(35); renderLevelPicker();
  }

  function desiredDirection() {
    let x=0,y=0;
    if (keys.has('arrowleft')||keys.has('a')) x--;
    if (keys.has('arrowright')||keys.has('d')) x++;
    if (keys.has('arrowup')||keys.has('w')) y--;
    if (keys.has('arrowdown')||keys.has('s')) y++;
    if (x||y) { const d=Math.hypot(x,y); return {x:x/d,y:y/d}; }
    if (pointer.active) {
      const dx=pointer.x-state.player.x, dy=pointer.y-state.player.y, d=Math.hypot(dx,dy);
      if (d>18) return {x:dx/d,y:dy/d,limit:d-10};
    }
    return null;
  }

  function update(dt) {
    if (!state || state.failed || state.won) return;
    const l=levels[levelIndex], p=state.player, dir=desiredDirection();
    state.moving=false;
    if (dir) {
      const maxStep=148*dt, step=Math.max(0,Math.min(maxStep,dir.limit ?? maxStep));
      if (step>0) {
        const nx=p.x+dir.x*step, ny=p.y+dir.y*step;
        if (nx-p.r<0||nx+p.r>WORLD.w||ny-p.r<0||ny+p.r>WORLD.h||l.islands.some(q=>circleRect(nx,ny,p.r,q))) { fail('shore'); return; }
        p.x=nx;p.y=ny;p.heading=Math.atan2(dir.y,dir.x);state.distance+=step;state.worldTime+=step/148;state.moving=true;
        if (!reducedMotion && Math.random()<.45) wake.push({x:p.x-Math.cos(p.heading)*16,y:p.y-Math.sin(p.heading)*16,life:1});
      }
    }
    if (state.moving) {
      for (const w of wake) w.life-=dt*1.8; wake=wake.filter(w=>w.life>0);
      l.buoys.forEach((b,i)=>{ if (!state.collected.has(i) && Math.hypot(p.x-b[0],p.y-b[1])<28) { state.collected.add(i); tone(520,.09,'sine',.03,120); vibrate(18); showToast('signal taken'); } });
      for (const m of l.mines) { const mp=minePose(m,state.worldTime); if (Math.hypot(p.x-mp.x,p.y-mp.y)<25) { fail('mine'); return; } }
      if (!insideFog(p.x,p.y,l)) {
        for (const pat of l.patrols) {
          const pp=patrolPose(pat,state.worldTime), dx=p.x-pp.x,dy=p.y-pp.y,d=Math.hypot(dx,dy);
          if (d<pat.range && Math.abs(angleDelta(Math.atan2(dy,dx),pp.angle))<pat.cone && !blocked(pp.x,pp.y,p.x,p.y,l)) { fail('spotted'); return; }
        }
      }
      const g=l.goal;
      if (Math.hypot(p.x-g[0],p.y-g[1])<32 && state.collected.size===l.buoys.length) win();
    }
    ui.distance.textContent=String(Math.round(state.distance));
  }

  function beginDraw() {
    ctx.setTransform(view.dpr*view.scale,0,0,view.dpr*view.scale,view.dpr*view.ox,view.dpr*view.oy);
    ctx.clearRect(-view.ox/view.scale,-view.oy/view.scale,canvas.width/(view.dpr*view.scale),canvas.height/(view.dpr*view.scale));
  }
  function drawWater() {
    ctx.fillStyle=colors.water;ctx.fillRect(0,0,WORLD.w,WORLD.h);
    ctx.lineWidth=1;ctx.strokeStyle=colors.grid;ctx.globalAlpha=.55;
    const shift=(state?.distance||0)%70;
    for(let y=-70+shift;y<WORLD.h+70;y+=70){ctx.beginPath();for(let x=0;x<=WORLD.w;x+=25){const yy=y+Math.sin(x*.018+(state?.worldTime||0)*.5)*5; x?ctx.lineTo(x,yy):ctx.moveTo(x,yy)}ctx.stroke()}
    ctx.globalAlpha=1;
  }
  function drawIsland(q) {
    ctx.fillStyle=colors.land;ctx.strokeStyle=colors.coast;ctx.lineWidth=2;ctx.fillRect(q.x,q.y,q.w,q.h);ctx.strokeRect(q.x+.5,q.y+.5,q.w-1,q.h-1);
    ctx.strokeStyle='#4b5148';ctx.lineWidth=1;for(let i=14;i<q.w;i+=28){ctx.beginPath();ctx.moveTo(q.x+i,q.y+8);ctx.lineTo(q.x+i-11,q.y+q.h-8);ctx.stroke()}
  }
  function drawFog(f) {
    ctx.save();ctx.globalAlpha=.14;ctx.fillStyle=colors.fog;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.3;ctx.strokeStyle=colors.fog;ctx.setLineDash([5,10]);ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);ctx.stroke();ctx.restore();ctx.setLineDash([]);
  }
  function drawPatrol(pat) {
    const p=patrolPose(pat,state.worldTime);
    ctx.save();ctx.globalAlpha=.16;ctx.fillStyle=colors.lamp;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.arc(p.x,p.y,pat.range,p.angle-pat.cone,p.angle+pat.cone);ctx.closePath();ctx.fill();ctx.globalAlpha=.55;ctx.strokeStyle=colors.lamp;ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,pat.range,p.angle-pat.cone,p.angle+pat.cone);ctx.stroke();ctx.restore();
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle=colors.coast;ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-11,-8);ctx.lineTo(-6,0);ctx.lineTo(-11,8);ctx.closePath();ctx.fill();ctx.fillStyle=colors.lamp;ctx.beginPath();ctx.arc(4,0,3,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawMine(m) { const p=minePose(m,state.worldTime);ctx.save();ctx.translate(p.x,p.y);ctx.strokeStyle=colors.rust;ctx.fillStyle='#180b08';ctx.lineWidth=2;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*12,Math.sin(a)*12);ctx.lineTo(Math.cos(a)*20,Math.sin(a)*20);ctx.stroke()}ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore(); }
  function drawGoal(l) {
    const g=l.goal, open=state.collected.size===l.buoys.length;ctx.save();ctx.translate(g[0],g[1]);ctx.strokeStyle=open?colors.ink:colors.rust;ctx.fillStyle='#071b20';ctx.lineWidth=3;ctx.strokeRect(-26,-20,52,40);ctx.beginPath();ctx.moveTo(-17,-11);ctx.lineTo(18,-11);ctx.moveTo(-17,0);ctx.lineTo(18,0);ctx.moveTo(-17,11);ctx.lineTo(18,11);ctx.stroke();if(open){ctx.fillStyle=colors.ink;ctx.fillRect(31,-17,4,34)}ctx.restore();
  }
  function drawBuoy(b,i) { const got=state.collected.has(i);ctx.save();ctx.translate(b[0],b[1]);ctx.strokeStyle=colors.buoy;ctx.fillStyle=got?colors.buoy:'#062228';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(0,-20);ctx.moveTo(-6,-17);ctx.lineTo(6,-17);ctx.stroke();ctx.restore(); }
  function drawPlayer() {
    const p=state.player;
    for(const w of wake){ctx.globalAlpha=Math.max(0,w.life)*.35;ctx.strokeStyle=colors.ink;ctx.lineWidth=1;ctx.beginPath();ctx.arc(w.x,w.y,(1-w.life)*22+3,0,Math.PI*2);ctx.stroke()}ctx.globalAlpha=1;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.heading);ctx.fillStyle=colors.ink;ctx.strokeStyle=colors.rust;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(-12,-8);ctx.lineTo(-8,0);ctx.lineTo(-12,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    if(pointer.active){ctx.strokeStyle='#f2ead555';ctx.lineWidth=1;ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pointer.x,pointer.y);ctx.stroke();ctx.setLineDash([])}
  }
  function draw() {
    if (!state) return; beginDraw(); drawWater(); const l=levels[levelIndex];
    l.fog.forEach(drawFog); l.patrols.forEach(drawPatrol); l.mines.forEach(drawMine); l.islands.forEach(drawIsland); drawGoal(l); l.buoys.forEach(drawBuoy); drawPlayer();
    ctx.setTransform(1,0,0,1,0,0);
  }

  function frame(now) {
    const dt=Math.min(.04,(now-lastFrame)/1000||0); lastFrame=now; update(dt); draw(); requestAnimationFrame(frame);
  }

  ui.start.addEventListener('click',()=>{ui.intro.classList.add('hidden');resetLevel();tone(220,.09,'triangle',.03,110)});
  ui.restart.addEventListener('click',()=>{resetLevel();tone(170,.06,'triangle',.02,70)});
  ui.next.addEventListener('click',()=>{if(levelIndex+1<unlocked&&levelIndex+1<levels.length)loadLevel(levelIndex+1)});
  ui.levels.addEventListener('click',()=>{renderLevelPicker();ui.picker.classList.remove('hidden')});
  ui.closePicker.addEventListener('click',()=>ui.picker.classList.add('hidden'));
  ui.sound.addEventListener('click',()=>{soundOn=!soundOn;localStorage.setItem('night-ferry-sound',soundOn?'on':'off');ui.sound.textContent=soundOn?'sound on':'sound off';if(soundOn)tone(440,.05,'sine',.025,40)});
  ui.sound.textContent=soundOn?'sound on':'sound off';

  resetLevel(); requestAnimationFrame(frame);
})();
