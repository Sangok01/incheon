/* =====================================================================
   미니게임 (AI 리리와 대결) · 스크래치 복권
   난이도 조절: 각 함수 위의 숫자(시간, 목표 점수, 함정 개수, 수 제한, AI 실수 확률)를 바꾸면 돼요.
   ===================================================================== */
'use strict';

/* 공통: 시작 안내 카드 */
function gameIntro(title, desc, icon){
  return new Promise(resolve => {
    const el = openOverlay(`<div class="dim"><div class="card"><div class="vs">${icon} VS 🤖 AI 리리</div><h2 style="color:#e0724f">${esc(title)}</h2><p>${fmt(desc)}</p><button class="big">도전! ▶</button></div></div>`);
    el.querySelector('.big').onclick = () => { snd('sfx_click'); closeOverlay(); resolve(); };
  });
}
/* 공통: 결과 카드 */
async function gameResult(result, detail){
  await wait(700);
  if(result === 'win'){ snd('sfx_fanfare'); fx.confetti(200); flash('#fff6c4'); }
  else if(result === 'draw'){ snd('sfx_ok'); }
  else { snd('sfx_low'); }
  const head = { win:'승리! 🎉', draw:'무승부!', lose:'리리 승리… 🤖' }[result];
  const sub = { win:'🎟️ 황금 스크래치 복권 획득!', draw:'🎟️ 스크래치 복권 1장 획득', lose:'🎟️ 위로의 스크래치 복권 1장' }[result];
  const color = { win:'#3f8f80', draw:'#c98a12', lose:'#d0664c' }[result];
  await card({ head, color, answer:'', gains: result === 'lose' ? [] : [['도전·행운', GAME_PTS[result]]], text:`${detail}<br><b>${sub}</b>`, btn:'복권 받기 ▶' });
}

/* ---------------------------------------------------------------- 1) 함정 상자 복불복 */
const MINE = { n:16, mines:4, need:3 };
async function gameMine(){
  await gameIntro('함정 상자 복불복', `리리(AI)가 상자 **${MINE.n}개** 중 **${MINE.mines}개**에 함정을 숨겼어요.\n함정을 피해 안전한 상자 **${MINE.need}개**를 열면 승리!\n(10번 중 4번 정도만 이겨요… 운을 믿어 봐요!)`, '🎁');
  const mines = shuffle([...Array(MINE.n).keys()]).slice(0, MINE.mines);
  return new Promise(resolve => {
    let safe = 0, done = false, busy = false;
    const el = openOverlay(`<div class="dim dark"><div class="gbar"><span class="t">🎁 함정 상자 복불복</span><span>상자를 눌러 열어요!</span><span class="spacer"></span><span class="good" id="mc">안전 0/${MINE.need}</span></div>
      <div class="minegrid">${Array.from({length:MINE.n}, (_, i) => `<button class="box" data-i="${i}"><span>?</span></button>`).join('')}</div></div>`);
    el.querySelectorAll('.box').forEach(b => b.onclick = async () => {
      if(done || busy || b.classList.contains('safe')) return;
      busy = true; const i = +b.dataset.i;
      b.classList.add('wobble'); beep(440, .08); await wait(180); beep(520, .08); await wait(180); beep(660, .08); await wait(200);
      b.classList.remove('wobble');
      const p = centerOf(b);
      if(mines.includes(i)){
        done = true; b.className = 'box boom'; b.innerHTML = '<span>💥</span>'; shake(); flash('#ffd2c4'); beep(90, .5, .3, 'sawtooth'); fx.smoke(p.x, p.y); fx.burst(p.x, p.y, 30, ['#d0664c', '#f4b942', '#6d6a7c'], 'dot');
        await wait(600);
        el.querySelectorAll('.box').forEach(x => { const k = +x.dataset.i; if(mines.includes(k) && k !== i){ x.className = 'box mine'; x.innerHTML = '<span>💣</span>'; } });
        await wait(900); closeOverlay(); await gameResult('lose', `안전한 상자 ${safe}개를 열었어요. 아깝다!`); resolve('lose');
      } else {
        safe++; b.className = 'box safe'; b.innerHTML = `<span>${pick(['⭐', '🍀', '💎', '🎈'])}</span>`; snd('sfx_ok'); fx.burst(p.x, p.y, 22);
        el.querySelector('#mc').textContent = `안전 ${safe}/${MINE.need}`;
        if(safe >= MINE.need){ done = true; await wait(700); closeOverlay(); await gameResult('win', `함정을 모두 피해 안전한 상자 ${safe}개를 열었어요!`); resolve('win'); }
      }
      busy = false;
    });
  });
}

