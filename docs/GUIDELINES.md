# Conversational Design & Safety Guidelines

Practical guidelines for keeping this assistant trustworthy, useful, and
consistent as you extend it — written for whoever owns the chatbot after
handoff (product, support, or engineering).

## 1. Never break verbatim transparency

The whole point of this widget is that the shopper's own words are never
silently altered. If you extend the code:

- Always render user input with `textContent`, never `innerHTML`.
- Never "clean up" or paraphrase what the user typed before showing it.
- If you add spell-correction or query rewriting for *search purposes*,
  show the correction as a visible, separate line (e.g. "Searching for:
  wireless earbuds") — don't overwrite the ticket that shows what they
  actually typed.

## 2. Voice and tone

- Plain, direct sentences. No corporate filler ("We're thrilled to...").
- Say what happened and what to do next — especially in errors: "I couldn't
  find an order with that ID. Double-check it from your confirmation email."
  not "Oops! Something went wrong 😅."
- Keep the assistant's vocabulary consistent with your storefront's own
  wording — if your site says "Orders," the bot should too, not "Purchases."

## 3. Escalate, don't stall

If the assistant doesn't understand after one clarifying attempt, offer a
human handoff rather than guessing repeatedly. Repeated wrong guesses erode
trust faster than a quick "let me connect you to a person."

## 4. Data and privacy

- Don't have the bot ask for or display full payment card numbers, passwords,
  or OTPs under any circumstance — legitimate order/account tools never need
  these in a chat box.
- Scope every order lookup to the authenticated session (see Integration
  Guide, section 3) — a chat box should never become a way to look up
  someone else's order by guessing an ID.
- If you log transcripts server-side for quality review, disclose this in
  your privacy policy and link it from the widget footer.

## 5. Accessibility

- Keep visible focus outlines (already in `style.css`) — don't remove them
  for aesthetics.
- Keep `aria-live="polite"` on the message log so screen readers announce
  new bot messages without interrupting the user mid-typing.
- Respect `prefers-reduced-motion` (already handled) if you add new
  animations.

## 6. Internationalization

- All customer-facing strings currently live as inline text in `chatbot.js`
  for clarity in this reference build. For a multi-locale rollout, move them
  into a strings/locale map (e.g. `strings.en.json`, `strings.hi.json`) and
  select by the page's locale.
- Currency formatting already uses `toLocaleString("en-IN")` for the demo
  catalog — swap the locale/currency code to match each market.

## 7. Testing before every release

- Run through the "Quick start" test messages in the README.
- Test with a screen reader.
- Test on a throttled mobile connection (the widget should still open fast;
  it has no external JS dependencies besides fonts).
- Test the human-handoff path end-to-end, not just that the message appears.
