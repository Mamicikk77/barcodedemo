/* Barcode Garden Belek — QR menü uygulaması */
window.startApp = () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const LANGS = ["tr", "en", "ru"];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const G = !reduced && window.gsap ? window.gsap : null;

  const store = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
  };
  const guessLang = () => {
    const nav = (navigator.language || "").slice(0, 2).toLowerCase();
    return LANGS.includes(nav) ? nav : CONFIG.defaultLang;
  };
  let lang = LANGS.includes(store.get("bg-lang")) ? store.get("bg-lang") : guessLang();
  let screen = "welcome";
  let currentCat = null;
  const stack = []; // uygulama içi ekran geçmişi (tarayıcı geçmişiyle eşleşir)

  // Animasyon bitince (veya takılırsa en geç 450 ms sonra) cb'yi bir kez çalıştırır
  const after = (tween, cb) => {
    let done = false;
    const run = () => { if (!done) { done = true; cb(); } };
    tween.eventCallback("onComplete", run);
    setTimeout(run, 450);
  };

  const L = o => (o && (o[lang] || o.tr)) || ""; // çeviri boşsa Türkçe göster
  const t = k => L(UI[k]);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Dil ---------- */
  function applyLang() {
    document.documentElement.lang = lang;
    $$("[data-i18n]").forEach(el => (el.textContent = t(el.dataset.i18n)));
    $$("[data-i18n-aria]").forEach(el => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    $("#q").placeholder = t("search");
    $("#langCode").textContent = lang.toUpperCase();
    $$("#langList [data-lang]").forEach(b => b.setAttribute("aria-selected", b.dataset.lang === lang));
    document.title = `Barcode Garden Belek · ${t("menu")}`;
    renderGrid();
    if (screen === "list") {
      const y = scrollY;
      renderList();
      scrollTo(0, y);
    }
    if (!$("#search").hidden) runSearch();
    if (openItem) renderDetail(...openItem);
    if (!$("#wifi").hidden) renderWifi();
    if (!$("#wa").hidden) renderWa();
  }
  const langBtn = $("#langBtn"), langList = $("#langList");
  const toggleLang = open => {
    langList.hidden = !open;
    langBtn.setAttribute("aria-expanded", open);
    if (open && G) G.fromTo(langList, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: .2, ease: "power2.out" });
  };
  langBtn.addEventListener("click", e => { e.stopPropagation(); toggleLang(langList.hidden); });
  langList.addEventListener("click", e => {
    const b = e.target.closest("[data-lang]");
    if (!b) return;
    lang = b.dataset.lang;
    store.set("bg-lang", lang);
    toggleLang(false);
    applyLang();
  });
  document.addEventListener("click", e => { if (!e.target.closest("#lang")) toggleLang(false); });

  /* ---------- Karşılama: linkler + video ---------- */
  // WhatsApp: tek numara → doğrudan aç, birden fazla → seçim penceresi
  const waNums = [].concat(CONFIG.whatsapp).filter(Boolean);
  const waFmt = n => n.replace(/^90(\d{3})(\d{3})(\d{2})(\d{2})$/, "0 $1 $2 $3 $4");
  $("#lnkWa").href = `https://wa.me/${waNums[0]}`;
  if (waNums.length > 1) $("#lnkWa").addEventListener("click", e => { e.preventDefault(); renderWa(); openOverlay($("#wa")); });
  function renderWa() {
    $("#waSheet").innerHTML = `
      <h3><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3.2 3.1z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .9c-1.2-.5-2.3-1.6-2.8-2.8l.9-1-1-2z" class="fill"/></svg>${esc(t("waTitle"))}</h3>
      ${waNums.map((n, i) => `
        <div class="wifi-row"><div><small>${esc(t("waLine"))} ${i + 1}</small><b>${esc(waFmt(n))}</b></div>
          <a class="copy-btn" href="https://wa.me/${n}" target="_blank" rel="noopener">${esc(t("waOpen"))}</a></div>`).join("")}`;
  }
  $("#lnkIg").href = CONFIG.instagram;
  $("#lnkRv").href = CONFIG.googleReview;

  const video = $("#welcomeVideo"), soundBtn = $("#soundBtn");
  if (CONFIG.video) {
    video.addEventListener("loadeddata", () => {
      $("#welcome").classList.add("has-video");
      soundBtn.hidden = false;
      video.play().catch(() => {});
    }, { once: true });
    video.addEventListener("error", () => video.removeAttribute("src"), { once: true });
    video.src = CONFIG.video;
  }
  soundBtn.addEventListener("click", () => {
    video.muted = !video.muted;
    soundBtn.classList.toggle("on", !video.muted);
    if (!video.muted) video.play().catch(() => {});
  });

  function introWelcome() {
    if (!G) return;
    G.fromTo(".w-anim", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .7, stagger: .09, ease: "power3.out", delay: .15 });
    G.fromTo(".welcome-logo", { scale: .85 }, { scale: 1, duration: 1, ease: "back.out(1.6)", delay: .15 });
    failsafe(".w-anim, .welcome-logo", 1600);
  }
  // rAF durursa (arka plan sekmesi vb.) içerik görünmez kalmasın
  const failsafe = (sel, ms) => setTimeout(() => $$(sel).forEach(el => {
    if (+getComputedStyle(el).opacity < 1) { G.killTweensOf(el); G.set(el, { clearProps: "opacity,transform" }); }
  }), ms);

  /* ---------- Ekranlar ve geçişler ---------- */
  const screens = { welcome: $("#welcome"), cats: $("#cats"), list: $("#list") };
  const order = { welcome: 0, cats: 1, list: 2 };

  function show(name, catId, { push = true, instant = false } = {}) {
    const from = screens[screen], to = screens[name];
    const dir = order[name] >= order[screen] ? 1 : -1;
    const prev = screen;
    screen = name;
    if (name === "list") currentCat = catId || currentCat || MENU[0].id;
    if (push) stack.push(name);
    if (push) history.pushState({ screen: name, cat: currentCat }, "", name === "welcome" ? "#" : name === "cats" ? "#menu" : `#menu/${currentCat}`);

    const enter = () => {
      Object.values(screens).forEach(s => (s.hidden = s !== to));
      document.body.classList.toggle("in-menu", name !== "welcome");
      if (name === "welcome") { video.play().catch(() => {}); } else { video.pause(); }
      if (name === "list") {
        renderList();
        jumpTo(currentCat, false);
      } else {
        scrollTo(0, 0);
      }
      if (G && !instant) {
        G.fromTo(to, { opacity: 0, x: 24 * dir }, { opacity: 1, x: 0, duration: .35, ease: "power2.out", clearProps: "transform,opacity" });
        if (name === "cats") staggerGrid();
        if (name === "welcome") introWelcome();
        if (name === "list") { G.fromTo(".chip", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .3, stagger: .025, ease: "power2.out" }); failsafe(".chip", 1200); }
        failsafe(`#${to.id}`, 800);
      }
    };
    if (G && !instant && prev !== name) {
      after(G.to(from, { opacity: 0, x: -16 * dir, duration: .2, ease: "power1.in" }), () => { G.killTweensOf(from); G.set(from, { clearProps: "all" }); enter(); });
    } else enter();
  }

  $("#viewMenu").addEventListener("click", () => show("cats"));
  // Geri butonu: uygulama içinde geçmiş varsa tarayıcı geri'si, yoksa (QR ile doğrudan açıldıysa) hedef ekrana git
  $$("[data-go]").forEach(b => b.addEventListener("click", () => {
    if (stack.length > 1 && stack[stack.length - 2] === b.dataset.go) history.back();
    else show(b.dataset.go);
  }));

  /* ---------- Kategori ızgarası ---------- */
  function renderGrid() {
    $("#catGrid").innerHTML = MENU.map(c => `
      <button class="cat-card" data-cat="${c.id}">
        <img src="${c.cover}" alt="" loading="lazy">
        <span class="cat-info"><span class="cat-name">${esc(L(c.name))}</span>
        <span class="cat-count">${c.items.length} ${t("items")}</span></span>
      </button>`).join("");
  }
  // Önayar: Stagger List (back.out)
  const staggerGrid = () => {
    if (!G) return;
    G.fromTo(".cat-card", { opacity: 0, scale: .92, y: 16 },
      { opacity: 1, scale: 1, y: 0, duration: .4, stagger: { each: .05, grid: "auto", from: "start" }, ease: "back.out(1.4)", clearProps: "transform" });
    failsafe(".cat-card", 1800);
  };
  $("#catGrid").addEventListener("click", e => {
    const b = e.target.closest("[data-cat]");
    if (b) show("list", b.dataset.cat);
  });

  /* ---------- Ürün listesi + kaydırmalı kategori çubuğu ---------- */
  const kcalTxt = k => (k == null ? "" : `${k.toLocaleString(lang)} ${t("kcal")}`);
  const itemCard = (c, i, it, label, q) => `
    <button class="item" data-c="${c.id}" data-i="${i}">
      <img class="item-img" src="${it.img}" alt="" loading="lazy" width="92" height="92">
      <span class="item-main">
        ${label ? `<span class="res-cat">${esc(L(c.name))}</span>` : ""}
        <span class="item-name">${q ? hl(L(it.n), q) : esc(L(it.n))}</span>
        ${it.d ? `<span class="item-desc">${esc(L(it.d))}</span>` : ""}
        <span class="item-foot">
          <span class="meta">
            ${it.k != null ? `<span class="kcal">${kcalTxt(it.k)}</span>` : ""}
            ${it.a.length ? `<span class="al-dot">${it.a.length} ${t("allergens").toLowerCase()}</span>` : ""}
          </span>
          <span class="price">${esc(it.p)}</span>
        </span>
      </span>
    </button>`;

  function renderList() {
    $("#chipsTrack").innerHTML = MENU.map(c => `<button class="chip" data-cat="${c.id}">${esc(L(c.name))}</button>`).join("");
    $("#listBody").innerHTML = MENU.map(c => `
      <section class="cat-section" id="sec-${c.id}" data-cat="${c.id}">
        <div class="cat-head"><h2>${esc(L(c.name))}</h2><span>${c.items.length} ${t("items")}</span></div>
        <div class="items">${c.items.map((it, i) => itemCard(c, i, it)).join("")}</div>
      </section>`).join("") + `<p class="disclaimer">${esc(t("disclaimer"))}</p>`;
    setActive(currentCat, false);
    observeSections();
  }

  function setActive(id, smooth = true) {
    currentCat = id;
    $$(".chip").forEach(ch => {
      const on = ch.dataset.cat === id;
      ch.setAttribute("aria-current", on);
      if (on) {
        const track = $("#chipsTrack");
        const left = ch.offsetLeft - (track.clientWidth - ch.offsetWidth) / 2;
        track.scrollTo({ left, behavior: smooth && !reduced ? "smooth" : "auto" });
      }
    });
    if (screen === "list") history.replaceState({ screen: "list", cat: id }, "", `#menu/${id}`);
  }

  let lockSpy = 0;
  function jumpTo(id, smooth = true) {
    const sec = $(`#sec-${id}`);
    if (!sec) return;
    lockSpy = Date.now() + (smooth ? 900 : 100);
    setActive(id, smooth);
    const offset = $(".bar", screens.list).offsetHeight + $("#chips").offsetHeight - 6;
    scrollTo({ top: sec.getBoundingClientRect().top + scrollY - offset, behavior: smooth && !reduced ? "smooth" : "auto" });
  }
  $("#chipsTrack").addEventListener("click", e => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    jumpTo(b.dataset.cat);
    if (G) G.fromTo(b, { scale: .92 }, { scale: 1, duration: .35, ease: "back.out(2)" });
  });

  // Scroll-spy: ekranın üst kısmındaki bölüm aktif kategori olur
  let spyT = 0;
  function observeSections() {
    removeEventListener("scroll", onSpy);
    addEventListener("scroll", onSpy, { passive: true });
  }
  function onSpy() {
    if (screen !== "list" || spyT) return;
    spyT = setTimeout(() => {
      spyT = 0;
      if (Date.now() < lockSpy) return;
      const line = $(".bar", screens.list).offsetHeight + $("#chips").offsetHeight + 40;
      let active = MENU[0].id;
      for (const s of $$(".cat-section")) { if (s.getBoundingClientRect().top <= line) active = s.dataset.cat; else break; }
      if (innerHeight + scrollY >= document.body.scrollHeight - 4) active = MENU[MENU.length - 1].id;
      if (active !== currentCat) setActive(active);
    }, 80);
  }

  document.addEventListener("click", e => {
    const b = e.target.closest(".item");
    if (!b) return;
    const c = MENU.find(x => x.id === b.dataset.c);
    openDetail(c, c.items[+b.dataset.i]);
  });

  /* ---------- Overlay yönetimi (geri tuşu overlay'i kapatır) ---------- */
  let openItem = null;
  function openOverlay(el) {
    el.hidden = false;
    document.body.style.overflow = "hidden";
    history.pushState({ ...(history.state || {}), overlay: el.id }, "", location.hash || "#");
    const sheet = $(".sheet", el);
    if (G) {
      if (sheet) {
        G.fromTo($(".scrim", el), { opacity: 0 }, { opacity: 1, duration: .25 });
        G.fromTo(sheet, { yPercent: 100 }, { yPercent: 0, duration: .45, ease: "power3.out" });
      } else G.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .25, ease: "power2.out" });
    }
  }
  function hideOverlay(el) {
    const done = () => {
      el.hidden = true;
      if (el.id === "detail") openItem = null;
      if ($$(".overlay").every(o => o.hidden)) document.body.style.overflow = "";
    };
    const sheet = $(".sheet", el);
    if (G) {
      if (sheet) {
        G.to($(".scrim", el), { opacity: 0, duration: .2 });
        after(G.to(sheet, { yPercent: 100, duration: .25, ease: "power2.in" }), done);
      } else after(G.to(el, { opacity: 0, duration: .18 }), () => { done(); G.set(el, { clearProps: "opacity,transform" }); });
    } else done();
  }
  const closeOverlay = () => (history.state && history.state.overlay ? history.back() : $$(".overlay").filter(o => !o.hidden).forEach(hideOverlay));
  $$(".overlay [data-close]").forEach(el => el.addEventListener("click", closeOverlay));
  document.addEventListener("keydown", e => { if (e.key === "Escape") { toggleLang(false); closeOverlay(); } });

  // Adres çubuğuna elle yazılan / QR ile gelen hash (ör. #menu/cocktails)
  addEventListener("hashchange", () => {
    if (history.state && history.state.overlay) return;
    const st = routeFromHash();
    if (st.screen !== screen || (st.screen === "list" && st.cat !== currentCat)) show(st.screen, st.cat, { push: false });
  });

  addEventListener("popstate", e => {
    const open = $$(".overlay").filter(o => !o.hidden);
    if (open.length) { open.forEach(hideOverlay); return; }
    const st = e.state || routeFromHash();
    if (stack.length > 1) stack.pop();
    show(st.screen || "welcome", st.cat, { push: false });
  });

  /* ---------- Ürün detayı ---------- */
  function renderDetail(c, it) {
    const others = LANGS.filter(l => l !== lang).map(l => it.n[l]).filter(n => n && n !== L(it.n));
    const uniq = [...new Set(others)];
    $("#sheet").innerHTML = `
      <button class="sheet-close" data-close aria-label="${esc(t("close"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      <img class="sheet-img" src="${it.img}" alt="${esc(L(it.n))}">
      <div class="sheet-body">
        <p class="sheet-cat">${esc(L(c.name))}</p>
        <h3>${esc(L(it.n))}</h3>
        ${uniq.length ? `<p class="alt-names">${uniq.map(esc).join(" · ")}</p>` : ""}
        ${it.d ? `<p class="desc">${esc(L(it.d))}</p>` : ""}
        <span class="price">${esc(it.p)}</span>
        <div class="facts">
          <div class="fact"><div class="fact-label">${esc(t("avgKcal"))}</div>
            <div class="fact-kcal">${it.k != null ? `${it.k.toLocaleString(lang)}<small>${t("kcal")}</small>` : t("na")}</div></div>
          <div class="fact"><div class="fact-label">${esc(t("allergens"))}</div>
            ${it.a.length ? `<div class="al-list">${it.a.map(a => `<span class="al">${esc(L(ALLERGENS[a]))}</span>`).join("")}</div>`
                          : `<div class="al-none">${esc(t("noAllergens"))}</div>`}</div>
        </div>
        <p class="disclaimer">${esc(t("disclaimer"))}</p>
      </div>`;
    $("#sheet [data-close]").addEventListener("click", closeOverlay);
  }
  function openDetail(c, it) {
    openItem = [c, it];
    renderDetail(c, it);
    $("#sheet").scrollTop = 0;
    openOverlay($("#detail"));
  }

  /* ---------- Arama ---------- */
  const norm = s => s.toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").replace(/ё/g, "е");
  const index = MENU.flatMap(c => c.items.map((it, i) => ({ c, i, it,
    hay: norm([...LANGS.map(l => it.n[l]), ...LANGS.map(l => c.name[l]), ...(it.d ? LANGS.map(l => it.d[l]) : [])].join(" ")) })));
  function hl(text, q) {
    const n = norm(text), at = n.indexOf(q);
    if (!q || at < 0 || n.length !== text.length) return esc(text);
    return esc(text.slice(0, at)) + "<mark>" + esc(text.slice(at, at + q.length)) + "</mark>" + esc(text.slice(at + q.length));
  }
  function runSearch() {
    const q = norm($("#q").value.trim());
    const box = $("#results");
    if (!q) {
      box.innerHTML = MENU.map(c => `<button class="chip" data-jump="${c.id}">${esc(L(c.name))}</button>`).join("");
      box.style.cssText = "display:flex;flex-wrap:wrap;gap:8px";
      return;
    }
    box.style.cssText = "";
    const words = q.split(/\s+/);
    const hits = index.filter(x => words.every(w => x.hay.includes(w)));
    box.innerHTML = hits.length ? hits.map(x => itemCard(x.c, x.i, x.it, true, q)).join("") : `<p class="empty">${esc(t("noResults"))}</p>`;
    if (G && hits.length) G.fromTo("#results .item", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .25, stagger: .02, ease: "power2.out" });
  }
  let deb;
  $("#q").addEventListener("input", () => { clearTimeout(deb); deb = setTimeout(runSearch, 120); });
  $("#results").addEventListener("click", e => {
    const j = e.target.closest("[data-jump]");
    if (!j) return;
    const id = j.dataset.jump;
    history.back();
    setTimeout(() => (screen === "list" ? jumpTo(id) : show("list", id)), 60);
  });
  $$(".search-open").forEach(b => b.addEventListener("click", () => {
    $("#q").value = "";
    runSearch();
    openOverlay($("#search"));
    setTimeout(() => $("#q").focus(), 50);
  }));
  $("#searchClose").addEventListener("click", closeOverlay);

  /* ---------- Wi-Fi ---------- */
  function renderWifi() {
    $("#wifiSheet").innerHTML = `
      <h3><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.2" r="1" class="fill"/></svg>${esc(t("wifiTitle"))}</h3>
      <div class="wifi-row"><div><small>${esc(t("network"))}</small><b>${esc(CONFIG.wifi.ssid)}</b></div>
        <button class="copy-btn" data-copy="${esc(CONFIG.wifi.ssid)}">${esc(t("copy"))}</button></div>
      <div class="wifi-row"><div><small>${esc(t("password"))}</small><b>${esc(CONFIG.wifi.password)}</b></div>
        <button class="copy-btn" data-copy="${esc(CONFIG.wifi.password)}">${esc(t("copy"))}</button></div>`;
  }
  $("#btnWifi").addEventListener("click", () => { renderWifi(); openOverlay($("#wifi")); });
  $("#wifiSheet").addEventListener("click", async e => {
    const b = e.target.closest("[data-copy]");
    if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copy); }
    catch {
      const ta = Object.assign(document.createElement("textarea"), { value: b.dataset.copy });
      document.body.append(ta); ta.select(); document.execCommand("copy"); ta.remove();
    }
    toast(t("copied"));
  });
  let toastT;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove("show"), 1600);
  }

  /* ---------- Başlangıç ---------- */
  function routeFromHash() {
    const m = location.hash.match(/^#menu(?:\/([\w-]+))?/);
    if (!m) return { screen: "welcome" };
    return m[1] && MENU.some(c => c.id === m[1]) ? { screen: "list", cat: m[1] } : { screen: "cats" };
  }
  applyLang();
  const start = routeFromHash();
  history.replaceState(start, "", location.hash || "#");
  stack.push(start.screen);
  if (start.screen === "welcome") { introWelcome(); }
  else show(start.screen, start.cat, { push: false, instant: true });
};
