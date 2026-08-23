// --- Spelling Bee Challenge Game Logic ---

let word = "";
let score = 0;
let streak = 0;

const words = [
    "aberration", "abstemious", "acumen", "alacrity", "amalgamate", "amenable", "anachronism", "anomaly", 
    "antipathy", "approbation", "arduous", "asceticism", "assiduous", "astringent", "atrophy", "austere", 
    "avarice", "axiom", "bolster", "burgeon", "burnish", "cacophony", "capricious", "castigate", 
    "catalyst", "caustic", "chicanery", "circumlocution", "circumscribe", "circumspect", "coalition", 
    "complaisance", "connoisseur", "contentious", "contrite", "conundrum", "convoluted", "corporeal", 
    "credulous", "culpable", "debacle", "decorum", "deference", "derision", "desiccate", "didactic", 
    "dilatory", "diligent", "dint", "dirge", "disabuse", "discordant", "discretion", "disinterested", 
    "disparage", "disparate", "dissemble", "dissonance", "dogmatic", "ebullience", "eclectic", 
    "efficacy", "effrontery", "elegy", "emollient", "empirical", "encumber", "enfranchise", "ephemeral", 
    "equivocate", "erudite", "esoteric", "eugenic", "exacerbate", "exculpate", "exigent", "exonerate", 
    "extant", "extemporaneous", "extirpate", "facetious", "fallacious", "fervid", "filibuster", "flout", 
    "foment", "forestall", "frugal", "garrulous", "goad", "grandiloquent", "gregarious", "harangue", 
    "hedonism", "histrionic", "hyperbole", "iconoclast", "idiosyncrasy", "impecunious", "impinge", 
    "inchoate", "incipient", "incongruous", "incontrovertible", "inculcate", "indefatigable", "indolent", 
    "inert", "ingratiate", "inimical", "inscrutable", "insinuate", "insipid", "intransigent", "inundate", 
    "inveigle", "irascible", "laconic", "largess", "laud", "libertine", "lionize", "lurid", "magnanimity", 
    "maladroit", "malediction", "malleable", "martial", "maverick", "mendacity", "mendicant", "meretricious", 
    "modicum", "mollify", "morose", "mundane", "nebulous", "neologism", "nefarious", "noxious", "obdurate", 
    "obfuscate", "obsequious", "obstreperous", "obtuse", "onerous", "opprobrium", "oscillation", "paean", 
    "paragon", "pariah", "partisan", "pedantic", "pellucid", "penurious", "peremptory", "perfidious", 
    "perfunctory", "pernicious", "perspicacious", "peruse", "pervade", "phlegmatic", "pith", "plaintive", 
    "plethora", "polemical", "pragmatic", "prattle", "precept", "precipitate", "precursor", "predilection", 
    "prepossess", "prescient", "prevaricate", "pristine", "probity", "proclivity", "profligate", "profuse", 
    "proliferate", "propensity", "proscribe", "punctilious", "pungent", "quaff", "querulous", "quiescent", 
    "rarefy", "recalcitrant", "recondite", "redoubtable", "relegate", "renege", "repudiate", "rescind", 
    "reticent", "reverent", "rife", "sagacious", "salubrious", "sanguine", "satiate", "scurrilous", 
    "solicitous", "solvent", "sophistry", "soporific", "sordid", "specious", "spurious", "squander", 
    "static", "stoic", "stupefy", "stymie", "succinct", "suffuse", "superfluous", "supplicate", "surfeit", 
    "sycophant", "taciturn", "tantamount", "tedious", "temerity", "tenacious", "tirade", "torpid", 
    "tortuous", "tout", "tractable", "truculence", "ubiquitous", "unbridled", "unwitting", "utilitarian", 
    "venal", "veracious", "vexation", "vigilant", "vilify", "virulent", "viscous", "vituperate", 
    "voluble", "waver"
];

// Web Audio API Synthesizer for SFX
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

function playCorrectSFX() {
    try {
        const ctx = getAudioContext();
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
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

function playIncorrectSFX() {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(130, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
}

// Speak Word Function
function speakWord() {
    if (!word) return;
    getAudioContext();

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let voice = new SpeechSynthesisUtterance();
        voice.text = word;
        voice.rate = 0.9;
        voice.pitch = 1.0;
        voice.lang = 'en-US';
        window.speechSynthesis.speak(voice);
    }
}

// Generate New Word Function
function generateNewWord(autoSpeak = true) {
    const num = Math.floor(Math.random() * words.length);
    word = words[num];

    document.getElementById('inp').value = '';
    document.getElementById('feedback').style.display = 'none';

    if (autoSpeak) {
        speakWord();
    }
}

// Submit Function
function submitSpelling() {
    const userVal = document.getElementById('inp').value.trim().toLowerCase();
    if (!userVal || !word) return;

    const feedback = document.getElementById('feedback');

    if (userVal === word.toLowerCase()) {
        score += 10;
        streak++;
        playCorrectSFX();

        feedback.className = 'feedback-banner correct';
        feedback.innerHTML = `<i class="fas fa-circle-check"></i> CORRECT! 🎉`;
        feedback.style.display = 'block';

        updateScoreHUD();

        setTimeout(() => {
            generateNewWord(true);
        }, 1300);

    } else {
        streak = 0;
        playIncorrectSFX();

        feedback.className = 'feedback-banner incorrect';
        feedback.innerHTML = `<i class="fas fa-circle-xmark"></i> INCORRECT! It was <b>"${word}"</b>`;
        feedback.style.display = 'block';

        updateScoreHUD();
    }
}

function updateScoreHUD() {
    document.getElementById('score-val').innerText = score;
    document.getElementById('streak-val').innerText = `${streak} 🔥`;
}

// DOM Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    generateNewWord(false);

    document.getElementById('btn').addEventListener('click', () => {
        generateNewWord(true);
    });

    document.getElementById('speak').addEventListener('click', () => {
        speakWord();
    });

    document.getElementById('sub').addEventListener('click', () => {
        submitSpelling();
    });

    document.getElementById('inp').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitSpelling();
        }
    });
});
