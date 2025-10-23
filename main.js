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
  questionNumber: document.getElementById('question-number'),
  question: document.getElementById('question'),
  choices: [
    document.getElementById('btn-0'),
    document.getElementById('btn-1'),
    document.getElementById('btn-2'),
    document.getElementById('btn-3')
  ],
  sparkle: document.getElementById('sparkle'),
  sakura: document.getElementById('sakura'),
  sakuraImg: document.getElementById('sakura-img'),
  speech: document.getElementById('speech'),
  overlay: document.getElementById('overlay'),
  resultTitle: document.getElementById('result-title'),
  resultMessage: document.getElementById('result-message'),
  resultImage: document.getElementById('result-image'),
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
  els.choices.forEach(btn => {
    if(btn) btn.disabled = !enabled;
  });
}

function getQuestionNumberText(index){
  const numbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  return `第${numbers[index] || (index + 1)}問`;
}

function showQuestion(){
  const q = state.questions[state.stage];
  if(!q){ return; }
  
  // 問題番号を更新
  els.questionNumber.textContent = getQuestionNumberText(state.stage);
  els.question.textContent = q.text;
  
  // 4つの選択肢を表示
  if(q.choices && q.choices.length === 4){
    q.choices.forEach((choice, i) => {
      if(els.choices[i]){
        els.choices[i].textContent = choice.label;
        els.choices[i].style.display = 'block';
      }
    });
  }
  
  setChoicesEnabled(true);
  say('どれかなぁ…');
  startThinking();
  startSpeechLoop();
}

function endGame(){
  state.ended = true;
  setChoicesEnabled(false);
  const total = state.questions.length;
  const correct = state.correctCount;
  const allCorrect = correct === total;
  
  if(allCorrect){
    els.resultImage.src = 'seikai.png';
    els.resultImage.style.display = 'block';
    els.resultTitle.textContent = '全問正解！おめでとうー！！';
    els.resultMessage.textContent = '秘密の合言葉は「テスト」';
  } else {
    els.resultImage.style.display = 'none';
    els.resultTitle.textContent = '残念！';
    els.resultMessage.textContent = '全問正解まで頑張ってね！';
  }
  
  els.overlay.hidden = false;
}

function handleChoice(choiceIndex){
  if(state.ended) return;
  const q = state.questions[state.stage];
  if(!q) return;
  setChoicesEnabled(false);
  stopThinking();
  stopSpeechLoop();
  playClick();

  // 魔法の光を演出
  const btn = els.choices[choiceIndex];
  const targetX = window.innerWidth * 0.5;
  const targetY = window.innerHeight * 0.35;
  setSparkle(btn, targetX, targetY);
  playMagic();

  const isCorrect = q.answer === choiceIndex;
  if(isCorrect) state.correctCount += 1;
  state.pathChosen.push(choiceIndex);
  state.answers.push({ stage: state.stage, chosen: choiceIndex, correct: q.answer });

  // 歩く演出（少し前進）
  els.sakura.style.transform = `translateX(${(state.stage*8)}px)`;

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
  els.choices.forEach((btn, index) => {
    if(btn){
      btn.addEventListener('click', ()=> handleChoice(index));
    }
  });
  els.retry.addEventListener('click', resetGame);
  // 効果音なし
}

(async function init(){
  bind();
  // スタートアニメーション中は選択肢を無効化
  setChoicesEnabled(false);
  await loadQuestions();
  updateHUD();
  await showStartAnimation();
  showQuestion();
})();


