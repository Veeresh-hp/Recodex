// --- Cyber Snake Pro Game Engine ---

const GRID_SIZE = 30;

let playBoard;
let gameOver = false;
let isPaused = false;
let soundEnabled = true;

let foodX, foodY;
let isGoldenFood = false;
let goldenTimer = null;

let snakeX = 10, snakeY = 15;
let velocityX = 1, velocityY = 0; // Start moving right automatically
let lastVelocityX = 1, lastVelocityY = 0;
let snakeBody = [];

let gameInterval = null;
let gameSpeed = 100; // ms per frame

let score = 0;
let applesEaten = 0;
let highScore = parseInt(localStorage.getItem('snake_highscore') || '0');

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

function playEatSFX() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
}

function playGoldenSFX() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const notes = [659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
            gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.06 + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.06);
            osc.stop(ctx.currentTime + idx * 0.06 + 0.12);
        });
    } catch (e) {}
}

function playCrashSFX() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
}

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    playBoard = document.getElementById('play-board');
    updateHUD();
    setupControls();
    startGame();
});

function startGame() {
    if (gameInterval) clearInterval(gameInterval);
    if (goldenTimer) clearTimeout(goldenTimer);

    gameOver = false;
    isPaused = false;
    snakeX = 10;
    snakeY = 15;
    velocityX = 1;
    velocityY = 0;
    lastVelocityX = 1;
    lastVelocityY = 0;
    snakeBody = [[10, 15], [9, 15], [8, 15]];
    score = 0;
    applesEaten = 0;

    document.getElementById('gameover-modal').style.display = 'none';
    document.getElementById('pause-overlay').style.display = 'none';

    updateFoodPosition();
    updateHUD();

    gameInterval = setInterval(gameLoop, gameSpeed);
}

function updateFoodPosition() {
    foodX = Math.floor(Math.random() * GRID_SIZE) + 1;
    foodY = Math.floor(Math.random() * GRID_SIZE) + 1;

    // 20% chance to spawn a Golden Apple
    isGoldenFood = Math.random() < 0.2;

    if (isGoldenFood) {
        if (goldenTimer) clearTimeout(goldenTimer);
        goldenTimer = setTimeout(() => {
            if (isGoldenFood) updateFoodPosition();
        }, 5000);
    }
}

function gameLoop() {
    if (gameOver || isPaused) return;

    // Advance Snake Head
    snakeX += velocityX;
    snakeY += velocityY;

    lastVelocityX = velocityX;
    lastVelocityY = velocityY;

    // Check Wall Collision
    if (snakeX <= 0 || snakeX > GRID_SIZE || snakeY <= 0 || snakeY > GRID_SIZE) {
        return triggerGameOver("Crashed into the wall boundary!");
    }

    // Check Self Collision
    for (let i = 0; i < snakeBody.length; i++) {
        if (snakeX === snakeBody[i][0] && snakeY === snakeBody[i][1]) {
            return triggerGameOver("Bit your own tail!");
        }
    }

    // Check Food Collision
    let eaten = false;
    if (snakeX === foodX && snakeY === foodY) {
        eaten = true;
        applesEaten++;
        if (isGoldenFood) {
            score += 30;
            playGoldenSFX();
        } else {
            score += 10;
            playEatSFX();
        }

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snake_highscore', highScore.toString());
        }

        updateHUD();
        updateFoodPosition();
    }

    // Update Body Segments
    snakeBody.unshift([snakeX, snakeY]);
    if (!eaten) {
        snakeBody.pop();
    }

    // Render Board HTML
    renderBoard();
}

function renderBoard() {
    let html = `<div class="${isGoldenFood ? 'golden-food' : 'food'}" style="grid-area: ${foodY} / ${foodX}"></div>`;

    for (let i = 0; i < snakeBody.length; i++) {
        const isHead = i === 0;
        const className = isHead ? 'head' : 'body-segment';
        html += `<div class="${className}" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
    }

    playBoard.innerHTML = html;
}

function triggerGameOver(cause) {
    gameOver = true;
    clearInterval(gameInterval);
    playCrashSFX();

    document.getElementById('modal-cause').innerText = cause;
    document.getElementById('stat-final-score').innerText = score;
    document.getElementById('stat-high-score').innerText = highScore;
    document.getElementById('gameover-modal').style.display = 'flex';
}

// --- Direction & Key Listeners ---
function changeDirection(key) {
    if (gameOver) return;
    getAudioContext();

    if (key === "ArrowUp" || key === "KeyW") {
        if (lastVelocityY !== 1) {
            velocityX = 0;
            velocityY = -1;
        }
    } else if (key === "ArrowDown" || key === "KeyS") {
        if (lastVelocityY !== -1) {
            velocityX = 0;
            velocityY = 1;
        }
    } else if (key === "ArrowLeft" || key === "KeyA") {
        if (lastVelocityX !== 1) {
            velocityX = -1;
            velocityY = 0;
        }
    } else if (key === "ArrowRight" || key === "KeyD") {
        if (lastVelocityX !== -1) {
            velocityX = 1;
            velocityY = 0;
        }
    }
}

function setupControls() {
    // Keyboard listener
    window.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            e.preventDefault();
            togglePause();
            return;
        }
        changeDirection(e.code);
    });

    // Touch D-Pad listener
    document.querySelectorAll(".dpad-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            changeDirection(btn.dataset.key);
        });
    });

    // Touch Swipe Gestures
    let touchStartX = 0;
    let touchStartY = 0;

    playBoard.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    playBoard.addEventListener('touchend', (e) => {
        let touchEndX = e.changedTouches[0].clientX;
        let touchEndY = e.changedTouches[0].clientY;

        let dx = touchEndX - touchStartX;
        let dy = touchEndY - touchStartY;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 30) changeDirection("ArrowRight");
            else if (dx < -30) changeDirection("ArrowLeft");
        } else {
            if (dy > 30) changeDirection("ArrowDown");
            else if (dy < -30) changeDirection("ArrowUp");
        }
    }, { passive: true });
}

// --- Control Bar & Settings ---
function togglePause() {
    if (gameOver) return;
    isPaused = !isPaused;

    const overlay = document.getElementById('pause-overlay');
    const btnPause = document.getElementById('btn-pause');
    const boardPauseBtn = document.getElementById('board-pause-btn');

    if (isPaused) {
        overlay.style.display = 'flex';
        if (btnPause) btnPause.innerHTML = '<i class="fas fa-play"></i> Play (Space)';
        if (boardPauseBtn) boardPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        overlay.style.display = 'none';
        if (btnPause) btnPause.innerHTML = '<i class="fas fa-pause"></i> Pause (Space)';
        if (boardPauseBtn) boardPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
}

function setSpeed(speedMs) {
    gameSpeed = speedMs;
    document.querySelectorAll('.spd-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.spd) === speedMs);
    });

    const spdText = speedMs === 140 ? 'Easy' : (speedMs === 65 ? 'Hard' : 'Medium');
    document.getElementById('val-speed').innerText = spdText;

    if (!gameOver && gameInterval) {
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed);
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('btn-sound');
    if (btn) btn.innerHTML = soundEnabled ? '<i class="fas fa-volume-high"></i> Sound On' : '<i class="fas fa-volume-xmark"></i> Sound Off';
}

function updateHUD() {
    document.getElementById('val-score').innerText = score;
    document.getElementById('val-highscore').innerText = highScore;
}

function restartGame() {
    startGame();
}