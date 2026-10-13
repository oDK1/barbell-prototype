/* Formatters and derived calculations. Pure functions over a positions array. */
(function () {
  const D = BB.data;
  const KRW = D.KRW;

  const nf = (dp) => new Intl.NumberFormat("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

  function usd(n, dp) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    const s = nf(dp === undefined ? 0 : dp).format(Math.abs(n));
    return (n < 0 ? "−$" : "$") + s;
  }
  function usdC(n) { // compact — for stat tiles
    const a = Math.abs(n), sgn = n < 0 ? "−" : "";
    if (a >= 1e9) return sgn + "$" + nf(2).format(a / 1e9) + "B";
    if (a >= 1e6) return sgn + "$" + nf(1).format(a / 1e6) + "M";
    if (a >= 1e3) return sgn + "$" + nf(0).format(a / 1e3) + "K";
    return sgn + "$" + nf(0).format(a);
  }
  function krwC(n) {
    const w = n * KRW, a = Math.abs(w), sgn = n < 0 ? "−" : "";
    if (a >= 1e12) return sgn + "₩" + nf(1).format(a / 1e12) + "T";
    if (a >= 1e9) return sgn + "₩" + nf(1).format(a / 1e9) + "B";
    if (a >= 1e6) return sgn + "₩" + nf(1).format(a / 1e6) + "M";
    if (a >= 1e3) return sgn + "₩" + nf(0).format(a / 1e3) + "K";
    return sgn + "₩" + nf(0).format(a);
  }
  function krwFull(n) { return "₩" + nf(0).format(Math.round(n * KRW)); }
  function pct(n, dp) { return (n === null || n === undefined || isNaN(n)) ? "—" : nf(dp === undefined ? 1 : dp).format(n) + "%"; }
  function pp(n, dp) {
    const d = dp === undefined ? 1 : dp;
    if (n === null || n === undefined || isNaN(n)) return "—";
    return (n > 0 ? "+" : n < 0 ? "−" : "") + nf(d).format(Math.abs(n)) + "pp";
  }
  function sgn(n, dp) {
    const d = dp === undefined ? 1 : dp;
    return (n > 0 ? "+" : n < 0 ? "−" : "") + nf(d).format(Math.abs(n)) + "%";
  }
  function sgnUsd(n) { return (n > 0 ? "+" : n < 0 ? "−" : "") + "$" + nf(0).format(Math.abs(n)); }
  function num(n, dp) { return nf(dp === undefined ? 0 : dp).format(n); }
  function localPx(p) {
    if (p.px === undefined) return "—";
    if (p.ccy === "KRW") return "₩" + nf(0).format(p.px);
    if (p.ccy === "JPY") return "¥" + nf(0).format(p.px);
    if (p.ccy === "EUR") return "€" + nf(2).format(p.px);
    return "$" + nf(2).format(p.px);
  }

  const DAY = 864e5;
  function days(from, to) { return Math.round((new Date(to || D.TODAY) - new Date(from)) / DAY); }
  const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  /* Dates are displayed exactly as stored — no timezone conversion. The book is
     kept in KST and a US-local browser must not shift it by a day. */
  function fmtDate(s) {
    if (!s) return "—";
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (!m) return s;
    return m[3] + " " + MON[+m[2] - 1] + " " + m[1];
  }
  function fmtTs(s) {
    if (!s) return "—";
    const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(s);
    if (!m) return fmtDate(s);
    return m[3] + " " + MON[+m[2] - 1] + " " + m[1] + " · " + m[4] + ":" + m[5];
  }
  function monthKey(s) { const d = new Date(s); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
  function monthLabel(k) {
    const [y, m] = k.split("-");
    return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m - 1] + " " + y.slice(2);
  }

  /* ------------------------------------------------------------ provenance */
  function staleness(p) {
    if (p.prov !== "self") return null;
    const d = days(p.asOf || p.acquired);
    return { d, level: d > 180 ? "bad" : d > 90 ? "warn" : "ok" };
  }
  function provLabel(p) {
    if (p.prov === "live") return "Live";
    if (p.prov === "hanwha") return "Hanwha-sourced";
    return "Self-maintained";
  }

  /* ---------------------------------------------------------------- totals */
  const sum = (a, f) => a.reduce((t, x) => t + (f ? f(x) : x), 0);
  function total(ps) { return sum(ps, (p) => p.value); }
  function byClass(ps) {
    const t = total(ps);
    return D.classes.map((c) => {
      const items = ps.filter((p) => p.cls === c.key);
      const v = total(items);
      return { ...c, value: v, wt: t ? (v / t) * 100 : 0, drift: t ? (v / t) * 100 - c.target : 0, count: items.length };
    });
  }
  function bySub(ps) {
    const t = total(ps);
    return D.subs.map((s) => {
      const items = ps.filter((p) => p.sub === s.key);
      const v = total(items);
      const wt = t ? (v / t) * 100 : 0;
      return { ...s, value: v, wt, drift: wt - s.target, gapUsd: ((s.target - wt) / 100) * t, count: items.length };
    });
  }
  function gaps(ps) {
    return bySub(ps).filter((s) => s.drift < -0.15).sort((a, b) => b.gapUsd - a.gapUsd);
  }
  function unrealized(ps) { return sum(ps, (p) => p.value - p.cost); }
  function realizedYTD(ps) { return sum(ps, (p) => p.realizedYTD || 0); }

  /* 90-day liquidity: cash equivalents plus anything redeemable inside the window. */
  /* ------------------------------------------------------------- the mark ---
     Everything trades, so everything has a price. A position on the platform
     is marked by the market — an exchange if it has a ticker, the board if it
     does not. The only positions still carrying a hand-kept number are the
     ones the family holds outside the platform, and naming that difference is
     more useful than the old "stale by N days". */
  function markSource(p) {
    if (p.prov === "self") return { key: "self", label: "Hand-kept", live: false,
      note: "No market price — held outside the platform and valued by the family." };
    if (isListed(p)) return { key: "exchange", label: "Exchange", live: true,
      note: "Marked by the exchange, continuously." };
    return { key: "rail", label: "Platform rail", live: true,
      note: "Marked by the board, continuously — not by the manager once a quarter." };
  }
  function marked(ps) {
    const live = ps.filter((p) => markSource(p).live);
    return { live, liveValue: total(live), unmarked: ps.filter((p) => !markSource(p).live),
      share: total(ps) ? (total(live) / total(ps)) * 100 : 0 };
  }

  /* ------------------------------------------------------------- credit ----
     What the book will carry as collateral. A lender advances against what it
     can price and sell; everything here is both, so the private half stops
     being excluded. `was` is what the same book would have supported before
     the rail, and the difference is the thing worth showing. */
  function advanceOf(p) {
    const r = D.advanceRates[p.sub] || [0, 0];
    return { now: r[0], was: r[1] };
  }
  function borrowingPower(ps) {
    let now = 0, was = 0;
    const rows = {};
    ps.forEach((p) => {
      const a = advanceOf(p);
      /* a position with no market price is not collateral, whatever it is */
      const live = markSource(p).live;
      const n = live ? p.value * (a.now / 100) : 0;
      const w = live ? p.value * (a.was / 100) : 0;
      now += n; was += w;
      const k = p.sub;
      if (!rows[k]) rows[k] = { sub: k, label: subLabel(k), value: 0, now: 0, was: 0, count: 0, rate: a };
      rows[k].value += p.value; rows[k].now += n; rows[k].was += w; rows[k].count++;
    });
    const t = total(ps);
    const list = Object.keys(rows).map((k) => rows[k]).sort((a, b) => (b.now - b.was) - (a.now - a.was));
    return {
      now, was, unlocked: now - was, rows: list,
      ltvNow: t ? (now / t) * 100 : 0, ltvWas: t ? (was / t) * 100 : 0,
      rate: D.creditTerms.base + D.creditTerms.spread,
    };
  }

  /* --------------------------------------------------------------- exit ----
     Everything on this platform converts to cash immediately. So the
     old question — how much could be redeemed inside 90 days — has no content
     any more; the answer is always "all of it".

     The question that replaces it is what the book fetches. Immediacy is
     bought at the bid, and the bid is not the mark. `exitToday` prices the
     whole book for an immediate sale and reports what that costs, because a
     platform that says "instantly liquid" and leaves the discount unstated is
     telling half the truth. */
  /* "Liquid" no longer separates anything, because everything is. What still
     separates a holding is whether an exchange prices it or the rail does —
     a ticker, or not. Tax lots, order tickets and the secondary board all
     turn on that, not on a notice period. */
  function isListed(p) { return !!p.ticker; }

  function exitValue(p) {
    const pc = D.exitPct[p.sub];
    return p.value * ((pc === undefined ? 100 : pc) / 100);
  }

  function exitToday(ps) {
    const gross = total(ps);
    const net = ps.reduce((a, p) => a + exitValue(p), 0);
    const cost = gross - net;
    /* at par, and therefore free to sell: listed lines and cash */
    const parItems = ps.filter((p) => (D.exitPct[p.sub] === undefined ? 100 : D.exitPct[p.sub]) >= 99.9);
    const par = total(parItems);
    /* the operating company is listed and sellable, and is still the one
       holding the family will not sell — so it is counted apart */
    const aff = total(parItems.filter((p) => p.affiliate));
    const discounted = ps.filter((p) => (D.exitPct[p.sub] === undefined ? 100 : D.exitPct[p.sub]) < 99.9);
    return {
      gross, net, cost,
      haircut: gross ? (cost / gross) * 100 : 0,
      par, parFree: par - aff, affiliate: aff,
      discounted: total(discounted), discountedCount: discounted.length,
      worst: discounted.map((p) => ({ p, pc: D.exitPct[p.sub], loss: p.value - exitValue(p) }))
        .sort((a, b) => b.loss - a.loss).slice(0, 5),
    };
  }

  /* What it costs to raise a given amount today, selling the cheapest exits
     first: cash and listed lines at par, then up the discount ladder. */
  function raiseCost(ps, amount) {
    const ordered = ps.slice()
      .filter((p) => !p.affiliate)
      .sort((a, b) => (D.exitPct[b.sub] === undefined ? 100 : D.exitPct[b.sub])
                    - (D.exitPct[a.sub] === undefined ? 100 : D.exitPct[a.sub]));
    let need = amount, cost = 0, sold = [];
    for (const p of ordered) {
      if (need <= 0) break;
      const pc = (D.exitPct[p.sub] === undefined ? 100 : D.exitPct[p.sub]) / 100;
      const takeNet = Math.min(need, p.value * pc);
      const takeGross = takeNet / pc;
      cost += takeGross - takeNet;
      sold.push({ p, gross: takeGross, net: takeNet });
      need -= takeNet;
    }
    return { cost, sold, short: Math.max(0, need) };
  }

  /* --------------------------------------------------------- liquidity map */
  function liquidityProjection(ps) {
    const { monthlyIncome, monthlySpend } = D.liquidityAssumptions;
    const start = new Date(D.TODAY); start.setDate(1);
    const months = [];
    for (let i = 0; i < 24; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + 1 + i, 1);
      months.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
    }
    let cash = total(ps.filter((p) => p.cls === "cash"));
    return months.map((k) => {
      const calls = sum(D.capitalCalls.filter((c) => monthKey(c.date) === k), (c) => c.amount);
      const dist = sum(D.distributions.filter((c) => monthKey(c.date) === k), (c) => c.amount);
      cash = cash + monthlyIncome - monthlySpend + dist - calls;
      return { k, label: monthLabel(k), calls, dist, cash };
    });
  }
  /* The first breach, not the deepest — that is the date a decision is needed. */
  function shortfall(ps) {
    const proj = liquidityProjection(ps);
    const first = proj.find((x) => x.cash < 0);
    if (!first) return null;
    const [y, m] = first.k.split("-").map(Number);
    const q = Math.ceil(m / 3);
    const qMonths = [1, 2, 3].map((i) => y + "-" + String((q - 1) * 3 + i).padStart(2, "0"));
    const qCalls = sum(D.capitalCalls.filter((c) => qMonths.indexOf(monthKey(c.date)) >= 0), (c) => c.amount);
    return { month: first.label, amount: -first.cash, k: first.k, quarter: "Q" + q + " " + y, quarterCalls: qCalls };
  }

  /* Which positions could be sold to cover an amount, cheapest-to-touch first.
     Cash is excluded because the projection already spends it. Index funds
     before single securities; never the operating company holding. */
  function coverage(ps, amount) {
    const rank = (p) => (p.grp === "ETF" ? 0 : p.sub === "sov" ? 1 : p.sub === "ig" ? 2 : 3);
    const pool = ps.filter((p) => isListed(p) && p.cls !== "cash" && !p.affiliate)
      .sort((a, b) => rank(a) - rank(b) || b.value - a.value);
    const items = []; let t = 0;
    for (const p of pool) { if (t >= amount) break; items.push(p); t += p.value; }
    return { items, total: t, partial: items.length ? items[items.length - 1] : null };
  }

  /* ------------------------------------------------------- concentration */
  function topHoldings(ps, n) {
    const t = total(ps);
    return [...ps].sort((a, b) => b.value - a.value).slice(0, n || 10)
      .map((p) => ({ ...p, wt: (p.value / t) * 100 }));
  }
  function affiliateExposure(ps) {
    const t = total(ps);
    const items = ps.filter((p) => p.affiliate);
    const v = total(items);
    return { items, value: v, wt: (v / t) * 100 };
  }

  /* -------------------------------------------------------------- tax lots */
  function taxLots(ps) {
    return ps.filter((p) => p.cost).map((p) => {
      const held = days(p.acquired);
      const gain = p.value - p.cost;
      return {
        ...p, held, longTerm: held >= 365, gain,
        gainPct: p.cost ? (gain / p.cost) * 100 : 0,
        harvest: gain < 0 && isListed(p),
      };
    });
  }

  /* -------------------------------------------------- secondary eligibility */
  function eligibility(p) {
    if (isListed(p)) return { ok: false, reason: "Listed — sells through the order ticket", listed: true };
    if (!p.onBarbell) return { ok: false, reason: "Not originated on Barbell" };
    const held = days(p.acquired);
    if (held < 365) return { ok: false, reason: "Eligible in " + Math.max(1, Math.ceil((365 - held) / 30)) + " months", months: Math.ceil((365 - held) / 30) };
    return { ok: true, reason: "Eligible" };
  }

  /* ------------------------------------------------------ model portfolio */
  /* The published tiers are $1M / $10M / $100M. Between them the model is
     interpolated on a log-AUM scale, so a $62M book gets a $62M answer rather
     than being rounded to the nearest brochure. Above $100M it plateaus. */
  function modelWeights(aum, goalKey) {
    const tiers = [D.modelPortfolios["1m"].subs, D.modelPortfolios["10m"].subs, D.modelPortfolios["100m"].subs];
    const x = Math.max(0, Math.min(2, Math.log10(Math.max(aum, 1e6) / 1e6)));   // 0 → $1M, 2 → $100M
    const i = Math.min(1, Math.floor(x));
    const f = x - i;
    const g = D.modelGoals.find((m) => m.key === goalKey) || D.modelGoals.find((m) => m.default);

    const raw = {};
    D.subs.forEach((sub) => {
      const base = tiers[i][sub.key] * (1 - f) + tiers[i + 1][sub.key] * f;
      const tilt = g.tilt && g.tilt[sub.key] !== undefined ? g.tilt[sub.key] : 1;
      raw[sub.key] = base * tilt;
    });
    const total = D.subs.reduce((a, sub) => a + raw[sub.key], 0);

    const subs = {}, classes = {};
    D.subs.forEach((sub) => {
      subs[sub.key] = (raw[sub.key] / total) * 100;
      classes[sub.cls] = (classes[sub.cls] || 0) + subs[sub.key];
    });
    const alts = D.ALT_SUBS.reduce((a, k) => a + subs[k], 0);
    return { subs, classes, alts, goal: g };
  }


  /* ------------------------------------------------ six-class model portfolio */
  /* One lever: the nine published portfolios are replaced by a single
     Engine / Conviction split, which the family sets and can set to 99/1.

     The split is read as a number. Callers that still hold a posture key get
     the preset behind it, so "balanced" and 10 mean the same thing — the keys
     survive as shortcuts, not as portfolios.

     Blending the two bucket compositions gives the six-class model. Then the
     rule that decides what a family this size can actually own: a private
     class whose dollar allocation cannot clear its minimum cheque is not a
     recommendation, it is a rounding error. Those are zeroed and their weight
     returned to the public sibling, with the arithmetic kept so the screen can
     show its work. */
  function convPct(split) {
    if (typeof split === "number" && isFinite(split)) return Math.max(0, Math.min(100, split));
    const v = D.bucketPresets[split];
    return v === undefined ? D.bucketPresets.balanced : v;
  }

  function modelSix(aum, split) {
    const conv = convPct(split);
    const eng = 100 - conv;
    const w = {};
    D.modelClasses.forEach((c) => {
      w[c.key] = (eng * (D.bucketMix.engine[c.key] || 0) + conv * (D.bucketMix.conviction[c.key] || 0)) / 100;
    });

    /* Where a class's weight goes when it cannot be owned. Real assets and
       equity share one risk budget, so real falls back to public equity. */
    const sibling = { priveq: "pubeq", privdebt: "pubdebt", real: "pubeq" };
    const blocked = {};
    Object.keys(sibling).forEach((k) => {
      const c = D.modelClasses.find((x2) => x2.key === k);
      const min = c.min;
      const dollars = (w[k] / 100) * aum;
      if (w[k] <= 0 || dollars < min) {
        blocked[k] = {
          why: w[k] <= 0 ? "split" : "size",
          pct: w[k], dollars, min, to: sibling[k],
        };
        w[sibling[k]] += w[k];
        w[k] = 0;
      }
    });
    return { w, blocked, conv, eng, split: conv };
  }

  /* The same six buckets, measured on what the family actually holds. */
  function bySix(positions) {
    const t = total(positions);
    const of = {};
    D.modelClasses.forEach((c) => c.subs.forEach((k) => { of[k] = c.key; }));
    const value = {};
    D.modelClasses.forEach((c) => { value[c.key] = 0; });
    positions.forEach((p) => { if (of[p.sub] !== undefined) value[of[p.sub]] += p.value; });
    const pct = {};
    Object.keys(value).forEach((k) => { pct[k] = t ? (value[k] / t) * 100 : 0; });
    return { value, pct, total: t };
  }

  /* Roll six back up to the four classes projectMix reasons in. */
  function sixToFour(w) {
    return {
      equity: w.pubeq + w.priveq,
      debt: w.pubdebt + w.privdebt,
      real: w.real,
      cash: w.cash,
    };
  }

  /* Spread a class's model weight across its subcategories in the proportions
     the published targets already imply, so the rebalancing path still has
     instrument-level lines to act on. */
  function sixToSubs(w) {
    const out = {};
    D.modelClasses.forEach((c) => {
      const kids = D.subs.filter((s) => c.subs.indexOf(s.key) >= 0);
      const base = kids.reduce((a, s) => a + s.target, 0);
      kids.forEach((s) => { out[s.key] = base ? w[c.key] * (s.target / base) : w[c.key] / kids.length; });
    });
    return out;
  }

  /* The best-scoring thing on the platform that would fill a class. */
  function pickForClass(key) {
    const c = D.modelClasses.find((x) => x.key === key);
    if (!c) return null;
    return D.market.filter((m) => c.subs.indexOf(m.fills) >= 0)
      .sort((a, b) => b.fit - a.fit)[0] || null;
  }


  /* Holdings rolled into the six model classes, with the model for this book's
     size and objective beside them. One row per class, no subcategory level. */
  function holdingsSix(positions, goalKey) {
    const t = total(positions);
    const m = modelSix(t, goalKey);
    return D.modelClasses.map((c) => {
      const items = positions.filter((p) => c.subs.indexOf(p.sub) >= 0);
      const v = total(items);
      const wt = t ? (v / t) * 100 : 0;
      /* every model class sits inside exactly one of the four book classes;
         ?group= carries which of them, so the page shows only these subs */
      const parent = (D.subs.find((x) => x.key === c.subs[0]) || {}).cls;
      return {
        ...c, items, value: v, wt, count: items.length, unrealized: unrealized(items),
        model: m.w[c.key], drift: wt - m.w[c.key], blocked: !!m.blocked[c.key],
        route: "/portfolio/" + parent + "?group=" + c.key,
      };
    });
  }


  /* Three buckets for the marketplace's geography filter. Offerings carry a
     specific country or region; this folds them into what a family actually
     filters on. */
  const ASIA = ["Korea", "Japan", "China", "Taiwan", "India", "Singapore", "Hong Kong", "Asia", "Asia-Pacific"];
  function geoBucket(geo) {
    if (!geo) return "ROW";
    if (geo === "United States") return "United States";
    if (ASIA.indexOf(geo) >= 0) return "Asia";
    return "ROW";
  }
  const GEO_BUCKETS = ["United States", "Asia", "ROW"];


  /* The document pack behind a secondary transfer. Every transfer carries the
     same four — the instrument's own agreement, the capital account it is
     priced off, the assignment, and the GP's consent — plus a schedule
     wherever the interest still owes money. Page counts are derived from the
     listing id so a given listing always reads the same. */
  function listingDocs(l) {
    const seed = String(l.id).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const pp = (base, spread) => "PDF · " + (base + (seed % spread)) + "pp";
    const agreement = l.cls === "debt"
      ? "Facility agreement and participation terms"
      : l.cls === "real" ? "Fund limited partnership agreement" : "Limited partnership agreement";
    const docs = [
      [l.manager + " — " + agreement.toLowerCase().replace(/^./, (c) => c.toUpperCase()), pp(88, 60)],
      ["Capital account statement — 30 Jun 2026", pp(4, 6)],
      ["Transfer and assignment agreement", pp(11, 9)],
      ["GP consent — platform transfer waiver", pp(3, 4)],
    ];
    if (l.unfunded) docs.push(["Unfunded commitment schedule — " + usd(l.unfunded) + " outstanding", pp(2, 3)]);
    return docs;
  }


  /* A listing read as an offering, so the board and the marketplace can be
     scored on one scale. Merit is the discount to the last mark — on a
     secondary that is the whole argument — and the return is the uplift a
     buyer books immediately by paying below NAV. */
  function listingView(l, ctx) {
    const consideration = Math.round(l.size * l.askPct / 100);
    const discount = 100 - l.askPct;
    const toNav = l.askPct ? (100 / l.askPct - 1) * 100 : 0;
    const asOffering = { ...l, fills: l.sub, liq: "Immediate", retNum: toNav,
      fit: Math.max(5, Math.min(95, Math.round(50 + discount * 2))) };
    const sc = scoreFor(asOffering, ctx);
    return {
      asOffering, sc, consideration, discount, toNav, irr: currentIRR(l),
      why: discount > 0
        ? "Acquires " + usd(l.size) + " of stated NAV for " + usd(consideration) + " — a " + pct(discount) + " discount to the last mark."
        : "Priced " + pct(-discount) + " above the last mark — the ask is for access, not for value.",
    };
  }


  /* ------------------------------------------------ secondary: IRR to date */
  /* What the interest has actually returned in the seller's hands, annualised
     from its own capital account. A commitment is a promise, not a cash flow;
     a mark-up and reinvested income move the valuation, not the cash. The last
     NAV mark stands in as the terminal value — which makes this an IRR to the
     manager's own mark, not a realised one. */
  const CASH_OUT = /call|funded|purchase|subscription/i;
  const CASH_IN = /coupon|distribution/i;
  function xirr(flows) {
    if (flows.length < 2) return null;
    const t0 = flows[0].t;
    const years = (d) => (d - t0) / 31557600000;
    const npv = (r) => flows.reduce((a, f) => a + f.a / Math.pow(1 + r, years(f.t)), 0);
    let lo = -0.95, hi = 10;
    if (npv(lo) * npv(hi) > 0) return null;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (npv(lo) * npv(mid) <= 0) hi = mid; else lo = mid;
    }
    return ((lo + hi) / 2) * 100;
  }
  function currentIRR(l) {
    if (!l || !l.account) return null;
    const flows = [];
    let terminal = null, firstDate = null;
    l.account.forEach((r) => {
      const t = new Date(r[0]);
      if (/NAV mark/i.test(r[1])) { terminal = { t, a: r[2] }; return; }
      if (CASH_OUT.test(r[1])) { flows.push({ t, a: -r[2] }); if (!firstDate) firstDate = r[0]; return; }
      if (CASH_IN.test(r[1])) flows.push({ t, a: r[2] });
    });
    if (terminal) flows.push(terminal);
    let irr = xirr(flows);
    if (irr === null) return null;
    if (Math.abs(irr) < 0.05) irr = 0;          /* do not print a signed zero */
    return { irr, since: firstDate ? firstDate.slice(0, 4) : null, markDate: terminal ? terminal.t : null, n: flows.length };
  }


  /* Prior transfers of an interest, newest first, with where the current ask
     sits against the last one that cleared. */
  function tradeHistory(listingId, trades, askPct) {
    const rows = (trades || []).filter((t) => t.listing === listingId)
      .sort((a, b) => (a.ts < b.ts ? 1 : -1));
    if (!rows.length) return { rows, last: null, vsLast: null };
    const last = rows[0];
    return { rows, last, vsLast: askPct === undefined ? null : askPct - last.pricePct };
  }


  /* Where a marketplace offering would land. An offering is not owned, so it
     has no bucket of its own: the subcategory decides, the stated target
     return decides the rung, and the sector decides the theme. Themes are
     matched on what the offering is about, not on its asset class. */
  const THEME_BY_SECTOR = {
    "Technology": "privtech", "Fintech": "privtech", "Aerospace": "privtech",
    "Info Tech": "pubtech", "Comm Services": "pubtech",
    "Data Centers": "gpu", "Infrastructure": "gpu", "Digital Assets": "gpu",
  };
  const THEME_BY_SUB = { vc: "venture", pe: "venture", preipo: "privtech", comm: "energy" };
  /* Themes only exist inside conviction, so an offering that names one is
     conviction whatever its instrument happens to be — a behind-the-meter
     power SPV is a view, not a yield product, even though it is infrastructure. */
  function offerBucket(m) {
    if (m.bucket) return m.bucket;
    if (m.theme) return "conviction";
    return bucketKeyOf({ sub: m.fills });
  }
  function offerRung(m) {
    const r = typeof m.retNum === "number" ? m.retNum : D.SHELF_FLOOR;
    return Math.max(D.SHELF_FLOOR, Math.min(D.SHELF_CEIL, Math.round(r)));
  }
  function offerTheme(m) {
    if (m.theme) return m.theme;
    return THEME_BY_SECTOR[m.sector] || THEME_BY_SUB[m.fills || m.sub] || "privtech";
  }
  /* The one line a row needs: which bucket, and where inside it. */
  function offerPlace(m) {
    const b = offerBucket(m);
    if (b === "conviction") {
      const th = D.themes.find((x) => x.key === offerTheme(m));
      return { bucket: "conviction", label: "Conviction", detail: th ? th.label : "—", color: "#9A7B2E", theme: th };
    }
    const r = offerRung(m);
    const f = r === null ? null : D.anchorShelf.find((x) => x.band === r);
    return {
      bucket: "engine", label: "Anchor", color: "#1B2A4A", rung: r,
      detail: f ? f.name + " fund" : "—",
    };
  }

  /* ------------------------------------------------ building the anchor ----
     The family states a target yield; the basket is built for it. A minimum
     dollar amount is always held in the cash fund, so the rest of the anchor
     has to carry the whole target on its own — asking for 8% while $1.5M sits
     at 3.8% is not an 8% problem for the remainder.

     The basket is a tent across the shelf: full weight on the fund nearest
     the centre, falling away either side, so the result is a spread of funds
     rather than a single bet. The centre is solved by bisection until the
     weighted mean clears what the remainder has to earn. Near the ends of the
     shelf the tent is clipped, which narrows the basket on its own — asking
     for exactly 5% gets you the 5% fund and nothing else, and that is correct. */
  /* How wide the basket spreads either side of its centre. Five rungs reaches
     the 11% and 12% funds from an 8% target without spilling into the 13%
     one — a genuine spread rather than a token weight at the top. */
  const TENT = 5;
  function tentWeights(c) {
    const raw = D.anchorShelf.map((f) => Math.max(0, 1 - Math.abs(f.band - c) / TENT));
    const sum = raw.reduce((a, b) => a + b, 0);
    if (!sum) return D.anchorShelf.map(() => 0);
    return raw.map((x) => x / sum);
  }
  function tentMean(c) {
    const w = tentWeights(c);
    return w.reduce((a, x, i) => a + x * D.anchorShelf[i].band, 0);
  }

  function buildAnchor(anchorValue, target, cashFloor) {
    const cash = Math.max(0, Math.min(cashFloor, anchorValue));
    const rest = Math.max(0, anchorValue - cash);
    if (rest <= 0) {
      return { cash, rest: 0, rows: [], blended: D.cashFund.yield, needed: 0,
        reachable: target <= D.cashFund.yield + 0.05, cashPct: 100 };
    }
    /* what the non-cash remainder has to earn for the whole anchor to hit target */
    const needed = (target * anchorValue - D.cashFund.yield * cash) / rest;
    /* the centre can sit outside the shelf; the tent clips and the basket narrows */
    let lo = D.SHELF_FLOOR - TENT + 0.5, hi = D.SHELF_CEIL + TENT - 0.5;
    const reachable = needed >= tentMean(lo) - 0.01 && needed <= tentMean(hi) + 0.01;
    for (let k = 0; k < 44; k++) {
      const m = (lo + hi) / 2;
      if (tentMean(m) < needed) lo = m; else hi = m;
    }
    const c = (lo + hi) / 2;
    const w = tentWeights(c);
    const rows = D.anchorShelf
      .map((f, i) => ({ ...f, pct: w[i] * 100, ofAnchor: (w[i] * rest / anchorValue) * 100, value: w[i] * rest }))
      .filter((r) => r.pct > 0.05);
    const blended = (tentMean(c) * rest + D.cashFund.yield * cash) / anchorValue;
    return { cash, rest, rows, blended, needed, centre: c, reachable,
      cashPct: (cash / anchorValue) * 100, spread: rows.length };
  }

  /* The four-class mix a rung and a split imply — used only to drive the
     projection, which has to reason in classes to reach a volatility. It is
     never shown as an allocation. A higher rung means the anchor reaches for
     return through equity-like risk rather than through duration. */
  function modelFour(target, conv) {
    const b = Math.max(D.SHELF_FLOOR, Math.min(D.SHELF_CEIL, target)) - D.SHELF_FLOOR;
    const a = (100 - conv) / 100;
    /* eight rungs now, not ten, so the tilt per rung widens to span the same
       distance between the most defensive fund and the most aggressive */
    return {
      equity: a * (4 + b * 3.75) + conv,
      debt:   a * (72 - b * 5.0),
      real:   a * (14 + b * 1.25),
      cash:   a * 10,
    };
  }

  /* ------------------------------------------------- the anchor shelf ------ */
  /* What a holding actually earns, so it can be placed on the shelf. A stated
     yield is used where the instrument has one; otherwise the subcategory's
     long-run expectation stands in. This is an expectation, not a promise,
     and the screen says so. */
  const SUB_RETURN = {
    pubeq: 8.0, pe: 14.0, vc: 20.0, preipo: 16.0,
    sov: 4.2, ig: 5.2, pcred: 9.0, struct: 7.0,
    re: 8.0, infra: 9.0, comm: 5.0,
    mmf: 3.5, tbill: 4.2, dep: 2.6, fx: 0.5,
  };
  /* For debt and cash the income is the return, so a stated yield is the whole
     answer. For equity and real assets it is not: a building yielding 4.2% is
     not a 4.2% asset, and treating it as one would push every property below
     the shelf for the wrong reason. There the yield is added to a capital
     return the subcategory is expected to deliver. */
  const INCOME_ONLY = ["sov", "ig", "pcred", "struct", "mmf", "tbill", "dep", "fx"];
  const GROWTH_ADD = { re: 3.5, infra: 3.0, comm: 5.0, pubeq: 8.0, pe: 14.0, vc: 20.0, preipo: 16.0 };
  function posReturn(p) {
    const y = typeof p.ytm === "number" && p.ytm > 0 ? p.ytm
      : typeof p.yieldPct === "number" && p.yieldPct > 0 ? p.yieldPct : 0;
    const fallback = SUB_RETURN[p.sub] !== undefined ? SUB_RETURN[p.sub] : 0;
    if (INCOME_ONLY.indexOf(p.sub) >= 0) return y > 0 ? y : fallback;
    return y > 0 ? y + (GROWTH_ADD[p.sub] || 0) : fallback;
  }

  /* Which rung a holding sits on. A holding earning less than the lowest fund
     sits on the lowest rung rather than outside the shelf: sovereigns, bills
     and deposits are exactly what that fund holds, and a book whose parts do
     not sum to the whole is worse than one that rounds down. */
  function rungOf(p) {
    const r = posReturn(p);
    return Math.max(D.SHELF_FLOOR, Math.min(D.SHELF_CEIL, Math.round(r)));
  }

  /* Bucket membership is carried on the position. Marketplace offerings are
     not owned by anybody, so they fall back to the subcategory mapping. */
  function bucketKeyOf(p) {
    if (p && p.bucket) return p.bucket;
    const b = D.buckets.find((x) => x.subs.indexOf(p.sub || p.fills) >= 0);
    return b ? b.key : "engine";
  }
  function inBucket(ps, key) { return ps.filter((p) => bucketKeyOf(p) === key); }

  /* The conviction share the model recommends at a given rung. The three
     postures the family already uses fall out of rungs 5, 7 and 11. */
  function splitForBand(band) {
    const b = Math.max(D.SHELF_FLOOR, Math.min(D.SHELF_CEIL, band));
    return Math.round(5 + (b - D.SHELF_FLOOR) * 2.5);
  }

  /* The anchor laid out as the shelf it is: one row per rung the family
     actually holds something on. */
  function anchorLadder(ps, chosen) {
    const eng = inBucket(ps, "engine");
    const t = total(ps) || 1;
    const ev = total(eng) || 1;
    const rows = D.anchorShelf.map((f) => {
      const items = eng.filter((p) => rungOf(p) === f.band);
      const v = total(items);
      return { ...f, items, value: v, count: items.length,
        wt: (v / t) * 100, ofAnchor: (v / ev) * 100, chosen: f.band === chosen };
    });
    /* the anchor's blended expected return, as held — which is where the gap
       between what is owned and what was asked for shows up */
    const blended = ev ? eng.reduce((a, p) => a + posReturn(p) * p.value, 0) / ev : 0;
    return { rows, anchorValue: ev, blended };
  }

  /* Conviction, grouped by the thing the family has a view about. */
  function byTheme(ps, picked) {
    const conv = inBucket(ps, "conviction");
    const t = total(ps) || 1;
    const cv = total(conv) || 1;
    return D.themes.map((th) => {
      const items = conv.filter((p) => p.theme === th.key);
      const v = total(items);
      const sp = spread(items.length ? items : [], null);
      return { ...th, items, value: v, count: items.length,
        wt: (v / t) * 100, ofConviction: (v / cv) * 100,
        unrealized: unrealized(items),
        picked: picked ? picked.indexOf(th.key) >= 0 : items.length > 0,
        effective: sp.effective, largest: sp.largest };
    });
  }

  /* ------------------------------------------------- risk / return buckets */
  function bucketOf(subKey) { return D.buckets.find((b) => b.subs.indexOf(subKey) >= 0) || null; }
  function bucketLabel(subKey) { const b = bucketOf(subKey); return b ? b.label : "—"; }

  /* The book split by what capital is for. Membership comes off the position,
     so a listed company held by name lands in Conviction while the same
     exposure bought as an index slice stays in the Anchor. The disclosure one
     level down is the shelf for the Anchor and the themes for Conviction —
     never a list of asset classes. */
  function byBucket(ps, convShare) {
    const t = total(ps);
    const conv = convShare === undefined || convShare === null ? D.RISK_BASE.conviction
      : Math.max(0, Math.min(100, convShare));
    return D.buckets.map((b) => {
      const items = inBucket(ps, b.key);
      const v = total(items);
      const wt = t ? (v / t) * 100 : 0;
      const target = b.key === "conviction" ? conv : 100 - conv;
      return {
        ...b, items, value: v, wt, target, drift: wt - target, count: items.length,
        unrealized: unrealized(items),
      };
    });
  }

  /* How concentrated a bucket is, and across how many uncorrelated exposures.
     Always show how the portfolio could be improved, and diversifying
     across geography and sector is the example he gave. */
  function spread(ps, subs) {
    const items = ps.filter((p) => !subs || subs.indexOf(p.sub) >= 0);
    const t = total(items) || 1;
    const by = (k) => {
      const m = {};
      items.forEach((p) => { const v = p[k] || "—"; m[v] = (m[v] || 0) + p.value; });
      return Object.keys(m).map((v) => ({ v, wt: (m[v] / t) * 100 })).sort((a, b) => b.wt - a.wt);
    };
    const geos = by("geo"), sectors = by("sector");
    /* Herfindahl on position weights: 1 is one holding, near 0 is many equal ones. */
    const hhi = items.reduce((a, p) => a + Math.pow(p.value / t, 2), 0);
    return {
      n: items.length, geos, sectors, hhi,
      effective: hhi ? 1 / hhi : 0,
      topGeo: geos[0] || null, topSector: sectors[0] || null,
      largest: items.slice().sort((a, b) => b.value - a.value)[0] || null,
    };
  }

  /* What folding the working balance into Engine costs. Engine carries a
     7–20% target; the sovereigns, deposits and T-bills now inside it do not
     earn anything like that. DW confirmed two buckets, so rather than hide
     this in a third line the product reads it off the book and says it. */
  const IDLE_SUBS = ["mmf", "tbill", "dep", "fx", "sov"];
  function engineDrag(ps) {
    const eng = D.buckets.find((b) => b.key === "engine");
    const items = ps.filter((p) => eng.subs.indexOf(p.sub) >= 0);
    const ev = total(items);
    const idle = items.filter((p) => IDLE_SUBS.indexOf(p.sub) >= 0);
    const iv = total(idle);
    const yld = iv ? idle.reduce((a, p) => a + (p.ytm || p.yieldPct || 0) * p.value, 0) / iv : 0;
    return {
      engineValue: ev, idleValue: iv, count: idle.length,
      share: ev ? (iv / ev) * 100 : 0,
      ofBook: total(ps) ? (iv / total(ps)) * 100 : 0,
      yield: yld,
    };
  }

  /* ----------------------------------------------------------- projection */
  /* A lognormal fan: the mean path plus the 10th and 90th percentiles, given
     the class weights, their expected returns, their volatilities and how
     they move together. Not a forecast — a range of outcomes the assumptions
     imply. */
  function projectMix(w, v0, years, ps) {
    const mu = D.classes.reduce((a, c) => a + (w[c.key] / 100) * (D.expectedReturn[c.key] / 100), 0);
    let varSum = 0;
    D.classes.forEach((a) => D.classes.forEach((b) => {
      varSum += (w[a.key] / 100) * (w[b.key] / 100)
        * (D.expectedVol[a.key] / 100) * (D.expectedVol[b.key] / 100) * D.classCorr[a.key][b.key];
    }));
    const marketVar = varSum;

    /* If we are given the actual holdings, charge for the single names in them.
       A model expressed in classes carries no such risk: it is an index by
       construction, which is most of why it sits lower. */
    let specificVar = 0;
    if (ps) {
      const tot = total(ps);
      ps.filter((p) => p.cls === "equity" && isListed(p) && p.grp !== "ETF").forEach((p) => {
        const wt = p.value / tot;
        specificVar += wt * wt * Math.pow(D.idiosyncraticVol / 100, 2);
      });
    }
    varSum = marketVar + specificVar;
    const sigma = Math.sqrt(varSum);
    const drift = Math.log(1 + mu) - (sigma * sigma) / 2;
    const Z = 1.2816;                                   // 10th / 90th percentile
    const path = [];
    for (let y = 0; y <= years; y++) {
      const sd = sigma * Math.sqrt(y);
      path.push({
        y,
        mean: v0 * Math.pow(1 + mu, y),
        p10: v0 * Math.exp(drift * y - Z * sd),
        p90: v0 * Math.exp(drift * y + Z * sd),
      });
    }
    return {
      mu: mu * 100, sigma: sigma * 100, path,
      marketSigma: Math.sqrt(marketVar) * 100,
      specificSigma: specificVar ? (Math.sqrt(varSum) - Math.sqrt(marketVar)) * 100 : 0,
    };
  }

  /* --------------------------------------------- what the family faces now */
  /* The three situations a recommendation has to answer to: where the book
     sits against the model, what the next two years of cash look like, and
     what has already been realised for tax. */
  /* `closedRealised` carries the realised P&L of positions already sold out,
     which the positions array no longer holds. Without it a harvest would
     lower the Tax tab's figure while the agent kept scoring the old one. */
  function marketContext(ps, mandateKey, closedRealised) {
    const t = total(ps);
    const model = modelWeights(t, mandateKey);
    const cur = {}, under = {};
    bySub(ps).forEach((s) => { cur[s.key] = s.wt; });
    D.subs.forEach((s) => { under[s.key] = model.subs[s.key] - (cur[s.key] || 0); });

    const short = shortfall(ps);
    const credit = borrowingPower(ps);
    const calls24 = sum(D.capitalCalls, (c) => c.amount);
    const calls90 = sum(D.capitalCalls.filter((c) => days(D.TODAY, c.date) <= 90 && days(D.TODAY, c.date) >= 0), (c) => c.amount);

    const lots = taxLots(ps);
    const harvest = lots.filter((l) => l.harvest);
    const tax = {
      realized: realizedYTD(ps) + (closedRealised || 0),
      harvestable: Math.abs(sum(harvest, (l) => l.gain)),
      harvestCount: harvest.length,
      nearLT: lots.filter((l) => !l.longTerm && l.held > 300).length,
    };

    /* 0 = calls are comfortably covered, 1 = the runway breaks inside 24 months */
    /* how pressed the book is: calls ahead against what it can borrow without
       selling anything */
    const stress = short ? 1 : Math.min(1, calls24 / Math.max(credit.now, 1));
    const worst = D.subs.map((s) => ({ ...s, under: under[s.key] }))
      .sort((a, b) => b.under - a.under)[0];

    return { t, model, cur, under, short, credit, calls24, calls90, tax, stress, worst };
  }

  /* A score with its reasons attached. Instrument merit still counts, but it
     is weighed against the three situations above rather than standing alone. */
  function scoreFor(m, ctx) {
    const merit = m.fit;
    const allocation = Math.round(Math.max(0, Math.min(100, 50 + (ctx.under[m.fills] || 0) * 6)));

    /* Interest and coupons are taxed as they arrive; capital gains wait for the
       exit. With gains already booked this year, deferral is worth something. */
    const deferred = ["pe", "vc", "preipo"].indexOf(m.fills) >= 0;
    const incomeNow = (m.retNum || 0) >= 5 && !deferred;
    let tax = 50 + (deferred ? 25 : 0) - (incomeNow && ctx.tax.realized > 250000 ? 20 : 0);
    tax = Math.max(0, Math.min(100, tax));

    /* Three grounds, not four. Liquidity was a real question when some of the
       book could not be sold; now that all of it can, scoring it would be
       scoring a constant. */
    const score = Math.round(0.42 * merit + 0.36 * allocation + 0.22 * tax);
    return { score, merit, allocation, tax };
  }

  /* What it would take of this offering to bring its subcategory to the model.
     Offerings carry no minimum, so the gap — capped at fundable cash — is
     the answer. */
  function suggestAmount(m, ctx, funds) {
    const gap = ((ctx.under[m.fills] || 0) / 100) * ctx.t;
    if (gap <= 0) return null;
    let amount = Math.round(gap / 1e4) * 1e4;
    let basis = "to reach the model";
    /* a proposal nobody can fund is not a proposal */
    if (funds !== undefined && amount > funds) {
      amount = Math.floor(funds / 1e4) * 1e4;
      basis = "as far as cash goes";
    }
    return { amount, gap, basis };
  }

  /* -------------------------------------------------------- deal fit logic */
  function fitFor(item, ps) {
    const g = bySub(ps).find((s) => s.key === item.fills);
    return { sub: g, closes: g ? -g.drift : 0 };
  }
  function subLabel(k) { const s = D.subs.find((x) => x.key === k); return s ? s.label : k; }
  function clsLabel(k) { const c = D.classes.find((x) => x.key === k); return c ? c.label : k; }
  /* Which of the six model classes a subcategory belongs to. */
  function modelClassOf(subKey) { return D.modelClasses.find((c) => c.subs.indexOf(subKey) >= 0) || null; }
  function modelClassLabel(subKey) { const c = modelClassOf(subKey); return c ? c.label : clsLabel(subKey); }
  function clsOf(subKey) { const s = D.subs.find((x) => x.key === subKey); return s ? s.cls : null; }

  /* impact of a hypothetical transaction on the allocation */
  /* What a commitment does to the one model class it lands in. The book's
     total does not change — cash converts into the class — so the weight moves
     against a constant denominator. */
  function impactSix(ps, subKey, amount, goalKey) {
    const c = modelClassOf(subKey);
    if (!c) return null;
    const held = bySix(ps);
    const t = held.total || 1;
    const before = held.pct[c.key];
    const after = ((held.value[c.key] + amount) / t) * 100;
    const model = modelSix(t, goalKey);
    const target = model.blocked[c.key] ? null : model.w[c.key];
    return { c, before, after, target, driftAfter: target === null ? null : after - target };
  }

  /* The same question asked of the bucket the commitment lands in:
     the buying surface answers to the two buckets, so a ticket says which one
     it moves before it says which asset class. */
  function impactBucket(ps, subKey, amount, split) {
    const b = bucketOf(subKey);
    if (!b) return null;
    const t = total(ps) || 1;
    const held = total(ps.filter((p) => b.subs.indexOf(p.sub) >= 0));
    const conv = convPct(split);
    const target = b.key === "conviction" ? conv : 100 - conv;
    const before = (held / t) * 100;
    const after = ((held + amount) / t) * 100;
    return { b, before, after, target, driftAfter: after - target };
  }

  function impact(ps, subKey, amount) {
    const before = bySub(ps).find((s) => s.key === subKey);
    const t = total(ps);
    const afterWt = ((before.value + amount) / (t + (amount > 0 ? 0 : 0))) * 100;
    const clsKey = clsOf(subKey);
    const cb = byClass(ps).find((c) => c.key === clsKey);
    const cAfterWt = ((cb.value + amount) / t) * 100;
    return {
      sub: before, subAfter: afterWt, subDriftAfter: afterWt - before.target,
      cls: cb, clsAfter: cAfterWt, clsDriftAfter: cAfterWt - cb.target,
    };
  }

  BB.u = {
    usd, usdC, krwC, krwFull, pct, pp, sgn, sgnUsd, num, localPx, days, fmtDate, fmtTs, monthKey, monthLabel,
    staleness, provLabel, sum, total, byClass, bySub, gaps, unrealized, realizedYTD,
    isListed, markSource, marked, advanceOf, borrowingPower, exitValue, exitToday, raiseCost, liquidityProjection, shortfall, coverage, projectMix,
    modelSix, convPct, bySix, sixToFour, sixToSubs, pickForClass, holdingsSix, geoBucket, GEO_BUCKETS, listingDocs, listingView, currentIRR, tradeHistory, impactSix, impactBucket, modelClassOf, modelClassLabel, bucketOf, bucketLabel, byBucket, spread, engineDrag, posReturn, rungOf, bucketKeyOf, inBucket, splitForBand, modelFour, buildAnchor, anchorLadder, offerBucket, offerRung, offerTheme, offerPlace, byTheme, SUB_RETURN, topHoldings, affiliateExposure, taxLots, eligibility,
    fitFor, subLabel, clsLabel, clsOf, impact, modelWeights, marketContext, scoreFor, suggestAmount,
  };
})();
