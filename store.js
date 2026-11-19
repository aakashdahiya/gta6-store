/* Storefront logic. Products, offers and settings come from data.js (managed in admin.html). */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const { esc, fmt, art } = NC;
const $ = id => document.getElementById(id);
let P = [], filter = "All", cart = [], picked = {}, code = "";

function load() { P = NC.products().filter(p => p.active); }
const findP = id => P.find(p => p.id === id);

/* brand + announcement marquee */
function renderBrand() {
  const S = NC.settings();
  document.querySelectorAll(".brand").forEach(el => el.textContent = S.brand);
  document.title = S.brand + " Store";
  const offers = NC.offers().filter(o => NC.status(o) === "live" && o.banner)
    .map(o => esc(o.title) + (o.kind === "code" ? ` — CODE ${esc(o.code)}` : ""));
  const bits = [...offers, `FREE SHIPPING OVER ${fmt(S.freeShipMin)}`, "LIMITED EDITION", "NO RESTOCKS"];
  const run = bits.map(b => `★ ${b} `).join("");
  $("marquee").innerHTML = run + run + "&nbsp;";
}

/* filters with sliding pill */
function renderFilters() {
  const cats = ["All", ...new Set(P.map(p => p.cat))];
  if (!cats.includes(filter)) filter = "All";
  $("filters").innerHTML = `<i class="pill" id="pill"></i>` + cats.map(c => `<button data-c="${esc(c)}" class="${c === filter ? "on" : ""}">${esc(c)}</button>`).join("");
  movePill();
}
function movePill() { const b = $("filters").querySelector(".on"), pl = $("pill"); if (b && pl) { pl.style.left = b.offsetLeft + "px"; pl.style.width = b.offsetWidth + "px"; } }
$("filters").addEventListener("click", e => {
  const c = e.target.closest("button")?.dataset.c; if (!c || c === filter) return;
  filter = c; $("filters").querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.c === c)); movePill();
  document.querySelectorAll(".card").forEach(el => el.classList.add("out"));
  setTimeout(renderProducts, reduce ? 0 : 320);
});

/* products */
function state(p) {
  const sz = p.sizes.length ? p.sizes : ["OS"];
  const st = picked[p.id] ??= { size: sz[Math.min(1, sz.length - 1)], ci: 0 };
  if (!sz.includes(st.size)) st.size = sz[0];
  if (st.ci >= p.colors.length) st.ci = 0;
  return { sz, st };
}
function promoFor(p) {
  const o = NC.offers().find(o => NC.status(o) === "live" && o.banner && (o.scope === "all" || o.scope === p.cat) && !o.min);
  if (!o) return "";
  const amt = o.type === "percent" ? `${o.value}% off` : `${fmt(o.value)} off`;
  return `<span class="promo">${o.kind === "code" ? `${amt} with ${esc(o.code)}` : `Extra ${amt} in cart`}</span>`;
}
function cardHTML(p, i) {
  const { sz, st } = state(p), col = p.colors[st.ci], sold = p.stock <= 0;
  const off = p.compareAt > p.price ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
  return `<div class="card reveal ${sold ? "sold" : ""}" style="--d:${i * .07}s" data-id="${p.id}">
    <div class="thumb" style="background:radial-gradient(circle at 50% 45%,${esc(p.bg || "#f3eef3")},#fff 78%)">
      ${sold ? `<span class="badge soldout">SOLD OUT</span>` : p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ""}
      ${off ? `<span class="badge sale">-${off}%</span>` : ""}
      <div class="art ${p.image ? "photo" : ""}">${art(p, col?.hex)}</div></div>
    <div class="info"><h3>${esc(p.name)}</h3><span class="cat">${esc(p.cat)}</span><br>${promoFor(p)}
      ${p.colors.length > 1 ? `<div class="swatches">${p.colors.map((c, k) => `<button class="sw ${k === st.ci ? "on" : ""}" data-ci="${k}" title="${esc(c.name)}" style="--c:${esc(c.hex)}"></button>`).join("")}<small>${esc(col?.name || "")}</small></div>` : ""}
      <div class="sizes">${sz.map(s => `<button class="${st.size === s ? "on" : ""}" data-s="${esc(s)}">${esc(s)}</button>`).join("")}</div>
      <div class="row"><span class="price">${fmt(p.price)}${off ? `<s>${fmt(p.compareAt)}</s>` : ""}</span>
        <button class="add" ${sold ? "disabled" : ""}><span>${sold ? "Sold out" : "Add to cart"}</span></button></div>
    </div></div>`;
}
function renderProducts() {
  const list = P.filter(p => filter === "All" || p.cat === filter);
  $("products").innerHTML = list.length ? list.map(cardHTML).join("") : `<p style="color:var(--muted)">No products yet — add some in the admin.</p>`;
  $("products").querySelectorAll(".reveal").forEach(el => io.observe(el));
  bindTilt();
}
$("products").addEventListener("click", e => {
  const card = e.target.closest(".card"); if (!card) return;
  const p = findP(card.dataset.id), st = picked[p.id];
  const sw = e.target.closest(".sw");
  if (sw) {
    st.ci = +sw.dataset.ci;
    card.querySelectorAll(".sw").forEach(b => b.classList.toggle("on", b === sw));
    card.querySelector(".swatches small").textContent = p.colors[st.ci].name;
    card.querySelector(".art").innerHTML = art(p, p.colors[st.ci].hex);
    return;
  }
  const s = e.target.closest(".sizes button");
  if (s) { st.size = s.dataset.s; card.querySelectorAll(".sizes button").forEach(b => b.classList.toggle("on", b === s)); return; }
  if (e.target.closest(".add:not(:disabled)")) add(p, card);
});

