/* =====================================================================
   리리와 함께하는 인천 세계시민 탐험 — 이야기
   인천형 세계시민교육(읽걷쓰 4P) × 읽걷쓰 AI × 금융교육 | 초등 1인칭 (약 10분)
   본미션 8 · 넌센스 퀴즈 4 · AI 리리와 대결 4 · 스크래치 복권
   ===================================================================== */
'use strict';

/* ---------- 공통 흐름 ---------- */
async function moveTo(sid, bgname){
  hideText();
  await travel(sid);
  G.sceneIdx = SCENE_ORDER.indexOf(sid); refreshHud();
  bg(bgname); placeCard(sid);
  await wait(900);
}
async function askMission(sid, q){
  const i = SCENE_ORDER.indexOf(sid) + 1;
  return mission(q, CHOICES[sid].map(c => c.text), MISSION_TIME, `미션 ${i}/8 · 읽걷쓰 ${SCENES[sid].step} · 제한시간 ${MISSION_TIME}초`);
}
async function missionResult(sid, idx){
  const fb = applyChoice(sid, idx);
  celebrate(fb.tag === 'timeout' ? 'low' : fb.tag);
  if(fb.cost) fx.coins(1500, 80, 8);
  await card({ head:TAG_HEAD[fb.tag], color:TAG_COLOR[fb.tag], gains:fb.gains, cost:fb.cost, text:fb.text });
}
async function quiz(qid){
  const n = QUIZ_ORDER.indexOf(qid) + 1, Q = QUIZZES[qid];
  const idx = await mission(Q.q, Q.opts, QUIZ_TIME, `🤣 넌센스 퀴즈 ${n}/4 · 10초 안에!`, 'quiz');
  const fb = applyQuiz(qid, idx);
  celebrate(fb.tag);
  await card({ head:fb.head, color:fb.tag === 'best' ? '#3f8f80' : '#d0664c', answer:fb.answer, gains:fb.gains, text:fb.text });
}
async function aiGame(name){
  hideText();
  const res = await ({ mine:gameMine, bingo:gameBingo, shooter:gameShooter, omok:gameOmok })[name]();
  applyGame(name, res);
  await scratch(res === 'win' ? 'gold' : 'free');
}

