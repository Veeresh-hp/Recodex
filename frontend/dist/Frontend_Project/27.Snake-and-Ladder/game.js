// --- Snake & Ladder Deluxe Game Engine ---

const LADDERS = {
    1: 38,
    4: 14,
    8: 30,
    21: 42,
    28: 76,
    50: 67,
    71: 92,
    80: 99
};

const SNAKES = {
    32: 10,
    36: 6,
    48: 26,
    62: 18,
    88: 24,
    95: 56,
    97: 78
};

// 3D Dice Face Orientations
const DICE_ROTATIONS = {
    1: { x: 0, y: 0 },
    2: { x: 90, y: 0 },
    3: { x: 0, y: -90 },
    4: { x: 0, y: 90 },
    5: { x: -90, y: 0 },
    6: { x: 0, y: 180 }
};

let p1Pos = 0;
let p2Pos = 0;
let currentPlayer = 1; // 1 = Red, 2 = Yellow/CPU
let gameMode = '2p'; // '2p' or 'cpu'
let isRolling = false;
let soundEnabled = true;
let totalRolls = 0;
let laddersClimbed = 0;

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

function playRollSFX() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        for (let i = 0; i < 4; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300 + Math.random() * 250, ctx.currentTime + i * 0.08);
            gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.06);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.08);
            osc.stop(ctx.currentTime + i * 0.08 + 0.06);
        }
    } catch (e) {}
}

function playLadderSFX() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
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

function playSnakeSFX() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
}

function playWinSFX() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const fanfare = [523.25, 659.25, 783.99, 1046.50];
        fanfare.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
            gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.14);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.14 + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.14);
            osc.stop(ctx.currentTime + idx * 0.14 + 0.35);
        });
    } catch (e) {}
}

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
    buildBoardGrid();
    drawSVGConnections();
    updateTokenPositions();
});

function buildBoardGrid() {
    const grid = document.getElementById('board-grid');
    grid.innerHTML = '';

    // Create 10 rows (rows 9 down to 0)
    for (let r = 9; r >= 0; r--) {
        const isEvenRow = r % 2 === 0;
        for (let c = 0; c < 10; c++) {
            // Calculate tile number for boustrophedon layout
            const colIndex = isEvenRow ? c : (9 - c);
            const tileNum = r * 10 + colIndex + 1;

            const cell = document.createElement('div');
            cell.className = `cell ${(r + c) % 2 === 0 ? 'alt-tile' : ''}`;
            cell.id = `tile-${tileNum}`;

            const numSpan = document.createElement('span');
            numSpan.className = 'cell-num';
            numSpan.innerText = tileNum;

            const pawnBox = document.createElement('div');
            pawnBox.className = 'pawn-container';
            pawnBox.id = `pawn-box-${tileNum}`;

            cell.appendChild(numSpan);
            cell.appendChild(pawnBox);
            grid.appendChild(cell);
        }
    }
}

// Get center SVG coordinate (0 to 1000) for tile N
function getTileCenter(n) {
    const r = Math.floor((n - 1) / 10);
    const isEvenRow = r % 2 === 0;
    const c = isEvenRow ? ((n - 1) % 10) : (9 - ((n - 1) % 10));

    const cx = (c + 0.5) * 100;
    const cy = (9 - r + 0.5) * 100;
    return { x: cx, y: cy };
}

