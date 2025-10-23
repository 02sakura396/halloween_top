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
  passwordLink: document.getElementById('password-link'),
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
  // ローカルファイルでも動作するように、questions.jsonの内容を直接埋め込み
  const questionsData = {
    "questions": [
      {
        "text": "さくらの今回のほんね通信は第何号？",
        "choices": [
          { "label": "５号" },
          { "label": "７号" },
          { "label": "８号" },
          { "label": "９号" }
        ],
        "answer": 2
      },
      {
        "text": "さくらの好きな男性のタイプは？",
        "choices": [
          { "label": "イケメン" },
          { "label": "おじさん" },
          { "label": "お金持ち" },
          { "label": "優しい人" }
        ],
        "answer": 1
      },
      {
        "text": "さくらの好きなアーティストは？",
        "choices": [
          { "label": "TWICE" },
          { "label": "乃木坂" },
          { "label": "YOASOBI" },
          { "label": "いきものがかり" }
        ],
        "answer": 2
      },
      {
        "text": "さくらの好きなうまい棒の味は？",
        "choices": [
          { "label": "コンポタージュ" },
          { "label": "チーズ" },
          { "label": "たこ焼き" },
          { "label": "サラミ" }
        ],
        "answer": 0
      },
      {
        "text": "さくらが褒められると喜ぶところは？",
        "choices": [
          { "label": "顔" },
          { "label": "胸" },
          { "label": "おしり" },
          { "label": "脚" }
        ],
        "answer": 1
      },
      {
        "text": "さくらは週に何回ひとりでしてるでしょう！",
        "choices": [
          { "label": "０回" },
          { "label": "１回" },
          { "label": "３回" },
          { "label": "毎日" }
        ],
        "answer": 3
      },
      {
        "text": "さくらが得意な技は？",
        "choices": [
          { "label": "Y字バランス" },
          { "label": "倒立" },
          { "label": "でんぐり返し" },
          { "label": "M字開脚" }
        ],
        "answer": 0
      }
    ]
  };
  
  state.questions = questionsData.questions.slice(0, 7);
  console.log('Loaded questions:', state.questions.length);
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
  console.log('showQuestion called, stage:', state.stage, 'total questions:', state.questions.length);
  const q = state.questions[state.stage];
  if(!q){ 
    console.error('Question not found for stage:', state.stage);
    return; 
  }
  
  console.log('Current question:', q);
  
  // 問題番号を更新
  els.questionNumber.textContent = getQuestionNumberText(state.stage);
  els.question.textContent = q.text;
  console.log('Question text set:', q.text);
  
  // 4つの選択肢を表示
  if(q.choices && q.choices.length >= 4){
    console.log('Setting up choices...');
    for(let i = 0; i < 4; i++){
      if(els.choices[i] && q.choices[i]){
        els.choices[i].textContent = q.choices[i].label;
        els.choices[i].style.display = 'block';
        els.choices[i].style.visibility = 'visible';
        console.log(`Choice ${i} set:`, q.choices[i].label);
      } else {
        console.warn(`Choice ${i} element or data missing`);
      }
    }
  } else {
    console.error('Question does not have 4 choices:', q);
  }
  
  setChoicesEnabled(true);
  console.log('Choices enabled');
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
    els.resultMessage.textContent = '秘密の合言葉は「sakura251023」';
    els.retry.style.display = 'none';
    els.passwordLink.style.display = 'inline-block';
  } else {
    els.resultImage.style.display = 'none';
    els.resultTitle.textContent = '残念！';
    els.resultMessage.textContent = '全問正解まで頑張ってね！';
    els.retry.style.display = 'inline-block';
    els.passwordLink.style.display = 'none';
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
  }, 1000);
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
  
  // 少し待機してから非表示にする
  await new Promise(resolve => setTimeout(resolve, 200));
  els.startAnimation.classList.add('hidden');
  console.log('Start animation completed');
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
  console.log('Init started');
  bind();
  // スタートアニメーション中は選択肢を無効化
  setChoicesEnabled(false);
  console.log('Loading questions...');
  await loadQuestions();
  console.log('Questions loaded:', state.questions);
  updateHUD();
  console.log('Starting animation...');
  await showStartAnimation();
  console.log('Showing question...');
  showQuestion();
  console.log('Init completed');
})();