/* ================================================================= 본편 */
async function playStory(){
  playMusic('bgm_main'); hud(true); refreshHud(true);
  G.sceneIdx = 0; refreshHud(); bg('home'); placeCard('plan');
  await wait(900);

  /* ---------- 미션 1. 우리 집 [관찰하기] 금융 ---------- */
  await narr('토요일 아침. 오늘은 인천 곳곳을 탐험하는 ‘세계시민 인증 챌린지’ 날!');
  await say('mom', '{name}, 용돈 10,000원이야. 오늘 하루 잘 계획해서 써 보렴.');
  snd('sfx_coin'); fx.coins(1500, 80, 12);
  show('riri', 'normal', .78);
  await say('riri', '안녕, {name}! 나는 읽걷쓰 AI 친구 리리야.');
  show('riri', 'happy');
  await say('riri', '오늘 미션은 모두 **제한시간**이 있어. 통과하는 친구는 절반도 안 된대!');
  show('riri', 'think');
  await say('riri', '나랑 대결도 하고, 이기면 **황금 복권**도 줄게. 첫 미션! 용돈 계획부터.');
  let p = await askMission('plan', '오늘 용돈 10,000원, 어떻게 쓸까?');
  if(p === 0){ show('riri', 'think'); await say('riri', '음… 그때그때 쓰면 편하긴 한데, 끝나고 나면 어디에 썼는지 모를걸?'); }
  else if(p === 1){ show('riri', 'happy'); await say('me', '교통비·물 5,000원, 간식 3,000원, 나눔 2,000원! 이렇게 적어 둘래.'); hop('riri'); await say('riri', '와, 벌써 예산표 완성이야!'); }
  else if(p === 2){ show('riri', 'wow'); await say('riri', '몽땅 저금? 그럼 오늘 버스비는 어떡하지?'); }
  else if(p === 3){ show('riri', 'think'); await say('riri', '친구가 사는 게 나한테도 꼭 필요할까?'); }
  else { show('riri', 'wow'); await say('riri', '앗, 시간이 다 됐어! 고민만 하다 끝나 버렸네.'); }
  await missionResult('plan', p);

  /* ---------- 넌센스 1 + 미션 2. 월미도 한국이민사박물관 [질문하기] ---------- */
  await moveTo('museum', 'museum');
  show('riri', 'happy', .78);
  await say('me', '월미도에 도착! 바다 냄새가 솔솔 난다.');
  await say('riri', '바다를 보니 넌센스 퀴즈가 떠올랐어! 딱 10초!');
  await quiz('q_sea');
  show('riri', 'normal');
  await say('h', '1902년 겨울, 이곳 인천 제물포항에서 100여 명이 배를 타고 하와이로 떠났어요. 우리나라 첫 공식 이민이랍니다.');
  show('riri', 'think');
  await say('riri', '그런데 AI 검색창에 이런 답이 떴어. “옛날 이민자들은 편하게 돈 벌러 간 거예요.”');
  await say('me', '음… 이 말, 정말 맞을까? 확인해 봐야겠다.');
  p = await askMission('museum', 'AI가 알려 준 정보, 어떻게 확인할까?');
  if(p === 0){ show('riri', 'happy'); await say('riri', '“네, 정말이에요!” …어라? 나한테 물으면 나는 또 같은 말을 할 수밖에 없는데?'); }
  else if(p === 1){ show('riri', 'normal'); await say('me', '블로그에도 비슷하게 써 있네… 그런데 누가 쓴 글이지?'); }
  else if(p === 2){ show('riri', 'happy'); await say('h', '이민자들은 뜨거운 사탕수수 농장에서 하루 10시간씩 일했어요. 편한 길이 아니었지요.'); await say('me', '직접 확인하길 잘했다!'); }
  else if(p === 3){ show('riri', 'wow'); await say('h', '어머, 그건 사실과 달라요. 이민자들은 아주 힘들게 일했답니다.'); }
  else { show('riri', 'wow'); await say('riri', '시간 초과! 확인할 기회를 놓쳤어.'); }
  await missionResult('museum', p);

  /* ---------- 미션 3. 함박마을 [탐구하기] + 대결 1 함정 상자 ---------- */
  await moveTo('hambak', 'hambak');
  await say('me', '함박마을에 왔다. 러시아어 간판과 우즈베키스탄 빵집이 가득해!');
  show('sasha', 'smile', .26);
  await say('sasha', '안녕! 나는 사샤야. 우리 할머니는 고려인이셔. 우즈베키스탄에서 왔어.');
  show('minjun', 'tease', .74);
  await say('minjun', '사샤는 말투가 이상해! 학교 알림장도 못 읽는대~');
  show('sasha', 'sad');
  await say('sasha', '……엄마가 한국어 가정통신문을 읽기 어려워하셔서, 준비물을 자주 빠뜨려.');
  p = await askMission('hambak', '사샤를 위해 나는 어떻게 할까?');
  if(p === 0){ show('sasha', 'smile'); await say('sasha', '고마워… 그런데 나도 스스로 해 보고 싶어.'); }
  else if(p === 1){ show('sasha', 'sad'); await say('sasha', '……할머니랑은 고려말로 이야기하는데, 그것도 쓰면 안 돼?'); }
  else if(p === 2){ show('minjun', 'sorry'); await say('minjun', '어… 그렇네. 사샤야, 미안해.'); show('sasha', 'happy'); hop('sasha');
    await say('sasha', '고마워! 번역 앱으로 가정통신문을 같이 읽어 주면 정말 좋겠어!'); }
  else if(p === 3){ hide('minjun'); await narr('뒤돌아 걷는데, 사샤의 작은 목소리가 자꾸 귀에 남는다.'); }
  else { await narr('머뭇거리는 사이 사샤가 고개를 숙이고 가게 안으로 들어갔다.'); }
  await missionResult('hambak', p);
  hide('sasha'); hide('minjun'); await wait(300);
  show('riri', 'happy', .78);
  await say('riri', '잠깐 쉬어 가자! 나 리리와 첫 번째 대결! 상자 속 함정을 피해 봐!');
  await aiGame('mine');

  /* ---------- 넌센스 2 + 미션 4. 신포국제시장 [행동하기] + 복권방 ---------- */
  await moveTo('sinpo', 'sinpo');
  show('riri', 'normal', .78);
  await say('me', '신포국제시장이다! 닭강정 냄새가 솔솔~');
  await say('riri', '시장에 왔으니 돈에 관한 넌센스 퀴즈! 10초!');
  await quiz('q_king');
  await say('mom', '(문자) {name}, 시장에서 달걀 10개만 사 올래? 심부름 돈 5,000원 줄게.');
  await say('g', '달걀 사러 왔니? 종류가 많단다. 골라 보렴!');
  show('riri', 'think');
  await say('riri', '힌트! 포장 그림보다 ‘달걀 껍데기에 적힌 번호’를 읽어 봐.');
  p = await askMission('sinpo', '달걀 10개, 어떤 걸 살까? (심부름 예산 5,000원)');
  if(p === 0){ show('riri', 'think'); await say('g', '제일 싸지? 대신 좁은 철창에서 키운 닭들 달걀이란다.'); }
  else if(p === 1){ show('riri', 'happy'); await say('g', '오, 번호를 읽을 줄 아는구나! 1번은 닭들이 밖에서 뛰어놀며 낳은 달걀이야.'); }
  else if(p === 2){ snd('sfx_coin'); show('riri', 'wow'); await say('me', '500원이 모자라서… 내 용돈으로 냈다.'); }
  else if(p === 3){ show('riri', 'wow'); await say('g', '포장이 예쁘지? 그런데 껍데기 번호를 한번 보렴.'); }
  else { show('riri', 'wow'); await say('g', '얘야, 뒤에 손님 기다린다~ 시간이 다 됐어!'); }
  await missionResult('sinpo', p);

  show('riri', 'think');
  await say('lotto', '어이, 꼬마 손님! ‘인생역전 즉석 복권’ 1장에 1,000원! 1등은 5,000원이야!');
  await say('me', '우와, 1,000원으로 5,000원을…?');
  await say('riri', '{name}, 잘 생각해 봐. 이건 제한시간은 없어.');
  p = await mission('인생역전 즉석 복권, 살까?', CHOICES.shop.map(c => c.text), 0, `🎟️ 유혹의 복권방 · 내 용돈 ${won(G.money)}`, 'shop');
  const fbShop = applyChoice('shop', p);
  const nTix = [0, 1, 2][p];
  G.lotterySpent = 1000 * nTix;
  if(nTix){ fx.coins(1500, 80, 6 * nTix); }
  for(let i = 0; i < nTix; i++) await scratch('shop', `${i + 1}/${nTix}장`);
  if(nTix === 0) badge('nolotto');
  celebrate(nTix === 0 ? 'best' : 'low');
  await card({ head:'복권의 진실', color:nTix ? '#d0664c' : '#3f8f80', gains:fbShop.gains, cost:fbShop.cost,
    text:fbShop.text + (nTix ? `<br>(오늘 결과: 쓴 돈 ${won(G.lotterySpent)} → 당첨금 ${won(G.lotteryWon)})` : '') });

  /* ---------- 미션 5. 백령도 바닷가 [질문하기] ---------- */
  await moveTo('baengnyeong', 'baengnyeong');
  show('riri', 'normal', .78);
  await say('riri', '여긴 인천의 가장 북쪽 섬, 백령도! 내 드론 카메라로 바닷가를 탐방 중이야.');
  await say('me', '점박이물범이 쉬고 있어! 그런데… 해변에 쓰레기가 가득하네.');
  show('riri', 'think');
  await say('riri', '병에 여러 나라 글자가 적혀 있어. 중국어, 일본어, 영어… 한글도 있어.');
  p = await askMission('baengnyeong', '외국 글자가 적힌 쓰레기가 가득! 어떻게 할까?');
  if(p === 0){ show('riri', 'wow'); await say('riri', '잠깐! 한글이 적힌 병도 있었잖아. 우리 쓰레기도 바다를 건너가.'); }
  else if(p === 1){ show('riri', 'normal'); await say('riri', '주운 건 멋져! 그런데 이 쓰레기, 계속 또 밀려오지 않을까?'); }
  else if(p === 2){ show('riri', 'happy'); await say('me', '나라별로 세어 보니 플라스틱병이 제일 많아. 이웃 나라 친구들에게 편지를 써서 같이 줄이자고 해야지!'); hop('riri'); await say('riri', '지역 문제를 세계와 연결했어!'); }
  else if(p === 3){ show('riri', 'think'); await say('riri', '물범들한텐 여기가 집인데…'); }
  else { show('riri', 'wow'); await say('riri', '시간 초과! 파도가 쓰레기를 다시 바다로 데려가 버렸어.'); }
  await missionResult('baengnyeong', p);

  /* ---------- 넌센스 3 + 미션 6. 송도 G타워 [탐구하기] + 대결 2 빙고 ---------- */
  await moveTo('songdo', 'songdo');
  show('riri', 'normal', .78);
  await say('me', '송도 G타워! 녹색기후기금(GCF) 사무국이 있는 곳이다.');
  await say('riri', 'GCF는 개발도상국이 기후 위기에 대응하도록 돈을 지원하는 국제기구야. 기후 하면… 넌센스 퀴즈!');
  await quiz('q_hot');
  show('riri', 'think');
  await say('riri', '로비에 ‘AI와 함께 기후 위기에 강한 집 짓기’ 전시가 있어. 내가 설계 아이디어를 4개 냈는데…');
  await say('riri', '사실 그중 **3개는 틀렸어.** AI 말이라고 다 믿으면 안 되겠지? 과학으로 골라 봐!');
  p = await askMission('songdo', '리리(AI)의 제안 중 과학적으로 맞는 것은?');
  if(p === 2){ show('riri', 'happy'); await say('riri', '정답! 전통 한옥의 처마에도 숨어 있는 과학이야.'); }
  else if(p < 0){ show('riri', 'wow'); await say('riri', '시간 초과! 집이 완성되지 못했어.'); }
  else { show('riri', 'wow'); await say('riri', '땡! 내 말을 그대로 믿었구나. 그 집에선 여름에 엄청 더울걸?'); }
  await missionResult('songdo', p);
  show('riri', 'happy');
  await say('riri', '두 번째 대결! 지속가능발전목표, **SDGs 빙고**로 붙어 보자!');
  await aiGame('bingo');

  /* ---------- 미션 7. 강화 평화전망대 [행동하기] + 대결 3 슈팅 ---------- */
  await moveTo('ganghwa', 'ganghwa');
  show('riri', 'normal', .78);
  await say('me', '강화 평화전망대. 강 건너 북한 땅이 손에 잡힐 듯 가깝다.');
  await say('riri', '남과 북이 나뉜 지 70년이 넘었어. 지금도 세계 곳곳에 전쟁으로 집을 잃은 어린이들이 있어.');
  snd('sfx_click'); beep(1320, .1, .15); await wait(150); beep(1320, .1, .15);
  await narr('📱 그때 휴대폰 알림이 울렸다. 충격적인 전쟁 사진과 함께 ‘공유 1번에 100원 기부! 지금 후원하기 ▶ 링크’');
  p = await askMission('ganghwa', '돕고 싶은데… 어떻게 할까?');
  if(p === 0){ show('riri', 'think'); await say('riri', '잠깐, 이 글 누가 만들었는지 확인해 봤어?'); }
  else if(p === 1){ show('riri', 'normal'); await say('riri', '좋아요 100개가 모여도 실제로 전해지는 건 없대.'); }
  else if(p === 2){ snd('sfx_coin'); show('riri', 'happy'); await say('me', '사진 출처가 없네. 대신 공식 구호 기관 누리집에서 나눔 예산으로 기부할래.'); }
  else if(p === 3){ show('riri', 'wow'); shake(); await say('riri', '안 돼!! 그 링크, 주소가 이상해! 피싱 사이트일 수 있어!'); }
  else { show('riri', 'wow'); await say('riri', '시간 초과! 알림이 사라져 버렸어.'); }
  await missionResult('ganghwa', p);
  show('riri', 'happy');
  await say('riri', '세 번째 대결! 날아다니는 말풍선 중 **가짜 뉴스**만 골라 쏘는 슈팅 게임!');
  await aiGame('shooter');

  /* ---------- 넌센스 4 + 대결 4 사목 + 미션 8. 도서관 [행동하기] ---------- */
  await moveTo('library', 'library');
  show('riri', 'normal', .78);
  await say('me', '노을이 질 무렵, 도서관에 도착했다. 다리가 뻐근하다.');
  if(G.flags.sasha_friend){ show('sasha', 'happy', .24); await say('sasha', '{name}! 나도 세계시민 다짐 쓰러 왔어. 같이 쓰자!'); }
  if(G.flags.shared_fake){ show('riri', 'think'); await say('riri', '아 참, 아까 공유한 전쟁 사진… 알고 보니 **AI로 만든 가짜 사진**이었대.'); await say('me', '으… 친구들한테 사과 문자 보내야겠다.'); }
  show('riri', 'happy');
  await say('riri', '마지막 넌센스 퀴즈야! 다양성과 관련 있어!');
  await quiz('q_dog');
  show('riri', 'think');
  await say('riri', '그리고 마지막 대결… 나 리리는 계산이 아주 빨라. **사목**으로 붙어 보자!');
  await aiGame('omok');
  show('riri', 'happy');
  await say('riri', '진짜 마지막 미션! ‘나의 세계시민 다짐’을 써서 축제 게시판에 붙이자.');
  show('riri', 'think');
  await say('riri', '나는 AI니까 글을 대신 써 줄 수도 있는데… 어떻게 할래?');
  p = await askMission('library', '다짐글, 어떻게 쓸까?');
  if(p === 0){ show('riri', 'think'); await say('riri', '단어만 바꾼다고 내 생각이 되진 않는데…'); }
  else if(p === 1){ show('riri', 'happy'); await say('me', '‘다르다고 놀리지 않고, 사실을 확인하고, 돈을 계획해서 나누는 세계시민이 되겠습니다! (맞춤법: 리리 도움)’'); hop('riri'); await say('riri', '오늘 하루가 다 들어 있는 멋진 글이야!'); }
  else if(p === 2){ show('riri', 'normal'); await say('riri', '솔직하게 밝힌 건 좋아. 그런데 이 글엔 {name}의 이야기가 없는걸?'); }
  else if(p === 3){ show('riri', 'wow'); await say('riri', '앗, 그건 다른 사람이 쓴 글이잖아!'); }
  else { show('riri', 'wow'); await say('riri', '시간 초과! 게시판이 닫혀 버렸어.'); }
  await missionResult('library', p);

  /* ================================================================= 엔딩 */
  hideText(); hud(false); hideAll();
  playMusic('bgm_calm');
  bg('ending'); await wait(900);
  show('riri', 'happy', .5);
  await say('riri', '{name}, 오늘 정말 긴 하루였지?');
  await say('riri', '인천에서 읽고, 걷고, 쓰면서 만난 세계… 과연 인증을 통과했을까? 두구두구두구…');
  for(let i = 0; i < 12; i++){ beep(140 + i * 8, .07, .2, 'triangle'); await wait(80); }
  finalize();
  hideAll(); hideText();
  if(G.final.passed){ snd('sfx_fanfare'); fx.confetti(260); flash('#fff6c4'); } else snd('sfx_low');
  await endingScreen();
}

