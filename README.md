# ShopSphere AI Assistant — E-commerce Chatbot Widget

A professional, embeddable AI shopping-assistant widget built for e-commerce
storefronts (the kind of experience you'd expect on a large marketplace app —
product search, order tracking, and support, wrapped in a chat interface).

## The core feature: Verbatim Transparency

Most shopping chatbots silently "interpret" what a customer types, which
erodes trust — the customer never knows if they were actually understood.
This widget's defining feature is that **every message the shopper sends is
rendered back on-screen exactly as they typed it**, in a distinct receipt-style
"ticket" bubble, *before* the assistant responds. Nothing is corrected,
reworded, or hidden. If the assistant misunderstands, the shopper can see
clearly what it was reacting to.

This is implemented with `element.textContent` (never innerHTML on user text),
so there is no silent transformation, autocorrect, or trimming of meaning —
only safe rendering.

## Features

- 💬 Floating chat launcher + slide-in panel, works on any existing page
- 🧾 Verbatim ticket display of every user message (signature feature)
- 🔎 Product search against your catalog (keyword + tag matching, swappable for a real search API)
- 📦 Order tracking by order ID, with status/carrier/ETA
- ❓ FAQ handling: returns, cancellations, payments, delivery times, warranty
- 🙋 "Talk to a human" escalation hook
- 🎤 Optional voice input (Web Speech API, auto-hides if unsupported)
- ⬇️ One-click transcript download (further reinforces transparency)
- ♿ Keyboard accessible, visible focus states, `prefers-reduced-motion` respected
- 📱 Responsive down to mobile widths
- 🎨 Themeable via two CSS variables (brand color + accent color)
- 🌐 Framework-free — plain HTML/CSS/JS, drops into React/Vue/Shopify/Magento/custom stacks alike

## File structure

```
ecom-ai-chatbot/
├── index.html              Demo storefront with the widget embedded and running
├── css/
│   └── style.css           All widget + demo-page styling (design tokens at top)
├── js/
│   └── chatbot.js          Widget engine: intent detection, verbatim rendering,
│                           product search, order tracking, FAQ, voice input
├── data/
│   ├── products.js         Demo catalog as a browser global (used by index.html)
│   └── products.json       Same catalog in plain JSON (for backend/import use)
├── docs/
│   ├── INTEGRATION_GUIDE.md   How to embed this on an existing storefront
│   └── GUIDELINES.md          Content, safety, and conversational-design guidelines
└── README.md               This file
```

## Quick start (see it running locally)

1. Unzip this package.
2. From inside the folder, run a simple local server (needed because some browsers
   block certain features on `file://`):
   ```bash
   python3 -m http.server 8080
   ```
3. Open `http://localhost:8080` in your browser.
4. Click the chat bubble (bottom-right) and try:
   - `hi`
   - `search for wireless earbuds`
   - `track my order ORD1002`
   - `what is your return policy`
   - `talk to a human`

## Next steps for a production rollout

This package is a fully working **front-end reference implementation** —
the conversational logic, UI, and UX patterns are production-quality, but
today it answers from an in-browser mock catalog and mock order database.
To go live on a real platform, see `docs/INTEGRATION_GUIDE.md` for exactly
what to connect (your real product search API, order-management system,
and — if desired — a hosted LLM for open-ended questions).
