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
  function sleeveTotals(ps) {
    const t = total(ps);
    const core = total(ps.filter((p) => p.sleeve === "core"));
    const alpha = total(ps.filter((p) => p.sleeve === "alpha"));
    return { core, alpha, total: t, corePct: (core / t) * 100, alphaPct: (alpha / t) * 100 };
  }
  function unrealized(ps) { return sum(ps, (p) => p.value - p.cost); }
  function realizedYTD(ps) { return sum(ps, (p) => p.realizedYTD || 0); }

  /* 90-day liquidity: cash equivalents plus anything redeemable inside the window. */
  function liquidity90(ps) {
    const cash = total(ps.filter((p) => p.cls === "cash"));
    const quarterly = total(ps.filter((p) => p.liq === "Quarterly"));
    const listed = total(ps.filter((p) => p.cls !== "cash" && p.liq === "Daily"));
    return { cash, quarterly, listed, immediate: cash, within90: cash + quarterly };
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
    const pool = ps.filter((p) => p.liq === "Daily" && p.cls !== "cash" && !p.affiliate)
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
        harvest: gain < 0 && p.liq === "Daily",
      };
    });
  }

  /* -------------------------------------------------- secondary eligibility */
  function eligibility(p) {
    if (p.liq === "Daily") return { ok: false, reason: "Listed — sells through the order ticket", listed: true };
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
  /* Interpolates the published tiers on log AUM, then applies the rule that
     decides what a family this size can actually own: a private sleeve whose
     dollar allocation cannot clear its minimum cheque is not a recommendation,
     it is a rounding error. Those are zeroed and their weight returned to the
     public sibling, with the arithmetic kept so the screen can show its work. */
  function modelSix(aum, goalKey) {
    const g = D.modelMatrix[goalKey] ? goalKey : "balanced";
    const x = Math.max(0, Math.min(2, Math.log10(Math.max(aum, 1e6) / 1e6)));
    const lo = x < 1 ? 1 : 10, hi = x < 1 ? 10 : 100, f = x < 1 ? x : x - 1;
    const A = D.modelMatrix[g][lo], B = D.modelMatrix[g][hi];

    const w = {};
    D.modelClasses.forEach((c) => { w[c.key] = A[c.key] * (1 - f) + B[c.key] * f; });

    const sibling = { priveq: "pubeq", privdebt: "pubdebt" };
    const blocked = {};
    Object.keys(sibling).forEach((k) => {
      const c = D.modelClasses.find((x2) => x2.key === k);
      const dollars = (w[k] / 100) * aum;
      /* the objective can rule it out outright; otherwise the cheque decides */
      const byGoal = A[k] === 0 && B[k] === 0;
      if (w[k] <= 0 || byGoal || dollars < c.min) {
        blocked[k] = {
          why: byGoal || w[k] <= 0 ? (g === "preservation" ? "goal" : "size") : "size",
          pct: w[k], dollars, min: c.min, to: sibling[k],
        };
        w[sibling[k]] += w[k];
        w[k] = 0;
      }
    });
    return { w, blocked, goal: g, tier: { lo, hi, f } };
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
      ps.filter((p) => p.cls === "equity" && p.liq === "Daily" && p.grp !== "ETF").forEach((p) => {
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
  function marketContext(ps, mandateKey) {
    const t = total(ps);
    const model = modelWeights(t, mandateKey);
    const cur = {}, under = {};
    bySub(ps).forEach((s) => { cur[s.key] = s.wt; });
    D.subs.forEach((s) => { under[s.key] = model.subs[s.key] - (cur[s.key] || 0); });

    const short = shortfall(ps);
    const liq = liquidity90(ps);
    const calls24 = sum(D.capitalCalls, (c) => c.amount);
    const calls90 = sum(D.capitalCalls.filter((c) => days(D.TODAY, c.date) <= 90 && days(D.TODAY, c.date) >= 0), (c) => c.amount);

    const lots = taxLots(ps);
    const harvest = lots.filter((l) => l.harvest);
    const tax = {
      realized: realizedYTD(ps),
      harvestable: Math.abs(sum(harvest, (l) => l.gain)),
      harvestCount: harvest.length,
      nearLT: lots.filter((l) => !l.longTerm && l.held > 300).length,
    };

    /* 0 = calls are comfortably covered, 1 = the runway breaks inside 24 months */
    const stress = short ? 1 : Math.min(1, calls24 / Math.max(liq.within90, 1));
    const worst = D.subs.map((s) => ({ ...s, under: under[s.key] }))
      .sort((a, b) => b.under - a.under)[0];

    return { t, model, cur, under, short, liq, calls24, calls90, tax, stress, worst };
  }

  /* A score with its reasons attached. Instrument merit still counts, but it
     is weighed against the three situations above rather than standing alone. */
  function scoreFor(m, ctx) {
    const merit = m.fit;
    const allocation = Math.round(Math.max(0, Math.min(100, 50 + (ctx.under[m.fills] || 0) * 6)));

    const locked = m.liq === "Locked", quarterly = m.liq === "Quarterly";
    const tight = ctx.stress > 0.6;
    const liquidity = tight ? (locked ? 32 : quarterly ? 62 : 88)
                            : (locked ? 78 : quarterly ? 72 : 60);

    /* Interest and coupons are taxed as they arrive; capital gains wait for the
       exit. With gains already booked this year, deferral is worth something. */
    const deferred = ["pe", "vc", "preipo"].indexOf(m.fills) >= 0;
    const incomeNow = (m.retNum || 0) >= 5 && !deferred;
    let tax = 50 + (deferred ? 25 : 0) - (incomeNow && ctx.tax.realized > 250000 ? 20 : 0);
    tax = Math.max(0, Math.min(100, tax));

    const score = Math.round(0.35 * merit + 0.30 * allocation + 0.20 * liquidity + 0.15 * tax);
    return { score, merit, allocation, liquidity, tax };
  }

  /* What it would take of this offering to bring its subcategory to the model.
     If that is less than the offering will accept, the minimum is the answer. */
  function suggestAmount(m, ctx, funds) {
    const gap = ((ctx.under[m.fills] || 0) / 100) * ctx.t;
    if (gap <= 0) return null;
    let amount = Math.round(Math.max(gap, m.min) / 1e4) * 1e4;
    let basis = m.min > gap ? "the minimum" : "to reach the model";
    /* a proposal nobody can fund is not a proposal */
    if (funds !== undefined && amount > funds) {
      if (m.min > funds) return { amount: m.min, gap, basis: "above available cash", unfunded: true };
      amount = Math.floor(funds / 1e4) * 1e4;
      basis = "as far as cash goes";
    }
    return { amount, gap, basis, atMinimum: m.min > gap };
  }

  /* -------------------------------------------------------- deal fit logic */
  function fitFor(item, ps) {
    const g = bySub(ps).find((s) => s.key === item.fills);
    return { sub: g, closes: g ? -g.drift : 0 };
  }
  function subLabel(k) { const s = D.subs.find((x) => x.key === k); return s ? s.label : k; }
  function clsLabel(k) { const c = D.classes.find((x) => x.key === k); return c ? c.label : k; }
  function clsOf(subKey) { const s = D.subs.find((x) => x.key === subKey); return s ? s.cls : null; }

  /* impact of a hypothetical transaction on the allocation */
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
    staleness, provLabel, sum, total, byClass, bySub, gaps, sleeveTotals, unrealized, realizedYTD,
    liquidity90, liquidityProjection, shortfall, coverage, projectMix,
    modelSix, bySix, sixToFour, sixToSubs, pickForClass, topHoldings, affiliateExposure, taxLots, eligibility,
    fitFor, subLabel, clsLabel, clsOf, impact, modelWeights, marketContext, scoreFor, suggestAmount,
  };
})();
