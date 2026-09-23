/* The agent layer. Infrastructure, not a personality: a labelled contextual
   panel in exactly five places, each with a "Why this?" disclosure and an
   action the human must take. Nothing here executes on its own. */
(function () {
  const { useState } = React;
  const u = BB.u, S = BB.store;

  function Agent({ where, children, why, actions, tone }) {
    const [open, setOpen] = useState(false);
    return (
      <div className="agent" style={tone === "warn" ? { borderLeftColor: "var(--amber)" } : null}>
        <div className="ah">
          <span className="k" style={tone === "warn" ? { color: "var(--amber)" } : null}>Agent · {where}</span>
        </div>
        <div className="ab">{children}</div>
        <div className="aa">
          {actions}
          <button className="link g" onClick={() => setOpen(!open)}>{open ? "Hide inputs" : "Why this?"}</button>
        </div>
        {open && (
          <div className="why">
            <div className="lbl" style={{ marginBottom: 2 }}>Inputs used</div>
            <ul>{why.map((w, i) => <li key={i}>{w}</li>)}</ul>
            <div style={{ marginTop: 8, color: "var(--g2)" }}>
              Recommendation only. Nothing is executed until a person with authority acts on it.
            </div>
          </div>
        )}
      </div>
    );
  }

  /* Natural-language query bar — read-only. Returns a filtered view, not prose. */
  const RULES = [
    { re: /(data ?cent(er|re)|데이터)/i, label: "Data center exposure", f: (p) => /data cent/i.test(p.name) || p.sector === "Data Centers" || /Northgate|Songdo/i.test(p.name) },
    { re: /\b(us|united states|america)\b/i, label: "United States", f: (p) => p.geo === "United States" },
    { re: /\b(korea|kr|korean)\b/i, label: "Korea", f: (p) => p.geo === "Korea" },
    { re: /\b(japan|jpy|yen)\b/i, label: "Japan / JPY", f: (p) => p.ccy === "JPY" || p.geo === "Japan" },
    { re: /stale|old|out of date/i, label: "Stale valuations", f: (p) => p.prov === "self" && u.staleness(p).d > 90 },
    { re: /illiquid|locked/i, label: "Locked positions", f: (p) => p.liq === "Locked" },
    { re: /liquid|daily/i, label: "Daily liquidity", f: (p) => p.liq === "Daily" },
    { re: /alpha/i, label: "Alpha sleeve", f: (p) => p.sleeve === "alpha" },
    { re: /core/i, label: "Core sleeve", f: (p) => p.sleeve === "core" },
    { re: /private/i, label: "Private positions", f: (p) => p.liq !== "Daily" },
    { re: /tech|semiconductor|ai/i, label: "Technology", f: (p) => p.sector === "Info Tech" || p.sector === "Technology" },
    { re: /real estate|property|부동산/i, label: "Real estate", f: (p) => p.sub === "re" },
    { re: /cash/i, label: "Cash equivalents", f: (p) => p.cls === "cash" },
    { re: /bond|debt|fixed income|duration/i, label: "Debt", f: (p) => p.cls === "debt" },
    { re: /equity|stock|share/i, label: "Equity", f: (p) => p.cls === "equity" },
    { re: /hanwha/i, label: "Hanwha-sourced", f: (p) => p.prov === "hanwha" },
    { re: /affiliate|family compan|operating compan/i, label: "Operating company", f: (p) => !!p.affiliate },
  ];

  function runQuery(q, positions) {
    const hits = RULES.filter((r) => r.re.test(q));
    if (!hits.length) return null;
    const rows = positions.filter((p) => hits.every((h) => h.f(p)));
    return { labels: hits.map((h) => h.label), rows };
  }

  /* Open-ended asking over the marketplace. Same contract as the portfolio's
     query bar: it answers with a filtered, ranked list, never with prose. */
  function askMarket(q, scored, ctx) {
    const t = (q || "").toLowerCase();
    if (!t.trim()) return null;
    const has = (re) => re.test(t);

    if (has(/rebalanc|model|allocat|gap|underweight/)) {
      const under = Object.keys(ctx.under).filter((k) => ctx.under[k] > 0.2)
        .sort((a, b) => ctx.under[b] - ctx.under[a]);
      const rows = under.map((k) => scored.filter((m) => m.fills === k).sort((a, b) => b.s.score - a.s.score)[0])
        .filter(Boolean);
      return { label: "To move toward the model", rows,
        note: "The highest-scoring offering in each subcategory the book is under the model in." };
    }
    const tests = [
      [/hanwha/, "Hanwha-originated", (m) => m.hanwha],
      [/daily|liquid(?!ity premium)/, "Daily liquidity", (m) => m.liq === "Daily"],
      [/lock|illiquid|private/, "Private market", (m) => m.kind === "private"],
      [/defer|tax/, "Gain deferred to exit", (m) => ["pe", "vc", "preipo"].indexOf(m.fills) >= 0],
      [/income|yield|coupon|distribut/, "Pays income now", (m) => (m.retNum || 0) >= 5 && ["pe", "vc", "preipo"].indexOf(m.fills) < 0],
      [/credit|lending|debt|bond|duration|treasur/, "Debt", (m) => m.cls === "debt"],
      [/equity|stock|venture|growth/, "Equity", (m) => m.cls === "equity"],
      [/property|real estate|infrastructure|data ?cent/, "Real assets", (m) => m.cls === "real"],
      [/korea|krw|domestic/, "Korea", (m) => m.geo === "Korea"],
      [/us |united states|american/, "United States", (m) => m.geo === "United States"],
    ];
    const hits = tests.filter((x) => has(x[0]));
    const size = /(\$|under )\s?([\d.]+)\s?(k|m|million)?/.exec(t);
    let cap = null;
    if (size && /under|below|less/.test(t)) {
      const n = parseFloat(size[2]);
      cap = /m|million/.test(size[3] || "") ? n * 1e6 : n >= 1000 ? n : n * 1000;
    }
    if (!hits.length && !cap) return null;
    const rows = scored.filter((m) => hits.every((x) => x[2](m)) && (!cap || m.min <= cap))
      .sort((a, b) => b.s.score - a.s.score);
    return {
      label: hits.map((x) => x[1]).concat(cap ? ["minimum under " + (cap >= 1e6 ? "$" + cap / 1e6 + "M" : "$" + cap / 1000 + "K")] : []).join(" · "),
      rows, note: "Ranked as everything else is — merit, allocation, liquidity, tax.",
    };
  }

  BB.agent = { Agent, runQuery, askMarket };
})();
