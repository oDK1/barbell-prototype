/* =============================================================================
   Take 2 — The book.

   Chart-led on purpose. Take 1 opens the portfolio on a 42-row holdings table;
   here the first thing on screen is the shape of the balance sheet, and the
   rows are one tab behind it. The Guidance tab is where the AUM-based advice
   lives — a curve you can scrub rather than a static recommendation.
   ============================================================================= */
(function () {
  const D = BB.data, u = BB.u, U = T2.ui, S = T2.store, T = T2.data, CH = T2.charts;
  const h = U.h;

  const TABS = [
    { k: "alloc", label: "Allocation" },
    { k: "guide", label: "Guidance" },
    { k: "liq", label: "Liquidity" },
    { k: "perf", label: "Performance" },
    { k: "pos", label: "Positions" },
  ];

  /* ------------------------------------------------------------ allocation */
  function AllocTab({ ps }) {
    const cls = u.byClass(ps);
    const total = u.total(ps);
    const rows = cls.map((c) => ({ key: c.key, label: c.label, pct: c.wt, value: c.value, target: c.target }));
    return h("div", { className: "col", style: { gap: 16 } },
      h(U.Card, { title: "How the book is split",
        desc: "Four classes, " + ps.length + " positions, public and private in one number" },
        h(CH.AllocBar, { rows, height: 44 })),

      h("div", { className: "grid g-2-1" },
        h(U.Card, { title: "Distance from target",
          desc: "Guidance, not a queue of trades — nothing here rebalances itself" },
          h(CH.DriftBars, { rows: cls.map((c) => ({
            key: c.key, label: c.label, pct: c.wt, target: c.target, drift: c.drift,
            dollars: ((c.target - c.wt) / 100) * total * -1 })) })),
        h(U.Card, { title: "Concentration" },
          h("div", { className: "col", style: { gap: 11 } },
            u.topHoldings(ps, 5).map((p) =>
              h("div", { key: p.id },
                h("div", { className: "row", style: { gap: 8 } },
                  h(U.Swatch, { cls: p.cls }),
                  h("span", { style: { fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis",
                                       whiteSpace: "nowrap" } }, p.name),
                  h("div", { className: "gap" }),
                  h("span", { className: "strong num tiny" }, u.pct(p.wt, 1))),
                h("div", { className: "meter", style: { marginTop: 5 } },
                  h("div", { style: { width: (p.wt / 15) * 100 + "%", background: U.CLS_COLOR[p.cls] } })))),
            h("div", { className: "note mt-s" },
              "The operating company is ", u.pct(u.affiliateExposure(ps).wt, 1),
              " of the book. Family wealth and family business move together at that weight.")))),

      h("div", { className: "grid g4" }, cls.map((c) =>
        h("div", { key: c.key, className: "card card-p" },
          h("div", { className: "row mb-s" }, h(U.Swatch, { cls: c.key }),
            h("span", { className: "eyebrow" }, c.label)),
          h("div", { className: "stat-val" }, u.usdC(c.value)),
          h("div", { className: "stat-delta" },
            u.pct(c.wt, 1), " held · ", u.pct(c.target, 0), " target"),
          h("div", { className: "tri tiny mt-s" }, c.count, " positions")))));
  }

  /* -------------------------------------------------------------- guidance */
  function GuideTab({ ps }) {
    const st = S.get();
    const total = u.total(ps);
    const [aum, setAum] = React.useState(total);
    const [obj, setObj] = React.useState(st.objective);
    const model = u.modelWeights(aum, obj);
    const cls = u.byClass(ps);
    const mandate = D.mandates.find((m) => m.key === obj);
    const adopted = st.objective === obj && Math.abs(aum - total) < 1;
    const principal = S.isPrincipal();
    const sliderPos = (Math.log10(Math.max(aum, 1e6)) - 6) / (Math.log10(150e6) - 6) * 100;

    return h("div", { className: "col", style: { gap: 16 } },
      h("div", { className: "card" },
        h("div", { className: "card-hd" },
          h("div", null,
            h("h3", null, "What a book this size should look like"),
            h("div", { className: "tri mini", style: { marginTop: 2 } },
              "The recommended mix across $1M to $150M. Your balance sheet is marked on the curve.")),
          h("div", { className: "gap" }),
          h(U.Seg, { value: obj, onChange: setObj,
            options: D.mandates.map((m) => ({ k: m.key, label: m.label })) })),
        h("div", { className: "card-bd" },
          h("div", { className: "row mb", style: { gap: 16 } },
            h("span", { className: "eyebrow" }, "Balance sheet"),
            h("input", { type: "range", className: "slider", min: 0, max: 100, step: 0.5,
              value: sliderPos, style: { flex: 1, maxWidth: 420 },
              onChange: (e) => setAum(Math.pow(10, 6 + (e.target.value / 100) * (Math.log10(150e6) - 6))) }),
            h("span", { className: "strong num", style: { width: 76 } }, u.usdC(aum)),
            Math.abs(aum - total) > 1
              ? h("button", { className: "link tiny", onClick: () => setAum(total) }, "Back to yours")
              : h(U.Pill, { tone: "accent" }, "Your book")),
          h(CH.GlidePath, { objective: obj, aum, height: 268 }),
          h("div", { className: "note accent mt" },
            h("span", { className: "strong" }, mandate.label, " · ", mandate.line), h("br"),
            "The alternatives line rises with size on purpose. A ",
            u.usdC(aum), " balance sheet can absorb capital calls that a ",
            u.usdC(1e6), " one cannot, so the illiquidity budget is a function of the book, not of appetite."))),

      /* The table twin. Aqua and yellow sit below 3:1 on white, so every value
         in the chart above is also readable here as text. */
      h(U.Card, { title: "Your book against the model",
        desc: "At " + u.usdC(aum) + ", " + mandate.label.toLowerCase(),
        right: principal
          ? h(U.Btn, { kind: adopted ? null : "pri", size: "sm", disabled: adopted,
              onClick: () => { S.actions.adoptObjective(obj); setAum(total); } },
              adopted ? "This is your mandate" : "Adopt as mandate")
          : h(U.Pill, { tone: "ghost" }, "Mandate is the Principal's to set"),
        pad: false },
        h("table", null,
          h("thead", null, h("tr", null,
            h("th", null, "Class"),
            h("th", { className: "right" }, "You hold"),
            h("th", { className: "right" }, "Model"),
            h("th", { className: "right" }, "Difference"),
            h("th", { className: "right" }, "In dollars"),
            h("th", null, "Held against model"))),
          h("tbody", null, cls.map((c) => {
            const m = model.classes[c.key];
            const d = c.wt - m;
            const scale = Math.max.apply(null, cls.map((x) =>
              Math.max(x.wt, model.classes[x.key]))) * 1.05;
            return h("tr", { key: c.key },
              h("td", null, h("div", { className: "row", style: { gap: 8 } },
                h(U.Swatch, { cls: c.key }), c.label)),
              h("td", { className: "tnum" }, u.pct(c.wt, 1)),
              h("td", { className: "tnum" }, u.pct(m, 1)),
              h("td", { className: "tnum tri" }, u.pp(d, 1)),
              h("td", { className: "tnum tri" }, u.sgnUsd((m - c.wt) / 100 * total)),
              /* One shared scale across the rows, so the bars compare with each
                 other; the hairline tick is where the model would put it. */
              h("td", { style: { width: 160 } },
                h("div", { className: "bar-track", style: { position: "relative" } },
                  h("div", { style: { width: (c.wt / scale) * 100 + "%",
                                      background: U.CLS_COLOR[c.key] } }),
                  h("div", { style: { position: "absolute", top: -2, bottom: -2,
                                      left: (m / scale) * 100 + "%", width: 2,
                                      background: "var(--ink)" } }))));
          }),
          h("tr", null,
            h("td", { className: "strong" }, "Alternatives"),
            h("td", { className: "tnum strong" },
              u.pct(u.sum(D.ALT_SUBS.map((k) => u.bySub(ps).find((s) => s.key === k).wt)), 1)),
            h("td", { className: "tnum strong" }, u.pct(model.alts, 1)),
            h("td", { className: "tnum tri" },
              u.pp(u.sum(D.ALT_SUBS.map((k) => u.bySub(ps).find((s) => s.key === k).wt)) - model.alts, 1)),
            h("td", { className: "tnum tri" }, "—"), h("td", null, ""))))),

      h(U.Card, { title: "The sub-classes underneath",
        desc: "Fifteen lines — past about seven colours a chart stops helping, so this stays a table",
        pad: false },
        h("table", null,
          h("thead", null, h("tr", null,
            h("th", null, "Sub-class"), h("th", null, "Class"),
            h("th", { className: "right" }, "Held"), h("th", { className: "right" }, "Model"),
            h("th", { className: "right" }, "Difference"), h("th", null, "Note"))),
          h("tbody", null, u.bySub(ps).map((s) =>
            h("tr", { key: s.key },
              h("td", { className: "strong" }, s.label),
              h("td", null, h("div", { className: "row", style: { gap: 7 } },
                h(U.Swatch, { cls: s.cls }), h("span", { className: "tri tiny" }, u.clsLabel(s.cls)))),
              h("td", { className: "tnum" }, u.pct(s.wt, 1)),
              h("td", { className: "tnum" }, u.pct(model.subs[s.key], 1)),
              h("td", { className: "tnum tri" }, u.pp(s.wt - model.subs[s.key], 1)),
              h("td", { className: "tri tiny" }, s.note)))))));
  }

  /* ------------------------------------------------------------- liquidity */
  function LiqTab({ ps }) {
    const proj = u.liquidityProjection(ps);
    const short = u.shortfall(ps);
    const liq = u.liquidity90(ps);
    const cover = short ? u.coverage(ps, short.amount) : null;
    const floor = D.liquidityAssumptions.reserveFloor;
    return h("div", { className: "col", style: { gap: 16 } },
      h("div", { className: "grid g3" },
        h(U.Stat, { label: "Cash today", value: u.usdC(liq.cash), delta: "Settles same day" }),
        h(U.Stat, { label: "Liquid within 90 days", value: u.usdC(liq.within90),
                    delta: "Cash plus quarterly-dealing funds" }),
        h(U.Stat, { label: "Listed and sellable", value: u.usdC(liq.listed),
                    delta: "Excludes the operating company" })),

      h(U.Card, { title: "Projected cash, 24 months",
        desc: "Income and spend from the family's own assumptions, plus every scheduled call and distribution" },
        h(CH.CashRunway, { months: proj, floor }),
        short
          ? h("div", { className: "note crit mt" },
              h("span", { className: "strong" }, "Cash goes short in ", short.month, " by ",
                u.usd(short.amount, 0), "."), " ",
              short.quarter, " carries ", u.usd(short.quarterCalls, 0),
              " of calls against a reserve floor of ", u.usd(floor, 0),
              ". Selling ",
              cover.items.slice(0, 2).map((p) => p.name).join(" and "),
              " would cover it — both are daily-dealing and neither is the operating company.")
          : h("div", { className: "note mt" }, "Cash stays above the reserve floor across the whole projection.")),

      h(U.Card, { title: "Calls and distributions by month",
        desc: "A second chart rather than a second axis on the one above" },
        h(CH.CallColumns, { months: proj })),

      h(U.Card, { title: "The schedule", pad: false },
        h("table", null,
          h("thead", null, h("tr", null,
            h("th", null, "Date"), h("th", null, "Fund"), h("th", null, "Kind"),
            h("th", { className: "right" }, "Amount"), h("th", null, "Status"))),
          h("tbody", null,
            D.capitalCalls.map((c) => ({ ...c, kind: "Capital call" }))
              .concat(D.distributions.map((d) => ({ ...d, kind: "Distribution" })))
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 12)
              .map((r, i) => h("tr", { key: i },
                h("td", { className: "tnum", style: { textAlign: "left" } }, u.fmtDate(r.date)),
                h("td", null, r.fund),
                h("td", null, h(U.Pill, { tone: r.kind === "Capital call" ? "crit" : "good" }, r.kind)),
                h("td", { className: "tnum" }, u.usd(r.amount, 0)),
                h("td", { className: "tri tiny" }, r.status)))))));
  }

  /* ----------------------------------------------------------- performance */
  function PerfTab({ ps }) {
    const [per, setPer] = React.useState("YTD");
    const p = D.performance[per];
    return h("div", { className: "col", style: { gap: 16 } },
      h("div", { className: "filters" },
        h("span", { className: "lbl" }, "Period"),
        h(U.Seg, { value: per, onChange: setPer,
          options: ["MTD", "QTD", "YTD", "ITD"].map((k) => ({ k, label: k })) })),
      h("div", { className: "grid g4" },
        h(U.Stat, { label: "Portfolio", value: u.pct(p.port, 1), tone: p.port >= 0 ? "pos" : "neg" }),
        h(U.Stat, { label: "Benchmark", value: u.pct(p.bench, 1),
                    delta: D.benchmark.label, }),
        h(U.Stat, { label: "Excess", value: u.pp(p.port - p.bench, 1),
                    tone: p.port - p.bench >= 0 ? "pos" : "neg", delta: "Against the stated benchmark" }),
        h(U.Stat, { label: "Currency effect", value: u.pp(p.fx, 1), tone: p.fx >= 0 ? "pos" : "neg",
                    delta: "KRW translation · hedged would be " + u.pct(p.hedged, 1) })),
      h(U.Card, { title: "What moved it",
        desc: "Contribution in percentage points, " + per },
        h(CH.Attribution, { rows: D.attribution[per] })),
      h("div", { className: "note" },
        "Reported in USD. The family reports to the tax authority in KRW, so the currency line is shown ",
        "separately rather than folded into the return — at ₩", D.KRW, " to the dollar it is the ",
        "difference between a good year and an ordinary one."));
  }

  /* ------------------------------------------------------------- positions */
  function PosTab({ ps }) {
    const st = S.get();
    const [cls, setCls] = React.useState("all");
    const [q, setQ] = React.useState("");
    const [sort, setSort] = React.useState("value");
    let rows = ps.filter((p) => (cls === "all" || p.cls === cls) &&
      (!q || (p.name + " " + (p.ticker || "") + " " + p.grp).toLowerCase().indexOf(q.toLowerCase()) >= 0));
    rows = rows.slice().sort((a, b) => sort === "value" ? b.value - a.value :
      sort === "name" ? a.name.localeCompare(b.name) : (b.value - b.cost) - (a.value - a.cost));
    const total = u.total(ps);
    return h("div", { className: "col", style: { gap: 14 } },
      h("div", { className: "filters" },
        h("input", { className: "input", placeholder: "Search positions…", value: q,
                     style: { width: 240 }, onChange: (e) => setQ(e.target.value) }),
        h(U.Seg, { value: cls, onChange: setCls,
          options: [{ k: "all", label: "All" }].concat(D.classes.map((c) => ({ k: c.key, label: c.label }))) }),
        h("div", { className: "gap" }),
        h(U.Select, { value: sort, onChange: setSort, options: [
          { k: "value", label: "Sort: value" }, { k: "gain", label: "Sort: gain" },
          { k: "name", label: "Sort: name" }] })),
      h("div", { className: "card", style: { overflow: "hidden" } },
        h("table", null,
          h("thead", null, h("tr", null,
            h("th", null, "Position"), h("th", null, "Class"), h("th", null, "Sleeve"),
            h("th", { className: "right" }, "Value"), h("th", { className: "right" }, "Weight"),
            h("th", { className: "right" }, "Unrealized"), h("th", null, "Source"), h("th", null, ""))),
          h("tbody", null, rows.map((p) => {
            const gain = p.value - p.cost;
            const locked = !S.canWrite(p.sleeve);
            const el = u.eligibility(p);
            return h("tr", { key: p.id },
              h("td", null,
                h("div", { className: "strong" }, p.name),
                h("div", { className: "tri tiny" }, p.grp, p.ticker ? " · " + p.ticker : "")),
              h("td", null, h("div", { className: "row", style: { gap: 7 } },
                h(U.Swatch, { cls: p.cls }), h("span", { className: "tiny" }, u.subLabel(p.sub)))),
              h("td", null, h(U.Pill, { tone: p.sleeve === "alpha" ? "accent" : "" },
                p.sleeve === "alpha" ? "Alpha" : "Core")),
              h("td", { className: "tnum" }, u.usd(p.value, 0),
                h("span", { className: "krw" }, u.krwC(p.value))),
              h("td", { className: "tnum" }, u.pct((p.value / total) * 100, 1)),
              h("td", { className: "tnum " + (gain >= 0 ? "pos" : "neg") }, u.sgnUsd(gain)),
              h("td", null, h(U.Prov, { p })),
              h("td", { className: "right" },
                p.liq === "Daily"
                  ? h(U.Btn, { size: "sm", lock: locked ? S.LOCK : null,
                      onClick: () => S.actions.openModal({ kind: "sell", pid: p.id }) }, "Sell")
                  : el.ok
                    ? h(U.Btn, { size: "sm", lock: locked ? S.LOCK : null,
                        onClick: () => S.actions.openModal({ kind: "list", pid: p.id }) }, "List")
                    : h(U.Pill, { tone: "ghost" }, el.reason)));
          })))),
      h("div", { className: "tri tiny" }, rows.length, " of ", ps.length, " positions shown"));
  }

  /* ------------------------------------------------------------------ page */
  function Book() {
    const st = S.useStore();
    const ps = st.positions;
    const [tab, setTab] = React.useState("alloc");
    const principal = S.isPrincipal();
    const shown = principal ? ps : ps;   // the Successor sees Core, but cannot write it
    const total = u.total(shown);
    const mandate = D.mandates.find((m) => m.key === st.objective);

    return h("div", { className: "page" },
      h("div", { className: "page-head" },
        h("div", { className: "row" },
          h("div", null,
            h("h1", null, "The book"),
            h("div", { className: "tri" },
              u.usd(total, 0), " across ", ps.length, " positions · ",
              "mandate: ", h("span", { className: "strong" }, mandate.label), " · ",
              "synced ", u.fmtDate(st.syncedAt))),
          h("div", { className: "gap" }),
          h(U.Btn, { size: "sm", onClick: () => S.navigate("/sync") }, "Update from Excel"))),
      h("div", { className: "filters" },
        h(U.Seg, { value: tab, onChange: setTab,
          options: TABS.map((t) => ({ k: t.k, label: t.k === "pos" ? "Positions (" + ps.length + ")" : t.label })) })),
      tab === "alloc" ? h(AllocTab, { ps: shown })
        : tab === "guide" ? h(GuideTab, { ps: shown })
        : tab === "liq" ? h(LiqTab, { ps: shown })
        : tab === "perf" ? h(PerfTab, { ps: shown })
        : h(PosTab, { ps: shown }));
  }

  T2.Book = Book;
})();
