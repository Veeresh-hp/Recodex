// --- Password Generator Pro Cryptographic Engine ---

const CHAR_SETS = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    special: "!@#$%^&*()_+-=[]{}|;:,.<>?"
};

const AMBIGUOUS_CHARS = /[1lI0Oo]/g;

let currentPasswords = ["", "", "", ""];
let soundEnabled = true;

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

function playGenerateSFX() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
}

function playCopySFX() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const notes = [523.25, 659.25]; // C5, E5
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
            gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.06 + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.06);
            osc.stop(ctx.currentTime + idx * 0.06 + 0.12);
        });
    } catch (e) {}
}

// Cryptographically secure character selector
function getRandomChar(chars) {
    if (window.crypto && window.crypto.getRandomValues) {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return chars[array[0] % chars.length];
    }
    return chars[Math.floor(Math.random() * chars.length)];
}

function generateSinglePassword(length, useSpecial, useUpper, useNum, excludeAmbiguous) {
    let lowerPool = CHAR_SETS.lowercase;
    let upperPool = CHAR_SETS.uppercase;
    let numPool = CHAR_SETS.numbers;
    let specialPool = CHAR_SETS.special;

    if (excludeAmbiguous) {
        lowerPool = lowerPool.replace(AMBIGUOUS_CHARS, '');
        upperPool = upperPool.replace(AMBIGUOUS_CHARS, '');
        numPool = numPool.replace(AMBIGUOUS_CHARS, '');
        specialPool = specialPool.replace(AMBIGUOUS_CHARS, '');
    }

    let pool = lowerPool;
    let guaranteed = [getRandomChar(lowerPool)];

    if (useUpper && upperPool.length > 0) {
        pool += upperPool;
        guaranteed.push(getRandomChar(upperPool));
    }
    if (useNum && numPool.length > 0) {
        pool += numPool;
        guaranteed.push(getRandomChar(numPool));
    }
    if (useSpecial && specialPool.length > 0) {
        pool += specialPool;
        guaranteed.push(getRandomChar(specialPool));
    }

    let passwordChars = [...guaranteed];
    for (let i = passwordChars.length; i < length; i++) {
        passwordChars.push(getRandomChar(pool));
    }

    // Fisher-Yates Shuffle
    for (let i = passwordChars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
    }

    return passwordChars.join("");
}

function validateAndGenerate() {
    const lenInput = document.getElementById('passwordLength');
    const limitInfo = document.getElementById('limit-info');
    let val = parseInt(lenInput.value);

    if (isNaN(val)) val = 15;

    if (val > 32) {
        lenInput.value = 32;
        lenInput.classList.add('limit-warn');
        limitInfo.className = 'limit-info warn';
        limitInfo.innerText = 'Max: 32 chars';
    } else if (val < 4) {
        lenInput.classList.add('limit-warn');
        limitInfo.className = 'limit-info warn';
        limitInfo.innerText = 'Min: 4 chars';
    } else {
        lenInput.classList.remove('limit-warn');
        limitInfo.className = 'limit-info';
        limitInfo.innerText = 'Max: 32';
    }

    generateAllPasswords();
}

function setPresetLength(len) {
    const lenInput = document.getElementById('passwordLength');
    lenInput.value = len;

    // Highlight chip
    document.querySelectorAll('.chip').forEach(chip => {
        chip.classList.toggle('active', parseInt(chip.innerText) === len);
    });

    validateAndGenerate();
}

function generateAllPasswords() {
    getAudioContext();
    playGenerateSFX();

    const lenInput = document.getElementById('passwordLength');
    let length = parseInt(lenInput.value);

    // Strict bounds enforcement: 4 to 32
    if (isNaN(length)) length = 15;
    if (length < 4) length = 4;
    if (length > 32) length = 32;

    const useSpecial = document.getElementById('special-char').checked;
    const useUpper = document.getElementById('uppercase').checked;
    const useNum = document.getElementById('numbers').checked;
    const excludeAmbiguous = document.getElementById('exclude-ambiguous').checked;

    for (let i = 0; i < 4; i++) {
        currentPasswords[i] = generateSinglePassword(length, useSpecial, useUpper, useNum, excludeAmbiguous);
        document.getElementById(`pass-${i}`).innerText = currentPasswords[i];
    }

    updateStrengthMeter(currentPasswords[0], useSpecial, useUpper, useNum);
}

function updateStrengthMeter(password, useSpecial, useUpper, useNum) {
    let poolSize = 26;
    if (useUpper) poolSize += 26;
    if (useNum) poolSize += 10;
    if (useSpecial) poolSize += 32;

    const entropy = Math.round(password.length * Math.log2(poolSize));
    
    const bar = document.getElementById('strength-bar');
    const valText = document.getElementById('strength-val');
    const entropyVal = document.getElementById('entropy-val');

    entropyVal.innerText = `${entropy} bits entropy`;

    if (entropy < 40) {
        valText.innerText = "WEAK";
        valText.style.color = "#ef4444";
        bar.style.width = "25%";
        bar.style.background = "#ef4444";
    } else if (entropy < 65) {
        valText.innerText = "FAIR";
        valText.style.color = "#f59e0b";
        bar.style.width = "50%";
        bar.style.background = "#f59e0b";
    } else if (entropy < 90) {
        valText.innerText = "STRONG";
        valText.style.color = "#55f991";
        bar.style.width = "75%";
        bar.style.background = "#55f991";
    } else {
        valText.innerText = "UNBREAKABLE 💎";
        valText.style.color = "#38bdf8";
        bar.style.width = "100%";
        bar.style.background = "linear-gradient(90deg, #55f991, #38bdf8)";
    }
}

function copyCardPassword(index) {
    const pass = currentPasswords[index];
    if (!pass) return;

    navigator.clipboard.writeText(pass);
    playCopySFX();
    showToast("Password copied to clipboard!");
}

function copyAllPasswords() {
    if (currentPasswords.length === 0) return;

    const allText = currentPasswords.join("\n");
    navigator.clipboard.writeText(allText);
    playCopySFX();
    showToast("All 4 passwords copied!");
}

let toastTimer = null;
function showToast(messageText = "Password copied to clipboard!") {
    const toast = document.getElementById('toast-message');
    const textSpan = document.getElementById('toast-text');

    if (textSpan) textSpan.innerText = messageText;
    toast.style.display = 'flex';

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.style.display = 'none';
    }, 2200);
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    generateAllPasswords();
});
