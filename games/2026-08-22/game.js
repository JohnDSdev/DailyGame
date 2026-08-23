const LEVELS=[
 {name:'First take',hint:'Reach the exit. No echo is needed yet.',max:0,map:['########','#S.....#','#.###..#','#....#E#','########']},
 {name:'Hold this',hint:'End a recording on plate a. On the next take, that echo can keep door A open.',max:1,map:['#########','#S....###','#.###.###','#a...AE##','#########']},
 {name:'Relay',hint:'The second recording can use a door opened by the first. Then it can hold a new plate.',max:2,map:['###########','#S....#####','#.###.#####','#a...A.bBE#','###########']},
 {name:'Late arrival',hint:'The door is close. The plate is not. WAIT gives an echo time to reach its mark.',max:1,map:['###########','#S.AE.....#','#.#.#####.#','#.#.......#','#.#.#####.#','#a........#','###########']},
 {name:'Two ends',hint:'Two plates live at opposite ends of the board. Record both, then time the final crossing.',max:2,map:['#############','#S..........#','#.#########.#','#a#########b#','#.#########.#','#...A...B..E#','#############']},
 {name:'Recursive',hint:'Each new recording can depend on every earlier recording. Build the chain one door at a time.',max:3,map:['###############','#S....#########','#.###.#########','#a...A.b.B.cCE#','###############']},
 {name:'Shortcut',hint:'Matching numbered cells are linked. Step on one and you leave through the other.',max:1,map:['#############','#S....#######','#.###.#######','#....A....E##','#1########1a#','#############']},
 {name:'Afterimage',hint:'A ! barrier is strange: you can cross it, but a replaying echo cannot. Use that difference.',max:1,map:['##########','#S.a!A..E#','##########']},
 {name:'Double exposure',hint:'A recording can pass a ! barrier; its echo stops just before it. Park two echoes at once.',max:2,map:['#############','#...a!......#','#S.....A.BE.#','#...b!......#','#############']},
 {name:'Final print',hint:'Everything is in play now. The first echo uses the portal; the second needs the first door and then gets caught by !.',max:2,map:['###############','#S....#########','#.###.#########','#....A..b!B..E#','#1#######1a####','###############']}
];
const COLORS=['#5bd7ff','#ff71b8','#a88cff','#ffb84b'];
const DIR={U:[0,-1],D:[0,1],L:[-1,0],R:[1,0],W:[0,0]};
const canvas=document.getElementById('board'),ctx=canvas.getContext('2d'),frame=document.getElementById('boardFrame');
const ui={levelName:document.getElementById('levelName'),levelCount:document.getElementById('levelCount'),echoCount:document.getElementById('echoCount'),moveCount:document.getElementById('moveCount'),bestCount:document.getElementById('bestCount'),hint:document.getElementById('hint'),intro:document.getElementById('intro'),win:document.getElementById('win'),levels:document.getElementById('levels'),winTitle:document.getElementById('winTitle'),winText:document.getElementById('winText'),levelList:document.getElementById('levelList'),toast:document.getElementById('toast')};
let levelIndex=0,echoes=[],recording=[],won=false,winPending=false,soundOn=true,anim=null,particles=[],toastTimer=0,audioCtx=null,pointerStart=null;
let boardInfo=null,lastSim=null;