/* ---------------------------------------------------------------- 2) SDGs 빙고 */
const SDGS = ['빈곤 퇴치', '기아 종식', '건강과 웰빙', '양질의 교육', '성평등', '깨끗한 물', '깨끗한 에너지', '좋은 일자리', '산업과 혁신',
  '불평등 감소', '지속가능 도시', '책임 소비', '기후 행동', '바다 생태계', '육지 생태계', '평화와 정의', '파트너십'];
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
async function gameBingo(){
  await gameIntro('SDGs 빙고 대결', '나와 리리(AI)의 빙고판에는 SDGs(지속가능발전목표)가 9개씩 있어요.\n**번호 뽑기**를 누를 때마다 목표가 하나씩 나와요.\n먼저 가로·세로·대각선 **한 줄**을 채우면 승리!', '🎱');
  const me = shuffle([...Array(17).keys()].map(i => i + 1)).slice(0, 9);
  const ai = shuffle([...Array(17).keys()].map(i => i + 1)).slice(0, 9);
  const pool = shuffle([...Array(17).keys()].map(i => i + 1));
  const called = [];
  const boardHTML = (b, cls) => `<div class="${cls}"><div class="bname">${cls === 'ai' ? '🤖 리리 (AI)' : '🙂 ' + esc(G.name)}</div><div class="bboard">${b.map((n, k) => `<div class="bcell" data-k="${k}" data-n="${n}"><div class="n">${n}</div><div class="s">${SDGS[n - 1]}</div></div>`).join('')}</div></div>`;
  const lines = b => LINES.filter(L => L.every(k => called.includes(b[k])));
  return new Promise(resolve => {
    const el = openOverlay(`<div class="dim dark"><div class="gbar"><span class="t">🎱 SDGs 빙고 대결</span><span>먼저 한 줄을 채우면 승리!</span><span class="spacer"></span><span id="bcnt">뽑은 횟수 0</span></div>
      <div class="bingowrap">${boardHTML(me, 'mine')}<div class="ball"><div class="lbl">이번 번호</div><div class="bn" id="bn">?</div><div class="bs" id="bs">뽑기를 눌러요</div><button class="big" id="bdraw">번호 뽑기! 🎲</button></div>${boardHTML(ai, 'ai')}</div></div>`);
    const btn = el.querySelector('#bdraw'), bn = el.querySelector('#bn'), bs = el.querySelector('#bs');
    btn.onclick = async () => {
      btn.disabled = true; bn.classList.add('spin');
      for(let k = 0; k < 10; k++){ bn.textContent = 1 + Math.floor(Math.random() * 17); beep(600 + k * 40, .04, .08); await wait(60 + k * 8); }
      const n = pool.pop(); called.push(n);
      bn.classList.remove('spin'); bn.textContent = n; bs.textContent = SDGS[n - 1]; snd('sfx_click');
      el.querySelector('#bcnt').textContent = `뽑은 횟수 ${called.length}`;
      el.querySelectorAll(`.bcell[data-n="${n}"]`).forEach(c => { c.classList.add('on'); const p = centerOf(c); fx.burst(p.x, p.y, 14, ['#f4b942', '#f28b6b', '#5fa99b']); });
      await wait(400);
      const lm = lines(me), la = lines(ai);
      lm.forEach(L => L.forEach(k => el.querySelector(`.mine .bcell[data-k="${k}"]`).classList.add('line')));
      la.forEach(L => L.forEach(k => el.querySelector(`.ai .bcell[data-k="${k}"]`).classList.add('line')));
      if(lm.length || la.length || !pool.length){
        const res = lm.length && !la.length ? 'win' : la.length && !lm.length ? 'lose' : 'draw';
        bs.textContent = res === 'win' ? '빙고! 내가 먼저!' : res === 'lose' ? '리리가 먼저 빙고!' : '동시에 빙고!';
        await wait(1200); closeOverlay();
        await gameResult(res, `${called.length}번 만에 결판! 마지막 번호: ${n}번 ${SDGS[n - 1]}`); resolve(res); return;
      }
      btn.disabled = false;
    };
  });
}

