/* =============================================================================
   Take 2 — charts.

   Colour rules, applied deliberately:
   · Asset-class charts use the validated categorical slots 1–4 in fixed order
     (Equity blue, Debt orange, Real Assets aqua, Cash yellow). Never cycled,
     never reassigned by rank — a filter that drops a class leaves the others
     on their own hue.
   · Aqua and yellow fall below 3:1 against the white card, so every chart that
     uses them ships a legend with visible values and has a table twin on the
     same screen. That is the relief rule, not an oversight.
   · Single-series charts that carry no class meaning use the indigo accent, a
     hue that is never a series here, so they can never be misread as a class.
   · Drift is drawn as a diverging form — bars either side of a zero rule — but
     each bar keeps its own class hue rather than taking a polarity colour.
     Position already states the sign unambiguously, and keeping the hue means
     Equity is the same blue in every chart on the page.
   · No dual axes anywhere. Cash balance and capital calls are two charts.
   ============================================================================= */
(function () {
  const D = BB.data, u = BB.u, U = T2.ui;
  const h = React.createElement;
  const C = U.CLS_HEX;
  const ACCENT = "#4A3AA7";
  const GRID = "#EDEEF4", AXIS = "#D9DBE6", MUTED = "#8A90A6";

  /* ------------------------------------------------------------- tooltip */
  function useTip() {
    const [tip, setTip] = React.useState(null);
    const show = (e, content) =>
      setTip({ x: e.clientX, y: e.clientY, content });
    const hide = () => setTip(null);
    return [tip, show, hide];
  }
  function Tip({ tip }) {
    if (!tip) return null;
    const flip = tip.x > window.innerWidth - 300;
    return h("div", {
      className: "tip-box",
      style: { left: flip ? tip.x - 14 : tip.x + 14, top: tip.y + 16,
               transform: flip ? "translateX(-100%)" : null },
    }, tip.content);
  }
  const tipRows = (rows) => rows.map((r, i) =>
    h("div", { key: i, className: "r" },
      h("span", { className: "k" }, r[0]), h("span", null, r[1])));

  /* ----------------------------------------------------------- sparkline */
  /* One series, so no legend — the card title says what is plotted. */
  function Spark({ data, w, hgt, color }) {
    const W = w || 132, H = hgt || 34;
    const vs = data.map((d) => d.v);
    const lo = Math.min.apply(null, vs), hi = Math.max.apply(null, vs);
    const x = (i) => (i / (data.length - 1)) * (W - 6) + 3;
    const y = (v) => H - 4 - ((v - lo) / (hi - lo || 1)) * (H - 8);
    const pts = data.map((d, i) => x(i) + "," + y(d.v)).join(" ");
    const c = color || ACCENT;
    return h("svg", { className: "viz", width: W, height: H, viewBox: "0 0 " + W + " " + H },
      h("polyline", { points: pts, fill: "none", stroke: c, strokeWidth: 2,
                      strokeLinejoin: "round", strokeLinecap: "round", opacity: .35 }),
      h("polyline", {
        points: data.slice(-3).map((d, i) => x(data.length - 3 + i) + "," + y(d.v)).join(" "),
        fill: "none", stroke: c, strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" }),
      h("circle", { cx: x(data.length - 1), cy: y(vs[vs.length - 1]), r: 4,
                    fill: c, stroke: "#fff", strokeWidth: 2 }));
  }

  /* ------------------------------------------- stacked allocation bar (HTML) */
  /* Part-to-whole at a glance, 4 segments, 2px surface gaps. Labels ride the
     segment only when they fit; the legend carries every value regardless. */
  function AllocBar({ rows, height }) {
    const [tip, show, hide] = useTip();
    const total = rows.reduce((a, r) => a + r.pct, 0) || 1;
    return h("div", null,
      h("div", { className: "allocbar", style: height ? { height } : null },
        rows.map((r) => {
          const w = (r.pct / total) * 100;
          const fits = w > 11;
          return h("div", {
            key: r.key,
            style: { width: w + "%", background: C[r.key] },
            onMouseMove: (e) => show(e, h("div", null,
              h("div", { style: { fontWeight: 600, marginBottom: 3 } }, r.label),
              tipRows([["Weight", u.pct(r.pct, 1)], ["Value", u.usd(r.value, 0)],
                       ["Target", u.pct(r.target, 1)]]))),
            onMouseLeave: hide,
          }, fits ? h("span", { className: "dlabel-i" }, u.pct(r.pct, 0)) : null);
        })),
      h("div", { className: "legend mt-s" }, rows.map((r) =>
        h("span", { key: r.key, className: "legend-i" },
          h("span", { className: "swatch", style: { background: C[r.key] } }),
          r.label, h("span", { className: "strong num" }, u.pct(r.pct, 1))))),
      h(Tip, { tip }));
  }

  /* --------------------------------------------------------- drift bars */
  function DriftBars({ rows }) {
    const [tip, show, hide] = useTip();
    /* A label column on the left, then the plot. The value rides outside the
       bar end, so it needs clear air between the longest bar and the labels. */
    const LAB = 118, W = 620, rowH = 34, H = rows.length * rowH + 28;
    const mid = LAB + 190, half = 170;
    const max = Math.max(4, Math.ceil(Math.max.apply(null, rows.map((r) => Math.abs(r.drift))) + 1));
    const x = (v) => mid + (v / max) * half;
    return h("div", null,
      h("svg", { className: "viz", viewBox: "0 0 " + W + " " + H, style: { maxWidth: W } },
        [-max, -max / 2, max / 2, max].map((t, i) =>
          h("line", { key: i, x1: x(t), x2: x(t), y1: 6, y2: rows.length * rowH + 4,
                      stroke: GRID, strokeWidth: 1 })),
        h("line", { x1: mid, x2: mid, y1: 2, y2: rows.length * rowH + 6, stroke: AXIS, strokeWidth: 1 }),
        rows.map((r, i) => {
          const yy = i * rowH + 8, bw = Math.abs(x(r.drift) - mid);
          const left = r.drift < 0;
          return h("g", { key: r.key,
            onMouseMove: (e) => show(e, h("div", null,
              h("div", { style: { fontWeight: 600, marginBottom: 3 } }, r.label),
              tipRows([["Held", u.pct(r.pct, 1)], ["Target", u.pct(r.target, 1)],
                       ["Difference", u.pp(r.drift, 1)], ["In dollars", u.sgnUsd(r.dollars)]]))),
            onMouseLeave: hide },
            h("rect", { x: 0, y: yy - 6, width: W, height: rowH, className: "hit" }),
            h("text", { x: 0, y: yy + 14, className: "axis-t",
                        style: { fill: "var(--ink-2)", fontSize: 12.5 } }, r.label),
            h("text", { x: LAB - 14, y: yy + 14, textAnchor: "end", className: "axis-t" },
              u.pct(r.pct, 1)),
            h("rect", { x: left ? mid - bw : mid, y: yy + 2, width: Math.max(bw, 1.5), height: 16,
                        fill: C[r.key], rx: 4 }),
            bw > 4 ? h("rect", { x: left ? mid - 4 : mid, y: yy + 2, width: 4, height: 16,
                                 fill: C[r.key] }) : null,
            h("text", { x: left ? mid - bw - 9 : mid + bw + 9, y: yy + 14,
                        textAnchor: left ? "end" : "start", className: "dlabel" }, u.pp(r.drift, 1)));
        }),
        h("text", { x: 0, y: H - 5, className: "axis-t" }, "held"),
        h("text", { x: mid - half, y: H - 5, textAnchor: "middle", className: "axis-t" }, "\u2212" + max + "pp"),
        h("text", { x: mid, y: H - 5, textAnchor: "middle", className: "axis-t" }, "on target"),
        h("text", { x: mid + half, y: H - 5, textAnchor: "middle", className: "axis-t" }, "+" + max + "pp")),
      h(Tip, { tip }));
  }

  /* ---------------------------------------------------------- glide path */
  /* The AUM guidance chart: recommended class mix across the whole size range,
     with the family's own balance sheet marked on it. Stacked area, log x. */
  function GlidePath({ objective, aum, onScrub, height }) {
    const [tip, show, hide] = useTip();
    const W = 720, H = height || 260, PL = 44, PR = 96, PT = 14, PB = 30;
    const iw = W - PL - PR, ih = H - PT - PB;
    const lo = 1e6, hi = 150e6;
    const lx = (v) => PL + ((Math.log10(v) - 6) / (Math.log10(hi) - 6)) * iw;
    const y = (p) => PT + (1 - p / 100) * ih;

    const N = 64;
    const samples = React.useMemo(() => {
      const out = [];
      for (let i = 0; i <= N; i++) {
        const v = Math.pow(10, 6 + (i / N) * (Math.log10(hi) - 6));
        const m = u.modelWeights(v, objective);
        out.push({ v, c: m.classes, alts: m.alts });
      }
      return out;
    }, [objective]);

    const order = ["equity", "debt", "real", "cash"];
    const bands = order.map((k, ki) => {
      const top = [], bot = [];
      samples.forEach((s) => {
        let base = 0;
        for (let j = 0; j < ki; j++) base += s.c[order[j]] || 0;
        bot.push([lx(s.v), y(base)]);
        top.push([lx(s.v), y(base + (s.c[k] || 0))]);
      });
      const d = "M" + top.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join("L") +
                "L" + bot.slice().reverse().map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join("L") + "Z";
      const last = top[top.length - 1], lastB = bot[bot.length - 1];
      return { k, d, labelY: (last[1] + lastB[1]) / 2, pct: samples[samples.length - 1].c[k] };
    });

    const altLine = "M" + samples.map((s) => lx(s.v).toFixed(1) + "," + y(s.alts).toFixed(1)).join("L");
    const here = u.modelWeights(aum, objective);
    const ticks = [1e6, 3e6, 10e6, 30e6, 100e6];

    function onMove(e) {
      const r = e.currentTarget.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * W;
      if (px < PL || px > PL + iw) return hide();
      const v = Math.pow(10, 6 + ((px - PL) / iw) * (Math.log10(hi) - 6));
      const m = u.modelWeights(v, objective);
      show(e, h("div", null,
        h("div", { style: { fontWeight: 600, marginBottom: 4 } }, "At " + u.usdC(v)),
        tipRows(order.map((k) => [u.clsLabel(k), u.pct(m.classes[k], 1)])
          .concat([["Alternatives", u.pct(m.alts, 1)]]))));
      if (onScrub) onScrub(v);
    }

    return h("div", null,
      h("svg", { className: "viz", viewBox: "0 0 " + W + " " + H, onMouseMove: onMove, onMouseLeave: hide },
        [0, 25, 50, 75, 100].map((p) =>
          h("g", { key: p },
            h("line", { x1: PL, x2: PL + iw, y1: y(p), y2: y(p), stroke: GRID, strokeWidth: 1 }),
            h("text", { x: PL - 9, y: y(p) + 4, textAnchor: "end", className: "axis-t" }, p + "%"))),
        /* 2px surface gaps between the stacked bands, drawn as white strokes */
        bands.map((b) => h("path", { key: b.k, d: b.d, fill: C[b.k], stroke: "#fff", strokeWidth: 2 })),
        h("path", { d: altLine, fill: "none", stroke: "var(--ink)", strokeWidth: 2,
                    strokeLinecap: "round", opacity: .82 }),
        bands.map((b) => b.pct > 6 ? h("text", {
          key: b.k, x: PL + iw + 10, y: b.labelY + 4, className: "dlabel",
        }, u.clsLabel(b.k)) : null),
        h("text", { x: PL + iw + 10, y: y(samples[samples.length - 1].alts) + 4,
                    className: "dlabel", style: { fill: "var(--ink)" } }, "Alternatives"),
        /* the family's own position on the curve */
        h("line", { x1: lx(aum), x2: lx(aum), y1: PT - 6, y2: PT + ih,
                    stroke: "var(--ink)", strokeWidth: 1.5, strokeDasharray: "0" }),
        h("circle", { cx: lx(aum), cy: PT - 6, r: 4.5, fill: "var(--ink)", stroke: "#fff", strokeWidth: 2 }),
        ticks.map((t) => h("text", { key: t, x: lx(t), y: H - 9, textAnchor: "middle", className: "axis-t" },
          u.usdC(t))),
        h("line", { x1: PL, x2: PL + iw, y1: PT + ih, y2: PT + ih, stroke: AXIS, strokeWidth: 1 })),
      h("div", { className: "legend mt-s" },
        order.map((k) => h("span", { key: k, className: "legend-i" },
          h("span", { className: "swatch", style: { background: C[k] } }),
          u.clsLabel(k), h("span", { className: "strong num" }, u.pct(here.classes[k], 1)))),
        h("span", { className: "legend-i" },
          h("span", { style: { width: 14, height: 2, background: "var(--ink)", borderRadius: 2 } }),
          "Alternatives", h("span", { className: "strong num" }, u.pct(here.alts, 1)))),
      h(Tip, { tip }));
  }

  /* --------------------------------------------------------- cash runway */
  /* One series and one reference rule. No second axis — capital calls are a
     separate chart below, sharing nothing but the month labels. */
  function CashRunway({ months, floor }) {
    const [tip, show, hide] = useTip();
    const W = 720, H = 190, PL = 52, PR = 16, PT = 12, PB = 26;
    const iw = W - PL - PR, ih = H - PT - PB;
    const vals = months.map((m) => m.cash);
    const lo = Math.min(0, Math.min.apply(null, vals) * 1.1);
    const hi = Math.max.apply(null, vals) * 1.08;
    const x = (i) => PL + (i / (months.length - 1)) * iw;
    const y = (v) => PT + (1 - (v - lo) / (hi - lo || 1)) * ih;
    const line = "M" + months.map((m, i) => x(i).toFixed(1) + "," + y(m.cash).toFixed(1)).join("L");
    const area = line + "L" + x(months.length - 1).toFixed(1) + "," + y(lo) + "L" + PL + "," + y(lo) + "Z";
    const worst = months.reduce((a, b) => (b.cash < a.cash ? b : a), months[0]);
    const wi = months.indexOf(worst);
    const breach = worst.cash < floor;
    return h("div", null,
      h("svg", { className: "viz", viewBox: "0 0 " + W + " " + H, onMouseLeave: hide },
        h("path", { d: area, fill: breach ? "var(--critical)" : ACCENT, opacity: .10 }),
        h("line", { x1: PL, x2: PL + iw, y1: y(floor), y2: y(floor), stroke: "var(--critical)", strokeWidth: 1 }),
        h("text", { x: PL + 4, y: y(floor) - 6, className: "axis-t", style: { fill: "var(--critical)" } },
          "Reserve floor " + u.usdC(floor)),
        h("path", { d: line, fill: "none", stroke: breach ? "var(--critical)" : ACCENT,
                    strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" }),
        [0, 0.5, 1].map((f) => {
          const v = lo + (hi - lo) * f;
          return h("text", { key: f, x: PL - 9, y: y(v) + 4, textAnchor: "end", className: "axis-t" },
            u.usdC(v));
        }),
        months.map((m, i) => h("rect", {
          key: m.k, x: x(i) - iw / months.length / 2, y: PT, width: iw / months.length, height: ih,
          className: "hit",
          onMouseMove: (e) => show(e, h("div", null,
            h("div", { style: { fontWeight: 600, marginBottom: 3 } }, m.label),
            tipRows([["Projected cash", u.usd(m.cash, 0)],
                     ["Capital calls", m.calls ? "−" + u.usd(m.calls, 0) : "—"],
                     ["Distributions", m.dist ? "+" + u.usd(m.dist, 0) : "—"]]))),
        })),
        h("circle", { cx: x(wi), cy: y(worst.cash), r: 4.5,
                      fill: breach ? "var(--critical)" : ACCENT, stroke: "#fff", strokeWidth: 2 }),
        h("text", { x: x(wi), y: y(worst.cash) + (breach ? 20 : -12), textAnchor: "middle",
                    className: "dlabel" }, "Low " + u.usdC(worst.cash) + " · " + worst.label),
        months.map((m, i) => i % 3 === 0
          ? h("text", { key: m.k, x: x(i), y: H - 7, textAnchor: "middle", className: "axis-t" }, m.label)
          : null),
        h("line", { x1: PL, x2: PL + iw, y1: PT + ih, y2: PT + ih, stroke: AXIS, strokeWidth: 1 })),
      h(Tip, { tip }));
  }

  /* -------------------------------------------------------- call columns */
  function CallColumns({ months }) {
    const [tip, show, hide] = useTip();
    const W = 720, H = 132, PL = 52, PR = 16, PT = 10, PB = 26;
    const iw = W - PL - PR, ih = H - PT - PB;
    const max = Math.max.apply(null, months.map((m) => Math.max(m.calls, m.dist))) || 1;
    const band = iw / months.length;
    const bw = Math.min(18, band - 8);
    const y = (v) => PT + (1 - v / max) * ih;
    return h("div", null,
      h("svg", { className: "viz", viewBox: "0 0 " + W + " " + H, onMouseLeave: hide },
        [0, max / 2, max].map((v, i) =>
          h("g", { key: i },
            h("line", { x1: PL, x2: PL + iw, y1: y(v), y2: y(v), stroke: GRID, strokeWidth: 1 }),
            h("text", { x: PL - 9, y: y(v) + 4, textAnchor: "end", className: "axis-t" }, u.usdC(v)))),
        months.map((m, i) => {
          const cx = PL + band * i + band / 2;
          const bits = [];
          if (m.calls) bits.push(["calls", m.calls, "var(--critical)", cx - bw / 2 - 1]);
          if (m.dist) bits.push(["dist", m.dist, "var(--good)", cx + 1]);
          return h("g", { key: m.k,
            onMouseMove: (e) => show(e, h("div", null,
              h("div", { style: { fontWeight: 600, marginBottom: 3 } }, m.label),
              tipRows([["Capital calls", m.calls ? u.usd(m.calls, 0) : "—"],
                       ["Distributions", m.dist ? u.usd(m.dist, 0) : "—"]]))),
            onMouseLeave: hide },
            h("rect", { x: PL + band * i, y: PT, width: band, height: ih, className: "hit" }),
            bits.map((b) => h("rect", {
              key: b[0], x: b[3], y: y(b[1]), width: bw / 2 - 1,
              height: Math.max(2, PT + ih - y(b[1])), fill: b[2], rx: 3 })));
        }),
        months.map((m, i) => i % 3 === 0
          ? h("text", { key: m.k, x: PL + band * i + band / 2, y: H - 7, textAnchor: "middle",
                        className: "axis-t" }, m.label)
          : null),
        h("line", { x1: PL, x2: PL + iw, y1: PT + ih, y2: PT + ih, stroke: AXIS, strokeWidth: 1 })),
      h("div", { className: "legend mt-s" },
        h("span", { className: "legend-i" },
          h("span", { className: "swatch", style: { background: "var(--critical)" } }), "Capital calls"),
        h("span", { className: "legend-i" },
          h("span", { className: "swatch", style: { background: "var(--good)" } }), "Distributions")),
      h(Tip, { tip }));
  }

  /* ------------------------------------------------------- attribution */
  function Attribution({ rows }) {
    const max = Math.max.apply(null, rows.map((r) => Math.abs(r.pp)));
    return h("div", { className: "col", style: { gap: 9 } }, rows.map((r) =>
      h("div", { key: r.n, className: "row", style: { gap: 12 } },
        h("div", { style: { width: 168, fontSize: 12.5, color: "var(--ink-2)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, r.n),
        h("div", { style: { flex: 1, position: "relative", height: 14 } },
          h("div", { style: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 1,
                              background: AXIS } }),
          h("div", { style: {
            position: "absolute", top: 3, height: 8, borderRadius: 3,
            background: r.pp >= 0 ? ACCENT : "var(--critical)",
            left: r.pp >= 0 ? "50%" : (50 - (Math.abs(r.pp) / max) * 48) + "%",
            width: (Math.abs(r.pp) / max) * 48 + "%" } })),
        h("div", { className: "tnum strong", style: { width: 56, fontSize: 12.5 } }, u.pp(r.pp, 2)))));
  }

  /* --------------------------------------------------------- depth bars */
  function Depth({ bids, ask, nav }) {
    const [tip, show, hide] = useTip();
    const max = Math.max.apply(null, bids.map((b) => b.qty)) || 1;
    return h("div", null,
      h("div", { className: "row mb-s", style: { justifyContent: "space-between" } },
        h("span", { className: "eyebrow" }, "Live bids"),
        h("span", { className: "eyebrow" }, "Ask " + ask.toFixed(1) + "% of NAV")),
      h("div", null, bids.map((b, i) =>
        h("div", { key: i, className: "book-row",
          onMouseMove: (e) => show(e, h("div", null,
            tipRows([["Bid", b.px.toFixed(1) + "% of NAV"], ["Size", u.usd(b.qty, 0)],
                     ["Implied", u.usd(nav * b.px / 100, 0)], ["Standing", b.age + " days"]]))),
          onMouseLeave: hide },
          h("div", { className: "book-fill", style: { left: 0, width: (b.qty / max) * 100 + "%",
                                                      background: ACCENT } }),
          h("span", { className: "px" }, b.px.toFixed(1) + "%"),
          h("span", { className: "tri tiny" }, b.member),
          h("span", { className: "qt num" }, u.usd(b.qty, 0))))),
      bids.length === 0 ? h("div", { className: "tri mini", style: { padding: "8px 12px" } },
        "No live bids. Yours would be first.") : null,
      h(Tip, { tip }));
  }

  T2.charts = { Spark, AllocBar, DriftBars, GlidePath, CashRunway, CallColumns, Attribution, Depth, Tip, useTip };
})();
