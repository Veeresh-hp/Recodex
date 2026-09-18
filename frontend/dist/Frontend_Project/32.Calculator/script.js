/**
 * NeoCalc Studio — Calculator Logic Engine
 * Standard & Scientific Calculations, History Tape, Audio FX, Keyboard Support
 */

const STORAGE_KEY_HISTORY = "recodex_calc_history_v2";
const STORAGE_KEY_THEME = "recodex_calc_theme_v2";

class NeoCalculator {
  constructor() {
    this.primaryDisplay = document.getElementById("primary-display");
    this.expressionDisplay = document.getElementById("expression-display");
    this.degRadBadge = document.getElementById("deg-rad-indicator");
    this.container = document.querySelector(".calculator-container");
    this.scientificPanel = document.getElementById("scientific-panel");
    this.historyDrawer = document.getElementById("history-drawer");
    this.historyList = document.getElementById("history-list");
    this.toastEl = document.getElementById("calc-toast");

    this.currentInput = "0";
    this.expression = "";
    this.isScientific = false;
    this.isRad = false; // default DEG
    this.soundEnabled = true;
    this.audioCtx = null;
    this.history = this.loadHistory();

    this.initAudio();
    this.initTheme();
    this.bindEvents();
    this.renderHistory();
  }

  initTheme() {
    const saved = localStorage.getItem(STORAGE_KEY_THEME) || "dark";
    document.documentElement.setAttribute("data-theme", saved);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY_THEME, next);
    this.showToast(`Theme: ${next.toUpperCase()}`);
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch {
      this.audioCtx = null;
    }
  }

  playClick(type = "num") {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;
      let freq = 600;
      if (type === "op") freq = 800;
      if (type === "eq") freq = 1200;
      if (type === "clear") freq = 400;

      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  loadHistory() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  saveHistory() {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(this.history));
  }

  showToast(text) {
    if (!this.toastEl) return;
    this.toastEl.textContent = text;
    this.toastEl.classList.remove("hidden");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.add("hidden");
    }, 2000);
  }

  bindEvents() {
    // Mode toggle (Standard / Sci)
    document.getElementById("mode-toggle")?.addEventListener("click", () => {
      this.isScientific = !this.isScientific;
      this.container.classList.toggle("scientific-active", this.isScientific);
      this.scientificPanel.classList.toggle("collapsed", !this.isScientific);
      this.degRadBadge.classList.toggle("hidden", !this.isScientific);
      document.querySelector(".mode-label").textContent = this.isScientific ? "STD" : "SCI";
      this.playClick("op");
    });

    // Sound toggle
    const soundBtn = document.getElementById("sound-toggle");
    soundBtn?.addEventListener("click", () => {
      this.soundEnabled = !this.soundEnabled;
      soundBtn.classList.toggle("active", this.soundEnabled);
      this.showToast(this.soundEnabled ? "Sound ON" : "Sound Muted");
    });

    // Theme toggle
    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      this.toggleTheme();
    });

    // History toggle
    document.getElementById("history-toggle")?.addEventListener("click", () => {
      this.historyDrawer.classList.toggle("hidden");
      this.playClick("op");
    });

    document.getElementById("close-history-btn")?.addEventListener("click", () => {
      this.historyDrawer.classList.add("hidden");
    });

    document.getElementById("clear-history-btn")?.addEventListener("click", () => {
      this.history = [];
      this.saveHistory();
      this.renderHistory();
      this.showToast("History cleared");
    });

    // Copy result
    document.getElementById("copy-btn")?.addEventListener("click", () => {
      navigator.clipboard?.writeText(this.primaryDisplay.textContent);
      this.showToast("Result copied to clipboard!");
      this.playClick("eq");
    });

    // Keypad click delegation
    document.addEventListener("click", (e) => {
      const key = e.target.closest(".key");
      if (!key) return;

      const action = key.dataset.action;
      const val = key.dataset.val;

      if (val !== undefined) {
        if (action === "operator") {
          this.handleOperator(val);
          this.playClick("op");
        } else {
          this.handleNumber(val);
          this.playClick("num");
        }
      } else if (action) {
        this.handleAction(action);
      }
    });

    // Physical Keyboard Listener
    window.addEventListener("keydown", (e) => {
      if (e.key >= "0" && e.key <= "9") {
        this.handleNumber(e.key);
        this.playClick("num");
      } else if (e.key === ".") {
        this.handleNumber(".");
        this.playClick("num");
      } else if (e.key === "+" || e.key === "-") {
        this.handleOperator(e.key === "-" ? "−" : "+");
        this.playClick("op");
      } else if (e.key === "*") {
        this.handleOperator("×");
        this.playClick("op");
      } else if (e.key === "/") {
        e.preventDefault();
        this.handleOperator("÷");
        this.playClick("op");
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        this.handleAction("calculate");
      } else if (e.key === "Backspace") {
        this.handleAction("delete");
        this.playClick("clear");
      } else if (e.key === "Escape") {
        this.handleAction("clear");
        this.playClick("clear");
      } else if (e.key === "(" || e.key === ")") {
        this.handleAction(e.key === "(" ? "open-paren" : "close-paren");
        this.playClick("op");
      }
    });
  }

  handleNumber(digit) {
    if (this.currentInput === "0" && digit !== ".") {
      this.currentInput = digit;
    } else if (digit === "." && this.currentInput.includes(".")) {
      return; // prevent multiple dots
    } else {
      if (this.currentInput.length < 16) {
        this.currentInput += digit;
      }
    }
    this.updateDisplay();
  }

  handleOperator(op) {
    if (this.expression && !this.currentInput) {
      // replace operator
      this.expression = this.expression.slice(0, -1) + ` ${op} `;
    } else {
      this.expression += `${this.currentInput} ${op} `;
      this.currentInput = "0";
    }
    this.updateDisplay();
  }

  handleAction(action) {
    switch (action) {
      case "clear":
        this.currentInput = "0";
        this.expression = "";
        this.playClick("clear");
        break;

      case "delete":
        if (this.currentInput.length > 1) {
          this.currentInput = this.currentInput.slice(0, -1);
        } else {
          this.currentInput = "0";
        }
        this.playClick("clear");
        break;

      case "percent":
        this.currentInput = (parseFloat(this.currentInput) / 100).toString();
        this.playClick("op");
        break;

      case "sign":
        if (this.currentInput !== "0") {
          this.currentInput = this.currentInput.startsWith("-")
            ? this.currentInput.slice(1)
            : `-${this.currentInput}`;
        }
        this.playClick("op");
        break;

      case "calculate":
        this.calculateResult();
        this.playClick("eq");
        break;

      case "deg-rad":
        this.isRad = !this.isRad;
        const btn = document.querySelector('[data-action="deg-rad"]');
        if (btn) btn.textContent = this.isRad ? "DEG" : "RAD";
        this.degRadBadge.textContent = this.isRad ? "RAD" : "DEG";
        this.playClick("op");
        break;

      case "sin":
      case "cos":
      case "tan":
        this.applyTrig(action);
        this.playClick("op");
        break;

      case "sqrt":
        const val = parseFloat(this.currentInput);
        if (val < 0) {
          this.currentInput = "Error";
        } else {
          this.currentInput = Math.sqrt(val).toString();
        }
        this.playClick("op");
        break;

      case "sqr":
        const num = parseFloat(this.currentInput);
        this.currentInput = (num * num).toString();
        this.playClick("op");
        break;

      case "pow":
        this.handleOperator("^");
        this.playClick("op");
        break;

      case "log":
        this.currentInput = Math.log10(parseFloat(this.currentInput)).toString();
        this.playClick("op");
        break;

      case "ln":
        this.currentInput = Math.log(parseFloat(this.currentInput)).toString();
        this.playClick("op");
        break;

      case "pi":
        this.currentInput = Math.PI.toString();
        this.playClick("op");
        break;

      case "e":
        this.currentInput = Math.E.toString();
        this.playClick("op");
        break;

      case "factorial":
        this.applyFactorial();
        this.playClick("op");
        break;

      case "inv":
        const v = parseFloat(this.currentInput);
        this.currentInput = v === 0 ? "Error" : (1 / v).toString();
        this.playClick("op");
        break;

      case "open-paren":
        this.expression += "(";
        this.playClick("op");
        break;

      case "close-paren":
        this.expression += `${this.currentInput})`;
        this.currentInput = "0";
        this.playClick("op");
        break;
    }
    this.updateDisplay();
  }

  applyTrig(fn) {
    let angle = parseFloat(this.currentInput);
    if (!this.isRad) {
      angle = (angle * Math.PI) / 180; // convert DEG to RAD
    }
    let res = 0;
    if (fn === "sin") res = Math.sin(angle);
    if (fn === "cos") res = Math.cos(angle);
    if (fn === "tan") res = Math.tan(angle);
    // Clean tiny float rounding (e.g. cos(90) ~= 0)
    res = parseFloat(res.toFixed(10));
    this.currentInput = res.toString();
  }

  applyFactorial() {
    let n = parseInt(this.currentInput, 10);
    if (n < 0 || isNaN(n)) {
      this.currentInput = "Error";
      return;
    }
    if (n > 100) {
      this.currentInput = "Infinity";
      return;
    }
    let f = 1;
    for (let i = 2; i <= n; i++) f *= i;
    this.currentInput = f.toString();
  }

  calculateResult() {
    const fullExpr = `${this.expression} ${this.currentInput}`.trim();
    if (!fullExpr) return;

    try {
      // Clean string for safe evaluation
      let sanitized = fullExpr
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-")
        .replace(/\^/g, "**");

      // Validate formula contains only safe arithmetic math tokens
      if (!/^[\d\.\s\+\-\*\/\(\)]+$/.test(sanitized)) {
        throw new Error("Invalid format");
      }

      // Safe calculation using Function constructor with no global scope
      const evalFn = new Function(`return (${sanitized});`);
      const rawResult = evalFn();

      if (!isFinite(rawResult) || isNaN(rawResult)) {
        this.currentInput = "Error";
      } else {
        // Format decimal precision
        let finalStr = parseFloat(rawResult.toFixed(10)).toString();
        this.history.unshift({
          expr: fullExpr,
          result: finalStr,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        if (this.history.length > 30) this.history.pop();
        this.saveHistory();
        this.renderHistory();

        this.expression = "";
        this.currentInput = finalStr;
      }
    } catch (err) {
      this.currentInput = "Error";
    }
    this.updateDisplay();
  }

  updateDisplay() {
    this.primaryDisplay.textContent = this.currentInput;
    this.expressionDisplay.textContent = this.expression;
  }

  renderHistory() {
    if (!this.historyList) return;
    if (this.history.length === 0) {
      this.historyList.innerHTML = `<div class="history-empty">No calculations recorded</div>`;
      return;
    }

    this.historyList.innerHTML = this.history
      .map(
        (item) => `
        <div class="history-item" data-val="${item.result}">
          <span class="history-expr">${item.expr} =</span>
          <span class="history-res">${item.result}</span>
        </div>
      `
      )
      .join("");

    this.historyList.querySelectorAll(".history-item").forEach((el) => {
      el.addEventListener("click", () => {
        this.currentInput = el.dataset.val;
        this.updateDisplay();
        this.showToast("Recalled to display");
        this.playClick("num");
      });
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new NeoCalculator();
});
