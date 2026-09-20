# Barbell — institutional wealth operating system

A clickable, desktop-first prototype for a Korean family office with $62.4M across public and
private markets. Two accounts, one balance sheet, three arguments: a single reconciled view that
replaces Excel, one marketplace that ranks every opportunity on merit rather than by instrument wrapper, and a
members-only secondary board that gives the illiquid half a price.

No backend, no auth, no network calls. All data is seeded in `src/mockData.js` and every action
resolves against in-memory state.

## Two takes on the same product

There are two independent designs in this repository, built against **the same seeded data and the
same derived maths** — `src/mockData.js` and `src/util.js` are shared verbatim, so both show the
same family, the same 42 positions and the same numbers. Only the product design differs.

| | **Take 1** (`src/`, `/`) | **Take 2** (`take2/`) |
|---|---|---|
| Register | Light, dense, hairline institutional terminal | Modern SaaS — white cards, soft elevation, 14px radii, indigo accent |
| Navigation | Top tabs, five peer destinations | Persistent left rail; approvals live on the home screen, not a page of their own |
| Entry point | The portfolio | **Today** — the outstanding decisions, with the balance sheet one click behind |
| Portfolio | Opens on a 42-row holdings table | Opens on the *shape* of the book; rows are a tab behind the charts |
| Excel | Onboarding — a gate you pass through once | **Sync** — a standing destination; a recurring quarterly diff against the last book |
| Marketplace | One flat list ranked on merit, wrapper hidden | Grouped by the **Hanwha affiliate desk** that originates it; merit ranks within each desk |
| Secondary | A bulletin board of listings | A two-sided **exchange** — standing bids, depth and recent prints beside each listing |
| Detail | Full page per deal | Slide-over drawer, so the list never leaves |

Neither is a draft of the other. They are two answers to the same brief, meant to be compared.

**Run take 2** at `http://localhost:8777/take2/` once the server below is up, or open the
self-contained `take2.html`. Each take links to the other from its footer.

## Share it

Live, public, no login required:

**https://odk1.github.io/barbell-prototype/**

Served by GitHub Pages from `main` in this repository. Anyone with the link can open it on any
device — no Claude account, no Hanwha account, nothing to install. A `noindex` tag and a
`robots.txt` keep it out of search results, so it is unlisted rather than advertised, but the
repository itself is public: treat the URL as shareable, not secret.

To update what visitors see, push to `main` — Pages rebuilds in about a minute:

```bash
git add -A && git commit -m "…" && git push
```

To take it down: `gh api repos/oDK1/barbell-prototype/pages -X DELETE` disables the site and leaves
the code, or delete the repository to remove both.

`barbell.html` and `take2.html` in the repository root are the two prototypes inlined into
self-contained single files — email one, or drop it on any static host. Regenerate both after
changes with `python3 build.py`.

## Run it

```bash
python3 serve.py 8777
```

Then open **http://localhost:8777** — no install step, no Node required. (The app must be served
over HTTP rather than opened as a `file://` path, because the page fetches its own source files.)

The machine this was built on has no Node installed, so the prototype was written to run with
nothing but a static server: React 18 and Babel are vendored under `vendor/`, and JSX is compiled
in the browser on load. First paint takes roughly a second while Babel compiles; after that it is
a normal React app.

To move it onto Vite later: each file in `src/` is an IIFE that hangs its exports off the global
`BB` namespace. Replace the trailing `BB.x = {...}` with `export`, replace `BB.y` references with
imports, delete the `<script type="text/babel">` tags from `index.html`, and point a Vite entry at
`src/main.js`. No component code changes.

## Walk it

Start at `/` (the account switcher) or jump in anywhere:

| Route | What it is |
|---|---|
| `/` | Demo entry — pick Principal or Successor |
| `/onboarding/upload` | Excel ingestion, three staged files, four progress states |
| `/onboarding/reconcile` | Extraction review — 42 mapped, 7 exceptions that block progress |
| `/onboarding/mandate` | Four postures + the optional 8-question survey |
| `/portfolio` | The core screen — holdings by class, the model explorer, every position, plus Liquidity and Tax tabs (and an Alpha sleeve tab for the Successor) |
| `/portfolio/:assetClass` | Position level: live prices, FX attribution, concentration, trading |
| `/marketplace` | One ranked surface — listed and private judged on the same grounds |
| `/marketplace/:dealId` | Detail template serving listed and private identically |
| `/secondary` | Bulletin board + your eligibility |
| `/secondary/:listingId` | Capital account, bid flow, seller's bid queue |
| `/approvals` | Principal's inbox (read-only for the Successor) |
| `/activity` | The shared log — every state change by either account |
| `/ops` | Internal settlement ledger (footer link) |
| `/invitation?deal=…` | What a non-member sees from a shared link |

