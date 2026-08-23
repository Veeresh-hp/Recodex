// --- Beat Studio Pro Engine ---

const wrapper = document.querySelector(".wrapper"),
musicImg = wrapper.querySelector(".img-area img"),
musicName = wrapper.querySelector(".song-details .name"),
musicArtist = wrapper.querySelector(".song-details .artist"),
playPauseBtn = wrapper.querySelector(".play-pause"),
prevBtn = wrapper.querySelector("#prev"),
nextBtn = wrapper.querySelector("#next"),
mainAudio = wrapper.querySelector("#main-audio"),
progressArea = wrapper.querySelector(".progress-area"),
progressBar = progressArea.querySelector(".progress-bar"),
musicList = wrapper.querySelector(".music-list"),
moreMusicBtn = wrapper.querySelector("#more-music"),
btnMenu = wrapper.querySelector("#btn-menu"),
closemoreMusic = musicList.querySelector("#close"),
volSlider = document.getElementById("vol-slider"),
volIcon = document.getElementById("vol-icon"),
btnFav = document.getElementById("btn-fav"),
favIcon = document.getElementById("fav-icon");

let musicIndex = Math.floor((Math.random() * allMusic.length) + 1);
let isMuted = false;
let previousVolume = 0.8;
let favorites = JSON.parse(localStorage.getItem("beat_pro_favs")) || [];

window.addEventListener("load", () => {
    loadMusic(musicIndex);
    playingSong();
});

function loadMusic(indexNumb) {
    const track = allMusic[indexNumb - 1];
    if (!track) return;

    musicName.innerText = track.name;
    musicArtist.innerText = track.artist;
    musicImg.src = `images/${track.img}.jpg`;
    mainAudio.src = `songs/${track.src}.mp3`;

    updateFavoriteUI(track.src);
}

// Play Music Function
function playMusic() {
    wrapper.classList.add("paused");
    playPauseBtn.querySelector("i").innerText = "pause";
    mainAudio.play();
}

// Pause Music Function
function pauseMusic() {
    wrapper.classList.remove("paused");
    playPauseBtn.querySelector("i").innerText = "play_arrow";
    mainAudio.pause();
}

// Prev Music Function
function prevMusic() {
    musicIndex--;
    musicIndex < 1 ? musicIndex = allMusic.length : musicIndex = musicIndex;
    loadMusic(musicIndex);
    playMusic();
    playingSong();
}

// Next Music Function
function nextMusic() {
    musicIndex++;
    musicIndex > allMusic.length ? musicIndex = 1 : musicIndex = musicIndex;
    loadMusic(musicIndex);
    playMusic();
    playingSong();
}

// Play/Pause Click Handler
playPauseBtn.addEventListener("click", () => {
    const isMusicPlay = wrapper.classList.contains("paused");
    isMusicPlay ? pauseMusic() : playMusic();
    playingSong();
});

prevBtn.addEventListener("click", () => prevMusic());
nextBtn.addEventListener("click", () => nextMusic());

// Time update & Progress Bar Width
mainAudio.addEventListener("timeupdate", (e) => {
    const currentTime = e.target.currentTime;
    const duration = e.target.duration;
    let progressWidth = (currentTime / duration) * 100;
    progressBar.style.width = `${progressWidth}%`;

    let musicCurrentTime = wrapper.querySelector(".current-time"),
        musicDuration = wrapper.querySelector(".max-duration");

    let currentMin = Math.floor(currentTime / 60);
    let currentSec = Math.floor(currentTime % 60);
    if (currentSec < 10) currentSec = `0${currentSec}`;
    musicCurrentTime.innerText = `${currentMin}:${currentSec}`;
});

mainAudio.addEventListener("loadeddata", () => {
    let mainAdDuration = mainAudio.duration;
    let totalMin = Math.floor(mainAdDuration / 60);
    let totalSec = Math.floor(mainAdDuration % 60);
    if (totalSec < 10) totalSec = `0${totalSec}`;
    wrapper.querySelector(".max-duration").innerText = `${totalMin}:${totalSec}`;
});

// Click Progress Area to Seek
progressArea.addEventListener("click", (e) => {
    let progressWidth = progressArea.clientWidth;
    let clickedOffsetX = e.offsetX;
    let songDuration = mainAudio.duration;

    if (songDuration) {
        mainAudio.currentTime = (clickedOffsetX / progressWidth) * songDuration;
        playMusic();
        playingSong();
    }
});

// Volume Control Slider & Mute Toggle
if (volSlider) {
    volSlider.addEventListener("input", (e) => {
        const val = e.target.value / 100;
        mainAudio.volume = val;
        isMuted = val === 0;
        updateVolIcon(val);
    });
}

function toggleMute() {
    if (isMuted) {
        mainAudio.volume = previousVolume;
        if (volSlider) volSlider.value = previousVolume * 100;
        isMuted = false;
    } else {
        previousVolume = mainAudio.volume || 0.8;
        mainAudio.volume = 0;
        if (volSlider) volSlider.value = 0;
        isMuted = true;
    }
    updateVolIcon(mainAudio.volume);
}

