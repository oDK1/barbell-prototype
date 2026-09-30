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
        {(actions || why) && (
          <div className="aa">
            {actions}
            {why && <button className="link g" onClick={() => setOpen(!open)}>{open ? "Hide inputs" : "Why this?"}</button>}
          </div>
        )}
        {open && why && (
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


  /* Questions a buyer actually asks of a secondary board. Rows arrive already
     carrying their view — score, IRR to date, discount, consideration — so the
     agent filters and ranks on the same numbers the table shows. */
  function askSecondary(q, rows, ctx) {
    const t = (q || "").toLowerCase();
    if (!t.trim()) return null;
    const has = (re) => re.test(t);
    const byScore = (a, b) => b.v.sc.score - a.v.sc.score;

    if (has(/rebalanc|model|allocat|gap|underweight/)) {
      const under = Object.keys(ctx.under).filter((k) => ctx.under[k] > 0.2);
      const hit = rows.filter((r) => under.indexOf(r.l.sub) >= 0).sort(byScore);
      return { label: "Fills a gap against the model", rows: hit,
        note: "Listings in the subcategories the book is under the model in." };
    }
    if (has(/cheapest|biggest discount|deepest/)) {
      return { label: "Deepest discounts to the last mark",
        rows: rows.filter((r) => r.v.discount > 0).sort((a, b) => b.v.discount - a.v.discount),
        note: "A discount is the price of the seller's hurry — check the mark's age before reading it as value." };
    }
    if (has(/best (return|performer|irr)|strongest|top perform/)) {
      return { label: "Best IRR to date",
        rows: rows.filter((r) => r.v.irr).sort((a, b) => b.v.irr.irr - a.v.irr.irr),
        note: "Annualised in the seller's hands, to the manager's own mark." };
    }

    const tests = [
      [/discount|below nav|cheap|bargain/, "Below the last mark", (r) => r.v.discount > 0],
      [/premium|above nav/, "Above the last mark", (r) => r.v.discount < 0],
      [/performing|winner|positive|profitab/, "Positive IRR to date", (r) => r.v.irr && r.v.irr.irr > 0],
      [/struggl|loser|negative|underwater|marked down/, "Negative IRR to date", (r) => r.v.irr && r.v.irr.irr < 0],
      [/unfunded|commitment|drawdown/, "Carries an unfunded commitment", (r) => !!r.l.unfunded],
      [/fully funded|no unfunded|no further/, "No unfunded commitment", (r) => !r.l.unfunded],
      [/venture|vc/, "Venture capital", (r) => r.l.sub === "vc"],
      [/pre-?ipo|late stage/, "Pre-IPO", (r) => r.l.sub === "preipo"],
      [/buyout|private equity|pe\b/, "Private equity", (r) => r.l.sub === "pe"],
      [/credit|lending|debt|loan/, "Private debt", (r) => r.l.sub === "pcred"],
      [/property|real estate|infrastructure|data ?cent|retail|logistic/, "Real assets", (r) => r.l.cls === "real"],
      [/korea|krw|domestic|seoul|songdo/, "Korea", (r) => /korea|seoul|songdo|daol|woori|hanwha|koramco/i.test(r.l.instrument + " " + r.l.manager)],
      [/recent|fresh|new listing|just listed/, "Listed in the last month", (r) => r.l.days <= 30],
      [/stale|sitting|old listing|been on/, "On the board over a month", (r) => r.l.days > 30],
      [/traded before|history|cleared|prior/, "Has traded here before", (r) => r.v.hist && r.v.hist.rows.length > 0],
    ];
    const hits = tests.filter((x) => has(x[0]));

    const size = /(\$|under |below |less than )\s?([\d.]+)\s?(k|m|million)?/.exec(t);
    let cap = null;
    if (size && /under|below|less/.test(t)) {
      const n = parseFloat(size[2]);
      cap = /m|million/.test(size[3] || "") ? n * 1e6 : n >= 1000 ? n : n * 1000;
    }
    if (!hits.length && !cap) return null;

    return {
      label: hits.map((x) => x[1]).concat(cap ? ["under " + (cap >= 1e6 ? "$" + cap / 1e6 + "M" : "$" + cap / 1000 + "K") + " to buy"] : []).join(" · "),
      rows: rows.filter((r) => hits.every((x) => x[2](r)) && (!cap || r.v.consideration <= cap)).sort(byScore),
      note: "Ranked as the board is — merit, allocation, liquidity, tax.",
    };
  }

  BB.agent = { Agent, runQuery, askMarket, askSecondary };
})();
