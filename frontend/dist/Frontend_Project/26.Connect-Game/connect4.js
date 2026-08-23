// --- Connect 4 Pro Core Game Engine ---

const ROWS = 6;
const COLS = 7;

let board = [];
let currentPlayer = 1; // 1 = Red, 2 = Yellow
let gameActive = false;
let isAiThinking = false;
let gameMode = '2p'; // '2p' or 'ai'
let aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
let moveHistory = [];
let totalMoves = 0;
let soundEnabled = true;

let scores = {
    red: parseInt(localStorage.getItem('c4_score_red') || '0'),
    yellow: parseInt(localStorage.getItem('c4_score_yellow') || '0')
};

// Web Audio API Sound Effects
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

function playDropSFX() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
}

function playWinSFX() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.12);
            gain.gain.setValueAtTime(0.3, ctx.currentTime + index * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.12 + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + index * 0.12);
            osc.stop(ctx.currentTime + index * 0.12 + 0.3);
        });
    } catch (e) {}
}

function playClickSFX() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
}

// --- Initialize Game ---
document.addEventListener('DOMContentLoaded', () => {
    updateScoreboardDOM();
    setupEventListeners();
    initGame();
});

function initGame() {
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    currentPlayer = 1;
    gameActive = true;
    isAiThinking = false;
    moveHistory = [];
    totalMoves = 0;

    // Clear board DOM
    document.querySelectorAll('.cell').forEach(cell => {
        cell.innerHTML = '';
    });

    // Reset modals and overlays
    document.getElementById('win-modal').style.display = 'none';

    updateHUD();
    updatePreviewDiscs();
}

function setupEventListeners() {
    // Column clicks & hover preview
    for (let c = 0; c < COLS; c++) {
        const colEl = document.getElementById(`c${c + 1}`);
        if (colEl) {
            colEl.addEventListener('click', () => makePlayerMove(c));
            colEl.addEventListener('mouseenter', () => showPreview(c));
            colEl.addEventListener('mouseleave', () => clearPreview());
        }
    }
}

function showPreview(col) {
    if (!gameActive || isAiThinking) return;
    if (gameMode === 'ai' && currentPlayer === 2) return;

    clearPreview();
    const previewCols = document.querySelectorAll('.preview-col');
    if (previewCols[col]) {
        const disc = document.createElement('div');
        disc.className = `preview-disc ${currentPlayer === 1 ? 'red' : 'yellow'}`;
        previewCols[col].appendChild(disc);
    }
}

function clearPreview() {
    document.querySelectorAll('.preview-col').forEach(col => col.innerHTML = '');
}

function updatePreviewDiscs() {
    clearPreview();
}

// --- Gameplay Mechanics ---
function makePlayerMove(col) {
    if (!gameActive || isAiThinking) return;
    if (gameMode === 'ai' && currentPlayer === 2) return;

    getAudioContext();
    dropDiscInColumn(col);
}

function dropDiscInColumn(col) {
    // Find lowest available row in column
    let row = -1;
    for (let r = 0; r < ROWS; r++) {
        if (board[r][col] === 0) {
            row = r;
            break;
        }
    }

    if (row === -1) return false; // Column is full

    // Place disc in state
    board[row][col] = currentPlayer;
    totalMoves++;
    moveHistory.push({ row, col, player: currentPlayer });

    // Render disc in DOM
    const cellId = `c${col + 1}r${row + 1}`;
    const cellEl = document.getElementById(cellId);
    if (cellEl) {
        const disc = document.createElement('div');
        disc.className = `disc ${currentPlayer === 1 ? 'red' : 'yellow'}`;
        cellEl.appendChild(disc);
    }

    playDropSFX();

    // Check for Win
    const winningCells = checkWin(board, currentPlayer);
    if (winningCells) {
        gameActive = false;
        highlightWinningDiscs(winningCells);
        scores[currentPlayer === 1 ? 'red' : 'yellow']++;
        saveScores();
        updateScoreboardDOM();
        playWinSFX();
        setTimeout(() => showWinModal(currentPlayer === 1 ? 'Red' : 'Yellow'), 600);
        return true;
    }

    // Check for Draw
    if (totalMoves === ROWS * COLS) {
        gameActive = false;
        setTimeout(() => showWinModal('draw'), 500);
        return true;
    }

    // Switch Turn
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateHUD();
    updatePreviewDiscs();

    // If AI mode and Yellow turn
    if (gameMode === 'ai' && currentPlayer === 2 && gameActive) {
        isAiThinking = true;
        setTimeout(triggerAiMove, 500);
    }

    return true;
}

