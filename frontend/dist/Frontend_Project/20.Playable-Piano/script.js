const pianoKeys = document.querySelectorAll(".piano-keys .key");
const volumeSlider = document.querySelector(".volume-slider input");
const keysCheckbox = document.querySelector(".keys-checkbox input");

let allKeys = [];
let currentVolume = 0.5;
let isMouseDown = false;

// Web Audio API context for fallback synth
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    return audioCtx;
}

// Frequency map for piano notes (C4 to E5)
const noteFrequencies = {
    "a": 261.63, // C4
    "w": 277.18, // C#4
    "s": 293.66, // D4
    "e": 311.13, // D#4
    "d": 329.63, // E4
    "f": 349.23, // F4
    "t": 369.99, // F#4
    "g": 392.00, // G4
    "y": 415.30, // G#4
    "h": 440.00, // A4
    "u": 466.16, // A#4
    "j": 493.88, // B4
    "k": 523.25, // C5
    "o": 554.37, // C#5
    "l": 587.33, // D5
    "p": 622.25, // D#5
    ";": 659.25  // E5
};

// Synth fallback generator for clear piano sound
const playSynthNote = (key) => {
    try {
        const ctx = getAudioContext();
        const freq = noteFrequencies[key] || 440;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(currentVolume, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 1.2);
    } catch (err) {
        console.warn("Synth audio error:", err);
    }
};

const findKeyElement = (keyVal) => {
    for (let i = 0; i < pianoKeys.length; i++) {
        if (pianoKeys[i].dataset.key === keyVal) {
            return pianoKeys[i];
        }
    }
    return null;
};

const playTune = (key) => {
    const lowerKey = key.toLowerCase();
    const clickedKey = findKeyElement(lowerKey);
    
    if (clickedKey) {
        clickedKey.classList.add("active");
        setTimeout(() => {
            clickedKey.classList.remove("active");
        }, 150);
    }

    // Polyphonic Audio playback - create new Audio per keypress so notes blend smoothly
    const tune = new Audio(`tunes/${encodeURIComponent(lowerKey)}.wav`);
    tune.volume = currentVolume;
    
    const playPromise = tune.play();
    if (playPromise !== undefined) {
        playPromise.catch(() => {
            // Fallback to Web Audio API Synth if file fails to load or play
            playSynthNote(lowerKey);
        });
    }
};

document.addEventListener("mousedown", () => isMouseDown = true);
document.addEventListener("mouseup", () => isMouseDown = false);

pianoKeys.forEach(key => {
    const keyVal = key.dataset.key;
    if (keyVal) {
        allKeys.push(keyVal.toLowerCase());
    }
    
    key.addEventListener("mousedown", (e) => {
        e.preventDefault();
        playTune(keyVal);
    });

    key.addEventListener("mouseenter", () => {
        if (isMouseDown) {
            playTune(keyVal);
        }
    });

    key.addEventListener("touchstart", (e) => {
        e.preventDefault();
        playTune(keyVal);
    }, { passive: false });
});

const handleVolume = (e) => {
    currentVolume = parseFloat(e.target.value);
};

const showHideKeys = () => {
    pianoKeys.forEach(key => {
        key.classList.toggle("hide", !keysCheckbox.checked);
    });
};

const pressedKey = (e) => {
    if (e.repeat) return;
    const key = e.key.toLowerCase();
    if (allKeys.includes(key)) {
        getAudioContext(); // Resume audio context on user interaction
        playTune(key);
    }
};

if (volumeSlider) {
    currentVolume = parseFloat(volumeSlider.value);
    volumeSlider.addEventListener("input", handleVolume);
}

if (keysCheckbox) {
    showHideKeys();
    keysCheckbox.addEventListener("change", showHideKeys);
}

document.addEventListener("keydown", pressedKey);