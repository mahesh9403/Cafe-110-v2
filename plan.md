# Cafe OneTen — "At your table" QR page + Gallery page (demo)

## Context
Seven Midway Plaza has a `/table/` page that guests reach by scanning a QR code on their table, and the OneTen owner liked it. We are building OneTen's version.

The two sites are built differently:
- Seven's page lives in a Next.js/React site.
- OneTen is plain HTML/CSS/vanilla JS with no build step.

So we reuse Seven's structure, its copy and its **game logic**: pure TypeScript with no dependencies, unit-tested. The React UI gets rewritten as small vanilla-JS DOM code.

We are also adding a public **Gallery** page with demo photos. Everything here is a demo until the owner locks in the real recommendations, Wi-Fi details and photos.

## Decisions (change at approval)
1. **`/table/` is a guest-only page.**
   - It has `noindex` and is left out of sitemap.xml and the site nav.
   - It has no full site nav and no footer. Instead there is a slim header with the logo and a small "Visit cafeoneten.com" link at the bottom.
   - The QR code will point to `https://cafeoneten.com/table/`.
2. **The page has no cover image.** It opens straight on the logo, a greeting that changes by time of day ("Good evening"), and the list.
3. **The list runs in this order:**
   1. **OneTen Recommendations.** 5 demo cards, each with a photo, name and one-line description, and no prices. The 5 dishes are the on-menu items that already have real photos:
      - Belgian Slice (bestseller)
      - Peri Peri Paneer Rice Bowl (bestseller)
      - Deconstructed Tiramisu
      - French Toast
      - Assorted Bread Basket

      The data sits in one small array so the owner's picks are a one-line swap.
   2. **Leave anonymous feedback**, going to `/table/feedback/`. It works the same as Seven's: one screen with 1–10 tap meters for Food, Coffee & drinks, Service, Ambience and Value, plus a comment box and an optional phone number. Pressing submit shows "Thank you". **It's a demo, like Seven's: nothing is stored or sent.** We decide on a backend before go-live.
   3. **View menu**, going to `/menu/`.
   4. **Connect to Wi-Fi.** A bottom sheet shows the network name and password, each with a Copy button. The demo values are SSID `CafeOneTen_Guest` and password `oneten@2025`.
   5. **Leave a Google review.** It links to `https://www.google.com/search?q=Cafe+OneTen#lrd=0x3bcb9322fdd55c69:0x943abc9a3b44ca2a,3`. Before going live, swap in the owner's official `g.page/r/…` review link.
   6. **Play Sudoku**, at `/table/games/sudoku/`.
   7. **Play Tic-Tac-Toe**, at `/table/games/tic-tac-toe/`. Its logic is 115 pure lines, so porting is easy and it's included.
   8. **Follow us on Instagram**, linking to `https://www.instagram.com/cafe.oneten/`.
4. **A sticky bottom bar** holds Menu, Review, Play and Directions, as on Seven's page. Directions uses the existing `share.google/jf0qLAqIIlittkf8j`.
5. **The look is OneTen's, not Seven's dark ink theme.**
   - Cards are espresso and cream with gold accents: espresso background, cream cards, gold icon tiles.
   - The column is mobile-first and 560px wide.
   - Rows are at least 72px tall, so they're easy to tap.
   - Icons are inline SVG, and fonts are the existing Cormorant, Jost and Dancing Script.
   - Styles go in `css/table.css`, loaded only on the table pages. The site-wide `style.css` stays untouched.
6. **The Gallery is public at `/gallery/`.**
   - It's added to the nav on every page, between Menu and Visit, and to sitemap.xml, sitemap-images.xml, llms.txt and SITEMAP.md.
   - The photos are the dish photos that are still on the November menu plus the 4 interior shots.
   - Three dish photos are left out because they're **not on the menu any more**: fruit cake, pavlova and chocolate strawberries.
   - A tap opens the photo in a native `<dialog>` lightbox.
   - A small "More photos coming soon" note marks it as a demo.
7. **The Instagram handle is fixed site-wide.** The FAQ and Visit pages use `instagram.com/cafeoneten`, but the real handle is `cafe.oneten`.
8. **There are no prices anywhere**, as the standing owner rule requires.

## Work breakdown (orchestrator: me)
Steps T1, T2 and T3 run in parallel because they touch different files. T4 runs after them.

| # | Agent | Scope | Files |
|---|---|---|---|
| T1 | opus-48-worker | `/table/` landing, Wi-Fi sheet with copy-to-clipboard and a fallback, recommendations, `/table/feedback/` demo form, bottom bar, time-of-day greeting | `table/index.html`, `table/feedback/index.html`, `css/table.css`, `js/table.js` |
| T2 | opus-48-worker | Port Seven's games. Strip the types from `src/lib/sudoku/{logic,game,bank}.ts` and `src/components/tictactoe/logic.ts` into ES modules, then rewrite the UIs from `SudokuGame.tsx`, `Board.tsx` and `TicTacToeGame.tsx` as vanilla DOM code. Port the existing unit tests and run them with `node --test`. Each game page links back to `/table/`. | `table/games/{sudoku,tic-tac-toe}/index.html`, `js/games/*.js`, `css/games.css`, `js/games/tests/` |
| T3 | sonnet-55-qa | `/gallery/` page, nav link on all pages, sitemap/llms/SITEMAP.md entries, Instagram handle fix, cache-buster bump | `gallery/index.html`, every page's nav, `sitemap*.xml`, `llms.txt`, `SITEMAP.md` |
| T4 | sonnet-55-qa | QA (below) | read-only |
| — | me | Review the diffs and screenshots, make a QR code SVG/PNG for `/table/` for the demo, and update `tasks/todo.md` | — |

Shared contract, fixed before the build starts:
- All the table pages link `css/table.css` and use the same header and back-link markup.
- T1 owns the header and back-link markup, and T2 copies it from this plan:
  - Header: logo `img/logo/…` plus `<a href="/table/">← Back</a>`.
- `/table/*` pages all carry `<meta name="robots" content="noindex">`.

## Verification (T4)
- **Mobile layout:** at 375×812 and 320 wide, there's no horizontal scroll, every row is reachable and tappable, and the bottom bar doesn't cover the last row.
- **Wi-Fi sheet:** the sheet opens and closes, copy works or the fallback runs, and Esc and the backdrop close it.
- **Feedback demo:** every meter is tappable, submit shows "Thank you", and **no network request** fires.
- **Sudoku:** a puzzle plays through. Wrong-cell highlighting, notes and the win state work if Seven has them. A test with a near-solved board confirms the win screen.
- **Tic-Tac-Toe:** easy and hard modes work, and hard never loses. The ported unit tests pass with `node --test`.
- **Gallery:** the grid works at 1440 and 375, the lightbox opens and closes with the keyboard, and images are lazy-loaded.
- **Nav:** it shows Gallery on every page.
- **Search engines:** `/table/` has noindex and isn't in sitemap.xml.
- **Console and prices:** there are 0 console errors and grep finds no ₹ in HTML.

## Open before go-live (not blocking the demo)
- The owner's 5 real recommendations.
- The real Wi-Fi name and password.
- The official Google review short link.
- Where feedback should go: Google Form, email or a database.
- Real gallery photos.
- Printing the QR code.
