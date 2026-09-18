/**
 * X / Twitter Web 2.0 Application Logic
 * Pure Vanilla JavaScript with LocalStorage Persistence
 */

const STORAGE_KEY_TWEETS = "recodex_twitter_tweets_v2";
const STORAGE_KEY_THEME = "recodex_twitter_theme_v2";

const DEFAULT_TWEETS = [
  {
    id: "tweet-1",
    author: "Dan Abramov",
    handle: "dan_abramov",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    verified: true,
    time: "2h",
    content: "The best feature of React is that you don't have to rethink your mental model every year. Build components, manage clean state, and keep UI declarative. What are you building this weekend? #react #javascript #webdev",
    image: null,
    likes: 342,
    retweets: 48,
    replies: 19,
    liked: false,
    retweeted: false,
    bookmarked: false,
    following: true,
  },
  {
    id: "tweet-2",
    author: "RecodeX Labs",
    handle: "recodex_io",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80",
    verified: true,
    time: "4h",
    content: "🚀 We just dropped the 50 Frontend Projects Suite v2.0! Full interactive terminal sandboxes, real-time code runner, and production-grade WebSockets. Try the live runner now: https://recodex.in/projects #webdev #frontend #typescript",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
    likes: 1208,
    retweets: 245,
    replies: 64,
    liked: true,
    retweeted: true,
    bookmarked: true,
    following: true,
  },
  {
    id: "tweet-3",
    author: "Guillermo Rauch",
    handle: "rauchg",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80",
    verified: true,
    time: "6h",
    content: "The web is getting faster. Edge computing + Server Components means sub-50ms latency across the globe. No cold starts, pure performance. #nextjs #edge #serverless",
    image: null,
    likes: 890,
    retweets: 112,
    replies: 38,
    liked: false,
    retweeted: false,
    bookmarked: false,
    following: false,
  },
  {
    id: "tweet-4",
    author: "Sarah Drasner",
    handle: "sarah_edo",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    verified: true,
    time: "10h",
    content: "Micro-animations should never feel like an afterthought. 150-200ms ease-out transitions make interfaces feel tangible and responsive. The human eye loves subtle fluid feedback. ✨ #ui #ux #design",
    image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
    likes: 654,
    retweets: 92,
    replies: 27,
    liked: false,
    retweeted: false,
    bookmarked: false,
    following: true,
  }
];

const TRENDS = [
  { category: "Technology · Trending", tag: "#RecodeX", tweets: "48.2K" },
  { category: "Web Development · Trending", tag: "#TypeScript", tweets: "92.6K" },
  { category: "Artificial Intelligence · Trending", tag: "Claude 3.7", tweets: "140K" },
  { category: "Design Systems · Trending", tag: "Tailwind vs CSS", tweets: "24.1K" },
  { category: "Programming · Trending", tag: "#CleanCode", tweets: "38.5K" }
];

