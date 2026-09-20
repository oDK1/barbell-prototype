/* =============================================================================
   Take 2 — data supplement.

   src/mockData.js is shared with take 1 and is NOT edited here, so both takes
   show the same family, the same 42 positions and the same numbers. This file
   only layers on what take 2's information architecture needs and take 1's
   does not: which Hanwha affiliate desk originates each offering, the sync
   history that makes Excel a spine rather than a setup step, and an order book
   for the secondary exchange.
   ============================================================================= */
(function () {
  const D = BB.data;

  /* ------------------------------------------------- Hanwha affiliate desks */
  /* Logo colours are chrome, drawn from the indigo/slate family on purpose —
     never the four categorical series hues, so a desk chip can't be mistaken
     for an asset class in a chart. */
  const desks = [
    { key: "life", name: "Hanwha Life Insurance", short: "HL", color: "#4A3AA7",
      line: "Balance-sheet co-investment",
      blurb: "Private credit, real assets and infrastructure originated by the general account. The family invests alongside Hanwha Life on the terms the insurer itself holds." },
    { key: "sec", name: "Hanwha Securities", short: "HS", color: "#3B4A6B",
      line: "Listed markets and structured notes",
      blurb: "Execution in listed securities, plus structured notes issued off the Hanwha Securities balance sheet." },
    { key: "ham", name: "Hanwha Asset Management", short: "HAM", color: "#6355CC",
      line: "Funds and exchange-traded products",
      blurb: "Pooled vehicles — in-house and third-party ETFs and funds, screened and available in one place." },
    { key: "ip", name: "Hanwha Investment Partners", short: "HIP", color: "#5B6478",
      line: "Private equity, venture and pre-IPO",
      blurb: "Growth capital and late-stage secondaries, sized for family-office tickets rather than institutional minimums." },
  ];
  /* Wrapper decides the desk before asset class does: a listed infrastructure
     ETF is an asset-management product, not a general-account co-investment,
     even though both sit in the same sub-class. */
  const deskOf = (m) => {
    if (m.kind === "private") return ["pe", "vc", "preipo"].indexOf(m.fills) >= 0 ? "ip" : "life";
    return /ETF|Fund|Shares|Trust|Partners L\.P\./.test(m.name) ? "ham" : "sec";
  };
  const deskById = {};
  desks.forEach((d) => (deskById[d.key] = d));
  const market = D.market.map((m) => Object.assign({}, m, { desk: deskOf(m) }));

  /* --------------------------------------------------------- the sync spine */
  /* Take 2 treats the spreadsheet upload as a recurring event, not onboarding.
     Everything the Today screen says about "what changed" reads from here. */
  const syncs = [
    { id: "sy4", date: "2026-09-07", files: 3, mapped: 42, added: 2, revalued: 4, removed: 1,
      exceptions: 0, valueBefore: 60_880_000, valueAfter: 61_450_000, by: "Y.S. Park",
      note: "Quarterly custodian export plus the CFO's capital-call workbook." },
    { id: "sy3", date: "2026-06-08", files: 3, mapped: 41, added: 1, revalued: 6, removed: 0,
      exceptions: 1, valueBefore: 58_100_000, valueAfter: 60_880_000, by: "Y.S. Park",
      note: "Q2 NAV marks landed late from two managers." },
    { id: "sy2", date: "2026-03-09", files: 2, mapped: 40, added: 3, revalued: 5, removed: 0,
      exceptions: 2, valueBefore: 55_940_000, valueAfter: 58_100_000, by: "Family CFO" },
    { id: "sy1", date: "2025-12-08", files: 2, mapped: 37, added: 37, revalued: 0, removed: 0,
      exceptions: 7, valueBefore: 0, valueAfter: 55_940_000, by: "Y.S. Park",
      note: "First ingestion. The book moved off Excel." },
  ];
  const lastSync = syncs[0];

  /* What the staged files would change if the pending sync were run. The seven
     exceptions in mockData are reused verbatim — same reconciliation, framed as
     a recurring diff rather than a one-off onboarding gate. */
  /* What the staged files would change if the pending sync were run. Revalues
     and removals name a seeded position exactly and carry a delta, so the diff
     the screen shows and the change the store applies can never drift apart —
     `from` is read off the pristine seed, which the store never mutates. */
  const posByName = (n) => D.positions.find((p) => p.name === n);
  const rawDiff = {
    added: [
      { name: "Hanwha Korea Logistics REIT Co-Invest II", cls: "real", sub: "re", value: 1_500_000,
        src: "Holdings_Master_2026Q3.xlsx" },
      { name: "KODEX Korea REIT ETF", cls: "real", sub: "re", value: 240_000,
        src: "Holdings_Master_2026Q3.xlsx" },
    ],
    revalued: [
      { name: "Songdo Hyperscale Data Center Platform", delta: 290_000, src: "PE_Capital_Calls_v7_FINAL.xlsx" },
      { name: "Foundry Venture Partners VII, L.P.", delta: 60_000, src: "PE_Capital_Calls_v7_FINAL.xlsx" },
      { name: "Pacific Core Real Estate Fund IV", delta: -50_000, src: "부동산_임대현황.xlsx" },
      { name: "Sunrise Growth Partners IV, L.P.", delta: 18_000, src: "PE_Capital_Calls_v7_FINAL.xlsx" },
    ],
    removed: [
      { name: "KODEX 200 ETF", why: "Sold 12 August; no longer in the custodian file." },
    ],
    calls: [
      { fund: "Songdo Hyperscale Data Center Platform", date: "2027-03-05", amount: 2_550_000, status: "new" },
    ],
  };
  const pending = {
    staged: D.uploadFiles,
    diff: {
      added: rawDiff.added,
      revalued: rawDiff.revalued.map((r) => {
        const p = posByName(r.name);
        return Object.assign({}, r, { from: p ? p.value : 0, to: p ? p.value + r.delta : r.delta });
      }).filter((r) => r.from),
      removed: rawDiff.removed.map((r) => {
        const p = posByName(r.name);
        return Object.assign({}, r, { cls: p ? p.cls : "equity", value: p ? p.value : 0 });
      }).filter((r) => r.value),
      calls: rawDiff.calls,
    },
  };

  /* --------------------------------------------------- secondary order book */
  /* Deterministic from the listing id, so the book is stable across renders
     and identical on every reload. Prices are a percentage of last NAV. */
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1e6) / 1e6; };
  }
  function bookFor(l) {
    const rnd = seeded(l.id);
    const lo = l.indicative[0], hi = l.indicative[1];
    const bids = [];
    let px = Math.min(l.askPct - 0.4, hi - 0.3);
    const depth = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < depth; i++) {
      bids.push({
        px: Math.round(px * 10) / 10,
        qty: Math.round((l.size * (0.18 + rnd() * 0.55)) / 1e4) * 1e4,
        member: "Member #" + String(100 + Math.floor(rnd() * 890)).padStart(4, "0"),
        age: 1 + Math.floor(rnd() * 11),
      });
      px -= 0.6 + rnd() * 1.6;
      if (px < lo - 2) break;
    }
    const prints = [];
    let pp = l.askPct - 0.8;
    for (let i = 0; i < 3; i++) {
      prints.push({
        px: Math.round(pp * 10) / 10,
        qty: Math.round((l.size * (0.2 + rnd() * 0.4)) / 1e4) * 1e4,
        days: (i + 1) * (4 + Math.floor(rnd() * 9)),
      });
      pp -= rnd() * 1.2 - 0.3;
    }
    return { bids, prints };
  }
  const books = {};
  D.secondary.forEach((l) => (books[l.id] = bookFor(l)));

  /* Nine-month total-book series for the Today sparkline. Anchored so the last
     point equals the seeded AUM; earlier points come off the sync history. */
  const bookHistory = [
    { m: "Jan 26", v: 56_400_000 }, { m: "Feb 26", v: 56_950_000 }, { m: "Mar 26", v: 58_100_000 },
    { m: "Apr 26", v: 58_640_000 }, { m: "May 26", v: 59_300_000 }, { m: "Jun 26", v: 60_880_000 },
    { m: "Jul 26", v: 61_100_000 }, { m: "Aug 26", v: 61_450_000 }, { m: "Sep 26", v: 62_400_000 },
  ];

  window.T2 = window.T2 || {};
  T2.data = { desks, deskById, market, syncs, lastSync, pending, books, bookHistory };
})();
