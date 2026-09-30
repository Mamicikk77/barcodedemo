/* Menü verisini data/menu.json'dan yükler (admin panelinden yapılan değişiklikler buraya yazılır) */
(() => {
  const fmtPrice = (n, cur) => `${Number(n || 0).toLocaleString("tr-TR")} ${cur}`;
  const hasText = o => o && Object.values(o).some(v => v && String(v).trim());

  fetch(`data/menu.json?t=${Date.now()}`, { cache: "no-store" })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(data => {
      const cur = data.config.currency || "TL";
      window.CONFIG = { defaultLang: "tr", ...data.config };
      window.MENU = data.categories
        .filter(c => !c.hidden)
        .map(c => ({
          id: c.id, name: c.name,
          items: c.items.filter(it => !it.hidden).map(it => ({
            n: it.name, d: hasText(it.desc) ? it.desc : null, p: fmtPrice(it.price, cur),
            img: it.img || "assets/logo.png", a: it.allergens || [], k: it.kcal ?? null
          })),
          cover: c.cover
        }))
        .filter(c => c.items.length)
        .map(c => ({ ...c, cover: c.cover || c.items[0].img }));
      window.startApp();
    })
    .catch(err => {
      document.body.insertAdjacentHTML("beforeend",
        `<p style="position:fixed;inset:auto 16px 24px;padding:14px 16px;border-radius:14px;background:#10272D;color:#F4ECDD;font:14px system-ui;border:1px solid rgba(214,174,98,.3);z-index:200">Menü yüklenemedi. Lütfen sayfayı yenileyin. / Menu could not be loaded. (${err.message})</p>`);
    });
})();
