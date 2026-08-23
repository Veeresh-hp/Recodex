// --- Calendar Studio Pro Engine ---

const daysContainer = document.getElementById("days-container");
const currentDateTag = document.getElementById("current-date");
const prevNextIcon = document.querySelectorAll(".nav-btn");
const selectedDateTitle = document.getElementById("selected-date-title");
const eventsListContainer = document.getElementById("events-list");

const eventTitleInput = document.getElementById("event-title-input");
const eventCategorySelect = document.getElementById("event-category-select");
const eventTimeInput = document.getElementById("event-time-input");

const STORAGE_KEY = "cal_studio_events_v2";

let todayDate = new Date();
let currYear = todayDate.getFullYear();
let currMonth = todayDate.getMonth();
let selectedDate = new Date(); // Currently selected date object

// LocalStorage Events Database
let eventsData = {};

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function loadEvents() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            eventsData = JSON.parse(saved);
        } else {
            // Seed initial demo events for today
            const todayKey = formatDateKey(new Date());
            eventsData[todayKey] = [
                { id: 101, title: "Sprint Planning & Review", category: "work", time: "10:00 AM" },
                { id: 102, title: "Coffee & Team Sync", category: "personal", time: "02:30 PM" }
            ];
            saveEvents();
        }
    } catch (e) {
        eventsData = {};
    }
}

function saveEvents() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(eventsData));
    } catch (e) {}
}

function formatDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatFullDateString(d) {
    const dayName = daysOfWeek[d.getDay()];
    const monthName = months[d.getMonth()].substring(0, 3);
    return `${dayName}, ${monthName} ${d.getDate()}, ${d.getFullYear()}`;
}

// Render Calendar Month Grid
const renderCalendar = () => {
    let firstDayofMonth = new Date(currYear, currMonth, 1).getDay();
    let lastDateofMonth = new Date(currYear, currMonth + 1, 0).getDate();
    let lastDayofMonth = new Date(currYear, currMonth, lastDateofMonth).getDay();
    let lastDateofLastMonth = new Date(currYear, currMonth, 0).getDate();
    let liTag = "";

    // Trailing days of previous month
    for (let i = firstDayofMonth; i > 0; i--) {
        liTag += `<li class="inactive">${lastDateofLastMonth - i + 1}</li>`;
    }

    // Days of current month
    for (let i = 1; i <= lastDateofMonth; i++) {
        const thisDate = new Date(currYear, currMonth, i);
        const dateKey = formatDateKey(thisDate);

        let isToday = (i === todayDate.getDate() && currMonth === todayDate.getMonth() && currYear === todayDate.getFullYear()) ? "today" : "";
        let isSelected = (i === selectedDate.getDate() && currMonth === selectedDate.getMonth() && currYear === selectedDate.getFullYear()) ? "active" : "";

        // Check if date has events
        let hasEvents = (eventsData[dateKey] && eventsData[dateKey].length > 0);
        let dotHtml = hasEvents ? `<span class="event-dot"></span>` : "";

        liTag += `<li class="${isToday} ${isSelected}" onclick="selectCalendarDate(${currYear}, ${currMonth}, ${i})">${i}${dotHtml}</li>`;
    }

    // Leading days of next month
    for (let i = lastDayofMonth; i < 6; i++) {
        liTag += `<li class="inactive">${i - lastDayofMonth + 1}</li>`;
    }

    currentDateTag.innerText = `${months[currMonth]} ${currYear}`;
    daysContainer.innerHTML = liTag;

    renderAgenda();
};

function selectCalendarDate(year, month, day) {
    selectedDate = new Date(year, month, day);
    renderCalendar();
}

function jumpToToday() {
    todayDate = new Date();
    currYear = todayDate.getFullYear();
    currMonth = todayDate.getMonth();
    selectedDate = new Date(todayDate);
    renderCalendar();
    showToast("Jumped to Today!");
}

// Render Agenda for Selected Date
function renderAgenda() {
    const key = formatDateKey(selectedDate);
    selectedDateTitle.innerText = formatFullDateString(selectedDate);

    eventsListContainer.innerHTML = "";
    const list = eventsData[key] || [];

    if (list.length === 0) {
        eventsListContainer.innerHTML = `
            <div style="text-align: center; padding: 24px 10px; color: #64748b; font-size: 0.85rem;">
                <i class="fas fa-calendar-xmark" style="font-size: 1.6rem; margin-bottom: 6px; display: block; color: #475569;"></i>
                No events or tasks scheduled for this date.
            </div>
        `;
        return;
    }

    list.forEach(item => {
        const card = document.createElement("div");
        card.className = "event-card";

        let catClass = item.category === "work" ? "cat-work" : item.category === "personal" ? "cat-personal" : "cat-deadline";

        card.innerHTML = `
            <div class="event-left">
                <div class="cat-indicator ${catClass}"></div>
                <div class="event-info">
                    <h4>${escapeHtml(item.title)}</h4>
                    <p><i class="far fa-clock"></i> ${item.time}</p>
                </div>
            </div>
            <button class="btn-del-event" onclick="deleteEvent(${item.id})" title="Delete Event">
                <i class="fas fa-trash"></i>
            </button>
        `;
        eventsListContainer.appendChild(card);
    });
}

function handleAddEvent(e) {
    e.preventDefault();
    const title = eventTitleInput.value.trim();
    const category = eventCategorySelect.value;
    const time = eventTimeInput.value.trim() || "10:00 AM";

    if (!title) return;

    const key = formatDateKey(selectedDate);
    if (!eventsData[key]) {
        eventsData[key] = [];
    }

    eventsData[key].push({
        id: Date.now(),
        title: title,
        category: category,
        time: time
    });

    saveEvents();
    eventTitleInput.value = "";
    showToast("Event added to agenda! 🎉");
    renderCalendar();
}

function deleteEvent(id) {
    const key = formatDateKey(selectedDate);
    if (eventsData[key]) {
        eventsData[key] = eventsData[key].filter(item => item.id !== id);
        saveEvents();
        renderCalendar();
        showToast("Event removed");
    }
}

// Navigation Listeners
prevNextIcon.forEach(icon => {
    icon.addEventListener("click", () => {
        currMonth = icon.id === "prev" ? currMonth - 1 : currMonth + 1;

        if (currMonth < 0 || currMonth > 11) {
            date = new Date(currYear, currMonth, 1);
            currYear = date.getFullYear();
            currMonth = date.getMonth();
        }
        renderCalendar();
    });
});

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
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

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    loadEvents();
    renderCalendar();
});