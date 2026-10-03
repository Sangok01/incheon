/* =====================================================================
   리리와 함께하는 인천 세계시민 탐험 — 비주얼 노벨 엔진 (외부 라이브러리 없음)
   ===================================================================== */
'use strict';
const $ = s => document.querySelector(s);
const stage = $('#stage'), overlay = $('#overlay');
const wait = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const won = n => n.toLocaleString('ko-KR') + '원';
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { for(let i = arr.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const LB_KEY = 'incheon-gc-vn-board-v1';

/* ---------- 화면 맞추기 ---------- */
let SCALE = 1;
function fit(){
  SCALE = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  stage.style.transform = `translate(-50%,-50%) scale(${SCALE})`;
}
window.addEventListener('resize', fit); fit();
/* 화면 좌표 → 무대(1920×1080) 좌표 */
function toStage(e){ const r = stage.getBoundingClientRect(); return { x:(e.clientX - r.left) / SCALE, y:(e.clientY - r.top) / SCALE }; }
function centerOf(el){ const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(); return { x:(r.left + r.width / 2 - s.left) / SCALE, y:(r.top + r.height / 2 - s.top) / SCALE }; }

/* ---------- 게임 상태 ---------- */
const G = {};
function resetGame(name){
  Object.assign(G, {
    name, money:START_MONEY, score:Object.fromEntries(CATS.map(([k]) => [k, 0])),
    choiceLog:[], gameLog:[], quizLog:[], ticketLog:[], badges:[],
    flags:{}, passed:0, combo:0, lotterySpent:0, lotteryWon:0, sceneIdx:-1, final:null,
  });
  refreshHud(true);
}
const totalScore = () => Object.values(G.score).reduce((a, b) => a + b, 0);

/* ---------- 소리 ---------- */
let muted = false, music = null, musicName = null, actx = null;
try{ muted = localStorage.getItem('igc-muted') === '1'; }catch(e){}
function snd(name, vol = .8){
  if(muted) return;
  try{ const a = new Audio(`assets/audio/${name}.mp3`); a.volume = vol; a.play().catch(()=>{}); }catch(e){}
}
function beep(freq = 880, dur = .08, vol = .15, type = 'sine'){
  if(muted) return;
  try{
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + dur);
    o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + dur);
  }catch(e){}
}
function playMusic(name){
  if(musicName === name && music) return;
  if(music) music.pause();
  musicName = name;
  try{ music = new Audio(`assets/audio/${name}.mp3`); music.loop = true; music.volume = .4; if(!muted) music.play().catch(()=>{}); }catch(e){}
}
function toggleSound(){
  muted = !muted;
  try{ localStorage.setItem('igc-muted', muted ? '1' : '0'); }catch(e){}
  $('#btnSound').textContent = muted ? '🔇' : '🔊';
  if(music){ if(muted) music.pause(); else music.play().catch(()=>{}); }
}
$('#btnSound').textContent = muted ? '🔇' : '🔊';
$('#btnSound').onclick = e => { e.stopPropagation(); toggleSound(); };
/* 브라우저는 첫 터치 전에는 소리를 막아요 → 첫 터치 때 음악 다시 재생 */
document.addEventListener('pointerdown', () => { if(music && music.paused && !muted) music.play().catch(()=>{}); }, { once:false });

/* ---------- 배경 ---------- */
let bgFront = 'A';
function bg(name){
  const next = bgFront === 'A' ? $('#bgB') : $('#bgA');
  const cur  = bgFront === 'A' ? $('#bgA') : $('#bgB');
  next.src = `assets/bg/${name}.webp`;
  next.style.opacity = 1; cur.style.opacity = 0;
  bgFront = bgFront === 'A' ? 'B' : 'A';
  setAmbient(name);
}

