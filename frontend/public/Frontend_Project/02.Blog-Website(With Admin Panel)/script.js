/**
 * DevPulse CMS — Blog Platform & Publishing Studio
 * Vanilla JavaScript with LocalStorage Persistence
 */

const STORAGE_KEY_POSTS = "recodex_devpulse_posts_v2";
const STORAGE_KEY_THEME = "recodex_devpulse_theme_v2";

const INITIAL_POSTS = [
  {
    id: "post-1",
    title: "Designing High-Concurrency WebSockets in TypeScript",
    excerpt: "Learn how modern event-driven architectures maintain millions of persistent real-time connections with low memory footprints.",
    content: `Building scalable real-time systems has shifted dramatically with modern runtime environments. When architecting WebSocket relays for thousands of concurrent users, memory per connection and zero-copy broadcasting are the primary bottlenecks.

In this deep dive, we explore how to optimize socket heartbeat protocols, implement backpressure management buffers, and cluster socket servers horizontally using Redis Pub/Sub backplanes.

Key Takeaways:
1. Prefer typed binary frames or compact JSON payloads over verbose messaging formats.
2. Implement adaptive heartbeat ping intervals to avoid waking battery-constrained mobile radios unnecessarily.
3. Decouple connection management from message routing pipelines.`,
    category: "Engineering",
    readTime: "6 min read",
    author: "Veeresh H P",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    status: "Published",
    date: "Sep 15, 2026",
    likes: 184,
    reads: "4.2K",
    comments: [
      { author: "Dev_Lead", text: "The advice on backpressure buffering solved our socket connection dropping issue during peak hours. Great post!" },
      { author: "Priya Sharma", text: "Clear and concise explanation of socket clustering!" }
    ]
  },
  {
    id: "post-2",
    title: "The Evolution of Modern CSS: Container Queries & Fluid Layouts",
    excerpt: "Say goodbye to rigid breakpoint media queries. How container queries and clamp() enable truly modular component styling.",
    content: `For over a decade, responsive web design relied on viewport dimensions to restructure interfaces. However, components in modern component-driven libraries shouldn't care about the browser viewport—they should adapt based on their parent container's available width.

Container queries (@container) combined with CSS custom properties and math functions (clamp, min, max) allow components to be genuinely portable across card grids, slide drawers, and full-screen views without duplicate CSS classes.`,
    category: "WebDev",
    readTime: "4 min read",
    author: "Elena Rostova",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    coverImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80",
    status: "Published",
    date: "Sep 12, 2026",
    likes: 242,
    reads: "6.8K",
    comments: [
      { author: "Alex K", text: "Container queries are game-changing for design systems." }
    ]
  },
  {
    id: "post-3",
    title: "Agentic AI Workflows: Beyond Simple Chat Prompts",
    excerpt: "How autonomous tool-calling agents and structured reflection loops are transforming automated software engineering.",
    content: `Large language models have evolved from autocomplete chatbots into agentic systems capable of breaking down complex software objectives into testable steps, invoking tools, interpreting shell execution outputs, and self-correcting upon errors.

We explore the architecture of planning modes, deterministic verification loops, and context minimization strategies that prevent agent drift during long-horizon tasks.`,
    category: "AI & ML",
    readTime: "8 min read",
    author: "Dr. Marcus Vance",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    status: "Published",
    date: "Sep 8, 2026",
    likes: 419,
    reads: "11.2K",
    comments: []
  },
  {
    id: "post-4",
    title: "Zero-Downtime Microservice Migrations with Canary Routing",
    excerpt: "Best practices for canary traffic shifting, automated rollback triggers, and multi-region database replication.",
    content: `Deploying breaking database schema adjustments or foundational protocol upgrades requires methodical traffic ramp-up. Utilizing service mesh gateways to direct 1% of live canary requests while actively evaluating error budgets guarantees rapid recovery before user disruption occurs.`,
    category: "Cloud",
    readTime: "5 min read",
    author: "Veeresh H P",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    status: "Published",
    date: "Aug 29, 2026",
    likes: 112,
    reads: "3.1K",
    comments: []
  }
];

class DevPulseApp {
  constructor() {
    this.posts = this.loadPosts();
    this.activeCategory = "All";
    this.searchQuery = "";
    this.currentView = "reader"; // 'reader' | 'admin'
    this.activeArticle = null;
    this.editingPostId = null;

    this.initElements();
    this.initTheme();
    this.bindEvents();
    this.render();
  }

