/* Barcode Garden Belek — Admin paneli
 * Menü verisini GitHub deposundaki data/menu.json dosyasından okur.
 * "Yayınla" tüm değişiklikleri (yeni fotoğraflar dahil) tek bir commit olarak depoya yazar;
 * GitHub Pages siteyi yeniden oluşturunca QR menü güncellenir.
 */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const LANGS = ["tr", "en", "ru"];
  const JSON_PATH = "data/menu.json";
  const API = "https://api.github.com";
  const CFG_KEY = "bg-admin";
  const NO_IMG = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="#0B1F24"/><path d="M6 17l4-5 3 3.5 2-2.5 3 4z" fill="none" stroke="#3C5A5E" stroke-width="1.2"/><circle cx="9" cy="8.5" r="1.5" fill="#3C5A5E"/></svg>');

  const S = {
    mode: null,               // "github" | "preview"
    gh: null,                 // { owner, repo, branch, token }
    data: null,
    sha: null,                // yüklenen menu.json sürümü (çakışma kontrolü için)
    pending: new Map(),       // yayınlanmamış fotoğraflar: path → base64
    previews: new Map(),      // path → dataURL (yayından sonra da sayfa yenilenene kadar önizleme için)
    dirty: 0,
    view: "products",
    cat: null,
    q: ""
  };

  /* ---------- yardımcılar ---------- */
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = s => String(s || "").toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").replace(/ё/g, "е");
  const slug = s => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
  const uniqueId = (base, taken) => { base = base || "urun"; let id = base, n = 2; while (taken.has(id)) id = `${base}-${n++}`; return id; };
  const cur = () => S.data.config.currency || "TL";
  const fmt = n => `${Number(n || 0).toLocaleString("tr-TR")} ${cur()}`;
  const imgSrc = p => !p ? NO_IMG : S.previews.get(p) || (/^(https?:|data:)/.test(p) ? p : "../" + p);
  const findCat = id => S.data.categories.find(c => c.id === id);
  const allItems = () => S.data.categories.flatMap(c => c.items.map(it => ({ c, it })));
  const usedImages = () => new Set([...allItems().map(x => x.it.img), ...S.data.categories.map(c => c.cover)].filter(Boolean));
  const tri = o => ({ tr: (o && o.tr) || "", en: (o && o.en) || "", ru: (o && o.ru) || "" });

  const storage = {
    load() { for (const s of [localStorage, sessionStorage]) { try { const v = JSON.parse(s.getItem(CFG_KEY)); if (v) return v; } catch {} } return {}; },
    save(cfg, remember) {
      try {
        const keep = { owner: cfg.owner, repo: cfg.repo, branch: cfg.branch };
        localStorage.setItem(CFG_KEY, JSON.stringify(remember ? { ...keep, token: cfg.token, remember: true } : keep));
        if (!remember) sessionStorage.setItem(CFG_KEY, JSON.stringify({ ...keep, token: cfg.token }));
      } catch {}
    },
    forgetToken() {
      try {
        const v = JSON.parse(localStorage.getItem(CFG_KEY) || "{}");
        delete v.token; delete v.remember;
        localStorage.setItem(CFG_KEY, JSON.stringify(v));
        sessionStorage.removeItem(CFG_KEY);
      } catch {}
    }
  };

  let toastT;
  function toast(msg, kind = "") {
    const el = $("#toast");
    el.textContent = msg;
    el.className = `toast show ${kind}`;
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove("show"), kind === "err" ? 6000 : 3200);
  }

  function ask(title, text, yes = "Evet", danger = true) {
    const dlg = $("#askDlg");
    $("#askTitle").textContent = title;
    $("#askText").textContent = text;
    $("#askYes").textContent = yes;
    $("#askYes").className = `btn ${danger ? "danger" : "gold"}`;
    dlg.returnValue = "";
    dlg.showModal();
    return new Promise(res => dlg.addEventListener("close", () => res(dlg.returnValue === "yes"), { once: true }));
  }

  /* ---------- base64 (UTF-8 güvenli) ---------- */
  const b64enc = str => {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  };
  const b64dec = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), c => c.charCodeAt(0)));

  /* ---------- GitHub API ---------- */
  async function gh(path, opts = {}) {
    let r;
    try {
      r = await fetch(`${API}/repos/${encodeURIComponent(S.gh.owner)}/${encodeURIComponent(S.gh.repo)}${path}`, {
        ...opts,
        cache: "no-store",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${S.gh.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          ...(opts.body ? { "Content-Type": "application/json" } : {})
        }
      });
    } catch { const e = new Error("network"); e.status = 0; throw e; }
    if (!r.ok) {
      const e = new Error(`HTTP ${r.status}`);
      e.status = r.status;
      try { e.detail = (await r.json()).message; } catch {}
      throw e;
    }
    return r.status === 204 ? null : r.json();
  }
  const post = (path, body, method = "POST") => gh(path, { method, body: JSON.stringify(body) });

  function errMsg(e) {
    switch (e.status) {
      case 0: return "Bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.";
      case 401: return "Erişim anahtarı geçersiz veya süresi dolmuş.";
      case 403: return "Anahtarın bu depoya yazma izni yok (Contents: Read and write gerekli).";
      case 404: return "Depo, dal veya data/menu.json bulunamadı. Kullanıcı adı, depo adı ve dosyaların yüklendiğini kontrol edin.";
      case 409: case 422: return `GitHub değişikliği reddetti${e.detail ? `: ${e.detail}` : ""}. Sayfayı yenileyip tekrar deneyin.`;
      default: return e.status ? `GitHub hatası (${e.status})${e.detail ? `: ${e.detail}` : ""}` : `Hata: ${e.message}`;
    }
  }

  async function loadRemote() {
    const ref = encodeURIComponent(S.gh.branch);
    const f = await gh(`/contents/${JSON_PATH}?ref=${ref}`);
    const b64 = f.content || (await gh(`/git/blobs/${f.sha}`)).content;
    return { data: JSON.parse(b64dec(b64)), sha: f.sha };
  }
  async function loadLocal() {
    const r = await fetch(`../${JSON_PATH}?t=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) throw new Error(`menu.json okunamadı (${r.status})`);
    return { data: await r.json(), sha: null };
  }

  function normalize(d) {
    d.config = { whatsapp: [], instagram: "", googleReview: "", wifi: { ssid: "", password: "" }, video: "assets/welcome.mp4", currency: "TL", ...d.config };
    d.config.whatsapp = [].concat(d.config.whatsapp || []).filter(Boolean);
    d.config.wifi = { ssid: "", password: "", ...d.config.wifi };
    d.categories = (d.categories || []).map(c => ({
      id: c.id, name: tri(c.name), cover: c.cover || "", hidden: !!c.hidden,
      items: (c.items || []).map(it => ({
        id: it.id, name: tri(it.name), desc: tri(it.desc), price: Math.max(0, Math.round(+it.price || 0)),
        img: it.img || "", allergens: [...(it.allergens || [])], kcal: it.kcal == null || it.kcal === "" ? null : Math.round(+it.kcal),
        hidden: !!it.hidden
      }))
    }));
    return d;
  }

  /* ---------- Giriş ---------- */
  const lf = $("#loginForm");
  (() => {
    const saved = storage.load();
    const m = location.hostname.match(/^([^.]+)\.github\.io$/i);
    lf.owner.value = saved.owner || (m ? m[1] : "");
    lf.repo.value = saved.repo || (m ? location.pathname.split("/").filter(Boolean)[0] || "" : "");
    lf.branch.value = saved.branch || "main";
    lf.remember.checked = !!saved.remember;
    if (saved.token) {
      lf.token.value = saved.token;
      connect(true);
    }
  })();

  lf.addEventListener("submit", e => { e.preventDefault(); connect(false); });

  async function connect(auto) {
    const btn = $("#loginBtn"), err = $("#loginError");
    err.hidden = true;
    btn.disabled = true;
    btn.textContent = "Bağlanılıyor…";
    S.gh = { owner: lf.owner.value.trim(), repo: lf.repo.value.trim(), branch: lf.branch.value.trim() || "main", token: lf.token.value.trim() };
    try {
      const repo = await gh("");
      if (repo.permissions && !repo.permissions.push) { const e = new Error(); e.status = 403; throw e; }
      const { data, sha } = await loadRemote();
      storage.save(S.gh, lf.remember.checked);
      enter("github", data, sha);
    } catch (e) {
      err.textContent = errMsg(e);
      err.hidden = false;
      if (auto && (e.status === 401 || e.status === 403)) storage.forgetToken();
    } finally {
      btn.disabled = false;
      btn.textContent = "Bağlan";
    }
  }

  $("#previewBtn").addEventListener("click", async () => {
    try {
      const { data } = await loadLocal();
      enter("preview", data, null);
    } catch (e) {
      const err = $("#loginError");
      err.textContent = e.message;
      err.hidden = false;
    }
  });

  function enter(mode, data, sha) {
    S.mode = mode;
    S.data = normalize(data);
    S.sha = sha;
    S.pending.clear();
    S.dirty = 0;
    if (!findCat(S.cat)) S.cat = S.data.categories[0]?.id || null;
    $("#login").hidden = true;
    $("#app").hidden = false;
    const banner = $("#modeBanner");
    banner.hidden = mode !== "preview";
    banner.textContent = "Önizleme modu: değişiklikler sunucuya kaydedilmez. İsterseniz \"JSON indir\" ile dosyayı indirip elle yükleyebilirsiniz.";
    $("#publishBtn span").textContent = mode === "preview" ? "JSON indir" : "Yayınla";
    $("#curSuffix").textContent = cur();
    renderAll();
    fillSettings();
    updateDirty();
  }

  /* ---------- değişiklik takibi ---------- */
  function touch() { S.dirty++; updateDirty(); }
  function updateDirty() {
    const pill = $("#dirtyPill");
    pill.hidden = !S.dirty;
    pill.textContent = `${S.dirty} değişiklik yayınlanmadı`;
    $("#publishBtn").disabled = S.mode === "github" ? !S.dirty : false;
  }
  addEventListener("beforeunload", e => { if (S.dirty) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- sekmeler ---------- */
  $$(".tabs [data-view]").forEach(b => b.addEventListener("click", () => {
    S.view = b.dataset.view;
    $$(".tabs [data-view]").forEach(x => x.setAttribute("aria-selected", x === b));
    ["products", "categories", "settings"].forEach(v => ($(`#v-${v}`).hidden = v !== S.view));
    scrollTo(0, 0);
  }));

  /* ---------- render ---------- */
  function renderAll() { renderCatNav(); renderItems(); renderCats(); }

  function renderCatNav() {
    $("#catNav").innerHTML = S.data.categories.map(c => `
      <button data-cat="${esc(c.id)}" aria-current="${c.id === S.cat && !S.q}">
        <span class="${c.hidden ? "off" : ""}">${esc(c.name.tr)}</span><span class="count">${c.items.length}</span>
      </button>`).join("");
    $("#catSelect").innerHTML = S.data.categories.map(c =>
      `<option value="${esc(c.id)}" ${c.id === S.cat ? "selected" : ""}>${esc(c.name.tr)} (${c.items.length})</option>`).join("");
  }
  const pickCat = id => { S.cat = id; S.q = ""; $("#search").value = ""; renderCatNav(); renderItems(); };
  $("#catNav").addEventListener("click", e => { const b = e.target.closest("[data-cat]"); if (b) pickCat(b.dataset.cat); });
  $("#catSelect").addEventListener("change", e => pickCat(e.target.value));
  let qT;
  $("#search").addEventListener("input", e => { clearTimeout(qT); qT = setTimeout(() => { S.q = e.target.value.trim(); renderCatNav(); renderItems(); }, 120); });

  const ICON = {
    up: '<svg viewBox="0 0 24 24"><path d="m6 14 6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="m6 10 6 6 6-6"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
    del: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/></svg>'
  };

  function renderItems() {
    const q = norm(S.q);
    let list, title;
    if (q) {
      list = allItems().filter(({ it }) => norm([...LANGS.map(l => it.name[l]), ...LANGS.map(l => it.desc[l])].join(" ")).includes(q));
      title = `Arama: “${esc(S.q)}” <small>${list.length} sonuç</small>`;
    } else {
      const c = findCat(S.cat);
      list = c ? c.items.map(it => ({ c, it })) : [];
      title = c ? `${esc(c.name.tr)} <small>${c.items.length} ürün${c.hidden ? " · menüde gizli" : ""}</small>` : "Kategori yok";
    }
    $("#paneTitle").innerHTML = title;
    $("#itemList").innerHTML = list.length ? list.map(({ c, it }, i) => {
      const subs = [it.name.en, it.name.ru].filter(Boolean).join(" · ");
      const missing = !it.name.en || !it.name.ru;
      return `
      <div class="row ${it.hidden ? "is-hidden" : ""}" data-cat="${esc(c.id)}" data-id="${esc(it.id)}">
        <img src="${esc(imgSrc(it.img))}" alt="" loading="lazy" width="64" height="64">
        <button class="row-main" data-act="edit" title="Düzenle">
          <b>${esc(it.name.tr)}</b>
          <span class="sub">${esc(subs) || "—"}</span>
          <span class="tags">
            ${q ? `<span class="tag cat">${esc(c.name.tr)}</span>` : ""}
            ${it.kcal != null ? `<span class="tag">${it.kcal} kcal</span>` : ""}
            ${it.allergens.length ? `<span class="tag al">${it.allergens.length} alerjen</span>` : ""}
            ${missing ? `<span class="tag warn">Çeviri eksik</span>` : ""}
          </span>
        </button>
        <span class="row-price">${esc(fmt(it.price))}</span>
        <label class="switch" title="Menüde göster"><input type="checkbox" data-act="toggle" ${it.hidden ? "" : "checked"} aria-label="${esc(it.name.tr)} menüde görünsün"><span></span></label>
        <div class="row-acts">
          ${q ? "" : `<button class="icon-btn" data-act="up" aria-label="Yukarı taşı" ${i === 0 ? "disabled" : ""}>${ICON.up}</button>
          <button class="icon-btn" data-act="down" aria-label="Aşağı taşı" ${i === list.length - 1 ? "disabled" : ""}>${ICON.down}</button>`}
          <button class="icon-btn" data-act="edit" aria-label="Düzenle">${ICON.edit}</button>
          <button class="icon-btn" data-act="dup" aria-label="Kopyala">${ICON.copy}</button>
          <button class="icon-btn danger" data-act="del" aria-label="Sil">${ICON.del}</button>
        </div>
      </div>`;
    }).join("") : `<p class="empty">${q ? "Sonuç bulunamadı." : "Bu kategoride ürün yok. “Ürün ekle” ile başlayın."}</p>`;
  }

  const rowCtx = el => {
    const row = el.closest(".row");
    const c = findCat(row.dataset.cat);
    const i = c.items.findIndex(x => x.id === row.dataset.id);
    return { c, i, it: c.items[i] };
  };
  const move = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return false; [arr[i], arr[j]] = [arr[j], arr[i]]; return true; };

  $("#itemList").addEventListener("click", async e => {
    const b = e.target.closest("[data-act]");
    if (!b || b.dataset.act === "toggle") return;
    const { c, i, it } = rowCtx(b);
    switch (b.dataset.act) {
      case "edit": openItem(c.id, it); break;
      case "up": case "down":
        if (move(c.items, i, b.dataset.act === "up" ? -1 : 1)) { touch(); renderItems(); }
        break;
      case "dup": {
        const copy = structuredClone(it);
        copy.id = uniqueId(`${it.id}-kopya`, new Set(allItems().map(x => x.it.id)));
        copy.name = { tr: `${it.name.tr} (kopya)`, en: it.name.en, ru: it.name.ru };
        c.items.splice(i + 1, 0, copy);
        touch(); renderAll();
        toast("Ürün kopyalandı.");
        break;
      }
      case "del":
        if (await ask("Ürün silinsin mi?", `“${it.name.tr}” menüden kaldırılacak. Yayınlayana kadar geri almak için sayfayı yenileyebilirsiniz.`, "Sil")) {
          c.items.splice(i, 1);
          touch(); renderAll();
          toast("Ürün silindi.");
        }
        break;
    }
  });
  $("#itemList").addEventListener("change", e => {
    if (e.target.dataset.act !== "toggle") return;
    const { it } = rowCtx(e.target);
    it.hidden = !e.target.checked;
    e.target.closest(".row").classList.toggle("is-hidden", it.hidden);
    touch();
  });

  /* ---------- fotoğraf işleme ---------- */
  let fileCb = null;
  const pickFile = cb => { fileCb = cb; $("#fileIn").value = ""; $("#fileIn").click(); };
  $("#fileIn").addEventListener("change", async e => {
    const f = e.target.files[0];
    if (!f || !fileCb) return;
    try { fileCb(await processImage(f)); }
    catch (err) { toast(`Fotoğraf okunamadı: ${err.message}`, "err"); }
  });

  async function processImage(file) {
    if (!file.type.startsWith("image/")) throw new Error("Lütfen bir resim dosyası seçin.");
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("Desteklenmeyen biçim")); i.src = url; });
      const scale = Math.min(1, 1000 / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
      const cv = Object.assign(document.createElement("canvas"), { width: w, height: h });
      const ctx = cv.getContext("2d");
      ctx.fillStyle = "#132A30";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = cv.toDataURL("image/jpeg", 0.82);
      const base = slug(file.name.replace(/\.[^.]+$/, "")) || "foto";
      const path = `img/${base}-${Date.now().toString(36)}.jpg`;
      S.pending.set(path, dataUrl.split(",")[1]);
      S.previews.set(path, dataUrl);
      return path;
    } finally { URL.revokeObjectURL(url); }
  }

  function openGallery(cb) {
    const dlg = $("#galleryDlg");
    const paths = [...new Set([...S.pending.keys(), ...usedImages()])];
    $("#gallery").innerHTML = paths.map(p => `<button data-path="${esc(p)}" title="${esc(p.split("/").pop())}"><img src="${esc(imgSrc(p))}" alt="" loading="lazy"></button>`).join("");
    $("#gallery").onclick = e => { const b = e.target.closest("[data-path]"); if (b) { cb(b.dataset.path); dlg.close(); } };
    dlg.showModal();
  }
  $("#galleryDlg [data-close]").addEventListener("click", () => $("#galleryDlg").close());

  /* ---------- ürün düzenleme ---------- */
  const itemDlg = $("#itemDlg"), itemForm = $("#itemForm");
  let draft = null;
  $("#fAllergens").innerHTML = Object.entries(window.ALLERGENS || {}).map(([k, v]) =>
    `<label><input type="checkbox" name="al" value="${k}"> ${esc(v.tr)}</label>`).join("");

  $("#addItem").addEventListener("click", () => openItem(S.cat, null));

  function openItem(catId, item) {
    if (!S.data.categories.length) { toast("Önce bir kategori ekleyin.", "err"); return; }
    const blank = { id: null, name: tri(), desc: tri(), price: 0, img: "", allergens: [], kcal: null, hidden: false };
    draft = { origCat: catId || S.data.categories[0].id, isNew: !item, it: structuredClone(item || blank) };
    const f = itemForm, it = draft.it;
    $("#itemDlgTitle").textContent = draft.isNew ? "Yeni ürün" : "Ürünü düzenle";
    LANGS.forEach(l => { f[`name_${l}`].value = it.name[l]; f[`desc_${l}`].value = it.desc[l]; });
    f.price.value = draft.isNew ? "" : it.price;
    f.kcal.value = it.kcal ?? "";
    f.cat.innerHTML = S.data.categories.map(c => `<option value="${esc(c.id)}">${esc(c.name.tr)}</option>`).join("");
    f.cat.value = draft.origCat;
    $$('input[name="al"]', f).forEach(x => (x.checked = it.allergens.includes(x.value)));
    f.visible.checked = !it.hidden;
    $("#fImg").src = imgSrc(it.img);
    $("#itemDelete").hidden = draft.isNew;
    $("#itemError").hidden = true;
    itemDlg.returnValue = "";
    itemDlg.showModal();
    $(".dlg-body", itemDlg).scrollTop = 0;
    if (draft.isNew) f.name_tr.focus();
  }

  $$("[data-photo]", itemDlg).forEach(b => b.addEventListener("click", () => {
    const set = p => { draft.it.img = p; $("#fImg").src = imgSrc(p); };
    if (b.dataset.photo === "upload") pickFile(set); else openGallery(set);
  }));

  itemForm.addEventListener("submit", e => {
    if (e.submitter?.value !== "save") return;         // İptal / kapat → dialog kapanır
    e.preventDefault();
    const f = itemForm, err = $("#itemError");
    const name = { tr: f.name_tr.value.trim(), en: f.name_en.value.trim(), ru: f.name_ru.value.trim() };
    const price = f.price.value === "" ? NaN : +f.price.value;
    const kcal = f.kcal.value === "" ? null : +f.kcal.value;
    const problems = [];
    if (!name.tr) problems.push("Türkçe ürün adı zorunlu.");
    if (!Number.isFinite(price) || price < 0) problems.push("Geçerli bir fiyat girin.");
    if (kcal != null && (!Number.isFinite(kcal) || kcal < 0)) problems.push("Kalori 0 veya daha büyük bir sayı olmalı.");
    if (problems.length) { err.textContent = problems.join(" "); err.hidden = false; return; }

    const it = draft.it;
    Object.assign(it, {
      name, desc: { tr: f.desc_tr.value.trim(), en: f.desc_en.value.trim(), ru: f.desc_ru.value.trim() },
      price: Math.round(price), kcal: kcal == null ? null : Math.round(kcal),
      allergens: $$('input[name="al"]:checked', f).map(x => x.value), hidden: !f.visible.checked
    });
    const target = findCat(f.cat.value);
    if (draft.isNew) {
      it.id = uniqueId(slug(name.tr), new Set(allItems().map(x => x.it.id)));
      target.items.push(it);
    } else {
      const src = findCat(draft.origCat);
      const i = src.items.findIndex(x => x.id === it.id);
      if (target === src) src.items[i] = it;
      else { src.items.splice(i, 1); target.items.push(it); }
    }
    if (!S.q) S.cat = target.id;
    itemDlg.close("save");
    touch(); renderAll();
    toast(draft.isNew ? "Ürün eklendi. Yayınlamayı unutmayın." : "Kaydedildi. Yayınlamayı unutmayın.", "ok");
  });

  $("#itemDelete").addEventListener("click", async () => {
    const c = findCat(draft.origCat);
    if (!(await ask("Ürün silinsin mi?", `“${draft.it.name.tr}” menüden kaldırılacak.`, "Sil"))) return;
    c.items.splice(c.items.findIndex(x => x.id === draft.it.id), 1);
    itemDlg.close();
    touch(); renderAll();
    toast("Ürün silindi.");
  });

  /* ---------- kategoriler ---------- */
  function renderCats() {
    const cats = S.data.categories;
    $("#catList").innerHTML = cats.length ? cats.map((c, i) => `
      <div class="row ${c.hidden ? "is-hidden" : ""}" data-cid="${esc(c.id)}">
        <img src="${esc(imgSrc(c.cover || c.items[0]?.img))}" alt="" loading="lazy" width="64" height="64">
        <button class="row-main" data-cact="edit" title="Düzenle">
          <b>${esc(c.name.tr)}</b>
          <span class="sub">${esc([c.name.en, c.name.ru].filter(Boolean).join(" · ")) || "—"}</span>
          <span class="tags"><span class="tag cat">${c.items.length} ürün</span>${!c.name.en || !c.name.ru ? '<span class="tag warn">Çeviri eksik</span>' : ""}</span>
        </button>
        <span></span>
        <label class="switch" title="Menüde göster"><input type="checkbox" data-cact="toggle" ${c.hidden ? "" : "checked"} aria-label="${esc(c.name.tr)} menüde görünsün"><span></span></label>
        <div class="row-acts">
          <button class="icon-btn" data-cact="up" aria-label="Yukarı taşı" ${i === 0 ? "disabled" : ""}>${ICON.up}</button>
          <button class="icon-btn" data-cact="down" aria-label="Aşağı taşı" ${i === cats.length - 1 ? "disabled" : ""}>${ICON.down}</button>
          <button class="icon-btn" data-cact="edit" aria-label="Düzenle">${ICON.edit}</button>
          <button class="icon-btn danger" data-cact="del" aria-label="Sil">${ICON.del}</button>
        </div>
      </div>`).join("") : `<p class="empty">Henüz kategori yok.</p>`;
  }

  $("#catList").addEventListener("click", async e => {
    const b = e.target.closest("[data-cact]");
    if (!b || b.dataset.cact === "toggle") return;
    const cats = S.data.categories;
    const i = cats.findIndex(c => c.id === b.closest(".row").dataset.cid), c = cats[i];
    switch (b.dataset.cact) {
      case "edit": openCat(c); break;
      case "up": case "down":
        if (move(cats, i, b.dataset.cact === "up" ? -1 : 1)) { touch(); renderAll(); }
        break;
      case "del": deleteCat(c); break;
    }
  });
  $("#catList").addEventListener("change", e => {
    if (e.target.dataset.cact !== "toggle") return;
    const c = findCat(e.target.closest(".row").dataset.cid);
    c.hidden = !e.target.checked;
    e.target.closest(".row").classList.toggle("is-hidden", c.hidden);
    touch(); renderCatNav(); renderItems();
  });

  async function deleteCat(c) {
    const n = c.items.length;
    const ok = await ask("Kategori silinsin mi?", n ? `“${c.name.tr}” ve içindeki ${n} ürün silinecek. Ürünleri korumak istiyorsanız kategoriyi silmek yerine gizleyebilirsiniz.` : `“${c.name.tr}” silinecek.`, "Sil");
    if (!ok) return false;
    S.data.categories.splice(S.data.categories.indexOf(c), 1);
    if (S.cat === c.id) S.cat = S.data.categories[0]?.id || null;
    touch(); renderAll();
    toast("Kategori silindi.");
    return true;
  }

  const catDlg = $("#catDlg"), catForm = $("#catForm");
  let cdraft = null;
  $("#addCat").addEventListener("click", () => openCat(null));

  function openCat(c) {
    cdraft = { isNew: !c, c: c ? structuredClone({ ...c, items: [] }) : { id: null, name: tri(), cover: "", hidden: false }, ref: c };
    const f = catForm;
    $("#catDlgTitle").textContent = c ? "Kategoriyi düzenle" : "Yeni kategori";
    LANGS.forEach(l => (f[`name_${l}`].value = cdraft.c.name[l]));
    f.visible.checked = !cdraft.c.hidden;
    $("#cImg").src = imgSrc(cdraft.c.cover || c?.items[0]?.img);
    $("#catIdInfo").textContent = c ? `Doğrudan bağlantı: …/#menu/${c.id}` : "";
    $("#catDelete").hidden = !c;
    $("#catError").hidden = true;
    catDlg.returnValue = "";
    catDlg.showModal();
    if (!c) f.name_tr.focus();
  }
  $$("[data-cphoto]", catDlg).forEach(b => b.addEventListener("click", () => {
    const set = p => { cdraft.c.cover = p; $("#cImg").src = imgSrc(p || cdraft.ref?.items[0]?.img); };
    if (b.dataset.cphoto === "upload") pickFile(set);
    else if (b.dataset.cphoto === "gallery") openGallery(set);
    else set("");
  }));
  catForm.addEventListener("submit", e => {
    if (e.submitter?.value !== "save") return;
    e.preventDefault();
    const f = catForm;
    const name = { tr: f.name_tr.value.trim(), en: f.name_en.value.trim(), ru: f.name_ru.value.trim() };
    if (!name.tr) { $("#catError").textContent = "Türkçe kategori adı zorunlu."; $("#catError").hidden = false; return; }
    if (cdraft.isNew) {
      const id = uniqueId(slug(name.tr) || "kategori", new Set(S.data.categories.map(c => c.id)));
      S.data.categories.push({ id, name, cover: cdraft.c.cover, hidden: !f.visible.checked, items: [] });
      S.cat = id;
    } else {
      Object.assign(cdraft.ref, { name, cover: cdraft.c.cover, hidden: !f.visible.checked });
    }
    catDlg.close("save");
    touch(); renderAll();
    toast(cdraft.isNew ? "Kategori eklendi." : "Kategori kaydedildi.", "ok");
  });
  $("#catDelete").addEventListener("click", async () => {
    catDlg.close();
    await deleteCat(cdraft.ref);
  });

  /* ---------- ayarlar ---------- */
  const sf = $("#settingsForm");
  function fillSettings() {
    const c = S.data.config;
    sf.whatsapp.value = c.whatsapp.join("\n");
    sf.instagram.value = c.instagram;
    sf.googleReview.value = c.googleReview;
    sf.wifiSsid.value = c.wifi.ssid;
    sf.wifiPassword.value = c.wifi.password;
    sf.video.value = c.video;
    sf.currency.value = c.currency;
  }
  sf.addEventListener("change", e => {
    const c = S.data.config, v = e.target.value.trim();
    switch (e.target.name) {
      case "whatsapp": c.whatsapp = v.split(/[\n,;]+/).map(x => x.replace(/\D/g, "")).filter(Boolean); sf.whatsapp.value = c.whatsapp.join("\n"); break;
      case "wifiSsid": c.wifi.ssid = v; break;
      case "wifiPassword": c.wifi.password = v; break;
      case "currency": c.currency = v || "TL"; $("#curSuffix").textContent = cur(); renderItems(); break;
      default: c[e.target.name] = v;
    }
    touch();
  });
  sf.addEventListener("submit", e => e.preventDefault());

  /* ---------- yayınla ---------- */
  $("#publishBtn").addEventListener("click", publish);

  async function publish() {
    if (S.mode === "preview") return downloadJson();
    const btn = $("#publishBtn"), label = $("#publishBtn span");
    btn.disabled = true;
    label.textContent = "Yayınlanıyor…";
    try {
      const b = encodeURIComponent(S.gh.branch);
      // Başka bir cihazdan değişiklik yapıldıysa üzerine yazmadan önce sor
      const remote = await gh(`/contents/${JSON_PATH}?ref=${b}`);
      if (remote.sha !== S.sha && !(await ask("Menü başka yerden değişmiş",
        "Siz düzenlerken menü dosyası başka bir cihazdan güncellenmiş. Devam ederseniz o değişikliklerin üzerine yazılır.", "Üzerine yaz"))) return;

      const ref = await gh(`/git/ref/heads/${b}`);
      const head = await gh(`/git/commits/${ref.object.sha}`);
      const used = usedImages(), tree = [];
      let imgs = 0;
      for (const [path, b64] of S.pending) {
        if (!used.has(path)) continue;          // yüklenip sonra vazgeçilen fotoğrafları gönderme
        label.textContent = `Fotoğraf ${++imgs}…`;
        const blob = await post("/git/blobs", { content: b64, encoding: "base64" });
        tree.push({ path, mode: "100644", type: "blob", sha: blob.sha });
      }
      label.textContent = "Kaydediliyor…";
      const json = JSON.stringify(S.data, null, 2) + "\n";
      const jb = await post("/git/blobs", { content: b64enc(json), encoding: "base64" });
      tree.push({ path: JSON_PATH, mode: "100644", type: "blob", sha: jb.sha });
      const nt = await post("/git/trees", { base_tree: head.tree.sha, tree });
      const nc = await post("/git/commits", {
        message: `Menü güncellendi: ${S.dirty} değişiklik${imgs ? `, ${imgs} fotoğraf` : ""} (admin paneli)`,
        tree: nt.sha, parents: [ref.object.sha]
      });
      await post(`/git/refs/heads/${b}`, { sha: nc.sha }, "PATCH");
      S.sha = jb.sha;
      S.pending.clear();
      S.dirty = 0;
      toast("Yayınlandı. QR menü 1-2 dakika içinde güncellenecek.", "ok");
    } catch (e) {
      toast(errMsg(e), "err");
    } finally {
      label.textContent = "Yayınla";
      updateDirty();
    }
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(S.data, null, 2) + "\n"], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "menu.json" });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    if (S.pending.size) toast("Not: Yeni yüklenen fotoğraflar JSON'a dahil değildir; önizleme modunda sunucuya gönderilmez.", "err");
  }

  /* ---------- diğer menüsü ---------- */
  const moreBtn = $("#moreBtn"), moreMenu = $("#moreMenu");
  const setMore = open => { moreMenu.hidden = !open; moreBtn.setAttribute("aria-expanded", open); };
  moreBtn.addEventListener("click", e => { e.stopPropagation(); setMore(moreMenu.hidden); });
  document.addEventListener("click", e => { if (!e.target.closest(".more")) setMore(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") setMore(false); });
  moreMenu.addEventListener("click", async e => {
    const b = e.target.closest("[data-more]");
    if (!b) return;
    setMore(false);
    if (b.dataset.more === "download") downloadJson();
    if (b.dataset.more === "reload") {
      if (S.dirty && !(await ask("Yayınlanmamış değişiklikler silinsin mi?", "Sunucudaki son hali yüklenecek ve kaydedilmemiş değişiklikleriniz kaybolacak.", "Yeniden yükle"))) return;
      try {
        const { data, sha } = S.mode === "github" ? await loadRemote() : await loadLocal();
        enter(S.mode, data, sha);
        toast("Menü yeniden yüklendi.");
      } catch (err) { toast(errMsg(err), "err"); }
    }
    if (b.dataset.more === "logout") {
      if (S.dirty && !(await ask("Çıkış yapılsın mı?", "Yayınlanmamış değişiklikleriniz kaybolacak.", "Çıkış yap"))) return;
      storage.forgetToken();
      S.dirty = 0;
      location.reload();
    }
  });
})();