function drawSVGConnections() {
    const svg = document.getElementById('svg-overlay');
    svg.innerHTML = `
        <defs>
            <linearGradient id="snakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ef4444" />
                <stop offset="100%" stop-color="#991b1b" />
            </linearGradient>
            <linearGradient id="ladderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#4ade80" />
                <stop offset="100%" stop-color="#16a34a" />
            </linearGradient>
            <filter id="glow">
                <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.5"/>
            </filter>
        </defs>
    `;

    // Draw Ladders
    for (let start in LADDERS) {
        const end = LADDERS[start];
        const p1 = getTileCenter(parseInt(start));
        const p2 = getTileCenter(end);

        // Vector perpendicular offset for 2 side rails
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        const nx = (-dy / len) * 12;
        const ny = (dx / len) * 12;

        const rail1 = `<line x1="${p1.x + nx}" y1="${p1.y + ny}" x2="${p2.x + nx}" y2="${p2.y + ny}" stroke="url(#ladderGrad)" stroke-width="6" stroke-linecap="round" filter="url(#glow)" />`;
        const rail2 = `<line x1="${p1.x - nx}" y1="${p1.y - ny}" x2="${p2.x - nx}" y2="${p2.y - ny}" stroke="url(#ladderGrad)" stroke-width="6" stroke-linecap="round" filter="url(#glow)" />`;

        // Cross rungs
        let rungs = '';
        const numRungs = Math.floor(len / 35);
        for (let i = 1; i <= numRungs; i++) {
            const t = i / (numRungs + 1);
            const rx = p1.x + dx * t;
            const ry = p1.y + dy * t;
            rungs += `<line x1="${rx + nx}" y1="${ry + ny}" x2="${rx - nx}" y2="${ry - ny}" stroke="#86efac" stroke-width="4" stroke-linecap="round" />`;
        }

        svg.innerHTML += rail1 + rail2 + rungs;
    }

    // Draw Snakes
    for (let start in SNAKES) {
        const end = SNAKES[start];
        const p1 = getTileCenter(parseInt(start));
        const p2 = getTileCenter(end);

        const midX = (p1.x + p2.x) / 2 + (p1.x > p2.x ? 50 : -50);
        const midY = (p1.y + p2.y) / 2;

        const path = `<path d="M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}" stroke="url(#snakeGrad)" stroke-width="16" fill="none" stroke-linecap="round" filter="url(#glow)" />`;
        const head = `<circle cx="${p1.x}" cy="${p1.y}" r="12" fill="#f87171" stroke="#ffffff" stroke-width="2" />`;

        svg.innerHTML += path + head;
    }
}

function updateTokenPositions() {
    // Clear existing tokens from all pawn boxes
    document.querySelectorAll('.pawn-container').forEach(box => box.innerHTML = '');

    // Render Red Token (P1)
    if (p1Pos > 0 && p1Pos <= 100) {
        const box = document.getElementById(`pawn-box-${p1Pos}`);
        if (box) {
            const p1El = document.createElement('div');
            p1El.className = 'pawn p1-pawn';
            p1El.innerHTML = '<i class="fas fa-chess-pawn"></i>';
            box.appendChild(p1El);
        }
    }

    // Render Yellow Token (P2)
    if (p2Pos > 0 && p2Pos <= 100) {
        const box = document.getElementById(`pawn-box-${p2Pos}`);
        if (box) {
            const p2El = document.createElement('div');
            p2El.className = 'pawn p2-pawn';
            p2El.innerHTML = '<i class="fas fa-chess-pawn"></i>';
            box.appendChild(p2El);
        }
    }

    document.getElementById('pos-p1').innerText = p1Pos === 0 ? 'Tile: START' : `Tile: ${p1Pos}`;
    document.getElementById('pos-p2').innerText = p2Pos === 0 ? 'Tile: START' : `Tile: ${p2Pos}`;
}

// --- Gameplay Mechanics ---
function rollDice() {
    if (isRolling) return;
    getAudioContext();

    isRolling = true;
    totalRolls++;
    document.getElementById('diceBtn').disabled = true;

    playRollSFX();

    const rolledValue = Math.floor(Math.random() * 6) + 1;
    const cube = document.getElementById('dice-cube');

    // Add extra rotations for dynamic 3D rolling effect
    const rot = DICE_ROTATIONS[rolledValue];
    const extraX = (Math.floor(Math.random() * 3) + 2) * 360;
    const extraY = (Math.floor(Math.random() * 3) + 2) * 360;

    cube.style.transform = `rotateX(${rot.x + extraX}deg) rotateY(${rot.y + extraY}deg)`;

    setTimeout(() => {
        processTurn(rolledValue);
    }, 650);
}

function processTurn(rollNum) {
    const isP1 = currentPlayer === 1;
    const pName = isP1 ? 'Red' : (gameMode === 'cpu' ? 'CPU' : 'Yellow');
    let currentPos = isP1 ? p1Pos : p2Pos;
    let targetPos = currentPos + rollNum;

    logActivity(`🎲 ${pName} rolled a <b>${rollNum}</b>.`);

    if (targetPos > 100) {
        logActivity(`⚠️ ${pName} needs exact roll to land on 100! Turn skipped.`);
        endTurn();
        return;
    }

    // Step-by-step token movement
    let stepPos = currentPos;
    const moveInterval = setInterval(() => {
        stepPos++;
        if (isP1) p1Pos = stepPos;
        else p2Pos = stepPos;
        updateTokenPositions();

        if (stepPos === targetPos) {
            clearInterval(moveInterval);
            checkSpecialTiles(targetPos, isP1, pName);
        }
    }, 160);
}

