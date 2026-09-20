/* =============================================================================
   Take 2 — Sync (the Excel spine).

   In take 1 the spreadsheet ingestion is onboarding: a one-time gate you pass
   through on the way to the portfolio. Here it is a standing part of the
   product with its own place in the navigation, because a family office's
   book does not stop being a spreadsheet problem after the first upload. The
   same seven reconciliation exceptions are reused verbatim; what changes is
   the framing — a recurring diff against last quarter rather than a setup step.
   ============================================================================= */
(function () {
  const D = BB.data, u = BB.u, U = T2.ui, S = T2.store, T = T2.data;
  const h = U.h;

  function Steps({ phase }) {
    const order = ["drop", "extract", "resolve", "apply"];
    const labels = { drop: "Files", extract: "Extraction", resolve: "Exceptions", apply: "Apply" };
    const at = order.indexOf(phase);
    return h("div", { className: "row", style: { gap: 0, marginBottom: 20 } },
      order.map((k, i) =>
        h(React.Fragment, { key: k },
          h("div", { className: "row", style: { gap: 8 } },
            h("div", { style: {
              width: 24, height: 24, borderRadius: 999, display: "grid", placeItems: "center",
              fontSize: 11, fontWeight: 700,
              background: i <= at ? "var(--accent)" : "var(--line-2)",
              color: i <= at ? "#fff" : "var(--muted)" } }, i < at ? "✓" : i + 1),
            h("span", { style: { fontWeight: i === at ? 600 : 500,
                                 color: i === at ? "var(--ink)" : "var(--muted)" } }, labels[k])),
          i < 3 ? h("div", { style: { flex: 1, height: 1, background: "var(--line)", margin: "0 14px" } }) : null)));
  }

  function Extracting({ onDone }) {
    const [i, setI] = React.useState(0);
    React.useEffect(() => {
      if (i >= D.ingestSteps.length) { const t = setTimeout(onDone, 380); return () => clearTimeout(t); }
      const t = setTimeout(() => setI(i + 1), 620);
      return () => clearTimeout(t);
    }, [i]);
    return h(U.Card, { title: "Reading the files" },
      h("div", { className: "col", style: { gap: 13 } }, D.ingestSteps.map((s, n) =>
        h("div", { key: s },
          h("div", { className: "row mb-s" },
            h("span", { style: { color: n < i ? "var(--ink)" : "var(--muted)",
                                 fontWeight: n === i ? 600 : 400 } }, s),
            h("div", { className: "gap" }),
            h("span", { className: "tri tiny" }, n < i ? "done" : n === i ? "working" : "")),
          h(U.Meter, { pct: n < i ? 100 : n === i ? 55 : 0 })))),
      h("div", { className: "note mt" },
        "Positions are matched against the security master first, then the reconciled book is checked ",
        "against the capital-call schedule. Anything the matcher is not confident about becomes an exception ",
        "rather than a silent guess."));
  }

  function ExceptionCard({ e, value, onChange }) {
    const done = value !== undefined && value !== "";
    return h("div", { className: "card", style: { padding: 16,
        borderColor: done ? "var(--line)" : "var(--accent-line)" } },
      h("div", { className: "row mb-s" },
        h(U.Pill, { tone: done ? "good" : "warn" }, done ? "Resolved" : e.kind),
        h("div", { className: "gap" }),
        h("span", { className: "tri tiny" }, Math.round(e.conf * 100), "% confidence")),
      h("div", { className: "mono tiny", style: { fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
        background: "var(--card-2)", border: "1px solid var(--line-2)", borderRadius: 8,
        padding: "8px 10px", margin: "4px 0 10px", color: "var(--ink-2)" } },
        e.file, " · ", e.cell, h("br"),
        h("span", { style: { color: "var(--ink)" } }, e.raw),
        e.qty && e.qty !== "—" ? h("span", { className: "tri" }, "   qty ", e.qty) : null),
      h("div", { className: "task-s mb-s" }, e.issue),
      e.type === "select"
        ? h("div", { className: "col", style: { gap: 6 } }, e.options.map((o) =>
            h("button", { key: o,
              className: "btn " + (value === o ? "pri" : ""),
              style: { justifyContent: "flex-start", textAlign: "left", fontWeight: value === o ? 600 : 500 },
              onClick: () => onChange(o) }, o)))
        : h("div", { className: "row" },
            h(U.MoneyInput, { value: Number(String(value || "").replace(/[^0-9]/g, "")) || 0,
              onChange: (n) => onChange(String(n)), width: 180 }),
            h("button", { className: "link tiny", onClick: () => onChange(e.suggestion) },
              "Use the registry figure — $", e.suggestion)));
  }

  function DiffPreview() {
    const d = T.pending.diff;
    const Row = ({ tone, label, name, detail, value }) =>
      h("div", { className: "row", style: { padding: "9px 0", borderBottom: "1px solid var(--line-2)" } },
        h(U.Pill, { tone }, label),
        h("div", { style: { flex: 1, minWidth: 0 } },
          h("div", { style: { fontSize: 12.5, fontWeight: 500 } }, name),
          h("div", { className: "tri tiny" }, detail)),
        h("div", { className: "tnum strong" }, value));
    return h("div", null,
      d.added.map((a) => h(Row, { key: a.name, tone: "good", label: "New", name: a.name,
        detail: u.clsLabel(a.cls) + " · from " + a.src, value: "+" + u.usd(a.value, 0) })),
      d.revalued.map((r) => h(Row, { key: r.name, tone: "accent", label: "Revalued", name: r.name,
        detail: u.usd(r.from, 0) + " → " + u.usd(r.to, 0) + " · from " + r.src,
        value: u.sgnUsd(r.to - r.from) })),
      d.removed.map((r) => h(Row, { key: r.name, tone: "crit", label: "Gone", name: r.name,
        detail: r.why, value: "−" + u.usd(r.value, 0) })),
      d.calls.map((c) => h(Row, { key: c.fund, tone: "warn", label: "New call", name: c.fund,
        detail: "Due " + u.fmtDate(c.date), value: u.usd(c.amount, 0) })));
  }

  function Sync() {
    const st = S.useStore();
    const [phase, setPhase] = React.useState(st.synced ? "apply" : "drop");
    const [answers, setAnswers] = React.useState({});
    const open = D.exceptions.filter((e) => !answers[e.id]);

    const history = h(U.Card, { title: "Sync history", desc: "Every time this book has been rebuilt from source" },
      h("div", { className: "timeline" },
        (st.synced
          ? [{ id: "now", date: D.TODAY, files: 3, mapped: st.positions.length,
               added: T.pending.diff.added.length, revalued: T.pending.diff.revalued.length,
               removed: T.pending.diff.removed.length, exceptions: 0, by: S.me().name,
               note: "This session." }]
          : []).concat(T.syncs).map((s, i) =>
          h("div", { key: s.id, className: "tl-i" + (i === 0 ? " now" : "") },
            h("div", { className: "tl-dot" }),
            h("div", { className: "row" },
              h("span", { className: "strong" }, u.fmtDate(s.date)),
              h("div", { className: "gap" }),
              h("span", { className: "tri tiny" }, s.by)),
            h("div", { className: "tri tiny" },
              s.files, " files · ", s.mapped, " positions · +", s.added, " added · ",
              s.revalued, " revalued",
              s.exceptions ? " · " + s.exceptions + " left open" : ""),
            s.note ? h("div", { className: "tri tiny", style: { marginTop: 3, fontStyle: "italic" } }, s.note) : null))));

    /* ------------------------------------------------------------ applied */
    if (st.synced && phase === "apply") {
      return h("div", { className: "page" },
        h("div", { className: "page-head" },
          h("h1", null, "The book is current"),
          h("div", { className: "tri" }, "Rebuilt from three spreadsheets, ", u.fmtDate(D.TODAY))),
        h("div", { className: "grid g-2-1" },
          h("div", { className: "col", style: { gap: 16 } },
            h(U.Card, { title: "What changed",
              right: h(U.Btn, { size: "sm", kind: "pri", onClick: () => S.navigate("/book") }, "Open the book") },
              h(DiffPreview)),
            h("div", { className: "note accent" },
              h("span", { className: "strong" }, "Nothing here needed a human to retype it. "),
              "Seven ambiguities were raised rather than guessed, you answered them once, and the ",
              "answers are remembered for next quarter — the same ticker, the same currency column, ",
              "the same duplicate will not be asked again.")),
          history));
    }

    /* ------------------------------------------------------------- flow */
    return h("div", { className: "page" },
      h("div", { className: "page-head" },
        h("h1", null, "Sync"),
        h("div", { className: "tri" },
          "The book was last rebuilt on ", u.fmtDate(st.syncedAt), " — ", u.days(st.syncedAt),
          " days ago. Three files are staged.")),

      h(Steps, { phase }),

      h("div", { className: "grid g-2-1" },
        h("div", { className: "col", style: { gap: 16 } },

          phase === "drop" ? h(React.Fragment, null,
            h("div", { className: "drop", onClick: () => setPhase("extract") },
              h("div", { style: { fontSize: 15, fontWeight: 600, color: "var(--accent)" } },
                "Drop this quarter's spreadsheets"),
              h("div", { className: "tri mini mt-s" },
                "xlsx · xls · csv · numbers · PDF statements · 아무 형식이나 괜찮습니다"),
              h("div", { className: "tri tiny mt-s" }, "Format does not matter. Headers do not matter.")),
            h(U.Card, { title: "Staged by the family CFO", desc: "Dropped " + u.days(st.syncedAt) + " days ago" },
              T.pending.staged.map((f) =>
                h("div", { key: f.id, className: "file" },
                  h("div", { className: "file-ico" }, "XLS"),
                  h("div", { style: { flex: 1 } },
                    h("div", { className: "strong" }, f.name),
                    h("div", { className: "tri tiny" }, f.size, " · ", f.sheets, " sheets · ",
                      f.rows, " rows · ", f.note)),
                  h(U.Pill, { tone: "good" }, "Ready"))),
              h("div", { className: "mt" },
                h(U.Btn, { kind: "pri", onClick: () => setPhase("extract") }, "Read the files")))
          ) : null,

          phase === "extract" ? h(Extracting, { onDone: () => setPhase("resolve") }) : null,

          phase === "resolve" ? h(React.Fragment, null,
            h(U.Card, { title: "42 of 49 rows mapped cleanly",
              desc: "Seven need a decision — the matcher will not guess on these",
              right: h(U.Pill, { tone: open.length ? "warn" : "good" },
                open.length ? open.length + " open" : "All resolved") },
              h(U.Meter, { pct: ((D.exceptions.length - open.length) / D.exceptions.length) * 100 }),
              h("div", { className: "tri tiny mt-s" },
                D.exceptions.length - open.length, " of ", D.exceptions.length, " resolved")),
            D.exceptions.map((e) =>
              h(ExceptionCard, { key: e.id, e, value: answers[e.id],
                onChange: (v) => setAnswers(Object.assign({}, answers, { [e.id]: v })) })),
            h("div", { className: "card card-p" },
              h("div", { className: "row" },
                h("div", null,
                  h("div", { className: "strong" }, open.length
                    ? open.length + " exceptions still open"
                    : "Ready to apply"),
                  h("div", { className: "tri mini" }, open.length
                    ? "The book will not update while an ambiguity is unresolved."
                    : "The diff below is what will change.")),
                h("div", { className: "gap" }),
                h(U.Btn, { size: "sm", onClick: () => {
                  const all = {}; D.exceptions.forEach((e) => (all[e.id] = e.answer));
                  setAnswers(all);
                } }, "Accept every suggestion"),
                h(U.Btn, { kind: "pri", disabled: open.length > 0,
                  onClick: () => { S.actions.runSync(); setPhase("apply"); } },
                  "Apply to the book")))
          ) : null),

        h("div", { className: "col", style: { gap: 16 } },
          phase === "resolve"
            ? h(U.Card, { title: "What this will change",
                desc: "Against the " + u.fmtDate(st.syncedAt) + " book" },
                h(DiffPreview))
            : null,
          history,
          h("div", { className: "note" },
            h("span", { className: "strong" }, "Why this lives in the navigation. "),
            "A family office's positions arrive as email attachments from four custodians, two fund ",
            "administrators and a family CFO's own workbook. Treating that as a one-time import is what ",
            "sends the book back to Excel three months later."))));
  }

  T2.Sync = Sync;
})();
