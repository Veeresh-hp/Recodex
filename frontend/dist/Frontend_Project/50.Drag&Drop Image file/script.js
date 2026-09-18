/**
 * PixelDrop Pro — Uploader & Image Studio Logic
 * Multi-file Drag & Drop, FileReader, Live Image Adjustments, Canvas Export
 */

const STORAGE_KEY_ASSETS = "recodex_pixeldrop_assets_v2";
const STORAGE_KEY_THEME = "recodex_pixeldrop_theme_v2";

const SAMPLE_ASSETS = [
  {
    id: "sample-1",
    name: "cyberpunk_city_night.jpg",
    size: "1.4 MB",
    type: "image/jpeg",
    dimensions: "1920 x 1080",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    timestamp: "Just now",
  },
  {
    id: "sample-2",
    name: "minimal_geometric_abstract.png",
    size: "820 KB",
    type: "image/png",
    dimensions: "1200 x 800",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    timestamp: "2 mins ago",
  },
  {
    id: "sample-3",
    name: "code_terminal_workspace.webp",
    size: "640 KB",
    type: "image/webp",
    dimensions: "1600 x 900",
    url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
    timestamp: "5 mins ago",
  }
];

class PixelDropApp {
  constructor() {
    this.dropZone = document.getElementById("drop-zone");
    this.fileInput = document.getElementById("file-input");
    this.browseBtn = document.getElementById("browse-btn");
    this.assetsGrid = document.getElementById("assets-grid");
    this.galleryToolbar = document.getElementById("gallery-toolbar");
    this.filesCountBadge = document.getElementById("files-count-badge");
    this.totalSizeBadge = document.getElementById("total-size-badge");
    this.toastEl = document.getElementById("toast");
    this.themeToggleBtn = document.getElementById("theme-toggle");

    // Studio Elements
    this.studioModal = document.getElementById("studio-modal");
    this.studioImg = document.getElementById("studio-img");
    this.studioFilename = document.getElementById("studio-filename");
    this.studioDimensions = document.getElementById("studio-dimensions");
    this.closeStudioBtn = document.getElementById("close-studio-btn");
    this.activeAsset = null;

    // Filter values
    this.filters = {
      brightness: 100,
      contrast: 100,
      saturate: 100,
      grayscale: 0,
      sepia: 0,
      blur: 0,
    };

    this.assets = this.loadAssets();
    this.initTheme();
    this.bindEvents();
    this.renderAssets();
  }

