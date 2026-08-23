var board = document.getElementById("board");
var cells = board.getElementsByTagName("td");
var statusDisplay = document.getElementById("status");
var resetButton = document.getElementById("reset-button");

var player = "X";
var isGameOver = false;
var isAiThinking = false;
var currentMode = "pvp"; // "pvp", "easy", "medium", "hard"

var themes = [
  { id: "default", name: "Default Neon" },
  { id: "cyberpunk", name: "Cyberpunk" },
  { id: "sunset", name: "Sunset Glow" },
  { id: "emerald", name: "Emerald Forest" }
];
var currentThemeIndex = 0;

var winConditions = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function checkWin() {
  for (var i = 0; i < winConditions.length; i++) {
    var c = winConditions[i];
    var a = cells[c[0]].innerHTML;
    var b = cells[c[1]].innerHTML;
    var cVal = cells[c[2]].innerHTML;

    if (a !== "" && a === b && b === cVal) {
      return c;
    }
  }
  return null;
}

function checkDraw() {
  for (var i = 0; i < cells.length; i++) {
    if (cells[i].innerHTML === "") return false;
  }
  return true;
}

function getBoardState() {
  var state = [];
  for (var i = 0; i < cells.length; i++) {
    state.push(cells[i].innerHTML);
  }
  return state;
}

function evaluateBoardState(state) {
  for (var i = 0; i < winConditions.length; i++) {
    var c = winConditions[i];
    if (state[c[0]] && state[c[0]] === state[c[1]] && state[c[0]] === state[c[2]]) {
      return state[c[0]] === "O" ? 10 : -10;
    }
  }
  return 0;
}

function minimax(state, depth, isMax) {
  var score = evaluateBoardState(state);
  if (score === 10) return score - depth;
  if (score === -10) return score + depth;
  if (!state.includes("")) return 0;

  if (isMax) {
    var best = -1000;
    for (var i = 0; i < 9; i++) {
      if (state[i] === "") {
        state[i] = "O";
        best = Math.max(best, minimax(state, depth + 1, false));
        state[i] = "";
      }
    }
    return best;
  } else {
    var best = 1000;
    for (var i = 0; i < 9; i++) {
      if (state[i] === "") {
        state[i] = "X";
        best = Math.min(best, minimax(state, depth + 1, true));
        state[i] = "";
      }
    }
    return best;
  }
}

function getRandomMove(state) {
  var empty = [];
  for (var i = 0; i < 9; i++) {
    if (state[i] === "") empty.push(i);
  }
  if (empty.length === 0) return -1;
  return empty[Math.floor(Math.random() * empty.length)];
}

function getMediumMove(state) {
  for (var i = 0; i < 9; i++) {
    if (state[i] === "") {
      state[i] = "O";
      if (evaluateBoardState(state) === 10) { state[i] = ""; return i; }
      state[i] = "";
    }
  }
  for (var i = 0; i < 9; i++) {
    if (state[i] === "") {
      state[i] = "X";
      if (evaluateBoardState(state) === -10) { state[i] = ""; return i; }
      state[i] = "";
    }
  }
  return getRandomMove(state);
}

function getHardMove(state) {
  var bestVal = -1000;
  var bestMove = -1;
  for (var i = 0; i < 9; i++) {
    if (state[i] === "") {
      state[i] = "O";
      var moveVal = minimax(state, 0, false);
      state[i] = "";
      if (moveVal > bestVal) {
        bestMove = i;
        bestVal = moveVal;
      }
    }
  }
  return bestMove;
}

