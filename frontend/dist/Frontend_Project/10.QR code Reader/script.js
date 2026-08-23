// --- QR Code Studio Pro Engine ---

let currentQRCodeInstance = null;
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
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
}

function playScanSuccessSFX() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const notes = [659.25, 880.00]; // E5, A5
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
            gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.08);
            osc.stop(ctx.currentTime + idx * 0.08 + 0.15);
        });
    } catch (e) {}
}

// Tab Switching
function switchTab(tabName) {
    getAudioContext();

    const btnGen = document.getElementById('tab-btn-gen');
    const btnRead = document.getElementById('tab-btn-read');
    const contentGen = document.getElementById('tab-gen');
    const contentRead = document.getElementById('tab-read');

    if (tabName === 'gen') {
        btnGen.classList.add('active');
        btnRead.classList.remove('active');
        contentGen.style.display = 'flex';
        contentRead.style.display = 'none';
    } else {
        btnRead.classList.add('active');
        btnGen.classList.remove('active');
        contentRead.style.display = 'flex';
        contentGen.style.display = 'none';
    }
}

// TAB 1: QR Code Generator Logic
function generateQRCode(playAudio = false) {
    const qrText = document.getElementById('qr-text').value.trim();
    const size = parseInt(document.getElementById('sizes').value);
    const colorDark = document.getElementById('color-dark').value;
    const colorLight = document.getElementById('color-light').value;
    const qrContainer = document.getElementById('qr-body');

    if (!qrText) {
        qrContainer.innerHTML = "";
        return;
    }

    if (playAudio) {
        getAudioContext();
        playGenerateSFX();
    }

    // Sync frame background with user selected background color
    qrContainer.style.backgroundColor = colorLight;
    qrContainer.innerHTML = "";

    currentQRCodeInstance = new QRCode(qrContainer, {
        text: qrText,
        width: size,
        height: size,
        colorDark: colorDark,
        colorLight: colorLight,
        correctLevel: QRCode.CorrectLevel.H
    });

    // Update Download Link Href after rendering
    setTimeout(() => {
        updateDownloadHref();
    }, 150);
}

function updateDownloadHref() {
    const downloadBtn = document.getElementById('downloadBtn');
    const qrContainer = document.getElementById('qr-body');
    const img = qrContainer.querySelector('img');
    const canvas = qrContainer.querySelector('canvas');

    if (img && img.src && img.src.startsWith('data:image')) {
        downloadBtn.href = img.src;
    } else if (canvas) {
        downloadBtn.href = canvas.toDataURL("image/png");
    }
}

// TAB 2: QR Code Reader / Scanner Logic
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    getAudioContext();

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            scanImageForQR(img);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function scanImageForQR(img) {
    const canvas = document.getElementById('scan-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);

    if (typeof jsQR !== 'undefined') {
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
            playScanSuccessSFX();
            displayDecodedResult(code.data);
        } else {
            showToast("No QR code detected in image. Try another image.");
        }
    } else {
        showToast("QR Reader library not ready.");
    }
}

function displayDecodedResult(text) {
    const decodedBox = document.getElementById('decoded-box');
    const decodedText = document.getElementById('decoded-text');
    const btnOpenUrl = document.getElementById('btn-open-url');

    decodedText.innerText = text;
    decodedBox.style.display = 'flex';

    // Check if valid HTTP / HTTPS URL
    if (text.startsWith('http://') || text.startsWith('https://')) {
        btnOpenUrl.href = text;
        btnOpenUrl.style.display = 'flex';
    } else {
        btnOpenUrl.style.display = 'none';
    }

    showToast("QR Code successfully decoded! 🎉");
}

function copyDecodedText() {
    const text = document.getElementById('decoded-text').innerText;
    if (!text || text === '...') return;

    navigator.clipboard.writeText(text);
    showToast("Decoded content copied to clipboard! 📋");
}

// Drag & Drop handlers
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files[0]) {
            handleFileSelect({ target: { files: files } });
        }
    });

    // Auto generate initial QR Code
    generateQRCode();

    // Event listener on download button click to ensure fresh data URL
    document.getElementById('downloadBtn').addEventListener('click', () => {
        updateDownloadHref();
    });
});

let toastTimer = null;
function showToast(msg) {
    const toast = document.getElementById('toast');
    const text = document.getElementById('toast-text');
    if (text) text.innerText = msg;

    toast.style.display = 'flex';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.style.display = 'none';
    }, 2200);
}
