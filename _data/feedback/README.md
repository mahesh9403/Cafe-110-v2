# Table feedback → Google Form (no scripts, no extra permissions)

The `/table/feedback/` page posts each answer to a Google Form owned by the
site maintainer. Responses collect in the Form's linked Google Sheet; the
maintainer checks it daily and forwards to the owner.

## Form setup (one time)
1. forms.google.com → Blank form → title "Cafe OneTen — Table feedback".
2. Questions (none required), titles exactly:
   - Linear scale 1–10: Food · Coffee & drinks · Service · Ambience · Value for money
   - Paragraph: Comments
   - Short answer: Phone (optional)
3. Settings → Responses: do not collect emails; "Limit to 1 response" off.
4. Responses → Link to Sheets → new spreadsheet.
5. ⋮ → Get pre-filled link → 5 on every scale, "x" in both text fields → copy link.

## Wiring
Every question lives in ONE place: the `FEEDBACK` config at the top of the
feedback section in `js/table.js`. The page renders itself from it; the HTML
(`table/feedback/index.html`) holds only an empty `<ul id="fb-questions">`.

```js
var FEEDBACK = {
  action: '…/formResponse',          // /viewform… replaced by /formResponse
  questions: [
    { key:'food', type:'scale', label:'Food', entry:'entry.1008664597' },
    … one entry per question, in display order …
  ]
};
```

Each question has `key` (any unique id), `type`, `label`, `entry`, plus:
- `type:'scale'` — 1–10 meter. Optional `min`/`max` change the range.
- `type:'text'` — multi-line comment box.
- `type:'phone'` — optional +91 10-digit number.
- `type:'choice'` — single-select pills; add `options:['A','B','C']`. The
  chosen option **text** is what gets sent.
- `hint:'(optional)'` — muted note shown after the label.

## Changing questions
1. **Rename / reword:** change the question text in the Google Form, then
   update that question's `label` (and `hint`) in `FEEDBACK.questions` to match.
2. **Add a question:** add it in the Google Form first, then get its `entry.NNN`
   id via ⋮ → *Get pre-filled link* (fill the new field, copy the link, read the
   `entry.NNN` for it). Add a new `{…}` object to `FEEDBACK.questions` in the
   spot you want it to appear.
3. **Remove a question:** delete it in the Google Form and delete its object
   from `FEEDBACK.questions`. Leave the other entry ids untouched.
4. **Bump the cache:** change `table.js?v=` (e.g. `2611h` → `2611i`) on the
   table pages so guests load the new config.

The counter ("N of M rated") and the submit rule follow the config
automatically: M is the number of `scale` questions; submit enables once any
one answer of any type is given.

The linked Sheet's **Daily view** tab references the response columns by header
and picks up a new question's column on its own — no change needed there.
