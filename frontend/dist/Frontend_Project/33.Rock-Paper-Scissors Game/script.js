// Get DOM elements (Preserving original selectors & structure)
const gameContainer = document.querySelector(".container"),
  userResult = document.querySelector(".user_result img"),
  cpuResult = document.querySelector(".cpu_result img"),
  result = document.querySelector(".result"),
  optionImages = document.querySelectorAll(".option_image");

// Game State Variables
let userScore = 0;
let cpuScore = 0;
let currentStreak = 0;
let bestStreak = parseInt(localStorage.getItem('rps_best_streak') || '0');
let matchFormat = 'endless'; // 'endless', '3', '5'
let aiMode = 'smart'; // 'random', 'smart'
let userMoveHistory = [];
let soundEnabled = true;
let isAnimating = false;

// Web Audio Synthesizer
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playShakeSFX() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    for (let i = 0; i < 6; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180 + i * 20, ctx.currentTime + i * 0.35);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.35 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.35);
      osc.stop(ctx.currentTime + i * 0.35 + 0.15);
    }
  } catch (e) {}
}

function playWinSFX() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.2);
    });
  } catch (e) {}
}

function playLoseSFX() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(130, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

function playDrawSFX() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
}

// Loop through each option image element (Classic Interaction)
optionImages.forEach((image, index) => {
  image.addEventListener("click", (e) => {
    if (isAnimating) return;
    isAnimating = true;

    getAudioContext();
    playShakeSFX();

    image.classList.add("active");

    userResult.src = cpuResult.src = "images/rock.png";
    result.textContent = "Shaking...";

    // Remove "active" class from other option images
    optionImages.forEach((image2, index2) => {
      index !== index2 && image2.classList.remove("active");
    });

    gameContainer.classList.add("start");

    // Set a timeout to delay the result calculation (2.5s classic delay)
    setTimeout(() => {
      gameContainer.classList.remove("start");
      isAnimating = false;

      // Get the source of the clicked option image
      let imageSrc = optionImages[index].querySelector("img").src;
      userResult.src = imageSrc;

      // Determine user value: 'R', 'P', 'S'
      let userValue = ["R", "P", "S"][index];
      userMoveHistory.push(userValue);

      // Generate CPU Choice (Random or Smart Predictive AI)
      let randomNumber;
      if (aiMode === 'smart' && userMoveHistory.length > 2) {
        // Counter user's most frequent move
        let counts = { R: 0, P: 0, S: 0 };
        userMoveHistory.forEach(m => counts[m]++);
        let mostFrequent = 'R';
        if (counts.P > counts[mostFrequent]) mostFrequent = 'P';
        if (counts.S > counts[mostFrequent]) mostFrequent = 'S';

        // Counter: Rock -> Paper (1), Paper -> Scissors (2), Scissors -> Rock (0)
        let counters = { R: 1, P: 2, S: 0 };
        randomNumber = Math.random() < 0.75 ? counters[mostFrequent] : Math.floor(Math.random() * 3);
      } else {
        randomNumber = Math.floor(Math.random() * 3);
      }

      let cpuImages = ["images/rock.png", "images/paper.png", "images/scissors.png"];
      cpuResult.src = cpuImages[randomNumber];
      let cpuValue = ["R", "P", "S"][randomNumber];

      // Outcomes lookup
      let outcomes = {
        RR: "Draw",
        RP: "Cpu",
        RS: "User",
        PP: "Draw",
        PR: "User",
        PS: "Cpu",
        SS: "Draw",
        SR: "Cpu",
        SP: "User",
      };

      let outComeValue = outcomes[userValue + cpuValue];

      // Display result & update scores
      if (userValue === cpuValue) {
        result.textContent = "Match Draw";
        playDrawSFX();
      } else if (outComeValue === "User") {
        result.textContent = "You Won!! 🎉";
        userScore++;
        currentStreak++;
        if (currentStreak > bestStreak) {
          bestStreak = currentStreak;
          localStorage.setItem('rps_best_streak', bestStreak.toString());
        }
        playWinSFX();
      } else {
        result.textContent = "CPU Won!! 🤖";
        cpuScore++;
        currentStreak = 0;
        playLoseSFX();
      }

      updateScoreboardDOM();
      checkMatchFormatWin();

    }, 2500);
  });
});

// HUD & Score Management
function updateScoreboardDOM() {
  document.getElementById('user_score').innerText = userScore;
  document.getElementById('cpu_score').innerText = cpuScore;
  document.getElementById('streak_text').innerHTML = `<i class="fas fa-bolt" style="color: #facc15;"></i> Streak: ${currentStreak}`;
}

function checkMatchFormatWin() {
  if (matchFormat === 'endless') return;

  const targetWins = matchFormat === '3' ? 2 : 3;
  if (userScore >= targetWins || cpuScore >= targetWins) {
    const userWonMatch = userScore > cpuScore;
    setTimeout(() => {
      showMatchWinModal(userWonMatch);
    }, 500);
  }
}

function showMatchWinModal(userWon) {
  const modal = document.getElementById('win_modal');
  const icon = document.getElementById('modal_icon');
  const title = document.getElementById('modal_title');
  const subtitle = document.getElementById('modal_subtitle');
  const finalScore = document.getElementById('modal_final_score');
  const bestStrk = document.getElementById('modal_best_streak');

  finalScore.innerText = `${userScore} - ${cpuScore}`;
  bestStrk.innerText = bestStreak;

  if (userWon) {
    icon.innerHTML = '<i class="fas fa-trophy" style="color: #facc15;"></i>';
    title.innerText = 'MATCH VICTORY!';
    title.style.color = '#a855f7';
    subtitle.innerText = `You conquered the Best of ${matchFormat} match!`;
    playWinSFX();
  } else {
    icon.innerHTML = '<i class="fas fa-robot" style="color: #ef4444;"></i>';
    title.innerText = 'DEFEATED BY CPU';
    title.style.color = '#ef4444';
    subtitle.innerText = `CPU won the Best of ${matchFormat} match.`;
    playLoseSFX();
  }

  modal.style.display = 'flex';
}

function closeModalAndRestart() {
  document.getElementById('win_modal').style.display = 'none';
  resetMatch();
}

function setMatchFormat(fmt) {
  matchFormat = fmt;
  document.querySelectorAll('.fmt_btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.fmt === fmt);
  });
  resetMatch();
}

function setAiMode(mode) {
  aiMode = mode;
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('btn_sound');
  btn.innerHTML = soundEnabled ? '<i class="fas fa-volume-high"></i>' : '<i class="fas fa-volume-xmark"></i>';
}

function resetMatch() {
  userScore = 0;
  cpuScore = 0;
  currentStreak = 0;
  userMoveHistory = [];
  updateScoreboardDOM();
  result.textContent = "Let's Play!!";
  userResult.src = cpuResult.src = "images/rock.png";
  optionImages.forEach(img => img.classList.remove("active"));
}

function resetScores() {
  resetMatch();
  bestStreak = 0;
  localStorage.setItem('rps_best_streak', '0');
  updateScoreboardDOM();
}
