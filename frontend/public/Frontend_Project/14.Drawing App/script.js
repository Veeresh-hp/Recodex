// --- Paint Studio Pro Engine ---

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const toolBtns = document.querySelectorAll(".tool-btn");
const fillColor = document.getElementById("fill-color");
const sizeSlider = document.getElementById("size-slider");
const sizeVal = document.getElementById("size-val");
const opacitySlider = document.getElementById("opacity-slider");
const opacityVal = document.getElementById("opacity-val");
const colorPalette = document.querySelectorAll(".option-color:not(.custom-picker-wrapper)");
const colorPicker = document.getElementById("color-picker");
const clearCanvasBtn = document.querySelector(".clear-canvas");
const saveImgBtn = document.querySelector(".save-img");
const textInput = document.getElementById("canvas-text-input");

// Global state
let prevMouseX = 0;
let prevMouseY = 0;
let snapshot = null;
let isDrawing = false;
let selectedTool = "brush";
let brushWidth = 5;
let opacityValue = 1.0;
let selectedColor = "#000000";

// History Stack (Undo / Redo)
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 35;

function saveState() {
    if (undoStack.length >= MAX_HISTORY) {
        undoStack.shift();
    }
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    redoStack = []; // Clear redo stack on new action
}

function undo() {
    if (undoStack.length > 0) {
        redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        const previousState = undoStack.pop();
        ctx.putImageData(previousState, 0, 0);
    }
}

function redo() {
    if (redoStack.length > 0) {
        undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        const nextState = redoStack.pop();
        ctx.putImageData(nextState, 0, 0);
    }
}

const setCanvasBackground = () => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = selectedColor;
};

// Canvas Setup & High-Res Resize Handler
function initCanvas() {
    const parent = canvas.parentElement;
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    if (canvas.width > 0 && canvas.height > 0) {
        tempCtx.drawImage(canvas, 0, 0);
    }

    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;

    setCanvasBackground();

    if (tempCanvas.width > 0 && tempCanvas.height > 0) {
        ctx.drawImage(tempCanvas, 0, 0);
    }
}

window.addEventListener("load", () => {
    initCanvas();
    saveState();
});

window.addEventListener("resize", () => {
    initCanvas();
});

// Event coordinate extractor (supports mouse & touch)
function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    }
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

// Drawing Algorithms
const drawRect = (x, y) => {
    if (!fillColor.checked) {
        ctx.strokeRect(x, y, prevMouseX - x, prevMouseY - y);
    } else {
        ctx.fillRect(x, y, prevMouseX - x, prevMouseY - y);
    }
};

const drawCircle = (x, y) => {
    ctx.beginPath();
    let radius = Math.sqrt(Math.pow((prevMouseX - x), 2) + Math.pow((prevMouseY - y), 2));
    ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
    fillColor.checked ? ctx.fill() : ctx.stroke();
};

const drawTriangle = (x, y) => {
    ctx.beginPath();
    ctx.moveTo(prevMouseX, prevMouseY);
    ctx.lineTo(x, y);
    ctx.lineTo(prevMouseX * 2 - x, y);
    ctx.closePath();
    fillColor.checked ? ctx.fill() : ctx.stroke();
};

const drawLine = (x, y) => {
    ctx.beginPath();
    ctx.moveTo(prevMouseX, prevMouseY);
    ctx.lineTo(x, y);
    ctx.stroke();
};

