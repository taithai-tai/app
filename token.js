// token.js – One-time token library by Taithai

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

  // ---------- 1) สร้างโทเค็นใหม่แล้วเด้งไปหน้า target ----------
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

  // ---------- 2) ใช้โทเค็นได้แค่ครั้งเดียว (ไม่ redirect เอง) ----------
  // ใช้สำหรับหน้า Home / Secure
  function useOnce(options) {
    const opts = options || {};
    const cleanUrl = opts.cleanUrl === true; // default = ไม่ลบ token เพื่อ debug ง่าย
    const onFirstUse = opts.onFirstUse || function () {};
    const onAlreadyUsed = opts.onAlreadyUsed || function () {};
    const onInvalid = opts.onInvalid || function () {};

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      onInvalid("missing_token");
      return;
    }

    const store = getStore();
    const info = store[token];

    if (!info) {
      onInvalid("not_found");
      return;
    }

    if (info.used) {
      onAlreadyUsed({ token, info });
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

    onFirstUse({ token, info });
  }

  window.Token = {
    create,
    useOnce,
  };
})(window);
