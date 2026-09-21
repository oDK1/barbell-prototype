/* /onboarding/* — Excel ingestion, reconciliation, mandate. */
(function () {
  const { useState, useEffect, useRef } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Money, Panel, Amount, Dropzone, FileRow, ModeStrip, AccountCards, Steps, Lock } = BB.ui;
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
        <AccountCards />
        <div className="mt24" />
        <Steps at="upload" />
        <h1>Bring the spreadsheets in</h1>
        <div className="sub mt8" style={{ maxWidth: "72ch" }}>
          {files.length} {files.length === 1 ? "file is" : "files are"} staged. Drop more if you have them — format
          and language do not matter.
        </div>

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
                Three rows could not be resolved without a decision from you: an unmatched ticker, a position counted
                twice across two files, and an amount with no currency on it.</>
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
                ? <Lock sleeve="core"><button className="btn" onClick={() => S.actions.unresolveException(e.id)}>Reopen</button></Lock>
                : <Lock sleeve="core"><button className="btn p" onClick={() => onResolve(e.id, v)}>Apply</button></Lock>}
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
        <ModeStrip />
        <Steps at="reconcile" />
        <div className="between">
          <div>
            <h1>Review the extraction</h1>
            <div className="sub mt8">Every row carries its source file and cell. Nothing is booked until the exceptions are cleared.</div>
          </div>
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
          <button className="btn p lg" disabled={open.length > 0} onClick={() => S.navigate("/onboarding/mandate")}>
            {open.length ? open.length + " exceptions remaining" : "Set the mandate →"}
          </button>
          <button className="btn lg" onClick={() => S.navigate("/onboarding/upload")}>Back</button>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------- 3. mandate */
  function Mandate() {
    const st = S.useStore();
    const [sel, setSel] = useState(st.mandate);
    const [refine, setRefine] = useState(false);
    const m = D.mandates.find((x) => x.key === sel);

    return (
      <div className="wrap page" style={{ maxWidth: 1180 }}>
        <ModeStrip />
        <Steps at="mandate" />
        <h1>Set the posture</h1>
        <div className="sub mt8" style={{ maxWidth: "74ch" }}>
          This sets the Core/Alpha split and the target allocation the model is drawn against. It is the reference the rest
          of the product reads from — not a trading trigger.
          {st.account === "successor" && <> <b>The Principal confirms it</b>; this account can read the postures but not
          adopt one.</>}
        </div>

        <div className="grid mt16" style={{ gridTemplateColumns: "repeat(" + D.mandates.length + ", 1fr)" }}>
          {D.mandates.map((x) => (
            <button key={x.key} className="panel" onClick={() => setSel(x.key)}
              style={{ textAlign: "left", cursor: "pointer", padding: 14, borderColor: sel === x.key ? "var(--navy)" : "var(--g3)", background: sel === x.key ? "var(--navy-wash)" : "var(--paper)" }}>
              <div className="between">
                <h2>{x.label}</h2>
                {sel === x.key && <span className="bdg hanwha"><i className="pt" />Selected</span>}
              </div>
              <div className="num mt8" style={{ fontSize: 18, fontWeight: 600 }}>{x.core}/{x.alpha}</div>
              <div className="tri" style={{ fontSize: 11 }}>Core / Alpha</div>
              <div className="sub mt8" style={{ fontSize: 12, lineHeight: 1.5 }}>{x.line}</div>
            </button>
          ))}
        </div>

        <div className="grid mt16" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="panel">
            <div className="panel-hd"><h3>Implied target allocation</h3><span className="tri" style={{ fontSize: 11 }}>{m.label}</span></div>
            <div className="panel-bd tight">
              <table className="t">
                <thead><tr><th>Asset class</th><th className="n">Target</th><th className="n">Current</th><th className="n">vs target</th></tr></thead>
                <tbody>
                  {u.byClass(st.positions).map((c) => {
                    const tgt = m.targets[c.key];
                    return (
                      <tr key={c.key}>
                        <td><span className={"legend"} style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                          <i className={"sw " + c.sw} style={{ width: 9, height: 9, display: "inline-block" }} />{c.label}</span></td>
                        <td className="n num">{u.pct(tgt)}</td>
                        <td className="n num">{u.pct(c.wt)}</td>
                        <td className="n tri num">{((c.wt - tgt) > 0 ? "+" : "−") + Math.abs(c.wt - tgt).toFixed(1) + "pp"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <div className="panel-hd">
              <h3>Refine this</h3>
              <button className="link" onClick={() => setRefine(!refine)}>{refine ? "Collapse" : "Refine this →"}</button>
            </div>
            <div className="panel-bd">
              {!refine ? (
                <div className="sub" style={{ fontSize: 12.5, lineHeight: 1.7 }}>
                  Eight questions — liquidity needs, known capital calls, concentration in the operating company, FX base,
                  tax residency, drawdown tolerance in dollars, transfer horizon, prohibited sectors. Optional, but the
                  answers sharpen the fit scores in the marketplace and the liquidity runway.
                </div>
              ) : (
                <div className="grid" style={{ gap: 12 }}>
                  {D.survey.map((q) => (
                    <div key={q.id}>
                      <label className="f">
                        <span>{q.q}</span>
                        {q.type === "select" ? (
                          <select value={st.survey[q.id] !== undefined ? st.survey[q.id] : q.a}
                            onChange={(e) => S.actions.setSurvey(q.id, e.target.value)}>
                            {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <div className="btn-row">
                            {q.options.map((o) => {
                              const cur = st.survey[q.id] || q.a;
                              const on = cur.indexOf(o) >= 0;
                              return (
                                <button key={o} className={"btn sm" + (on ? " p" : "")}
                                  onClick={() => S.actions.setSurvey(q.id, on ? cur.filter((x) => x !== o) : cur.concat([o]))}>{o}</button>
                              );
                            })}
                          </div>
                        )}
                      </label>
                      {q.note && <div className="tri" style={{ fontSize: 11, marginTop: 3 }}>{q.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="btn-row mt16">
          <Lock sleeve="core">
            <button className="btn p lg" onClick={() => { S.actions.setMandate(sel); S.navigate("/portfolio"); }}>
              Confirm mandate and open the portfolio →
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