const drawArrow = (x, y) => {
    ctx.beginPath();
    ctx.moveTo(prevMouseX, prevMouseY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Arrowhead calculations
    const headlen = Math.max(10, brushWidth * 3);
    const angle = Math.atan2(y - prevMouseY, x - prevMouseX);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - headlen * Math.cos(angle - Math.PI / 6), y - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x - headlen * Math.cos(angle + Math.PI / 6), y - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
};

const drawStar = (x, y) => {
    ctx.beginPath();
    const radius = Math.sqrt(Math.pow((prevMouseX - x), 2) + Math.pow((prevMouseY - y), 2));
    const spikes = 5;
    const outerRadius = radius;
    const innerRadius = radius / 2;
    let rot = Math.PI / 2 * 3;
    let cx = prevMouseX;
    let cy = prevMouseY;
    let step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    fillColor.checked ? ctx.fill() : ctx.stroke();
};

// Main Drawing Handlers
const startDraw = (e) => {
    e.preventDefault();
    if (selectedTool === "text") {
        handleTextPlacement(e);
        return;
    }

    isDrawing = true;
    const coords = getCoordinates(e);
    prevMouseX = coords.x;
    prevMouseY = coords.y;

    ctx.beginPath();
    ctx.lineWidth = brushWidth;
    ctx.strokeStyle = selectedTool === "eraser" ? "#ffffff" : selectedColor;
    ctx.fillStyle = selectedColor;
    ctx.globalAlpha = selectedTool === "eraser" ? 1.0 : opacityValue;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
};

const drawing = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    ctx.putImageData(snapshot, 0, 0);

    if (selectedTool === "brush" || selectedTool === "eraser") {
        ctx.strokeStyle = selectedTool === "eraser" ? "#ffffff" : selectedColor;
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
    } else if (selectedTool === "rectangle") {
        drawRect(coords.x, coords.y);
    } else if (selectedTool === "circle") {
        drawCircle(coords.x, coords.y);
    } else if (selectedTool === "triangle") {
        drawTriangle(coords.x, coords.y);
    } else if (selectedTool === "line") {
        drawLine(coords.x, coords.y);
    } else if (selectedTool === "arrow") {
        drawArrow(coords.x, coords.y);
    } else if (selectedTool === "star") {
        drawStar(coords.x, coords.y);
    }
};

const stopDraw = (e) => {
    if (isDrawing) {
        isDrawing = false;
        saveState();
    }
};

// Text Tool Handler
let textX = 0;
let textY = 0;

function handleTextPlacement(e) {
    const coords = getCoordinates(e);
    textX = coords.x;
    textY = coords.y;

    textInput.style.left = `${coords.x + 10}px`;
    textInput.style.top = `${coords.y + 10}px`;
    textInput.style.display = "block";
    textInput.value = "";
    textInput.focus();
}

function commitText() {
    const val = textInput.value.trim();
    if (val) {
        ctx.font = `bold ${Math.max(14, brushWidth * 3)}px Outfit, sans-serif`;
        ctx.fillStyle = selectedColor;
        ctx.globalAlpha = opacityValue;
        ctx.fillText(val, textX, textY);
        saveState();
    }
    textInput.style.display = "none";
}

textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        commitText();
    }
});

textInput.addEventListener("blur", () => {
    commitText();
});

// Tool Buttons
toolBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".tools-grid .active")?.classList.remove("active");
        btn.classList.add("active");
        selectedTool = btn.id;
    });
});

// Sliders
sizeSlider.addEventListener("input", () => {
    brushWidth = sizeSlider.value;
    sizeVal.innerText = `${brushWidth}px`;
});

opacitySlider.addEventListener("input", () => {
    opacityValue = opacitySlider.value / 100;
    opacityVal.innerText = `${opacitySlider.value}%`;
});

// Color Pickers
colorPalette.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".colors .selected")?.classList.remove("selected");
        btn.classList.add("selected");
        selectedColor = btn.dataset.color;
    });
});

colorPicker.addEventListener("input", () => {
    selectedColor = colorPicker.value;
    document.querySelector(".colors .selected")?.classList.remove("selected");
    colorPicker.parentElement.classList.add("selected");
});

// Clear & Save
clearCanvasBtn.addEventListener("click", () => {
    setCanvasBackground();
    saveState();
});

saveImgBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `PaintStudio_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
});

// Keyboard Shortcuts (Ctrl+Z / Ctrl+Y)
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
    }
});

// Canvas Mouse & Touch Event Listeners
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", stopDraw);

canvas.addEventListener("touchstart", startDraw, { passive: false });
canvas.addEventListener("touchmove", drawing, { passive: false });
canvas.addEventListener("touchend", stopDraw);