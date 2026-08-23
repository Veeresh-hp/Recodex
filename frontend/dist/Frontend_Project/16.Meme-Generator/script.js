// --- Meme Studio Pro Engine ---

const canvas = document.getElementById("meme");
const ctx = canvas.getContext("2d");

const imageFileInput = document.getElementById("imageFileInput");
const topTextInput = document.getElementById("topTextInput");
const bottomTextInput = document.getElementById("bottomTextInput");
const fontSizeSlider = document.getElementById("font-size-slider");
const fontSizeVal = document.getElementById("font-size-val");
const fontFamilySelect = document.getElementById("font-family");
const textColorPicker = document.getElementById("text-color");
const strokeColorPicker = document.getElementById("stroke-color");

let currentImage = null;

const PRESET_TEMPLATES = {
    drake: "https://api.memegen.link/images/drake.png",
    doge: "https://api.memegen.link/images/doge.png",
    distracted: "https://api.memegen.link/images/disastergirl.png",
    buttons: "https://api.memegen.link/images/both.png",
    mind: "https://api.memegen.link/images/cmm.png",
    success: "https://api.memegen.link/images/success.png"
};

// SVG Fallback Generator for offline or network issues
function createSvgMemeTemplate(title, bgColor = "#1e293b") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="500" viewBox="0 0 600 500">
        <rect width="600" height="500" fill="${bgColor}"/>
        <circle cx="300" cy="220" r="90" fill="#f59e0b" opacity="0.2"/>
        <text x="300" y="230" font-family="Outfit, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">${title}</text>
    </svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function loadTemplate(templateKey) {
    // Highlight chip
    document.querySelectorAll('.chip').forEach(chip => {
        chip.classList.toggle('active', chip.getAttribute('onclick')?.includes(templateKey));
    });

    const imgUrl = PRESET_TEMPLATES[templateKey] || PRESET_TEMPLATES.drake;
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
        currentImage = img;
        renderMeme();
    };

    img.onerror = () => {
        // Fallback to SVG placeholder if offline
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
            currentImage = fallbackImg;
            renderMeme();
        };
        fallbackImg.src = createSvgMemeTemplate(templateKey.toUpperCase() + " MEME");
    };

    img.src = imgUrl;
}

// Custom File Upload
imageFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            // Deactivate template chips
            document.querySelectorAll('.chip').forEach(chip => chip.classList.remove('active'));
            renderMeme();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Render Engine
function renderMeme() {
    if (!currentImage) return;

    const topText = topTextInput.value.toUpperCase();
    const bottomText = bottomTextInput.value.toUpperCase();
    const fontSize = parseInt(fontSizeSlider.value);
    const fontFamily = fontFamilySelect.value;
    const textColor = textColorPicker.value;
    const strokeColor = strokeColorPicker.value;

    const width = currentImage.width || 600;
    const height = currentImage.height || 500;

    canvas.width = width;
    canvas.height = height;

    // Draw background image
    ctx.drawImage(currentImage, 0, 0, width, height);

    // Font styling
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = Math.max(3, Math.floor(fontSize / 6));
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    ctx.font = `900 ${fontSize}px "${fontFamily}", sans-serif`;

    const yOffset = height / 20;

    // Draw Top Text
    if (topText) {
        ctx.textBaseline = "top";
        ctx.strokeText(topText, width / 2, yOffset);
        ctx.fillText(topText, width / 2, yOffset);
    }

    // Draw Bottom Text
    if (bottomText) {
        ctx.textBaseline = "bottom";
        ctx.strokeText(bottomText, width / 2, height - yOffset);
        ctx.fillText(bottomText, width / 2, height - yOffset);
    }
}

// Live Input Event Listeners
[topTextInput, bottomTextInput].forEach(input => {
    input.addEventListener("input", renderMeme);
});

fontSizeSlider.addEventListener("input", () => {
    fontSizeVal.innerText = `${fontSizeSlider.value}px`;
    renderMeme();
});

fontFamilySelect.addEventListener("change", renderMeme);
textColorPicker.addEventListener("input", renderMeme);
strokeColorPicker.addEventListener("input", renderMeme);

// Export PNG Download
function downloadMeme() {
    if (!currentImage) return;
    const link = document.createElement("a");
    link.download = `Meme_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
}

// Initial Template Load
document.addEventListener("DOMContentLoaded", () => {
    loadTemplate('drake');
});