/* ---------- 캐릭터 ---------- */
const chars = {};
const CHAR_Y = { riri:-30, sasha:0, minjun:0 };
function show(id, pose = 'normal', x){
  let el = chars[id], fresh = false;
  if(!el){ el = document.createElement('img'); el.className = 'char'; el.alt = ''; $('#chars').appendChild(el); chars[id] = el; }
  if(!el.classList.contains('on')) fresh = true;
  el.src = `assets/char/${id}_${pose}.webp`;
  if(x === undefined) x = el.dataset.x ? +el.dataset.x : (id === 'riri' ? .78 : .5);
  el.dataset.x = x;
  el.style.left = (x * 1920 - 380) + 'px';
  el.style.bottom = (-40 - (CHAR_Y[id] || 0)) + 'px';
  if(id === 'riri') el.classList.add('float');
  el.classList.add('on');
  if(fresh){ el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); }
  if(pose === 'happy') emote(id, pick(['✨', '💖', '🎵']));
  else if(pose === 'wow') emote(id, '❗');
  else if(pose === 'think') emote(id, '❓');
  else if(pose === 'sad') { emote(id, '💧'); anim(id, 'sad'); }
  else if(pose === 'sorry') emote(id, '💦');
}
function hide(id){ const el = chars[id]; if(el) el.classList.remove('on', 'talk'); }
function hideAll(){ Object.keys(chars).forEach(hide); }
function anim(id, cls){ const el = chars[id]; if(!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 900); }
const hop = id => anim(id, 'hop');
function emote(id, sym){
  const el = chars[id]; if(!el) return;
  const e = document.createElement('div'); e.className = 'emote'; e.textContent = sym;
  e.style.left = (parseFloat(el.style.left) + 470) + 'px'; e.style.top = (id === 'riri' ? 70 : 140) + 'px';
  $('#chars').appendChild(e); setTimeout(() => e.remove(), 1400);
}