function parseLevel(){
 const level=LEVELS[levelIndex],rows=level.map,w=Math.max(...rows.map(r=>r.length)),map=rows.map(r=>r.padEnd(w,'#').split(''));
 let start=[1,1],exit=[1,1];const portals={};
 map.forEach((row,y)=>row.forEach((ch,x)=>{if(ch==='S')start=[x,y];if(ch==='E')exit=[x,y];if(/\d/.test(ch))(portals[ch]??=[]).push([x,y])}));
 boardInfo={map,w,h:map.length,start,exit,portals};
}
function same(a,b){return a[0]===b[0]&&a[1]===b[1]}
function tileAt(p){return boardInfo.map[p[1]]?.[p[0]]??'#'}
function moveOne(pos,action,active,isEcho){
 const [dx,dy]=DIR[action]||DIR.W,n=[pos[0]+dx,pos[1]+dy],ch=tileAt(n);
 if(ch==='#')return [...pos];
 if(isEcho&&ch==='!')return [...pos];
 if(/[ABC]/.test(ch)&&!active.has(ch.toLowerCase()))return [...pos];
 if(/[1-9]/.test(ch)&&boardInfo.portals[ch]?.length===2){const [a,b]=boardInfo.portals[ch];return same(n,a)?[...b]:[...a]}
 return n;
}
function simulate(actions){
 let positions=Array.from({length:echoes.length+1},()=>[...boardInfo.start]);
 const history=[positions.map(p=>[...p])];
 for(let t=0;t<actions.length;t++){
  const active=new Set(positions.map(tileAt).filter(ch=>/[abc]/.test(ch)));
  positions=positions.map((p,i)=>moveOne(p,i<echoes.length?(echoes[i][t]||'W'):actions[t],active,i<echoes.length));
  history.push(positions.map(p=>[...p]));
 }
 return {positions,history,active:new Set(positions.map(tileAt).filter(ch=>/[abc]/.test(ch)))};
}
function current(){lastSim=simulate(recording);return lastSim}
function totalMoves(){return echoes.reduce((n,e)=>n+e.length,0)+recording.length}
function bestKey(){return `afterimage-best-${levelIndex}`}
function getBest(){try{return JSON.parse(localStorage.getItem(bestKey())||'null')}catch{return null}}
function saveBest(){const score={e:echoes.length,m:totalMoves()},old=getBest();if(!old||score.e<old.e||(score.e===old.e&&score.m<old.m))localStorage.setItem(bestKey(),JSON.stringify(score));localStorage.setItem('afterimage-progress',String(Math.max(Number(localStorage.getItem('afterimage-progress')||0),levelIndex+1)))}
function updateUI(){const l=LEVELS[levelIndex],b=getBest();ui.levelName.textContent=l.name;ui.levelCount.textContent=`LEVEL ${String(levelIndex+1).padStart(2,'0')} / ${String(LEVELS.length).padStart(2,'0')}`;ui.echoCount.textContent=echoes.length;ui.moveCount.textContent=recording.length;ui.bestCount.textContent=b?`${b.e}E / ${b.m}M`:'—';ui.hint.textContent=l.hint;document.getElementById('undoBtn').disabled=!recording.length;document.getElementById('commitBtn').disabled=l.max===0||echoes.length>=l.max;renderLevelList()}
function loadLevel(i){levelIndex=Math.max(0,Math.min(LEVELS.length-1,i));echoes=[];recording=[];won=false;winPending=false;anim=null;particles=[];parseLevel();current();ui.win.classList.add('hidden');ui.levels.classList.add('hidden');updateUI();resize();beep(340,.04,'square',.025)}
function action(a){if(won||winPending||anim)return;const old=current().positions.map(p=>[...p]),next=[...recording,a];recording=next;const res=current(),now=res.positions.map(p=>[...p]);anim={from:old,to:now,start:performance.now(),duration:115};const moved=!same(old.at(-1),now.at(-1));beep(moved?420:130,.025,moved?'sine':'square',.022);if(navigator.vibrate&&moved)navigator.vibrate(5);updateUI();if(same(now.at(-1),boardInfo.exit)){winPending=true;setTimeout(complete,145)}}
function commitEcho(){if(won||winPending||anim)return;if(!recording.length){toast('MAKE A MOVE FIRST');return}if(echoes.length>=LEVELS[levelIndex].max){toast('NO MORE ECHOES ON THIS LEVEL');return}echoes.push([...recording]);recording=[];current();anim=null;burst(boardInfo.start[0],boardInfo.start[1],18,COLORS[(echoes.length-1)%COLORS.length]);beep(190,.08,'square',.04);setTimeout(()=>beep(380,.08,'square',.03),60);updateUI()}
function undo(){if(won||winPending||anim||!recording.length)return;recording.pop();current();beep(180,.03,'sine',.02);updateUI()}
function restart(){echoes=[];recording=[];won=false;winPending=false;anim=null;particles=[];current();ui.win.classList.add('hidden');beep(150,.05,'square',.02);updateUI()}
function complete(){if(won)return;winPending=false;won=true;saveBest();const b=getBest();ui.winTitle.textContent=levelIndex===LEVELS.length-1?'ALL TEN.':'CLEAN TAKE.';ui.winText.textContent=`Solved with ${echoes.length} echo${echoes.length===1?'':'es'} and ${totalMoves()} recorded moves. Best here: ${b.e} echo${b.e===1?'':'es'}, ${b.m} moves.`;document.getElementById('nextBtn').textContent=levelIndex===LEVELS.length-1?'LEVEL 01 →':'NEXT LEVEL →';burst(boardInfo.exit[0],boardInfo.exit[1],80,'#dfff3f');beep(520,.12,'triangle',.05);setTimeout(()=>beep(780,.18,'triangle',.05),110);setTimeout(()=>ui.win.classList.remove('hidden'),420);updateUI()}
function toast(msg){clearTimeout(toastTimer);ui.toast.textContent=msg;ui.toast.classList.add('show');toastTimer=setTimeout(()=>ui.toast.classList.remove('show'),1200)}
function beep(freq,dur,type='sine',vol=.03){if(!soundOn)return;try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur)}catch{}}
function burst(gx,gy,n,color){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=.35+Math.random()*1.3;particles.push({gx,gy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,color})}}

