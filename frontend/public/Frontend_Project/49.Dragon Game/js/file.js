// --- Dragon Runner Pro Engine ---

let dino;
let block;
let cloudLayer;
let roadLayer;

let isGameOver = false;
let isPaused = false;
let isJumping = false;
let soundEnabled = true;

let score = 0;
let highScore = parseInt(localStorage.getItem('dragon_highscore') || '0');

let scoreInterval = null;
let collisionInterval = null;

// Web Audio API Synthesizer
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

function playJumpSFX() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
}

function playScoreSFX() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
}

function playCrashSFX() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    dino = document.getElementById('dino');
    block = document.getElementById('block');
    cloudLayer = document.getElementById('cloud-layer');
    roadLayer = document.getElementById('road-layer');

    updateHUD();
    setupControls();
    startGame();
});

function startGame() {
    isGameOver = false;
    isPaused = false;
    isJumping = false;
    score = 0;

    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('gameover-overlay').style.display = 'none';

    // Start background scrolling & obstacle animation
    cloudLayer.classList.add('running');
    roadLayer.classList.add('running');
    
    // Reset block position & force animation restart
    block.classList.remove('running');
    void block.offsetWidth; // Trigger reflow
    block.classList.add('running');

    updateHUD();

    // Start Score Interval
    if (scoreInterval) clearInterval(scoreInterval);
    scoreInterval = setInterval(() => {
        if (!isPaused && !isGameOver) {
            score += 1;
            if (score % 100 === 0) playScoreSFX();

            if (score > highScore) {
                highScore = score;
                localStorage.setItem('dragon_highscore', highScore.toString());
            }
            updateHUD();
        }
    }, 100);

    // Start Collision Detection Interval
    if (collisionInterval) clearInterval(collisionInterval);
    collisionInterval = setInterval(checkCollision, 15);
}

function triggerJump() {
    if (isJumping || isPaused || isGameOver) return;
    getAudioContext();

    isJumping = true;
    playJumpSFX();
    dino.classList.add('dino-jump');

    setTimeout(() => {
        dino.classList.remove('dino-jump');
        isJumping = false;
    }, 650);
}

function checkCollision() {
    if (isPaused || isGameOver) return;

    const dinoRect = dino.getBoundingClientRect();
    const blockRect = block.getBoundingClientRect();

    // Forgiving hitbox collision check (18px inset padding)
    const insetX = 18;
    const insetY = 14;

    const isColliding = !(
        dinoRect.right - insetX < blockRect.left + insetX ||
        dinoRect.left + insetX > blockRect.right - insetX ||
        dinoRect.bottom - insetY < blockRect.top + insetY ||
        dinoRect.top + insetY > blockRect.bottom - insetY
    );

    if (isColliding) {
        triggerGameOver();
    }
}

function triggerGameOver() {
    isGameOver = true;
    clearInterval(scoreInterval);
    clearInterval(collisionInterval);

    playCrashSFX();

    // Freeze animations
    cloudLayer.classList.remove('running');
    roadLayer.classList.remove('running');
    block.style.animationPlayState = 'paused';

    document.getElementById('final-score').innerText = score;
    document.getElementById('final-best').innerText = highScore;
    document.getElementById('gameover-overlay').style.display = 'flex';
}

function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;

    const overlay = document.getElementById('pause-overlay');
    const txtPause = document.getElementById('txt-pause');
    const iconPause = document.querySelector('#btn-pause i');

    if (isPaused) {
        overlay.style.display = 'flex';
        cloudLayer.classList.remove('running');
        roadLayer.classList.remove('running');
        block.style.animationPlayState = 'paused';

        if (txtPause) txtPause.innerText = 'Resume';
        if (iconPause) iconPause.className = 'fas fa-play';
    } else {
        overlay.style.display = 'none';
        cloudLayer.classList.add('running');
        roadLayer.classList.add('running');
        block.style.animationPlayState = 'running';

        if (txtPause) txtPause.innerText = 'Pause';
        if (iconPause) iconPause.className = 'fas fa-pause';
    }
}

function setupControls() {
    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            e.preventDefault();
            triggerJump();
        } else if (e.code === 'Escape') {
            e.preventDefault();
            togglePause();
        }
    });

    // Game Stage Click / Tap Controls
    const gameStage = document.getElementById('game-stage');
    gameStage.addEventListener('click', (e) => {
        // Prevent click if user clicked a button or inside modal
        if (e.target.closest('button') || e.target.closest('.overlay-modal')) return;
        triggerJump();
    });
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('btn-sound');
    btn.innerHTML = soundEnabled ? '<i class="fas fa-volume-high"></i>' : '<i class="fas fa-volume-xmark"></i>';
}

function updateHUD() {
    document.getElementById('val-score').innerText = score;
    document.getElementById('val-highscore').innerText = highScore;
}

function restartGame() {
    block.style.animationPlayState = 'running';
    startGame();
}