function updateHUD() {
    const cardRed = document.getElementById('card-red');
    const cardYellow = document.getElementById('card-yellow');
    const turnDisc = document.getElementById('turn-disc');
    const whosturn = document.getElementById('whosturn');

    if (currentPlayer === 1) {
        cardRed.classList.add('active');
        cardYellow.classList.remove('active');
        turnDisc.className = 'turn-disc red';
        whosturn.innerText = "Red's Turn";
    } else {
        cardRed.classList.remove('active');
        cardYellow.classList.add('active');
        turnDisc.className = 'turn-disc yellow';
        whosturn.innerText = gameMode === 'ai' ? "AI's Turn..." : "Yellow's Turn";
    }
}

function highlightWinningDiscs(coords) {
    coords.forEach(([r, c]) => {
        const cellEl = document.getElementById(`c${c + 1}r${r + 1}`);
        if (cellEl && cellEl.firstChild) {
            cellEl.firstChild.classList.add('winning');
        }
    });
}

// --- Win Detection Logic ---
function checkWin(b, player) {
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            if (b[r][c] === player && b[r][c + 1] === player && b[r][c + 2] === player && b[r][c + 3] === player) {
                return [[r, c], [r, c + 1], [r, c + 2], [r, c + 3]];
            }
        }
    }

    // Vertical
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS; c++) {
            if (b[r][c] === player && b[r + 1][c] === player && b[r + 2][c] === player && b[r + 3][c] === player) {
                return [[r, c], [r + 1, c], [r + 2, c], [r + 3, c]];
            }
        }
    }

    // Diagonal (Up-Right)
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            if (b[r][c] === player && b[r + 1][c + 1] === player && b[r + 2][c + 2] === player && b[r + 3][c + 3] === player) {
                return [[r, c], [r + 1, c + 1], [r + 2, c + 2], [r + 3, c + 3]];
            }
        }
    }

    // Diagonal (Down-Right)
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            if (b[r][c] === player && b[r - 1][c + 1] === player && b[r - 2][c + 2] === player && b[r - 3][c + 3] === player) {
                return [[r, c], [r - 1, c + 1], [r - 2, c + 2], [r - 3, c + 3]];
            }
        }
    }

    return null;
}

// --- AI Bot Mechanics ---
function triggerAiMove() {
    if (!gameActive || currentPlayer !== 2) return;

    let targetCol = getBestAiMove();
    isAiThinking = false;
    dropDiscInColumn(targetCol);
}