### The three flows worth walking

**Excel → reconciled book.** `/onboarding/upload` → *Review extraction* → clear all seven
exceptions (an unmatched ticker, a fund with no NAV since Q1, a duplicate across two files, an
ambiguous currency, a misfiled asset class, an unlinked capital call, a missing cost basis) →
*Set the mandate* → the portfolio.

**Opportunity → transaction.** `/marketplace` → one ranked list, a treasury ETF and a senior
secured credit facility competing on the same grounds → open any row → *Buy* opens an order ticket,
*Commit* opens a subscription; both show the allocation impact before confirmation. Switch to the
Successor and the same page carries private-market offerings only, led by "Within your authority" —
the eight that fit the $760,000 Alpha capacity and need no approval.

**Authority.** Switch to Jae-won Park (top right). Core controls render disabled with
"Core sleeve — Principal authority required." Commit $1,000,000 to Northgate Facility II — the
button becomes *Submit proposal to Principal* because it exceeds the Alpha sleeve's $760,000
capacity. Switch back, approve it in `/approvals`, and the commitment executes.

**Liquidity.** `/portfolio` → Liquidity: Q1 2027 calls of $4.67M breach projected cash by $1.40M
in Mar 27, and the agent names the positions that would cover it.

## Walk take 2

`http://localhost:8777/take2/` — five destinations in the left rail.

| Route | What it is |
|---|---|
| `#/today` | The decision surface. Hero total, four tiles, and one queue holding the Principal's approvals, the unread spreadsheets, the cash shortfall, the drift breach and the stale marks |
| `#/book` | Allocation · Guidance · Liquidity · Performance · Positions. Charts first; the 42 rows are the last tab |
| `#/offerings` | 34 instruments grouped by the Hanwha affiliate that originates them; detail opens in a drawer |
| `#/exchange` | The secondary as a live book — listings left, depth and prints right |
| `#/sync` | Drop → extract → resolve seven exceptions → apply. The diff, then the book |
| `#/activity` | The shared log across both accounts |

### The three flows worth walking

**Excel as a recurring event.** `#/sync` → *Read the files* → *Accept every suggestion* →
*Apply to the book*. The right rail shows exactly what will change before you commit it, and the
book, the totals, the allocation and the drift all move together afterwards. The diff is anchored
to the real seeded positions, so what the screen promises is what the store applies — to the dollar.

**Desk, then merit.** `#/offerings` → Hanwha Life Insurance carries the general account's private
credit and real assets; Hanwha Asset Management carries the funds and ETFs; Hanwha Securities the
listed book and the structured notes; Hanwha Investment Partners the private equity and venture.
Open any card → a drawer with the terms, the documents, the desk's answered questions and what the
position would do to the book → *Commit* shows the allocation impact before it executes.

**Authority, closed both ways.** Switch to Jae-won Park (top right). The hero becomes the Alpha
sleeve and the tiles become sleeve numbers. Commit $1,000,000 to Northgate Facility II — above the
$760,000 capacity, so the button becomes *Submit proposal to the Principal*. In the book's Positions
tab, every Core row's Sell is disabled with the reason on hover **and carries a Propose button
beside it**, so a locked control is never a dead end. Switch back, approve it on `#/today`, and the
sale executes against the actual position.

### What the charts are doing

The colour work is deliberate rather than decorative, and is documented at the top of
`take2/charts.js`:

- Asset classes use a **validated categorical palette** — slots 1–4 in fixed order (Equity blue,
  Debt orange, Real Assets aqua, Cash yellow), assigned to the entity and never reassigned by rank.
  Adjacent-pair separation was checked with the data-viz validator against the white card surface,
  not eyeballed: worst adjacent CVD ΔE 9.1, worst normal-vision ΔE 22.9.
- Aqua and yellow fall below 3:1 contrast on white, so **every chart that uses them ships a legend
  with visible values and has a table twin on the same screen** — the Guidance tab's glide path is
  backed by a class table and a sub-class table. That obligation is why the tables are there.
- Single-series charts that carry no class meaning (cash runway, attribution, order-book depth) use
  the indigo accent, which is never a series colour, so they cannot be misread as an asset class.
- **No dual axes anywhere.** Projected cash and capital calls are two charts sharing nothing but
  their month labels.