/* ---------------------------------------------------------------- 3) 가짜 뉴스 슈팅 */
const SHOOT = { duration:18, need:4 };
const FAKES = ['공유만 하면 1번에 100원 기부!', '강화도 갯벌에 공룡 출현 (AI 사진)', '초콜릿 먹으면 키가 10cm 쑥쑥', '내일부터 전국 학교 영원히 방학',
  '이 링크 누르면 게임 아이템 공짜', '송도 G타워는 초콜릿으로 지었다', '월미도 바다가 내일 사라진다?!'];
const TRUES = ['1902년 인천에서 하와이 이민 출발', '송도에 녹색기후기금 사무국이 있다', '공정무역은 농부에게 정당한 값을', '함박마을엔 고려인 이웃이 산다', '인천대교는 바다 위를 지나는 다리'];
async function gameShooter(){
  await gameIntro('가짜 뉴스 슈팅', `말풍선이 날아가요! **가짜 뉴스**만 눌러서 격파하세요.\n진짜 뉴스를 누르면 1점 깎여요.\n**${SHOOT.duration}초** 안에 **${SHOOT.need}점** 이상이면 승리!`, '🎯');
  const items = shuffle([...FAKES.map(t => ({t, fake:true})), ...TRUES.map(t => ({t, fake:false}))]);
  const LANES = [190, 380, 570, 760];
  return new Promise(resolve => {
    let hit = 0, miss = 0, done = false;
    const el = openOverlay(`<div class="dim dark"><div class="sky" id="sky"></div><div class="gbar"><span class="t">🎯 가짜 뉴스 슈팅</span><span id="stime">남은 시간 ${SHOOT.duration}초</span><span>격파 <b id="shit">0</b> · 실수 <b id="smiss">0</b></span><span class="spacer"></span><span class="good" id="snet">점수 0 / 목표 ${SHOOT.need}</span></div></div>`);
    const sky = el.querySelector('#sky');
    const bubs = items.map((it, i) => {
      const b = document.createElement('div'); b.className = 'bub'; b.textContent = it.t;
      Object.assign(b, { _x:1960, _y:LANES[i % 4] + rnd(-20, 20), _sp:rnd(330, 450), _spawn:.4 + i * 1.25, _st:'wait', _fake:it.fake, _wob:rnd(0, 6) });
      b.style.transform = `translate(1960px,${b._y}px)`; b.style.display = 'none';
      b.onpointerdown = e => {
        e.preventDefault(); if(done || b._st !== 'fly') return;
        const p = toStage(e); b._st = 'hit';
        if(b._fake){ hit++; b.classList.add('pop'); beep(1046, .1, .15); beep(1568, .12, .1); fx.burst(p.x, p.y, 26); floatTxt(p, '+1', '#3f8f80'); }
        else { miss++; b.classList.add('oops'); beep(160, .25, .2, 'sawtooth'); shake(); floatTxt(p, '−1 진짜 뉴스!', '#d0664c'); }
        el.querySelector('#shit').textContent = hit; el.querySelector('#smiss').textContent = miss;
        el.querySelector('#snet').textContent = `점수 ${hit - miss} / 목표 ${SHOOT.need}`;
      };
      sky.appendChild(b); return b;
    });
    function floatTxt(p, t, c){ const f = document.createElement('div'); f.className = 'float'; f.textContent = t; f.style.color = c; f.style.left = (p.x - 40) + 'px'; f.style.top = (p.y - 40) + 'px'; sky.appendChild(f); setTimeout(() => f.remove(), 1000); }
    const t0 = performance.now(); let last = t0;
    function frame(now){
      if(done) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const el2 = (now - t0) / 1000, left = Math.max(0, SHOOT.duration - el2);
      el.querySelector('#stime').textContent = `남은 시간 ${Math.ceil(left)}초`;
      for(const b of bubs){
        if(b._st === 'wait' && el2 >= b._spawn){ b._st = 'fly'; b.style.display = 'flex'; }
        if(b._st === 'fly'){ b._x -= b._sp * dt; b._wob += dt * 3; b.style.transform = `translate(${b._x}px,${b._y + Math.sin(b._wob) * 14}px)`; if(b._x < -600) b._st = 'gone'; }
      }
      if(left <= 0 || bubs.every(b => b._st === 'gone' || b._st === 'hit')){ finish(); return; }
      requestAnimationFrame(frame);
    }
    async function finish(){
      done = true; const net = hit - miss, res = net >= SHOOT.need ? 'win' : 'lose';
      await wait(500); closeOverlay();
      await gameResult(res, `가짜 뉴스 ${hit}개 격파, 진짜 뉴스 ${miss}개 실수 → ${net}점 (목표 ${SHOOT.need}점)`); resolve(res);
    }
    requestAnimationFrame(frame);
  });
}