function updateVolIcon(val) {
    if (!volIcon) return;
    if (val === 0 || isMuted) {
        volIcon.innerText = "volume_off";
    } else if (val < 0.5) {
        volIcon.innerText = "volume_down";
    } else {
        volIcon.innerText = "volume_up";
    }
}

// Favorites Feature
function toggleFavorite() {
    const currentTrack = allMusic[musicIndex - 1];
    if (!currentTrack) return;

    const favIdx = favorites.indexOf(currentTrack.src);
    if (favIdx > -1) {
        favorites.splice(favIdx, 1);
        showToast("Removed from favorites");
    } else {
        favorites.push(currentTrack.src);
        showToast("Added to favorites ❤️");
    }

    localStorage.setItem("beat_pro_favs", JSON.stringify(favorites));
    updateFavoriteUI(currentTrack.src);
}

function updateFavoriteUI(src) {
    if (!btnFav || !favIcon) return;
    const isFav = favorites.includes(src);
    if (isFav) {
        btnFav.classList.add("active");
        favIcon.className = "fas fa-heart";
    } else {
        btnFav.classList.remove("active");
        favIcon.className = "far fa-heart";
    }
}

// Repeat & Shuffle Modes
const repeatBtn = wrapper.querySelector("#repeat-plist");
repeatBtn.addEventListener("click", () => {
    let getText = repeatBtn.innerText;
    switch (getText) {
        case "repeat":
            repeatBtn.innerText = "repeat_one";
            repeatBtn.setAttribute("title", "Song looped");
            break;
        case "repeat_one":
            repeatBtn.innerText = "shuffle";
            repeatBtn.setAttribute("title", "Playback shuffled");
            break;
        case "shuffle":
            repeatBtn.innerText = "repeat";
            repeatBtn.setAttribute("title", "Playlist looped");
            break;
    }
});

// Song Ended Handler
mainAudio.addEventListener("ended", () => {
    let getText = repeatBtn.innerText;
    switch (getText) {
        case "repeat":
            nextMusic();
            break;
        case "repeat_one":
            mainAudio.currentTime = 0;
            loadMusic(musicIndex);
            playMusic();
            break;
        case "shuffle":
            let randIndex = Math.floor((Math.random() * allMusic.length) + 1);
            do {
                randIndex = Math.floor((Math.random() * allMusic.length) + 1);
            } while (musicIndex == randIndex);
            musicIndex = randIndex;
            loadMusic(musicIndex);
            playMusic();
            playingSong();
            break;
    }
});

// Playlist Modal Toggle
if (moreMusicBtn) {
    moreMusicBtn.addEventListener("click", () => {
        musicList.classList.toggle("show");
    });
}
if (btnMenu) {
    btnMenu.addEventListener("click", () => {
        musicList.classList.toggle("show");
    });
}
if (closemoreMusic) {
    closemoreMusic.addEventListener("click", () => {
        musicList.classList.remove("show");
    });
}

const ulTag = wrapper.querySelector("ul");

// Render Playlist LI items
for (let i = 0; i < allMusic.length; i++) {
    let liTag = `<li li-index="${i + 1}">
                    <div class="row">
                      <span>${allMusic[i].name}</span>
                      <p>${allMusic[i].artist}</p>
                    </div>
                    <span id="${allMusic[i].src}" class="audio-duration">3:40</span>
                    <audio class="${allMusic[i].src}" src="songs/${allMusic[i].src}.mp3"></audio>
                  </li>`;
    ulTag.insertAdjacentHTML("beforeend", liTag);

    let liAudioDurationTag = ulTag.querySelector(`#${allMusic[i].src}`);
    let liAudioTag = ulTag.querySelector(`.${allMusic[i].src}`);
    liAudioTag.addEventListener("loadeddata", () => {
        let duration = liAudioTag.duration;
        let totalMin = Math.floor(duration / 60);
        let totalSec = Math.floor(duration % 60);
        if (totalSec < 10) totalSec = `0${totalSec}`;
        liAudioDurationTag.innerText = `${totalMin}:${totalSec}`;
        liAudioDurationTag.setAttribute("t-duration", `${totalMin}:${totalSec}`);
    });
}

// Highlight playing song in list
function playingSong() {
    const allLiTag = ulTag.querySelectorAll("li");

    for (let j = 0; j < allLiTag.length; j++) {
        let audioTag = allLiTag[j].querySelector(".audio-duration");

        if (allLiTag[j].classList.contains("playing")) {
            allLiTag[j].classList.remove("playing");
            let adDuration = audioTag.getAttribute("t-duration");
            audioTag.innerText = adDuration || "3:40";
        }

        if (allLiTag[j].getAttribute("li-index") == musicIndex) {
            allLiTag[j].classList.add("playing");
            audioTag.innerText = "Playing";
        }

        allLiTag[j].setAttribute("onclick", "clicked(this)");
    }
}

function clicked(element) {
    let getLiIndex = element.getAttribute("li-index");
    musicIndex = getLiIndex;
    loadMusic(musicIndex);
    playMusic();
    playingSong();
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
    }, 2000);
}