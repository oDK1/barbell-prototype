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

  BB.agent = { Agent, runQuery };
})();