const RECOMMENDED_USERS = [
  { name: "TypeScript", handle: "typescript", avatar: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=120&q=80" },
  { name: "Vite JS", handle: "vitejs", avatar: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=120&q=80" },
  { name: "CSS Tricks", handle: "css_tricks", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" }
];

class TwitterApp {
  constructor() {
    this.tweets = this.loadTweets();
    this.currentFilter = "for-you"; // 'for-you' | 'following'
    this.searchQuery = "";
    this.activeReplyParentId = null;

    this.initElements();
    this.initTheme();
    this.bindEvents();
    this.renderSidebarWidgets();
    this.renderFeed();
  }

  loadTweets() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TWEETS);
      return saved ? JSON.parse(saved) : DEFAULT_TWEETS;
    } catch {
      return DEFAULT_TWEETS;
    }
  }

  saveTweets() {
    localStorage.setItem(STORAGE_KEY_TWEETS, JSON.stringify(this.tweets));
  }

  initElements() {
    this.feedContainer = document.getElementById("tweets-feed");
    this.tweetInput = document.getElementById("tweet-input");
    this.submitBtn = document.getElementById("submit-tweet-btn");
    this.charCount = document.getElementById("char-count");
    this.imageContainer = document.getElementById("image-input-container");
    this.imageUrlInput = document.getElementById("tweet-image-url");
    this.imagePreview = document.getElementById("image-preview");
    this.clearImgBtn = document.getElementById("clear-image-btn");
    this.searchInput = document.getElementById("feed-search");
    this.clearSearchBtn = document.getElementById("clear-search");
    this.themeToggleBtn = document.getElementById("theme-toggle-btn");
    this.replyModal = document.getElementById("reply-modal");
    this.replyInput = document.getElementById("reply-input");
    this.submitReplyBtn = document.getElementById("submit-reply-btn");
    this.replyCharCount = document.getElementById("reply-char-count");
    this.toastEl = document.getElementById("toast");
  }

  initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const themes = ["dark", "dim", "light"];
    const next = themes[(themes.indexOf(current) + 1) % themes.length];
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY_THEME, next);
    this.showToast(`Theme switched to ${next.toUpperCase()}`);
  }

  bindEvents() {
    // Theme toggle
    this.themeToggleBtn?.addEventListener("click", () => this.toggleTheme());

    // Compose input changes
    this.tweetInput?.addEventListener("input", () => this.handleComposeInput());
    this.submitBtn?.addEventListener("click", () => this.createTweet());

    // Tools
    document.getElementById("tool-media")?.addEventListener("click", () => {
      this.imageContainer.classList.toggle("hidden");
      if (!this.imageContainer.classList.contains("hidden")) {
        this.imageUrlInput.focus();
      }
    });

    this.imageUrlInput?.addEventListener("input", (e) => {
      const url = e.target.value.trim();
      if (url) {
        this.imagePreview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.onerror=null; this.parentElement.classList.add('hidden');" />`;
        this.imagePreview.classList.remove("hidden");
      } else {
        this.imagePreview.classList.add("hidden");
      }
    });

    this.clearImgBtn?.addEventListener("click", () => {
      this.imageUrlInput.value = "";
      this.imagePreview.innerHTML = "";
      this.imagePreview.classList.add("hidden");
      this.imageContainer.classList.add("hidden");
    });

    document.getElementById("tool-emoji")?.addEventListener("click", () => {
      const emojis = ["🔥", "✨", "🚀", "💡", "💯", "⚡"];
      const random = emojis[Math.floor(Math.random() * emojis.length)];
      this.tweetInput.value += random;
      this.handleComposeInput();
    });

    document.getElementById("tool-tag")?.addEventListener("click", () => {
      this.tweetInput.value += " #tech";
      this.handleComposeInput();
    });

    // Quick Post in Sidebar
    document.getElementById("quick-post-btn")?.addEventListener("click", () => {
      this.tweetInput.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Tab filter (For you vs Following)
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
        this.currentFilter = e.target.dataset.filter;
        this.renderFeed();
      });
    });

    // Search filter
    this.searchInput?.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.clearSearchBtn.classList.toggle("hidden", !this.searchQuery);
      this.renderFeed();
    });

    this.clearSearchBtn?.addEventListener("click", () => {
      this.searchInput.value = "";
      this.searchQuery = "";
      this.clearSearchBtn.classList.add("hidden");
      this.renderFeed();
    });

    // Reply modal events
    document.getElementById("close-reply-modal")?.addEventListener("click", () => {
      this.closeReplyModal();
    });

    this.replyInput?.addEventListener("input", () => {
      const remaining = 280 - this.replyInput.value.length;
      this.replyCharCount.textContent = remaining;
      this.submitReplyBtn.disabled = !this.replyInput.value.trim();
    });

    this.submitReplyBtn?.addEventListener("click", () => this.submitReply());
  }

  handleComposeInput() {
    const val = this.tweetInput.value;
    const remaining = 280 - val.length;
    this.charCount.textContent = remaining;

    this.charCount.className = "char-count";
    if (remaining < 20) this.charCount.classList.add("danger");
    else if (remaining < 50) this.charCount.classList.add("warning");

    this.submitBtn.disabled = val.trim().length === 0;
  }

  createTweet() {
    const text = this.tweetInput.value.trim();
    if (!text) return;

    const imageUrl = this.imageUrlInput.value.trim();

    const newTweet = {
      id: `tweet-${Date.now()}`,
      author: "Alex Rivera",
      handle: "alex_dev",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
      verified: true,
      time: "Just now",
      content: text,
      image: imageUrl || null,
      likes: 0,
      retweets: 0,
      replies: 0,
      liked: false,
      retweeted: false,
      bookmarked: false,
      following: true,
      isOwn: true,
    };

    this.tweets.unshift(newTweet);
    this.saveTweets();

    // Reset compose
    this.tweetInput.value = "";
    this.imageUrlInput.value = "";
    this.imagePreview.innerHTML = "";
    this.imagePreview.classList.add("hidden");
    this.imageContainer.classList.add("hidden");
    this.handleComposeInput();

    this.renderFeed();
    this.showToast("Your post was sent!");
  }

  toggleLike(id) {
    const tweet = this.tweets.find((t) => t.id === id);
    if (!tweet) return;

    tweet.liked = !tweet.liked;
    tweet.likes += tweet.liked ? 1 : -1;
    this.saveTweets();
    this.renderFeed();
  }

  toggleRetweet(id) {
    const tweet = this.tweets.find((t) => t.id === id);
    if (!tweet) return;

    tweet.retweeted = !tweet.retweeted;
    tweet.retweets += tweet.retweeted ? 1 : -1;
    this.saveTweets();
    this.renderFeed();
    this.showToast(tweet.retweeted ? "Reposted" : "Repost undone");
  }

  toggleBookmark(id) {
    const tweet = this.tweets.find((t) => t.id === id);
    if (!tweet) return;

    tweet.bookmarked = !tweet.bookmarked;
    this.saveTweets();
    this.renderFeed();
    this.showToast(tweet.bookmarked ? "Saved to Bookmarks" : "Removed from Bookmarks");
  }

  deleteTweet(id) {
    this.tweets = this.tweets.filter((t) => t.id !== id);
    this.saveTweets();
    this.renderFeed();
    this.showToast("Post deleted");
  }

  openReplyModal(id) {
    const tweet = this.tweets.find((t) => t.id === id);
    if (!tweet) return;

    this.activeReplyParentId = id;
    const parentContainer = document.getElementById("reply-parent-tweet");
    parentContainer.innerHTML = `
      <div style="font-weight: 700; color: var(--text-primary);">${tweet.author} <span style="font-weight: 400; color: var(--text-secondary);">@${tweet.handle}</span></div>
      <p style="margin-top: 4px;">${this.formatContent(tweet.content)}</p>
    `;

    this.replyInput.value = "";
    this.replyCharCount.textContent = "280";
    this.submitReplyBtn.disabled = true;
    this.replyModal.classList.remove("hidden");
    this.replyInput.focus();
  }

  closeReplyModal() {
    this.replyModal.classList.add("hidden");
    this.activeReplyParentId = null;
  }

  submitReply() {
    const replyText = this.replyInput.value.trim();
    if (!replyText || !this.activeReplyParentId) return;

    const parent = this.tweets.find((t) => t.id === this.activeReplyParentId);
    if (parent) {
      parent.replies += 1;
    }

    // Also add as a new tweet referencing the conversation
    const newTweet = {
      id: `tweet-${Date.now()}`,
      author: "Alex Rivera",
      handle: "alex_dev",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
      verified: true,
      time: "Just now",
      content: `Replying to @${parent ? parent.handle : 'user'}: ${replyText}`,
      image: null,
      likes: 0,
      retweets: 0,
      replies: 0,
      liked: false,
      retweeted: false,
      bookmarked: false,
      following: true,
      isOwn: true,
    };

    this.tweets.unshift(newTweet);
    this.saveTweets();
    this.closeReplyModal();
    this.renderFeed();
    this.showToast("Reply posted!");
  }

  formatContent(text) {
    // Highlight #hashtags, @mentions, and URLs
    return text
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="highlight-tag">$1</a>')
      .replace(/#(\w+)/g, '<a href="#" class="highlight-tag">#$1</a>')
      .replace(/@(\w+)/g, '<a href="#" class="highlight-tag">@$1</a>');
  }

  showToast(message) {
    if (!this.toastEl) return;
    this.toastEl.textContent = message;
    this.toastEl.classList.remove("hidden");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.add("hidden");
    }, 2500);
  }

  renderFeed() {
    let list = [...this.tweets];

    // Tab filter
    if (this.currentFilter === "following") {
      list = list.filter((t) => t.following || t.isOwn);
    }

    // Search filter
    if (this.searchQuery) {
      list = list.filter(
        (t) =>
          t.content.toLowerCase().includes(this.searchQuery) ||
          t.author.toLowerCase().includes(this.searchQuery) ||
          t.handle.toLowerCase().includes(this.searchQuery)
      );
    }

    if (list.length === 0) {
      this.feedContainer.innerHTML = `
        <div style="text-align: center; padding: 48px 20px; color: var(--text-secondary);">
          <svg style="width: 48px; height: 48px; fill: currentColor; margin-bottom: 12px;" viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
          <h3 style="color: var(--text-primary); font-size: 18px; font-weight: 700;">No posts found</h3>
          <p style="font-size: 14px; margin-top: 6px;">Try adjusting your search terms or filter.</p>
        </div>
      `;
      return;
    }

    this.feedContainer.innerHTML = list
      .map((t) => {
        return `
        <article class="tweet-card" data-id="${t.id}">
          <img src="${t.avatar}" alt="${t.author}" class="tweet-author-avatar" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'" />
          
          <div class="tweet-content-col">
            <div class="tweet-header-row">
              <span class="tweet-name">${t.author}</span>
              ${t.verified ? `<svg class="verified-badge" viewBox="0 0 24 24"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6c-1.58 0-2.95.875-3.6 2.148-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.575 9.55.7 10.92.7 12.5c0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238 1.04 1.263 2.41 2.138 3.99 2.138 1.58 0 2.95-.875 3.6-2.148.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.263-1.04 2.138-2.41 2.138-3.99zm-12.28 4.28l-3.5-3.5 1.41-1.41 2.09 2.08 5.79-5.79 1.41 1.41-7.2 7.21z"/></svg>` : ""}
              <span class="tweet-handle">@${t.handle}</span>
              <span class="tweet-dot">·</span>
              <span class="tweet-time">${t.time}</span>

              ${t.isOwn ? `
                <button class="tweet-menu-btn delete-tweet-trigger" title="Delete Post" data-id="${t.id}">
                  <svg viewBox="0 0 24 24"><path d="M16 6V4.5C16 3.12 14.88 2 13.5 2h-3C9.12 2 8 3.12 8 4.5V6H3v2h1.06l.81 12.16C4.94 21.32 5.86 22 7 22h10c1.14 0 2.06-.68 2.13-1.84L19.94 8H21V6h-5zm-6-1.5c0-.28.22-.5.5-.5h3c.28 0 .5.22.5.5V6h-4V4.5zm7.13 15.63c-.02.4-.33.87-.63.87H7.5c-.3 0-.61-.47-.63-.87L6.07 8h11.86l-.8 12.13z"/></svg>
                </button>
              ` : `
                <button class="tweet-menu-btn share-link-trigger" title="Copy Link" data-id="${t.id}">
                  <svg viewBox="0 0 24 24"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
                </button>
              `}
            </div>

            <div class="tweet-text">${this.formatContent(t.content)}</div>

            ${t.image ? `<div class="tweet-media"><img src="${t.image}" alt="Media" loading="lazy" /></div>` : ""}

            <div class="tweet-actions-row">
              <button class="action-btn action-reply reply-trigger" data-id="${t.id}">
                <svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.24c-4.42 0-8.01-3.58-8.01-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.32 2.688 6.01 6.005 6.01h2.24v2.32l4.984-2.76c2.016-1.11 3.27-3.23 3.27-5.54 0-3.38-2.748-6.13-6.129-6.13H9.756z"/></svg>
                <span>${t.replies || ""}</span>
              </button>

              <button class="action-btn action-retweet ${t.retweeted ? 'active' : ''} retweet-trigger" data-id="${t.id}">
                <svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 20.12l-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14z"/></svg>
                <span>${t.retweets || ""}</span>
              </button>

              <button class="action-btn action-like ${t.liked ? 'active' : ''} like-trigger" data-id="${t.id}">
                <svg viewBox="0 0 24 24"><path d="${t.liked ? 'M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 4.29 1.571 4.647 3.656.357-2.085 2.357-3.656 4.647-3.656 2.878 0 5.403 2.69 5.403 5.754 0 6.376-7.454 13.11-10.037 13.157H12z' : 'M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-2.427.13-4.355 2.2-4.355 4.8 0 4.4 5.7 9.8 9.05 11.2 3.35-1.4 9.05-6.8 9.05-11.2 0-2.6-1.928-4.67-4.356-4.8zM12 22.8c-.2 0-.4-.1-.6-.2-4.1-1.8-10.4-7.8-10.4-12.9 0-3.7 2.8-6.7 6.5-6.9 1.8-.1 3.5.7 4.5 2 1-1.3 2.7-2.1 4.5-2 3.7.2 6.5 3.2 6.5 6.9 0 5.1-6.3 11.1-10.4 12.9-.2.1-.4.2-.6.2z'}"/></svg>
                <span>${t.likes || ""}</span>
              </button>

              <button class="action-btn action-bookmark ${t.bookmarked ? 'active' : ''} bookmark-trigger" data-id="${t.id}">
                <svg viewBox="0 0 24 24"><path d="${t.bookmarked ? 'M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v17.91l-7.447-4.25-7.553 4.25V4.5z' : 'M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v17.91l-7.447-4.25-7.553 4.25V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.47l5.447-3.07 5.553 3.07V4.5c0-.28-.224-.5-.5-.5h-11z'}"/></svg>
              </button>

              <button class="action-btn action-share share-trigger" data-id="${t.id}">
                <svg viewBox="0 0 24 24"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41L7.71 9.71 6.3 8.29 12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21.01 3 19.9 3 18.51V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"/></svg>
              </button>
            </div>
          </div>
        </article>
      `;
      })
      .join("");

    // Attach card event listeners
    this.feedContainer.querySelectorAll(".like-trigger").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleLike(el.dataset.id);
      });
    });

    this.feedContainer.querySelectorAll(".retweet-trigger").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleRetweet(el.dataset.id);
      });
    });

    this.feedContainer.querySelectorAll(".bookmark-trigger").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleBookmark(el.dataset.id);
      });
    });

    this.feedContainer.querySelectorAll(".reply-trigger").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        this.openReplyModal(el.dataset.id);
      });
    });

    this.feedContainer.querySelectorAll(".share-trigger").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(window.location.href);
        this.showToast("Link copied to clipboard");
      });
    });

    this.feedContainer.querySelectorAll(".delete-tweet-trigger").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm("Delete this post?")) {
          this.deleteTweet(el.dataset.id);
        }
      });
    });
  }

  renderSidebarWidgets() {
    // Trends
    const trendList = document.getElementById("trend-list");
    if (trendList) {
      trendList.innerHTML = TRENDS.map(
        (t) => `
        <div class="trend-item" data-tag="${t.tag}">
          <span class="trend-category">${t.category}</span>
          <span class="trend-tag">${t.tag}</span>
          <span class="trend-tweets">${t.tweets} posts</span>
        </div>
      `
      ).join("");

      trendList.querySelectorAll(".trend-item").forEach((el) => {
        el.addEventListener("click", () => {
          const tag = el.dataset.tag.replace("#", "");
          this.searchInput.value = tag;
          this.searchQuery = tag.toLowerCase();
          this.clearSearchBtn.classList.remove("hidden");
          this.renderFeed();
          this.showToast(`Filtered by ${el.dataset.tag}`);
        });
      });
    }

    // Follow list
    const followList = document.getElementById("follow-list");
    if (followList) {
      followList.innerHTML = RECOMMENDED_USERS.map(
        (u) => `
        <div class="follow-item">
          <div class="follow-user">
            <img src="${u.avatar}" alt="${u.name}" class="follow-avatar" />
            <div class="follow-meta">
              <span class="follow-name">${u.name}</span>
              <span class="follow-handle">@${u.handle}</span>
            </div>
          </div>
          <button class="follow-btn">Follow</button>
        </div>
      `
      ).join("");

      followList.querySelectorAll(".follow-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const isFollowing = btn.classList.toggle("following");
          btn.textContent = isFollowing ? "Following" : "Follow";
        });
      });
    }
  }
}

// Initialize when DOM ready
document.addEventListener("DOMContentLoaded", () => {
  new TwitterApp();
});
