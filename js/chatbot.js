/**
 * ShopSphere AI Assistant — Embeddable E-commerce Chatbot Engine (v5)
 * ----------------------------------------------------------------
 * Core principle: VERBATIM TRANSPARENCY.
 * Every single message the shopper types is captured and rendered
 * back EXACTLY as typed — no autocorrect, no paraphrasing, no silent
 * "interpretation" — before the assistant acts on it.
 *
 * v5 additions: Wishlist, order address change, Hindi language toggle,
 * price-drop alerts (with a live simulated demo notification).
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

  const CITIES = [
    { name: "Bengaluru", lat: 12.9716, lon: 77.5946, eta: "1–2 business days" },
    { name: "Mumbai", lat: 19.0760, lon: 72.8777, eta: "2–3 business days" },
    { name: "Delhi NCR", lat: 28.6139, lon: 77.2090, eta: "2–3 business days" },
    { name: "Chennai", lat: 13.0827, lon: 80.2707, eta: "1–2 business days" },
    { name: "Kolkata", lat: 22.5726, lon: 88.3639, eta: "3–4 business days" },
    { name: "Kochi", lat: 9.9312, lon: 76.2673, eta: "1–2 business days" },
    { name: "Hyderabad", lat: 17.3850, lon: 78.4867, eta: "2 business days" },
    { name: "Kollam", lat: 8.8932, lon: 76.6141, eta: "1–2 business days" }
  ];

  const INTEREST_TAGS = {
    cooking: ["kitchen", "coffee", "appliance", "home"],
    fitness: ["fitness", "sports", "tracker", "running"],
    tech: ["electronics", "laptop", "audio", "wireless"],
    fashion: ["fashion", "clothing", "footwear"],
    home: ["home", "furniture"],
    beauty: ["beauty", "skincare", "cosmetics"],
    travel: ["travel", "bag", "hiking"]
  };

  const THEME_TAGS = {
    gym: ["fitness", "sports", "tracker"],
    "home gym": ["fitness", "sports", "tracker"],
    office: ["laptop", "work", "electronics"],
    kitchen: ["kitchen", "home", "appliance", "coffee"],
    wardrobe: ["fashion", "clothing", "footwear"],
    travel: ["travel", "bag", "hiking"],
    skincare: ["beauty", "skincare", "cosmetics"]
  };

  const BUNDLES = {
    fitness: { label: "Home Fitness Box", tags: ["fitness", "sports", "tracker"], discount: 0.07 },
    travel: { label: "Travel Essentials Box", tags: ["travel", "bag", "hiking"], discount: 0.05 },
    coffee: { label: "Coffee Lover's Box", tags: ["coffee", "kitchen", "appliance"], discount: 0.05 },
    audio: { label: "Audio Starter Box", tags: ["audio", "wireless", "bluetooth"], discount: 0.05 },
    skincare: { label: "Skincare Starter Box", tags: ["beauty", "skincare", "cosmetics"], discount: 0.05 }
  };

  const TRENDING_SEARCHES = [
    { term: "wireless earbuds", count: 128 },
    { term: "running shoes", count: 94 },
    { term: "4K smart TV", count: 76 },
    { term: "coffee maker", count: 61 },
    { term: "fitness tracker", count: 55 }
  ];

  const REPAIR_TIPS = {
    electronics: {
      tip: "First try a full charge cycle (leave it plugged in for at least 2 hours, even if it seems completely dead), check the charging cable and port for lint or damage, and try a factory reset if the device supports one. A large share of \"broken\" electronics are software glitches, not hardware failures.",
      service: "our authorized service center (see Warranty & Service on the product page)"
    },
    footwear: {
      tip: "For sole separation, torn stitching, or worn treads, a local cobbler can usually repair it for a fraction of replacement cost — resoling typically runs 10–20% of a new pair's price.",
      service: "a local cobbler"
    },
    fashion: {
      tip: "Loose seams, missing buttons, or small tears are almost always cheaper to repair or alter than to replace — a tailor can usually fix these in a day.",
      service: "a local tailor"
    },
    home: {
      tip: "For furniture and home appliances, check if the issue is a loose connection, worn part, or simple wear-and-tear first — many issues are fixed with a single replacement part rather than the whole item.",
      service: "a home appliance repair technician"
    },
    beauty: {
      tip: "If a pump or applicator has stopped working but the product itself is fine, it's often just clogged — try rinsing the nozzle in warm water before assuming the product is unusable.",
      service: "our customer care team"
    },
    travel: {
      tip: "For zippers, straps, or seams on bags and backpacks, most issues can be repaired by a luggage/leather repair shop for far less than a replacement.",
      service: "a local luggage repair shop"
    },
    default: {
      tip: "Before replacing it, it's worth checking if the issue is something simple and fixable rather than a full failure.",
      service: "our customer care team"
    }
  };

  const FUTURE_PREDICTIONS = [
    { text: "Your GlowSkin Vitamin C Serum was delivered on 12 Jul 2026 — most shoppers repurchase around the 60-day mark, so you're likely due again by mid-September.", reorder: "GlowSkin Vitamin C Serum" },
    { text: "Your AirFlow Pro Wireless Earbuds are approaching the 1-year mark soon — battery health typically starts declining around then, worth testing your charge time.", reorder: "AirFlow Pro Wireless Earbuds" },
    { text: "Running shoes are generally due for replacement every 500–700 km of use — if your UrbanFit pair has seen regular use since your order, it may be worth checking the tread wear.", reorder: "UrbanFit Running Shoes" }
  ];

  const STRINGS = {
    en: {
      greeting: "Hi! I'm your ShopSphere shopping assistant. Ask me to find a product, compare items, track an order, plan a budget, manage your wishlist, or change a delivery address — I'll always show exactly what you typed before I act on it.",
      langSwitched: "Sure, I'll reply in Hindi from now on. Type \"English\" any time to switch back.",
      langSwitchedBack: "Switched back to English.",
      cartEmpty: "Your cart is empty. Search for something and say \"add to cart\" to get started.",
      wishlistEmpty: "Your wishlist is empty. Search for something and say \"save for later\" to add items.",
      askOrderId: "Sure — could you share your order ID? It looks like ORD1001 and is in your order confirmation email.",
      orderNotFound: (id) => `I couldn't find an order with ID "${id}". Please double-check the ID from your confirmation email, or say "talk to a human" for help.`
    },
    hi: {
      greeting: "नमस्ते! मैं आपका ShopSphere शॉपिंग असिस्टेंट हूं। मुझसे कोई प्रोडक्ट खोजने, तुलना करने, ऑर्डर ट्रैक करने, बजट प्लान करने, विशलिस्ट या डिलीवरी एड्रेस बदलने के लिए कह सकते हैं — मैं हमेशा आपने जो टाइप किया है वही दिखाऊंगा।",
      langSwitched: "ठीक है, अब से मैं हिंदी में जवाब दूंगा। वापस अंग्रेज़ी में जाने के लिए कभी भी \"English\" टाइप करें।",
      langSwitchedBack: "अंग्रेज़ी में वापस आ गया।",
      cartEmpty: "आपकी कार्ट खाली है। कुछ खोजें और \"add to cart\" कहें।",
      wishlistEmpty: "आपकी विशलिस्ट खाली है। कुछ खोजें और \"save for later\" कहें।",
      askOrderId: "ज़रूर — क्या आप अपनी ऑर्डर आईडी बता सकते हैं? यह ORD1001 जैसी दिखती है और आपके ऑर्डर कन्फर्मेशन ईमेल में है।",
      orderNotFound: (id) => `मुझे "${id}" आईडी वाला कोई ऑर्डर नहीं मिला। कृपया अपने कन्फर्मेशन ईमेल से आईडी दोबारा जांचें, या मदद के लिए "talk to a human" कहें।`
    }
  };

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
    if (needleWord.length < 4) return false;
    return levenshtein(haystackWord, needleWord) <= 2;
  }

  function detectSentiment(text) {
    const lower = text.toLowerCase();
    return FRUSTRATION_WORDS.some(w => lower.includes(w)) ? "frustrated" : "neutral";
  }

  function parseLargestNumber(raw) {
    const nums = raw.replace(/,/g, "").match(/\d+/g);
    if (!nums) return null;
    return Math.max(...nums.map(Number));
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const toRad = d => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function nearestCity(lat, lon) {
    let best = null, bestDist = Infinity;
    CITIES.forEach(c => {
      const d = haversineKm(lat, lon, c.lat, c.lon);
      if (d < bestDist) { bestDist = d; best = c; }
    });
    return best;
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

    if (/deliver(y)?.*(my location|here|current location)|check delivery.*(location)|eta.*(my location)|when will it (arrive|reach) (me|here)/i.test(text)) {
      return { type: "locate_delivery" };
    }

    if (/\b(broke|broken|not working|stopped working|isn'?t working|doesn'?t work|damaged|torn|malfunctioning|won'?t (turn on|charge)|stopped charging)\b/i.test(text)) {
      return { type: "repair_check", raw: text };
    }

    if (/replacement option|show me (a |the )?replacement|just replace it|skip the fix/i.test(text)) {
      return { type: "show_replacement" };
    }

    if (/^(speak|talk|reply) (to me )?in hindi$|^hindi$|हिंदी/i.test(text)) {
      return { type: "lang_hindi" };
    }

    if (/^(speak|talk|reply) (to me )?in english$|^english$/i.test(text)) {
      return { type: "lang_english" };
    }

    if (/save (this |it )?for later|add (this |it )?to (my )?wishlist|add to wishlist/i.test(text)) {
      return { type: "add_wishlist" };
    }

    if (/^(view|show|open)\s+(my\s+)?wishlist$|what'?s in my wishlist/i.test(text)) {
      return { type: "view_wishlist" };
    }

    if (/^(clear|empty)\s+(my\s+)?wishlist$/i.test(text)) {
      return { type: "clear_wishlist" };
    }

    if (/change (my )?(delivery )?address|update (my )?(delivery )?address|modify (my )?order|wrong address/i.test(text)) {
      return { type: "change_address" };
    }

    if (/notify me (if|when)|price (drop )?alert|alert me (if|when)|track (the )?price|let me know if.*(price|cheaper)/i.test(text)) {
      return { type: "price_alert" };
    }

    if (/predict|future (need|purchase)|what will i need|running low|due for (a )?replacement|remind me (about|when)/i.test(text)) {
      return { type: "future_you" };
    }

    if (/trending|popular|what.*(others|people|shoppers).*(buying|searching|looking)/i.test(text)) {
      return { type: "trending" };
    }

    if (/\b(build|create|make)\b.*\b(box|bundle)\b|bundle me/i.test(text)) {
      return { type: "box_builder", raw: text };
    }

    if (/\b(build|set up|setup)\b.*\b(gym|office|kitchen|wardrobe|travel kit)\b|\bunder ₹?\d+|budget of/i.test(text)) {
      return { type: "goal_shopping", raw: text };
    }

    if (/gift|suggest something|help me (choose|pick|find|decide)|not sure what to (get|buy)|recommend something/i.test(text)) {
      return { type: "consultant_start" };
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
      return { type: "add_to_cart" };
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

  function productsByTags(catalog, tags) {
    return catalog.filter(p => p.tags.some(t => tags.includes(t)));
  }

  class ShopSphereChat {
    constructor(opts) {
      this.opts = Object.assign({
        brand: "ShopSphere",
        themeColor: "#1A2B4C",
        accentColor: "#FF9F1C",
        catalog: window.SHOPSPHERE_PRODUCTS || [],
        greetingMessage: STRINGS.en.greeting
      }, opts);

      this.transcript = [];
      this.awaitingOrderId = false;
      this.lastResults = [];
      this.cart = [];
      this.darkMode = false;
      this.consultant = null;
      this.lastRepairCategory = null;
      this.wishlist = [];
      this.language = "en";
      this.addressChange = null;
      this.priceAlerts = [];

      this._buildDOM();
      this._bindEvents();
      this._pushBotMessage(this.opts.greetingMessage, this._quickReplies());
    }

    _t(key) {
      const dict = STRINGS[this.language] || STRINGS.en;
      return dict[key] !== undefined ? dict[key] : STRINGS.en[key];
    }

    _quickReplies() {
      return ["My earbuds stopped working", "Help me pick a gift", "Save this for later", "Change my delivery address"];
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
      this._pushVerbatim(raw);
      this.transcript.push({ role: "user", text: raw, time: timeNow() });

      this._showTyping();
      window.setTimeout(() => {
        this._hideTyping();
        this._respondTo(raw);
      }, 450 + Math.random() * 350);
    }

    _respondTo(raw) {
      if (detectSentiment(raw) === "frustrated") {
        this._pushBotMessage("I'm sorry this hasn't gone well — that's frustrating, and I want to help sort it out quickly. I can connect you with a human agent right now, or try to resolve it here first.", ["Talk to a human", "Try to help me here"]);
        return;
      }

      if (this.awaitingOrderId) {
        this.awaitingOrderId = false;
        const idMatch = raw.match(/ORD\d{3,}/i);
        if (idMatch) return this._resolveOrder(idMatch[0].toUpperCase());
      }

      if (this.consultant) {
        return this._continueConsultant(raw);
      }

      if (this.addressChange) {
        return this._continueAddressChange(raw);
      }

      const intent = detectIntent(raw);

      switch (intent.type) {
        case "greeting":
          this._pushBotMessage("Hello! What can I help you with — finding a product, comparing options, tracking an order, or planning a purchase?", this._quickReplies());
          break;

        case "lang_hindi":
          this.language = "hi";
          this._pushBotMessage(this._t("langSwitched"));
          break;

        case "lang_english":
          this.language = "en";
          this._pushBotMessage(this._t("langSwitchedBack"));
          break;

        case "add_wishlist": {
          if (this.lastResults.length === 0) {
            this._pushBotMessage("Search for a product first, then tell me to save it for later.");
            break;
          }
          const item = this.lastResults[0];
          if (!this.wishlist.find(p => p.id === item.id)) this.wishlist.push(item);
          this._pushBotMessage(`Saved "${item.name}" to your wishlist.`, ["View wishlist", "Keep shopping"]);
          break;
        }

        case "view_wishlist": {
          if (this.wishlist.length === 0) {
            this._pushBotMessage(this._t("wishlistEmpty"));
            break;
          }
          this._pushBotMessage("Here's what's in your wishlist:");
          this._pushProductCards(this.wishlist);
          break;
        }

        case "clear_wishlist":
          this.wishlist = [];
          this._pushBotMessage("Your wishlist is now empty.");
          break;

        case "change_address":
          this.addressChange = { step: "orderId" };
          this._pushBotMessage("Sure — which order needs the address updated? Share the order ID (looks like ORD1001).");
          break;

        case "price_alert":
          this._handlePriceAlert();
          break;

        case "track_order":
          if (intent.orderId) {
            this._resolveOrder(intent.orderId);
          } else {
            this.awaitingOrderId = true;
            this._pushBotMessage(this._t("askOrderId"));
          }
          break;

        case "locate_delivery":
          this._handleLocationDelivery();
          break;

        case "repair_check":
          this._handleRepairCheck(intent.raw);
          break;

        case "show_replacement":
          this._handleShowReplacement();
          break;

        case "future_you":
          this._pushFutureYou();
          break;

        case "trending":
          this._pushTrending();
          break;

        case "box_builder":
          this._handleBoxBuilder(intent.raw);
          break;

        case "goal_shopping":
          this._handleGoalShopping(intent.raw);
          break;

        case "consultant_start":
          this.consultant = { step: "interest" };
          this._pushBotMessage("Happy to help you pick something! What's it for, or what does the person enjoy — cooking, fitness, tech, fashion, home, beauty, or travel?", ["Cooking", "Fitness", "Tech", "Home"]);
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
          this._pushBotMessage(`I want to make sure I get this right — you said: "${raw}". I can help with product search, comparisons, order tracking, gift picks, budget planning, or your cart. Which one fits best?`, this._quickReplies());
      }
    }

    _continueConsultant(raw) {
      if (this.consultant.step === "interest") {
        this.consultant.interest = raw.toLowerCase().trim();
        this.consultant.step = "budget";
        this._pushBotMessage("Great — and what's your budget? For example: under 1000, 1000 to 3000, or above 3000.");
        return;
      }

      if (this.consultant.step === "budget") {
        const interest = this.consultant.interest;
        const budget = parseLargestNumber(raw);
        const interestKey = Object.keys(INTEREST_TAGS).find(k => interest.includes(k)) || null;
        const tags = interestKey ? INTEREST_TAGS[interestKey] : [];
        let candidates = tags.length ? productsByTags(this.opts.catalog, tags) : searchProducts(interest, this.opts.catalog);

        if (budget) {
          const withinBudget = candidates.filter(p => p.price <= budget);
          candidates = withinBudget.length ? withinBudget : candidates;
        }
        candidates.sort((a, b) => b.rating - a.rating);

        this.consultant = null;

        if (candidates.length === 0) {
          this._pushBotMessage(`I couldn't find a confident match for "${interest}" — want to just search directly instead?`, ["Search for shoes", "Search for laptop"]);
          return;
        }

        const pick = candidates[0];
        this._pushBotMessage(`Based on that, here's my top pick:`);
        this._pushProductCards([pick]);
        this.lastResults = [pick];
      }
    }

    _handleLocationDelivery() {
      if (!navigator.geolocation) {
        this._pushBotMessage("Your browser doesn't support location access — you can still check delivery time by entering your pincode on the checkout page.");
        return;
      }
      this._pushBotMessage("Locating you now — please allow location access if your browser prompts you.");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const city = nearestCity(pos.coords.latitude, pos.coords.longitude);
          this._pushBotMessage(`Looks like you're closest to ${city.name}. Estimated delivery time to your area: ${city.eta}.`);
        },
        () => {
          this._pushBotMessage("I couldn't access your location — that's fine, you can still check delivery time by entering your pincode at checkout.");
        },
        { timeout: 8000 }
      );
    }

    _handleRepairCheck(raw) {
      const match = searchProducts(raw, this.opts.catalog)[0];
      const category = match ? match.category : null;
      const tips = REPAIR_TIPS[category] || REPAIR_TIPS.default;
      this.lastRepairCategory = category;

      const itemLine = match ? `It sounds like this might be about your ${match.name}. ` : "";
      this._pushBotMessage(
        `${itemLine}Before you replace it, here's something worth trying: ${tips.tip} If that doesn't resolve it, ${tips.service} can usually help.`,
        ["Show me replacement options", "I'll try the fix first", "Talk to a human"]
      );
    }

    _handleShowReplacement() {
      const category = this.lastRepairCategory;
      const candidates = category
        ? this.opts.catalog.filter(p => p.category === category).sort((a, b) => b.rating - a.rating)
        : [];

      if (candidates.length === 0) {
        this._pushBotMessage("Tell me what you're looking to replace and I'll pull up some options.");
        return;
      }
      this._pushBotMessage("No problem — here are some options if you'd rather replace it:");
      this._pushProductCards(candidates.slice(0, 4));
      this.lastResults = candidates.slice(0, 4);
    }

    _continueAddressChange(raw) {
      if (this.addressChange.step === "orderId") {
        const idMatch = raw.match(/ORD\d{3,}/i);
        if (!idMatch) {
          this._pushBotMessage("That doesn't look like an order ID — it should look like ORD1001. Could you share it again?");
          return;
        }
        const orderId = idMatch[0].toUpperCase();
        if (!ORDER_DB[orderId]) {
          this.addressChange = null;
          this._pushBotMessage(this._t("orderNotFound")(orderId));
          return;
        }
        if (ORDER_DB[orderId].status === "Delivered" || ORDER_DB[orderId].status === "Out for delivery") {
          this.addressChange = null;
          this._pushBotMessage(`Order ${orderId} is already ${ORDER_DB[orderId].status.toLowerCase()} — the address can no longer be changed for this one. For a correction at this stage, I'd recommend contacting the courier directly or talking to a human agent.`, ["Talk to a human"]);
          return;
        }
        this.addressChange.orderId = orderId;
        this.addressChange.step = "address";
        this._pushBotMessage(`Got it — order ${orderId}. What's the new delivery address?`);
        return;
      }

      if (this.addressChange.step === "address") {
        const orderId = this.addressChange.orderId;
        this.addressChange = null;
        this._pushBotMessage(`Done — the delivery address for order ${orderId} has been updated to:\n"${raw}"\n\nYou'll get a confirmation email shortly.`, ["Track my order", "Anything else?"]);
      }
    }

    _handlePriceAlert() {
      if (this.lastResults.length === 0) {
        this._pushBotMessage('Search for a product first, then say "notify me if the price drops".');
        return;
      }
      const product = this.lastResults[0];
      this.priceAlerts.push(product);
      this._pushBotMessage(
        `Done — I'll let you know if the price on "${product.name}" drops. (Demo: simulating a price drop in a few seconds so you can see how the alert looks.)`
      );
      window.setTimeout(() => {
        const droppedPrice = Math.round(product.price * 0.85);
        this._pushBotMessage(
          `🔔 Price drop alert: "${product.name}" is now ₹${droppedPrice.toLocaleString("en-IN")} (was ₹${product.price.toLocaleString("en-IN")}) — ${Math.round((1 - droppedPrice / product.price) * 100)}% off.`,
          ["Add to cart", "View product"]
        );
      }, 5000);
    }

    _pushFutureYou() {
      const lines = FUTURE_PREDICTIONS.map(p => `• ${p.text}`);
      this._pushBotMessage(
        `Based on typical usage patterns for your past orders, here's what I'm predicting you might need soon:\n${lines.join("\n")}`,
        FUTURE_PREDICTIONS.map(p => `Reorder ${p.reorder}`)
      );
    }

    _handleGoalShopping(raw) {
      const budget = parseLargestNumber(raw);
      const themeKey = Object.keys(THEME_TAGS).find(k => raw.includes(k));

      if (!themeKey || !budget) {
        this._pushBotMessage('Tell me a theme and a budget together, like "set up a home gym under 5000" or "plan my kitchen under 4000".');
        return;
      }

      const tags = THEME_TAGS[themeKey];
      const candidates = productsByTags(this.opts.catalog, tags).sort((a, b) => a.price - b.price);

      const plan = [];
      let total = 0;
      for (const p of candidates) {
        if (total + p.price <= budget) {
          plan.push(p);
          total += p.price;
        }
      }

      if (plan.length === 0) {
        this._pushBotMessage(`I couldn't fit anything for "${themeKey}" within ₹${budget.toLocaleString("en-IN")} — try raising the budget a bit.`);
        return;
      }

      const lines = plan.map(p => `• ${p.name} — ₹${p.price.toLocaleString("en-IN")}`);
      const remaining = budget - total;
      this._pushBotMessage(
        `Here's a ${themeKey} starter plan within ₹${budget.toLocaleString("en-IN")}:\n${lines.join("\n")}\n\nRunning total: ₹${total.toLocaleString("en-IN")} — ₹${remaining.toLocaleString("en-IN")} left in your budget.`,
        ["Add all to cart", "Show more options"]
      );
      this.lastResults = plan;
    }

    _handleBoxBuilder(raw) {
      const key = Object.keys(BUNDLES).find(k => raw.includes(k) || raw.includes(BUNDLES[k].label.toLowerCase()));
      if (!key) {
        const available = Object.values(BUNDLES).map(b => b.label).join(", ");
        this._pushBotMessage(`I have these curated boxes available: ${available}. Try "build me a ${Object.keys(BUNDLES)[0]} box".`);
        return;
      }
      const bundle = BUNDLES[key];
      const items = productsByTags(this.opts.catalog, bundle.tags).slice(0, 3);
      if (items.length === 0) {
        this._pushBotMessage(`I couldn't assemble the ${bundle.label} right now — the catalog doesn't have matching items yet.`);
        return;
      }
      const subtotal = items.reduce((sum, p) => sum + p.price, 0);
      const discounted = Math.round(subtotal * (1 - bundle.discount));
      const lines = items.map(p => `• ${p.name} — ₹${p.price.toLocaleString("en-IN")}`);
      this._pushBotMessage(
        `${bundle.label}:\n${lines.join("\n")}\n\nBundle price: ₹${discounted.toLocaleString("en-IN")} (${Math.round(bundle.discount * 100)}% off ₹${subtotal.toLocaleString("en-IN")})`,
        ["Add box to cart", "Keep shopping"]
      );
      this.lastResults = items;
    }

    _pushTrending() {
      const top = [...TRENDING_SEARCHES].sort((a, b) => b.count - a.count).slice(0, 3);
      const lines = top.map(t => `• "${t.term}" — searched by ${t.count} shoppers this week`);
      this._pushBotMessage(`Here's what's trending right now:\n${lines.join("\n")}`, top.map(t => `Search for ${t.term}`));
    }

    _resolveOrder(orderId) {
      const order = ORDER_DB[orderId];
      if (order) {
        this._pushBotMessage(
          `Order ${orderId} — ${order.item}\nStatus: ${order.status}\nEstimated: ${order.eta}\nCarrier: ${order.carrier} (${order.tracking})`
        );
      } else {
        this._pushBotMessage(this._t("orderNotFound")(orderId));
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
        this._pushBotMessage(this._t("cartEmpty"));
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
      wrap.querySelector(".ssc-ticket-body").textContent = raw;
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
          <button class="ssc-card-btn" data-id="${p.id}" data-action="cart">Add to cart</button>
          <button class="ssc-card-btn ssc-card-btn-secondary" data-id="${p.id}" data-action="wishlist">Save for later</button>
        </div>
      `).join("");
      wrap.innerHTML = `<span class="ssc-avatar-sm">🤖</span><div class="ssc-card-row">${cardsHtml}</div>`;
      wrap.querySelectorAll(".ssc-card-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const product = products.find(p => p.id === btn.dataset.id);
          if (btn.dataset.action === "wishlist") {
            if (!this.wishlist.find(p => p.id === product.id)) this.wishlist.push(product);
            btn.textContent = "Saved ✓";
          } else {
            this._addToCart(product);
            btn.textContent = "Added ✓";
          }
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