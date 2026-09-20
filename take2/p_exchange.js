/* =============================================================================
   Take 2 — Exchange (the members-only secondary).

   Take 1 renders the secondary as a bulletin board: a list of listings you
   open one at a time. Take 2 renders it as a two-sided market — a live book
   with standing bids, depth and recent prints beside the listing — because
   what a seller actually wants to know is where the bids are, not that a
   listing exists.
   ============================================================================= */
(function () {
  const D = BB.data, u = BB.u, U = T2.ui, S = T2.store, T = T2.data, CH = T2.charts;
  const h = U.h;

  /* ------------------------------------------------------------ bid modal */
  function BidModal({ l, onClose }) {
    const book = T.books[l.id];
    const best = book.bids.length ? book.bids[0].px : l.indicative[0];
    const [pct, setPct] = React.useState(Math.min(l.askPct, best + 1));
    const [amt, setAmt] = React.useState(Math.round(l.size / 2 / 1e4) * 1e4);
    const implied = l.nav * (pct / 100);
    const beats = book.bids.filter((b) => b.px < pct).length;
    const principal = S.isPrincipal();
    const capacity = S.alphaCapacity();
    const over = !principal && amt > capacity;

    return h(U.Modal, {
      title: "Bid — " + l.instrument,
      desc: "Seller " + l.seller + " · asking " + l.askPct.toFixed(1) + "% of a " + u.usd(l.nav, 0) + " NAV",
      onClose, wide: true,
      foot: h(React.Fragment, null,
        h(U.Btn, { kind: "pri", disabled: over,
          onClick: () => { S.actions.placeBid(l, pct, amt); onClose(); } },
          over ? "Above your Alpha capacity" : "Place bid"),
        h(U.Btn, { onClick: onClose }, "Cancel"),
        h("div", { className: "gap" }),
        h("span", { className: "tri tiny" }, "Bids stand for 48 hours")),
    },
      h("div", { className: "row mb", style: { gap: 16 } },
        h("span", { className: "eyebrow", style: { width: 90 } }, "Your price"),
        h("input", { type: "range", className: "slider", min: l.indicative[0] - 4, max: l.askPct,
          step: 0.1, value: pct, style: { flex: 1 },
          onChange: (e) => setPct(Number(e.target.value)) }),
        h("span", { className: "strong num", style: { width: 60 } }, pct.toFixed(1), "%")),
      h("div", { className: "row mb" },
        h("span", { className: "eyebrow", style: { width: 90 } }, "Size"),
        h(U.MoneyInput, { value: amt, onChange: setAmt, width: 160 }),
        h("span", { className: "tri tiny" }, "Offered: ", u.usd(l.size, 0))),

      h("div", { className: "note" },
        h("div", { className: "kv" },
          h("dt", null, "Implied value of the whole interest"), h("dd", null, u.usd(implied, 0)),
          h("dt", null, "Discount to last NAV"), h("dd", null, u.pct(100 - pct, 1)),
          h("dt", null, "Unfunded commitment you take on"), h("dd", null, u.usd(l.unfunded, 0)),
          h("dt", null, "Where this sits"),
          h("dd", null, beats === book.bids.length && book.bids.length
            ? "Best bid" : beats + " of " + book.bids.length + " bids beaten"))),

      h("div", { className: "mt" },
        h(U.Card, { title: "The book as it stands" },
          h(CH.Depth, { bids: book.bids, ask: l.askPct, nav: l.nav }))),

      over ? h("div", { className: "note warn mt" },
        "Your Alpha capacity is ", u.usd(capacity, 0), ". Reduce the size, or take it to the Principal ",
        "as a proposal from the offerings screen.") : null);
  }

  /* ----------------------------------------------------------- list modal */
  function ListModal({ p, onClose }) {
    const [pct, setPct] = React.useState(92);
    const [amt, setAmt] = React.useState(Math.round(p.value * 0.5 / 1e4) * 1e4);
    const comparable = D.secondary.filter((l) => l.sub === p.sub);
    const med = comparable.length
      ? comparable.reduce((a, l) => a + l.askPct, 0) / comparable.length : 92;
    return h(U.Modal, {
      title: "List on the exchange",
      desc: p.name,
      onClose, wide: true,
      foot: h(React.Fragment, null,
        h(U.Btn, { kind: "pri", onClick: () => { S.actions.listPosition(p, pct, amt); onClose(); } },
          "List " + u.usd(amt, 0)),
        h(U.Btn, { onClick: onClose }, "Cancel"),
        h("div", { className: "gap" }),
        h("span", { className: "tri tiny" }, "Visible to verified members only")),
    },
      h("div", { className: "row mb", style: { gap: 16 } },
        h("span", { className: "eyebrow", style: { width: 90 } }, "Ask"),
        h("input", { type: "range", className: "slider", min: 80, max: 104, step: 0.5, value: pct,
          style: { flex: 1 }, onChange: (e) => setPct(Number(e.target.value)) }),
        h("span", { className: "strong num", style: { width: 60 } }, pct.toFixed(1), "%")),
      h("div", { className: "row mb" },
        h("span", { className: "eyebrow", style: { width: 90 } }, "Size"),
        h(U.MoneyInput, { value: amt, onChange: setAmt, width: 160 }),
        h("span", { className: "tri tiny" }, "You hold ", u.usd(p.value, 0))),
      h("div", { className: "note" },
        h("div", { className: "kv" },
          h("dt", null, "Last carrying value"), h("dd", null, u.usd(p.value, 0)),
          h("dt", null, "Proceeds at this ask"), h("dd", null, u.usd(amt * pct / 100, 0)),
          h("dt", null, "Comparable asks in " + u.subLabel(p.sub)),
          h("dd", null, comparable.length ? med.toFixed(1) + "% of NAV" : "No comparables"),
          h("dt", null, "Settlement"), h("dd", null, "Same day, against the ownership record"))),
      h("div", { className: "note accent mt" },
        "Listing does not commit you. Bids arrive against the ask and you accept or ignore them."));
  }

  /* ---------------------------------------------------------- the page */
  function Exchange() {
    const st = S.useStore();
    const [tab, setTab] = React.useState("book");
    const [sel, setSel] = React.useState(D.secondary[0].id);
    const [status, setStatus] = React.useState("all");
    const [bid, setBid] = React.useState(null);

    const listings = D.secondary.filter((l) => status === "all" || l.status === status);
    const l = D.secondary.find((x) => x.id === sel) || listings[0];
    const book = T.books[l.id];
    const offered = u.sum(D.secondary, (x) => x.size);
    const medianAsk = D.secondary.map((x) => x.askPct).sort((a, b) => a - b)[Math.floor(D.secondary.length / 2)];
    const eligible = st.positions.filter((p) => u.eligibility(p).ok);
    const principal = S.isPrincipal();

    return h("div", { className: "page" },
      h("div", { className: "page-head" },
        h("h1", null, "Exchange"),
        h("div", { className: "tri" },
          "A members-only book for the illiquid half. Twelve interests offered by other families, ",
          "priced against last NAV, settling same day.")),

      h("div", { className: "grid g4 mb" },
        h(U.Stat, { label: "Interests offered", value: String(D.secondary.length),
                    delta: u.usdC(offered) + " of notional" }),
        h(U.Stat, { label: "Median ask", value: medianAsk.toFixed(1) + "%",
                    delta: "of last reported NAV" }),
        h(U.Stat, { label: "Your positions eligible to list", value: String(eligible.length),
                    delta: "Originated on Barbell, held over 12 months" }),
        h(U.Stat, { label: "Settlement", value: "Same day",
                    delta: "Ownership record updates on acceptance" })),

      h("div", { className: "filters" },
        h(U.Seg, { value: tab, onChange: setTab, options: [
          { k: "book", label: "The book" },
          { k: "mine", label: "Your bids (" + st.bids.length + ")" },
          { k: "sell", label: "Sell a position (" + eligible.length + ")" }] }),
        h("div", { className: "gap" }),
        tab === "book" ? h(U.Select, { value: status, onChange: setStatus, options: [
          { k: "all", label: "All listings" }, { k: "Open", label: "Open" },
          { k: "Under negotiation", label: "Under negotiation" },
          { k: "Settled", label: "Settled" }] }) : null),

      /* -------------------------------------------------- master / detail */
      tab === "book" ? h("div", { className: "grid", style: { gridTemplateColumns: "minmax(0,1fr) 400px" } },
        h("div", { className: "card", style: { overflow: "hidden", alignSelf: "start" } },
          h("table", null,
            h("thead", null, h("tr", null,
              h("th", null, "Interest"), h("th", { className: "right" }, "Offered"),
              h("th", { className: "right" }, "Ask"), h("th", { className: "right" }, "Bids"),
              h("th", null, "Status"))),
            h("tbody", null, listings.map((x) => {
              const b = T.books[x.id];
              return h("tr", { key: x.id, className: "click",
                  style: x.id === l.id ? { background: "var(--accent-wash)" } : null,
                  onClick: () => setSel(x.id) },
                h("td", null,
                  h("div", { className: "strong", style: { fontSize: 12.5 } }, x.instrument),
                  h("div", { className: "tri tiny" }, u.subLabel(x.sub), " · ", x.vintage,
                    " · ", x.seller)),
                h("td", { className: "tnum" }, u.usdC(x.size)),
                h("td", { className: "tnum strong" }, x.askPct.toFixed(1), "%"),
                h("td", { className: "tnum" }, b.bids.length),
                h("td", null, h(U.Pill, { tone: x.status === "Open" ? "good"
                  : x.status === "Under negotiation" ? "warn" : "" }, x.status)));
            })))),

        h("div", { className: "col", style: { gap: 14 } },
          h(U.Card, { title: l.instrument,
            desc: l.manager + " · vintage " + l.vintage,
            right: h(U.Pill, { tone: l.status === "Open" ? "good"
              : l.status === "Settled" ? "" : "warn" }, l.status) },
            h("div", { className: "kv" },
              h("dt", null, "Last reported NAV"), h("dd", null, u.usd(l.nav, 0)),
              h("dt", null, "Offered"), h("dd", null, u.usd(l.size, 0)),
              h("dt", null, "Ask"), h("dd", { className: "strong" }, l.askPct.toFixed(1), "% of NAV"),
              h("dt", null, "Indicative range"),
              h("dd", null, l.indicative[0], "–", l.indicative[1], "%"),
              h("dt", null, "Unfunded commitment"), h("dd", null, u.usd(l.unfunded, 0)),
              h("dt", null, "Standing"), h("dd", null, l.days, " days")),
            h("div", { className: "note mt" },
              h("span", { className: "eyebrow" }, "Why they are selling"), h("br"), l.rationale),
            h("div", { className: "mt" },
              h(U.Btn, { kind: "pri", onClick: () => setBid(l),
                lock: l.status === "Settled" ? "This interest has already transferred." : null },
                "Place a bid"))),

          h(U.Card, { title: "Depth", desc: book.bids.length + " standing bids" },
            h(CH.Depth, { bids: book.bids, ask: l.askPct, nav: l.nav })),

          h(U.Card, { title: "Recent prints", desc: "Trades in comparable interests", pad: false },
            h("table", null, h("tbody", null, book.prints.map((p, i) =>
              h("tr", { key: i },
                h("td", { className: "strong tnum", style: { textAlign: "left" } }, p.px.toFixed(1), "%"),
                h("td", { className: "tnum" }, u.usd(p.qty, 0)),
                h("td", { className: "tri tiny right" }, p.days, " days ago")))))),

          h(U.Card, { title: "Capital account", desc: "As the seller reports it", pad: false },
            h("table", null, h("tbody", null, l.account.map((r, i) =>
              h("tr", { key: i },
                h("td", { className: "tri tiny", style: { width: 96 } }, u.fmtDate(r[0])),
                h("td", null, r[1]),
                h("td", { className: "tnum" }, u.usd(r[2], 0))))))))) : null,

      /* ---------------------------------------------------------- your bids */
      tab === "mine" ? (st.bids.length
        ? h("div", { className: "card", style: { overflow: "hidden" } },
            h("table", null,
              h("thead", null, h("tr", null,
                h("th", null, "Interest"), h("th", { className: "right" }, "Your bid"),
                h("th", { className: "right" }, "Size"), h("th", null, "Placed"), h("th", null, "Status"))),
              h("tbody", null, st.bids.map((b) =>
                h("tr", { key: b.id },
                  h("td", { className: "strong" }, b.name),
                  h("td", { className: "tnum" }, b.pct.toFixed(1), "%"),
                  h("td", { className: "tnum" }, u.usd(b.amount, 0)),
                  h("td", { className: "tri tiny" }, u.fmtTs(b.ts)),
                  h("td", null, h(U.Pill, { tone: "accent" }, b.status)))))))
        : h(U.Empty, null, "No bids yet. Open a listing in the book and place one.")) : null,

      /* ------------------------------------------------------------- sell */
      tab === "sell" ? h("div", { className: "col", style: { gap: 14 } },
        h("div", { className: "note" },
          "An interest can be listed once it was originated on Barbell and has been held twelve months. ",
          "Everything else in the book either trades on an exchange already or came in through a spreadsheet, ",
          "where there is no ownership record for the platform to transfer."),
        st.listings.length
          ? h(U.Card, { title: "Your live listings", pad: false },
              h("table", null, h("tbody", null, st.listings.map((x) =>
                h("tr", { key: x.id },
                  h("td", { className: "strong" }, x.name),
                  h("td", { className: "tnum" }, x.pct.toFixed(1), "%"),
                  h("td", { className: "tnum" }, u.usd(x.amount, 0)),
                  h("td", null, h(U.Pill, { tone: "good" }, x.status)))))))
          : null,
        h("div", { className: "card", style: { overflow: "hidden" } },
          h("table", null,
            h("thead", null, h("tr", null,
              h("th", null, "Position"), h("th", null, "Sub-class"),
              h("th", { className: "right" }, "Carrying value"), h("th", null, "Held"), h("th", null, ""))),
            h("tbody", null, st.positions.filter((p) => p.liq !== "Daily").map((p) => {
              const e = u.eligibility(p);
              const locked = !S.canWrite(p.sleeve);
              return h("tr", { key: p.id },
                h("td", { className: "strong" }, p.name),
                h("td", { className: "tri tiny" }, u.subLabel(p.sub)),
                h("td", { className: "tnum" }, u.usd(p.value, 0)),
                h("td", { className: "tri tiny" }, Math.floor(u.days(p.acquired) / 30), " months"),
                h("td", { className: "right" }, e.ok
                  ? h(U.Btn, { size: "sm", lock: locked ? S.LOCK : null,
                      onClick: () => S.actions.openModal({ kind: "list", pid: p.id }) }, "List")
                  : h(U.Pill, { tone: "ghost" }, e.reason)));
            })))) ) : null,

      bid ? h(BidModal, { l: bid, onClose: () => setBid(null) }) : null);
  }

  T2.Exchange = Exchange;
  T2.ListModal = ListModal;
})();
