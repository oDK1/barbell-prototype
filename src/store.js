/* In-memory store. Every mutation resolves optimistically against local state
   and writes a line to the shared activity log. No network anywhere. */
(function () {
  const D = BB.data, u = BB.u;
  const clone = (x) => JSON.parse(JSON.stringify(x));
  let uid = 1000;
  const nextId = (p) => p + ++uid;
  /* Demo clock: the book is kept in KST and the seeded day ends at 15:42.
     Actions taken in this session advance it a few minutes at a time so the
     log reads in the order things actually happened. */
  let clockMin = 15 * 60 + 45;
  function nowTs() {
    clockMin += 3;
    const hh = String(Math.floor(clockMin / 60) % 24).padStart(2, "0");
    const mm = String(clockMin % 60).padStart(2, "0");
    const ss = String((clockMin * 7) % 60).padStart(2, "0");
    return D.TODAY + "T" + hh + ":" + mm + ":" + ss + "+09:00";
  }

  const state = {
    account: "principal",
    onboarded: true,              // the demo lands on a live book; /onboarding replays ingestion
    positions: clone(D.positions),
    approvals: clone(D.approvalsSeed),
    activity: clone(D.activitySeed),
    listings: clone(D.secondary),
    bids: clone(D.bidsSeed),
    trades: clone(D.secondaryTrades),
    ops: clone(D.opsLedger),
    referrals: clone(D.referrals),
    mandate: "balanced",
    survey: {},
    uploads: clone(D.uploadFiles),
    exceptions: clone(D.exceptions).map((e) => ({ ...e, resolved: false, value: e.type === "input" ? e.suggestion : e.answer })),
    ingestDone: false,
    realizedClosed: 0,           // realised P&L of positions fully sold
    toast: null,
  };

  const listeners = new Set();
  function emit() { listeners.forEach((l) => l()); }
  function subscribe(l) { listeners.add(l); return () => listeners.delete(l); }
  function get() { return state; }

  function log(kind, text, detail, who) {
    state.activity.unshift({ id: nextId("l"), ts: nowTs(), who: who || state.account, kind, text, detail });
  }
  function ops(instr, desc, qty) {
    const ts = nowTs();
    const fin = ts.replace(/:(\d{2})\+/, (m, ss) => ":" + String((+ss + 2) % 60).padStart(2, "0") + "+");
    state.ops.unshift({
      id: nextId("x"), ts, instr, desc, qty,
      ref: "BBL-" + D.TODAY.replace(/-/g, "") + "-" + String(Math.floor(Math.random() * 9000) + 1000),
      finality: fin, state: "Final",
    });
  }
  function toast(msg) { state.toast = { msg, id: Date.now() }; }

  /* ------------------------------------------------------------ permissions */
  /* One balance sheet. The Principal acts directly; the Successor sees the
     same book and may act on it, but every commitment goes to the Principal
     for approval first. */
  function canWrite() { return state.account === "principal"; }
  const LOCK_TIP = "The Principal settles this one.";

  /* ------------------------------------------------------------------ cash */
  function drawCash(amount) {
    const pool = state.positions
      .filter((p) => p.cls === "cash")
      .sort((a, b) => (a.sub === "mmf" ? -1 : 1) - (b.sub === "mmf" ? -1 : 1));
    let left = amount;
    pool.forEach((p) => {
      if (left <= 0) return;
      const take = Math.min(p.value, left);
      p.value -= take; p.cost -= take; left -= take;
      if (p.qty) p.qty = Math.round(p.value / (p.pxUsd || 1));
    });
    return amount - left;
  }
  function addCash(amount) {
    const t = state.positions.find((p) => p.cls === "cash" && p.sub === "mmf")
      || state.positions.find((p) => p.cls === "cash");
    t.value += amount; t.cost += amount;
  }

  /* --------------------------------------------------------------- actions */
  const actions = {
    setAccount(a) { state.account = a; emit(); },

    resolveException(id, value) {
      const e = state.exceptions.find((x) => x.id === id);
      if (e) { e.value = value; e.resolved = true; }
      emit();
    },
    /* Take every suggestion as offered, rather than one click at a time. */
    resolveAllExceptions() {
      const open = state.exceptions.filter((e) => !e.resolved);
      if (!open.length) return;
      open.forEach((e) => { e.resolved = true; });
      log("Onboarding", "Applied " + open.length + " suggested " + (open.length === 1 ? "resolution" : "resolutions"),
        open.map((e) => e.kind).join(" · "));
      toast(open.length + " exceptions resolved");
      emit();
    },
    unresolveException(id) {
      const e = state.exceptions.find((x) => x.id === id);
      if (e) e.resolved = false; emit();
    },
    setIngestDone(v) { state.ingestDone = v; emit(); },

    addUploads(files) {
      const size = (b) => !b ? "— KB" : b > 1e6 ? (b / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB";
      files.forEach((f) => {
        state.uploads.push({
          id: nextId("f"), name: f.name, size: size(f.size), sheets: null,
          note: "Added in this session",
        });
      });
      state.ingestDone = false;              // new files mean the read runs again
      log("Onboarding", "Staged " + files.length + (files.length === 1 ? " file" : " files") + " for ingestion",
        files.map((f) => f.name).join(", "));
      toast(files.length === 1 ? "1 file staged" : files.length + " files staged");
      emit();
    },
    removeUpload(id) {
      state.uploads = state.uploads.filter((f) => f.id !== id);
      emit();
    },

    setMandate(key) {
      const m = D.mandates.find((x) => x.key === key);
      if (!m) return;
      state.mandate = key;
      // rescale subcategory targets proportionally inside each class
      D.classes.forEach((c) => {
        const old = c.target, next = m.targets[c.key];
        D.subs.filter((s) => s.cls === c.key).forEach((s) => { s.target = +(s.target * (next / old)).toFixed(2); });
        c.target = next;
      });
      log("Mandate", "Confirmed target allocation — " + m.label + " (" + m.core + "/" + m.alpha + ")",
        D.classes.map((c) => c.label + " " + c.target.toFixed(1)).join(" · "));
      emit();
    },
    setSurvey(id, v) {
      if (v === "" || (Array.isArray(v) && !v.length)) delete state.survey[id];
      else state.survey[id] = v;
      emit();
    },
    /* The family has answered these before; offer them rather than presume them. */
    fillSurvey() {
      D.survey.forEach((q) => { state.survey[q.id] = q.a; });
      log("Mandate", "Applied the family's answers to the eight refining questions",
        "Liquidity needs, capital calls, concentration, FX base, tax residency, drawdown tolerance, transfer horizon, prohibited sectors.");
      toast("Eight answers applied");
      emit();
    },
    clearSurvey() { state.survey = {}; emit(); },

    /* ---- trading listed instruments ---- */
    trade({ side, name, ticker, sub, cls, amount, qty, px, orderType, limit, source }) {
      const existing = state.positions.find((p) => ticker && p.ticker === ticker);
      if (side === "buy") {
        drawCash(amount);
        if (existing) {
          existing.value += amount; existing.cost += amount;
          if (existing.pxUsd) existing.qty = Math.round(existing.value / existing.pxUsd);
        } else {
          state.positions.push({
            id: nextId("p"), name, ticker, cls, sub, grp: "—", prov: "live",
            value: amount, cost: amount, qty: qty || null, px: px || null, pxUsd: px || null,
            ccy: "USD", chg: 0, sector: "—", geo: "—", liq: "Daily",
            acquired: D.TODAY, realizedYTD: 0, src: { file: "Barbell order", cell: "—" },
          });
        }
        log("Trade", "Bought " + u.usd(amount) + " " + name, (orderType === "limit" ? "Limit " + limit : "Market") + " · routed through Hanwha Securities · settles same day.");
        ops(ticker || "—", name, u.usd(amount));
        toast("Order filled — " + name);
      } else {
        const p = existing;
        if (p) {
          const portion = Math.min(amount, p.value);
          const gain = portion * (1 - p.cost / p.value);
          p.value -= portion; p.cost -= portion - gain; p.realizedYTD = (p.realizedYTD || 0) + gain;
          if (p.pxUsd) p.qty = Math.round(p.value / p.pxUsd);
          /* A full exit removes the position — and would take the realised
             amount with it, which is exactly what a harvest books. Realised
             P&L belongs to the book, so it is kept at that level. */
          if (p.value < 1) {
            state.realizedClosed += p.realizedYTD || 0;
            state.positions = state.positions.filter((x) => x.id !== p.id);
          }
          addCash(portion);
          log("Trade", "Sold " + u.usd(portion) + " " + name, "Realised " + u.sgnUsd(gain) + " · settles same day.");
          ops(ticker || "—", name, "−" + u.usd(portion));
          toast("Order filled — " + name);
        }
      }
      emit();
    },

    /* ---- committing to a private offering ---- */
    commit({ deal, amount }) {
      drawCash(amount);
      state.positions.push({
        id: nextId("p"), name: deal.name, cls: deal.cls, sub: deal.fills, grp: "—",
        prov: "hanwha", value: amount, cost: amount, ccy: deal.ccy || "USD",
        liq: deal.liq, term: deal.term, sector: deal.sector, geo: deal.geo,
        asOf: D.TODAY, acquired: D.TODAY, onBarbell: true, vintage: String(new Date(D.TODAY).getFullYear()),
        src: { file: "Barbell subscription", cell: "—" },
      });
      log("Commitment", "Committed " + u.usd(amount) + " to " + deal.name,
        "Documents acknowledged · ownership record updated.");
      ops(deal.id.toUpperCase(), deal.name, u.usd(amount));
      toast("Commitment recorded — " + deal.name);
      emit();
    },

    /* ---- proposals ---- */
    propose({ type, title, target, amount, rationale, payload }) {
      const a = { id: nextId("a"), ts: nowTs(), from: state.account, type, title, target, amount, rationale, payload, status: "pending" };
      state.approvals.unshift(a);
      log("Proposal", "Submitted proposal — " + title, rationale);
      toast("Proposal submitted to the Principal");
      emit();
      return a;
    },
    decide(id, status, comment) {
      const a = state.approvals.find((x) => x.id === id);
      if (!a) return;
      a.status = status; a.comment = comment || ""; a.decidedTs = nowTs();
      const verb = status === "approved" ? "Approved" : status === "declined" ? "Declined" : "Returned";
      log("Approval", verb + " proposal — " + a.title, comment ? "Comment: " + comment : "");
      if (status === "approved" && a.payload) {
        if (a.payload.kind === "trade") actions.trade(a.payload.args);
        if (a.payload.kind === "commit") actions.commit(a.payload.args);
        if (a.payload.kind === "buyListing") actions.buyListing(a.payload.args);
      } else { toast(verb + " — " + a.title); emit(); }
    },

    /* ---- valuations ---- */
    /* `src` is the file the new mark was read from — it replaces the position's
       recorded source, so provenance moves with the number. */
    updateValuation(pid, value, src) {
      const p = state.positions.find((x) => x.id === pid);
      if (!p) return;
      const prev = p.value, prevFile = p.src ? p.src.file : null;
      p.value = value; p.asOf = D.TODAY;
      if (src && src.file) p.src = { file: src.file, cell: src.cell || "—" };
      log("Valuation", "Updated valuation — " + p.name,
        u.usd(prev) + " → " + u.usd(value)
        + (src && src.file
            ? " · read from " + src.file + (src.cell ? " · " + src.cell : "")
              + (prevFile ? " (was " + prevFile + ")" : "")
            : " · self-maintained position re-dated to today."));
      toast("Valuation updated from " + (src && src.file ? src.file : "manual entry"));
      emit();
    },

    /* ---- secondary ---- */
    listPosition({ pid, askPct, size, rationale }) {
      const p = state.positions.find((x) => x.id === pid);
      if (!p) return;
      const l = {
        id: nextId("s"), instrument: p.name, sub: p.sub, cls: p.cls, vintage: p.vintage || "—",
        nav: p.value, size, askPct, indicative: [Math.round(askPct - 4), Math.round(askPct + 3)],
        seller: "Member #0147 (you)", days: 0, status: "Open", rationale, mine: true, pid: p.id,
        manager: "—", account: [[p.acquired, "Funded", p.cost], [p.asOf || D.TODAY, "NAV mark", p.value]],
      };
      state.listings.unshift(l);
      log("Secondary", "Listed " + u.usd(size) + " of " + p.name + " at " + askPct.toFixed(1) + "% of NAV", rationale || "");
      toast("Listing posted to the secondary board");
      emit();
      return l;
    },
    bid({ listingId, price, size }) {
      const l = state.listings.find((x) => x.id === listingId);
      if (!l) return;
      const b = { id: nextId("b"), listingId, price, size, ts: nowTs(), from: state.account, status: "Submitted" };
      state.bids.unshift(b);
      log("Secondary", "Bid submitted — " + u.usd(size) + " of " + l.instrument + " at " + price.toFixed(1) + "% of NAV",
        "With the seller to accept, counter or decline. The listing stays open.");
      toast("Bid submitted");
      emit();
      return b;
    },
    /* Take the ask as it stands — no negotiation. */
    buyListing({ listing }) {
      const consideration = Math.round(listing.size * listing.askPct / 100);
      drawCash(consideration);
      state.positions.push({
        id: nextId("p"), name: listing.instrument.replace(/ — .*$/, ""), cls: listing.cls, sub: listing.sub, grp: "Secondary",
        prov: "hanwha", value: listing.size, cost: consideration, ccy: "USD",
        liq: "Locked", term: "As the original offering", sector: "—", geo: "—",
        asOf: D.TODAY, acquired: D.TODAY, onBarbell: true, vintage: listing.vintage,
        src: { file: "Barbell secondary", cell: "—" },
      });
      const l = state.listings.find((x) => x.id === listing.id);
      if (l) { l.status = "Settled"; l.buyer = state.account; }
      /* what just cleared is a price reference for whoever looks next */
      state.trades.push({ id: nextId("t"), listing: listing.id, ts: D.TODAY, size: listing.size,
        pricePct: listing.askPct, navDate: "2026-06-30", method: "Ask taken",
        buyer: "You", seller: listing.seller });
      log("Secondary", "Bought " + u.usd(listing.size) + " of " + listing.instrument + " at " + listing.askPct.toFixed(1) + "% of NAV",
        "Consideration " + u.usd(consideration) + " · taken at the ask · ownership record updated, settles same day.");
      ops(listing.id.toUpperCase(), listing.instrument, u.usd(consideration));
      toast("Bought at the ask — " + u.usd(consideration));
      emit();
    },

    decideBid(bidId, status) {
      const b = state.bids.find((x) => x.id === bidId);
      if (!b) return;
      b.status = status;
      const l = state.listings.find((x) => x.id === b.listingId);
      if (l && status === "Accepted") {
        l.status = "Settled";
        state.trades.push({ id: nextId("t"), listing: l.id, ts: D.TODAY, size: b.size,
          pricePct: b.price, navDate: "2026-06-30", method: "Bid accepted",
          buyer: b.bidder || "You", seller: l.seller });
      }
      log("Secondary", status + " bid — " + u.usd(b.size) + " of " + (l ? l.instrument : ""),
        status === "Accepted" ? "Ownership record updated. Settles same day." : "");
      toast(status + " — bid " + b.id);
      emit();
    },

    share(dealName, to) {
      state.referrals.sent += 1;
      state.referrals.invites.unshift({ id: nextId("r"), to: to || "Copied link", deal: dealName, ts: D.TODAY, state: "Sent" });
      log("Referral", "Shared " + dealName, "Invitation link generated. Terms and allocation remain gated.");
      toast("Invitation link copied");
      emit();
    },
    dismissToast() { state.toast = null; emit(); },
  };

  /* ------------------------------------------------------------- hash router */
  function parseHash() {
    const h = (location.hash || "#/").slice(1);
    const [path, qs] = h.split("?");
    const parts = path.split("/").filter(Boolean);
    const query = {};
    if (qs) qs.split("&").forEach((kv) => { const [k, v] = kv.split("="); query[k] = decodeURIComponent(v || ""); });
    return { path: "/" + parts.join("/"), parts, query };
  }
  function navigate(to) { location.hash = to; }

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

  /* Realised year to date across the book, closed positions included. */
  function realizedBook() { return u.realizedYTD(state.positions) + state.realizedClosed; }

  BB.store = { get, subscribe, actions, realizedBook, useStore, useRoute, navigate, canWrite, LOCK_TIP, log, toast };
})();
