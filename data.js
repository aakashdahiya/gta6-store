/* Shared data layer for the store and admin.
   Demo only: everything lives in this browser's localStorage. A real store needs a backend + database. */
window.NC = (() => {
  const K = { p: "nc_products", o: "nc_offers", ord: "nc_orders", s: "nc_settings" };
  const C = {
    black: { name: "Black", hex: "#17111c" }, white: { name: "White", hex: "#f4f1ee" },
    pink: { name: "Hot Pink", hex: "#ff3d9a" }, teal: { name: "Teal", hex: "#14b8a6" },
    sand: { name: "Sand", hex: "#e8d5b9" }, violet: { name: "Violet", hex: "#5b3cc4" },
  };
  const DEF = {
    settings: { brand: "Neon Coast", freeShipMin: 2999, shipFee: 99 },
    products: [
      { id: "p1", name: "Sunset Strip Tee", cat: "Tees", type: "tee", price: 1499, compareAt: 0, stock: 40, badge: "BESTSELLER", sizes: ["S","M","L","XL"], colors: [C.black, C.white, C.pink], design: { sun: true, text: "NEON COAST", textColor: "#14b8a6" }, bg: "#ffe1ee", image: "", active: true },
      { id: "p2", name: "Ocean Drive Tee", cat: "Tees", type: "tee", price: 1499, compareAt: 1799, stock: 25, badge: "", sizes: ["S","M","L","XL"], colors: [C.white, C.black, C.teal], design: { sun: false, text: "OCEAN|DRIVE", textColor: "#ff3d9a" }, bg: "#d9f7f3", image: "", active: true },
      { id: "p3", name: "Wanted Level Tee", cat: "Tees", type: "tee", price: 1599, compareAt: 0, stock: 4, badge: "NEW", sizes: ["S","M","L","XL"], colors: [C.black, C.sand], design: { sun: false, text: "★★★★★", textColor: "#ff9a3d" }, bg: "#ffeedd", image: "", active: true },
      { id: "p4", name: "Night Run Hoodie", cat: "Hoodies", type: "hoodie", price: 3299, compareAt: 0, stock: 18, badge: "NEW", sizes: ["S","M","L","XL","XXL"], colors: [C.black, C.violet, C.sand], design: { sun: true, text: "NIGHT RUN", textColor: "#ff3d9a" }, bg: "#ebe4ff", image: "", active: true },
      { id: "p5", name: "Palm Shadow Hoodie", cat: "Hoodies", type: "hoodie", price: 2999, compareAt: 3499, stock: 12, badge: "", sizes: ["M","L","XL"], colors: [C.black, C.pink], design: { sun: false, text: "PALM|SHADOW", textColor: "#ff9a3d" }, bg: "#ffe1ee", image: "", active: true },
      { id: "p6", name: "Coastline Cap", cat: "Caps", type: "cap", price: 999, compareAt: 0, stock: 30, badge: "", sizes: ["OS"], colors: [C.black, C.white, C.teal], design: { sun: false, text: "NC", textColor: "#ff3d9a" }, bg: "#d9f7f3", image: "", active: true },
      { id: "p7", name: "Getaway Cap", cat: "Caps", type: "cap", price: 999, compareAt: 0, stock: 0, badge: "", sizes: ["OS"], colors: [C.black, C.sand], design: { sun: true, text: "", textColor: "#ff3d9a" }, bg: "#ffeedd", image: "", active: true },
      { id: "p8", name: "Heist Crew Jacket", cat: "Jackets", type: "jacket", price: 4999, compareAt: 0, stock: 8, badge: "LIMITED", sizes: ["S","M","L","XL"], colors: [C.black, C.violet], design: { sun: true, text: "CREW", textColor: "#14b8a6" }, bg: "#ebe4ff", image: "", active: true },
    ],
    offers: [
      { id: "o1", title: "Launch week: 10% off everything", kind: "auto", code: "", type: "percent", value: 10, scope: "all", min: 0, start: "", end: "", active: true, banner: true },
      { id: "o2", title: "₹300 off orders over ₹3,999", kind: "code", code: "COAST300", type: "flat", value: 300, scope: "all", min: 3999, start: "", end: "", active: true, banner: true },
      { id: "o3", title: "20% off hoodies", kind: "code", code: "HOODIE20", type: "percent", value: 20, scope: "Hoodies", min: 0, start: "", end: "", active: false, banner: false },
    ],
    orders: [],
  };

  const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : structuredClone(d); } catch { return structuredClone(d); } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = n => "₹" + Math.round(n).toLocaleString("en-IN");
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* garment drawings, recoloured by the chosen colour */
  const G = {
    tee: { cy: 50, path: f => `<path d="M30 12 L42 8 Q50 16 58 8 L70 12 L92 28 L82 42 L74 36 L74 92 L26 92 L26 36 L18 42 L8 28Z" fill="${f}" stroke="rgba(0,0,0,.12)"/>` },
    hoodie: { cy: 56, path: f => `<path d="M32 14 Q50 0 68 14 L90 30 L84 88 L74 88 L74 94 L26 94 L26 88 L16 88 L10 30Z" fill="${f}" stroke="rgba(0,0,0,.12)"/><path d="M38 14 Q50 30 62 14" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/>` },
    cap: { cy: 46, path: f => `<path d="M14 62 Q14 22 50 22 Q86 22 86 62Z" fill="${f}" stroke="rgba(0,0,0,.12)"/><path d="M10 62 L96 62 Q92 72 60 70 L10 66Z" fill="${f}"/><path d="M10 62 L96 62 Q92 72 60 70 L10 66Z" fill="rgba(0,0,0,.2)"/>` },
    jacket: { cy: 50, path: f => `<path d="M30 10 L50 16 L70 10 L92 28 L86 90 L14 90 L8 28Z" fill="${f}" stroke="rgba(0,0,0,.12)"/><line x1="50" y1="16" x2="50" y2="90" stroke="rgba(0,0,0,.3)" stroke-width="2"/>` },
  };
  let gid = 0;
  function art(p, hex) {
    if (p.image) return `<img src="${esc(p.image)}" alt="${esc(p.name)}">`;
    const g = G[p.type] || G.tee, d = p.design || {}, f = hex || p.colors?.[0]?.hex || "#17111c";
    const lines = (d.text || "").split("|").map(s => s.trim()).filter(Boolean);
    let inner = "", cy = g.cy;
    if (d.sun) {
      const id = "nc" + gid++, r = p.type === "cap" ? 9 : 13, y = lines.length ? cy - 8 : cy;
      inner += `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd23d"/><stop offset=".5" stop-color="#ff9a3d"/><stop offset="1" stop-color="#ff3d9a"/></linearGradient></defs><circle cx="50" cy="${y}" r="${r}" fill="url(#${id})"/><rect x="${50 - r}" y="${y + 2}" width="${r * 2}" height="2" fill="${f}"/><rect x="${50 - r}" y="${y + 6}" width="${r * 2}" height="2.5" fill="${f}"/>`;
      cy = y + r + 11;
    } else cy = cy + 3 - (lines.length - 1) * 5.5;
    lines.forEach((t, i) => inner += `<text x="50" y="${cy + i * 11}" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="9" fill="${esc(d.textColor || "#ff3d9a")}">${esc(t)}</text>`);
    return `<svg viewBox="0 0 100 100" role="img" aria-label="${esc(p.name)}">${g.path(f)}${inner}</svg>`;
  }

  /* offers + pricing */
  function status(o, now = Date.now()) {
    if (!o.active) return "off";
    if (o.start && now < new Date(o.start + "T00:00").getTime()) return "scheduled";
    if (o.end && now > new Date(o.end + "T23:59:59").getTime()) return "expired";
    return "live";
  }
  function describe(o) {
    const amt = o.type === "percent" ? `${o.value}% off` : `${fmt(o.value)} off`;
    const scope = o.scope === "all" ? "everything" : o.scope;
    return `${amt} ${scope}${o.min ? ` · min order ${fmt(o.min)}` : ""}`;
  }
  function discountFor(o, lines, sub) {
    if (sub < (o.min || 0)) return 0;
    const elig = lines.filter(l => o.scope === "all" || l.p.cat === o.scope).reduce((a, l) => a + l.p.price * l.qty, 0);
    if (!elig) return 0;
    return Math.round(o.type === "percent" ? elig * o.value / 100 : Math.min(o.value, elig));
  }
  function price(cart, code) {
    const P = api.products(), O = api.offers().filter(o => status(o) === "live"), S = api.settings();
    const lines = cart.map(l => ({ ...l, p: P.find(p => p.id === l.id) })).filter(l => l.p);
    const sub = lines.reduce((a, l) => a + l.p.price * l.qty, 0);
    let auto = null, autoAmt = 0;
    O.filter(o => o.kind === "auto").forEach(o => { const a = discountFor(o, lines, sub); if (a > autoAmt) { auto = o; autoAmt = a; } });
    let codeOffer = null, codeAmt = 0, codeError = "";
    if (code && sub) {
      const o = O.find(o => o.kind === "code" && o.code.toUpperCase() === code.toUpperCase());
      if (!o) codeError = "Invalid or expired code";
      else if (sub < (o.min || 0)) codeError = `Add ${fmt(o.min - sub)} more to use ${o.code}`;
      else if (!(codeAmt = discountFor(o, lines, sub))) codeError = `${o.code} doesn't apply to these items`;
      else codeOffer = o;
    }
    const discount = Math.min(sub, autoAmt + codeAmt), after = sub - discount;
    const ship = !sub ? 0 : after >= S.freeShipMin ? 0 : S.shipFee;
    return { lines, sub, auto, autoAmt, codeOffer, codeAmt, codeError, discount, ship, total: after + ship };
  }

  const api = {
    K, esc, fmt, uid, art, status, describe, price, types: Object.keys(G),
    products: () => load(K.p, DEF.products), saveProducts: v => save(K.p, v),
    offers: () => load(K.o, DEF.offers), saveOffers: v => save(K.o, v),
    orders: () => load(K.ord, DEF.orders), saveOrders: v => save(K.ord, v),
    settings: () => ({ ...DEF.settings, ...load(K.s, DEF.settings) }), saveSettings: v => save(K.s, v),
    reset: () => Object.values(K).forEach(k => { try { localStorage.removeItem(k); } catch {} }),
  };
  return api;
})();
