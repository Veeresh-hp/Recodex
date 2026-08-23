// --- Trade Studio Pro Engine ---

const assetsData = [
    { symbol: "BTC", name: "Bitcoin", price: 60000.00, change: "+7.62%", isUp: true, icon: "₿", unit: "BTC" },
    { symbol: "ETH", name: "Ethereum", price: 3450.00, change: "+4.15%", isUp: true, icon: "Ξ", unit: "ETH" },
    { symbol: "SOL", name: "Solana", price: 145.20, change: "+9.80%", isUp: true, icon: "◎", unit: "SOL" },
    { symbol: "AAPL", name: "Apple Inc.", price: 224.50, change: "+1.20%", isUp: true, icon: "", unit: "AAPL" },
    { symbol: "NVDA", name: "Nvidia Corp.", price: 128.80, change: "+5.60%", isUp: true, icon: "N", unit: "NVDA" },
    { symbol: "TSLA", name: "Tesla Inc.", price: 210.40, change: "-2.10%", isUp: false, icon: "T", unit: "TSLA" }
];

let activeSymbol = "BTC";
let selectedTimeframe = "1W";
let portfolioBtc = 9.086;
let portfolioUsd = 545160.00;

let transactions = [
    { id: 1, type: "BUY", symbol: "BTC", amount: "0.085 BTC", value: "+$5,100", time: "Today, 01:55 PM", status: "Executed" },
    { id: 2, type: "SELL", symbol: "BTC", amount: "0.032 BTC", value: "-$1,920", time: "Today, 03:14 PM", status: "Executed" },
    { id: 3, type: "BUY", symbol: "ETH", amount: "1.065 ETH", value: "+$3,674", time: "Today, 05:38 PM", status: "Executed" }
];

// Initialize Workspace
document.addEventListener("DOMContentLoaded", () => {
    renderWatchlist(assetsData);
    renderTransactions();
    initChart();
    
    // Live price tick simulation interval
    setInterval(simulateMarketTicks, 2500);
});

// Render Watchlist
function renderWatchlist(list) {
    const ul = document.getElementById("watchlist-ul");
    if (!ul) return;

    ul.innerHTML = "";
    list.forEach(asset => {
        const li = document.createElement("li");
        li.className = `asset-item ${asset.symbol === activeSymbol ? 'active' : ''}`;
        li.onclick = () => switchAsset(asset.symbol);

        const chgClass = asset.isUp ? "chg-up" : "chg-down";
        const chgIcon = asset.isUp ? "fa-caret-up" : "fa-caret-down";

        li.innerHTML = `
            <div class="asset-left">
                <div class="asset-icon">${asset.icon}</div>
                <div class="asset-info">
                    <h4>${asset.symbol}</h4>
                    <p>${asset.name}</p>
                </div>
            </div>
            <div class="asset-right">
                <div class="asset-price">$${formatNumber(asset.price)}</div>
                <div class="asset-chg ${chgClass}"><i class="fas ${chgIcon}"></i> ${asset.change}</div>
            </div>
        `;
        ul.appendChild(li);
    });
}

function filterWatchlist() {
    const query = document.getElementById("search-input").value.toLowerCase().trim();
    const filtered = assetsData.filter(a => 
        a.symbol.toLowerCase().includes(query) || 
        a.name.toLowerCase().includes(query)
    );
    renderWatchlist(filtered);
}

// Switch Active Asset
function switchAsset(symbol) {
    const asset = assetsData.find(a => a.symbol === symbol);
    if (!asset) return;

    activeSymbol = symbol;

    document.getElementById("active-symbol").innerText = `${asset.symbol} / USD`;
    document.getElementById("active-name").innerText = asset.name;
    document.getElementById("active-price").innerText = `$${formatNumber(asset.price)}`;
    document.getElementById("active-change").innerHTML = `
        <i class="fas ${asset.isUp ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i> ${asset.change}
    `;
    document.getElementById("active-change").className = `change-badge ${asset.isUp ? '' : 'text-red'}`;
    document.getElementById("trade-unit").innerText = asset.symbol;

    renderWatchlist(assetsData);
    drawChart();
    showToast(`Switched to ${asset.symbol}`);
}

// Set Timeframe
function setTimeframe(tf) {
    selectedTimeframe = tf;
    document.querySelectorAll('.timeframe-selector .tf-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText === tf);
    });
    drawChart();
}

// Custom Real-Time HTML5 Canvas Chart Renderer
let canvas, ctx;

