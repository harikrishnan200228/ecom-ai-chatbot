# Integration Guide — Adding This Assistant to an Existing Storefront

This widget is intentionally framework-free so it can be dropped onto almost
any existing e-commerce front end without a rebuild. This guide covers the
steps to embed it and, separately, the steps to connect it to real data.

---

## 1. Embedding the widget on an existing page

Add these three lines before the closing `</body>` tag of any page you want
the assistant to appear on (product pages, cart, checkout, homepage, etc.):

```html
<link rel="stylesheet" href="/path/to/css/style.css">
<script src="/path/to/data/products.js"></script>
<script src="/path/to/js/chatbot.js"></script>
<script>
  ShopSphereChat.init({
    brand: "YourStoreName",
    themeColor: "#0B2447",   // match your brand's primary color
    accentColor: "#FFB100"   // match your brand's CTA/accent color
  });
</script>
```

That's it — the launcher button and panel inject themselves into the page;
no existing markup needs to change. It's built with plain DOM APIs so it is
safe to include on React, Vue, Angular, Shopify (Theme > Additional scripts),
Magento, WooCommerce, or a hand-rolled stack.

**Site-wide placement:** include the snippet in your shared layout/header
template (e.g. `layout.html`, `_app.js`, or the theme's `theme.liquid`) so it
appears on every page rather than pasting it per-page.

---

## 2. Connecting real product data

Replace the mock catalog with your live product search. Open `js/chatbot.js`
and find the `searchProducts()` function. Swap its body for a call to your
existing product search endpoint, e.g.:

```js
async function searchProducts(query) {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data.results.slice(0, 4); // same shape: {name, price, mrp, rating, stock, image}
}
```

Then update `_respondTo()`'s `"search"` case to `await` this call. Every
e-commerce platform already has this endpoint (it's what powers the main
search bar) — point the widget at it instead of maintaining a second catalog.

---

## 3. Connecting real order data

Replace `ORDER_DB` (a hard-coded object in `chatbot.js`) with a call to your
Order Management System / OMS API, scoped to the logged-in customer:

```js
async function resolveOrder(orderId, customerToken) {
  const res = await fetch(`/api/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  if (!res.ok) return null;
  return res.json();
}
```

**Important:** order lookups must be scoped to the authenticated customer's
session server-side — never trust an order ID typed into a chat box as
sufficient authorization on its own. The API should verify the requester
owns that order (or is staff) before returning any details.

---

## 4. Adding a real language-understanding layer (optional)

The bundled `detectIntent()` function uses transparent, auditable keyword
rules — good for a first release because you can predict exactly what it
will do. When you're ready for open-ended natural-language handling (e.g.
"my earbuds stopped charging after 2 weeks, what do I do"), route unmatched
messages to a hosted LLM behind your own backend (never call an LLM API
directly from client-side JS, to keep API keys server-side):

```js
async function askAssistantBackend(userText, conversationHistory) {
  const res = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userText, history: conversationHistory })
  });
  return (await res.json()).reply;
}
```

Your backend can then call an LLM API with your product catalog and order
tools attached (e.g. via function calling / tool use), so the model can look
up real orders and products rather than freelancing an answer. Whatever
backend you use, **keep the verbatim ticket rendering in the front end
untouched** — it should keep showing the shopper's raw input regardless of
which system answers it.

---

## 5. Human handoff

`FAQ` in `chatbot.js` includes a `"human"` intent match. Wire its branch to
your existing live-chat/helpdesk tool (Zendesk, Freshdesk, Intercom, an
in-house queue, etc.) by opening that tool's widget or creating a ticket with
the chat transcript (`this.transcript` is already collected in the class)
attached for context.

---

## 6. Before going live — checklist

- [ ] Point `searchProducts()` at your real search API
- [ ] Point order lookups at your real OMS, with server-side auth checks
- [ ] Set `themeColor` / `accentColor` to match brand guidelines
- [ ] Load Poppins / Inter / IBM Plex Mono locally or via your existing font pipeline (avoid a hard dependency on Google Fonts in regions where it's blocked)
- [ ] Add your own privacy policy link in the footer (`.ssc-privacy`)
- [ ] Load-test the widget's initial render on your slowest supported device
- [ ] Confirm the human-handoff path reaches a real queue, not a dead end
- [ ] Run it past your legal/privacy team if transcripts will be logged server-side
- [ ] Screen-reader pass (VoiceOver/NVDA) on the open/close and message flow