function resize(){const r=frame.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);draw()}
window.addEventListener('resize',resize);
function metrics(){const W=canvas.clientWidth,H=canvas.clientHeight,pad=Math.max(12,Math.min(W,H)*.05),cell=Math.floor(Math.min((W-pad*2)/boardInfo.w,(H-pad*2)/boardInfo.h)),bw=cell*boardInfo.w,bh=cell*boardInfo.h;return{W,H,cell,ox:(W-bw)/2,oy:(H-bh)/2}}
function gp(p,m){return[m.ox+(p[0]+.5)*m.cell,m.oy+(p[1]+.5)*m.cell]}
function drawGrid(m,active){
 const {cell,ox,oy}=m;
 for(let y=0;y<boardInfo.h;y++)for(let x=0;x<boardInfo.w;x++){
  const ch=boardInfo.map[y][x],px=ox+x*cell,py=oy+y*cell;
  if(ch==='#'){ctx.fillStyle='#090909';ctx.fillRect(px,py,cell,cell);ctx.strokeStyle='#121212';ctx.strokeRect(px+.5,py+.5,cell-1,cell-1);continue}
  ctx.fillStyle='#171717';ctx.fillRect(px,py,cell,cell);ctx.strokeStyle='#292929';ctx.strokeRect(px+.5,py+.5,cell-1,cell-1);
  const cx=px+cell/2,cy=py+cell/2;
  if(ch==='S'){ctx.fillStyle='#69665f';ctx.font=`700 ${Math.max(8,cell*.24)}px Courier New`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('START',cx,cy)}
  if(ch==='E'){ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.PI/4);ctx.strokeStyle='#dfff3f';ctx.lineWidth=Math.max(2,cell*.06);ctx.strokeRect(-cell*.22,-cell*.22,cell*.44,cell*.44);ctx.restore()}
  if(/[abc]/.test(ch)){const on=active.has(ch);ctx.beginPath();ctx.arc(cx,cy,cell*.25,0,Math.PI*2);ctx.fillStyle=on?'#ff4b24':'#171717';ctx.fill();ctx.strokeStyle='#ff4b24';ctx.lineWidth=Math.max(1.5,cell*.05);ctx.stroke();ctx.fillStyle=on?'#111':'#ff4b24';ctx.font=`700 ${Math.max(9,cell*.28)}px Courier New`;ctx.fillText(ch,cx,cy+.5)}
  if(/[ABC]/.test(ch)){const open=active.has(ch.toLowerCase());ctx.strokeStyle=open?'#55524c':'#f1eee5';ctx.lineWidth=Math.max(2,cell*.08);for(let k=-1;k<=1;k++) {ctx.beginPath();ctx.moveTo(cx+k*cell*.16,py+cell*.18);ctx.lineTo(cx+k*cell*.16,py+cell*.82);ctx.stroke()}ctx.fillStyle=open?'#77736b':'#f1eee5';ctx.font=`700 ${Math.max(8,cell*.2)}px Courier New`;ctx.fillText(ch,cx,cy)}
  if(ch==='!'){ctx.strokeStyle='#ff4b24';ctx.lineWidth=Math.max(1.5,cell*.045);for(let k=-2;k<=2;k++){ctx.beginPath();ctx.moveTo(px+cell*.18,cy+k*cell*.1);ctx.lineTo(px+cell*.82,cy+k*cell*.1);ctx.stroke()}ctx.fillStyle='#ff4b24';ctx.font=`700 ${Math.max(8,cell*.22)}px Courier New`;ctx.fillText('!',cx,cy)}
  if(/[1-9]/.test(ch)){ctx.beginPath();ctx.arc(cx,cy,cell*.29,0,Math.PI*2);ctx.strokeStyle='#a88cff';ctx.lineWidth=Math.max(2,cell*.055);ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,cell*.11,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#a88cff';ctx.font=`700 ${Math.max(8,cell*.2)}px Courier New`;ctx.fillText(ch,cx,cy)}
 }
}
function drawTrail(m,sim){if(recording.length<1)return;const hist=sim.history,idx=echoes.length;ctx.beginPath();hist.forEach((positions,i)=>{const [x,y]=gp(positions[idx],m);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.strokeStyle='rgba(223,255,63,.32)';ctx.lineWidth=Math.max(2,m.cell*.06);ctx.stroke()}
function actorPositions(now){const sim=current(),base=sim.positions;if(!anim)return base;const t=Math.min(1,(now-anim.start)/anim.duration),e=1-Math.pow(1-t,3);if(t>=1){anim=null;return base}return anim.from.map((p,i)=>[p[0]+(anim.to[i][0]-p[0])*e,p[1]+(anim.to[i][1]-p[1])*e])}
function drawActors(m,positions){positions.forEach((p,i)=>{const [x,y]=gp(p,m),isCurrent=i===positions.length-1,size=m.cell*.43;ctx.save();ctx.translate(x,y);if(isCurrent){ctx.fillStyle='#dfff3f';ctx.fillRect(-size/2,-size/2,size,size);ctx.fillStyle='#111';ctx.fillRect(-size*.13,-size*.13,size*.26,size*.26)}else{ctx.strokeStyle=COLORS[i%COLORS.length];ctx.globalAlpha=.92;ctx.lineWidth=Math.max(2,m.cell*.065);ctx.strokeRect(-size/2,-size/2,size,size);ctx.globalAlpha=.22;ctx.fillStyle=COLORS[i%COLORS.length];ctx.fillRect(-size/2,-size/2,size,size)}ctx.restore()})}
function drawParticles(m){for(const p of particles){p.gx+=p.vx*.035;p.gy+=p.vy*.035;p.vx*=.97;p.vy*=.97;p.life-=.025;const [x,y]=gp([p.gx,p.gy],m);ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(x-2,y-2,4,4)}ctx.globalAlpha=1;particles=particles.filter(p=>p.life>0)}
function draw(now=performance.now()){if(!boardInfo)return;const m=metrics();ctx.clearRect(0,0,m.W,m.H);ctx.fillStyle='#111';ctx.fillRect(0,0,m.W,m.H);const sim=current();drawGrid(m,sim.active);drawTrail(m,sim);drawActors(m,actorPositions(now));drawParticles(m)}
function loop(t){draw(t);requestAnimationFrame(loop)}requestAnimationFrame(loop);

function renderLevelList(){if(!boardInfo)return;const progress=Number(localStorage.getItem('afterimage-progress')||0);ui.levelList.innerHTML=LEVELS.map((l,i)=>{const b=(()=>{try{return JSON.parse(localStorage.getItem(`afterimage-best-${i}`)||'null')}catch{return null}})();return `<button class="level-pick" data-level="${i}"><span class="num">${String(i+1).padStart(2,'0')}</span><strong>${l.name}</strong><span class="done">${b?`${b.e}E / ${b.m}M`:i<=progress?'OPEN':'OPEN'}</span></button>`}).join('');ui.levelList.querySelectorAll('button').forEach(b=>b.onclick=()=>loadLevel(Number(b.dataset.level)))}

document.getElementById('undoBtn').onclick=undo;document.getElementById('waitBtn').onclick=()=>action('W');document.getElementById('commitBtn').onclick=commitEcho;document.getElementById('restartBtn').onclick=restart;document.getElementById('levelsBtn').onclick=()=>ui.levels.classList.remove('hidden');document.getElementById('closeLevels').onclick=()=>ui.levels.classList.add('hidden');document.getElementById('helpBtn').onclick=()=>{document.getElementById('startBtn').textContent='RETURN TO GAME →';ui.intro.classList.remove('hidden')};document.getElementById('startBtn').onclick=()=>{ui.intro.classList.add('hidden');beep(440,.05,'square',.025)};document.getElementById('replayBtn').onclick=()=>{ui.win.classList.add('hidden');restart()};document.getElementById('nextBtn').onclick=()=>loadLevel(levelIndex===LEVELS.length-1?0:levelIndex+1);document.getElementById('soundBtn').onclick=(e)=>{soundOn=!soundOn;e.currentTarget.textContent=soundOn?'SOUND ON':'SOUND OFF';if(soundOn)beep(500,.04,'square',.02)};
addEventListener('keydown',e=>{if(!ui.intro.classList.contains('hidden')||!ui.win.classList.contains('hidden')||!ui.levels.classList.contains('hidden'))return;const k={ArrowUp:'U',KeyW:'U',ArrowDown:'D',KeyS:'D',ArrowLeft:'L',KeyA:'L',ArrowRight:'R',KeyD:'R',Space:'W'}[e.code];if(k){e.preventDefault();action(k)}else if(e.code==='Enter'){e.preventDefault();commitEcho()}else if(e.code==='KeyZ'){e.preventDefault();undo()}else if(e.code==='KeyR'){e.preventDefault();restart()}});
frame.addEventListener('pointerdown',e=>{pointerStart=[e.clientX,e.clientY];frame.setPointerCapture?.(e.pointerId)});frame.addEventListener('pointerup',e=>{if(!pointerStart)return;const dx=e.clientX-pointerStart[0],dy=e.clientY-pointerStart[1];pointerStart=null;if(Math.hypot(dx,dy)<24)return;action(Math.abs(dx)>Math.abs(dy)?(dx>0?'R':'L'):(dy>0?'D':'U'))});frame.addEventListener('pointercancel',()=>pointerStart=null);
parseLevel();current();updateUI();resize();
