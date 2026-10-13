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
              {/* Clearing every exception leaves nothing to look at here, so carry on to the anchor. */}
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
    /* Two questions at onboarding: how much of the net worth the anchor
       carries, and what it is asked to earn. Conviction is the leftover and
       is never asked for. The basket behind the target is built, not chosen. */
    const [pctA, setPctA] = useState(st.anchorPct);
    const [yld, setYld] = useState(st.targetYield);
    const sel = 100 - pctA;
    const answered = D.survey.filter((q) => st.survey[q.id] !== undefined).length;
    const postureOf = (v) => {
      const k = Object.keys(D.bucketPresets).find((k2) => D.bucketPresets[k2] === v);
      return (k && D.mandates.find((x) => x.key === k)) || null;
    };
    const m = postureOf(sel);
    const t = u.total(st.positions);
    const built = u.buildAnchor((pctA / 100) * t, yld, st.cashFloor);
    const selLabel = pctA + "% anchor at " + yld.toFixed(1) + "%";
    const lad = u.anchorLadder(st.positions, null);
    const themeRows = u.byTheme(st.positions, st.themes);
    const listed = st.positions.filter(u.isListed).length;

    return (
      <div className="wrap page" style={{ maxWidth: 1180 }}>
        <Steps at="mandate" />
        {/* the authority note stays — it explains why the cards are locked for this account */}
        {st.account === "successor" && (
          <div className="sub mt8" style={{ maxWidth: "74ch" }}>
            <b>The Principal settles this one</b> — you can move the dial to see what it implies, but setting it is theirs.
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
              The anchor is drawn against this, and the shelf is priced for a book this size.
            </div>
          </div>

          {/* Two questions, asked once. The basket behind the target is built
              for it — a first customer never picks a fund. END-STATE. */}
          <div className="panel">
            <div className="panel-hd">
              <div>
                <h3>How much of this is the anchor, and what should it earn?</h3>
                <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>
                  Whatever the anchor does not take becomes the conviction sleeve.
                </div>
              </div>
              <span className="tri" style={{ fontSize: 11 }}>{selLabel}</span>
            </div>

            <div className="splitlever" style={{ borderBottom: "1px solid var(--g3)" }}>
              <div className="sl-hd">
                <div className="lbl">1 · In the anchor</div>
                <div className="sl-read"><span className="sl-a num">{pctA}</span><span className="sl-sep">%</span></div>
                <div className="sl-leg">
                  <span><i style={{ background: "#1B2A4A" }} />Anchor {u.usdC((pctA / 100) * t)}</span>
                  <span><i style={{ background: "#9A7B2E" }} />Conviction {u.usdC((sel / 100) * t)} · the rest</span>
                </div>
              </div>
              <div className="sl-track">
                <div className="sl-chips">
                  {[50, 70, 80, 90, 100].map((v) => {
                    const f2 = (v - 40) / 60;
                    return (
                      <button key={v} onClick={() => setPctA(v)} className={pctA === v ? "on" : ""}
                        style={{ left: "calc(" + (f2 * 100) + "% + " + ((0.5 - f2) * 16).toFixed(1) + "px)" }}>{v}%</button>
                    );
                  })}
                </div>
                <input type="range" min="40" max="100" step="1" value={pctA}
                  onChange={(e) => setPctA(+e.target.value)} />
              </div>
            </div>

            <div className="splitlever" style={{ borderBottom: 0 }}>
              <div className="sl-hd">
                <div className="lbl">2 · Target yield</div>
                <div className="sl-read"><span className="sl-a num">{yld.toFixed(1)}</span><span className="sl-sep">%</span></div>
                <div className="sl-leg"><span>built from <b>{built.rows.length}</b> {built.rows.length === 1 ? "fund" : "funds"} plus the cash reserve</span></div>
              </div>
              <div className="sl-track">
                <div className="sl-chips">
                  {[4, 6, 8, 10, 12].map((v) => {
                    const f2 = (v - D.SHELF_FLOOR) / (D.SHELF_CEIL - D.SHELF_FLOOR);
                    return (
                      <button key={v} onClick={() => setYld(v)} className={Math.abs(yld - v) < 0.05 ? "on" : ""}
                        style={{ left: "calc(" + (f2 * 100) + "% + " + ((0.5 - f2) * 16).toFixed(1) + "px)" }}>{v}%</button>
                    );
                  })}
                </div>
                <input type="range" min={D.SHELF_FLOOR * 10} max={D.SHELF_CEIL * 10} step="1" value={Math.round(yld * 10)}
                  onChange={(e) => setYld(+e.target.value / 10)} />
              </div>
              <div className="sl-inside tri">
                {u.usdC(built.cash)} always stays in the cash reserve at {u.pct(D.cashFund.yield)}, so the
                other {u.usdC(built.rest)} has to earn <b>{u.pct(built.needed)}</b>.
              </div>
              <div className="lever-note">
                <span style={{ flex: 1 }}>
                  {m ? <><b>{m.label}</b> — {m.line}</>
                     : <>A setting of the family's own. The basket is built for it; no fund is picked by hand.</>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* and what conviction is pointed at */}
        <div className="panel mt16">
          <div className="panel-hd">
            <div>
              <h3>What do you want a view on?</h3>
              <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>
                Picking an exposure does not buy anything. It tells the marketplace what to rank first.
              </div>
            </div>
            <span className="tri" style={{ fontSize: 11 }}>{st.themes.length} picked</span>
          </div>
          <div className="panel-bd">
            <div className="themes">
              {themeRows.filter((th) => !th.fixed).map((th) => {
                const on = st.themes.indexOf(th.key) >= 0;
                return (
                  <button key={th.key} className={"th" + (on ? " on" : "") + (th.count ? " held" : "")}
                    onClick={() => S.actions.toggleTheme(th.key)} title={th.note}>
                    <span className="th-hd">
                      <i style={{ background: th.color, opacity: on ? 1 : .3 }} />
                      <span className="th-n">{th.label}</span>
                      {th.flagged && <span className="bdg plain">open question</span>}
                    </span>
                    <span className="th-v num">
                      {th.count ? u.pct(th.wt) + " already held" : (on ? "picked, nothing held" : "not picked")}
                    </span>
                    <span className="th-note tri">{th.note}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid mt16" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="panel">
            <div className="panel-hd"><h3>What that asks of the book</h3>
              <span className="tri" style={{ fontSize: 11 }}>{selLabel}</span></div>
            <div className="panel-bd tight">
              <table className="t">
                <thead><tr><th>Bucket</th><th className="n">Asked for</th><th className="n">Today</th><th className="n">Gap</th></tr></thead>
                <tbody>
                  {u.byBucket(st.positions, sel).map((b) => (
                    <tr key={b.key}>
                      <td>
                        <span className="legend" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                          <i className="sw" style={{ width: 9, height: 9, display: "inline-block", background: b.color }} />{b.label}
                        </span>
                        <div className="tsub">{b.key === "engine" ? "targeting " + yld.toFixed(1) + "% across " + (built.rows.length + 1) + " funds" : "whatever the anchor does not take"}</div>
                      </td>
                      <td className="n num">{u.pct(b.target)}</td>
                      <td className="n num">{u.pct(b.wt)}</td>
                      <td className="n tri num">{u.pp(b.wt - b.target)}</td>
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
                  The anchor setting is enough to start.
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
          <GrowthFan positions={st.positions} modelClasses={u.modelFour(yld, sel)}
            modelLabel={selLabel} collapsible assumptions={false} />
        </div>

        <div className="btn-row mt16">
          <Lock>
            <button className="btn p lg" onClick={() => { S.actions.setAnchorPct(pctA); S.actions.setTargetYield(yld); S.actions.commitSplit(); S.navigate("/portfolio"); }}>
              Confirm and open the portfolio →
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
