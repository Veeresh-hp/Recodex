// --- Photo Studio Pro Engine ---

const fileInput = document.getElementById("file-input");
const filterBtns = document.querySelectorAll(".adj-btn");
const filterName = document.getElementById("filter-name");
const filterValue = document.getElementById("filter-val");
const filterSlider = document.getElementById("filter-slider");
const rotateOptions = document.querySelectorAll(".rot-btn");
const previewImg = document.getElementById("preview-img");

// Filter state
let brightness = 100;
let saturation = 100;
let contrast = 100;
let blurVal = 0;
let sepiaVal = 0;
let inversion = 0;
let grayscale = 0;

// Transform state
let rotate = 0;
let flipHorizontal = 1;
let flipVertical = 1;
let zoomScale = 1.0;

let selectedFilter = "brightness";

function applyFilter() {
    previewImg.style.transform = `scale(${zoomScale}) rotate(${rotate}deg) scale(${flipHorizontal}, ${flipVertical})`;
    previewImg.style.filter = `brightness(${brightness}%) saturate(${saturation}%) contrast(${contrast}%) blur(${blurVal}px) sepia(${sepiaVal}%) invert(${inversion}%) grayscale(${grayscale}%)`;
}

// Preset Filters Handler
function applyPreset(presetKey) {
    document.querySelectorAll('.preset-chips .chip').forEach(chip => {
        chip.classList.toggle('active', chip.getAttribute('onclick')?.includes(presetKey));
    });

    if (presetKey === 'original') {
        brightness = 100; saturation = 100; contrast = 100; blurVal = 0; sepiaVal = 0; inversion = 0; grayscale = 0;
    } else if (presetKey === 'vivid') {
        brightness = 112; saturation = 150; contrast = 120; blurVal = 0; sepiaVal = 0; inversion = 0; grayscale = 0;
    } else if (presetKey === 'vintage') {
        brightness = 95; saturation = 85; contrast = 90; blurVal = 0; sepiaVal = 45; inversion = 0; grayscale = 0;
    } else if (presetKey === 'noir') {
        brightness = 95; saturation = 100; contrast = 135; blurVal = 0; sepiaVal = 0; inversion = 0; grayscale = 100;
    } else if (presetKey === 'warm') {
        brightness = 105; saturation = 130; contrast = 105; blurVal = 0; sepiaVal = 25; inversion = 0; grayscale = 0;
    } else if (presetKey === 'cool') {
        brightness = 102; saturation = 120; contrast = 110; blurVal = 0; sepiaVal = 0; inversion = 0; grayscale = 10;
    }

    updateSliderUI();
    applyFilter();
}

// Active Adjustment Button Switcher
filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".adj-btn.active")?.classList.remove("active");
        btn.classList.add("active");
        selectedFilter = btn.id;
        filterName.innerText = btn.innerText;

        updateSliderUI();
    });
});

function updateSliderUI() {
    if (selectedFilter === "brightness") {
        filterSlider.max = "200";
        filterSlider.value = brightness;
        filterValue.innerText = `${brightness}%`;
    } else if (selectedFilter === "saturation") {
        filterSlider.max = "200";
        filterSlider.value = saturation;
        filterValue.innerText = `${saturation}%`;
    } else if (selectedFilter === "contrast") {
        filterSlider.max = "200";
        filterSlider.value = contrast;
        filterValue.innerText = `${contrast}%`;
    } else if (selectedFilter === "blur") {
        filterSlider.max = "20";
        filterSlider.value = blurVal;
        filterValue.innerText = `${blurVal}px`;
    } else if (selectedFilter === "sepia") {
        filterSlider.max = "100";
        filterSlider.value = sepiaVal;
        filterValue.innerText = `${sepiaVal}%`;
    } else if (selectedFilter === "inversion") {
        filterSlider.max = "100";
        filterSlider.value = inversion;
        filterValue.innerText = `${inversion}%`;
    } else if (selectedFilter === "grayscale") {
        filterSlider.max = "100";
        filterSlider.value = grayscale;
        filterValue.innerText = `${grayscale}%`;
    }
}

// Slider Input Listener
filterSlider.addEventListener("input", () => {
    const val = filterSlider.value;
    filterValue.innerText = selectedFilter === "blur" ? `${val}px` : `${val}%`;

    if (selectedFilter === "brightness") brightness = val;
    else if (selectedFilter === "saturation") saturation = val;
    else if (selectedFilter === "contrast") contrast = val;
    else if (selectedFilter === "blur") blurVal = val;
    else if (selectedFilter === "sepia") sepiaVal = val;
    else if (selectedFilter === "inversion") inversion = val;
    else if (selectedFilter === "grayscale") grayscale = val;

    applyFilter();
});

// Rotate & Flip Controls
rotateOptions.forEach(option => {
    option.addEventListener("click", () => {
        if (option.id === "left") {
            rotate -= 90;
        } else if (option.id === "right") {
            rotate += 90;
        } else if (option.id === "horizontal") {
            flipHorizontal = flipHorizontal === 1 ? -1 : 1;
        } else if (option.id === "vertical") {
            flipVertical = flipVertical === 1 ? -1 : 1;
        }
        applyFilter();
    });
});

// Zoom Controls
function zoomImage(factor) {
    zoomScale = Math.min(Math.max(0.4, zoomScale * factor), 3.0);
    applyFilter();
}

function resetZoom() {
    zoomScale = 1.0;
    applyFilter();
}

// Reset Filters
function resetFilters() {
    brightness = 100; saturation = 100; contrast = 100; blurVal = 0; sepiaVal = 0; inversion = 0; grayscale = 0;
    rotate = 0; flipHorizontal = 1; flipVertical = 1; zoomScale = 1.0;
    
    applyPreset('original');
    showToast("Filters reset to default.");
}

// File Load
fileInput.addEventListener("change", () => {
    let file = fileInput.files[0];
    if (!file) return;

    previewImg.src = URL.createObjectURL(file);
    previewImg.addEventListener("load", () => {
        resetFilters();
        showToast("Image loaded successfully! 🖼️");
    }, { once: true });
});

// Sample Demo Image Generator
function loadSampleImage() {
    previewImg.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800";
    previewImg.crossOrigin = "anonymous";
    previewImg.addEventListener("load", () => {
        resetFilters();
        showToast("Sample photo loaded! 🏖️");
    }, { once: true });
}

// High-Res Canvas Export
function saveImage() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const imgWidth = previewImg.naturalWidth || 800;
    const imgHeight = previewImg.naturalHeight || 600;

    canvas.width = imgWidth;
    canvas.height = imgHeight;

    ctx.filter = `brightness(${brightness}%) saturate(${saturation}%) contrast(${contrast}%) blur(${blurVal}px) sepia(${sepiaVal}%) invert(${inversion}%) grayscale(${grayscale}%)`;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    if (rotate !== 0) {
        ctx.rotate(rotate * Math.PI / 180);
    }
    ctx.scale(flipHorizontal, flipVertical);
    ctx.drawImage(previewImg, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

    const link = document.createElement("a");
    link.download = `PhotoStudio_${Date.now()}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();

    showToast("Image exported & downloaded! 🎉");
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