/* ================================================================= 엔딩 화면 */
function countUp(el, to, ms = 1200){
  const t0 = performance.now();
  const f = now => { const k = Math.min(1, (now - t0) / ms); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if(k < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
function endingScreen(){
  const F = G.final, [, tierName, tierIcon, tierMsg] = F.tier;
  const B = loadBoard();
  const quizOk = G.quizLog.filter(Boolean).length, wins = G.gameLog.filter(g => g.result === 'win').length, tixWon = G.ticketLog.filter(t => t.won).length;
  const dot = { best:'#5fa99b', ok:'#f4b942', low:'#e98b73', timeout:'#b9b0a4' };
  $('#print-area').innerHTML = `<h1>🌏 세계시민 인증서</h1><h2>${esc(G.name)} · ${esc(tierName)}</h2>
    <p>총점 ${F.total}점 / ${MAX_SCORE}점 (통과 기준 ${PASS_SCORE}점) · ${F.passed ? '인증 통과' : '도전 완료'}</p>
    <p>본미션 통과 ${G.passed}/8 · 넌센스 ${quizOk}/4 · AI 대결 승리 ${wins}/4 · 업적 배지 ${G.badges.length}개</p>
    <p>${G.badges.map(b => BADGES[b].icon + ' ' + BADGES[b].name).join(' · ')}</p>
    <p>위 어린이는 인천에서 읽고, 걷고, 쓰며 세계시민의 지혜를 보여 주었습니다.</p>`;
  return new Promise(resolve => {
    const page1 = () => {
      const el = openOverlay(`<div class="endcard" style="text-align:center">
        <h3>${esc(G.name)}의 세계시민 인증 결과</h3>
        <div style="margin:18px 0"><span class="stamp ${F.passed ? 'pass' : 'fail'}">${F.passed ? '인증 통과!' : '아쉽게 탈락…'}</span></div>
        <div class="score-big">${tierIcon} ${esc(tierName)}</div>
        <p style="font-size:36px;color:#5c5a6e">${esc(tierMsg)}</p>
        <div class="score-big" style="margin-top:10px">총점 <span id="cnt">0</span>점 <span style="font-size:38px;color:#8a7f73">/ 통과 기준 ${PASS_SCORE}점 · 만점 ${MAX_SCORE}점</span></div>
        <div class="statrow"><span>본미션 통과 ${G.passed}/8</span><span>넌센스 ${quizOk}/4</span><span>AI 대결 승리 ${wins}/4</span><span>복권 당첨 ${tixWon}/${G.ticketLog.length}</span><span>🏅 배지 ${G.badges.length}개</span></div>
        <div class="statrow"><span>💰 남은 용돈 ${won(G.money)}</span>${G.lotterySpent ? `<span style="background:#fde6df;color:#b4553a">복권에 쓴 돈 ${won(G.lotterySpent)} → 당첨금 ${won(G.lotteryWon)}</span>` : ''}${F.bonus ? `<span>예산 지키기 보너스 +${F.bonus}</span>` : ''}</div>
        <div class="score-big" style="color:#3f8f80;font-size:48px">🎖️ 이 기기 참가자 ${F.count}명 중 ${F.rank}위!</div>
        <div class="row"><button class="big" id="e2">자세한 결과 보기 ▶</button><button class="big sub" id="eP">🖨️ 인증서 인쇄</button></div></div>`);
      countUp(el.querySelector('#cnt'), F.total);
      el.querySelector('#e2').onclick = () => { snd('sfx_click'); page2(); };
      el.querySelector('#eP').onclick = () => window.print();
    };
    const page2 = () => {
      const el = openOverlay(`<div class="endcard"><div style="display:flex;gap:70px;height:100%">
        <div style="flex:1;display:flex;flex-direction:column;gap:14px">
          <h3>📊 영역별 점수</h3>
          <div class="bars">${CATS.map(([k, n]) => `<div class="bar"><label>${n}</label><div class="track"><div class="fill" data-w="${Math.min(100, Math.round(G.score[k] / CATMAX[k] * 100))}"></div></div><em>${G.score[k]}/${CATMAX[k]}</em></div>`).join('')}</div>
          <h3 style="margin-top:10px">🏅 업적 배지</h3>
          <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:30px">${G.badges.length ? G.badges.map(b => `<span style="background:#fff1d6;border-radius:999px;padding:6px 18px">${BADGES[b].icon} ${BADGES[b].name}</span>`).join('') : '<span style="color:#8a7f73">다음엔 배지를 모아 봐요!</span>'}</div>
          <div class="row" style="margin-top:auto;justify-content:flex-start"><button class="big sub" id="eB">◀ 이전</button><button class="big" id="eA">처음으로 ↺</button></div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;gap:8px">
          <h3>🧭 나의 선택 돌아보기</h3>
          <ul class="review">${G.choiceLog.map(l => `<li><span class="d" style="background:${dot[l.tag]}"></span>[${esc(l.step)}] ${esc(l.label)}<span class="p" style="color:${TAG_COLOR[l.tag]}">+${l.gained}</span></li>`).join('')}</ul>
          <h3 style="margin-top:10px">🏆 오늘의 순위 TOP 5</h3>
          <table class="lb">${F.board.slice(0, 5).map((e, i) => `<tr class="${e.id === F.me ? 'me' : ''}"><td>${['🥇','🥈','🥉','4위','5위'][i]}</td><td>${esc(e.name)}</td><td>${esc(e.tier)}</td><td>${e.score}점</td></tr>`).join('')}</table>
          <div style="font-size:28px;color:#8a7f73">이 기기 누적 참가 ${B.plays}명 · 인증 통과 ${B.passes}명 (${B.plays ? Math.round(B.passes / B.plays * 100) : 0}%)</div>
          <button class="big sub" id="eR" style="font-size:28px;padding:12px 30px;align-self:flex-start">순위 초기화 (선생님용)</button>
        </div></div></div>`);
      setTimeout(() => el.querySelectorAll('.fill').forEach(f => f.style.width = f.dataset.w + '%'), 80);
      el.querySelector('#eB').onclick = () => { snd('sfx_click'); page1(); };
      el.querySelector('#eA').onclick = () => { snd('sfx_click'); closeOverlay(); resolve(); };
      el.querySelector('#eR').onclick = () => { if(confirm('이 기기에 저장된 순위와 통과율 기록을 모두 지울까요?')){ saveBoard({ board:[], plays:0, passes:0 }); toast('순위를 초기화했어요'); } };
    };
    page1();
  });
}

/* ================================================================= 타이틀 */
function boardView(){
  const B = loadBoard();
  const el = openOverlay(`<div class="dim"><div class="modal"><h2>🏆 명예의 전당 TOP 10</h2>
    ${B.plays ? `<div style="font-size:34px;color:#3f8f80;margin:10px 0">이 기기 누적 참가 ${B.plays}명 · 인증 통과 ${B.passes}명 (${Math.round(B.passes / B.plays * 100)}%)</div>` : ''}
    ${B.board.length ? `<table class="lb" style="font-size:40px">${B.board.slice(0, 10).map((e, i) => `<tr><td>${i + 1}위</td><td>${esc(e.name)}</td><td>${esc(e.tier)}</td><td>${e.score}점</td></tr>`).join('')}</table>` : '<p style="font-size:40px;margin-top:40px">아직 기록이 없어요. 첫 번째 탐험가가 되어 보세요!</p>'}
    <button class="big sub x">닫기</button></div></div>`);
  return new Promise(r => el.querySelector('.x').onclick = () => { closeOverlay(); r(); });
}
function titleScreen(){
  hud(false); hideText(); hideAll(); bg('title');
  return new Promise(resolve => {
    const draw = () => {
      const el = openOverlay(`<div class="title"><img class="titleriri" src="assets/char/riri_happy.webp" alt=""><div class="card">
        <div class="jua" style="font-size:52px;color:#e0724f">리리와 함께하는</div>
        <h1>${[...'인천 세계시민 탐험'].map((c, i) => `<span style="animation-delay:${i * .12}s">${c === ' ' ? '&nbsp;' : c}</span>`).join('')}</h1>
        <div class="sub">📖 읽고 · 🚶 걷고 · ✍️ 쓰는 10분 도전</div>
        <div class="badges"><span>인권</span><span>평화</span><span>문화다양성</span><span>글로벌·환경</span><span>금융</span><span>AI 리터러시</span></div>
        <input id="tName" maxlength="8" placeholder="탐험가 이름을 쓰세요" autocomplete="off">
        <div class="chips">${['하늘', '바다', '별빛', '무지개', '새싹'].map(n => `<button class="chip">${n}</button>`).join('')}</div>
        <div class="info">미션 8개 · 넌센스 4개 · AI 리리와 대결 4판 · 🎟️ 스크래치 복권 · 🏅 배지 13개</div>
        <div class="warn">제한시간 안에 골라야 해요! 통과율은 절반 이하!</div>
        <div class="row"><button class="big" id="tStart">도전 시작! ▶</button><button class="big sub" id="tBoard">🏆 명예의 전당</button></div></div></div>`);
      const nm = el.querySelector('#tName');
      nm.addEventListener('keydown', e => { e.stopPropagation(); if(e.key === 'Enter') el.querySelector('#tStart').click(); });
      el.querySelectorAll('.chip').forEach(c => c.onclick = () => { nm.value = c.textContent; el.querySelectorAll('.chip').forEach(x => x.classList.remove('on')); c.classList.add('on'); beep(880, .06); });
      el.querySelector('#tBoard').onclick = async () => { snd('sfx_click'); await boardView(); draw(); };
      el.querySelector('#tStart').onclick = () => {
        const name = (nm.value.trim().replace(/[<>{}\[\]\\]/g, '') || '세계시민').slice(0, 8);
        snd('sfx_best'); fx.burst(960, 760, 40); closeOverlay(); resolve(name);
      };
    };
    draw();
  });
}

/* ================================================================= 실행 */
async function main(){
  while(true){
    const name = await titleScreen();
    resetGame(name);
    await playStory();
  }
}
main();
