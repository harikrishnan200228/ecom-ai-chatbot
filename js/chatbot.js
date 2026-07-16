/**
 * ShopSphere AI Assistant — Embeddable E-commerce Chatbot Engine
 * ----------------------------------------------------------------
 * Core principle: VERBATIM TRANSPARENCY.
 * Every single message the shopper types is captured and rendered
 * back EXACTLY as typed — no autocorrect, no paraphrasing, no silent
 * "interpretation" — before the assistant acts on it. This is the
 * product's core trust feature and must never be bypassed.
 *
 * Drop-in usage on any existing storefront:
 *   <link rel="stylesheet" href="css/style.css">
 *   <script src="data/products.js"></script>
 *   <script src="js/chatbot.js"></script>
 *   <script> ShopSphereChat.init({ brand: "YourStore", themeColor: "#1A2B4C" }); </script>
 */

(function (window, document) {
  "use strict";

  const ORDER_DB = {
    "ORD1001": { status: "Shipped", eta: "18 Jul 2026", item: "AirFlow Pro Wireless Earbuds", carrier: "BlueDart", tracking: "BD48219733IN" },
    "ORD1002": { status: "Out for delivery", eta: "16 Jul 2026 (Today)", item: "UrbanFit Running Shoes", carrier: "Ekart", tracking: "EK99231044" },
    "ORD1003": { status: "Delivered", eta: "12 Jul 2026", item: "GlowSkin Vitamin C Serum", carrier: "Delhivery", tracking: "DL77102938" },
    "ORD1004": { status: "Processing", eta: "22 Jul 2026", item: "PixelBook Air 14 Laptop", carrier: "—", tracking: "—" }
  };

  const FAQ = [
    { match: ["return", "refund", "exchange"], reply: "Our return window is 7 days from delivery for most items (15 days for fashion). Refunds are processed to the original payment method within 3–5 business days once the item passes a quality check." },
    { match: ["cancel"], reply: "You can cancel an order any time before it ships from the Orders page. If it has already shipped, you can refuse delivery or start a return once it arrives." },
    { match: ["payment", "emi", "cod", "cash on delivery"], reply: "We accept cards, UPI, net banking, wallets, and no-cost EMI on orders above ₹3,000. Cash on Delivery is available on eligible pin codes." },
    { match: ["delivery time", "shipping time", "how long"], reply: "Standard delivery takes 2–5 business days depending on your pin code. Express delivery (where available) arrives in 24–48 hours." },
    { match: ["warranty", "guarantee"], reply: "Electronics carry the manufacturer's standard warranty (usually 1 year), visible on each product page under 'Warranty & Service'." },
    { match: ["human", "agent", "representative", "talk to someone", "customer care"], reply: "Connecting you to a human support agent now — average wait time is under 2 minutes." }
  ];

  const GREETINGS = ["hi", "hello", "hey", "hii", "helo", "yo", "namaste"];

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function timeNow() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function detectIntent(raw) {
    const text = raw.toLowerCase().trim();

    if (GREETINGS.some(g => text === g || text.startsWith(g + " "))) {
      return { type: "greeting" };
    }

    const orderIdMatch = raw.match(/ORD\d{3,}/i);
    if (orderIdMatch || /track|order status|where is my order/i.test(text)) {
      return { type: "track_order", orderId: orderIdMatch ? orderIdMatch[0].toUpperCase() : null };
    }

    for (const entry of FAQ) {
      if (entry.match.some(k => text.includes(k))) {
        return { type: "faq", reply: entry.reply };
      }
    }

    if (/price|cost|how much|offer|discount|deal/i.test(text)) {
      return { type: "search", query: text.replace(/price|cost|how much|offer|discount|deal|for|of|the/gi, "").trim() };
    }

    if (/search|find|show me|looking for|buy|need a|want a/i.test(text) || text.split(" ").length <= 4) {
      return { type: "search", query: text };
    }

    return { type: "fallback" };
  }

  function searchProducts(query, catalog) {
    if (!query) return [];
    const q = query.toLowerCase();
    return catalog
      .map(p => {
        let score = 0;
        if (p.name.toLowerCase().includes(q)) score += 5;
        if (p.category.toLowerCase().includes(q)) score += 3;
        p.tags.forEach(t => { if (q.includes(t) || t.includes(q)) score += 2; });
        q.split(" ").forEach(word => {
          if (word.length > 2 && p.name.toLowerCase().includes(word)) score += 1;
          if (word.length > 2 && p.tags.some(t => t.includes(word))) score += 1;
        });
        return { p, score };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(r => r.p);
  }

  class ShopSphereChat {
    constructor(opts) {
      this.opts = Object.assign({
        brand: "ShopSphere",
        themeColor: "#1A2B4C",
        accentColor: "#FF9F1C",
        catalog: window.SHOPSPHERE_PRODUCTS || [],
        greetingMessage: "Hi! I'm your ShopSphere shopping assistant. Ask me to find a product, track an order, or answer a question — I'll always show exactly what you typed before I act on it."
      }, opts);

      this.transcript = [];
      this.awaitingOrderId = false;
      this._buildDOM();
      this._bindEvents();
      this._pushBotMessage(this.opts.greetingMessage, this._quickReplies());
    }

    _quickReplies() {
      return ["Track my order", "Search for headphones", "Return policy", "Talk to a human"];
    }

    _buildDOM() {
      const root = document.createElement("div");
      root.className = "ssc-root";
      root.innerHTML = `
        <button class="ssc-launcher" aria-label="Open shopping assistant" title="Chat with ShopSphere Assistant">
          <span class="ssc-launcher-icon">💬</span>
        </button>
        <section class="ssc-panel" role="dialog" aria-label="ShopSphere AI Assistant" aria-hidden="true">
          <header class="ssc-header">
            <div class="ssc-header-info">
              <span class="ssc-avatar">🛍️</span>
              <div>
                <div class="ssc-title">${escapeHtml(this.opts.brand)} Assistant</div>
                <div class="ssc-subtitle"><span class="ssc-dot"></span> Online · Replies instantly</div>
              </div>
            </div>
            <div class="ssc-header-actions">
              <button class="ssc-icon-btn ssc-export" title="Download transcript" aria-label="Download chat transcript">⬇</button>
              <button class="ssc-icon-btn ssc-close" title="Close" aria-label="Close chat">✕</button>
            </div>
          </header>

          <div class="ssc-verbatim-strip" aria-hidden="true">
            <span class="ssc-verbatim-label">VERBATIM MODE</span>
            <span class="ssc-verbatim-copy">Everything you type is shown exactly as-is before I respond — no edits, no guessing.</span>
          </div>

          <div class="ssc-messages" role="log" aria-live="polite"></div>

          <div class="ssc-quickreplies"></div>

          <form class="ssc-inputbar">
            <button type="button" class="ssc-mic" title="Voice input" aria-label="Speak your message">🎤</button>
            <input type="text" class="ssc-input" placeholder="Type your message exactly as you'd like it repeated..." autocomplete="off" aria-label="Message"/>
            <button type="submit" class="ssc-send" aria-label="Send message">➤</button>
          </form>
          <div class="ssc-footer">Powered by ShopSphere AI · <a href="#" class="ssc-privacy">Privacy</a></div>
        </section>
      `;
      document.body.appendChild(root);
      this.root = root;
      this.panel = root.querySelector(".ssc-panel");
      this.messagesEl = root.querySelector(".ssc-messages");
      this.quickRepliesEl = root.querySelector(".ssc-quickreplies");
      this.inputEl = root.querySelector(".ssc-input");
      this.form = root.querySelector(".ssc-inputbar");
      root.style.setProperty("--ssc-theme", this.opts.themeColor);
      root.style.setProperty("--ssc-accent", this.opts.accentColor);
    }

    _bindEvents() {
      const root = this.root;
      root.querySelector(".ssc-launcher").addEventListener("click", () => this.toggle());
      root.querySelector(".ssc-close").addEventListener("click", () => this.toggle(false));
      root.querySelector(".ssc-export").addEventListener("click", () => this._exportTranscript());

      this.form.addEventListener("submit", (e) => {
        e.preventDefault();
        const val = this.inputEl.value;
        if (!val.trim()) return;
        this._handleUserInput(val);
        this.inputEl.value = "";
      });

      const micBtn = root.querySelector(".ssc-mic");
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.lang = "en-US";
        rec.interimResults = false;
        micBtn.addEventListener("click", () => {
          micBtn.classList.add("ssc-mic-active");
          rec.start();
        });
        rec.onresult = (e) => {
          const spoken = e.results[0][0].transcript;
          this.inputEl.value = spoken;
          micBtn.classList.remove("ssc-mic-active");
        };
        rec.onerror = () => micBtn.classList.remove("ssc-mic-active");
        rec.onend = () => micBtn.classList.remove("ssc-mic-active");
      } else {
        micBtn.style.display = "none";
      }
    }

    toggle(force) {
      const isOpen = this.panel.classList.contains("ssc-open");
      const next = force === undefined ? !isOpen : force;
      this.panel.classList.toggle("ssc-open", next);
      this.panel.setAttribute("aria-hidden", String(!next));
      if (next) setTimeout(() => this.inputEl.focus(), 150);
    }

    _handleUserInput(raw) {
      // STEP 1 — Render the shopper's exact words, unmodified. This is non-negotiable.
      this._pushVerbatim(raw);
      this.transcript.push({ role: "user", text: raw, time: timeNow() });

      // STEP 2 — Interpret, but never overwrite what's already shown.
      this._showTyping();
      window.setTimeout(() => {
        this._hideTyping();
        this._respondTo(raw);
      }, 500 + Math.random() * 400);
    }

    _respondTo(raw) {
      if (this.awaitingOrderId) {
        this.awaitingOrderId = false;
        return this._resolveOrder(raw.trim().toUpperCase());
      }

      const intent = detectIntent(raw);

      switch (intent.type) {
        case "greeting":
          this._pushBotMessage("Hello! What can I help you with — finding a product, tracking an order, or a policy question?", this._quickReplies());
          break;

        case "track_order":
          if (intent.orderId) {
            this._resolveOrder(intent.orderId);
          } else {
            this.awaitingOrderId = true;
            this._pushBotMessage("Sure — could you share your order ID? It looks like ORD1001 and is in your order confirmation email.");
          }
          break;

        case "faq":
          this._pushBotMessage(intent.reply, intent.reply.includes("human support") ? [] : ["Anything else?", "Track my order"]);
          break;

        case "search": {
          const results = searchProducts(intent.query || raw, this.opts.catalog);
          if (results.length) {
            this._pushBotMessage(`Here's what I found for "${raw}":`);
            this._pushProductCards(results);
          } else {
            this._pushBotMessage(`I couldn't find a match for "${raw}" in the catalog. Could you try different keywords, like a brand or category?`, ["Search for shoes", "Search for laptop", "Talk to a human"]);
          }
          break;
        }

        default:
          this._pushBotMessage(`I want to make sure I get this right — you said: "${raw}". I can help with product search, order tracking, returns, or payments. Which one fits best?`, this._quickReplies());
      }
    }

    _resolveOrder(orderId) {
      const order = ORDER_DB[orderId];
      if (order) {
        this._pushBotMessage(
          `Order ${orderId} — ${order.item}\nStatus: ${order.status}\nEstimated: ${order.eta}\nCarrier: ${order.carrier} (${order.tracking})`
        );
      } else {
        this._pushBotMessage(`I couldn't find an order with ID "${orderId}". Please double-check the ID from your confirmation email, or say "talk to a human" for help.`);
      }
    }

    _pushVerbatim(raw) {
      const wrap = document.createElement("div");
      wrap.className = "ssc-msg ssc-msg-user";
      wrap.innerHTML = `
        <div class="ssc-ticket">
          <div class="ssc-ticket-label">YOU TYPED — SHOWN EXACTLY</div>
          <div class="ssc-ticket-body"></div>
        </div>
        <div class="ssc-msg-time">${timeNow()}</div>
      `;
      wrap.querySelector(".ssc-ticket-body").textContent = raw; // textContent guarantees zero alteration/escaping surprises
      this.messagesEl.appendChild(wrap);
      this._scrollToBottom();
    }

    _pushBotMessage(text, quickReplies) {
      const wrap = document.createElement("div");
      wrap.className = "ssc-msg ssc-msg-bot";
      wrap.innerHTML = `
        <span class="ssc-avatar-sm">🤖</span>
        <div class="ssc-bubble"></div>
      `;
      wrap.querySelector(".ssc-bubble").textContent = text;
      this.messagesEl.appendChild(wrap);
      this.transcript.push({ role: "bot", text, time: timeNow() });
      this._scrollToBottom();
      this._renderQuickReplies(quickReplies || []);
    }

    _pushProductCards(products) {
      const wrap = document.createElement("div");
      wrap.className = "ssc-msg ssc-msg-bot ssc-products";
      const cardsHtml = products.map(p => `
        <div class="ssc-card">
          <div class="ssc-card-img">${p.image}</div>
          <div class="ssc-card-name">${escapeHtml(p.name)}</div>
          <div class="ssc-card-price">₹${p.price.toLocaleString("en-IN")} <s>₹${p.mrp.toLocaleString("en-IN")}</s></div>
          <div class="ssc-card-meta">⭐ ${p.rating} · ${p.stock > 0 ? p.stock + " in stock" : "Out of stock"}</div>
          <button class="ssc-card-btn">View product</button>
        </div>
      `).join("");
      wrap.innerHTML = `<span class="ssc-avatar-sm">🤖</span><div class="ssc-card-row">${cardsHtml}</div>`;
      this.messagesEl.appendChild(wrap);
      this._scrollToBottom();
    }

    _renderQuickReplies(list) {
      this.quickRepliesEl.innerHTML = "";
      list.forEach(q => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "ssc-chip";
        chip.textContent = q;
        chip.addEventListener("click", () => this._handleUserInput(q));
        this.quickRepliesEl.appendChild(chip);
      });
    }

    _showTyping() {
      const wrap = document.createElement("div");
      wrap.className = "ssc-msg ssc-msg-bot ssc-typing";
      wrap.innerHTML = `<span class="ssc-avatar-sm">🤖</span><div class="ssc-bubble ssc-typing-dots"><span></span><span></span><span></span></div>`;
      this.messagesEl.appendChild(wrap);
      this._scrollToBottom();
    }

    _hideTyping() {
      const t = this.messagesEl.querySelector(".ssc-typing");
      if (t) t.remove();
    }

    _scrollToBottom() {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }

    _exportTranscript() {
      const lines = this.transcript.map(m => `[${m.time}] ${m.role === "user" ? "You" : "Assistant"}: ${m.text}`);
      const blob = new Blob([lines.join("\n")], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "shopsphere-chat-transcript.txt";
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  window.ShopSphereChat = {
    init(opts) {
      return new ShopSphereChat(opts || {});
    }
  };
})(window, document);
