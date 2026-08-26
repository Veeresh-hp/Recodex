export interface Project {
  id: string;
  dir?: string;
  title: string;
  description: string;
  longDescription: string;
  status: "Active" | "Maintenance" | "Beta";
  image: string;
  category: "Web Apps & Tools" | "Games" | "Landing Pages & Portfolios" | "Utilities" | string;
  tags: string[];
  devsCount: number;
  stars: number;
  forks: number;
  files?: Record<string, string>;
}

export const MOCK_PROJECTS: Project[] = [
  {
    "id": "01-company-portfolio",
    "dir": "01.Company-Portfolio",
    "title": "Company Portfolio",
    "description": "A sleek, modern corporate portfolio website with multi-page navigation, service offerings, and interactive pricing tables.",
    "longDescription": "A sleek, modern corporate portfolio website with multi-page navigation, service offerings, and interactive pricing tables. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
    "category": "Landing Pages & Portfolios",
    "tags": [
      "HTML5",
      "CSS3",
      "JAVASCRIPT",
      "BOOTSTRAP"
    ],
    "devsCount": 8,
    "stars": 18,
    "forks": 7
  },
  {
    "id": "02-blog-website",
    "dir": "02.Blog-Website(With Admin Panel)",
    "title": "Blog Website (With Admin Panel)",
    "description": "A feature-rich blogging platform equipped with a full administrative panel for managing posts, categories, and media.",
    "longDescription": "A feature-rich blogging platform equipped with a full administrative panel for managing posts, categories, and media. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80",
    "category": "Landing Pages & Portfolios",
    "tags": [
      "HTML5",
      "CSS3",
      "JAVASCRIPT",
      "ADMIN"
    ],
    "devsCount": 15,
    "stars": 25,
    "forks": 12
  },
  {
    "id": "03-e-book-site",
    "dir": "03.E-Book Site",
    "title": "E-Book Digital Store",
    "description": "Digital book showcase and landing site featuring chapter previews, reader reviews, and instant download triggers.",
    "longDescription": "Digital book showcase and landing site featuring chapter previews, reader reviews, and instant download triggers. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    "category": "Landing Pages & Portfolios",
    "tags": [
      "HTML5",
      "CSS3",
      "JAVASCRIPT",
      "EBOOK"
    ],
    "devsCount": 22,
    "stars": 32,
    "forks": 17
  },
  {
    "id": "04-ecommerce-site",
    "dir": "04.Ecommerce-site",
    "title": "E-Commerce Marketplace",
    "description": "Responsive online shopping storefront with product filtering, dynamic cart calculations, and checkout modal.",
    "longDescription": "Responsive online shopping storefront with product filtering, dynamic cart calculations, and checkout modal. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=600&q=80",
    "category": "Landing Pages & Portfolios",
    "tags": [
      "HTML5",
      "CSS3",
      "JAVASCRIPT",
      "CART"
    ],
    "devsCount": 29,
    "stars": 39,
    "forks": 22
  },
  {
    "id": "05-restaurant-website",
    "dir": "05.Restaurant Website",
    "title": "Gourmet Restaurant Website",
    "description": "Elegant culinary website featuring digital menus, chef specials showcase, and online table reservation forms.",
    "longDescription": "Elegant culinary website featuring digital menus, chef specials showcase, and online table reservation forms. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
    "category": "Landing Pages & Portfolios",
    "tags": [
      "HTML5",
      "CSS3",
      "JAVASCRIPT",
      "RESERVATION"
    ],
    "devsCount": 36,
    "stars": 46,
    "forks": 27
  },
  {
    "id": "06-hotel-website",
    "dir": "06.Hotel Website",
    "title": "Luxury Hotel & Resort",
    "description": "Hospitality website showcasing room suites, amenity virtual tours, date pickers, and room booking engine.",
    "longDescription": "Hospitality website showcasing room suites, amenity virtual tours, date pickers, and room booking engine. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
    "category": "Landing Pages & Portfolios",
    "tags": [
      "HTML5",
      "CSS3",
      "JAVASCRIPT",
      "BOOKING"
    ],
    "devsCount": 43,
    "stars": 19,
    "forks": 32
  },
  {
    "id": "07-photography-portfolio",
    "dir": "07.Photography Portfolio Website",
    "title": "Photography Gallery",
    "description": "High-resolution photographer showcase with masonry layout grids, category tags, and full-screen lightbox viewing.",
    "longDescription": "High-resolution photographer showcase with masonry layout grids, category tags, and full-screen lightbox viewing. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=600&q=80",
    "category": "Landing Pages & Portfolios",
    "tags": [
      "HTML5",
      "CSS3",
      "JAVASCRIPT",
      "LIGHTBOX"
    ],
    "devsCount": 50,
    "stars": 26,
    "forks": 37
  },
  {
    "id": "08-fitness-website",
    "dir": "08.Fitness Website",
    "title": "Fitness Gym & Club",
    "description": "High-energy health club portal offering workout schedule calculators, trainer bios, and membership plan cards.",
    "longDescription": "High-energy health club portal offering workout schedule calculators, trainer bios, and membership plan cards. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80",
    "category": "Landing Pages & Portfolios",
    "tags": [
      "HTML5",
      "CSS3",
      "JAVASCRIPT",
      "HEALTH"
    ],
    "devsCount": 57,
    "stars": 33,
    "forks": 42
  },
  {
    "id": "09-password-generator",
    "dir": "09.Password Generator",
    "title": "Secure Password Generator",
    "description": "Cryptographic password creation app with configurable length, character sets, strength indicator, and copy-to-clipboard.",
    "longDescription": "Cryptographic password creation app with configurable length, character sets, strength indicator, and copy-to-clipboard. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "JAVASCRIPT",
      "CRYPTO",
      "UTILITY"
    ],
    "devsCount": 64,
    "stars": 40,
    "forks": 7
  },
  {
    "id": "10-qr-code-reader",
    "dir": "10.QR code Reader",
    "title": "QR Code Reader & Generator",
    "description": "Browser QR scanning and generator tool capable of encoding text, URLs, and Wi-Fi credentials instantly.",
    "longDescription": "Browser QR scanning and generator tool capable of encoding text, URLs, and Wi-Fi credentials instantly. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "JAVASCRIPT",
      "API",
      "SCANNER"
    ],
    "devsCount": 71,
    "stars": 47,
    "forks": 12
  },
  {
    "id": "11-weather-app",
    "dir": "11.Weather App",
    "title": "Real-Time Weather Forecast",
    "description": "Global meteorology dashboard rendering temperature metrics, humidity levels, wind vectors, and animated weather icons.",
    "longDescription": "Global meteorology dashboard rendering temperature metrics, humidity levels, wind vectors, and animated weather icons. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1592210454359-9043f067919b?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "JAVASCRIPT",
      "FETCH_API",
      "WEATHER"
    ],
    "devsCount": 78,
    "stars": 20,
    "forks": 17
  },
  {
    "id": "12-tic-tac-toe",
    "dir": "12.Tic-tac-toe Game",
    "title": "Tic-Tac-Toe Arcade",
    "description": "Classic two-player & AI Tic-Tac-Toe game complete with win animations, score tracking, and smooth state resets.",
    "longDescription": "Classic two-player & AI Tic-Tac-Toe game complete with win animations, score tracking, and smooth state resets. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=600&q=80",
    "category": "Games",
    "tags": [
      "JAVASCRIPT",
      "CANVAS",
      "GAME"
    ],
    "devsCount": 85,
    "stars": 27,
    "forks": 22
  },
  {
    "id": "13-link-shortener",
    "dir": "13.Link-Shorten-Website",
    "title": "URL Link Shortener",
    "description": "Custom URL shortening tool providing instant alias generation, link history caching, and one-click copy.",
    "longDescription": "Custom URL shortening tool providing instant alias generation, link history caching, and one-click copy. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "JAVASCRIPT",
      "API",
      "LINKS"
    ],
    "devsCount": 12,
    "stars": 34,
    "forks": 27
  },
  {
    "id": "14-drawing-app",
    "dir": "14.Drawing App",
    "title": "Canvas Studio & Sketchbook",
    "description": "HTML5 Canvas digital painting workbench featuring brush sizes, color pickers, shape tools, eraser, and PNG export.",
    "longDescription": "HTML5 Canvas digital painting workbench featuring brush sizes, color pickers, shape tools, eraser, and PNG export. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "CANVAS",
      "JAVASCRIPT",
      "GRAPHICS"
    ],
    "devsCount": 19,
    "stars": 41,
    "forks": 32
  },
  {
    "id": "15-alarm-clock",
    "dir": "15.Alarm Clock",
    "title": "Smart Alarm Clock & Timer",
    "description": "Precision digital clock with customizable alarm sound tones, snooze settings, and real-time second hand updates.",
    "longDescription": "Precision digital clock with customizable alarm sound tones, snooze settings, and real-time second hand updates. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "JAVASCRIPT",
      "AUDIO",
      "TIME"
    ],
    "devsCount": 26,
    "stars": 48,
    "forks": 37
  },
  {
    "id": "16-meme-generator",
    "dir": "16.Meme-Generator",
    "title": "Viral Meme Generator",
    "description": "Interactive image captioning tool allowing top/bottom custom text overlays, font scaling, and instant image downloading.",
    "longDescription": "Interactive image captioning tool allowing top/bottom custom text overlays, font scaling, and instant image downloading. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "CANVAS",
      "JAVASCRIPT",
      "MEME"
    ],
    "devsCount": 33,
    "stars": 21,
    "forks": 42
  },
  {
    "id": "17-chatting-app",
    "dir": "17.Chatting-App",
    "title": "Real-Time Chatting Interface",
    "description": "Sleek messaging UI with active chat channels, message bubbles, timestamp indicators, and online status badges.",
    "longDescription": "Sleek messaging UI with active chat channels, message bubbles, timestamp indicators, and online status badges. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1611606063065-ee7946f0787a?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "JAVASCRIPT",
      "UI",
      "MESSAGING"
    ],
    "devsCount": 40,
    "stars": 28,
    "forks": 7
  },
  {
    "id": "18-online-form",
    "dir": "18.Online-Form",
    "title": "Multi-Step Wizard Form",
    "description": "Accessible multi-step questionnaire form with real-time field validation, progress indicators, and custom styling.",
    "longDescription": "Accessible multi-step questionnaire form with real-time field validation, progress indicators, and custom styling. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
    "category": "Utilities",
    "tags": [
      "HTML5",
      "CSS3",
      "VALIDATION"
    ],
    "devsCount": 47,
    "stars": 35,
    "forks": 12
  },
  {
    "id": "19-translator",
    "dir": "19.Translator",
    "title": "Universal Language Translator",
    "description": "Multi-lingual translation app powered by global language APIs with speech synthesis output and text-to-speech.",
    "longDescription": "Multi-lingual translation app powered by global language APIs with speech synthesis output and text-to-speech. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "JAVASCRIPT",
      "API",
      "TRANSLATE"
    ],
    "devsCount": 54,
    "stars": 42,
    "forks": 17
  },
  {
    "id": "20-playable-piano",
    "dir": "20.Playable-Piano",
    "title": "Virtual Synthesizer Piano",
    "description": "Interactive browser keyboard piano playing true pitch WAV samples via keypress bindings and mouse click triggers.",
    "longDescription": "Interactive browser keyboard piano playing true pitch WAV samples via keypress bindings and mouse click triggers. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=600&q=80",
    "category": "Games",
    "tags": [
      "AUDIO_API",
      "JAVASCRIPT",
      "MUSIC"
    ],
    "devsCount": 61,
    "stars": 15,
    "forks": 22
  },
  {
    "id": "21-image-resizer",
    "dir": "21.Image Resizer",
    "title": "Batch Image Resizer & Compressor",
    "description": "Client-side photo dimensions scaler and quality compressor with aspect ratio locking and live preview.",
    "longDescription": "Client-side photo dimensions scaler and quality compressor with aspect ratio locking and live preview. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?auto=format&fit=crop&w=600&q=80",
    "category": "Utilities",
    "tags": [
      "CANVAS",
      "JAVASCRIPT",
      "IMAGES"
    ],
    "devsCount": 68,
    "stars": 22,
    "forks": 27
  },
  {
    "id": "22-dynamic-calendar",
    "dir": "22.Dynamic Calander",
    "title": "Dynamic Calendar & Event Scheduler",
    "description": "Interactive monthly/yearly calendar widget allowing event creation, date navigation, and persistent browser storage.",
    "longDescription": "Interactive monthly/yearly calendar widget allowing event creation, date navigation, and persistent browser storage. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "JAVASCRIPT",
      "DATE",
      "SCHEDULER"
    ],
    "devsCount": 75,
    "stars": 29,
    "forks": 32
  },
  {
    "id": "23-file-downloader",
    "dir": "23.File Downloader",
    "title": "URL File Downloader Tool",
    "description": "Utility app capable of fetching remote assets via Blob streams and saving files directly to local storage.",
    "longDescription": "Utility app capable of fetching remote assets via Blob streams and saving files directly to local storage. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1544396821-4dd40b938ad3?auto=format&fit=crop&w=600&q=80",
    "category": "Utilities",
    "tags": [
      "JAVASCRIPT",
      "FETCH",
      "FILES"
    ],
    "devsCount": 82,
    "stars": 36,
    "forks": 37
  },
  {
    "id": "24-chess-game",
    "dir": "24.Chess Game",
    "title": "Grandmaster Chess Engine",
    "description": "Full featured 8x8 chessboard with piece movement verification, turn management, check detection, and captured piece board.",
    "longDescription": "Full featured 8x8 chessboard with piece movement verification, turn management, check detection, and captured piece board. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=600&q=80",
    "category": "Games",
    "tags": [
      "JAVASCRIPT",
      "CHESS",
      "GAME_LOGIC"
    ],
    "devsCount": 9,
    "stars": 43,
    "forks": 42
  },
  {
    "id": "25-car-racing",
    "dir": "25.Car-Racing",
    "title": "2D Retro Car Racing Arcade",
    "description": "High-speed scrolling road race game where players dodge oncoming traffic hazards to maximize score multipliers.",
    "longDescription": "High-speed scrolling road race game where players dodge oncoming traffic hazards to maximize score multipliers. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=600&q=80",
    "category": "Games",
    "tags": [
      "CANVAS",
      "JAVASCRIPT",
      "ARCADE"
    ],
    "devsCount": 16,
    "stars": 16,
    "forks": 7
  },
  {
    "id": "26-connect-game",
    "dir": "26.Connect-Game",
    "title": "Connect 4 Strategy Game",
    "description": "Grid-based Connect 4 strategy game featuring smooth chip gravity drops, 4-in-a-row detection algorithms, and turn indicators.",
    "longDescription": "Grid-based Connect 4 strategy game featuring smooth chip gravity drops, 4-in-a-row detection algorithms, and turn indicators. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80",
    "category": "Games",
    "tags": [
      "JAVASCRIPT",
      "STRATEGY",
      "BOARD"
    ],
    "devsCount": 23,
    "stars": 23,
    "forks": 12
  },
  {
    "id": "27-snake-and-ladder",
    "dir": "27.Snake-and-Ladder",
    "title": "Snake & Ladder Board Game",
    "description": "Digital multiplayer board game featuring animated dice roll physics, audio feedback, and snake penalty/ladder boost routines.",
    "longDescription": "Digital multiplayer board game featuring animated dice roll physics, audio feedback, and snake penalty/ladder boost routines. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=600&q=80",
    "category": "Games",
    "tags": [
      "JAVASCRIPT",
      "AUDIO",
      "BOARD_GAME"
    ],
    "devsCount": 30,
    "stars": 30,
    "forks": 17
  },
  {
    "id": "28-spelling-game",
    "dir": "28.Spelling-game",
    "title": "Spelling Bee Challenge",
    "description": "Educational word spelling game with audio pronunciation prompts, streak counters, and difficulty tiers.",
    "longDescription": "Educational word spelling game with audio pronunciation prompts, streak counters, and difficulty tiers. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80",
    "category": "Games",
    "tags": [
      "JAVASCRIPT",
      "EDUCATION",
      "QUIZ"
    ],
    "devsCount": 37,
    "stars": 37,
    "forks": 22
  },
  {
    "id": "29-analog-watch",
    "dir": "29.Analog Watch",
    "title": "Precision Analog Clock",
    "description": "Minimalist wall clock with smooth rotating hour, minute, and second dial hands synced to system time.",
    "longDescription": "Minimalist wall clock with smooth rotating hour, minute, and second dial hands synced to system time. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
    "category": "Utilities",
    "tags": [
      "CSS3",
      "JAVASCRIPT",
      "ANIMATION"
    ],
    "devsCount": 44,
    "stars": 44,
    "forks": 27
  },
  {
    "id": "30-photo-editor",
    "dir": "30.Photo Editor",
    "title": "Web Studio Photo Editor",
    "description": "Browser image editing studio with real-time brightness, saturation, inversion, rotation, flip, and download filters.",
    "longDescription": "Browser image editing studio with real-time brightness, saturation, inversion, rotation, flip, and download filters. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "CANVAS",
      "FILTERS",
      "JAVASCRIPT"
    ],
    "devsCount": 51,
    "stars": 17,
    "forks": 32
  },
  {
    "id": "31-music-player",
    "dir": "31.Music Player",
    "title": "Hi-Fi Web Audio Player",
    "description": "Sleek music jukebox with playlist management, progress bar seeking, track metadata display, and volume control.",
    "longDescription": "Sleek music jukebox with playlist management, progress bar seeking, track metadata display, and volume control. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "AUDIO_API",
      "JAVASCRIPT",
      "MEDIA"
    ],
    "devsCount": 58,
    "stars": 24,
    "forks": 37
  },
  {
    "id": "32-calculator",
    "dir": "32.Calculator",
    "title": "Neumorphic Scientific Calculator",
    "description": "Clean calculator supporting arithmetic math, keypress input handling, clear entry, and history computation displays.",
    "longDescription": "Clean calculator supporting arithmetic math, keypress input handling, clear entry, and history computation displays. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=600&q=80",
    "category": "Utilities",
    "tags": [
      "JAVASCRIPT",
      "MATH",
      "UTILITY"
    ],
    "devsCount": 65,
    "stars": 31,
    "forks": 42
  },
  {
    "id": "33-rock-paper-scissors",
    "dir": "33.Rock-Paper-Scissors Game",
    "title": "Rock Paper Scissors Showdown",
    "description": "Interactive Rock-Paper-Scissors game featuring animated hand gesture reveals, computer AI choice, and score tracking.",
    "longDescription": "Interactive Rock-Paper-Scissors game featuring animated hand gesture reveals, computer AI choice, and score tracking. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
    "category": "Games",
    "tags": [
      "JAVASCRIPT",
      "ANIMATION",
      "GAME"
    ],
    "devsCount": 72,
    "stars": 38,
    "forks": 7
  },
  {
    "id": "34-note-app",
    "dir": "34.Note-App",
    "title": "Sticky Notes Manager",
    "description": "Organized notepad application allowing users to create, search, edit, and pin color-coded notes with persistent storage.",
    "longDescription": "Organized notepad application allowing users to create, search, edit, and pin color-coded notes with persistent storage. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "JAVASCRIPT",
      "LOCALSTORAGE",
      "NOTES"
    ],
    "devsCount": 79,
    "stars": 45,
    "forks": 12
  },
  {
    "id": "35-text-file-saver",
    "dir": "35.Text-File saver(all extention)",
    "title": "Universal Text File Exporter",
    "description": "Code and plain text exporter tool enabling custom filename naming, file extension selection (.txt, .js, .html, .doc, .py), and instant saves.",
    "longDescription": "Code and plain text exporter tool enabling custom filename naming, file extension selection (.txt, .js, .html, .doc, .py), and instant saves. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1583521214690-73421a1829a9?auto=format&fit=crop&w=600&q=80",
    "category": "Utilities",
    "tags": [
      "JAVASCRIPT",
      "BLOB",
      "FILE_SAVER"
    ],
    "devsCount": 86,
    "stars": 18,
    "forks": 17
  },
  {
    "id": "36-dictionary-app",
    "dir": "36.Dictionary App",
    "title": "Lexicon Dictionary & Thesaurus",
    "description": "Instant word search tool delivering phonetic pronunciations, audio playback, part-of-speech breakdowns, and example usages.",
    "longDescription": "Instant word search tool delivering phonetic pronunciations, audio playback, part-of-speech breakdowns, and example usages. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "JAVASCRIPT",
      "API",
      "DICTIONARY"
    ],
    "devsCount": 13,
    "stars": 25,
    "forks": 22
  },
  {
    "id": "37-snake-game",
    "dir": "37.Snake Game",
    "title": "Retro Arcade Snake",
    "description": "Classic Nokia-style arcade snake game built on 2D grid Canvas with food spawning, speed acceleration, and high score tracking.",
    "longDescription": "Classic Nokia-style arcade snake game built on 2D grid Canvas with food spawning, speed acceleration, and high score tracking. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=600&q=80",
    "category": "Games",
    "tags": [
      "CANVAS",
      "JAVASCRIPT",
      "RETRO"
    ],
    "devsCount": 20,
    "stars": 32,
    "forks": 27
  },
  {
    "id": "38-stock-trading-app",
    "dir": "38.Stock Trading App",
    "title": "Apex Stock Market Dashboard",
    "description": "Financial markets trading interface equipped with candlestick charts, stock portfolio watchlists, and order panels.",
    "longDescription": "Financial markets trading interface equipped with candlestick charts, stock portfolio watchlists, and order panels. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "CHART_JS",
      "JAVASCRIPT",
      "FINANCE"
    ],
    "devsCount": 27,
    "stars": 39,
    "forks": 32
  },
  {
    "id": "39-stopwatch",
    "dir": "39.Stop watch",
    "title": "Precision Chronometer Stopwatch",
    "description": "High precision millisecond stopwatch featuring lap split timer recordings, pause/resume state control, and zero reset.",
    "longDescription": "High precision millisecond stopwatch featuring lap split timer recordings, pause/resume state control, and zero reset. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=600&q=80",
    "category": "Utilities",
    "tags": [
      "JAVASCRIPT",
      "TIMER",
      "CHRONO"
    ],
    "devsCount": 34,
    "stars": 46,
    "forks": 37
  },
  {
    "id": "40-text-to-speech",
    "dir": "40.Text To Word Convertor",
    "title": "Speech Synthesis Converter",
    "description": "Text-to-speech narration utility converting typed prose into spoken audio with pitch, rate, and voice accents.",
    "longDescription": "Text-to-speech narration utility converting typed prose into spoken audio with pitch, rate, and voice accents. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=600&q=80",
    "category": "Utilities",
    "tags": [
      "WEB_SPEECH_API",
      "JAVASCRIPT",
      "VOICE"
    ],
    "devsCount": 41,
    "stars": 19,
    "forks": 42
  },
  {
    "id": "41-todo-list-app",
    "dir": "41.Todo list app",
    "title": "Taskmaster Todo Workspace",
    "description": "Task management app supporting task creation, category filtering (All, Active, Completed), drag reordering, and local persistence.",
    "longDescription": "Task management app supporting task creation, category filtering (All, Active, Completed), drag reordering, and local persistence. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "JAVASCRIPT",
      "TASKS",
      "PRODUCTIVITY"
    ],
    "devsCount": 48,
    "stars": 26,
    "forks": 7
  },
  {
    "id": "42-twitter-clone",
    "dir": "42.Twitter Clone",
    "title": "Twitter Social Network UI",
    "description": "Faithful social feed interface complete with tweet composer, sidebar navigation, trending topics list, and responsive layout.",
    "longDescription": "Faithful social feed interface complete with tweet composer, sidebar navigation, trending topics list, and responsive layout. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=600&q=80",
    "category": "Landing Pages & Portfolios",
    "tags": [
      "CSS3",
      "JAVASCRIPT",
      "SOCIAL_UI"
    ],
    "devsCount": 55,
    "stars": 33,
    "forks": 12
  },
  {
    "id": "43-typing-speed-test",
    "dir": "43.Typing-Speed-test app",
    "title": "Typing Speed Test Master",
    "description": "Interactive typing speed test measuring WPM (words per minute), accuracy percentage, mistake counts, and countdown timers.",
    "longDescription": "Interactive typing speed test measuring WPM (words per minute), accuracy percentage, mistake counts, and countdown timers. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "JAVASCRIPT",
      "TYPING",
      "BENCHMARK"
    ],
    "devsCount": 62,
    "stars": 40,
    "forks": 17
  },
  {
    "id": "44-admin-panel-dashboard",
    "dir": "44.Admin panel Dashboard",
    "title": "Enterprise Admin Dashboard",
    "description": "Executive administrative control panel rendering user statistics cards, sales analytics tables, theme toggles, and sidebar.",
    "longDescription": "Executive administrative control panel rendering user statistics cards, sales analytics tables, theme toggles, and sidebar. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
    "category": "Landing Pages & Portfolios",
    "tags": [
      "HTML5",
      "CSS3",
      "DASHBOARD",
      "CHARTS"
    ],
    "devsCount": 69,
    "stars": 47,
    "forks": 22
  },
  {
    "id": "45-whatsapp-clone",
    "dir": "45.Whatsapp Clone",
    "title": "WhatsApp Web Messaging App",
    "description": "Responsive WhatsApp web client layout displaying active contact chats, conversation panels, search bar, and emoji selector.",
    "longDescription": "Responsive WhatsApp web client layout displaying active contact chats, conversation panels, search bar, and emoji selector. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=600&q=80",
    "category": "Landing Pages & Portfolios",
    "tags": [
      "CSS3",
      "JAVASCRIPT",
      "CHAT"
    ],
    "devsCount": 76,
    "stars": 20,
    "forks": 27
  },
  {
    "id": "46-video-2-audio",
    "dir": "46.Video 2 Audio Converter",
    "title": "Media Audio Extractor",
    "description": "Browser media processor extracting audio soundtracks from uploaded video files into playable and downloadable MP3/WAV files.",
    "longDescription": "Browser media processor extracting audio soundtracks from uploaded video files into playable and downloadable MP3/WAV files. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
    "category": "Utilities",
    "tags": [
      "HTML5",
      "MEDIA_API",
      "CONVERTER"
    ],
    "devsCount": 83,
    "stars": 27,
    "forks": 32
  },
  {
    "id": "47-random-quote-generator",
    "dir": "47.Random Qoute Generator",
    "title": "Daily Inspiration Quote Engine",
    "description": "Inspirational quote dispenser featuring author attribution, text-to-speech audio reading, Twitter sharing, and copy actions.",
    "longDescription": "Inspirational quote dispenser featuring author attribution, text-to-speech audio reading, Twitter sharing, and copy actions. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "JAVASCRIPT",
      "API",
      "QUOTES"
    ],
    "devsCount": 10,
    "stars": 34,
    "forks": 37
  },
  {
    "id": "48-online-quiz-website",
    "dir": "48.Online Quiz Website",
    "title": "Interactive Knowledge Quiz",
    "description": "Timed quiz examination app providing multiple choice questions, timer countdowns, immediate answer feedback, and scorecards.",
    "longDescription": "Timed quiz examination app providing multiple choice questions, timer countdowns, immediate answer feedback, and scorecards. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=600&q=80",
    "category": "Web Apps & Tools",
    "tags": [
      "JAVASCRIPT",
      "QUIZ",
      "EDUCATION"
    ],
    "devsCount": 17,
    "stars": 41,
    "forks": 42
  },
  {
    "id": "49-dragon-game",
    "dir": "49.Dragon Game",
    "title": "Dino Dragon Runner Arcade",
    "description": "Chrome Dino-inspired endless runner game where players jump over obstacles using spacebar triggers to survive as long as possible.",
    "longDescription": "Chrome Dino-inspired endless runner game where players jump over obstacles using spacebar triggers to survive as long as possible. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
    "category": "Games",
    "tags": [
      "CANVAS",
      "JAVASCRIPT",
      "RUNNER"
    ],
    "devsCount": 24,
    "stars": 48,
    "forks": 7
  },
  {
    "id": "50-drag-drop-image",
    "dir": "50.Drag&Drop Image file",
    "title": "Drag & Drop File Uploader",
    "description": "Drag and drop file upload zone with visual hover states, file type validation, image thumbnail previews, and progress bars.",
    "longDescription": "Drag and drop file upload zone with visual hover states, file type validation, image thumbnail previews, and progress bars. Built cleanly with Vanilla HTML5, CSS3, and JavaScript as part of the 50 Frontend Projects Suite. Fully functional and runnable directly inside Recodex platform.",
    "status": "Active",
    "image": "https://images.unsplash.com/photo-1544396821-4dd40b938ad3?auto=format&fit=crop&w=600&q=80",
    "category": "Utilities",
    "tags": [
      "HTML5_DRAG_DROP",
      "JAVASCRIPT",
      "UPLOAD"
    ],
    "devsCount": 31,
    "stars": 21,
    "forks": 12
  }
];

export const ECOSYSTEMS = [
  {
    id: "web-apps-tools",
    title: "Web Apps & Tools",
    count: "50+",
    activeDevs: "Active Devs",
    bullets: [
      "Interactive single-page applications",
      "Utility calculation tools & converters",
      "Real-time web browser APIs"
    ],
    color: "primary",
    borderColor: "border-l-primary/50",
    bgIcon: "language",
    devCount: 50
  },
  {
    id: "games",
    title: "Games",
    count: "15+",
    activeDevs: "Active Devs",
    bullets: [
      "HTML5 Canvas & 2D games",
      "Interactive audio synth engines",
      "Turn-based board & strategy games"
    ],
    color: "error",
    borderColor: "border-l-error/50",
    bgIcon: "sports_esports",
    devCount: 15
  },
  {
    id: "landing-pages-portfolios",
    title: "Landing Pages & Portfolios",
    count: "25+",
    activeDevs: "Active Devs",
    bullets: [
      "Corporate business websites",
      "E-commerce storefronts & admin hubs",
      "Responsive portfolio showcases"
    ],
    color: "outline",
    borderColor: "border-l-gray-400/50",
    bgIcon: "space_dashboard",
    devCount: 25
  }
];