function triggerAiMove() {
  if (isGameOver) return;

  var state = getBoardState();
  var moveIndex = -1;

  if (currentMode === "easy") {
    moveIndex = getRandomMove(state);
  } else if (currentMode === "medium") {
    moveIndex = getMediumMove(state);
  } else if (currentMode === "hard") {
    moveIndex = getHardMove(state);
  }

  if (moveIndex !== -1 && cells[moveIndex]) {
    cells[moveIndex].innerHTML = "O";

    var winningCombo = checkWin();
    if (winningCombo) {
      isGameOver = true;
      isAiThinking = false;
      if (statusDisplay) {
        statusDisplay.innerHTML = "🤖 AI (O) Wins!";
        statusDisplay.className = "status winner";
      }
      for (var j = 0; j < winningCombo.length; j++) {
        cells[winningCombo[j]].classList.add("winning-cell");
      }
      return;
    }

    if (checkDraw()) {
      isGameOver = true;
      isAiThinking = false;
      if (statusDisplay) {
        statusDisplay.innerHTML = "🤝 It's a Draw!";
        statusDisplay.className = "status draw";
      }
      return;
    }
  }

  player = "X";
  isAiThinking = false;
  updateStatus();
}

function updateStatus() {
  if (!statusDisplay) return;
  if (currentMode === "pvp") {
    statusDisplay.innerHTML = "Player " + player + "'s Turn";
  } else {
    if (isAiThinking) {
      statusDisplay.innerHTML = "🤖 AI Thinking...";
    } else {
      statusDisplay.innerHTML = "Your Turn (X)";
    }
  }
  statusDisplay.className = "status";
}

function resetGame() {
  for (var i = 0; i < cells.length; i++) {
    cells[i].innerHTML = "";
    cells[i].classList.remove("winning-cell");
  }
  player = "X";
  isGameOver = false;
  isAiThinking = false;
  updateStatus();
}

for (var i = 0; i < cells.length; i++) {
  cells[i].addEventListener("click", function() {
    if (isGameOver || isAiThinking || this.innerHTML !== "") {
      return;
    }

    this.innerHTML = player;

    var winningCombo = checkWin();
    if (winningCombo) {
      isGameOver = true;
      if (statusDisplay) {
        var winnerText = (currentMode !== "pvp" && player === "X") ? "🎉 You Win!" : "🎉 Player " + player + " Wins!";
        statusDisplay.innerHTML = winnerText;
        statusDisplay.className = "status winner";
      }
      for (var j = 0; j < winningCombo.length; j++) {
        cells[winningCombo[j]].classList.add("winning-cell");
      }
      return;
    }

    if (checkDraw()) {
      isGameOver = true;
      if (statusDisplay) {
        statusDisplay.innerHTML = "🤝 It's a Draw!";
        statusDisplay.className = "status draw";
      }
      return;
    }

    if (currentMode === "pvp") {
      player = player === "X" ? "O" : "X";
      updateStatus();
    } else {
      player = "O";
      isAiThinking = true;
      updateStatus();
      setTimeout(triggerAiMove, 350);
    }
  });
}

if (resetButton) {
  resetButton.addEventListener("click", resetGame);
}

// Mode Selection Handlers
function setMode(mode, elementId) {
  currentMode = mode;
  var items = document.querySelectorAll(".dropdown-item");
  items.forEach(function(item) {
    if (item.id !== "opt-theme") {
      item.classList.remove("active");
    }
  });
  var activeItem = document.getElementById(elementId);
  if (activeItem) activeItem.classList.add("active");
  resetGame();
}

var optPvp = document.getElementById("opt-pvp");
var optEasy = document.getElementById("opt-easy");
var optMedium = document.getElementById("opt-medium");
var optHard = document.getElementById("opt-hard");
var optTheme = document.getElementById("opt-theme");

if (optPvp) optPvp.addEventListener("click", function(e) { e.preventDefault(); setMode("pvp", "opt-pvp"); });
if (optEasy) optEasy.addEventListener("click", function(e) { e.preventDefault(); setMode("easy", "opt-easy"); });
if (optMedium) optMedium.addEventListener("click", function(e) { e.preventDefault(); setMode("medium", "opt-medium"); });
if (optHard) optHard.addEventListener("click", function(e) { e.preventDefault(); setMode("hard", "opt-hard"); });

if (optTheme) {
  optTheme.addEventListener("click", function(e) {
    e.preventDefault();
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    var theme = themes[currentThemeIndex];
    if (theme.id === "default") {
      document.body.removeAttribute("data-theme");
    } else {
      document.body.setAttribute("data-theme", theme.id);
    }
    optTheme.innerHTML = "🎨 Theme: " + theme.name;
  });
}