/* ---------------------------------------------------------------- 4) 사목 (7×7, 4개 연속) */
const OMOK = { n:7, k:4, maxMoves:12, blunder:0.55 };
function omokEngine(){
  const { n, k } = OMOK, b = Array(n * n).fill(0), DIRS = [[0,1],[1,0],[1,1],[1,-1]];
  const inb = (r, c) => r >= 0 && r < n && c >= 0 && c < n;
  function lineAt(i, p){
    const r0 = Math.floor(i / n), c0 = i % n;
    for(const [dr, dc] of DIRS){
      const cells = [i];
      for(const s of [1, -1]){ let r = r0 + dr * s, c = c0 + dc * s; while(inb(r, c) && b[r * n + c] === p){ cells.push(r * n + c); r += dr * s; c += dc * s; } }
      if(cells.length >= k) return cells;
    }
    return null;
  }
  const wouldWin = (i, p) => { b[i] = p; const ok = !!lineAt(i, p); b[i] = 0; return ok; };
  function shape(i, p){
    const r0 = Math.floor(i / n), c0 = i % n; let s = 0;
    for(const [dr, dc] of DIRS){
      let cnt = 1, opens = 0;
      for(const sg of [1, -1]){ let r = r0 + dr * sg, c = c0 + dc * sg; while(inb(r, c) && b[r * n + c] === p){ cnt++; r += dr * sg; c += dc * sg; } if(inb(r, c) && b[r * n + c] === 0) opens++; }
      if(cnt >= k) s += 10000; else if(cnt === k - 1) s += opens === 2 ? 800 : opens === 1 ? 100 : 0;
      else if(cnt === k - 2) s += opens === 2 ? 40 : opens === 1 ? 8 : 0; else s += opens === 2 ? 2 : 0;
    }
    return s;
  }
  function aiMove(){
    const empties = b.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    for(const i of empties) if(wouldWin(i, 2)) return i;
    for(const i of empties) if(wouldWin(i, 1)) return i;
    const ctr = Math.floor(n / 2);
    const score = i => 1.1 * shape(i, 2) + shape(i, 1) + (3 - (Math.abs(Math.floor(i / n) - ctr) + Math.abs(i % n - ctr)) * .5);
    const ranked = empties.sort((x, y) => score(y) - score(x));
    if(ranked.length > 3 && Math.random() < OMOK.blunder) return pick(ranked.slice(1, 4));
    return ranked[0];
  }
  return { b, lineAt, aiMove };
}
async function gameOmok(){
  await gameIntro('AI 리리와 사목 대결', `7×7 판에서 돌 **4개**를 한 줄로 먼저 이으면 승리!\n리리(AI)가 먼저 가운데에 둬요. 내 돌은 **${OMOK.maxMoves}번**까지만!\nAI의 수를 잘 읽고 막으면서 공격해요.`, '⚫');
  const E = omokEngine(), n = OMOK.n, ctr = Math.floor(n / 2) * n + Math.floor(n / 2);
  E.b[ctr] = 2;
  const TALK = { start:'후후, 나는 계산이 빠르다구! 🤖', think:['음… 어디 둘까?', '계산 중… 삐빅!', '이 수는 어때?', '흠흠, 만만치 않은데?'], block:'앗, 거긴 내가 막아야지!', danger:'어, 위험한데…?!' };
  return new Promise(resolve => {
    let moves = 0, busy = false, done = false;
    const el = openOverlay(`<div class="dim dark"><div class="gbar"><span class="t">⚫ AI 리리와 사목 대결</span><span>내 돌 4개를 먼저 한 줄로!</span><span class="spacer"></span><span class="good" id="omv">남은 수 ${OMOK.maxMoves}</span></div>
      <div class="omokwrap"><div class="oboard">${E.b.map((v, i) => `<div class="oc" data-i="${i}"></div>`).join('')}</div>
      <div class="oside"><img id="oriri" src="assets/char/riri_think.webp" alt=""><div class="say" id="osay">${TALK.start}</div><div class="mv">🔵 나 &nbsp; ⚪ 리리</div></div></div></div>`);
    const cells = [...el.querySelectorAll('.oc')];
    const put = (i, who) => { const c = cells[i]; c.classList.add('full'); c.innerHTML = `<div class="st ${who === 1 ? 'me' : 'ai'}"></div>`; beep(who === 1 ? 520 : 390, .07, .12); };
    const say2 = (t, pose = 'think') => { el.querySelector('#osay').textContent = t; el.querySelector('#oriri').src = `assets/char/riri_${pose}.webp`; };
    put(ctr, 2); cells[ctr].classList.add('last');
    const end = async (res, line) => {
      done = true;
      if(line) line.forEach(i => cells[i].classList.add('win'));
      say2(res === 'win' ? '으앗… 내가 졌어! 대단해!' : res === 'lose' ? '이겼다! 다음엔 더 조심해 봐~' : '무승부! 팽팽했어!', res === 'win' ? 'wow' : 'happy');
      await wait(1500); closeOverlay();
      await gameResult(res, `내가 둔 수: ${moves}번`); resolve(res);
    };
    cells.forEach(c => c.onclick = async () => {
      const i = +c.dataset.i; if(done || busy || E.b[i]) return;
      busy = true; E.b[i] = 1; moves++; put(i, 1);
      el.querySelector('#omv').textContent = `남은 수 ${OMOK.maxMoves - moves}`;
      const p = centerOf(c);
      let line = E.lineAt(i, 1);
      if(line){ fx.burst(p.x, p.y, 40); return end('win', line); }
      if(!E.b.includes(0)) return end('draw');
      say2(pick(TALK.think)); await wait(rnd(450, 800));
      const j = E.aiMove(), blocking = (() => { E.b[j] = 1; const w = !!E.lineAt(j, 1); E.b[j] = 0; return w; })();
      E.b[j] = 2; put(j, 2); cells.forEach(x => x.classList.remove('last')); cells[j].classList.add('last');
      if(blocking) say2(TALK.block, 'wow');
      line = E.lineAt(j, 2);
      if(line) return end('lose', line);
      if(!E.b.includes(0)) return end('draw');
      if(moves >= OMOK.maxMoves) { say2('수를 다 썼어! 내 승리~', 'happy'); return end('lose'); }
      busy = false;
    });
  });
}