function getBestAiMove() {
    const validCols = getValidColumns(board);
    if (validCols.length === 0) return 3;

    // 1. Easy: Random
    if (aiDifficulty === 'easy') {
        return validCols[Math.floor(Math.random() * validCols.length)];
    }

    // 2. Can AI win immediately?
    for (let c of validCols) {
        let tempBoard = copyBoard(board);
        let r = getLowestEmptyRow(tempBoard, c);
        tempBoard[r][c] = 2;
        if (checkWin(tempBoard, 2)) return c;
    }

    // 3. Must AI block opponent's immediate win?
    for (let c of validCols) {
        let tempBoard = copyBoard(board);
        let r = getLowestEmptyRow(tempBoard, c);
        tempBoard[r][c] = 1;
        if (checkWin(tempBoard, 1)) return c;
    }

    if (aiDifficulty === 'medium') {
        // Prefer center columns
        const centerOrder = [3, 2, 4, 1, 5, 0, 6];
        for (let c of centerOrder) {
            if (validCols.includes(c)) return c;
        }
        return validCols[Math.floor(Math.random() * validCols.length)];
    }

    // 4. Hard Mode: Minimax Search (Depth 4)
    let bestScore = -Infinity;
    let bestCol = validCols[0];

    for (let c of validCols) {
        let tempBoard = copyBoard(board);
        let r = getLowestEmptyRow(tempBoard, c);
        tempBoard[r][c] = 2;
        let score = minimax(tempBoard, 4, -Infinity, Infinity, false);
        if (score > bestScore) {
            bestScore = score;
            bestCol = c;
        }
    }

    return bestCol;
}

function minimax(b, depth, alpha, beta, isMaximizing) {
    const validCols = getValidColumns(b);
    const aiWin = checkWin(b, 2);
    const playerWin = checkWin(b, 1);

    if (aiWin) return 10000 + depth;
    if (playerWin) return -10000 - depth;
    if (validCols.length === 0 || depth === 0) return evaluateBoard(b);

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let c of validCols) {
            let tempBoard = copyBoard(b);
            let r = getLowestEmptyRow(tempBoard, c);
            tempBoard[r][c] = 2;
            let evalVal = minimax(tempBoard, depth - 1, alpha, beta, false);
            maxEval = Math.max(maxEval, evalVal);
            alpha = Math.max(alpha, evalVal);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let c of validCols) {
            let tempBoard = copyBoard(b);
            let r = getLowestEmptyRow(tempBoard, c);
            tempBoard[r][c] = 1;
            let evalVal = minimax(tempBoard, depth - 1, alpha, beta, true);
            minEval = Math.min(minEval, evalVal);
            beta = Math.min(beta, evalVal);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function evaluateBoard(b) {
    let score = 0;

    // Score center column preference
    const centerCol = 3;
    let centerCount = 0;
    for (let r = 0; r < ROWS; r++) {
        if (b[r][centerCol] === 2) centerCount++;
    }
    score += centerCount * 6;

    // Evaluate 4-cell windows
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            let window = [b[r][c], b[r][c + 1], b[r][c + 2], b[r][c + 3]];
            score += evaluateWindow(window);
        }
    }

    // Vertical
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS; c++) {
            let window = [b[r][c], b[r + 1][c], b[r + 2][c], b[r + 3][c]];
            score += evaluateWindow(window);
        }
    }

    // Diagonals
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            let window1 = [b[r][c], b[r + 1][c + 1], b[r + 2][c + 2], b[r + 3][c + 3]];
            score += evaluateWindow(window1);
        }
    }
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            let window2 = [b[r][c], b[r - 1][c + 1], b[r - 2][c + 2], b[r - 3][c + 3]];
            score += evaluateWindow(window2);
        }
    }

    return score;
}

function evaluateWindow(w) {
    let score = 0;
    let count2 = w.filter(cell => cell === 2).length;
    let count1 = w.filter(cell => cell === 1).length;
    let countEmpty = w.filter(cell => cell === 0).length;

    if (count2 === 4) score += 100;
    else if (count2 === 3 && countEmpty === 1) score += 12;
    else if (count2 === 2 && countEmpty === 2) score += 4;

    if (count1 === 3 && countEmpty === 1) score -= 15;

    return score;
}

function getValidColumns(b) {
    let valid = [];
    for (let c = 0; c < COLS; c++) {
        if (b[ROWS - 1][c] === 0) valid.push(c);
    }
    return valid;
}

function getLowestEmptyRow(b, col) {
    for (let r = 0; r < ROWS; r++) {
        if (b[r][col] === 0) return r;
    }
    return -1;
}