function checkSpecialTiles(pos, isP1, pName) {
    // Check Ladder
    if (LADDERS[pos]) {
        const destination = LADDERS[pos];
        logActivity(`🪜 AMAZING! ${pName} climbed a ladder from tile ${pos} to <b>${destination}</b>!`, 'ladder');
        playLadderSFX();
        laddersClimbed++;
        setTimeout(() => {
            if (isP1) p1Pos = destination;
            else p2Pos = destination;
            updateTokenPositions();
            checkWinState(destination, pName);
        }, 350);
        return;
    }

    // Check Snake
    if (SNAKES[pos]) {
        const destination = SNAKES[pos];
        logActivity(`🐍 OH NO! ${pName} was bitten by a snake at tile ${pos} down to <b>${destination}</b>!`, 'snake');
        playSnakeSFX();
        setTimeout(() => {
            if (isP1) p1Pos = destination;
            else p2Pos = destination;
            updateTokenPositions();
            checkWinState(destination, pName);
        }, 350);
        return;
    }

    checkWinState(pos, pName);
}

function checkWinState(pos, pName) {
    if (pos === 100) {
        logActivity(`🏆 ${pName} REACHED TILE 100 AND WON THE GAME!`, 'win');
        playWinSFX();
        showWinModal(pName);
        return;
    }

    endTurn();
}

function endTurn() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    isRolling = false;
    document.getElementById('diceBtn').disabled = false;

    updateTurnHUD();

    // CPU Turn Trigger
    if (gameMode === 'cpu' && currentPlayer === 2) {
        document.getElementById('diceBtn').disabled = true;
        setTimeout(() => {
            rollDice();
        }, 800);
    }
}

function updateTurnHUD() {
    const cardP1 = document.getElementById('card-p1');
    const cardP2 = document.getElementById('card-p2');
    const turnDisc = document.getElementById('turn-disc');
    const togText = document.getElementById('tog');

    if (currentPlayer === 1) {
        cardP1.classList.add('active');
        cardP2.classList.remove('active');
        turnDisc.className = 'turn-disc red';
        togText.innerText = "Red's Turn";
    } else {
        cardP1.classList.remove('active');
        cardP2.classList.add('active');
        turnDisc.className = 'turn-disc yellow';
        togText.innerText = gameMode === 'cpu' ? "CPU's Turn..." : "Yellow's Turn";
    }
}

function logActivity(msg, type = '') {
    const logBox = document.getElementById('activity-log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = msg;
    logBox.prepend(entry);
}

function setGameMode(mode) {
    gameMode = mode;
    document.getElementById('mode-2p').classList.toggle('active', mode === '2p');
    document.getElementById('mode-cpu').classList.toggle('active', mode === 'cpu');

    const nameP2 = document.getElementById('name-p2');
    const avatarP2 = document.getElementById('avatar-p2');

    if (mode === 'cpu') {
        nameP2.innerText = 'CPU Bot';
        avatarP2.innerHTML = '<i class="fas fa-robot"></i>';
    } else {
        nameP2.innerText = 'Player 2 (Yellow)';
        avatarP2.innerHTML = '<i class="fas fa-chess-pawn"></i>';
    }

    restartGame();
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('btn-sound');
    btn.innerHTML = soundEnabled ? '<i class="fas fa-volume-high"></i>' : '<i class="fas fa-volume-xmark"></i>';
}

function restartGame() {
    p1Pos = 0;
    p2Pos = 0;
    currentPlayer = 1;
    isRolling = false;
    totalRolls = 0;
    laddersClimbed = 0;

    document.getElementById('win-modal').style.display = 'none';
    document.getElementById('diceBtn').disabled = false;
    document.getElementById('activity-log').innerHTML = '<div class="log-entry">🎲 Game restarted! Click ROLL DICE to start.</div>';

    updateTurnHUD();
    updateTokenPositions();
}

function showWinModal(winner) {
    document.getElementById('modal-title').innerText = `${winner.toUpperCase()} WON!`;
    document.getElementById('modal-subtitle').innerText = `Successfully conquered tile 100!`;
    document.getElementById('stat-rolls').innerText = totalRolls;
    document.getElementById('stat-ladders').innerText = laddersClimbed;
    document.getElementById('win-modal').style.display = 'flex';
}