/* 3D tilt */
function bindTilt() {
  if (reduce || matchMedia("(hover:none)").matches) return;
  document.querySelectorAll(".card").forEach(c => {
    c.onmousemove = e => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transition = "transform .15s linear,box-shadow .5s"; c.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px)`; };
    c.onmouseleave = () => { c.style.transition = ""; c.style.transform = ""; };
  });
}

/* fly-to-cart */
function fly(el) {
  if (reduce || !el) return bump();
  const from = el.getBoundingClientRect(), to = $("cartBtn").getBoundingClientRect();
  const f = el.cloneNode(true); f.classList.add("flyer");
  f.style.left = from.left + from.width / 2 - 40 + "px"; f.style.top = from.top + from.height / 2 - 40 + "px"; f.style.height = "80px"; f.style.overflow = "hidden"; f.style.borderRadius = "12px";
  document.body.appendChild(f);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    f.style.transform = `translate(${to.left + to.width / 2 - from.left - from.width / 2}px,${to.top + to.height / 2 - from.top - from.height / 2}px) scale(.15) rotate(25deg)`; f.style.opacity = ".4"; }));
  setTimeout(() => { f.remove(); bump(); }, 800);
}
function bump() { const b = $("cartBtn"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); }

/* cart */
function add(p, card) {
  const st = picked[p.id], col = p.colors[st.ci] || { name: "", hex: "" };
  const inCart = cart.filter(l => l.id === p.id).reduce((a, l) => a + l.qty, 0);
  if (inCart >= p.stock) return toast(`Only ${p.stock} left in stock`);
  const key = `${p.id}|${st.size}|${col.name}`, line = cart.find(l => l.key === key);
  line ? line.qty++ : cart.push({ key, id: p.id, size: st.size, color: col.name, hex: col.hex, qty: 1 });
  fly(card.querySelector(".art"));
  renderCart(); toast(`${p.name} (${col.name ? col.name + ", " : ""}${st.size}) added`);
}
function qty(i, d) {
  const l = cart[i], p = findP(l.id);
  if (d > 0 && cart.filter(x => x.id === l.id).reduce((a, x) => a + x.qty, 0) >= p.stock) return toast(`Only ${p.stock} left in stock`);
  l.qty += d; if (l.qty < 1) cart.splice(i, 1); renderCart();
}
function renderCart() {
  cart = cart.filter(l => findP(l.id));
  const r = NC.price(cart, code);
  $("count").textContent = cart.reduce((a, l) => a + l.qty, 0);
  $("items").innerHTML = cart.length ? cart.map((l, i) => { const p = findP(l.id); return `<div class="item" style="--i:${i}">
    <div class="mini" style="background:${esc(p.bg)}">${art(p, l.hex)}</div>
    <div><b>${esc(p.name)}</b><br><small>${l.color ? `<i class="cdot" style="background:${esc(l.hex)}"></i>${esc(l.color)} · ` : ""}Size ${esc(l.size)}</small>
      <div class="qty"><button onclick="qty(${i},-1)">−</button>${l.qty}<button onclick="qty(${i},1)">+</button></div></div>
    <b>${fmt(p.price * l.qty)}</b></div>`; }).join("") : `<p class="empty">Your cart is empty.</p>`;
  const msg = $("couponMsg");
  msg.className = "cmsg " + (r.codeError ? "err" : r.codeOffer ? "ok" : "");
  msg.textContent = r.codeError || (r.codeOffer ? `✓ ${r.codeOffer.code} applied — ${r.codeOffer.title}` : "");
  $("sum").innerHTML = `
    <div class="row"><span>Subtotal</span><b>${fmt(r.sub)}</b></div>
    ${r.auto ? `<div class="row disc"><small>${esc(r.auto.title)}</small><small>−${fmt(r.autoAmt)}</small></div>` : ""}
    ${r.codeOffer ? `<div class="row disc"><small>Code ${esc(r.codeOffer.code)}</small><small>−${fmt(r.codeAmt)}</small></div>` : ""}
    <div class="row"><small style="color:var(--muted)">Shipping</small><small style="color:var(--muted)">${!r.sub ? "—" : r.ship ? fmt(r.ship) : "Free"}</small></div>
    <div class="row total"><b>Total</b><b>${fmt(r.total)}</b></div>`;
  return r;
}
$("couponForm").addEventListener("submit", e => { e.preventDefault(); code = $("couponIn").value.trim(); renderCart(); });
function toggleCart(o) { $("cartRoot").classList.toggle("open", o); if (o) renderCart(); lenis && (o ? lenis.stop() : lenis.start()); }
function checkout() {
  if (!cart.length) return toast("Cart is empty");
  const r = renderCart();
  const order = { id: "NC" + Date.now().toString().slice(-6), date: new Date().toISOString(),
    items: r.lines.map(l => ({ id: l.id, name: l.p.name, size: l.size, color: l.color, qty: l.qty, price: l.p.price })),
    sub: r.sub, discount: r.discount, ship: r.ship, total: r.total, code: r.codeOffer?.code || "", offer: r.auto?.title || "" };
  NC.saveOrders([order, ...NC.orders()]);
  const all = NC.products(); r.lines.forEach(l => { const p = all.find(x => x.id === l.id); if (p) p.stock = Math.max(0, p.stock - l.qty); });
  NC.saveProducts(all);
  cart = []; code = ""; $("couponIn").value = "";
  load(); renderProducts(); renderCart(); toggleCart(false);
  toast(`Demo order ${order.id} placed 🎉 (no payment taken)`);
}
let tt; function toast(m) { const t = $("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2400); }

/* countdown with rolling digits */
const end = Date.now() + (3 * 86400 + 7 * 3600 + 42 * 60) * 1000, units = [[86400, "DAYS"], [3600, "HRS"], [60, "MIN"], [1, "SEC"]];
$("timer").innerHTML = units.map(([, l]) => `<div><b><i></i></b><small>${l}</small></div>`).join("");
function tick() { let s = Math.max(0, (end - Date.now()) / 1000 | 0);
  $("timer").querySelectorAll("i").forEach((el, k) => { const n = units[k][0], v = String(s / n | 0).padStart(2, "0"); s %= n;
    if (el.textContent !== v) { el.textContent = v; el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); } }); }
$("dropArt").innerHTML = art({ name: "Midnight Heist Jacket", type: "jacket", colors: [{ hex: "#17111c" }], design: { sun: true, text: "MIDNIGHT HEIST", textColor: "#2ee6d6" } });

/* scroll reveal */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .15 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* smooth scroll (Lenis) */
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ lerp: .09, smoothWheel: true });
  (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener("click", e => { e.preventDefault(); lenis.scrollTo(a.getAttribute("href"), { offset: -60, duration: 1.4 }); }));
}

/* nav, progress, hero parallax */
let lastY = 0, mx = 0, my = 0;
function onScroll() {
  const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  $("progress").style.transform = `scaleX(${h > 0 ? y / h : 0})`;
  $("nav").classList.toggle("solid", y > 30);
  $("nav").classList.toggle("hide", y > lastY && y > 300 && !$("cartRoot").classList.contains("open")); lastY = y;
  if (!reduce && y < innerHeight * 1.2) {
    $("sun").style.transform = `translate(${mx * -20}px,${y * .35 + my * -10}px)`;
    $("palmL").style.transform = $("palmR").style.transform = `translate(${mx * 30}px,${y * .15}px)`;
    $("heroInner").style.transform = `translateY(${y * -.25}px)`; $("heroInner").style.opacity = 1 - y / (innerHeight * .8);
  }
}
addEventListener("scroll", onScroll, { passive: true });
addEventListener("mousemove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; if (scrollY < innerHeight) onScroll(); }, { passive: true });
addEventListener("resize", movePill);

/* magnetic buttons */
if (!reduce && !matchMedia("(hover:none)").matches) document.querySelectorAll(".magnetic").forEach(b => {
  b.addEventListener("mousemove", e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; });
  b.addEventListener("mouseleave", () => b.style.transform = "");
});

/* live updates when the admin (another tab) changes data */
addEventListener("storage", e => { if (Object.values(NC.K).includes(e.key)) { load(); renderBrand(); renderFilters(); renderProducts(); renderCart(); } });

load(); renderBrand(); renderFilters(); renderProducts(); renderCart(); tick(); setInterval(tick, 1000);
document.fonts?.ready.then(movePill);