- Drift is a diverging form — bars either side of a zero rule — but each bar keeps its own class
  hue rather than taking a polarity colour, so Equity is the same blue in every chart on the page.
  Position across the rule states the sign.

### Take 2 files

```
take2/index.html    script order: shared data → shared utils → supplement → store → ui → charts → screens → shell
take2/app.css       the whole visual system; tokens at the top
take2/data.js       ONLY what take 2 needs and take 1 does not: affiliate desks, sync history,
                    the pending diff, generated order books. src/mockData.js is not edited.
take2/store.js      own state, own router, same two authority rules
take2/ui.js         Card, Stat, Pill, Btn, Lock, Modal, Drawer, MoneyInput
take2/charts.js     every SVG chart, with the colour rules stated at the top
take2/p_*.js        one file per screen
take2/app.js        left rail, top bar, global modals, mount
```

## Files

```
index.html          script order: data → utils → store → ui → flows → pages → shell → mount
serve.py            static server with caching off, so edits show on reload
src/mockData.js     ← the only file you need to edit to change the demo
src/util.js         formatters (USD over KRW, tabular) and every derived calculation
src/store.js        in-memory state, actions, permissions, hash router
src/ui.js           primitives: Money, badges, Lock, Panel, Tabs, Modal, allocation bars
src/flows.js        order ticket, commitment, valuation editor, listing, bid, share
src/agent.js        the agent panel and the natural-language query rules
src/pg_*.js         one file per screen
src/styles.css      design tokens and the whole visual system
vendor/             React 18 + Babel standalone, vendored so it runs offline
```

`mockData.js` holds the family, the 42 positions, the taxonomy and its targets, the reconciliation
exceptions, the mandate ladder, model portfolios, capital calls and distributions, performance and
attribution, 34 marketplace instruments, 12 secondary listings, seeded approvals, the activity log
and the settlement ledger. Everything else derives from it at render time, so changing a position's
value moves the model comparison, the fit ranking and the liquidity runway together.

## Conventions worth knowing

- **Provenance is a first-class badge.** `Live` (marked to market), `Hanwha-sourced` (NAV pushed
  from the platform, with an as-of date), `Self-maintained` (days since update; amber past 90,
  red past 180).
- **Liquidity, not wrapper, is the axis — for the Principal.** Their marketplace has no
  public/private filter and no tabs; listed and private compete in one ranked list, and the
  distinction surfaces only at the button — Buy versus Commit, Sell versus List on secondary.
- **The account decides the inventory.** The Successor holds the Alpha sleeve, whose mandate is
  private growth, so their marketplace carries private-market offerings only — the same ranked
  list, the same row schema, one kind of instrument. Listed instruments trade in Core, which
  is the Principal's remit; the Successor reaches them from the portfolio, where Core rows carry a
  *Propose* action beside the disabled Trade and Sell.
- **Custody language only.** Transfer, settlement, ownership record, settles same-day. The
  settlement ledger at `/ops` is the single internal exception.
- **Goals are stated in one place and used everywhere.** The mandate — Preservation / Balanced /
  Growth / Opportunistic — is set at `/onboarding/mandate` and restated at the top of the model
  portfolio panel, which is where the Principal changes it. Picking a different objective in the model chart is
  a what-if until they press *Adopt as mandate*; adopting rewrites the Core/Alpha split and every
  class target the model is drawn against, and writes a line to the activity log. The Successor sees the mandate read-only.
- **The model is a recommendation, not a queue of trades.** Nothing in the marketplace is ordered
  by how far the book sits from target, and the allocation numbers that do appear — "vs target" in
  the holdings table, the impact panel on a ticket, the context line on a deal — are grey, unsigned
  by colour, and phrased as information rather than instruction. Fit scores weight the merits of
  the instrument: terms, manager, security, and whether the family already owns the risk.
- **The model portfolio is a chart you can argue with.** Set an AUM on the log slider and pick an
  objective, and the glide path redraws: the stacked bands are the recommended class mix across
  $1M–$150M, and the dashed line is the alternatives share. It rises with size on purpose — the
  illiquidity budget is a function of the balance sheet that has to absorb the capital calls.
- **"Ask the book" floats.** The natural-language bar is fixed at the foot of the portfolio rather
  than sitting in the flow, so the holdings table clears the fold and the query is reachable from
  anywhere in a long page. Results open upward, above the bar.
- **Desktop only.** 1440 primary, degrades to 1024 by shedding optional table columns. Mobile is
  explicitly out of scope, as is dark mode.
