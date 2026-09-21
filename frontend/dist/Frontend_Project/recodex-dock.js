/**
 * RecodeX Floating Navigation Dock
 * Provides cross-project navigation, completion toggling, and return-to-hub controls.
 * Designed to isolate from project stylesheets and only display in full/standalone views.
 */
(function () {
  // If running inside TerminalModal iframe sandbox, do not render floating dock
  if (window.self !== window.top) {
    return;
  }

  const ALL_PROJECTS = [
    "01.Company-Portfolio",
    "02.Blog-Website(With Admin Panel)",
    "03.E-Book Site",
    "04.Ecommerce-site",
    "05.Restaurant Website",
    "06.Hotel Website",
    "07.Photography Portfolio Website",
    "08.Fitness Website",
    "09.Password Generator",
    "10.QR code Reader",
    "11.Weather App",
    "12.Tic-tac-toe Game",
    "13.Link-Shorten-Website",
    "14.Drawing App",
    "15.Alarm Clock",
    "16.Meme-Generator",
    "17.Chatting-App",
    "18.Online-Form",
    "19.Translator",
    "20.Playable-Piano",
    "21.Image Resizer",
    "22.Dynamic Calander",
    "23.File Downloader",
    "24.Chess Game",
    "25.Car-Racing",
    "26.Connect-Game",
    "27.Snake-and-Ladder",
    "28.Spelling-game",
    "29.Analog Watch",
    "30.Photo Editor",
    "31.Music Player",
    "32.Calculator",
    "33.Rock-Paper-Scissors Game",
    "34.Note-App",
    "35.Text-File saver(all extention)",
    "36.Dictionary App",
    "37.Snake Game",
    "38.Stock Trading App",
    "39.Stop watch",
    "40.Text To Word Convertor",
    "41.Todo list app",
    "42.Twitter Clone",
    "43.Typing-Speed-test app",
    "44.Admin panel Dashboard",
    "45.Whatsapp Clone",
    "46.Video 2 Audio Converter",
    "47.Random Qoute Generator",
    "48.Online Quiz Website",
    "49.Dragon Game",
    "50.Drag&Drop Image file"
  ];

  // Detect current project from URL pathname
  const currentPath = decodeURIComponent(window.location.pathname);
  let currentIndex = ALL_PROJECTS.findIndex(function (dir) {
    return currentPath.indexOf("/" + dir) !== -1 || currentPath.indexOf(dir) !== -1;
  });

  if (currentIndex === -1) {
    currentIndex = 0;
  }

  const currentDir = ALL_PROJECTS[currentIndex];
  const prevDir = currentIndex > 0 ? ALL_PROJECTS[currentIndex - 1] : null;
  const nextDir = currentIndex < ALL_PROJECTS.length - 1 ? ALL_PROJECTS[currentIndex + 1] : null;

  const rawMatch = currentDir.match(/^(\d+)\.(.*)$/);
  const projNum = rawMatch ? rawMatch[1] : String(currentIndex + 1).padStart(2, "0");
  const projName = rawMatch ? rawMatch[2].replace(/-/g, " ") : currentDir;

  function isProjectCompleted() {
    try {
      const stored = localStorage.getItem("recodex_completed_projects");
      if (!stored) return false;
      const list = JSON.parse(stored);
      if (!Array.isArray(list)) return false;
      const normalizedCurrent = currentDir.toLowerCase().replace(/[^\w-]/g, "-");
      return list.some(function (item) {
        const normItem = String(item).toLowerCase().replace(/[^\w-]/g, "-");
        return normItem === normalizedCurrent || normItem.indexOf(projNum + "-") === 0;
      });
    } catch (e) {
      return false;
    }
  }

  function toggleProjectCompleted() {
    try {
      let list = [];
      const stored = localStorage.getItem("recodex_completed_projects");
      if (stored) {
        try { list = JSON.parse(stored); } catch (e) { list = []; }
      }
      if (!Array.isArray(list)) list = [];

      const normalizedCurrent = currentDir.toLowerCase().replace(/[^\w-]/g, "-");
      const exists = list.some(function (item) {
        const norm = String(item).toLowerCase().replace(/[^\w-]/g, "-");
        return norm === normalizedCurrent || norm.indexOf(projNum + "-") === 0;
      });

      if (exists) {
        list = list.filter(function (item) {
          const norm = String(item).toLowerCase().replace(/[^\w-]/g, "-");
          return norm !== normalizedCurrent && norm.indexOf(projNum + "-") !== 0;
        });
      } else {
        list.push(currentDir);
      }

      localStorage.setItem("recodex_completed_projects", JSON.stringify(list));
      window.dispatchEvent(new StorageEvent("storage", {
        key: "recodex_completed_projects",
        newValue: JSON.stringify(list)
      }));
      return !exists;
    } catch (e) {
      console.error("Error toggling completion:", e);
      return false;
    }
  }

  function initDock() {
    if (document.getElementById("recodex-dock-host")) return;

    const host = document.createElement("div");
    host.id = "recodex-dock-host";
    host.style.cssText = "all: initial; position: fixed; z-index: 2147483647;";

    const shadow = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

    const style = document.createElement("style");
    style.textContent = `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", sans-serif;
      }

      .dock-container {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.94);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.14);
        box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.15);
        border-radius: 9999px;
        padding: 6px 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: #f8fafc;
        font-size: 12px;
        user-select: none;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        max-width: 95vw;
        z-index: 2147483647;
      }

      .dock-container:hover {
        border-color: rgba(56, 189, 248, 0.4);
        box-shadow: 0 20px 45px -5px rgba(0, 0, 0, 0.9), 0 0 25px rgba(56, 189, 248, 0.25);
      }

      .dock-brand {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: rgba(56, 189, 248, 0.1);
        border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 9999px;
        color: #38bdf8;
        font-weight: 800;
        letter-spacing: 0.5px;
        text-decoration: none;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .dock-brand:hover {
        background: rgba(56, 189, 248, 0.2);
        color: #ffffff;
      }

      .brand-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #38bdf8;
        box-shadow: 0 0 8px #38bdf8;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(0.85); }
      }

      .dock-hub-link {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 9999px;
        color: #e2e8f0;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .dock-hub-link:hover {
        background: #38bdf8;
        color: #090d16;
        border-color: #38bdf8;
      }

      .dock-divider {
        width: 1px;
        height: 20px;
        background: rgba(255, 255, 255, 0.15);
      }

      .dock-project-info {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0 6px;
        max-width: 200px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .proj-number {
        background: rgba(255, 255, 255, 0.12);
        padding: 2px 6px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 11px;
        color: #38bdf8;
      }

      .proj-name {
        font-weight: 600;
        color: #cbd5e1;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 12px;
      }

      .dock-nav-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #cbd5e1;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        font-size: 12px;
      }

      .dock-nav-btn:hover:not(.disabled) {
        background: rgba(255, 255, 255, 0.2);
        color: #ffffff;
      }

      .dock-nav-btn.disabled {
        opacity: 0.3;
        cursor: not-allowed;
        pointer-events: none;
      }

      .dock-complete-btn {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 5px 12px;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
        white-space: nowrap;
      }

      .dock-complete-btn.pending {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.12);
        color: #cbd5e1;
      }

      .dock-complete-btn.pending:hover {
        background: rgba(16, 185, 129, 0.2);
        border-color: rgba(16, 185, 129, 0.4);
        color: #34d399;
      }

      .dock-complete-btn.completed {
        background: rgba(16, 185, 129, 0.2);
        border-color: rgba(16, 185, 129, 0.5);
        color: #10b981;
        box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
      }

      .dock-min-btn {
        background: none;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 4px;
        font-size: 14px;
        line-height: 1;
        transition: color 0.2s;
      }

      .dock-min-btn:hover {
        color: #ffffff;
      }

      /* Minimized Pill Mode */
      .dock-container.minimized {
        padding: 6px 12px;
        gap: 6px;
      }

      .dock-container.minimized .dock-full-content {
        display: none;
      }

      @media (max-width: 640px) {
        .dock-project-info {
          display: none;
        }
        .dock-container {
          bottom: 16px;
          padding: 4px 8px;
          gap: 6px;
        }
      }
    `;

    const dock = document.createElement("div");
    dock.className = "dock-container";

    let completed = isProjectCompleted();

    function renderDockContent() {
      dock.innerHTML = `
        <a href="/projects" class="dock-brand" title="Return to RecodeX Core Platform">
          <span class="brand-dot"></span>
          <span>RecodeX</span>
        </a>

        <div class="dock-full-content" style="display: contents;">
          <a href="/projects" class="dock-hub-link" title="Explore all 50 Projects in Suite">
            &larr; Back to RecodeX
          </a>

          <div class="dock-divider"></div>

          <div class="dock-project-info" title="${projNum}. ${projName}">
            <span class="proj-number">#${projNum}</span>
            <span class="proj-name">${projName}</span>
          </div>

          <!-- Prev Button -->
          <a
            href="${prevDir ? '../' + encodeURIComponent(prevDir) + '/index.html' : '#'}"
            class="dock-nav-btn ${!prevDir ? 'disabled' : ''}"
            title="${prevDir ? 'Previous Project: ' + prevDir : 'First project'}"
          >
            &#9664;
          </a>

          <!-- Next Button -->
          <a
            href="${nextDir ? '../' + encodeURIComponent(nextDir) + '/index.html' : '#'}"
            class="dock-nav-btn ${!nextDir ? 'disabled' : ''}"
            title="${nextDir ? 'Next Project: ' + nextDir : 'Last project'}"
          >
            &#9654;
          </a>

          <div class="dock-divider"></div>

          <!-- Completion Toggle -->
          <button
            class="dock-complete-btn ${completed ? 'completed' : 'pending'}"
            id="dock-toggle-complete"
            title="Mark this project as finished in your RecodeX Profile Challenge Hub"
          >
            ${completed ? 'Completed &#10003;' : 'Mark Done'}
          </button>
        </div>

        <button class="dock-min-btn" id="dock-toggle-min" title="Minimize / Expand navigation dock">
          &minus;
        </button>
      `;

      // Attach event listeners
      const toggleBtn = dock.querySelector("#dock-toggle-complete");
      if (toggleBtn) {
        toggleBtn.addEventListener("click", function (e) {
          e.preventDefault();
          completed = toggleProjectCompleted();
          renderDockContent();
        });
      }

      const minBtn = dock.querySelector("#dock-toggle-min");
      if (minBtn) {
        minBtn.addEventListener("click", function (e) {
          e.preventDefault();
          dock.classList.toggle("minimized");
          minBtn.innerHTML = dock.classList.contains("minimized") ? "&#43;" : "&minus;";
        });
      }
    }

    renderDockContent();

    shadow.appendChild(style);
    shadow.appendChild(dock);
    document.body.appendChild(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDock);
  } else {
    initDock();
  }
})();