function copyBoard(b) {
    return b.map(row => [...row]);
}

// --- Game Controls & Toolbar ---
function undoMove() {
    if (moveHistory.length === 0 || !gameActive || isAiThinking) return;

    playClickSFX();
    
    // In 2P mode undo 1 move; in AI mode undo 2 moves (AI + Player)
    const undoCount = (gameMode === 'ai' && moveHistory.length >= 2) ? 2 : 1;

    for (let i = 0; i < undoCount; i++) {
        if (moveHistory.length === 0) break;
        const lastMove = moveHistory.pop();
        board[lastMove.row][lastMove.col] = 0;
        totalMoves--;

        const cellEl = document.getElementById(`c${lastMove.col + 1}r${lastMove.row + 1}`);
        if (cellEl) cellEl.innerHTML = '';
        currentPlayer = lastMove.player;
    }

    updateHUD();
    updatePreviewDiscs();
}

function restartGame() {
    playClickSFX();
    initGame();
}

function setGameMode(mode) {
    playClickSFX();
    gameMode = mode;

    document.getElementById('mode-2p').classList.toggle('active', mode === '2p');
    document.getElementById('mode-ai').classList.toggle('active', mode === 'ai');

    const diffBox = document.getElementById('difficulty-box');
    const nameYellow = document.getElementById('name-yellow');
    const avatarYellow = document.getElementById('avatar-yellow');

    if (mode === 'ai') {
        diffBox.style.display = 'block';
        nameYellow.innerText = 'AI Bot';
        avatarYellow.innerHTML = '<i class="fas fa-robot"></i>';
    } else {
        diffBox.style.display = 'none';
        nameYellow.innerText = 'Player 2';
        avatarYellow.innerHTML = '<i class="fas fa-user"></i>';
    }

    initGame();
}

function setDifficulty(diff) {
    playClickSFX();
    aiDifficulty = diff;
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('btn-sound');
    btn.innerHTML = soundEnabled ? '<i class="fas fa-volume-high"></i>' : '<i class="fas fa-volume-xmark"></i>';
}

function saveScores() {
    localStorage.setItem('c4_score_red', scores.red.toString());
    localStorage.setItem('c4_score_yellow', scores.yellow.toString());
}

function updateScoreboardDOM() {
    document.getElementById('score-red').innerText = scores.red;
    document.getElementById('score-yellow').innerText = scores.yellow;
}

function resetScores() {
    playClickSFX();
    scores.red = 0;
    scores.yellow = 0;
    saveScores();
    updateScoreboardDOM();
}

// --- Victory Modal ---
function showWinModal(winner) {
    const modal = document.getElementById('win-modal');
    const modalDisc = document.getElementById('modal-disc');
    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');
    const statMoves = document.getElementById('stat-moves');
    const statWinner = document.getElementById('stat-winner');

    statMoves.innerText = totalMoves;

    if (winner === 'draw') {
        modalDisc.className = 'winner-icon draw';
        modalDisc.innerHTML = '<i class="fas fa-handshake" style="font-size: 2rem; color: #fff;"></i>';
        modalTitle.innerText = "IT'S A DRAW!";
        modalSubtitle.innerText = 'The board is completely full.';
        statWinner.innerText = 'Draw';
    } else {
        const isRed = winner === 'Red';
        modalDisc.className = `winner-icon ${isRed ? 'red' : 'yellow'}`;
        modalDisc.innerHTML = '';
        modalTitle.innerText = `${winner.toUpperCase()} WINS!`;
        modalSubtitle.innerText = 'Connected 4 discs in a row!';
        statWinner.innerText = isRed ? 'Player 1 (Red)' : (gameMode === 'ai' ? 'AI Bot' : 'Player 2 (Yellow)');
    }

    modal.style.display = 'flex';
}

function closeModalAndRestart() {
    playClickSFX();
    document.getElementById('win-modal').style.display = 'none';
    initGame();
}