/* ---------- 대사 ---------- */
const NAMES = { riri:'리리', sasha:'사샤', minjun:'민준', mom:'엄마', h:'해설사 선생님', g:'가게 사장님', lotto:'복권방 아저씨' };
let advance = null, typing = null;
function fmt(s){ return esc(String(s).replace(/\{name\}/g, G.name || '탐험가')).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
function tokens(html){ const out = []; const re = /(<[^>]+>|&[a-z#0-9]+;|[\s\S])/g; let m; while((m = re.exec(html))) out.push(m[0]); return out; }
function say(who, text){
  return new Promise(resolve => {
    const tb = $('#textbox'), nb = $('#namebox'), tx = $('#text');
    tb.classList.remove('hidden');
    nb.className = who || '';
    nb.textContent = who === 'me' ? G.name : (who ? (NAMES[who] || who) : '');
    tx.className = who ? '' : 'narr';
    Object.entries(chars).forEach(([k, el]) => el.classList.toggle('talk', k === who && el.classList.contains('on')));
    const toks = tokens(fmt(text)); let i = 0; tx.innerHTML = ''; $('#ctc').style.visibility = 'hidden';
    const finish = () => { clearInterval(typing); typing = null; tx.innerHTML = toks.join(''); $('#ctc').style.visibility = 'visible';
      Object.values(chars).forEach(el => el.classList.remove('talk')); };
    typing = setInterval(() => { i++; tx.innerHTML = toks.slice(0, i).join(''); if(i % 3 === 0 && who) beep(who === 'riri' ? 1200 : 700, .025, .03, 'square'); if(i >= toks.length) finish(); }, 24);
    advance = () => { if(typing){ finish(); return; } advance = null; resolve(); };
  });
}
const narr = t => say(null, t);
function hideText(){ $('#textbox').classList.add('hidden'); }
stage.addEventListener('click', e => {
  if(e.target.closest('#overlay > *') || e.target.closest('#hud')) return;
  if(advance) advance();
});
document.addEventListener('keydown', e => {
  if((e.key === ' ' || e.key === 'Enter') && advance && !overlay.children.length){ e.preventDefault(); advance(); }
});

/* ---------- 상단 정보 ---------- */
function hud(on = true){ $('#hud').classList.toggle('hidden', !on); }
let lastHud = {};
function bumpPill(id){ const el = $(id); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
function refreshHud(silent){
  const sc = totalScore();
  $('#hudScore').textContent = `⭐ ${sc}점`;
  $('#hudMoney').textContent = `💰 ${won(G.money)}`;
  $('#hudPass').textContent = `통과 ${G.passed}/${SCENE_ORDER.length}`;
  $('#badgeCount').textContent = G.badges.length;
  $('#hudRoute').innerHTML = SCENE_ORDER.map((s, i) => `<i class="${i < G.sceneIdx ? 'done' : i === G.sceneIdx ? 'now' : ''}">${SCENES[s].icon}</i>`).join('');
  const c = $('#hudCombo'); c.classList.toggle('on', G.combo >= 2); c.textContent = `🔥 ${G.combo}연속`;
  if(!silent){
    if(lastHud.sc !== undefined && sc !== lastHud.sc) bumpPill('#hudScore');
    if(lastHud.money !== undefined && G.money !== lastHud.money) bumpPill('#hudMoney');
    if(lastHud.passed !== undefined && G.passed !== lastHud.passed) bumpPill('#hudPass');
  }
  lastHud = { sc, money:G.money, passed:G.passed };
}
function toast(msg, cls = ''){
  const t = document.createElement('div'); t.textContent = msg; if(cls) t.className = cls;
  $('#toast').appendChild(t); setTimeout(() => t.remove(), 2500);
}
function placeCard(sid){
  const s = SCENES[sid];
  $('#hudPlace').textContent = `📍 ${s.short}`;
  $('#placecard').innerHTML = `<div class="pc"><div class="s">읽걷쓰 4P · ${esc(s.step)}</div><div class="n">${esc(s.place)}</div><div class="t">${esc(s.topic)}</div></div>`;
}

/* ---------- 효과(파티클) ---------- */
const fxc = $('#fx').getContext('2d');
let parts = [], fxRunning = false;
const CONF = ['#f28b6b', '#f4b942', '#5fa99b', '#8f86c4', '#7d8fd6', '#ffffff', '#e98bb0'];
function fxLoop(){
  fxc.clearRect(0, 0, 1920, 1080);
  parts = parts.filter(p => p.life > 0);
  for(const p of parts){
    p.life -= 1; p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    const a = Math.min(1, p.life / 30);
    fxc.save(); fxc.globalAlpha = a; fxc.translate(p.x, p.y); fxc.rotate(p.rot);
    if(p.kind === 'rect'){ fxc.fillStyle = p.c; fxc.fillRect(-p.s, -p.s * .45, p.s * 2, p.s * .9); }
    else if(p.kind === 'text'){ fxc.font = `${p.s}px sans-serif`; fxc.textAlign = 'center'; fxc.fillText(p.t, 0, 0); }
    else if(p.kind === 'star'){ fxc.fillStyle = p.c; fxc.beginPath(); for(let i = 0; i < 10; i++){ const r = i % 2 ? p.s * .45 : p.s; const an = i * Math.PI / 5; fxc.lineTo(Math.cos(an) * r, Math.sin(an) * r); } fxc.fill(); }
    else { fxc.fillStyle = p.c; fxc.beginPath(); fxc.arc(0, 0, p.s, 0, Math.PI * 2); fxc.fill(); }
    fxc.restore();
  }
  if(parts.length) requestAnimationFrame(fxLoop); else { fxRunning = false; fxc.clearRect(0, 0, 1920, 1080); }
}
function addParts(arr){ parts.push(...arr); if(!fxRunning){ fxRunning = true; requestAnimationFrame(fxLoop); } }
const fx = {
  confetti(n = 160){
    addParts(Array.from({length:n}, () => ({ kind:'rect', x:rnd(0, 1920), y:rnd(-300, -20), vx:rnd(-3, 3), vy:rnd(4, 10), g:.12, drag:.995, rot:rnd(0, 6), vr:rnd(-.2, .2), s:rnd(8, 16), c:pick(CONF), life:rnd(150, 230) })));
  },
  burst(x, y, n = 36, colors = CONF, kind = 'star'){
    addParts(Array.from({length:n}, () => { const a = rnd(0, Math.PI * 2), v = rnd(6, 18);
      return { kind, x, y, vx:Math.cos(a) * v, vy:Math.sin(a) * v, g:.35, drag:.95, rot:rnd(0, 6), vr:rnd(-.3, .3), s:rnd(8, 18), c:pick(colors), life:rnd(40, 70) }; }));
  },
  coins(x, y, n = 14){
    addParts(Array.from({length:n}, () => ({ kind:'text', t:'🪙', x, y, vx:rnd(-9, 9), vy:rnd(-22, -10), g:.9, drag:.99, rot:rnd(-1, 1), vr:rnd(-.2, .2), s:rnd(44, 64), life:rnd(55, 80) })));
  },
  emoji(x, y, t, n = 10){
    addParts(Array.from({length:n}, () => ({ kind:'text', t, x, y, vx:rnd(-8, 8), vy:rnd(-16, -6), g:.5, drag:.98, rot:rnd(-.5, .5), vr:rnd(-.1, .1), s:rnd(50, 80), life:rnd(50, 80) })));
  },
  smoke(x, y){
    addParts(Array.from({length:24}, () => { const a = rnd(0, Math.PI * 2), v = rnd(2, 9);
      return { kind:'dot', x, y, vx:Math.cos(a) * v, vy:Math.sin(a) * v - 2, g:-.05, drag:.93, rot:0, vr:0, s:rnd(14, 34), c:pick(['#8a7f73', '#b9b0a4', '#6d6a7c']), life:rnd(30, 55) }; }));
  },
};
function shake(){ stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake'); }
function flash(color = '#fff'){ const f = $('#flash'); f.style.background = color; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }

/* 배경 분위기 효과 (바다 물방울, 꽃잎, 반짝임, 별) */
const amb = $('#ambient').getContext('2d');
let ambParts = [], ambKind = 'dust';
const AMB_KIND = { title:'bubble', museum:'bubble', baengnyeong:'bubble', home:'dust', hambak:'petal', sinpo:'lantern', songdo:'leaf', ganghwa:'petal', library:'dust', ending:'star' };
function setAmbient(name){
  ambKind = AMB_KIND[name] || 'dust';
  ambParts = Array.from({length: ambKind === 'star' ? 60 : 26}, () => newAmb(true));
}
function newAmb(init){
  const p = { x:rnd(0, 1920), y:init ? rnd(0, 1080) : (ambKind === 'bubble' || ambKind === 'lantern' ? 1100 : -20), s:rnd(4, 12), t:rnd(0, 6), sp:rnd(.4, 1.2) };
  return p;
}
(function ambLoop(){
  amb.clearRect(0, 0, 1920, 1080);
  for(const p of ambParts){
    p.t += .02;
    if(ambKind === 'bubble' || ambKind === 'lantern'){ p.y -= p.sp; p.x += Math.sin(p.t) * .6; }
    else if(ambKind === 'star'){ /* twinkle */ }
    else { p.y += p.sp; p.x += Math.sin(p.t) * 1.2; }
    if(p.y < -30 || p.y > 1110) Object.assign(p, newAmb(false));
    amb.globalAlpha = ambKind === 'star' ? .4 + .5 * Math.abs(Math.sin(p.t * 2)) : .55;
    if(ambKind === 'bubble'){ amb.strokeStyle = '#ffffff'; amb.lineWidth = 2; amb.beginPath(); amb.arc(p.x, p.y, p.s + 4, 0, 7); amb.stroke(); }
    else if(ambKind === 'petal'){ amb.fillStyle = '#f7c6d0'; amb.beginPath(); amb.ellipse(p.x, p.y, p.s + 3, p.s * .55, p.t, 0, 7); amb.fill(); }
    else if(ambKind === 'leaf'){ amb.fillStyle = '#a5d0a0'; amb.beginPath(); amb.ellipse(p.x, p.y, p.s + 4, p.s * .5, p.t, 0, 7); amb.fill(); }
    else if(ambKind === 'lantern'){ amb.fillStyle = '#ffd98a'; amb.beginPath(); amb.arc(p.x, p.y, p.s * .6, 0, 7); amb.fill(); }
    else if(ambKind === 'star'){ amb.fillStyle = '#fffbe8'; amb.beginPath(); amb.arc(p.x, p.y * .65, p.s * .35, 0, 7); amb.fill(); }
    else { amb.fillStyle = '#fff6dc'; amb.beginPath(); amb.arc(p.x, p.y, p.s * .4, 0, 7); amb.fill(); }
  }
  amb.globalAlpha = 1;
  requestAnimationFrame(ambLoop);
})();

/* ---------- 오버레이 ---------- */
function openOverlay(html){ $('#placecard').innerHTML = ''; overlay.innerHTML = html; return overlay.firstElementChild; }
function closeOverlay(){ overlay.innerHTML = ''; }

/* ---------- 미션 선택 (제한시간) → 번호, 시간 초과는 -1 ---------- */
function mission(q, opts, seconds, head, kind = ''){
  hideText();
  return new Promise(resolve => {
    const el = openOverlay(`<div class="dim"><div class="q ${kind}"><small>${esc(head)}</small>${fmt(q)}</div>
      ${seconds ? `<div class="timer" id="mt"><div class="tbar"><i id="mtBar" style="width:100%"></i></div><div class="tnum" id="mtNum">${seconds}초</div></div>` : ''}
      ${opts.map((o, i) => `<button class="opt" data-i="${i}"><span class="num">${i + 1}</span><span>${fmt(o)}</span></button>`).join('')}</div>`);
    let done = false, t0 = performance.now(), lastSec = seconds, iv = null;
    const end = i => {
      if(done) return; done = true; clearInterval(iv); document.removeEventListener('keydown', key);
      if(i >= 0){ const b = el.querySelector(`.opt[data-i="${i}"]`); b.classList.add('picked'); snd('sfx_click'); }
      setTimeout(() => { closeOverlay(); resolve(i); }, i >= 0 ? 280 : 100);
    };
    const key = e => { const n = parseInt(e.key, 10); if(n >= 1 && n <= opts.length) end(n - 1); };
    document.addEventListener('keydown', key);
    el.querySelectorAll('.opt').forEach(b => b.onclick = () => end(+b.dataset.i));
    if(seconds){
      iv = setInterval(() => {
        const left = Math.max(0, seconds - (performance.now() - t0) / 1000);
        el.querySelector('#mtBar').style.width = (left / seconds * 100) + '%';
        const sec = Math.ceil(left);
        el.querySelector('#mtNum').textContent = `${sec}초`;
        el.querySelector('#mt').classList.toggle('warn', left <= 5);
        if(sec !== lastSec){ lastSec = sec; if(sec <= 5 && sec > 0) beep(sec <= 2 ? 1320 : 990, .09, .18); }
        if(left <= 0){ beep(220, .4, .2, 'sawtooth'); end(-1); }
      }, 100);
    }
  });
}

/* 결과 카드 */
function card({ head, color = '#3b3a4a', answer = '', gains = [], cost = 0, text = '', btn = '다음으로 ▶' }){
  hideText();
  return new Promise(resolve => {
    const tags = gains.map(([n, v]) => `<span class="tag">${esc(n)} +${v}</span>`).join('') + (cost ? `<span class="tag minus">용돈 −${won(cost)}</span>` : '');
    const el = openOverlay(`<div class="dim"><div class="card"><h2 style="color:${color}">${fmt(head)}</h2>
      ${answer ? `<div class="answer">정답: ${fmt(answer)}</div>` : ''}${tags ? `<div class="tags">${tags}</div>` : ''}<p>${fmt(text)}</p><button class="big">${esc(btn)}</button></div></div>`);
    const go = () => { document.removeEventListener('keydown', key); snd('sfx_click'); closeOverlay(); resolve(); };
    const key = e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } };
    setTimeout(() => document.addEventListener('keydown', key), 300);
    el.querySelector('.big').onclick = go;
  });
}
function celebrate(tag){
  if(tag === 'best'){ snd('sfx_best'); fx.confetti(120); fx.burst(960, 400, 40); }
  else if(tag === 'ok'){ snd('sfx_ok'); fx.burst(960, 400, 18, ['#f4b942', '#ffffff']); }
  else { snd('sfx_low'); shake(); fx.smoke(960, 420); }
}

/* ---------- 배지 ---------- */
function badge(id){
  if(!BADGES[id] || G.badges.includes(id)) return;
  G.badges.push(id); refreshHud();
  setTimeout(() => { toast(`${BADGES[id].icon} 배지 획득! ${BADGES[id].name}`, 'badge'); beep(1568, .12, .12); beep(2093, .2, .1); }, 400);
}
function badgeGridHTML(){
  return `<div class="badgegrid">${Object.entries(BADGES).map(([k, b]) => `<div class="bd ${G.badges.includes(k) ? '' : 'off'}"><div class="i">${b.icon}</div><div class="n">${esc(b.name)}</div><div class="d">${esc(b.desc)}</div></div>`).join('')}</div>`;
}
$('#btnBadge').onclick = e => {
  e.stopPropagation();
  if(overlay.children.length) return;
  const keepAdv = advance;
  const el = openOverlay(`<div class="dim"><div class="modal"><h2>🏅 업적 배지 ${G.badges.length}/${Object.keys(BADGES).length}</h2>${badgeGridHTML()}<button class="big sub x">닫기</button></div></div>`);
  el.querySelector('.x').onclick = () => { closeOverlay(); advance = keepAdv; };
};

/* ---------- 이동 지도 애니메이션 ---------- */
async function travel(sid){
  const to = SCENE_ORDER.indexOf(sid), from = Math.max(0, to - 1);
  hideText(); hideAll();
  const n = SCENE_ORDER.length, pos = i => 60 + i * (1500 - 120) / (n - 1);
  const el = openOverlay(`<div class="dim"><div class="travel"><h3>🚌 다음 장소로 이동 중… <b>${esc(SCENES[sid].place)}</b></h3>
    <div class="route"><div class="line"></div>${SCENE_ORDER.map((s, i) => `<div class="stop ${i < to ? 'done' : i === to ? 'next' : ''}" style="left:${pos(i)}px"><i>${SCENES[s].icon}</i><span>${esc(SCENES[s].short)}</span></div>`).join('')}
    <div class="bus" id="bus" style="left:${pos(from)}px">🚌</div></div></div></div>`);
  snd('sfx_whoosh');
  await wait(250); el.querySelector('#bus').style.left = pos(to) + 'px';
  await wait(1500);
  closeOverlay();
}

/* ---------- 점수 처리 ---------- */
function applyChoice(sid, idx){
  const info = SCENES[sid];
  if(idx === null || idx < 0){
    G.choiceLog.push({ place:info.place, step:info.step, label:'시간 초과', gained:0, tag:'timeout' });
    if(SCENE_ORDER.includes(sid)) G.combo = 0;
    refreshHud();
    return { tag:'timeout', gains:[], cost:0, text:TIMEOUT_FB };
  }
  const c = CHOICES[sid][idx]; let gained = 0;
  for(const [k, v] of Object.entries(c.pts)){ G.score[k] += v; gained += v; }
  const cost = c.cost || 0; G.money -= cost;
  if(c.flag) G.flags[c.flag] = true;
  if(SCENE_ORDER.includes(sid)){
    if(c.tag === 'best'){ G.passed++; G.combo++; if(BEST_BADGE[sid]) badge(BEST_BADGE[sid]);
      if(G.combo >= 2) setTimeout(() => toast(`🔥 ${G.combo}연속 미션 통과!`, 'combo'), 200);
      if(G.combo >= 3) badge('combo'); }
    else G.combo = 0;
  }
  G.choiceLog.push({ place:info.place, step:info.step, label:c.label, gained, tag:c.tag });
  refreshHud();
  return { tag:c.tag, gains:Object.entries(c.pts).filter(([, v]) => v > 0).map(([k, v]) => [CATNAME[k], v]), cost, text:c.fb };
}
function applyQuiz(qid, idx){
  const q = QUIZZES[qid], ok = idx === q.ans;
  if(ok) G.score.challenge += QUIZ_PTS;
  G.quizLog.push(ok);
  if(G.quizLog.length === QUIZ_ORDER.length && G.quizLog.every(Boolean)) badge('pun');
  refreshHud();
  return { tag:ok ? 'best' : 'low', head:ok ? '딩동댕! 정답!' : (idx < 0 ? '시간 초과!' : '땡! 틀렸어요'), answer:q.opts[q.ans], text:q.why, gains:ok ? [['도전·행운', QUIZ_PTS]] : [] };
}
function applyGame(name, result){
  const pts = GAME_PTS[result] || 0;
  G.score.challenge += pts;
  G.gameLog.push({ name:GAME_NAMES[name], result, pts });
  if(name === 'omok' && result === 'win') badge('boss');
  refreshHud();
}
function applyTicket(t){
  if(t.kind === 'shop'){ G.money += t.prize; G.lotteryWon += t.prize; }
  else G.score.challenge += t.prize;
  G.ticketLog.push({ kind:t.kind, won:t.won, prize:t.prize });
  if(t.won) badge('lucky');
  refreshHud();
}
function tierOf(total){ const r = total / MAX_SCORE; return TIERS.find(t => r >= t[0]) || TIERS[TIERS.length - 1]; }
function loadBoard(){ try{ return JSON.parse(localStorage.getItem(LB_KEY)) || { board:[], plays:0, passes:0 }; }catch(e){ return { board:[], plays:0, passes:0 }; } }
function saveBoard(b){ try{ localStorage.setItem(LB_KEY, JSON.stringify(b)); }catch(e){} }
function finalize(){
  const bonus = (G.flags.made_plan && G.money >= 5000) ? PLAN_BONUS : 0;
  G.score.money += bonus;
  const total = totalScore(), tier = tierOf(total), passed = total >= PASS_SCORE;
  const entry = { id:Date.now(), name:G.name, score:total, tier:tier[1], passed };
  const B = loadBoard(); B.board.push(entry); B.board.sort((a, b) => b.score - a.score || a.id - b.id); B.board = B.board.slice(0, 300);
  B.plays++; if(passed) B.passes++; saveBoard(B);
  G.final = { total, bonus, tier, passed, rank:B.board.findIndex(e => e.id === entry.id) + 1, count:B.board.length, me:entry.id, board:B.board };
}
