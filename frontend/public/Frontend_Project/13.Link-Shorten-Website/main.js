// --- Link Shortener Pro Engine ---

const STORAGE_KEY = 'shortener_links_history_v2';
let linksHistory = [];
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

function playSuccessSFX() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
}

// LocalStorage Persistence
function loadHistory() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            linksHistory = JSON.parse(saved);
        }
    } catch (e) {
        linksHistory = [];
    }
    renderLinksList();
}

function saveHistory() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(linksHistory));
    } catch (e) {}
    renderLinksList();
}

function clearAllHistory() {
    if (confirm("Are you sure you want to clear all shortened links history?")) {
        linksHistory = [];
        saveHistory();
        showToast("History cleared!");
    }
}

function deleteLink(id) {
    linksHistory = linksHistory.filter(item => item.id !== id);
    saveHistory();
    showToast("Link removed");
}

// Multi-Tier Real URL Shortening Service (Bypasses CORS via Proxy)
async function requestRealShortUrl(rawUrl) {
    // 1. Try TinyURL API via CORS Proxy
    try {
        const tinyUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(rawUrl)}`;
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(tinyUrl)}`);
        const text = await res.text();
        if (text && text.trim().startsWith('http') && !text.includes('Error')) {
            return text.trim();
        }
    } catch (e) {}

    // 2. Try CleanURI API (CORS Enabled)
    try {
        const res = await fetch('https://cleanuri.com/api/v1/shorten', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `url=${encodeURIComponent(rawUrl)}`
        });
        const data = await res.json();
        if (data && data.result_url) {
            return data.result_url;
        }
    } catch (e) {}

    // 3. Try is.gd API via CORS Proxy
    try {
        const isGdUrl = `https://is.gd/create.php?format=json&url=${encodeURIComponent(rawUrl)}`;
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(isGdUrl)}`);
        const data = await res.json();
        if (data && data.shorturl) {
            return data.shorturl;
        }
    } catch (e) {}

    // 4. Direct TinyURL fetch fallback
    try {
        const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(rawUrl)}`);
        const text = await res.text();
        if (text && text.trim().startsWith('http')) {
            return text.trim();
        }
    } catch (e) {}

    return '';
}

// Real URL Shortening Logic
async function handleShortenSubmit(e) {
    e.preventDefault();
    getAudioContext();

    const inputEl = document.getElementById('shortener');
    const submitBtn = document.getElementById('submit__btn');

    let rawUrl = inputEl.value.trim();

    if (!rawUrl) {
        showToast("Please paste a URL to shorten", true);
        return;
    }

    // Auto prepend https:// if protocol is missing
    if (!/^https?:\/\//i.test(rawUrl)) {
        rawUrl = 'https://' + rawUrl;
    }

    // URL validation regex
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    if (!urlPattern.test(rawUrl)) {
        showToast("Please enter a valid web URL (e.g. example.com)", true);
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Shortening...`;

    try {
        const shortUrl = await requestRealShortUrl(rawUrl);

        if (!shortUrl) {
            showToast("Failed to create short link. Please check network connection.", true);
            return;
        }

        const newItem = {
            id: Date.now(),
            longUrl: rawUrl,
            shortUrl: shortUrl,
            createdAt: new Date().toLocaleDateString()
        };

        linksHistory.unshift(newItem);
        saveHistory();

        inputEl.value = "";
        playSuccessSFX();
        showToast("Link shortened & registered successfully! 🎉");

    } catch (error) {
        showToast("Failed to shorten link. Try again.", true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Short it!`;
    }
}

// Render Links History UI
function renderLinksList() {
    const container = document.getElementById('links-container');
    const clearBtn = document.getElementById('clear-history-btn');

    if (!container) return;
    container.innerHTML = "";

    if (linksHistory.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 24px; color: #64748b; font-size: 0.88rem;">
                <i class="fas fa-link-slash" style="font-size: 1.8rem; margin-bottom: 8px; display: block; color: #94a3b8;"></i>
                No shortened links yet. Paste a link above to get started!
            </div>
        `;
        if (clearBtn) clearBtn.style.display = 'none';
        return;
    }

    if (clearBtn) clearBtn.style.display = 'flex';

    linksHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'link-item';
        div.innerHTML = `
            <span class="long-url" title="${item.longUrl}">${item.longUrl}</span>
            <a href="${item.shortUrl}" target="_blank" class="short-url-link" title="Click to open short link">${item.shortUrl}</a>
            <div class="item-actions">
                <button class="copy__btn" onclick="copyToClipboard('${item.shortUrl}', this)" title="Copy Link">Copy</button>
                <button class="action-icon-btn btn-qr" onclick="openQrModal('${item.shortUrl}')" title="Generate QR">
                    <i class="fas fa-qrcode"></i>
                </button>
                <button class="action-icon-btn btn-del" onclick="deleteLink(${item.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

function copyToClipboard(text, btnEl) {
    navigator.clipboard.writeText(text);
    playCopySFX();

    if (btnEl) {
        btnEl.classList.add('copied');
        btnEl.innerText = "Copied!";
        setTimeout(() => {
            btnEl.classList.remove('copied');
            btnEl.innerText = "Copy";
        }, 1800);
    }
    showToast("Link copied to clipboard! 📋");
}

// Modal QR Code Handler
let currentModalQrInstance = null;

function openQrModal(shortUrl) {
    getAudioContext();
    const modal = document.getElementById('qr-modal');
    const subText = document.getElementById('modal-short-url');
    const qrContainer = document.getElementById('modal-qr-body');
    const downloadBtn = document.getElementById('download-qr-btn');

    subText.innerText = shortUrl;
    qrContainer.innerHTML = "";

    currentModalQrInstance = new QRCode(qrContainer, {
        text: shortUrl,
        width: 160,
        height: 160,
        colorDark: "#21243d",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    setTimeout(() => {
        const img = qrContainer.querySelector('img');
        const canvas = qrContainer.querySelector('canvas');
        if (img && img.src) {
            downloadBtn.href = img.src;
        } else if (canvas) {
            downloadBtn.href = canvas.toDataURL('image/png');
        }
    }, 150);

    modal.style.display = 'flex';
}

function closeQrModal() {
    const modal = document.getElementById('qr-modal');
    modal.style.display = 'none';
}

let toastTimer = null;
function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    const textSpan = document.getElementById('toast-text');
    const icon = document.getElementById('toast-icon');

    if (textSpan) textSpan.innerText = msg;
    if (isError) {
        toast.className = 'toast-message error';
        if (icon) icon.className = 'fas fa-circle-exclamation';
    } else {
        toast.className = 'toast-message';
        if (icon) icon.className = 'fas fa-circle-check';
    }

    toast.style.display = 'flex';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.style.display = 'none';
    }, 2200);
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
});