// ---------------- Room Preview (Lite) ----------------
// Honest scope note: this is a photo-overlay mockup, NOT real AR. There's
// no camera tracking, depth sensing, or 3D — just a draggable, resizable
// 2D placement of the product over a photo the shopper uploads. Real AR
// would need per-product 3D models (GLB/USDZ) and WebXR/ARKit/ARCore,
// which is a separate asset pipeline, not a widget feature.
_handleRoomPreview() {
  if (this.lastResults.length === 0) {
    this._pushBotMessage('Search for a product first (try something from Home or Electronics), then say "preview this in my room".');
    return;
  }

  const product = this.lastResults[0];

  this._pushBotMessage(
    `Opening Room Preview for "${product.name}" — this is a simple photo mockup, not real AR, but it'll give you a rough sense of scale and placement.`
  );

  this._openRoomPreviewModal(product);
}

_openRoomPreviewModal(product) {
  if (this._roomModal) this._roomModal.remove();

  const modal = document.createElement("div");
  modal.className = "ssc-room-modal";

  modal.innerHTML = `
    <div class="ssc-room-panel">
      <div class="ssc-room-header">
        <div>
          <div class="ssc-room-title">Room Preview — ${escapeHtml(product.name)}</div>
          <div class="ssc-room-badge">Photo mockup, not real AR</div>
        </div>
        <button type="button" class="ssc-icon-btn ssc-room-close" aria-label="Close room preview">✕</button>
      </div>

      <div class="ssc-room-canvas">
        <div class="ssc-room-empty">Upload a photo of your room to get started</div>
        <div class="ssc-room-item" style="display:none;">${product.image}</div>
      </div>

      <div class="ssc-room-controls">
        <label class="ssc-room-upload">
          📷 Upload room photo
          <input type="file" accept="image/*" class="ssc-room-file" hidden />
        </label>

        <label class="ssc-room-size-label">
          Size
          <input type="range" min="40" max="220" value="90" class="ssc-room-size" />
        </label>
      </div>

      <div class="ssc-room-hint">
        Drag the item to position it. This is a rough visual aid only — actual size,
        lighting, and color may differ.
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  this._roomModal = modal;
  this._bindRoomPreviewEvents(modal);
}

_bindRoomPreviewEvents(modal){
  const canvas = modal.querySelector(".ssc-room-canvas");
  const emptyLabel = modal.querySelector(".ssc-room-empty");
  const itemEl = modal.querySelector(".ssc-room-item");
  const fileInput = modal.querySelector(".ssc-room-file");
  const sizeSlider = modal.querySelector(".ssc-room-size");
  const closeBtn = modal.querySelector(".ssc-room-close");

  closeBtn.addEventListener("click", () => {
    modal.remove();
    this._roomModal = null;
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      canvas.style.backgroundImage = `url(${reader.result})`;
      emptyLabel.style.display = "none";
      itemEl.style.display = "flex";
      itemEl.style.left = "40%";
      itemEl.style.top = "40%";
    };

    reader.readAsDataURL(file);
  });

  sizeSlider.addEventListener("input", () => {
    itemEl.style.fontSize = sizeSlider.value + "px";
  });

  itemEl.style.fontSize = sizeSlider.value + "px";

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const startDrag = (clientX, clientY) => {
    const rect = itemEl.getBoundingClientRect();
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;
    dragging = true;
  };

  const moveDrag = (clientX, clientY) => {
    if (!dragging) return;

    const canvasRect = canvas.getBoundingClientRect();

    let x = clientX - canvasRect.left - offsetX;
    let y = clientY - canvasRect.top - offsetY;

    x = Math.max(0, Math.min(x, canvasRect.width - itemEl.offsetWidth));
    y = Math.max(0, Math.min(y, canvasRect.height - itemEl.offsetHeight));

    itemEl.style.left = x + "px";
    itemEl.style.top = y + "px";
  };

  const endDrag = () => {
    dragging = false;
  };

  itemEl.addEventListener("mousedown", (e) => startDrag(e.clientX, e.clientY));
  window.addEventListener("mousemove", (e) => moveDrag(e.clientX, e.clientY));
  window.addEventListener("mouseup", endDrag);

  itemEl.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      startDrag(t.clientX, t.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      const t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    },
    { passive: true }
  );

  window.addEventListener("touchend", endDrag);
}