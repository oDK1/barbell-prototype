/* =============================================================================
   Take 2 — Offerings (the primary marketplace).

   Take 1 presents one flat merit-ranked list and hides the wrapper. Take 2
   organises the same 34 instruments by the Hanwha affiliate that originates
   them, because "what can the group actually put in front of me" is a
   different question from "what fits my book" — and the desk is what a family
   office asks about first. Merit still decides the order inside each desk.
   Detail opens in a drawer rather than a page, so the list never leaves.
   ============================================================================= */
(function () {
  const D = BB.data, u = BB.u, U = T2.ui, S = T2.store, T = T2.data, CH = T2.charts;
  const h = U.h;

  function Fit({ n }) {
    const tone = n >= 90 ? "good" : n >= 80 ? "accent" : "";
    return h(U.Pill, { tone }, n, " fit");
  }

  function DealCard({ m, onOpen }) {
    const desk = T.deskById[m.desk];
    return h("button", { className: "deal", onClick: onOpen },
      h("div", { className: "deal-top" },
        h(U.Swatch, { cls: m.cls }),
        h("div", { className: "deal-nm", style: { flex: 1 } }, m.name),
        h(Fit, { n: m.fit })),
      h("div", { className: "row wrap", style: { gap: 6 } },
        h(U.Pill, { tone: "ghost" }, m.kind === "listed" ? "Listed" : "Private"),
        h(U.Pill, { tone: "ghost" }, m.liq),
        m.hanwha ? h(U.Pill, { tone: "accent" }, "Hanwha capital alongside") : null),
      h("div", { className: "deal-why" }, m.why),
      h("div", { className: "deal-stats" },
        h("div", { className: "deal-stat" },
          h("div", { className: "eyebrow" }, "Return"), h("div", { className: "v" }, m.ret)),
        h("div", { className: "deal-stat" },
          h("div", { className: "eyebrow" }, "Minimum"), h("div", { className: "v" }, u.usdC(m.min))),
        h("div", { className: "deal-stat" },
          h("div", { className: "eyebrow" }, "Term"), h("div", { className: "v" }, m.term))));
  }

  /* --------------------------------------------------------- order ticket */
  function Ticket({ m, onClose }) {
    const st = S.get();
    const principal = S.isPrincipal();
    const capacity = S.alphaCapacity();
    const [amt, setAmt] = React.useState(m.min);
    const listed = m.kind === "listed";
    const overCapacity = !principal && amt > capacity;
    const imp = u.impact(st.positions, m.fills, amt);
    const [why, setWhy] = React.useState("");

    const verb = listed ? "Buy" : "Commit";
    const label = overCapacity ? "Submit proposal to the Principal" : verb + " " + u.usd(amt, 0);

    return h(U.Modal, {
      title: verb + " — " + m.name,
      desc: T.deskById[m.desk].name + " · " + u.subLabel(m.fills),
      onClose, wide: true,
      foot: h(React.Fragment, null,
        h(U.Btn, { kind: "pri", disabled: amt < m.min,
          onClick: () => {
            if (overCapacity) S.actions.propose(m, amt, why || m.why);
            else S.actions.execute(m, amt, listed ? "Trade" : "Commitment");
            onClose();
          } }, label),
        h(U.Btn, { onClick: onClose }, "Cancel"),
        h("div", { className: "gap" }),
        h("span", { className: "tri tiny" }, listed ? "Settles same day" : "Subscription documents follow")),
    },
      h("div", { className: "row mb" },
        h("span", { className: "eyebrow", style: { width: 96 } }, "Amount"),
        h(U.MoneyInput, { value: amt, onChange: setAmt, width: 170 }),
        h("div", { className: "col" },
          h("span", { className: "tri tiny" }, "Minimum ", u.usd(m.min, 0)),
          h("span", { className: "tri tiny" }, u.krwC(amt)))),
      h("div", { className: "row mb", style: { gap: 7 } },
        [m.min, m.min * 2, m.min * 5].map((v) =>
          h("button", { key: v, className: "btn sm", onClick: () => setAmt(v) }, u.usdC(v)))),

      h("div", { className: "note" },
        h("div", { className: "row mb-s" },
          h("span", { className: "eyebrow" }, "What this does to the book")),
        h("div", { className: "kv" },
          h("dt", null, u.subLabel(m.fills)),
          h("dd", null, u.pct(imp.sub.wt, 1), " → ", h("span", { className: "strong" }, u.pct(imp.subAfter, 1)),
            " (target ", u.pct(imp.sub.target, 1), ")"),
          h("dt", null, u.clsLabel(m.cls)),
          h("dd", null, u.pct(imp.cls.wt, 1), " → ", h("span", { className: "strong" }, u.pct(imp.clsAfter, 1)),
            " (target ", u.pct(imp.cls.target, 1), ")"),
          h("dt", null, "Cash after"),
          h("dd", null, u.usd(u.total(st.positions.filter((p) => p.cls === "cash")) - amt, 0)))),

      !principal
        ? h("div", { className: "note " + (overCapacity ? "warn" : "accent"), style: { marginTop: 12 } },
            overCapacity
              ? h("span", null,
                  h("span", { className: "strong" }, "Above your Alpha capacity of ",
                    u.usd(capacity, 0), "."),
                  " This goes to the Principal as a proposal rather than executing. ",
                  "Add a line on why, and it travels with the request.")
              : h("span", null,
                  h("span", { className: "strong" }, "Inside your Alpha capacity."),
                  " ", u.usd(capacity - amt, 0), " would remain. No approval needed."))
        : null,
      !principal && overCapacity
        ? h("textarea", { className: "input mt-s", style: { width: "100%", minHeight: 64, resize: "vertical" },
            placeholder: "Why the Principal should approve this…", value: why,
            onChange: (e) => setWhy(e.target.value) })
        : null);
  }

  /* ---------------------------------------------------------- deal drawer */
  function DealDrawer({ id, onClose }) {
    const st = S.get();
    const m = T.market.find((x) => x.id === id);
    const [ticket, setTicket] = React.useState(false);
    if (!m) return null;
    const desk = T.deskById[m.desk];
    const principal = S.isPrincipal();
    const capacity = S.alphaCapacity();
    const held = st.positions.filter((p) => p.sub === m.fills);
    const listed = m.kind === "listed";
    const lock = !principal && listed ? "Listed instruments trade in Core — the Principal's remit." : null;

    return h(React.Fragment, null,
      h(U.Drawer, {
        eyebrow: desk.name,
        title: m.name,
        badge: h(React.Fragment, null,
          h(U.Pill, { tone: "ghost", dot: U.CLS_HEX[m.cls] }, u.subLabel(m.fills)),
          h(U.Pill, { tone: "ghost" }, listed ? "Listed" : "Private"),
          h(U.Pill, { tone: "ghost" }, m.liq),
          h(Fit, { n: m.fit })),
        onClose,
        foot: h(React.Fragment, null,
          h(U.Btn, { kind: "pri", lock, onClick: () => setTicket(true) },
            listed ? "Buy" : "Commit"),
          h(U.Btn, { onClick: onClose }, "Not now"),
          h("div", { className: "gap" }),
          h("span", { className: "tri tiny" }, "Minimum ", u.usd(m.min, 0))),
      },
        h("div", { className: "grid g3" },
          h(U.Stat, { label: "Return", value: m.ret }),
          h(U.Stat, { label: "Term", value: m.term }),
          h(U.Stat, { label: "Minimum", value: u.usdC(m.min) })),
        h("div", { className: "row wrap mt-s mb tri mini", style: { gap: 14 } },
          h("span", null, h("span", { className: "eyebrow" }, "Available"), "  ", m.avail),
          m.closing ? h("span", null, h("span", { className: "eyebrow" }, "Closes"), "  ",
            u.fmtDate(m.closing)) : null,
          h("span", null, h("span", { className: "eyebrow" }, "Currency"), "  ", m.ccy || "USD")),

        m.hanwha
          ? h("div", { className: "note accent mb" },
              h("span", { className: "strong" }, "Hanwha capital is alongside. "), m.anchor)
          : null,

        h("h3", { className: "mb-s" }, "Overview"),
        h("p", { className: "prose mb" }, m.overview),

        m.terms ? h(U.Card, { title: "Terms", pad: false },
          h("table", null, h("tbody", null, m.terms.map((t, i) =>
            h("tr", { key: i },
              h("td", { className: "tri", style: { width: 170 } }, t[0]),
              h("td", { className: "strong" }, t[1])))))) : null,

        h("div", { className: "mt" },
          h(U.Card, { title: "Against your book" },
            h("div", { className: "kv" },
              h("dt", null, "You already hold in " + u.subLabel(m.fills)),
              h("dd", null, held.length ? u.usd(u.total(held), 0) + " · " + held.length + " positions" : "Nothing"),
              h("dt", null, u.clsLabel(m.cls) + " weight"),
              h("dd", null, u.pct(u.byClass(st.positions).find((c) => c.key === m.cls).wt, 1),
                " against a ", u.pct(u.byClass(st.positions).find((c) => c.key === m.cls).target, 0), " target"),
              !principal ? h("dt", null, "Your Alpha capacity") : null,
              !principal ? h("dd", null, u.usd(capacity, 0)) : null),
            h("div", { className: "note mt-s" },
              "Fit scores the instrument — terms, manager, security, and whether the family already ",
              "owns this risk. It is not a measure of how far the book sits from target."))),

        m.docs ? h("div", { className: "mt" },
          h(U.Card, { title: "Documents" },
            h("div", { className: "col", style: { gap: 8 } }, m.docs.map((d, i) =>
              h("div", { key: i, className: "row" },
                h("span", { className: "file-ico", style: { width: 26, height: 26, fontSize: 9 } }, "DOC"),
                h("span", { style: { flex: 1 } }, d[0]),
                h("span", { className: "tri tiny" }, d[1]),
                h("button", { className: "link tiny", onClick: () => S.toast("Document opens in the data room") },
                  "Open")))))) : null,

        m.qa ? h("div", { className: "mt" },
          h(U.Card, { title: "Questions the desk has answered" },
            h("div", { className: "col", style: { gap: 14 } }, m.qa.map((q, i) =>
              h("div", { key: i },
                h("div", { className: "strong mb-s" }, q[0]),
                h("div", { className: "prose", style: { fontSize: 12.5 } }, q[1])))))) : null),

      ticket ? h(Ticket, { m, onClose: () => { setTicket(false); onClose(); } }) : null);
  }

  /* ------------------------------------------------------------------ page */
  function Offerings() {
    const st = S.useStore();
    const principal = S.isPrincipal();
    const capacity = S.alphaCapacity();
    const [desk, setDesk] = React.useState("all");
    const [cls, setCls] = React.useState("all");
    const [liq, setLiq] = React.useState("all");
    const [q, setQ] = React.useState("");

    /* The account decides the inventory: the Successor's sleeve is private
       growth, so listed instruments — which trade in Core — are not theirs. */
    let pool = T.market.filter((m) => principal || m.kind === "private");
    pool = pool.filter((m) =>
      (desk === "all" || m.desk === desk) &&
      (cls === "all" || m.cls === cls) &&
      (liq === "all" || (liq === "liquid" ? m.liq === "Daily" : m.liq !== "Daily")) &&
      (!q || (m.name + " " + m.sector + " " + (m.manager || "")).toLowerCase().indexOf(q.toLowerCase()) >= 0));

    const within = !principal ? pool.filter((m) => m.min <= capacity) : [];
    const byDesk = T.desks.map((d) => ({
      desk: d, items: pool.filter((m) => m.desk === d.key).sort((a, b) => b.fit - a.fit),
    })).filter((g) => g.items.length);

    return h("div", { className: "page" },
      h("div", { className: "page-head" },
        h("h1", null, "Offerings"),
        h("div", { className: "tri" },
          principal
            ? "Everything the Hanwha affiliates can put in front of this family, by the desk that originates it."
            : "Private-market offerings only. Listed instruments trade in Core, which is the Principal's remit.")),

      h("div", { className: "filters" },
        h("input", { className: "input", placeholder: "Search offerings…", value: q,
                     style: { width: 230 }, onChange: (e) => setQ(e.target.value) }),
        h(U.Select, { value: desk, onChange: setDesk, options:
          [{ k: "all", label: "All desks" }].concat(T.desks.map((d) => ({ k: d.key, label: d.name }))) }),
        h(U.Select, { value: cls, onChange: setCls, options:
          [{ k: "all", label: "Any class" }].concat(D.classes.map((c) => ({ k: c.key, label: c.label }))) }),
        h(U.Select, { value: liq, onChange: setLiq, options: [
          { k: "all", label: "Any liquidity" }, { k: "liquid", label: "Daily dealing" },
          { k: "locked", label: "Locked up" }] }),
        h("div", { className: "gap" }),
        h("span", { className: "tri tiny" }, pool.length, " of ",
          T.market.filter((m) => principal || m.kind === "private").length, " shown")),

      !principal && within.length
        ? h("div", { className: "mb" },
            h("div", { className: "note accent mb-s" },
              h("span", { className: "strong" }, within.length, " of these sit inside your ",
                u.usd(capacity, 0), " Alpha capacity"),
              " and need no approval. Anything larger is submitted to the Principal as a proposal."))
        : null,

      byDesk.length === 0
        ? h(U.Empty, null, "Nothing matches those filters.")
        : byDesk.map((g) =>
            h("div", { key: g.desk.key },
              h("div", { className: "desk-hd" },
                h("div", { className: "desk-logo", style: { background: g.desk.color } }, g.desk.short),
                h("div", null,
                  h("h2", null, g.desk.name),
                  h("div", { className: "tri mini" }, g.desk.line, " · ", g.items.length, " offerings")),
                h("div", { className: "gap" }),
                h("div", { className: "tri tiny", style: { maxWidth: 380, textAlign: "right" } }, g.desk.blurb)),
              h("div", { className: "deck" }, g.items.map((m) =>
                h(DealCard, { key: m.id, m, onOpen: () => S.actions.openDrawer("deal", m.id) }))))),

      st.drawer && st.drawer.kind === "deal"
        ? h(DealDrawer, { id: st.drawer.id, onClose: S.actions.closeDrawer })
        : null);
  }

  T2.Offerings = Offerings;
  T2.DealDrawer = DealDrawer;
  T2.Ticket = Ticket;
})();
