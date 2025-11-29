// token.js – One-time Token Library (Taithai)

// ใช้ localStorage เก็บสถานะ token ใน "อุปกรณ์ / browser" นั้น ๆ
(function (window) {
  const STORAGE_KEY = "tokensStore";

  function getStore() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function generate() {
    return Math.random().toString(36).slice(2, 10);
  }

  // -----------------------------
  // 1) สร้างโทเคนใหม่ + redirect ไปหน้า target
  // -----------------------------
  function create(options) {
    const opts = options || {};
    const target = opts.target || "index.html";
    const extraQuery = opts.extraQuery || "";

    const store = getStore();
    const token = generate();

    store[token] = { used: false, createdAt: Date.now() };
    saveStore(store);

    let url = target + "?token=" + encodeURIComponent(token);
    if (extraQuery) url += "&" + extraQuery;

    window.location.href = url;
  }

  // helper สำหรับเขียนข้อความลง DOM
  function renderMessage(html, selector) {
    const root =
      (selector && document.querySelector(selector)) ||
      document.querySelector("#app") ||
      document.body;

    root.innerHTML = html;
  }

  // -------------------------------------------------
  // 2) useOnce: โทเคน 1 อัน ใช้เข้าได้รอบเดียวใน browser นี้
  //    - ไม่ redirect เอง
  //    - ไม่สร้างโทเคนใหม่เอง
  //    - ถ้า refresh → แสดงข้อความ "ใช้แล้ว"
  // -------------------------------------------------
  function useOnce(options) {
    const opts = options || {};
    const selector = opts.selector || "#app";
    const cleanUrl = opts.cleanUrl === true; // default = ไม่ลบ token ออกจาก URL

    // ข้อความ default (ภาษาไทย)
    const messages = opts.messages || {
      first:
        "🎉 ยินดีต้อนรับ!<br>โทเคนนี้ถูกต้อง และเพิ่งถูกใช้ครั้งแรกในอุปกรณ์นี้",
      used:
        "⛔ โทเคนนี้ถูกใช้ไปแล้วในอุปกรณ์นี้<br>กรุณากลับไปสร้างโทเคนใหม่",
      invalid:
        "❌ โทเคนไม่ถูกต้อง หรือไม่เคยถูกสร้างในอุปกรณ์นี้<br>กรุณาเริ่มจากหน้าสร้างโทเคน"
    };

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      renderMessage(messages.invalid + " (missing token)", selector);
      return;
    }

    const store = getStore();
    const info = store[token];

    if (!info) {
      renderMessage(messages.invalid + " (not found)", selector);
      return;
    }

    if (info.used) {
      renderMessage(messages.used, selector);
      return;
    }

    // ✅ ใช้ครั้งแรก
    info.used = true;
    info.usedAt = Date.now();
    store[token] = info;
    saveStore(store);

    if (cleanUrl) {
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.pathname + url.search);
    }

    renderMessage(messages.first, selector);
  }

  window.Token = {
    create,   // ใช้ในหน้า Gen
    useOnce   // ใช้ในหน้า Home (หนึ่งโทเคนเข้าได้รอบเดียว)
  };
})(window);
