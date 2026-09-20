# Barbell — institutional wealth operating system

A clickable, desktop-first prototype for a Korean family office with $62.4M across public and
private markets. Two accounts, one balance sheet, three arguments: a single reconciled view that
replaces Excel, one marketplace ranked by allocation gap rather than instrument wrapper, and a
members-only secondary board that gives the illiquid half a price.

No backend, no auth, no network calls. All data is seeded in `src/mockData.js` and every action
resolves against in-memory state.

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
| `/marketplace` | One ranked surface, organised by allocation gap |
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

**Gap → transaction.** `/marketplace` → the Sovereign gap opens with six ETFs and bonds and one
private placement on the same list → open any row → *Buy* opens an order ticket, *Commit* opens a
subscription; both show the allocation impact before confirmation. Switch to the Successor and the
same page carries private-market offerings only, led by "Within your authority" — the eight that
fit the $760,000 Alpha capacity and need no approval.

**Authority.** Switch to Jae-won Park (top right). Core controls render disabled with
"Core sleeve — Principal authority required." Commit $1,000,000 to Northgate Facility II — the
button becomes *Submit proposal to Principal* because it exceeds the Alpha sleeve's $760,000
capacity. Switch back, approve it in `/approvals`, and the commitment executes.

**Liquidity.** `/portfolio` → Liquidity: Q1 2027 calls of $4.67M breach projected cash by $1.40M
in Mar 27, and the agent names the positions that would cover it.

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
value moves the drift, the gap sections, the fit ranking and the liquidity runway together.

## Conventions worth knowing

- **Provenance is a first-class badge.** `Live` (marked to market), `Hanwha-sourced` (NAV pushed
  from the platform, with an as-of date), `Self-maintained` (days since update; amber past 90,
  red past 180).
- **Liquidity, not wrapper, is the axis — for the Principal.** Their marketplace has no
  public/private filter and no tabs; listed and private compete in one ranked list, and the
  distinction surfaces only at the button — Buy versus Commit, Sell versus List on secondary.
- **The account decides the inventory.** The Successor holds the Alpha sleeve, whose mandate is
  private growth, so their marketplace carries private-market offerings only — the same gap
  sections, the same row schema, one kind of instrument. Listed instruments trade in Core, which
  is the Principal's remit; the Successor reaches them from the portfolio, where Core rows carry a
  *Propose* action beside the disabled Trade and Sell.
- **Custody language only.** Transfer, settlement, ownership record, settles same-day. The
  settlement ledger at `/ops` is the single internal exception.
- **Goals are stated in one place and used everywhere.** The mandate — Preservation / Balanced /
  Growth / Opportunistic — is set at `/onboarding/mandate` and restated at the top of the model
  portfolio panel, which is where the Principal changes it. Picking a different objective in the model chart is
  a what-if until they press *Adopt as mandate*; adopting rewrites the Core/Alpha split and every
  class target, which moves every drift number, gap section and fit score in the product, and
  writes a line to the activity log. The Successor sees the mandate read-only.
- **The model portfolio is a chart you can argue with.** Set an AUM on the log slider and pick an
  objective, and the glide path redraws: the stacked bands are the recommended class mix across
  $1M–$150M, and the dashed line is the alternatives share. It rises with size on purpose — the
  illiquidity budget is a function of the balance sheet that has to absorb the capital calls.
- **"Ask the book" floats.** The natural-language bar is fixed at the foot of the portfolio rather
  than sitting in the flow, so the holdings table clears the fold and the query is reachable from
  anywhere in a long page. Results open upward, above the bar.
- **Desktop only.** 1440 primary, degrades to 1024 by shedding optional table columns. Mobile is
  explicitly out of scope, as is dark mode.
