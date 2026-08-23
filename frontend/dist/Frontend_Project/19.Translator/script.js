// --- Universal Language Translator Engine ---

const fromText = document.getElementById("from-text");
const toText = document.getElementById("to-text");
const fromSelect = document.getElementById("from-select");
const toSelect = document.getElementById("to-select");
const translateBtn = document.getElementById("btn-translate");
const btnMic = document.getElementById("btn-mic");

let recognition = null;
let isRecording = false;
let debounceTimer = null;

// Populate Language Options from countries.js
function initLanguages() {
    [fromSelect, toSelect].forEach((selectEl, idx) => {
        selectEl.innerHTML = "";
        for (let code in countries) {
            let selected = (idx === 0 && code === "en-GB") ? "selected" : (idx === 1 && code === "hi-IN") ? "selected" : "";
            let option = `<option ${selected} value="${code}">${countries[code]}</option>`;
            selectEl.insertAdjacentHTML("beforeend", option);
        }
    });
}

// Live Debounced Auto-Translation (350ms delay)
fromText.addEventListener("input", () => {
    if (!fromText.value.trim()) {
        toText.value = "";
        return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        performTranslation();
    }, 350);
});

// Primary Translation Logic (MyMemory Neural API)
async function performTranslation() {
    const text = fromText.value.trim();
    const translateFrom = fromSelect.value;
    const translateTo = toSelect.value;

    if (!text) return;

    toText.setAttribute("placeholder", "Translating...");
    if (translateBtn) translateBtn.innerText = "Translating...";

    try {
        const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${translateFrom}|${translateTo}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data && data.responseData && data.responseData.translatedText) {
            toText.value = data.responseData.translatedText;
        } else {
            toText.value = text;
        }
    } catch (e) {
        showToast("Network error. Please check connection.", true);
    } finally {
        toText.setAttribute("placeholder", "Translation");
        if (translateBtn) translateBtn.innerText = "Translate Text";
    }
}

// Swap Languages & Text
function swapLanguages() {
    const tempText = fromText.value;
    const tempLang = fromSelect.value;

    fromText.value = toText.value;
    toText.value = tempText;

    fromSelect.value = toSelect.value;
    toSelect.value = tempLang;

    if (fromText.value.trim()) {
        performTranslation();
    }
}

// Speech-to-Text Dictation (Web Speech API)
function toggleVoiceDictation() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        showToast("Speech recognition is not supported in this browser.", true);
        return;
    }

    if (isRecording) {
        recognition.stop();
        isRecording = false;
        if (btnMic) btnMic.classList.remove("recording");
        showToast("Voice dictation stopped.");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = fromSelect.value;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
        isRecording = true;
        if (btnMic) btnMic.classList.add("recording");
        showToast("Listening... Speak now 🎙️");
    };

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');

        fromText.value = transcript;
        performTranslation();
    };

    recognition.onerror = () => {
        isRecording = false;
        if (btnMic) btnMic.classList.remove("recording");
        showToast("Voice recognition error.", true);
    };

    recognition.onend = () => {
        isRecording = false;
        if (btnMic) btnMic.classList.remove("recording");
    };

    recognition.start();
}

// Text-to-Speech Audio Player
function speakText(type) {
    const text = type === 'from' ? fromText.value.trim() : toText.value.trim();
    const lang = type === 'from' ? fromSelect.value : toSelect.value;

    if (!text) return;

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
        showToast("Playing audio... 🔊");
    } else {
        showToast("Audio playback not supported.", true);
    }
}

// Copy Text
function copyText(type) {
    const text = type === 'from' ? fromText.value.trim() : toText.value.trim();
    if (!text) return;

    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard! 📋");
}

// Toast Alert
let toastTimer = null;
function showToast(msg, isError = false) {
    const toast = document.getElementById("toast");
    const toastText = document.getElementById("toast-text");
    const toastIcon = document.getElementById("toast-icon");

    if (toastText) toastText.innerText = msg;
    if (toastIcon) {
        toastIcon.className = isError ? "fas fa-circle-exclamation" : "fas fa-circle-check";
        toastIcon.style.color = isError ? "#ef4444" : "#10b981";
    }

    toast.style.display = "flex";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.style.display = "none";
    }, 2200);
}

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    initLanguages();
});
