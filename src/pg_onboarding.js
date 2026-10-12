/* /onboarding/* — Excel ingestion, reconciliation, mandate. */
(function () {
  const { useState, useEffect, useRef } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Money, Panel, Amount, Dropzone, FileRow, Steps, Lock, GrowthFan } = BB.ui;
  const { Agent } = BB.agent;

  const STEP_MS = 750;

  /* ------------------------------------------------------------ 1. upload */
  function Upload() {
    const st = S.useStore();
    const files = st.uploads;
    const [step, setStep] = useState(st.ingestDone ? D.ingestSteps.length : -1);

    useEffect(() => {
      if (st.ingestDone) return;
      let i = 0;
      setStep(0);
      const t = setInterval(() => {
        i += 1;
        if (i >= D.ingestSteps.length) { clearInterval(t); setStep(D.ingestSteps.length); S.actions.setIngestDone(true); }
        else setStep(i);
      }, STEP_MS);
      return () => clearInterval(t);
    }, []);

    const done = step >= D.ingestSteps.length;

    return (
      <div className="wrap page" style={{ maxWidth: 1080 }}>
        <Steps at="upload" />
        <Dropzone onFiles={(f) => S.actions.addUploads(f)}
          title="Drop your portfolio spreadsheets. Any format."
          hint=".xlsx · .xls · .csv · .numbers · PDF statements · 한글 파일명 지원" />

        <div className="filelist mt16">
          {files.map((f) => (
            <FileRow key={f.id} f={f}
              state={done ? "Reconciled" : step < 0 ? "Queued" : D.ingestSteps[Math.min(step, D.ingestSteps.length - 1)]}
              pct={done ? 100 : Math.max(0, ((step + 1) / D.ingestSteps.length) * 100)} />
          ))}
        </div>

        <div className="mt16">
          <Agent where="Ingestion"
            why={["3 files · 9 sheets · 126 rows read",
                  "Security master matched on ticker, ISIN and name similarity",
                  "Capital call schedules cross-referenced against fund names",
                  "Duplicate detection across files on name, value and date"]}>
            {done
              ? <>Extraction complete. <b>45 rows read · 42 positions mapped · {D.exceptions.length} need review.</b>{" "}
                Two rows could not be resolved without a decision from you: a position counted twice across two
                files, and an amount with no currency on it.</>
              : <>Reading the files. Positions are matched against the security master, then reconciled against the capital
                call schedule.</>}
          </Agent>
        </div>

        <div className="btn-row mt16">
          <button className="btn p lg" disabled={!done} onClick={() => S.navigate("/onboarding/reconcile")}>
            Review extraction →
          </button>
          <button className="btn lg" onClick={() => S.navigate("/")}>Back</button>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------- 2. reconcile */
  function ExceptionRow({ e, onResolve }) {
    const [v, setV] = useState(e.value);
    return (
      <div className="panel mb12" style={{ borderLeft: "2px solid " + (e.resolved ? "var(--pos)" : "var(--amber)") }}>
        <div className="panel-hd">
          <div>
            <div className="between" style={{ gap: 10, justifyContent: "flex-start" }}>
              <span className={"bdg " + (e.resolved ? "live" : "self warn")}><i className="pt" />{e.resolved ? "Resolved" : e.kind}</span>
              <span className="mono tri">{e.file} · {e.cell}</span>
            </div>
            <div className="mono mt8" style={{ fontSize: 12.5, color: "var(--ink)" }}>{e.raw}</div>
          </div>
          <div className="right">
            <div className="lbl">Confidence</div>
            <div className="num" style={{ fontWeight: 600, color: "var(--amber)" }}>{Math.round(e.conf * 100)}%</div>
          </div>
        </div>
        <div className="panel-bd">
          <div className="sub" style={{ fontSize: 12.5 }}>{e.issue}</div>
          <div className="row mt12" style={{ alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label className="f">
                <span>Resolution</span>
                {e.type === "select" ? (
                  <select value={v} onChange={(ev) => setV(ev.target.value)} disabled={e.resolved}>
                    {e.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type="text" value={v} disabled={e.resolved} onChange={(ev) => setV(ev.target.value)} placeholder={e.placeholder} />
                )}
              </label>
            </div>
            <div className="btn-row">
              {e.resolved
                ? <Lock><button className="btn" onClick={() => S.actions.unresolveException(e.id)}>Reopen</button></Lock>
                : <Lock><button className="btn p" onClick={() => onResolve(e.id, v)}>Apply</button></Lock>}
            </div>
          </div>
          {e.suggestion && !e.resolved && <div className="tri mt8" style={{ fontSize: 11.5 }}>Agent suggestion pre-filled from the registry record.</div>}
        </div>
      </div>
    );
  }

  function Reconcile() {
    const st = S.useStore();
    const open = st.exceptions.filter((e) => !e.resolved);
    const mapped = D.positions;

    return (
      <div className="wrap page">
        <Steps at="reconcile" />
        <div className="between">
          <div />
          <div className="right">
            <div className="stat-l">Status</div>
            <div className="stat-v sm">
              <span className="num">{mapped.length}</span> positions mapped ·{" "}
              <span className="num" style={{ color: open.length ? "var(--amber)" : "var(--pos)" }}>{open.length}</span> need review
            </div>
          </div>
        </div>

        {open.length > 0 && (
          <div className="note warn mt16">
            <b>{open.length} {open.length === 1 ? "exception requires" : "exceptions require"} a decision{st.account === "successor" ? " from the Principal" : ""}.</b>{" "}
            Everything else mapped cleanly. These are the rows the agent could not resolve on its own — clear them to
            continue, because an unresolved exception is the difference between a reconciled book and a spreadsheet.
          </div>
        )}

        <h2 className="mt24 mb12">Exceptions</h2>
        {st.exceptions.map((e) => (
          <ExceptionRow key={e.id} e={e} onResolve={(id, v) => S.actions.resolveException(id, v)} />
        ))}

        <div className="btn-row mt16">
          {open.length > 0 && (
            <Lock>
              {/* Clearing every exception leaves nothing to look at here, so carry on to the split. */}
              <button className="btn p lg"
                onClick={() => { S.actions.resolveAllExceptions(); S.navigate("/onboarding/mandate"); }}>
                Apply all {open.length} {open.length === 1 ? "suggestion" : "suggestions"} →
              </button>
            </Lock>
          )}
          <button className={"btn lg" + (open.length ? "" : " p")} disabled={open.length > 0}
            onClick={() => S.navigate("/onboarding/mandate")}>
            {open.length ? open.length + " to clear first" : "Set the mandate →"}
          </button>
          <button className="btn lg" onClick={() => S.navigate("/onboarding/upload")}>Back</button>
          {open.length > 0 && (
            <span className="tri" style={{ fontSize: 11.5 }}>
              Each row carries the agent's suggestion — apply them together, or change any of them above first.
            </span>
          )}
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------- 3. mandate */
  function Mandate() {
    const st = S.useStore();
    /* DW [D]: the objective is one Engine / Conviction split, not a choice
       between three published portfolios. The postures survive as named
       points on the control — they are the family's own 95/5, 90/10, 80/20. */
    const [sel, setSel] = useState(st.split);
    const answered = D.survey.filter((q) => st.survey[q.id] !== undefined).length;
    const postureOf = (v) => {
      const k = Object.keys(D.bucketPresets).find((k2) => D.bucketPresets[k2] === v);
      return (k && D.mandates.find((x) => x.key === k)) || null;
    };
    const m = postureOf(sel);
    const selLabel = m ? m.label : "Engine " + (100 - sel) + " / Conviction " + sel;
    const t = u.total(st.positions);
    const listed = st.positions.filter((x) => x.liq === "Daily").length;

    return (
      <div className="wrap page" style={{ maxWidth: 1180 }}>
        <Steps at="mandate" />
        {/* the authority note stays — it explains why the cards are locked for this account */}
        {st.account === "successor" && (
          <div className="sub mt8" style={{ maxWidth: "74ch" }}>
            <b>The Principal settles this one</b> — you can move the split to see what it implies, but setting it is theirs.
          </div>
        )}

        {/* what the three files turned into, stated beside the choice it governs */}
        <div className="grid mt16" style={{ gridTemplateColumns: "0.85fr 2fr" }}>
          <div className="panel" style={{ background: "var(--g4)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "14px 16px" }}>
            <div className="lbl">Reconciled book</div>
            <div className="num" style={{ fontSize: 27, fontWeight: 600, letterSpacing: "-.025em", marginTop: 4, lineHeight: 1.1 }}>
              {u.usdC(t)}
            </div>
            <div className="tri" style={{ fontSize: 11.5, marginTop: 4 }}>
              {st.positions.length} positions from {st.uploads.length} files
            </div>
            <div className="tri" style={{ fontSize: 11.5 }}>
              {listed} listed · {st.positions.length - listed} private
            </div>
            <hr className="hr" style={{ margin: "10px 0" }} />
            <div className="tri" style={{ fontSize: 11, lineHeight: 1.5 }}>
              The split applies to this, and the model is drawn for a book this size.
            </div>
          </div>

          {/* DW [D]: one question, asked once. END-STATE. */}
          <div className="panel">
            <div className="panel-hd">
              <div>
                <h3>How much of this is conviction?</h3>
                <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>
                  Engine compounds. Conviction is the part you choose yourself.
                </div>
              </div>
              <span className="tri" style={{ fontSize: 11 }}>{selLabel}</span>
            </div>
            <div className="splitlever" style={{ borderBottom: 0 }}>
              <div className="sl-hd">
                <div className="sl-read">
                  <span className="sl-a num">{100 - sel}</span>
                  <span className="sl-sep">/</span>
                  <span className="sl-b num">{sel}</span>
                </div>
                <div className="sl-leg">
                  <span><i style={{ background: "#1B2A4A" }} />Engine · {u.usdC(((100 - sel) / 100) * t)}</span>
                  <span><i style={{ background: "#9A7B2E" }} />Conviction · {u.usdC((sel / 100) * t)}</span>
                </div>
              </div>
              <div className="sl-track">
                <div className="sl-chips">
                  {[1, 5, 10, 20, 35].map((v) => {
                    const pm = postureOf(v);
                    return (
                      <button key={v} onClick={() => setSel(v)} className={sel === v ? "on" : ""}
                        title={pm ? pm.line : "Set the split to " + (100 - v) + " / " + v}
                        style={{ left: "calc(" + ((v / 40) * 100) + "% + " + ((0.5 - v / 40) * 16).toFixed(1) + "px)" }}>
                        {(100 - v) + " / " + v}
                      </button>
                    );
                  })}
                </div>
                <input type="range" min="0" max="40" step="1" value={sel}
                  onChange={(e) => setSel(+e.target.value)} />
              </div>
              <div className="lever-note">
                <span style={{ flex: 1 }}>
                  {m ? <><b>{m.label}</b> — {m.line}</>
                     : <>A split of the family's own. Nothing on the platform requires it to match a published posture.</>}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid mt16" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="panel">
            <div className="panel-hd"><h3>Implied target allocation</h3><span className="tri" style={{ fontSize: 11 }}>{selLabel}</span></div>
            <div className="panel-bd tight">
              <table className="t">
                <thead><tr><th>Asset class</th><th className="n">Target</th><th className="n">Current</th><th className="n">vs target</th></tr></thead>
                <tbody>
                  {u.holdingsSix(st.positions, sel).map((c) => (
                    <tr key={c.key} style={c.blocked ? { opacity: .5 } : null}>
                      <td>
                        <span className="legend" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                          <i className="sw" style={{ width: 9, height: 9, display: "inline-block", background: c.color }} />{c.label}
                        </span>
                      </td>
                      <td className="n num">{c.blocked ? "—" : u.pct(c.model)}</td>
                      <td className="n num">{u.pct(c.wt)}</td>
                      <td className="n tri num">{c.blocked ? "—" : u.pp(c.wt - c.model)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Beside the allocation it is answering to. Eight questions in a
              scroller: the first few are visible, the rest are a scroll away,
              and none of them gate the button below. */}
          <div className="panel">
            <div className="panel-hd">
              <div>
                <div className="row tight" style={{ alignItems: "center" }}>
                  <h3>Refine this</h3>
                  <span className="bdg plain">Optional</span>
                </div>
                <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>
                  The split is enough to start.
                </div>
              </div>
              <div className="right" style={{ whiteSpace: "nowrap" }}>
                <div className="tri num" style={{ fontSize: 11.5 }}>{answered} of {D.survey.length}</div>
                {answered > 0
                  ? <button className="link g" onClick={() => S.actions.clearSurvey()}>Clear</button>
                  : <button className="link" onClick={() => S.actions.fillSurvey()}>Use answers on file</button>}
              </div>
            </div>
            <div className="qscroll">
              {D.survey.map((q, i) => {
                const val = st.survey[q.id];
                return (
                  <div key={q.id} className="qitem">
                    <label className="f">
                      <span><span className="tri">{i + 1} / {D.survey.length}</span>&nbsp;&nbsp;{q.q}</span>
                      {q.type === "select" ? (
                        <select value={val === undefined ? "" : val}
                          onChange={(e) => S.actions.setSurvey(q.id, e.target.value)}>
                          <option value="">Not answered</option>
                          {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <div className="btn-row">
                          {q.options.map((o) => {
                            const cur = val || [];
                            const on = cur.indexOf(o) >= 0;
                            return (
                              <button key={o} className={"btn sm" + (on ? " p" : "")}
                                onClick={() => S.actions.setSurvey(q.id, on ? cur.filter((x) => x !== o) : cur.concat([o]))}>{o}</button>
                            );
                          })}
                        </div>
                      )}
                    </label>
                    <div className="tri" style={{ fontSize: 11, marginTop: 4, opacity: val !== undefined ? 1 : .75 }}>
                      {q.sharpens}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="qfoot tri">
              {answered
                ? answered + " answered · the rest leave the product's defaults in place"
                : "Scroll for all " + D.survey.length + " · none of them are required"}
            </div>
          </div>
        </div>

        {/* what the chosen split would compound to, against the book as it stands */}
        <div className="panel mt16">
          <GrowthFan positions={st.positions} modelClasses={u.sixToFour(u.modelSix(t, sel).w)}
            modelLabel={selLabel} collapsible assumptions={false} />
        </div>

        <div className="btn-row mt16">
          <Lock>
            <button className="btn p lg" onClick={() => { S.actions.setSplit(sel); S.actions.commitSplit(); S.navigate("/portfolio"); }}>
              Confirm the split and open the portfolio →
            </button>
          </Lock>
          <button className="btn lg" onClick={() => S.navigate("/onboarding/reconcile")}>Back</button>
        </div>
      </div>
    );
  }

  BB.pages = BB.pages || {};
  BB.pages.Upload = Upload;
  BB.pages.Reconcile = Reconcile;
  BB.pages.Mandate = Mandate;
})();
