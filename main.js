const state = {
  stage: 0,
  correctCount: 0,
  ended: false,
  questions: [],
  pathChosen: [],
  answers: [],
};

const els = {
  stage: document.getElementById('stage'),
  question: document.getElementById('question'),
  left: document.getElementById('btn-left'),
  right: document.getElementById('btn-right'),
  sparkle: document.getElementById('sparkle'),
  sakura: document.getElementById('sakura'),
  sakuraImg: document.getElementById('sakura-img'),
  speech: document.getElementById('speech'),
  overlay: document.getElementById('overlay'),
  resultTitle: document.getElementById('result-title'),
  resultMessage: document.getElementById('result-message'),
  retry: document.getElementById('retry'),
  startAnimation: document.getElementById('start-animation'),
  startText: document.getElementById('start-text'),
};

// 簡易SE
const audioCtx = null; // 効果音無効
function playClick(){}
function playCorrect(){}
function playWrong(){}
function playMagic(){}

function setSparkle(fromEl, toX, toY){
  const rect = fromEl.getBoundingClientRect();
  const startX = rect.left + rect.width/2;
  const startY = rect.top + rect.height/2;
  const dx = toX - startX;
  const dy = toY - startY;
  els.sparkle.style.left = `${startX}px`;
  els.sparkle.style.top = `${startY}px`;
  els.sparkle.style.setProperty('--dx', `${dx}px`);
  els.sparkle.style.setProperty('--dy', `${dy}px`);
  els.sparkle.classList.remove('show');
  void els.sparkle.offsetWidth;
  els.sparkle.classList.add('show');
}

function updateHUD(){
  els.stage.textContent = `${state.stage+1} / ${state.questions.length || 5}`;
}

function say(text){
  els.speech.textContent = text;
  els.speech.classList.add('show');
  setTimeout(()=> els.speech.classList.remove('show'), 1200);
}

// 3秒ごとに吹き出しを表示
function startSpeechLoop(){
  if(els._speechTimer) clearInterval(els._speechTimer);
  els._speechTimer = setInterval(()=>{
    say('どっちかなぁ…');
  }, 10000);
}
function stopSpeechLoop(){
  if(els._speechTimer){ clearInterval(els._speechTimer); els._speechTimer = null; }
}

// 待機時に左右反転をゆっくり繰り返す
function startThinking(){
  if(!els.sakuraImg) return;
  // 反転したまま静止
  els.sakuraImg.style.transition = 'transform 300ms ease-out';
  if(els.sakuraImg._thinkingTimer) {
    clearInterval(els.sakuraImg._thinkingTimer);
    els.sakuraImg._thinkingTimer = null;
  }
  els.sakuraImg.style.transform = 'scaleX(-1)';
}
function stopThinking(){
  if(!els.sakuraImg) return;
  if(els.sakuraImg._thinkingTimer){ clearInterval(els.sakuraImg._thinkingTimer); els.sakuraImg._thinkingTimer = null; }
  // 静止表示を維持
  els.sakuraImg.style.transform = 'scaleX(-1)';
}

async function loadQuestions(){
  const res = await fetch('questions.json', { cache: 'no-store' });
  const data = await res.json();
  state.questions = data.questions.slice(0, 7);
}

function setChoicesEnabled(enabled){
  els.left.disabled = !enabled;
  els.right.disabled = !enabled;
}

function showQuestion(){
  const q = state.questions[state.stage];
  if(!q){ return; }
  els.question.textContent = q.text;
  els.left.textContent = q.left.label || '左';
  els.right.textContent = q.right.label || '右';
  setChoicesEnabled(true);
  say('どっちかなぁ…');
  startThinking();
  startSpeechLoop();
}

function endGame(){
  state.ended = true;
  setChoicesEnabled(false);
  const total = state.questions.length;
  const correct = state.correctCount;
  const allCorrect = correct === total;
  const title = allCorrect ? 'あなたは全問正解です！' : '残念！';
  const message = allCorrect
    ? '秘密の合言葉は「テスト」'
    : '全問正解まで頑張ってね！';
  els.resultTitle.textContent = title;
  els.resultMessage.textContent = message;
  els.overlay.hidden = false;
}

function handleChoice(dir){
  if(state.ended) return;
  const q = state.questions[state.stage];
  if(!q) return;
  setChoicesEnabled(false);
  stopThinking();
  stopSpeechLoop();
  playClick();

  // 魔法の光を演出
  const btn = dir === 'left' ? els.left : els.right;
  const targetX = window.innerWidth * (dir === 'left' ? 0.2 : 0.8);
  const targetY = window.innerHeight * 0.35;
  setSparkle(btn, targetX, targetY);
  playMagic();

  const isCorrect = q.answer === dir;
  if(isCorrect) state.correctCount += 1;
  state.pathChosen.push(dir);
  state.answers.push({ stage: state.stage, chosen: dir, correct: q.answer });

  // 歩く演出（少し前進）
  els.sakura.style.transform = `translateX(${(state.stage*8) + (dir==='left'?-4:4)}px)`;

  setTimeout(()=>{
    if(!isCorrect){
      playWrong();
    } else {
      playCorrect();
    }

    state.stage += 1;
    updateHUD();
    if(state.stage >= state.questions.length){
      endGame();
    } else {
      showQuestion();
    }
  }, 2000);
}

function resetGame(){
  state.stage = 0;
  state.correctCount = 0;
  state.ended = false;
  state.pathChosen = [];
  state.answers = [];
  els.overlay.hidden = true;
  els.sakura.style.transform = 'translateX(0)';
  updateHUD();
  showQuestion();
}

async function showStartAnimation(){
  const messages = ['ハロウィンクイズ🎃', '準備はいいかな？', 'それでは', 'よーい', 'スタート！'];
  
  for(const msg of messages){
    els.startText.textContent = msg;
    // アニメーションを再トリガー
    els.startText.style.animation = 'none';
    void els.startText.offsetWidth; // リフロー
    els.startText.style.animation = 'fadeInOut 1s ease-in-out';
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  els.startAnimation.classList.add('hidden');
}

function bind(){
  els.left.addEventListener('click', ()=> handleChoice('left'));
  els.right.addEventListener('click', ()=> handleChoice('right'));
  els.retry.addEventListener('click', resetGame);
  // 効果音なし
}

(async function init(){
  bind();
  await loadQuestions();
  updateHUD();
  await showStartAnimation();
  showQuestion();
})();


