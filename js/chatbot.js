/**
 * ShopSphere AI Assistant — Embeddable E-commerce Chatbot Engine (v2)
 * ----------------------------------------------------------------
 * Core principle: VERBATIM TRANSPARENCY.
 * Every single message the shopper types is captured and rendered
 * back EXACTLY as typed — no autocorrect, no paraphrasing, no silent
 * "interpretation" — before the assistant acts on it. This is the
 * product's core trust feature and must never be bypassed, even as
 * the intelligence layer around it grows more advanced below.
 *
 * v2 additions:
 *   - Typo-tolerant + synonym-aware product search
 *   - Cart (add / view / remove / checkout summary)
 *   - Side-by-side product comparison ("compare X and Y")
 *   - Basic sentiment detection with empathetic de-escalation
 *   - Conversation memory (refers back to last search results)
 *   - Dark mode toggle
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

  // Lightweight synonym map so "headset"/"earphones"/"buds" all reach the same products
  // without needing a real NLP model. Extend this freely as your catalog grows.
  const SYNONYMS = {
    "headset": "earbuds", "headphones": "earbuds", "earphones": "earbuds", "buds": "earbuds", "earpod": "earbuds", "earpods": "earbuds",
    "sneakers": "shoes", "trainers": "shoes", "kicks": "shoes",
    "television": "tv", "telly": "tv",
    "notebook": "laptop", "macbook": "laptop", "pc": "laptop",
    "smartwatch": "fitness tracker", "band": "fitness tracker",
    "jacket": "hoodie", "sweatshirt": "hoodie",
    "moisturizer": "serum", "cream": "serum",
    "rucksack": "backpack", "bagpack": "backpack",
    "couch": "sofa", "settee": "sofa"
  };

  const FRUSTRATION_WORDS = ["angry", "furious", "worst", "terrible", "horrible", "scam", "cheated", "useless", "pathetic", "disgusted", "frustrated", "awful", "unacceptable"];

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function timeNow() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function expandSynonyms(text) {
    let expanded = text;
    Object.keys(SYNONYMS).forEach(key => {
      const re = new RegExp("\\b" + key + "\\b", "gi");
      if (re.test(expanded)) expanded += " " + SYNONYMS[key];
    });
    return expanded;
  }

  // Small Levenshtein implementation for typo tolerance (e.g. "erabuds" -> "earbuds").
  // Fine for short product-search tokens; not meant for long strings.
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
    return dp[m][n];
  }

  function fuzzyIncludes(haystackWord, needleWord) {
    if (haystackWord.includes(needleWord) || needleWord.includes(haystackWord)) return true;
    if (needleWord.length < 4) return false; // avoid false positives on very short words
    return levenshtein(haystackWord, needleWord) <= 2;
  }

  function detectSentiment(text) {
    const lower = text.toLowerCase();
    return FRUSTRATION_WORDS.some(w => lower.includes(w)) ? "frustrated" : "neutral";
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

    if (/\bcompare\b/i.test(text)) {
      return { type: "compare", query: text.replace(/compare/gi, "") };
    }

    if (/^(view|show|open)\s+(my\s+)?cart$/i.test(text) || /what'?s in my cart/i.test(text)) {
      return { type: "view_cart" };
    }

    if (/^(clear|empty)\s+(my\s+)?cart$/i.test(text)) {
      return { type: "clear_cart" };
    }

    if (/\badd\b.*\bcart\b|\bbuy (it|this|that)\b/i.test(text)) {
      return { type: "add_to_cart", raw: text };
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

  function scoreProduct(p, queryWords, rawQueryLower) {
    let score = 0;
    const name = p.name.toLowerCase();
    if (name.includes(rawQueryLower)) score += 5;
    if (p.category.toLowerCase().includes(rawQueryLower)) score += 3;

    queryWords.forEach(word => {
      if (word.length < 2) return;
      if (name.includes(word)) score += 2;
      p.tags.forEach(tag => {
        if (fuzzyIncludes(tag, word)) score += 2;
      });
      name.split(" ").forEach(nameWord => {
        if (fuzzyIncludes(nameWord, word)) score += 1;
      });
    });
    return score;
  }

  function searchProducts(query, catalog) {
    if (!query) return [];
    const expanded = expandSynonyms(query.toLowerCase());
    const words = expanded.split(/\s+/).filter(Boolean);
    const rawQueryLower = query.toLowerCase();

    return catalog
      .map(p => ({ p, score: scoreProduct(p, words, rawQueryLower) }))
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
        greetingMessage: "Hi! I'm your ShopSphere shopping assistant. Ask me to find a product, compare items, track an order, or manage your cart — I'll always show exactly what you typed before I act on it."
      }, opts);

      this.transcript = [];
      this.awaitingOrderId = false;
      this.lastResults = [];
      this.cart = []; // { product, qty }
      this.darkMode = false;

      this._buildDOM();
      this._bindEvents();
      this._pushBotMessage(this.opts.greetingMessage, this._quickReplies());
    }

    _quickReplies() {
      return ["Track my order", "Search for headphones", "Compare shoes and hoodie", "Talk to a human"];
    }

    _buildDOM() {
      const root = document.createElement("div");
      root.className = "ssc-root";
      root.innerHTML = `
        <button class="ssc-launcher" aria-label="Open shopping assistant" title="Chat with ShopSphere Assistant">
          <span class="ssc-launcher-icon">💬</span>
          <span class="ssc-cart-badge" hidden>0</span>
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
              <button class="ssc-icon-btn ssc-cart-btn" title="View cart" aria-label="View cart">🛒</button>
              <button class="ssc-icon-btn ssc-theme-toggle" title="Toggle dark mode" aria-label="Toggle dark mode">🌙</button>
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
      this.cartBadge = root.querySelector(".ssc-cart-badge");
      root.style.setProperty("--ssc-theme", this.opts.themeColor);
      root.style.setProperty("--ssc-accent", this.opts.accentColor);
    }

    _bindEvents() {
      const root = this.root;
      root.querySelector(".ssc-launcher").addEventListener("click", () => this.toggle());
      root.querySelector(".ssc-close").addEventListener("click", () => this.toggle(false));
      root.querySelector(".ssc-export").addEventListener("click", () => this._exportTranscript());
      root.querySelector(".ssc-theme-toggle").addEventListener("click", () => this._toggleDarkMode());
      root.querySelector(".ssc-cart-btn").addEventListener("click", () => this._handleUserInput("view cart"));

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

    _toggleDarkMode() {
      this.darkMode = !this.darkMode;
      this.root.classList.toggle("ssc-dark", this.darkMode);
      this.root.querySelector(".ssc-theme-toggle").textContent = this.darkMode ? "☀️" : "🌙";
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
      }, 450 + Math.random() * 350);
    }

    _respondTo(raw) {
      // Sentiment check runs first — a frustrated shopper gets acknowledged
      // before anything else, regardless of what else they asked.
      if (detectSentiment(raw) === "frustrated") {
        this._pushBotMessage("I'm sorry this hasn't gone well — that's frustrating, and I want to help sort it out quickly. I can connect you with a human agent right now, or try to resolve it here first.", ["Talk to a human", "Try to help me here"]);
        return;
      }

      if (this.awaitingOrderId) {
        this.awaitingOrderId = false;
        const idMatch = raw.match(/ORD\d{3,}/i);
        if (idMatch) {
          return this._resolveOrder(idMatch[0].toUpperCase());
        }
        // fall through to normal handling if no ID was actually given
      }

      const intent = detectIntent(raw);

      switch (intent.type) {
        case "greeting":
          this._pushBotMessage("Hello! What can I help you with — finding a product, comparing options, tracking an order, or your cart?", this._quickReplies());
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

        case "compare": {
          const parts = intent.query.split(/\band\b|,|\bvs\.?\b/i).map(s => s.trim()).filter(Boolean);
          if (parts.length < 2) {
            this._pushBotMessage('Tell me two products to compare, like "compare running shoes and hoodie".');
            break;
          }
          const a = searchProducts(parts[0], this.opts.catalog)[0];
          const b = searchProducts(parts[1], this.opts.catalog)[0];
          if (a && b) {
            this._pushBotMessage(`Comparing "${parts[0].trim()}" and "${parts[1].trim()}":`);
            this._pushComparisonCard(a, b);
          } else {
            this._pushBotMessage("I couldn't find a match for one or both of those — try different keywords.");
          }
          break;
        }

        case "add_to_cart": {
          if (this.lastResults.length === 0) {
            this._pushBotMessage("Search for a product first, then tell me to add it to your cart.");
            break;
          }
          const target = this.lastResults[0];
          this._addToCart(target);
          this._pushBotMessage(`Added "${target.name}" to your cart. Say "view cart" any time to see it.`, ["View cart", "Keep shopping"]);
          break;
        }

        case "view_cart":
          this._pushCartSummary();
          break;

        case "clear_cart":
          this.cart = [];
          this._updateCartBadge();
          this._pushBotMessage("Your cart is now empty.");
          break;

        case "search": {
          const results = searchProducts(intent.query || raw, this.opts.catalog);
          this.lastResults = results;
          if (results.length) {
            this._pushBotMessage(`Here's what I found for "${raw}":`);
            this._pushProductCards(results);
          } else {
            this._pushBotMessage(`I couldn't find a match for "${raw}" in the catalog. Could you try different keywords, like a brand or category?`, ["Search for shoes", "Search for laptop", "Talk to a human"]);
          }
          break;
        }

        default:
          this._pushBotMessage(`I want to make sure I get this right — you said: "${raw}". I can help with product search, comparisons, order tracking, your cart, or returns. Which one fits best?`, this._quickReplies());
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

    _addToCart(product) {
      const existing = this.cart.find(c => c.product.id === product.id);
      if (existing) existing.qty += 1;
      else this.cart.push({ product, qty: 1 });
      this._updateCartBadge();
    }

    _updateCartBadge() {
      const count = this.cart.reduce((sum, c) => sum + c.qty, 0);
      this.cartBadge.textContent = String(count);
      this.cartBadge.hidden = count === 0;
    }

    _pushCartSummary() {
      if (this.cart.length === 0) {
        this._pushBotMessage("Your cart is empty. Search for something and say \"add to cart\" to get started.");
        return;
      }
      const total = this.cart.reduce((sum, c) => sum + c.product.price * c.qty, 0);
      const lines = this.cart.map(c => `${c.qty} × ${c.product.name} — ₹${(c.product.price * c.qty).toLocaleString("en-IN")}`);
      this._pushBotMessage(`Your cart:\n${lines.join("\n")}\n\nTotal: ₹${total.toLocaleString("en-IN")}`, ["Clear cart", "Keep shopping"]);
    }

    _pushVerbatim(raw) {
      const wrap = document.createElement("div");
      wrap.className = "ssc-msg ssc-msg-user ssc-anim-in";
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
      wrap.className = "ssc-msg ssc-msg-bot ssc-anim-in";
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
      wrap.className = "ssc-msg ssc-msg-bot ssc-products ssc-anim-in";
      const cardsHtml = products.map(p => `
        <div class="ssc-card">
          <div class="ssc-card-img">${p.image}</div>
          <div class="ssc-card-name">${escapeHtml(p.name)}</div>
          <div class="ssc-card-price">₹${p.price.toLocaleString("en-IN")} <s>₹${p.mrp.toLocaleString("en-IN")}</s></div>
          <div class="ssc-card-meta">⭐ ${p.rating} · ${p.stock > 0 ? p.stock + " in stock" : "Out of stock"}</div>
          <button class="ssc-card-btn" data-id="${p.id}">Add to cart</button>
        </div>
      `).join("");
      wrap.innerHTML = `<span class="ssc-avatar-sm">🤖</span><div class="ssc-card-row">${cardsHtml}</div>`;
      wrap.querySelectorAll(".ssc-card-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const product = products.find(p => p.id === btn.dataset.id);
          this._addToCart(product);
          btn.textContent = "Added ✓";
          btn.disabled = true;
        });
      });
      this.messagesEl.appendChild(wrap);
      this._scrollToBottom();
    }

    _pushComparisonCard(a, b) {
      const wrap = document.createElement("div");
      wrap.className = "ssc-msg ssc-msg-bot ssc-anim-in";
      const row = (label, av, bv) => `
        <div class="ssc-compare-row">
          <span class="ssc-compare-label">${label}</span>
          <span class="ssc-compare-val">${av}</span>
          <span class="ssc-compare-val">${bv}</span>
        </div>`;
      wrap.innerHTML = `
        <span class="ssc-avatar-sm">🤖</span>
        <div class="ssc-compare-card">
          <div class="ssc-compare-row ssc-compare-head">
            <span></span>
            <span>${a.image} ${escapeHtml(a.name)}</span>
            <span>${b.image} ${escapeHtml(b.name)}</span>
          </div>
          ${row("Price", "₹" + a.price.toLocaleString("en-IN"), "₹" + b.price.toLocaleString("en-IN"))}
          ${row("Rating", "⭐ " + a.rating, "⭐ " + b.rating)}
          ${row("Stock", a.stock > 0 ? a.stock + " left" : "Out of stock", b.stock > 0 ? b.stock + " left" : "Out of stock")}
        </div>
      `;
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