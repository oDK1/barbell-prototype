/* =============================================================================
   Take 2 — shell and mount.

   A persistent left rail rather than take 1's top tabs: five destinations,
   ordered by how often a family office actually touches them.
   ============================================================================= */
(function () {
  const D = BB.data, u = BB.u, U = T2.ui, S = T2.store, T = T2.data;
  const h = U.h;

  const NAV = [
    { k: "today", label: "Today", ico: "◆" },
    { k: "book", label: "The book", ico: "▤" },
    { k: "offerings", label: "Offerings", ico: "◇" },
    { k: "exchange", label: "Exchange", ico: "⇄" },
    { k: "sync", label: "Sync", ico: "↑" },
  ];

  function Nav({ page }) {
    const st = S.get();
    const pending = st.approvals.filter((a) => a.status === "pending").length;
    const counts = { today: S.isPrincipal() ? pending : 0, sync: st.synced ? 0 : 3 };
    return h("div", { className: "nav" },
      h("div", { className: "brand" },
        h("div", { className: "brand-mark" }, "B"),
        h("div", null,
          h("div", { className: "brand-name" }, "Barbell"),
          h("div", { className: "brand-sub" }, "Namsan Family Office"))),
      NAV.map((n) =>
        h("button", { key: n.k, className: "navlink" + (page === n.k ? " on" : ""),
          onClick: () => S.navigate("/" + n.k) },
          h("span", { className: "ico" }, n.ico), n.label,
          counts[n.k] ? h("span", { className: "pipcount" }, counts[n.k]) : null)),
      h("div", { className: "nav-sect" }, "Record"),
      h("button", { className: "navlink" + (page === "activity" ? " on" : ""),
        onClick: () => S.navigate("/activity") },
        h("span", { className: "ico" }, "≡"), "Activity"),
      h("div", { className: "nav-gap" }),
      h("div", { className: "nav-foot" },
        "Prototype. All data is seeded and held in memory; nothing leaves the browser.",
        h("br"),
        h("a", { onClick: () => (location.href = "../index.html") }, "Open take 1")));
  }

  function AccountMenu({ onClose }) {
    const st = S.get();
    return h(React.Fragment, null,
      h("div", { className: "scrim", style: { background: "transparent" }, onClick: onClose }),
      h("div", { className: "menu" },
        ["principal", "successor"].map((k) => {
          const a = D.accounts[k];
          return h("button", { key: k, className: "menu-item" + (st.account === k ? " on" : ""),
            onClick: () => { S.actions.switchAccount(k); onClose(); } },
            h(U.Avatar, { id: k }),
            h("div", { style: { flex: 1 } },
              h("div", { className: "row", style: { gap: 7 } },
                h("span", { className: "strong" }, a.name),
                st.account === k ? h(U.Pill, { tone: "accent" }, "Active") : null),
              h("div", { className: "tri tiny" }, a.title),
              h("div", { className: "tri tiny", style: { marginTop: 4, lineHeight: 1.45 } }, a.scope)));
        })));
  }

  function TopBar({ page }) {
    const st = S.get();
    const [menu, setMenu] = React.useState(false);
    const nav = NAV.concat([{ k: "activity", label: "Activity" }]).find((n) => n.k === page);
    return h("div", { className: "topbar" },
      h("span", { className: "crumb" }, D.family.name, " / ", nav ? nav.label : ""),
      h("div", { className: "topbar-gap" }),
      st.synced ? h(U.Pill, { tone: "good" }, "Book synced today")
                : h(U.Pill, { tone: "warn" }, u.days(st.syncedAt) + " days since sync"),
      h("button", { className: "acct", onClick: () => setMenu(!menu) },
        h("div", { className: "col" },
          h("span", { className: "acct-nm" }, S.me().name),
          h("span", { className: "acct-rl" }, S.isPrincipal() ? "Full authority" : "Alpha sleeve only")),
        h(U.Avatar, { id: st.account })),
      menu ? h(AccountMenu, { onClose: () => setMenu(false) }) : null);
  }

  /* --------------------------------------------------------------- activity */
  function Activity() {
    const st = S.useStore();
    const [who, setWho] = React.useState("all");
    const rows = st.activity.filter((a) => who === "all" || a.who === who);
    return h("div", { className: "page" },
      h("div", { className: "page-head" },
        h("h1", null, "Activity"),
        h("div", { className: "tri" },
          "One log across both accounts. Every state change either of you makes lands here.")),
      h("div", { className: "filters" },
        h(U.Seg, { value: who, onChange: setWho, options: [
          { k: "all", label: "Both accounts" },
          { k: "principal", label: D.accounts.principal.name },
          { k: "successor", label: D.accounts.successor.name }] })),
      h("div", { className: "card", style: { overflow: "hidden" } },
        h("table", null,
          h("thead", null, h("tr", null,
            h("th", { style: { width: 150 } }, "When"), h("th", { style: { width: 110 } }, "Kind"),
            h("th", null, "What happened"), h("th", { style: { width: 130 } }, "Who"))),
          h("tbody", null, rows.map((a) =>
            h("tr", { key: a.id },
              h("td", { className: "tri tiny" }, u.fmtTs(a.ts)),
              h("td", null, h(U.Pill, { tone: "ghost" }, a.kind)),
              h("td", null,
                h("div", { className: "strong" }, a.text),
                a.detail ? h("div", { className: "tri tiny" }, a.detail) : null),
              h("td", null, h("div", { className: "row", style: { gap: 7 } },
                h("span", { className: "dot", style: { background: a.who === "principal"
                  ? "var(--accent)" : "var(--s1)" } }),
                h("span", { className: "tiny" }, D.accounts[a.who].name)))))))));
  }

  /* ----------------------------------------------------------- sell ticket */
  function SellModal({ p, onClose }) {
    const [amt, setAmt] = React.useState(Math.round(p.value * 0.25 / 1e3) * 1e3);
    const gain = (p.value - p.cost) * (amt / p.value);
    const lots = u.taxLots([p])[0];
    return h(U.Modal, {
      title: "Sell — " + p.name, desc: u.subLabel(p.sub) + " · " + p.liq + " dealing", onClose,
      foot: h(React.Fragment, null,
        h(U.Btn, { kind: "pri", onClick: () => {
          const pos = S.get().positions.find((x) => x.id === p.id);
          pos.value -= amt; pos.cost -= pos.cost * (amt / (pos.value + amt));
          const cash = S.get().positions.find((x) => x.cls === "cash" && x.sleeve === p.sleeve);
          if (cash) cash.value += amt;
          S.log("Trade", "Sold " + u.usd(amt, 0) + " of " + p.name,
            (lots.longTerm ? "Long-term" : "Short-term") + " lot · realized " + u.sgnUsd(gain));
          S.toast("Order filled — settles same day"); onClose();
        } }, "Sell " + u.usd(amt, 0)),
        h(U.Btn, { onClick: onClose }, "Cancel")),
    },
      h("div", { className: "row mb" },
        h("span", { className: "eyebrow", style: { width: 90 } }, "Amount"),
        h(U.MoneyInput, { value: amt, onChange: setAmt, width: 170 }),
        h("span", { className: "tri tiny" }, "of ", u.usd(p.value, 0))),
      h("div", { className: "note" },
        h("div", { className: "kv" },
          h("dt", null, "Realized gain"), h("dd", { className: gain >= 0 ? "pos" : "neg" }, u.sgnUsd(gain)),
          h("dt", null, "Lot treatment"),
          h("dd", null, lots.longTerm ? "Long-term · held " + Math.floor(lots.held / 365) + " years"
                                      : "Short-term · held " + lots.held + " days"),
          h("dt", null, "Cash after"),
          h("dd", null, u.usd(u.total(S.get().positions.filter((x) => x.cls === "cash")) + amt, 0)))),
      p.affiliate
        ? h("div", { className: "note warn mt" },
            "This is the family operating company. Selling changes the family's position in the business, ",
            "not just the portfolio.")
        : null);
  }

  /* -------------------------------------------------------------------- app */
  function App() {
    const st = S.useStore();
    const route = S.useRoute();
    const page = route.page;
    const modal = st.modal;
    const mp = modal ? st.positions.find((p) => p.id === modal.pid) : null;

    return h("div", { className: "app" },
      h(Nav, { page }),
      h("div", { className: "main" },
        h(TopBar, { page }),
        page === "today" ? h(T2.Today)
          : page === "book" ? h(T2.Book)
          : page === "offerings" ? h(T2.Offerings)
          : page === "exchange" ? h(T2.Exchange)
          : page === "sync" ? h(T2.Sync)
          : h(Activity)),
      modal && modal.kind === "list" && mp
        ? h(T2.ListModal, { p: mp, onClose: S.actions.closeModal }) : null,
      modal && modal.kind === "sell" && mp
        ? h(SellModal, { p: mp, onClose: S.actions.closeModal }) : null,
      st.toast ? h("div", { className: "toast" }, st.toast) : null);
  }

  if (!location.hash) location.hash = "/today";
  ReactDOM.createRoot(document.getElementById("root")).render(h(App));
})();