  initTheme() {
    const saved = localStorage.getItem(STORAGE_KEY_THEME) || "dark";
    document.documentElement.setAttribute("data-theme", saved);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY_THEME, next);
    this.showToast(`Theme: ${next.toUpperCase()}`);
  }

  loadAssets() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ASSETS);
      return saved ? JSON.parse(saved) : SAMPLE_ASSETS;
    } catch {
      return SAMPLE_ASSETS;
    }
  }

  saveAssets() {
    localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(this.assets));
  }

  showToast(message) {
    if (!this.toastEl) return;
    this.toastEl.textContent = message;
    this.toastEl.classList.remove("hidden");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.add("hidden");
    }, 2200);
  }

  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  bindEvents() {
    // Theme toggle
    this.themeToggleBtn?.addEventListener("click", () => this.toggleTheme());

    // File Input trigger
    this.browseBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.fileInput.click();
    });

    this.dropZone?.addEventListener("click", () => {
      this.fileInput.click();
    });

    this.fileInput?.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        this.handleFiles(Array.from(e.target.files));
      }
    });

    // Drag & Drop events on DropZone
    ["dragenter", "dragover"].forEach((eventName) => {
      this.dropZone?.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      this.dropZone?.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove("dragover");
      });
    });

    this.dropZone?.addEventListener("drop", (e) => {
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length > 0) {
        this.handleFiles(files);
      } else {
        this.showToast("Please drop valid image files.");
      }
    });

    // Toolbar actions
    document.getElementById("clear-all-btn")?.addEventListener("click", () => {
      if (this.assets.length === 0) return;
      if (confirm("Clear all uploaded assets?")) {
        this.assets = [];
        this.saveAssets();
        this.renderAssets();
        this.showToast("All assets cleared");
      }
    });

    document.getElementById("sample-btn")?.addEventListener("click", () => {
      this.assets = [...SAMPLE_ASSETS];
      this.saveAssets();
      this.renderAssets();
      this.showToast("Sample assets loaded");
    });

    // Studio events
    this.closeStudioBtn?.addEventListener("click", () => {
      this.studioModal.classList.add("hidden");
    });

    // Sliders
    ["brightness", "contrast", "saturate", "grayscale", "sepia", "blur"].forEach(
      (prop) => {
        const slider = document.getElementById(`slider-${prop}`);
        slider?.addEventListener("input", (e) => {
          this.filters[prop] = e.target.value;
          const unit = prop === "blur" ? "px" : "%";
          document.getElementById(`val-${prop}`).textContent = `${e.target.value}${unit}`;
          this.applyFiltersToStudio();
        });
      }
    );

    // Preset buttons
    document.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const preset = e.target.dataset.preset;
        this.applyPreset(preset);
      });
    });

    // Copy Base64
    document.getElementById("copy-base64-btn")?.addEventListener("click", () => {
      if (!this.activeAsset) return;
      navigator.clipboard?.writeText(this.activeAsset.url);
      this.showToast("Image Data URL copied to clipboard!");
    });

    // Download Filtered Image
    document.getElementById("download-filtered-btn")?.addEventListener("click", () => {
      this.downloadFilteredImage();
    });
  }

  handleFiles(fileList) {
    let pending = fileList.length;
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const img = new Image();
        img.onload = () => {
          const newAsset = {
            id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: file.name,
            size: this.formatBytes(file.size),
            type: file.type || "image/png",
            dimensions: `${img.naturalWidth} x ${img.naturalHeight}`,
            url: dataUrl,
            timestamp: "Just now",
          };
          this.assets.unshift(newAsset);
          pending--;
          if (pending === 0) {
            this.saveAssets();
            this.renderAssets();
            this.showToast(`Uploaded ${fileList.length} asset(s) successfully!`);
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  deleteAsset(id) {
    this.assets = this.assets.filter((a) => a.id !== id);
    this.saveAssets();
    this.renderAssets();
    this.showToast("Asset removed");
  }

  openStudio(asset) {
    this.activeAsset = asset;
    this.studioFilename.textContent = asset.name;
    this.studioDimensions.textContent = asset.dimensions;
    this.studioImg.src = asset.url;
    this.applyPreset("reset");
    this.studioModal.classList.remove("hidden");
  }

  applyFiltersToStudio() {
    if (!this.studioImg) return;
    this.studioImg.style.filter = `
      brightness(${this.filters.brightness}%)
      contrast(${this.filters.contrast}%)
      saturate(${this.filters.saturate}%)
      grayscale(${this.filters.grayscale}%)
      sepia(${this.filters.sepia}%)
      blur(${this.filters.blur}px)
    `;
  }

  applyPreset(preset) {
    if (preset === "vintage") {
      this.filters = { brightness: 110, contrast: 90, saturate: 75, grayscale: 10, sepia: 40, blur: 0 };
    } else if (preset === "bw") {
      this.filters = { brightness: 105, contrast: 130, saturate: 0, grayscale: 100, sepia: 0, blur: 0 };
    } else if (preset === "vivid") {
      this.filters = { brightness: 105, contrast: 115, saturate: 160, grayscale: 0, sepia: 0, blur: 0 };
    } else {
      // reset
      this.filters = { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, blur: 0 };
    }

    // Update slider UI
    for (const [key, val] of Object.entries(this.filters)) {
      const slider = document.getElementById(`slider-${key}`);
      if (slider) slider.value = val;
      const unit = key === "blur" ? "px" : "%";
      const valEl = document.getElementById(`val-${key}`);
      if (valEl) valEl.textContent = `${val}${unit}`;
    }

    this.applyFiltersToStudio();
  }

  downloadFilteredImage() {
    if (!this.activeAsset) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.filter = `
        brightness(${this.filters.brightness}%)
        contrast(${this.filters.contrast}%)
        saturate(${this.filters.saturate}%)
        grayscale(${this.filters.grayscale}%)
        sepia(${this.filters.sepia}%)
        blur(${this.filters.blur}px)
      `;
      ctx.drawImage(img, 0, 0);

      const link = document.createElement("a");
      link.download = `pixeldrop_edit_${this.activeAsset.name}`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      this.showToast("Exported image download started!");
    };
    img.src = this.activeAsset.url;
  }

  renderAssets() {
    if (!this.assetsGrid) return;

    if (this.assets.length === 0) {
      this.galleryToolbar.classList.add("hidden");
      this.assetsGrid.innerHTML = "";
      return;
    }

    this.galleryToolbar.classList.remove("hidden");
    this.filesCountBadge.textContent = `${this.assets.length} file${this.assets.length === 1 ? "" : "s"}`;
    this.totalSizeBadge.textContent = `Batch Ready`;

    this.assetsGrid.innerHTML = this.assets
      .map((asset) => {
        const typeBadge = asset.type.split("/")[1]?.toUpperCase() || "IMG";
        return `
        <div class="asset-card" data-id="${asset.id}">
          <div class="card-preview-area open-studio-btn" data-id="${asset.id}" title="Click to open studio editor">
            <img src="${asset.url}" alt="${asset.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'" />
            <div class="card-progress-bar"></div>
          </div>
          <div class="card-info">
            <span class="card-filename" title="${asset.name}">${asset.name}</span>
            <div class="card-meta">
              <span>${typeBadge} · ${asset.size}</span>
              <span>${asset.dimensions}</span>
            </div>
            <div class="card-actions">
              <button class="card-btn open-studio-btn" data-id="${asset.id}">
                Studio
              </button>
              <button class="card-btn copy-url-btn" data-id="${asset.id}" title="Copy Base64 / URL">
                Copy
              </button>
              <button class="card-btn delete-btn delete-asset-btn" data-id="${asset.id}" title="Delete asset">
                Delete
              </button>
            </div>
          </div>
        </div>
      `;
      })
      .join("");

    // Bind card buttons
    this.assetsGrid.querySelectorAll(".open-studio-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const asset = this.assets.find((a) => a.id === btn.dataset.id);
        if (asset) this.openStudio(asset);
      });
    });

    this.assetsGrid.querySelectorAll(".copy-url-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const asset = this.assets.find((a) => a.id === btn.dataset.id);
        if (asset) {
          navigator.clipboard?.writeText(asset.url);
          this.showToast("Asset URL copied to clipboard!");
        }
      });
    });

    this.assetsGrid.querySelectorAll(".delete-asset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.deleteAsset(btn.dataset.id);
      });
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new PixelDropApp();
});