function initChart() {
    canvas = document.getElementById("trading-chart");
    if (!canvas) return;

    ctx = canvas.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
}

function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.parentNode.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    drawChart();
}

function drawChart() {
    if (!ctx || !canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw Grid Lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
    }

    // Generate Points based on symbol & timeframe
    const points = generateChartPoints(width, height);

    if (points.length < 2) return;

    // Draw Gradient Area Fill
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "rgba(16, 185, 129, 0.35)");
    grad.addColorStop(1, "rgba(16, 185, 129, 0.0)");

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        const xc = (points[i].x + points[i - 1].x) / 2;
        const yc = (points[i].y + points[i - 1].y) / 2;
        ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, height);
    ctx.lineTo(points[0].x, height);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw Smooth Line Curve
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        const xc = (points[i].x + points[i - 1].x) / 2;
        const yc = (points[i].y + points[i - 1].y) / 2;
        ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
    }
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Pulse Point at Last Location
    const lastPoint = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#10b981";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
}

function generateChartPoints(width, height) {
    const points = [];
    const count = selectedTimeframe === '1D' ? 12 : selectedTimeframe === '1W' ? 24 : 36;
    const step = width / (count - 1);

    // Seeded pseudo random points
    let seed = activeSymbol.charCodeAt(0);
    for (let i = 0; i < count; i++) {
        const noise = Math.sin(i * 0.4 + seed) * 35 + Math.cos(i * 0.2) * 20;
        const y = height * 0.55 - noise;
        points.push({ x: i * step, y: Math.max(20, Math.min(height - 20, y)) });
    }
    return points;
}

// Live Price Ticks
function simulateMarketTicks() {
    const asset = assetsData.find(a => a.symbol === activeSymbol);
    if (!asset) return;

    const delta = (Math.random() - 0.48) * (asset.price * 0.003);
    asset.price = Math.max(1, asset.price + delta);

    document.getElementById("active-price").innerText = `$${formatNumber(asset.price)}`;
    drawChart();
}

// Execute Trade
function executeTrade(type) {
    const amountInput = document.getElementById("trade-amount");
    const amountVal = parseFloat(amountInput.value);

    if (isNaN(amountVal) || amountVal <= 0) {
        showToast("Invalid order amount", true);
        return;
    }

    const asset = assetsData.find(a => a.symbol === activeSymbol);
    const totalCost = amountVal * (asset ? asset.price : 60000);

    if (type === 'BUY') {
        portfolioBtc += (activeSymbol === 'BTC' ? amountVal : 0);
        portfolioUsd -= totalCost;
    } else {
        portfolioBtc -= (activeSymbol === 'BTC' ? amountVal : 0);
        portfolioUsd += totalCost;
    }

    // Update Balance Cards
    document.getElementById("portfolio-btc").innerText = `${portfolioBtc.toFixed(3)} BTC`;
    document.getElementById("portfolio-usd").innerText = `$${formatNumber(portfolioUsd)} +7.62%`;

    // Log Transaction
    transactions.unshift({
        id: Date.now(),
        type: type,
        symbol: activeSymbol,
        amount: `${amountVal} ${activeSymbol}`,
        value: `${type === 'BUY' ? '+' : '-'}$${formatNumber(totalCost)}`,
        time: "Just now",
        status: "Executed"
    });

    renderTransactions();
    showToast(`${type} Order Executed: ${amountVal} ${activeSymbol}! 🎉`);
}

function renderTransactions() {
    const list = document.getElementById("transactions-list");
    const countBadge = document.getElementById("trans-count");

    if (!list) return;

    if (countBadge) countBadge.innerText = `${transactions.length} Trades`;

    list.innerHTML = "";
    transactions.forEach(t => {
        const card = document.createElement("div");
        card.className = "trans-card";

        const badgeClass = t.type === 'BUY' ? 'badge-buy' : 'badge-sell';
        const iconClass = t.type === 'BUY' ? 'fa-arrow-down-long' : 'fa-arrow-up-long';
        const amtClass = t.type === 'BUY' ? 'chg-up' : 'chg-down';

        card.innerHTML = `
            <div class="trans-left">
                <div class="trans-badge ${badgeClass}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="trans-info">
                    <h4>${t.type} ${t.symbol}</h4>
                    <p>${t.time}</p>
                </div>
            </div>
            <div class="trans-amount ${amtClass}">${t.value}</div>
        `;
        list.appendChild(card);
    });
}

function formatNumber(num) {
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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