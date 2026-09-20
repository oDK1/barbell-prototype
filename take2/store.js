/* =============================================================================
   Take 2 — state, permissions, router.

   Its own store, independent of take 1's, but it enforces the same two rules:
   the Principal writes the whole balance sheet, the Successor writes only the
   Alpha sleeve, and anything larger than the Alpha sleeve's cash capacity is
   submitted as a proposal rather than executed.
   ============================================================================= */
(function () {
  const D = BB.data, u = BB.u, T = T2.data;

  const LOCK = "Core sleeve — Principal authority required.";

  const state = {
    account: "principal",
    positions: D.positions.map((p) => Object.assign({}, p)),
    approvals: D.approvalsSeed.map((a) => Object.assign({}, a)),
    activity: D.activitySeed.map((a) => Object.assign({}, a)),
    objective: (D.mandates.find((m) => m.current) || D.mandates[1]).key,  // the adopted mandate
    bids: [],                 // bids this family has placed on the exchange
    listings: [],             // positions this family has listed
    syncedAt: T.lastSync.date,
    synced: false,            // has the pending Excel sync been run in this session
    resolved: {},             // exception id -> chosen answer
    seen: {},                 // dismissed items on Today
    drawer: null,             // { kind, id }
    modal: null,
    toast: null,
  };

  const subs = new Set();
  const emit = () => subs.forEach((f) => f());
  const get = () => state;
  const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };

  let toastTimer = null;
  function toast(msg) {
    state.toast = msg; emit();
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { state.toast = null; emit(); }, 2600);
  }

  function log(kind, text, detail) {
    state.activity.unshift({
      id: "n" + Date.now() + Math.random().toString(36).slice(2, 5),
      ts: new Date().toISOString(), who: state.account, kind, text, detail,
    });
  }

  /* ---------------------------------------------------------- permissions */
  const canWrite = (sleeve) => state.account === "principal" || sleeve === "alpha";
  const alphaCapacity = () =>
    u.total(state.positions.filter((p) => p.sleeve === "alpha" && p.cls === "cash"));
  const isPrincipal = () => state.account === "principal";
  const me = () => D.accounts[state.account];

  /* -------------------------------------------------------------- actions */
  const actions = {
    switchAccount(id) {
      state.account = id; state.drawer = null; state.modal = null;
      emit(); toast("Now viewing as " + D.accounts[id].name);
    },

    openDrawer(kind, id) { state.drawer = { kind, id }; emit(); },
    closeDrawer() { state.drawer = null; emit(); },
    openModal(m) { state.modal = m; emit(); },
    closeModal() { state.modal = null; emit(); },

    /* The objective is a what-if until it is adopted. Adopting rewrites every
       class target the whole app is drawn against. */
    adoptObjective(key) {
      const m = D.mandates.find((x) => x.key === key);
      state.objective = key;
      D.classes.forEach((c) => { c.target = m.targets[c.key]; });
      log("Mandate", "Adopted the " + m.label + " mandate",
          m.core + "/" + m.alpha + " Core/Alpha. Class targets rewritten: " +
          D.classes.map((c) => c.label + " " + m.targets[c.key] + "%").join(", ") + ".");
      emit(); toast(m.label + " adopted — every target updated");
    },

    /* ---- the Excel spine ---- */
    resolveException(id, answer) { state.resolved[id] = answer; emit(); },
    runSync() {
      const t = T.pending.diff;
      t.added.forEach((a, i) => {
        state.positions.push({
          id: "sync" + i, name: a.name, cls: a.cls, sub: a.cls === "real" ? "re" : "pubeq",
          grp: "Added by sync", sleeve: "core", prov: "hanwha", value: a.value, cost: a.value,
          qty: 1, px: a.value, ccy: "USD", pxUsd: a.value, chg: 0, sector: "—", geo: "Korea",
          liq: "Locked", acquired: T2.data.lastSync.date, realizedYTD: 0,
          src: { file: a.src, cell: "—" }, asOf: D.TODAY,
        });
      });
      t.revalued.forEach((r) => {
        const p = state.positions.find((x) => x.name.indexOf(r.name.split(",")[0]) === 0);
        if (p) { p.value = r.to; p.asOf = D.TODAY; p.prov = "hanwha"; }
      });
      t.removed.forEach((r) => {
        const i = state.positions.findIndex((x) => x.name === r.name);
        if (i >= 0) state.positions.splice(i, 1);
      });
      state.synced = true;
      state.syncedAt = D.TODAY;
      log("Sync", "Portfolio re-synced from 3 spreadsheets",
          t.added.length + " added, " + t.revalued.length + " revalued, " +
          t.removed.length + " removed. 7 exceptions cleared by the " +
          (isPrincipal() ? "Principal" : "Successor") + ".");
      emit(); toast("Book updated — " + (t.added.length + t.revalued.length + t.removed.length) + " changes applied");
    },

    /* ---- transacting ---- */
    execute(item, amount, kind) {
      const sub = D.subs.find((s) => s.key === item.fills);
      const sleeve = state.account === "principal" ? "core" : "alpha";
      const cash = state.positions.filter((p) => p.sleeve === sleeve && p.cls === "cash");
      let left = amount;
      cash.forEach((c) => { const take = Math.min(c.value, left); c.value -= take; left -= take; });
      const existing = state.positions.find((p) => p.name === item.name && p.sleeve === sleeve);
      if (existing) { existing.value += amount; existing.cost += amount; }
      else {
        state.positions.push({
          id: "new" + Date.now(), name: item.name, cls: item.cls, sub: item.fills,
          grp: item.kind === "listed" ? "Bought on Barbell" : "Committed on Barbell",
          sleeve, prov: item.kind === "listed" ? "live" : "hanwha", value: amount, cost: amount,
          qty: 1, px: amount, ccy: item.ccy || "USD", pxUsd: amount, chg: 0,
          sector: item.sector, geo: item.geo, liq: item.liq, acquired: D.TODAY,
          realizedYTD: 0, onBarbell: true, asOf: D.TODAY,
          src: { file: "Barbell", cell: "—" },
        });
      }
      log(kind, kind + " " + BB.u.usd(amount, 0) + " — " + item.name,
          (sub ? sub.label : "") + " · " + (sleeve === "core" ? "Core" : "Alpha") + " sleeve · " +
          T.deskById[item.desk].name);
      emit(); toast(kind === "Commitment" ? "Committed " + BB.u.usd(amount, 0) : "Order filled");
    },

    propose(item, amount, why) {
      state.approvals.unshift({
        id: "p" + Date.now(), ts: new Date().toISOString(), from: "successor",
        type: item.kind === "listed" ? "Trade" : "Commitment",
        title: (item.kind === "listed" ? "Buy " : "Commit ") + BB.u.usd(amount, 0) + " of " + item.name,
        target: item.id, amount, sleeve: "core", rationale: why, status: "pending",
      });
      log("Proposal", "Submitted a proposal to the Principal", item.name + " · " + BB.u.usd(amount, 0));
      emit(); toast("Proposal sent to the Principal");
    },

    decide(id, verdict, note) {
      const a = state.approvals.find((x) => x.id === id);
      if (!a) return;
      a.status = verdict; a.note = note;
      if (verdict === "approved") {
        const item = T.market.find((m) => m.id === a.target);
        if (item) {
          const cash = state.positions.filter((p) => p.sleeve === "core" && p.cls === "cash");
          let left = a.amount;
          cash.forEach((c) => { const take = Math.min(c.value, left); c.value -= take; left -= take; });
          state.positions.push({
            id: "ap" + Date.now(), name: item.name, cls: item.cls, sub: item.fills,
            grp: "Approved proposal", sleeve: "core", prov: item.kind === "listed" ? "live" : "hanwha",
            value: a.amount, cost: a.amount, qty: 1, px: a.amount, ccy: "USD", pxUsd: a.amount,
            chg: 0, sector: item.sector, geo: item.geo, liq: item.liq, acquired: D.TODAY,
            realizedYTD: 0, onBarbell: true, asOf: D.TODAY, src: { file: "Barbell", cell: "—" },
          });
        }
      }
      log("Approval", (verdict === "approved" ? "Approved" : "Declined") + " — " + a.title, note || "");
      emit(); toast(verdict === "approved" ? "Approved and executed" : "Declined");
    },

    /* ---- the exchange ---- */
    placeBid(listing, pct, amount) {
      state.bids.unshift({
        id: "b" + Date.now(), listing: listing.id, name: listing.instrument,
        pct, amount, ts: new Date().toISOString(), status: "Live",
      });
      log("Bid", "Bid " + pct.toFixed(1) + "% of NAV for " + BB.u.usd(amount, 0) + " — " + listing.instrument,
          "Members-only secondary. Seller is " + listing.seller + ".");
      emit(); toast("Bid placed — the seller has 48 hours");
    },
    listPosition(p, pct, amount) {
      state.listings.unshift({
        id: "L" + Date.now(), pid: p.id, name: p.name, pct, amount,
        ts: new Date().toISOString(), status: "Open", views: 0,
      });
      log("Listing", "Listed " + BB.u.usd(amount, 0) + " of " + p.name + " at " + pct.toFixed(1) + "% of NAV",
          "Visible to verified members only.");
      emit(); toast("Listed on the exchange");
    },
    acceptBid(listingId, bid) {
      log("Settlement", "Accepted a bid of " + BB.u.usd(bid.qty, 0) + " at " + bid.px.toFixed(1) + "% of NAV",
          "Ownership record updated; cash settles same day.");
      emit(); toast("Transfer complete — settles same day");
    },
    dismiss(key) { state.seen[key] = true; emit(); },
  };

  /* --------------------------------------------------------------- router */
  const ROUTES = ["today", "book", "offerings", "exchange", "sync", "activity"];
  function parseHash() {
    const raw = (location.hash || "#/today").replace(/^#\/?/, "");
    const parts = raw.split("/").filter(Boolean);
    const page = ROUTES.indexOf(parts[0]) >= 0 ? parts[0] : "today";
    return { page, id: parts[1] || null };
  }
  const navigate = (to) => { location.hash = to; };

  function useStore() {
    const [, force] = React.useReducer((x) => x + 1, 0);
    React.useEffect(() => subscribe(force), []);
    return state;
  }
  function useRoute() {
    const [r, setR] = React.useState(parseHash);
    React.useEffect(() => {
      const on = () => { setR(parseHash()); window.scrollTo(0, 0); };
      window.addEventListener("hashchange", on);
      return () => window.removeEventListener("hashchange", on);
    }, []);
    return r;
  }

  T2.store = { get, subscribe, actions, useStore, useRoute, navigate, canWrite,
               alphaCapacity, isPrincipal, me, log, toast, LOCK };
})();