  loadPosts() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POSTS);
      return saved ? JSON.parse(saved) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  }

  savePosts() {
    localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(this.posts));
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

  showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove("hidden");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.add("hidden");
    }, 2400);
  }

  initElements() {
    this.readerView = document.getElementById("reader-view");
    this.adminView = document.getElementById("admin-view");
    this.viewReaderBtn = document.getElementById("view-reader-btn");
    this.viewAdminBtn = document.getElementById("view-admin-btn");
    this.themeToggleBtn = document.getElementById("theme-toggle");

    this.heroBanner = document.getElementById("hero-banner");
    this.articlesGrid = document.getElementById("articles-grid");
    this.searchInput = document.getElementById("article-search");
    this.categoryPills = document.getElementById("category-pills");

    // Modal
    this.articleModal = document.getElementById("article-modal");
    this.articleModalContent = document.getElementById("article-modal-content");
    this.closeArticleModalBtn = document.getElementById("close-article-modal");

    // Admin Form
    this.postForm = document.getElementById("post-form");
    this.formTitle = document.getElementById("form-title");
    this.postIdInput = document.getElementById("post-id");
    this.titleInput = document.getElementById("post-title");
    this.categoryInput = document.getElementById("post-category");
    this.readtimeInput = document.getElementById("post-readtime");
    this.imageInput = document.getElementById("post-image");
    this.imgPreview = document.getElementById("form-img-preview");
    this.excerptInput = document.getElementById("post-excerpt");
    this.contentInput = document.getElementById("post-content");
    this.statusInput = document.getElementById("post-status");
    this.authorInput = document.getElementById("post-author");
    this.cancelEditBtn = document.getElementById("cancel-edit-btn");
    this.postsTableBody = document.getElementById("posts-table-body");
  }

  bindEvents() {
    // Theme toggle
    this.themeToggleBtn?.addEventListener("click", () => this.toggleTheme());

    // Switch View
    this.viewReaderBtn?.addEventListener("click", () => this.switchView("reader"));
    this.viewAdminBtn?.addEventListener("click", () => this.switchView("admin"));

    // Category Filter
    this.categoryPills?.querySelectorAll(".cat-pill").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.categoryPills.querySelectorAll(".cat-pill").forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
        this.activeCategory = e.target.dataset.cat;
        this.renderReaderArticles();
      });
    });

    // Search Input
    this.searchInput?.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.renderReaderArticles();
    });

    // Modal Close
    this.closeArticleModalBtn?.addEventListener("click", () => {
      this.articleModal.classList.add("hidden");
      this.activeArticle = null;
    });

    // Form Image Preview
    this.imageInput?.addEventListener("input", (e) => {
      const url = e.target.value.trim();
      if (url) {
        this.imgPreview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentElement.classList.add('hidden')" />`;
        this.imgPreview.classList.remove("hidden");
      } else {
        this.imgPreview.classList.add("hidden");
      }
    });

    // Form Submit (Create or Update)
    this.postForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveFormArticle();
    });

    // Cancel Edit
    this.cancelEditBtn?.addEventListener("click", () => {
      this.resetForm();
    });
  }

  switchView(view) {
    this.currentView = view;
    if (view === "reader") {
      this.readerView.classList.remove("hidden");
      this.adminView.classList.add("hidden");
      this.viewReaderBtn.classList.add("active");
      this.viewAdminBtn.classList.remove("active");
      this.renderReaderArticles();
    } else {
      this.readerView.classList.add("hidden");
      this.adminView.classList.remove("hidden");
      this.viewReaderBtn.classList.remove("active");
      this.viewAdminBtn.classList.add("active");
      this.renderAdminOverview();
    }
  }

  saveFormArticle() {
    const title = this.titleInput.value.trim();
    const excerpt = this.excerptInput.value.trim();
    const content = this.contentInput.value.trim();
    const category = this.categoryInput.value;
    const readTime = this.readtimeInput.value.trim() || "5 min read";
    const coverImage = this.imageInput.value.trim() || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80";
    const status = this.statusInput.value;
    const author = this.authorInput.value.trim() || "Veeresh H P";

    if (this.editingPostId) {
      // Update existing
      const post = this.posts.find((p) => p.id === this.editingPostId);
      if (post) {
        post.title = title;
        post.excerpt = excerpt;
        post.content = content;
        post.category = category;
        post.readTime = readTime;
        post.coverImage = coverImage;
        post.status = status;
        post.author = author;
      }
      this.showToast("Article updated successfully!");
    } else {
      // Create new
      const newPost = {
        id: `post-${Date.now()}`,
        title,
        excerpt,
        content,
        category,
        readTime,
        author,
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        coverImage,
        status,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        likes: 0,
        reads: "1",
        comments: [],
      };
      this.posts.unshift(newPost);
      this.showToast("Article published successfully!");
    }

    this.savePosts();
    this.resetForm();
    this.renderAdminOverview();
  }

  resetForm() {
    this.editingPostId = null;
    this.postForm.reset();
    this.formTitle.textContent = "Compose New Article";
    this.cancelEditBtn.classList.add("hidden");
    this.imgPreview.classList.add("hidden");
    document.getElementById("save-post-btn").textContent = "Publish Article";
  }

  startEdit(id) {
    const post = this.posts.find((p) => p.id === id);
    if (!post) return;

    this.editingPostId = id;
    this.formTitle.textContent = "Edit Article";
    this.titleInput.value = post.title;
    this.categoryInput.value = post.category;
    this.readtimeInput.value = post.readTime;
    this.imageInput.value = post.coverImage;
    this.excerptInput.value = post.excerpt;
    this.contentInput.value = post.content;
    this.statusInput.value = post.status;
    this.authorInput.value = post.author;

    if (post.coverImage) {
      this.imgPreview.innerHTML = `<img src="${post.coverImage}" alt="Preview" />`;
      this.imgPreview.classList.remove("hidden");
    }

    this.cancelEditBtn.classList.remove("hidden");
    document.getElementById("save-post-btn").textContent = "Save Changes";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  deletePost(id) {
    if (confirm("Are you sure you want to delete this article?")) {
      this.posts = this.posts.filter((p) => p.id !== id);
      this.savePosts();
      this.renderAdminOverview();
      this.showToast("Article deleted");
    }
  }

  openArticleModal(post) {
    this.activeArticle = post;
    // increment reads
    post.reads = post.reads ? (parseInt(post.reads) || 10) + 1 : 1;
    this.savePosts();

    this.articleModalContent.innerHTML = `
      <img src="${post.coverImage}" alt="${post.title}" class="full-article-cover" onerror="this.src='https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200'" />
      <span class="cat-tag">${post.category}</span>
      <h1 class="full-article-title">${post.title}</h1>
      <div class="full-article-meta">
        <span class="author-pill">
          <img src="${post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}" class="author-avatar" />
          ${post.author}
        </span>
        <span>·</span>
        <span>${post.date}</span>
        <span>·</span>
        <span>${post.readTime}</span>
      </div>
      <div class="full-article-body">${post.content}</div>

      <!-- Comments Section -->
      <div class="comments-section">
        <h4 class="comments-heading">Discussion (${post.comments?.length || 0})</h4>
        
        <div class="comment-input-row">
          <input type="text" id="comment-text-input" placeholder="Join the discussion... write a comment" />
          <button id="add-comment-btn" class="btn btn-primary" style="padding: 8px 16px;">Post</button>
        </div>

        <div id="comments-container">
          ${(post.comments || [])
            .map(
              (c) => `
            <div class="comment-card">
              <span class="comment-author">${c.author}</span>
              <p class="comment-text">${c.text}</p>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    document.getElementById("add-comment-btn")?.addEventListener("click", () => {
      const input = document.getElementById("comment-text-input");
      const txt = input.value.trim();
      if (!txt) return;

      if (!post.comments) post.comments = [];
      post.comments.push({ author: "You (Developer)", text: txt });
      this.savePosts();
      input.value = "";
      this.openArticleModal(post); // re-render
      this.showToast("Comment posted!");
    });

    this.articleModal.classList.remove("hidden");
  }

  render() {
    this.renderReaderArticles();
    this.renderAdminOverview();
  }

  renderReaderArticles() {
    let list = this.posts.filter((p) => p.status === "Published");

    if (this.activeCategory !== "All") {
      list = list.filter((p) => p.category === this.activeCategory);
    }

    if (this.searchQuery) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(this.searchQuery) ||
          p.excerpt.toLowerCase().includes(this.searchQuery) ||
          p.category.toLowerCase().includes(this.searchQuery) ||
          p.author.toLowerCase().includes(this.searchQuery)
      );
    }

    // Hero article (first published article)
    const featured = list[0];
    if (featured && !this.searchQuery && this.activeCategory === "All") {
      this.heroBanner.classList.remove("hidden");
      this.heroBanner.innerHTML = `
        <div class="hero-img-col">
          <img src="${featured.coverImage}" alt="${featured.title}" onerror="this.src='https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200'" />
        </div>
        <div class="hero-content-col">
          <span class="cat-tag">${featured.category} · Featured Story</span>
          <h2 class="hero-title">${featured.title}</h2>
          <p class="hero-excerpt">${featured.excerpt}</p>
          <div class="meta-row">
            <span class="author-pill">
              <img src="${featured.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}" class="author-avatar" />
              ${featured.author}
            </span>
            <span>·</span>
            <span>${featured.date}</span>
            <span>·</span>
            <span>${featured.readTime}</span>
          </div>
        </div>
      `;
      this.heroBanner.onclick = () => this.openArticleModal(featured);
    } else {
      this.heroBanner.classList.add("hidden");
    }

    // Grid Articles
    if (list.length === 0) {
      this.articlesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <h3>No matching articles found</h3>
          <p style="margin-top: 6px;">Try adjusting your search queries or category filters.</p>
        </div>
      `;
      return;
    }

    this.articlesGrid.innerHTML = list
      .map((p) => {
        return `
        <article class="article-card" data-id="${p.id}">
          <div class="card-img-wrapper">
            <img src="${p.coverImage}" alt="${p.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600'" />
            <span class="card-category-badge">${p.category}</span>
          </div>
          <div class="card-body">
            <h3 class="card-title">${p.title}</h3>
            <p class="card-excerpt">${p.excerpt}</p>
            <div class="card-footer">
              <span class="author-pill">
                <img src="${p.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}" class="author-avatar" />
                ${p.author}
              </span>
              <button class="card-likes-btn like-trigger" data-id="${p.id}" title="Clap / Like">
                <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                <span>${p.likes || 0}</span>
              </button>
            </div>
          </div>
        </article>
      `;
      })
      .join("");

    this.articlesGrid.querySelectorAll(".article-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".like-trigger")) {
          e.stopPropagation();
          const p = this.posts.find((item) => item.id === card.dataset.id);
          if (p) {
            p.likes = (p.likes || 0) + 1;
            this.savePosts();
            this.renderReaderArticles();
          }
          return;
        }
        const p = this.posts.find((item) => item.id === card.dataset.id);
        if (p) this.openArticleModal(p);
      });
    });
  }

  renderAdminOverview() {
    const total = this.posts.length;
    const published = this.posts.filter((p) => p.status === "Published").length;
    const drafts = total - published;

    document.getElementById("metric-total").textContent = total;
    document.getElementById("metric-published").textContent = published;
    document.getElementById("metric-drafts").textContent = drafts;

    if (!this.postsTableBody) return;

    this.postsTableBody.innerHTML = this.posts
      .map(
        (p) => `
      <tr>
        <td>
          <div class="post-table-info">
            <img src="${p.coverImage}" alt="${p.title}" class="post-table-thumb" onerror="this.src='https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100'" />
            <div>
              <strong>${p.title}</strong>
              <div style="font-size: 11px; color: var(--text-muted);">${p.date} · ${p.author}</div>
            </div>
          </div>
        </td>
        <td><span class="cat-tag">${p.category}</span></td>
        <td>
          <span class="table-status-badge ${p.status === 'Published' ? 'status-published' : 'status-draft'}">
            ${p.status}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <button class="action-icon-btn edit-post-btn" data-id="${p.id}" title="Edit">Edit</button>
            <button class="action-icon-btn delete-act delete-post-btn" data-id="${p.id}" title="Delete">Delete</button>
          </div>
        </td>
      </tr>
    `
      )
      .join("");

    this.postsTableBody.querySelectorAll(".edit-post-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.startEdit(btn.dataset.id));
    });

    this.postsTableBody.querySelectorAll(".delete-post-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.deletePost(btn.dataset.id));
    });
  }
}

// Global initialization
document.addEventListener("DOMContentLoaded", () => {
  window.devPulseApp = new DevPulseApp();
});
