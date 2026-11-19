# Neon Coast Store

A single-page streetwear storefront with an admin panel for managing merch, prices, colours, stock, offers and orders.

> **Status: frontend demo.** All data is saved in the visitor's browser (`localStorage`). There is no backend, no login and no real payments yet. See [Roadmap to launch](#roadmap-to-launch).
>
> **Brand note:** "Neon Coast" is a placeholder name and all artwork is original. You need a licence from Rockstar Games / Take-Two before selling anything that uses GTA names, logos or characters.

---

## Contents

- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [Storefront (`index.html`)](#storefront-indexhtml)
- [Admin panel (`admin.html`)](#admin-panel-adminhtml)
- [Data model](#data-model)
- [Pricing & offers logic](#pricing--offers-logic)
- [Product artwork](#product-artwork)
- [Animations](#animations)
- [Design system](#design-system)
- [Customising](#customising)
- [Limitations](#limitations)
- [Roadmap to launch](#roadmap-to-launch)

---

## Quick start

No build step and no dependencies. Serve the folder with any static server so the store and admin share the same `localStorage`:

```bash
python3 -m http.server 5173
```

- Store: http://localhost:5173/
- Admin: http://localhost:5173/admin.html

Opening the files directly with `file://` also works in most browsers, but a local server is more reliable.

---

## Project structure

| File | Purpose |
|---|---|
| `index.html` | Storefront page: markup and all styles |
| `store.js` | Storefront behaviour: products, cart, coupons, checkout, animations |
| `admin.html` | Admin panel: markup, styles and logic in one file |
| `data.js` | Shared data layer used by both pages: default data, storage, artwork drawing, pricing rules |

**External resources (CDN):**
- Google Fonts: **Anton** (display headings) and **Inter** (body text)
- [Lenis](https://github.com/darkroomengineering/lenis) `1.1.13` from unpkg (smooth scrolling, store only). The page works without it.

---

## Storefront (`index.html`)

Sections from top to bottom:

1. **Navigation bar.** Brand logo, links (Shop, New Drop, About) and a cart button with an item count. Turns frosted after you scroll, hides when you scroll down and comes back when you scroll up. A gradient progress bar along the top shows how far down the page you are.
2. **Hero.** "Live Fast / Dress Louder" headline over a striped sunset with palm trees, a moving grid floor and drifting colour blobs. Buttons for *Shop the drop* and *Next drop*.
3. **Two marquee strips.** The first is generated from **live offers** (only those with *Show in banner* on) plus the free-shipping threshold. The second is a fixed brand slogan. Hovering pauses them.
4. **The Collection.** A category filter with a sliding highlight, then the product grid. Each card shows:
   - The product artwork in the selected colour, or the uploaded photo
   - Badges: custom badge (NEW, LIMITED…), `-X%` when a compare-at price is set, `SOLD OUT` when stock is 0
   - An offer tag when a live banner offer applies to that category and has no minimum order
   - **Colour swatches** that recolour the garment instantly
   - Size buttons
   - The price, with the compare-at price struck through
   - Add to cart, disabled when sold out
5. **Next drop.** Countdown with rolling digits (currently hard-coded to about 3 days from page load) and a *Notify me* button.
6. **Perks.** Fast shipping, easy returns and secure checkout.
7. **Newsletter signup.** Shows a confirmation toast only. Emails are not stored.
8. **Footer.**

### Cart

- A floating panel slides in from the right.
- Cart lines are unique per **product + size + colour**.
- Quantities can't exceed the product's stock.
- **Discount code** field with clear messages: invalid or expired, minimum order not met, or the code doesn't apply to these items.
- The summary shows the subtotal, the automatic offer discount, the code discount, shipping and the total.
- **Checkout (demo):** saves an order (visible in the admin's Orders tab), reduces stock, then clears the cart. **No payment is taken.**
- If the admin is open in another tab, the store re-renders automatically when data changes (via the `storage` event).

---

## Admin panel (`admin.html`)

There's a sidebar with four tabs and a *View store ↗* link. It has **no login**.

### Products
- Stats: total products, products visible in the store, products low on or out of stock (5 or fewer), live offers.
- Search by name or category.
- Each row shows the thumbnail, name and category, colour dots, price (with compare-at), stock, a **Live** toggle that shows or hides the product in the store, and Edit, Duplicate and Delete.
  - A duplicated product starts hidden.
  - Delete asks for confirmation.
- **Product editor** (slide-in panel with a live preview):
  - Name, category (pick an existing one or type a new one), garment type (`tee`, `hoodie`, `cap`, `jacket`)
  - Price, compare-at price (shown struck through in the store, 0 = none), stock, badge
  - Sizes: XS, S, M, L, XL, XXL, OS (one size)
  - **Colours:** add, remove or edit any number, each with a colour picker and a name. Click the dots under the preview to see each one.
  - **Artwork:** upload a product photo (resized to at most 700px JPEG so it fits in browser storage), or use the drawn mockup with print text (`|` starts a new line), print colour, card background colour and an optional sunset graphic
  - *Visible in store* toggle
  - Validation: a name, a price, at least one colour and at least one size are required

### Offers
- Cards show the title, a status pill (`live`, `scheduled`, `expired`, `off`), a description, the code, whether it's in the banner, and the dates.
- Toggle to pause or activate, plus Edit and Delete.
- **Offer editor:**
  - Name, shown to shoppers
  - **How it applies:** *Automatic*, or *Coupon code*
  - **Discount:** % off (max 90%) or ₹ off
  - **Applies to:** all products or one category
  - Minimum order value
  - Start and end dates (start blank = now, end blank = never)
  - Show in the store's scrolling banner
  - Active
  - Coupon codes are upper-cased with spaces removed, and must be unique

### Orders
- Stats: revenue, number of orders, average order value, total discounts given, top-selling product.
- Order list: order ID, date, items with colour and size, code or auto offer and the discount, total.
- *Clear orders* button, with confirmation.

### Settings
- Brand name, which updates the logo, footer and page title on the store
- Free-shipping threshold and shipping fee
- **Export JSON:** downloads all products, offers, orders and settings
- **Import JSON:** restores from an export
- **Reset demo data:** returns everything to the defaults

---

## Data model

Stored in `localStorage` under four keys (see `NC.K` in `data.js`):

| Key | Contents |
|---|---|
| `nc_products` | Array of products |
| `nc_offers` | Array of offers |
| `nc_orders` | Array of orders, newest first |
| `nc_settings` | Settings object |

If a key is missing, the defaults in `data.js` are used.

### Product
```js
{
  id: "p1",
  name: "Sunset Strip Tee",
  cat: "Tees",                 // category, used for filters and offer scope
  type: "tee",                 // tee | hoodie | cap | jacket (artwork shape)
  price: 1499,                 // ₹
  compareAt: 0,                // ₹, > price shows a sale
  stock: 40,
  badge: "BESTSELLER",         // optional
  sizes: ["S","M","L","XL"],
  colors: [{ name: "Black", hex: "#17111c" }],
  design: { sun: true, text: "NEON COAST", textColor: "#14b8a6" },
  bg: "#ffe1ee",               // card background tint
  image: "",                   // data URL of an uploaded photo (overrides drawing)
  active: true                 // visible in store
}
```

### Offer
```js
{
  id: "o1",
  title: "Launch week: 10% off everything",
  kind: "auto",                // auto | code
  code: "",                    // required when kind = code
  type: "percent",             // percent | flat
  value: 10,
  scope: "all",                // "all" or a category name
  min: 0,                      // minimum subtotal in ₹
  start: "", end: "",          // "YYYY-MM-DD" or blank
  active: true,
  banner: true                 // show in store marquee
}
```

### Order
```js
{
  id: "NC123456", date: "2026-11-19T16:30:00.000Z",
  items: [{ id, name, size, color, qty, price }],
  sub, discount, ship, total,  // ₹
  code: "VICE15",              // coupon used, if any
  offer: "Launch week: 10% off everything" // auto offer applied, if any
}
```

### Settings
```js
{ brand: "Neon Coast", freeShipMin: 2999, shipFee: 99 }
```

### `NC` API (`data.js`)
| Function | Description |
|---|---|
| `products()` / `saveProducts(arr)` | Read or write products. Save returns `false` if storage is full. |
| `offers()` / `saveOffers(arr)` | Read or write offers |
| `orders()` / `saveOrders(arr)` | Read or write orders |
| `settings()` / `saveSettings(obj)` | Read or write settings, merged with defaults |
| `reset()` | Delete all stored data, returning to the defaults |
| `art(product, hex?)` | Returns SVG (or `<img>`) markup for a product in a colour |
| `status(offer)` | `live`, `scheduled`, `expired` or `off` |
| `describe(offer)` | A readable summary, e.g. "10% off everything · min order ₹999" |
| `price(cart, code)` | Calculates totals (see below) |
| `fmt(n)` | Formats as Indian rupees, e.g. `₹1,499` |
| `esc(s)` | HTML-escapes a string |
| `uid()` | Generates a short unique ID |

---

## Pricing & offers logic

`NC.price(cart, code)` returns `{ lines, sub, auto, autoAmt, codeOffer, codeAmt, codeError, discount, ship, total }`.

1. **Subtotal** = sum of `price × qty`.
2. Only **live** offers count: active, on or after the start date, and on or before the end date (inclusive, local time).
3. For each offer, the discount applies to the **eligible subtotal** (all items, or only items in the offer's category). The minimum order is checked against the **whole** subtotal.
   - Percent: `eligible × value / 100`, rounded
   - Flat: `min(value, eligible)`
4. **Automatic offers:** only the single best (largest) one applies.
5. **Coupon code:** one code, case-insensitive. It **stacks** on top of the automatic offer.
6. The total discount is capped at the subtotal.
7. **Shipping** is free when `subtotal − discount ≥ freeShipMin`, otherwise `shipFee`. It is 0 for an empty cart.
8. **Total** = subtotal − discount + shipping.

Worked example (default data plus a `VICE15` code for 15% off Tees, with the tee priced at ₹1,299):
2 × tee at ₹1,299 + 1 × hoodie at ₹3,299 = **₹5,897** → automatic 10% = −₹590 → VICE15 on the tees (₹2,598) = −₹390 → shipping free → **₹4,917**.

---

## Product artwork

Products without a photo are drawn as inline SVG by `NC.art()`:
- The garment outline for the `type` is filled with the selected colour hex.
- An optional **sunset graphic**: a gradient circle with stripes cut in the garment colour.
- **Print text** in Anton, with `|` splitting lines, in `design.textColor`.

Each drawing gets a unique gradient ID so several can sit on one page. An uploaded photo replaces the drawing completely, and the colour swatches then don't change the image.

---

## Animations

All animations switch off when the visitor's device asks for **reduced motion** (`prefers-reduced-motion`).

| Where | Effect |
|---|---|
| Page | Lenis smooth scrolling, smooth anchor scrolling, scroll progress bar |
| Nav | Frosted on scroll, hides on scroll down, animated link underline, magnetic cart button |
| Hero | Sun rises on load, headline slides up line by line, staggered fade-ins, swaying palms, moving grid floor, floating blobs, layered scroll movement and slight shift with the mouse, animated scroll hint |
| Marquees | Opposite directions, pause on hover |
| Sections | Fade up as they scroll into view, with staggered delays |
| Product cards | 3D tilt following the mouse, garment lifts and rotates on hover, cards fade when the filter changes, sliding filter highlight |
| Cart | Item flies into the cart button, the cart badge bounces, the panel slides in with items arriving one by one |
| Buttons | Magnetic pull toward the cursor, gradient fill on hover, press-down scale |
| Countdown | Rolling digits |
| Admin | Fading view changes, slide-in editor panel, animated toggles, live preview |

---

## Design system

CSS variables are defined on `:root` in each page:

| Token | Value | Use |
|---|---|---|
| `--bg` | `#fbf8f6` | Page background (light theme) |
| `--text` | `#17111c` | Text, dark buttons |
| `--muted` | `#7d6f87` | Secondary text |
| `--line` | `#ece3ec` | Borders |
| `--pink` | `#ff3d9a` | Primary accent |
| `--orange` | `#ff9a3d` | Secondary accent |
| `--teal` | `#14b8a6` | Success, live states |
| `--sunset` | pink → orange gradient | Main buttons, gradient text |
| `--ease` | `cubic-bezier(.22,1,.36,1)` | Shared easing curve |

Fonts: **Anton** for uppercase headings, **Inter** for body text.
Layout breakpoints: 760px (store) and 900px (admin) switch to mobile layouts.

---

## Customising

| To change | Where |
|---|---|
| Brand name, shipping | Admin → Settings |
| Products, colours, prices, stock | Admin → Products |
| Sales and coupon codes | Admin → Offers |
| Default data for new visitors | `DEF` in `data.js` |
| Hero text, perks, the next-drop copy | `index.html` |
| Countdown end time | `end` in `store.js` |
| Colours, fonts | CSS variables at the top of `index.html` / `admin.html` |
| New garment shape | Add an entry to `G` in `data.js` with `cy` (print centre) and `path(fill)` |

---

## Limitations

- **Data is per browser.** Changes made in the admin are visible only in the same browser. Customers will not see them.
- **No authentication.** Anyone who opens `admin.html` can edit everything.
- **No payments.** Checkout only records a demo order.
- **No stock locking.** Stock is checked when adding to the cart and reduced at checkout, but nothing reserves it.
- **Storage limit.** About 5 MB of `localStorage`, so a handful of photos fills it.
- **The newsletter form doesn't save emails.**
- **Prices are checked on the client only.** On a live site, prices and discounts must be recalculated on the server.

---

## Roadmap to launch

1. **Supabase** (Mumbai region): Postgres tables for `products`, `offers`, `orders` and `settings`; Storage for product photos; Auth for the admin login; row-level security so only the admin can write.
2. **Replace `localStorage`** in `data.js` with Supabase calls. The rest of the app goes through the `NC` API, so changes stay concentrated there.
3. **Razorpay checkout:** a server function creates the Razorpay order with prices recalculated on the server, verifies the payment signature, then marks the order paid and reduces stock. Start in test mode; live mode needs business KYC.
4. **Customer details:** name, phone, address and email at checkout; order confirmation email.
5. **Deploy** on Vercel from this GitHub repo (automatic deploys on push).
6. **Custom domain:** buy one, then add it in Vercel along with its DNS records.
7. **Legal pages:** privacy policy, terms, shipping and refund policy (Razorpay requires these).