/* ---------------------------------------------------------------- 스크래치 복권 */
/* kind: free 일반(점수) · gold 황금(점수, 당첨 잘 됨) · shop 복권 가게(돈, 1장 1,000원)
   같은 그림 3개가 나오면 당첨! [그림, 확률, 상금] */
const SCRATCH_TABLE = {
  free:[['★', .08, 10], ['♥', .14, 6], ['▲', .20, 3]],
  gold:[['★', .20, 10], ['♥', .25, 6], ['▲', .25, 3]],
  shop:[['★', .05, 5000], ['♥', .10, 2000], ['▲', .15, 1000]],
};
const SYMS = ['★', '♥', '▲', '●'];
const SYM_COLOR = { '★':'#e0a020', '♥':'#e0604f', '▲':'#3f8f80', '●':'#8f86c4' };
function makeTicket(kind){
  let sym = null, prize = 0, r = Math.random(), acc = 0;
  for(const [s, p, a] of SCRATCH_TABLE[kind]){ acc += p; if(r < acc){ sym = s; prize = a; break; } }
  let cells;
  if(sym){ cells = [sym, sym, sym, ...shuffle(SYMS.filter(s => s !== sym).flatMap(s => [s, s])).slice(0, 3)]; }
  else if(Math.random() < .5){ cells = ['★', '★', ...shuffle(['♥', '♥', '▲', '▲', '●', '●']).slice(0, 4)]; }
  else { cells = shuffle([...SYMS, ...SYMS]).slice(0, 6); }
  shuffle(cells);
  return { kind, sym, prize, cells, won:!!sym, near:!sym && cells.filter(c => c === '★').length === 2 };
}
const TICKET_INFO = {
  free:['🎟️ 세계시민 스크래치 복권', '★ +10점 · ♥ +6점 · ▲ +3점'],
  gold:['✨ 황금 스크래치 복권 ✨', '★ +10점 · ♥ +6점 · ▲ +3점 (당첨 확률 UP!)'],
  shop:['💸 인생역전 즉석 복권', '★ 5,000원 · ♥ 2,000원 · ▲ 1,000원'],
};
function scratch(kind, countText = ''){
  const t = makeTicket(kind);
  hideText();
  return new Promise(resolve => {
    const [title, rule] = TICKET_INFO[kind];
    const el = openOverlay(`<div class="dim dark">
      <div class="ticket ${kind}"><div class="head"><span>${title}</span><span style="font-size:34px">${esc(countText)}</span></div>
        <div class="rule">같은 그림 3개가 나오면 당첨!  ${rule}</div>
        <div class="area"><div class="cells">${t.cells.map(s => `<div class="cell" style="color:${SYM_COLOR[s]}">${s}</div>`).join('')}</div><canvas width="774" height="516"></canvas></div></div>
      <div class="hint2" id="shint">👆 은박을 손가락(마우스)으로 문질러 긁어요!</div>
      <div class="row"><button class="big sub" id="sall">한 번에 긁기</button><button class="big" id="sok" style="display:none">확인 ▶</button></div>
      <div class="sres" id="sres"></div></div>`);
    const cv = el.querySelector('canvas'), cx = cv.getContext('2d');
    /* 은박 그리기 */
    const grd = cx.createLinearGradient(0, 0, 774, 516);
    grd.addColorStop(0, '#c9ccd6'); grd.addColorStop(.5, '#e9ebf1'); grd.addColorStop(1, '#b7bbc7');
    cx.fillStyle = grd; cx.fillRect(0, 0, 774, 516);
    cx.globalAlpha = .35; for(let i = 0; i < 900; i++){ cx.fillStyle = Math.random() < .5 ? '#ffffff' : '#9aa0ae'; cx.fillRect(Math.random() * 774, Math.random() * 516, 2, 2); }
    cx.globalAlpha = .55; cx.fillStyle = '#8a8f9c'; cx.font = '64px Jua, sans-serif'; cx.textAlign = 'center';
    for(let r = 0; r < 2; r++) for(let c = 0; c < 3; c++) cx.fillText('?', 123 + c * 264, 150 + r * 264);
    cx.globalAlpha = 1; cx.globalCompositeOperation = 'destination-out';
    let down = false, lastP = null, revealed = false, sinceCheck = 0;
    const pos = e => { const r = cv.getBoundingClientRect(); return { x:(e.clientX - r.left) * 774 / r.width, y:(e.clientY - r.top) * 516 / r.height }; };
    const scratchAt = p => {
      cx.lineWidth = 84; cx.lineCap = 'round'; cx.beginPath();
      if(lastP){ cx.moveTo(lastP.x, lastP.y); cx.lineTo(p.x, p.y); cx.stroke(); }
      cx.beginPath(); cx.arc(p.x, p.y, 42, 0, 7); cx.fill();
      lastP = p;
      if(++sinceCheck % 6 === 0){ beep(rnd(2400, 3200), .015, .03, 'triangle'); checkCleared(); }
    };
    const checkCleared = () => {
      const d = cx.getImageData(0, 0, 774, 516).data; let clear = 0, tot = 0;
      for(let i = 3; i < d.length; i += 4 * 40){ tot++; if(d[i] < 40) clear++; }
      if(clear / tot > .6) revealAll();
    };
    cv.onpointerdown = e => { e.preventDefault(); down = true; lastP = null; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); scratchAt(pos(e)); };
    cv.onpointermove = e => { if(down || e.pointerType === 'mouse') { if(!down && !lastP) lastP = null; scratchAt(pos(e)); } };
    cv.onpointerup = cv.onpointerleave = () => { down = false; lastP = null; };
    el.querySelector('#sall').onclick = () => revealAll();
    async function revealAll(){
      if(revealed) return; revealed = true;
      cv.style.transition = 'opacity .5s'; cv.style.opacity = 0;
      el.querySelector('#sall').style.display = 'none'; el.querySelector('#shint').style.display = 'none';
      await wait(500);
      const res = el.querySelector('#sres');
      if(t.won){
        el.querySelectorAll('.cell').forEach((c, i) => { if(t.cells[i] === t.sym) c.classList.add('win'); });
        res.textContent = kind === 'shop' ? `🎉 당첨! 상금 ${won(t.prize)}` : `🎉 당첨! 보너스 +${t.prize}점`;
        snd('sfx_fanfare'); fx.confetti(180); if(kind === 'shop') fx.coins(960, 600, 20); else fx.burst(960, 500, 50);
      } else {
        res.textContent = t.near ? '😫 아깝다! ★이 2개… 꽝!' : '꽝! 다음 기회에…';
        snd('sfx_low');
      }
      const ok = el.querySelector('#sok'); ok.style.display = '';
      ok.onclick = () => { snd('sfx_click'); closeOverlay(); applyTicket(t); resolve(t); };
    }
  });
}
