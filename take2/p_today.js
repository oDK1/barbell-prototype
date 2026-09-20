/* =============================================================================
   Take 2 — Today.

   The screen take 1 does not have. Take 1 opens on the portfolio and keeps
   approvals on their own page; here the product opens on the decisions that
   are actually outstanding, and the balance sheet is one click behind it.
   ============================================================================= */
(function () {
  const D = BB.data, u = BB.u, U = T2.ui, S = T2.store, T = T2.data, CH = T2.charts;
  const h = U.h;

  function TaskIcon({ tone, glyph }) {
    const map = { crit: ["var(--crit-wash)", "var(--critical)"], warn: ["var(--warn-wash)", "#8A6A1F"],
                  good: ["var(--good-wash)", "var(--good-ink)"], accent: ["var(--accent-wash)", "var(--accent)"] };
    const c = map[tone] || map.accent;
    return h("div", { className: "task-ico", style: { background: c[0], color: c[1], fontWeight: 700, fontSize: 13 } }, glyph);
  }

  function Task({ tone, glyph, title, body, action, onAction, children }) {
    return h("div", { className: "task" },
      h(TaskIcon, { tone, glyph }),
      h("div", { className: "task-bd" },
        h("div", { className: "task-t" }, title),
        h("div", { className: "task-s" }, body),
        children),
      action ? h(U.Btn, { size: "sm", onClick: onAction }, action) : null);
  }

  function ApprovalTask({ a }) {
    const st = S.get();
    const [note, setNote] = React.useState("");
    const [open, setOpen] = React.useState(false);
    const principal = S.isPrincipal();
    const done = a.status !== "pending";
    return h("div", { className: "task" },
      h(TaskIcon, { tone: done ? (a.status === "approved" ? "good" : "crit") : "accent", glyph: "JP" }),
      h("div", { className: "task-bd" },
        h("div", { className: "row", style: { gap: 8 } },
          h("div", { className: "task-t" }, a.title),
          done ? h(U.Pill, { tone: a.status === "approved" ? "good" : "crit" },
            a.status === "approved" ? "Approved" : "Declined") : null),
        h("div", { className: "task-s" }, a.rationale),
        h("div", { className: "row mt-s tri tiny", style: { gap: 10 } },
          h("span", null, "From ", D.accounts[a.from].name),
          h("span", null, "·"),
          h("span", null, a.type),
          h("span", null, "·"),
          h("span", null, u.fmtTs(a.ts))),
        !done && principal && open
          ? h("div", { className: "mt-s row" },
              h("input", { className: "input", placeholder: "Add a note (optional)", value: note,
                           style: { flex: 1 }, onChange: (e) => setNote(e.target.value) }),
              h(U.Btn, { kind: "pri", size: "sm", onClick: () => S.actions.decide(a.id, "approved", note) }, "Approve"),
              h(U.Btn, { size: "sm", onClick: () => S.actions.decide(a.id, "declined", note) }, "Decline"))
          : null),
      !done && principal && !open
        ? h(U.Btn, { size: "sm", kind: "pri", onClick: () => setOpen(true) }, "Decide")
        : null,
      !done && !principal
        ? h(U.Pill, { tone: "warn" }, "Awaiting the Principal") : null);
  }

  function Today() {
    const st = S.useStore();
    const ps = st.positions;
    const principal = S.isPrincipal();
    const mine = principal ? ps : ps.filter((p) => p.sleeve === "alpha");
    const total = u.total(ps);
    const cls = u.byClass(ps);
    const unreal = u.unrealized(ps);
    const liq = u.liquidity90(ps);
    const short = u.shortfall(ps);
    const worst = cls.slice().sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))[0];
    const stale = ps.filter((p) => p.prov === "self" && u.days(p.asOf || st.syncedAt) > 90);
    const soon = D.capitalCalls.filter((c) => u.days(D.TODAY, c.date) <= 120 && new Date(c.date) >= new Date(D.TODAY));
    const soonSum = u.sum(soon, (c) => c.amount);
    const pending = st.approvals.filter((a) => a.status === "pending");
    const sinceSync = u.days(st.syncedAt);
    const lastChange = T.lastSync.valueAfter - T.lastSync.valueBefore;
    const capacity = S.alphaCapacity();
    const authority = T.market.filter((m) => m.kind === "private" && m.min <= capacity).length;

    const diff = T.pending.diff;
    const diffCount = diff.added.length + diff.revalued.length + diff.removed.length;

    const hour = new Date().getHours();
    const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    return h("div", { className: "page" },
      h("div", { className: "page-head" },
        h("h1", null, greet + ", " + S.me().name.split(" ").slice(-1)[0]),
        h("div", { className: "tri" },
          D.family.name, " · ", principal ? "whole balance sheet" : "Alpha sleeve",
          " · prices as of ", u.fmtTs(D.family.asOf))),

      /* ---------------------------------------------------------- hero */
      h("div", { className: "card", style: { padding: 22 } },
        h("div", { className: "row", style: { alignItems: "flex-start", gap: 28 } },
          h("div", { style: { minWidth: 250 } },
            h("div", { className: "eyebrow" }, principal ? "Total book" : "Alpha sleeve"),
            h("div", { className: "hero-fig", style: { marginTop: 4 } },
              u.usd(principal ? total : u.total(mine), 0)),
            h("div", { className: "tri mini", style: { marginTop: 2 } },
              u.krwFull(principal ? total : u.total(mine))),
            h("div", { className: "row mt-s", style: { gap: 8 } },
              h(U.Pill, { tone: lastChange >= 0 ? "good" : "crit" },
                u.sgnUsd(lastChange), " since the ", u.fmtDate(T.lastSync.date), " sync"),
              h(CH.Spark, { data: T.bookHistory }))),
          h("div", { style: { flex: 1, minWidth: 0 } },
            h("div", { className: "row mb-s" },
              h("span", { className: "eyebrow" }, "Allocation"),
              h("div", { className: "gap" }),
              h("button", { className: "link tiny", onClick: () => S.navigate("/book") },
                "Open the book →")),
            h(CH.AllocBar, { rows: cls.map((c) => ({ key: c.key, label: c.label, pct: c.wt,
                                                     value: c.value, target: c.target })) })))),

      /* --------------------------------------------------------- tiles */
      h("div", { className: "grid g4 mt" },
        h(U.Stat, { label: "Unrealized P&L", value: u.sgnUsd(unreal),
                    delta: u.pct((unreal / (u.sum(ps, (p) => p.cost) || 1)) * 100, 1) + " on cost",
                    tone: unreal >= 0 ? "pos" : "neg" }),
        h(U.Stat, { label: "Liquid within 90 days", value: u.usdC(liq.within90),
                    delta: u.pct((liq.within90 / total) * 100, 1) + " of the book" }),
        h(U.Stat, { label: "Largest drift", value: u.pp(worst.drift, 1),
                    delta: worst.label + " vs a " + u.pct(worst.target, 0) + " target" }),
        h(U.Stat, { label: "Positions", value: String(ps.length),
                    delta: ps.filter((p) => p.liq !== "Daily").length + " illiquid · " +
                           u.days(st.syncedAt) + " days since sync" })),

      /* ----------------------------------------------------- the queue */
      h("div", { className: "grid g-2-1 mt" },
        h("div", { className: "card" },
          h("div", { className: "card-hd" },
            h("div", null, h("h3", null, "Needs a decision"),
              h("div", { className: "tri mini", style: { marginTop: 2 } },
                "Everything outstanding, in one queue")),
            h("div", { className: "gap" }),
            pending.length ? h(U.Pill, { tone: "accent" }, pending.length + " waiting") : null),
          h("div", null,
            st.approvals.filter((a) => a.status === "pending").map((a) => h(ApprovalTask, { key: a.id, a })),

            !st.synced && diffCount
              ? h(Task, { tone: "accent", glyph: "XL",
                  title: "Three spreadsheets are staged and unread",
                  body: "The CFO dropped this quarter's workbooks " + sinceSync +
                        " days ago. Running the sync would change " + diffCount +
                        " positions and raise one new capital call.",
                  action: "Review the sync", onAction: () => S.navigate("/sync") })
              : null,

            short
              ? h(Task, { tone: "crit", glyph: "!",
                  title: "Projected cash goes short in " + short.month,
                  body: u.usd(short.amount, 0) + " below zero against " + short.quarter + " calls of " +
                        u.usd(short.quarterCalls, 0) + ". Selling listed positions would cover it without touching a fund.",
                  action: "See the runway", onAction: () => S.navigate("/book") })
              : null,

            soon.length
              ? h(Task, { tone: "warn", glyph: "₩",
                  title: u.usd(soonSum, 0) + " of capital calls inside 120 days",
                  body: soon.length + " calls across " +
                        new Set(soon.map((c) => c.fund)).size + " funds. Earliest is " +
                        soon[0].fund + " on " + u.fmtDate(soon[0].date) + ".",
                  action: "Plan liquidity", onAction: () => S.navigate("/book") })
              : null,

            Math.abs(worst.drift) > 4
              ? h(Task, { tone: "warn", glyph: "%",
                  title: worst.label + " sits " + u.pp(worst.drift, 1) + " from its target",
                  body: "The model for a book this size and this objective suggests " +
                        u.pct(worst.target, 0) + ". This is guidance, not an instruction — nothing rebalances itself.",
                  action: "Open the model", onAction: () => S.navigate("/book") })
              : null,

            stale.length
              ? h(Task, { tone: "warn", glyph: "?",
                  title: stale.length + " valuations are more than 90 days old",
                  body: "Self-maintained marks on " +
                        stale.slice(0, 2).map((p) => p.name).join(" and ") +
                        (stale.length > 2 ? " and " + (stale.length - 2) + " more" : "") +
                        ". Until they are refreshed the total above is an estimate.",
                  action: "Refresh", onAction: () => S.navigate("/sync") })
              : null,

            !principal
              ? h(Task, { tone: "good", glyph: "α",
                  title: u.usd(capacity, 0) + " of Alpha capacity is unspent",
                  body: authority + " private offerings sit inside that capacity and need no approval. " +
                        "Anything larger goes to the Principal as a proposal.",
                  action: "Browse offerings", onAction: () => S.navigate("/offerings") })
              : null,

            pending.length === 0 && st.synced && !short
              ? h("div", { className: "empty" }, "Nothing outstanding. The book is current.")
              : null)),

        /* --------------------------------------------------- right rail */
        h("div", { className: "col", style: { gap: 16 } },
          h(U.Card, {
            title: "Since the last sync",
            desc: u.fmtDate(st.syncedAt) + " · " + sinceSync + " days ago",
            right: h("button", { className: "link tiny", onClick: () => S.navigate("/sync") }, "History"),
          },
            h("div", { className: "kv" },
              h("dt", null, "Positions mapped"), h("dd", null, T.lastSync.mapped),
              h("dt", null, "Added"), h("dd", null, "+" + T.lastSync.added),
              h("dt", null, "Revalued"), h("dd", null, T.lastSync.revalued),
              h("dt", null, "Exceptions left open"), h("dd", null, T.lastSync.exceptions)),
            h("div", { className: "note mt" },
              T.lastSync.note || "Routine quarterly refresh."),
            !st.synced
              ? h(U.Btn, { kind: "pri", size: "sm", onClick: () => S.navigate("/sync"),
                           }, "Run this quarter's sync")
              : h(U.Pill, { tone: "good" }, "Synced today")),

          h(U.Card, { title: "Recent activity",
            right: h("button", { className: "link tiny", onClick: () => S.navigate("/activity") }, "All") },
            h("div", { className: "col", style: { gap: 13 } },
              st.activity.slice(0, 5).map((a) =>
                h("div", { key: a.id, className: "row", style: { alignItems: "flex-start", gap: 10 } },
                  h("span", { className: "dot", style: { marginTop: 6,
                    background: a.who === "principal" ? "var(--accent)" : "var(--s1)" } }),
                  h("div", { style: { flex: 1, minWidth: 0 } },
                    h("div", { style: { fontSize: 12.5, lineHeight: 1.45 } }, a.text),
                    h("div", { className: "tri tiny" },
                      D.accounts[a.who].name.split(" ").slice(-1)[0], " · ", u.fmtTs(a.ts))))))))));
  }

  T2.Today = Today;
})();
