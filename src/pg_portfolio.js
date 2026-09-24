/* /portfolio — the core screen. Default landing for both accounts. */
(function () {
  const { useState } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Money, Delta, Panel, Tabs, Seg, MiniBar, ProvBadge, SleeveBadge, Modal, Lock } = BB.ui;
  const { Agent, runQuery } = BB.agent;

  /* Drift is context, not a verdict: grey, unsigned by colour, no urgency. */
  function VsTarget({ v }) {
    return <span className="tri num">{(v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1) + "pp"}</span>;
  }

  /* --------------------------------------------------------- query bar */
  /* Read-only natural language over the book. Floats at the foot of the
     portfolio so it is reachable from anywhere in a long page, and answers
     with a filtered table rather than prose. */
  function QueryBar({ positions }) {
    const [q, setQ] = useState("");
    const [res, setRes] = useState(null);
    const [focus, setFocus] = useState(false);
    const run = () => setRes(runQuery(q, positions));
    const t = u.total(positions);

    const results = res && (
          <div className="res">
            {res.rows.length === 0
              ? <div className="empty">No positions match {res.labels.join(" + ")}.</div>
              : (
                <>
                  <div className="reshd">
                    <div>{res.labels.map((l) => <span className="chip" key={l}>{l}</span>)}</div>
                    <div className="num" style={{ fontWeight: 600 }}>
                      {res.rows.length} positions · {u.usd(u.total(res.rows))} · {u.pct((u.total(res.rows) / t) * 100)} of assets
                    </div>
                  </div>
                  <table className="t dense">
                    <thead><tr><th>Position</th><th>Class</th><th>Provenance</th><th className="n">Value</th><th className="n">Weight</th></tr></thead>
                    <tbody>
                      {res.rows.map((p) => (
                        <tr key={p.id} className="clickable" onClick={() => S.navigate("/portfolio/" + p.cls + "?sub=" + p.sub)}>
                          <td><div className="tname">{p.name}</div><div className="tsub">{p.ticker || u.subLabel(p.sub)}</div></td>
                          <td>{u.clsLabel(p.cls)}</td>
                          <td><ProvBadge p={p} showDate={false} /></td>
                          <td className="n num">{u.usd(p.value)}</td>
                          <td className="n num">{u.pct((p.value / t) * 100)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
          </div>
    );

    return (
      <div className="askbar">
        {results}
        {!res && (focus || q) && (
          <div className="askhint">
            Read-only. Returns a filtered view of positions, never prose. Try “stale valuations”, “locked private
            positions”, “Korea equity”, “alpha sleeve”.
          </div>
        )}
        <div className="askrow">
          <span className="lbl" style={{ whiteSpace: "nowrap" }}>Ask the book</span>
          <div className="search" style={{ flex: 1 }}>
            <input type="text" value={q} placeholder="What's my exposure to US data centers?"
              onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
              onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} />
          </div>
          <button className="btn sm" onClick={run}>Filter</button>
          {res && <button className="btn sm q" onClick={() => { setRes(null); setQ(""); }}>Clear</button>}
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------- allocation tab */
  function AllocationTab({ positions }) {
    const [open, setOpen] = useState({});
    const cls = u.byClass(positions);
    const subs = u.bySub(positions);
    const t = u.total(positions);
    const worst = [...cls].sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))[0];
    const over = [...cls].sort((a, b) => b.drift - a.drift)[0];
    const short2 = subs.filter((s) => s.drift < 0).sort((a, b) => a.drift - b.drift).slice(0, 2);
    const mandateLabel = (D.mandates.find((m) => m.key === S.get().mandate) || D.mandates[1]).label;
    const t2 = u.total(positions);
    const model = u.modelWeights(t2, S.get().mandate);

    return (
      <>
        <div className="panel mt16">
          <div className="panel-hd">
            <h3>Holdings by class</h3>
            <span className="tri" style={{ fontSize: 11 }}>Click a class to expand · click a subcategory for positions</span>
          </div>
          <table className="t">
            <thead>
              <tr>
                <th style={{ width: 300 }}>Class / subcategory</th>
                <th className="n">Positions</th>
                <th style={{ width: 160 }}>Weight vs target</th>
                <th className="n">Current</th>
                <th className="n">Target</th>
                <th className="n">vs target</th>
                <th className="n">Value</th>
                <th className="n">Unrealised</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cls.map((c) => {
                const items = positions.filter((p) => p.cls === c.key);
                const un = u.unrealized(items);
                const isOpen = !!open[c.key];
                return (
                  <React.Fragment key={c.key}>
                    <tr className="clickable" onClick={() => setOpen({ ...open, [c.key]: !isOpen })}
                      style={{ background: isOpen ? "#FCFBF8" : undefined }}>
                      <td>
                        <span style={{ display: "inline-flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
                          <span style={{ width: 9, fontSize: 11, color: "var(--g1)" }}>{isOpen ? "▾" : "▸"}</span>
                          <i className={"sw " + c.sw} style={{ width: 9, height: 9, display: "inline-block" }} />
                          {c.label}
                        </span>
                      </td>
                      <td className="n num tri">{c.count}</td>
                      <td><MiniBar cur={c.wt} target={c.target} max={45} /></td>
                      <td className="n num">{u.pct(c.wt)}</td>
                      <td className="n num tri">{u.pct(c.target)}</td>
                      <td className="n"><VsTarget v={c.drift} /></td>
                      <td className="n"><Money v={c.value} /></td>
                      <td className="n"><Delta v={un} usd /></td>
                      <td className="right"><button className="btn sm" onClick={(e) => { e.stopPropagation(); S.navigate("/portfolio/" + c.key); }}>Open</button></td>
                    </tr>
                    {isOpen && subs.filter((s) => s.cls === c.key).map((s) => (
                      <tr key={s.key} className="clickable" onClick={() => S.navigate("/portfolio/" + c.key + "?sub=" + s.key)}>
                        <td style={{ paddingLeft: 34 }}>
                          <div className="tname">{s.label}</div>
                          {s.note && <div className="tsub">{s.note}</div>}
                        </td>
                        <td className="n num tri">{s.count}</td>
                        <td><MiniBar cur={s.wt} target={s.target} max={30} /></td>
                        <td className="n num">{u.pct(s.wt)}</td>
                        <td className="n num tri">{u.pct(s.target)}</td>
                        <td className="n"><VsTarget v={s.drift} /></td>
                        <td className="n num">{u.usd(s.value)}</td>
                        <td className="n"><Delta v={u.unrealized(positions.filter((p) => p.sub === s.key))} usd /></td>
                        <td></td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td><td className="n num">{positions.length}</td><td></td>
                <td className="n num">100.0%</td><td className="n num tri">100.0%</td><td></td>
                <td className="n"><Money v={t} /></td>
                <td className="n"><Delta v={u.unrealized(positions)} usd /></td><td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <QueryBar positions={positions} />

        <ModelPanel positions={positions} />
        <ProvenancePanel positions={positions} />
        <AllPositions positions={positions} />
      </>
    );
  }

  /* --------------------------------------------------- model portfolio */
  /* Compact by design: the objective and the size at the top, then one row per
     class showing what is held against what the model suggests, then a single
     line on alternatives. The bar is the graphic — filled is held today, the
     tick is the model. */
  function ModelPanel({ positions }) {
    const st = S.useStore();
    const t = u.total(positions);
    const [aum, setAum] = useState(t);
    const [goal, setGoal] = useState(st.mandate);
    React.useEffect(() => { setGoal(st.mandate); }, [st.mandate]);
    const [open, setOpen] = useState({});
    const [path, setPath] = useState(false);
    const whatIf = goal !== st.mandate;

    const MAXX = 150;
    const pos = (a) => Math.log(Math.max(a, 1e6) / 1e6) / Math.log(MAXX);
    const fromPos = (v) => 1e6 * Math.pow(MAXX, v);
    const short = (a) => a % 1e6 === 0 ? "$" + (a / 1e6) + "M" : u.usdC(a);

    const model = u.modelWeights(aum, goal);
    const mandate = D.mandates.find((x) => x.key === st.mandate) || D.mandates[1];
    const selected = D.mandates.find((x) => x.key === goal) || mandate;
    const confirmed = st.activity.find((a) => a.kind === "Mandate");
    const atToday = Math.abs(aum - t) < 1e5;
    const cls = u.byClass(positions);
    const subs = u.bySub(positions);
    const clsRows = cls.map((c) => ({
      ...c, model: model.classes[c.key], delta: model.classes[c.key] - c.wt,
      kids: subs.filter((sb) => sb.cls === c.key)
        .map((sb) => ({ ...sb, model: model.subs[sb.key], delta: model.subs[sb.key] - sb.wt })),
    }));
    const flat = clsRows.reduce((a, c) => a.concat(c.kids), []);
    const SCALE = 45;                                   // one shared axis for every bar
    const [proj, setProj] = useState(false);

    /* two fans: today's mix and the model, each with its 10th–90th range */
    const YEARS = 10, CW = 720, CH = 230;
    const curW = {}; cls.forEach((c) => { curW[c.key] = c.wt; });
    const cur = u.projectMix(curW, t, YEARS, positions);
    const mod = u.projectMix(model.classes, t, YEARS);
    const hi = Math.max(...cur.path.map((q) => q.p90), ...mod.path.map((q) => q.p90));
    const lo = Math.min(...cur.path.map((q) => q.p10), ...mod.path.map((q) => q.p10), t) * 0.97;
    const X = (y) => (y / YEARS) * CW;
    const Y = (v) => CH - ((v - lo) / (hi - lo)) * CH;
    const pts = (path, k) => path.map((q) => X(q.y).toFixed(1) + "," + Y(q[k]).toFixed(1)).join(" ");
    const band = (path) => pts(path, "p90") + " " + path.slice().reverse().map((q) => X(q.y).toFixed(1) + "," + Y(q.p10).toFixed(1)).join(" ");
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => lo + (hi - lo) * f);
    const curEnd = cur.path[YEARS].mean, modEnd = mod.path[YEARS].mean;
    const curR = cur.mu, modR = mod.mu;

    const Bar = ({ held, target, color }) => (
      <div className="wbar" title={"held " + u.pct(held) + " · model " + u.pct(target)}>
        <i style={{ width: Math.min(100, (held / SCALE) * 100) + "%", background: color }} />
        <b style={{ left: Math.min(100, (target / SCALE) * 100) + "%" }} />
      </div>
    );

    return (
      <>
        <div className="panel mt16" id="model-panel">
          <div className="panel-hd">
            <div>
              <h3>Model portfolio</h3>
              <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>
                Two settings decide the shape below: what the family is trying to do, and how much it has.
              </div>
            </div>
            <button className="btn sm" onClick={() => setPath(true)}>Rebalancing path</button>
          </div>

          {/* the two levers, side by side and labelled as such */}
          <div className="levers">
            <div className="lever">
              <div className="lbl">1 · Objective</div>
              <div className="mt8">
                <Seg options={D.mandates.map((g) => ({ v: g.key, label: g.label }))} value={goal} onChange={setGoal} />
              </div>
              {whatIf ? (
                <div className="lever-note warn">
                  <span style={{ flex: 1 }}>A what-if. The family's mandate is <b>{mandate.label}</b>.</span>
                  <span className="btn-row">
                    <button className="link g" onClick={() => setGoal(st.mandate)}>Discard</button>
                    <Lock sleeve="core">
                      <button className="btn sm p" onClick={() => S.actions.setMandate(goal)}>Adopt as mandate</button>
                    </Lock>
                  </span>
                </div>
              ) : (
                <div className="lever-note">
                  <span style={{ flex: 1 }}>
                    The family's mandate · <b>{mandate.core} / {mandate.alpha}</b> Core / Alpha
                    {confirmed ? " · confirmed " + u.fmtDate(confirmed.ts) : ""}
                  </span>
                  <Lock sleeve="core">
                    <button className="link g" onClick={() => S.navigate("/onboarding/mandate")}>Refine with 8 questions</button>
                  </Lock>
                </div>
              )}
              <div className="tri" style={{ fontSize: 11.5, marginTop: 6 }}>{selected.line}</div>
            </div>

            <div className="lever">
              <div className="lbl">2 · Size</div>
              <div className="row mt8" style={{ alignItems: "center", gap: 12 }}>
                <span className="num" style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.02em", minWidth: 76 }}>{short(aum)}</span>
                <input type="range" min="0" max="1000" step="1" value={Math.round(pos(aum) * 1000)}
                  onChange={(e) => setAum(Math.round(fromPos(+e.target.value / 1000) / 1e5) * 1e5)}
                  style={{ flex: 1, accentColor: "var(--navy)" }} />
              </div>
              {/* click a tier, or drag the slider to anything between them */}
              <div className="ticks">
                {[1e6, 10e6, 100e6].map((a, i) => (
                  <button key={a} onClick={() => setAum(a)}
                    className={Math.abs(aum - a) < 1e5 ? "on" : ""}
                    title={"Model the " + short(a) + " tier"}
                    style={{
                      left: (pos(a) * 100) + "%",
                      transform: i === 0 ? "none" : i === 2 ? "translateX(-100%)" : "translateX(-50%)",
                    }}>{short(a)}</button>
                ))}
              </div>
              <div className="lever-note">
                <span style={{ flex: 1 }}>
                  {atToday
                    ? <>Today's assets. Click a tier below or drag the slider to any size between them.</>
                    : <>A what-if — today's assets are {short(t)}.</>}
                </span>
                {!atToday && <button className="link g" onClick={() => setAum(t)}>Back to today</button>}
              </div>
            </div>
          </div>

          {/* held against model, one row per class */}
          <table className="t">
            <thead><tr>
              <th style={{ width: 240 }}>Asset class</th>
              <th className="n">Held</th><th className="n">Model</th>
              <th style={{ width: "36%" }}>Weight against model</th>
              <th className="n">Difference</th><th className="n">Dollars</th>
            </tr></thead>
            <tbody>
              {clsRows.map((c) => {
                const isOpen = !!open[c.key];
                return (
                  <React.Fragment key={c.key}>
                    <tr className="clickable" onClick={() => setOpen({ ...open, [c.key]: !isOpen })}
                      style={{ background: isOpen ? "#FCFBF8" : undefined }}>
                      <td>
                        <span style={{ display: "inline-flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
                          <span style={{ width: 9, fontSize: 11, color: "var(--g1)" }}>{isOpen ? "▾" : "▸"}</span>
                          <i className="sw" style={{ width: 9, height: 9, display: "inline-block", background: c.color }} />
                          {c.label}
                        </span>
                      </td>
                      <td className="n num">{u.pct(c.wt)}</td>
                      <td className="n num tri">{u.pct(c.model)}</td>
                      <td><Bar held={c.wt} target={c.model} color={c.color} /></td>
                      <td className="n"><VsTarget v={c.delta} /></td>
                      <td className="n num tri">{u.usd((c.delta / 100) * t)}</td>
                    </tr>
                    {isOpen && c.kids.map((r) => (
                      <tr key={r.key}>
                        <td style={{ paddingLeft: 34 }}><div className="tname">{r.label}</div></td>
                        <td className="n num">{u.pct(r.wt)}</td>
                        <td className="n num tri">{u.pct(r.model)}</td>
                        <td><Bar held={r.wt} target={r.model} color={c.color} /></td>
                        <td className="n"><VsTarget v={r.delta} /></td>
                        <td className="n num tri">{u.usd((r.delta / 100) * t)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {/* what the two mixes would compound to, if the assumptions hold */}
          <div className="panel-hd clickable" style={{ cursor: "pointer", borderTop: "1px solid var(--g3)", borderBottom: 0 }}
            onClick={() => setProj(!proj)}>
            <div>
              <h3><span style={{ fontSize: 11, color: "var(--g1)", marginRight: 7 }}>{proj ? "▾" : "▸"}</span>Projected growth</h3>
              <div className="tri" style={{ fontSize: 11.5, marginTop: 2, paddingLeft: 18 }}>
                Ten years of simulated outcomes — today's mix at {u.pct(curR)} ± {u.pct(cur.sigma)} against the model at{" "}
                {u.pct(modR)} ± {u.pct(mod.sigma)}
              </div>
            </div>
            <span className="tri num" style={{ fontSize: 12 }}>
              {u.usdC(cur.path[YEARS].p10)}–{u.usdC(cur.path[YEARS].p90)} vs {u.usdC(mod.path[YEARS].p10)}–{u.usdC(mod.path[YEARS].p90)}
            </span>
          </div>
          {proj && (
            <div className="panel-bd">
              <div className="row" style={{ gap: 0, alignItems: "stretch" }}>
                <div style={{ width: 58, position: "relative", flexShrink: 0 }}>
                  {ticks.map((v, i) => (
                    <span key={i} className="tri num" style={{
                      position: "absolute", right: 8, top: (CH - (i / (ticks.length - 1)) * CH) - 6,
                      fontSize: 10, whiteSpace: "nowrap",
                    }}>{u.usdC(v)}</span>
                  ))}
                </div>
                <svg viewBox={"0 0 " + CW + " " + CH} preserveAspectRatio="none"
                  style={{ flex: 1, height: CH, display: "block", border: "1px solid var(--g3)" }}>
                  {ticks.slice(1, -1).map((v, i) => (
                    <line key={i} x1="0" y1={Y(v)} x2={CW} y2={Y(v)} stroke="var(--g4)" strokeWidth="1"
                      vectorEffect="non-scaling-stroke" />
                  ))}
                  {/* ranges first, so the mean paths read on top of them */}
                  <polygon points={band(cur.path)} fill="#9A7B2E" opacity=".18" />
                  <polygon points={band(mod.path)} fill="var(--navy)" opacity=".16" />
                  <polyline points={pts(cur.path, "p10")} fill="none" stroke="#9A7B2E" strokeWidth="1"
                    strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
                  <polyline points={pts(mod.path, "p10")} fill="none" stroke="var(--navy)" strokeWidth="1"
                    strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
                  <polyline points={pts(cur.path, "mean")} fill="none" stroke="#9A7B2E" strokeWidth="2"
                    vectorEffect="non-scaling-stroke" />
                  <polyline points={pts(mod.path, "mean")} fill="none" stroke="var(--navy)" strokeWidth="2"
                    vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
              <div style={{ display: "flex", paddingLeft: 58 }}>
                <div style={{ flex: 1, display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--g2)", paddingTop: 4 }}>
                  {Array.from({ length: 6 }, (_, i) => <span key={i}>{i * 2 === 0 ? "now" : "yr " + i * 2}</span>)}
                </div>
              </div>

              <table className="t dense mt12">
                <thead><tr><th></th><th className="n">Expected a year</th><th className="n">Volatility</th>
                  <th className="n">After 10 years</th><th className="n">Poor decade (10th)</th><th className="n">Good decade (90th)</th></tr></thead>
                <tbody>
                  <tr>
                    <td><span className="sw" style={{ display: "inline-block", width: 9, height: 9, background: "#9A7B2E", marginRight: 8 }} />
                      Today's mix</td>
                    <td className="n num">{u.pct(curR)}</td>
                    <td className="n"><span className="num">{u.pct(cur.sigma)}</span>
                      <div className="tsub">{u.pct(cur.marketSigma)} market + {u.pct(cur.specificSigma)} single names</div></td>
                    <td className="n num">{u.usdC(curEnd)}</td>
                    <td className="n num tri">{u.usdC(cur.path[YEARS].p10)}</td>
                    <td className="n num tri">{u.usdC(cur.path[YEARS].p90)}</td>
                  </tr>
                  <tr>
                    <td><span className="sw" style={{ display: "inline-block", width: 9, height: 9, background: "var(--navy)", marginRight: 8 }} />
                      Model · {selected.label}</td>
                    <td className="n num">{u.pct(modR)}</td>
                    <td className="n"><span className="num">{u.pct(mod.sigma)}</span>
                      <div className="tsub">diversified by construction</div></td>
                    <td className="n num">{u.usdC(modEnd)}</td>
                    <td className="n num tri">{u.usdC(mod.path[YEARS].p10)}</td>
                    <td className="n num tri">{u.usdC(mod.path[YEARS].p90)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="note mt12">
                Shaded bands are the 10th to 90th percentile, dashed lines the 10th — the poor decade, which is the
                number worth looking at. Lognormal outcomes from fixed assumptions:
                {" " + D.classes.map((c) => c.label.split(" ")[0] + " " + u.pct(D.expectedReturn[c.key]) + " ± " + u.pct(D.expectedVol[c.key])).join(" · ")},
                correlated as listed markets normally are, before fees, tax and capital calls.
                {" "}Today's mix carries {u.pct(cur.specificSigma)} on top of that for specific risk — the book holds
                nine single names including {u.pct(u.affiliateExposure(positions).wt)} in the family's own operating
                company, and a class average assumes an index. The model is stated in classes, so it carries none, which
                is most of the gap. Not a backtest and not a forecast — the range these assumptions imply.
              </div>
            </div>
          )}
          <div style={{ padding: "8px 14px", borderTop: "1px solid var(--g3)", fontSize: 11, color: "var(--g2)" }}>
            Class and subcategory only — never individual securities.
          </div>
        </div>
        {path && <PathModal rows={flat} t={t} model={{ label: selected.label + " · " + short(aum) }} onClose={() => setPath(false)} />}
      </>
    );
  }

  function PathModal({ rows, t, model, onClose }) {
    const st = S.useStore();
    const [act, setAct] = useState(null);
    const ordered = rows.filter((r) => Math.abs(r.delta) > 0.2).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    const ctx = u.marketContext(st.positions, st.mandate);
    /* the highest-scoring thing on the marketplace that would fill each line */
    const pick = (key) => D.market.filter((m) => m.fills === key)
      .map((m) => ({ ...m, s: u.scoreFor(m, ctx) }))
      .sort((a, b) => b.s.score - a.s.score)[0];
    return (
      <Modal title="Rebalancing path" sub={"Toward the " + model.label + " model · ordered by size"} onClose={onClose} wide
        footer={<>
          <div className="tri" style={{ fontSize: 11.5 }}>Subcategory level only. Instruments are chosen in the marketplace.</div>
          <div className="btn-row">
            <button className="btn" onClick={onClose}>Close</button>
            <button className="btn p" onClick={() => { onClose(); S.navigate("/marketplace"); }}>Open the marketplace</button>
          </div>
        </>}>
        <table className="t dense">
          <thead><tr><th style={{ width: 28 }}>#</th><th>Action</th><th>Subcategory</th><th className="n">Amount</th>
            <th>What would fill it</th><th></th></tr></thead>
          <tbody>
            {ordered.map((r, i) => {
              const add = r.delta > 0;
              const liquid = ["pubeq", "sov", "ig", "comm", "mmf", "tbill", "dep", "fx"].indexOf(r.key) >= 0;
              const amount = Math.round(Math.abs((r.delta / 100) * t));
              const best = add ? pick(r.key) : null;
              return (
                <tr key={r.key}>
                  <td className="tri num">{i + 1}</td>
                  {/* the verb follows the instrument that would actually fill the line */}
                  <td><b>{r.cls === "cash" ? (add ? "Build" : "Deploy")
                    : add ? (best ? (best.kind === "listed" ? "Buy" : "Commit") : "Buy")
                    : (liquid ? "Sell" : "Redeem / list")}</b></td>
                  <td>{r.label}<div className="tsub">{u.clsLabel(r.cls)}</div></td>
                  <td className="n num">{u.usd(amount)}</td>
                  <td>
                    {best
                      ? <><div className="tname">{best.name}</div><div className="tsub">{best.ret} · {best.liq} · fit {best.s.score}</div></>
                      : <span className="tri">{liquid ? "Trim the holdings you have" : "List on the secondary board"}</span>}
                  </td>
                  <td className="right">
                    {best
                      ? <BB.ui.Lock sleeve={st.account === "successor" ? "alpha" : "core"}>
                          <button className="btn sm p" onClick={() => setAct({ m: best, amount })}>
                            {best.kind === "listed" ? "Buy" : "Commit"}
                          </button>
                        </BB.ui.Lock>
                      : <button className="btn sm" onClick={() => { onClose(); S.navigate(liquid ? "/portfolio/" + r.cls + "?sub=" + r.key : "/secondary"); }}>
                          Review
                        </button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="note mt12">
          Executing the liquid legs first funds the illiquid commitments without breaching the liquidity floor. Each line
          shows the highest-scoring offering that would fill it — the button opens the ticket, it does not place anything.
        </div>
        {act && (act.m.kind === "listed"
          ? <BB.flows.TradeTicket instrument={{ ...act.m, sub: act.m.fills, sleeve: st.account === "successor" ? "alpha" : "core", pxUsd: act.m.px }}
              side="buy" onClose={() => setAct(null)} />
          : <BB.flows.CommitFlow deal={act.m} onClose={() => setAct(null)} />)}
      </Modal>
    );
  }

  /* ------------------------------------------------------ provenance */
  function ProvenancePanel({ positions }) {
    const [edit, setEdit] = useState(null);
    const [open, setOpen] = useState(false);
    const self = positions.filter((p) => p.prov === "self");
    const stale = self.filter((p) => u.staleness(p).d > 90);
    const counts = {
      live: positions.filter((p) => p.prov === "live").length,
      hanwha: positions.filter((p) => p.prov === "hanwha").length,
      self: self.length,
    };
    return (
      <>
        <div className="panel mt16">
          <div className="panel-hd clickable" onClick={() => setOpen(!open)} style={{ cursor: "pointer" }}>
            <div>
              <h3><span style={{ fontSize: 11, color: "var(--g1)", marginRight: 7 }}>{open ? "▾" : "▸"}</span>Data provenance</h3>
              <div className="tri" style={{ fontSize: 11.5, marginTop: 2, paddingLeft: 18 }}>
                {counts.live} live · {counts.hanwha} Hanwha-sourced · {counts.self} self-maintained
                {open ? "" : " · open to review and update the self-maintained marks"}
              </div>
            </div>
            {stale.length > 0 && <span className="bdg self warn"><i className="pt" />{stale.length} positions stale</span>}
          </div>
          {open && <table className="t dense">
            <thead><tr><th>Self-maintained position</th><th>Source</th><th className="n">Carrying value</th><th className="n">Last updated</th><th></th></tr></thead>
            <tbody>
              {self.map((p) => {
                const st = u.staleness(p);
                return (
                  <tr key={p.id}>
                    <td><div className="tname">{p.name}</div>{p.legacy && <div className="tsub mono">{p.legacy}</div>}</td>
                    <td className="mono tri" style={{ fontSize: 11 }}>{p.src.file}</td>
                    <td className="n num">{u.usd(p.value)}</td>
                    <td className="n">
                      <span className={st.level === "bad" ? "neg" : st.level === "warn" ? "" : "tri"} style={st.level === "warn" ? { color: "var(--amber)" } : null}>
                        {st.level !== "ok" && <i className="stale-dot" style={st.level === "bad" ? { background: "var(--neg)" } : null} />}
                        {u.fmtDate(p.asOf)} · {st.d}d
                      </span>
                    </td>
                    <td className="right">
                      <Lock sleeve={p.sleeve}>
                        <button className="btn sm" onClick={() => setEdit(p)}>Update valuation</button>
                      </Lock>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>}
        </div>
        {edit && <BB.flows.ValuationEditor p={edit} onClose={() => setEdit(null)} />}
      </>
    );
  }

  /* --------------------------------------------------- every position */
  /* The whole book at fund and deal level — the answer to "show me everything",
     sitting under the summaries rather than replacing them. */
  function AllPositions({ positions }) {
    const [q, setQ] = useState("");
    const [cls, setCls] = useState("");
    const [sort, setSort] = useState({ k: "value", dir: -1 });
    const [show, setShow] = useState(false);
    const t = u.total(positions);

    const val = (p, k) => {
      if (k === "name") return p.name.toLowerCase();
      if (k === "cls") return u.clsLabel(p.cls);
      if (k === "sub") return u.subLabel(p.sub);
      if (k === "sleeve") return p.sleeve;
      if (k === "prov") return u.provLabel(p);
      if (k === "liq") return p.liq;
      if (k === "gain") return p.value - p.cost;
      if (k === "gainPct") return (p.value - p.cost) / p.cost;
      return p[k];
    };
    const rows = positions
      .filter((p) => !cls || p.cls === cls)
      .filter((p) => !q || (p.name + " " + (p.ticker || "") + " " + (p.legacy || "") + " " +
        u.subLabel(p.sub) + " " + (p.manager || "") + " " + (p.sector || "")).toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => {
        const x = val(a, sort.k), y = val(b, sort.k);
        return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
      });

    const Th = ({ k, label, n, w, opt }) => (
      <th className={(n ? "n" : "") + (opt ? " hide-narrow" : "")} style={{ cursor: "pointer", width: w }}
        onClick={() => setSort({ k, dir: sort.k === k ? -sort.dir : (k === "name" || k === "cls" || k === "sub" ? 1 : -1) })}>
        {label}<span className="tri" style={{ marginLeft: 4 }}>{sort.k === k ? (sort.dir === 1 ? "▲" : "▼") : ""}</span>
      </th>
    );

    return (
      <div className="panel mt16">
        <div className="panel-hd clickable" onClick={() => setShow(!show)} style={{ cursor: "pointer" }}>
          <div>
            <h3><span style={{ fontSize: 11, color: "var(--g1)", marginRight: 7 }}>{show ? "▾" : "▸"}</span>All positions</h3>
            <div className="tri" style={{ fontSize: 11.5, marginTop: 2, paddingLeft: 18 }}>
              The entire book at fund and deal level — {positions.length} positions ·{" "}
              {positions.filter((p) => p.liq === "Daily").length} listed ·{" "}
              {positions.filter((p) => p.liq !== "Daily").length} private
              {show ? ". Any column sorts." : ". Open to search and sort it."}
            </div>
          </div>
          <div className="btn-row" onClick={(e) => e.stopPropagation()} style={{ display: show ? "flex" : "none" }}>
            <button className={"btn sm" + (cls ? "" : " p")} onClick={() => setCls("")}>All</button>
            {D.classes.map((c) => (
              <button key={c.key} className={"btn sm" + (cls === c.key ? " p" : "")} onClick={() => setCls(c.key)}>{c.label}</button>
            ))}
            <div className="search" style={{ width: 210 }}>
              <input type="text" placeholder="Find a fund, deal or ticker" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>
        {show && <div className="tscroll">
          <table className="t dense">
            <thead>
              <tr>
                <Th k="name" label="Position" w={280} />
                <Th k="cls" label="Class" />
                <Th k="sub" label="Subcategory" />
                <Th k="sleeve" label="Sleeve" opt />
                <Th k="prov" label="Provenance" />
                <Th k="liq" label="Liquidity" />
                <Th k="cost" label="Cost basis" n opt />
                <Th k="value" label="Value" n />
                <Th k="gain" label="Unrealised" n />
                <Th k="wt" label="% of total" n />
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="clickable" onClick={() => S.navigate("/portfolio/" + p.cls + "?sub=" + p.sub)}>
                  <td>
                    <div className="tname">{p.name}</div>
                    <div className="tsub">{p.ticker ? <span className="mono">{p.ticker}</span> : p.grp}{p.vintage ? " · vintage " + p.vintage : ""}</div>
                  </td>
                  <td>{u.clsLabel(p.cls)}</td>
                  <td>{u.subLabel(p.sub)}</td>
                  <td className="hide-narrow"><SleeveBadge s={p.sleeve} /></td>
                  <td><ProvBadge p={p} showDate={false} /></td>
                  <td><span className="bdg plain">{p.liq}</span></td>
                  <td className="n num hide-narrow">{u.usd(p.cost)}</td>
                  <td className="n num">{u.usd(p.value)}</td>
                  <td className="n"><Delta v={p.value - p.cost} usd />
                    <span className="krw">{u.sgn(((p.value - p.cost) / p.cost) * 100)}</span></td>
                  <td className="n num">{u.pct((p.value / t) * 100)}</td>
                  <td className="right"><span className="tri">›</span></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>{rows.length === positions.length ? "Total" : rows.length + " of " + positions.length + " positions"}</td>
                <td></td><td></td><td className="hide-narrow"></td><td></td><td></td>
                <td className="n num hide-narrow">{u.usd(u.sum(rows, (p) => p.cost))}</td>
                <td className="n"><Money v={u.total(rows)} /></td>
                <td className="n"><Delta v={u.unrealized(rows)} usd /></td>
                <td className="n num">{u.pct((u.total(rows) / t) * 100)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>}
      </div>
    );
  }

  /* -------------------------------------------------------- liquidity tab */
  function LiquidityTab({ positions }) {
    const proj = u.liquidityProjection(positions);
    const short = u.shortfall(positions);
    const maxFlow = Math.max(...proj.map((m) => Math.max(m.calls, m.dist)), 1);
    const cashes = proj.map((m) => m.cash);
    const hi = Math.max(...cashes, u.total(positions.filter((p) => p.cls === "cash")));
    const lo = Math.min(...cashes, 0);
    const W = 1100, H = 150, pad = 4;
    const x = (i) => (i / (proj.length - 1)) * (W - pad * 2) + pad;
    const y = (v) => H - ((v - lo) / (hi - lo || 1)) * (H - 20) - 10;
    const line = proj.map((m, i) => x(i) + "," + y(m.cash)).join(" ");
    const floor = D.liquidityAssumptions.reserveFloor;
    const calls60 = D.capitalCalls.filter((c) => u.days(D.TODAY, c.date) <= 60 && u.days(D.TODAY, c.date) >= 0);
    const cover = u.coverage(positions, short ? short.amount : 0);
    const liq = u.liquidity90(positions);

    return (
      <>
        <div className="band mt16">
          <div className="cell"><div className="stat-l">Cash equivalents</div><div className="stat-v"><Money v={liq.cash} compact /></div><div className="stat-s">immediately available</div></div>
          <div className="cell"><div className="stat-l">Redeemable within 90 days</div><div className="stat-v"><Money v={liq.within90} compact /></div><div className="stat-s">incl. quarterly funds</div></div>
          <div className="cell"><div className="stat-l">Realisable from listed positions</div><div className="stat-v"><Money v={liq.listed} compact /></div><div className="stat-s">daily liquidity, not earmarked</div></div>
          <div className="cell"><div className="stat-l">Capital calls · next 60 days</div><div className="stat-v"><Money v={u.sum(calls60, (c) => c.amount)} compact /></div><div className="stat-s">{calls60.length} calls</div></div>
          <div className="cell"><div className="stat-l">Runway breach</div>
            <div className="stat-v" style={{ color: short ? "var(--neg)" : "var(--pos)" }}>{short ? short.month : "None"}</div>
            <div className="stat-s">{short ? u.usd(short.amount) + " short" : "within 24 months"}</div></div>
        </div>

        <div className="mt16">
          <Agent where="Liquidity" tone={short ? "warn" : null}
            why={["Committed capital call schedule from 4 funds",
                  "Announced and projected distributions",
                  "Net family spending of " + u.usd(D.liquidityAssumptions.monthlySpend - D.liquidityAssumptions.monthlyIncome) + " per month",
                  "Cash equivalents of " + u.usd(liq.cash) + " as the opening balance",
                  "Quarterly-redeemable funds counted at 90 days' notice"]}
            actions={<>
              <button className="btn sm p" onClick={() => S.navigate("/marketplace")}>Review liquid instruments</button>
              <button className="btn sm" onClick={() => S.navigate("/secondary")}>Secondary board</button>
            </>}>
            {short
              ? <>Your {short.quarter} capital calls of {u.usd(short.quarterCalls)} exceed projected cash by{" "}
                <b>{u.usd(short.amount)}</b> in {short.month}. {cover.items.length} positions are liquid enough to cover it:{" "}
                {cover.items.map((p) => p.name).join(", ")} — together {u.usd(cover.total)}, without touching the
                operating company holding.</>
              : <>Projected cash stays positive across the 24-month window.</>}
          </Agent>
        </div>

        <div className="panel mt16">
          <div className="panel-hd">
            <h3>24-month liquidity</h3>
            <div className="legend" style={{ marginTop: 0 }}>
              <span className="it"><i className="sw" style={{ background: "var(--neg)", opacity: .75 }} />Capital calls</span>
              <span className="it"><i className="sw" style={{ background: "var(--pos)", opacity: .7 }} />Distributions</span>
              <span className="it"><i className="sw" style={{ background: "var(--navy)" }} />Projected cash</span>
              <span className="it"><i className="sw" style={{ background: "var(--amber)" }} />Reserve floor</span>
            </div>
          </div>
          <div className="panel-bd">
            <div className="timeline">
              {proj.map((m) => (
                <div className="m" key={m.k} title={m.label + " · calls " + u.usd(m.calls) + " · distributions " + u.usd(m.dist)}>
                  <div className="dist" style={{ height: (m.dist / maxFlow) * 100 + "px" }} />
                  <div className="call" style={{ height: (m.calls / maxFlow) * 100 + "px" }} />
                </div>
              ))}
            </div>
            <svg viewBox={"0 0 " + W + " " + H} preserveAspectRatio="none" style={{ width: "100%", height: 150, display: "block" }}>
              <line x1="0" y1={y(0)} x2={W} y2={y(0)} stroke="var(--g3)" strokeWidth="1" />
              <line x1="0" y1={y(floor)} x2={W} y2={y(floor)} stroke="var(--amber)" strokeWidth="1" strokeDasharray="4 3" />
              <polyline points={line} fill="none" stroke="var(--navy)" strokeWidth="2" />
              {proj.map((m, i) => m.cash < 0 && (
                <circle key={m.k} cx={x(i)} cy={y(m.cash)} r="3" fill="var(--neg)" />
              ))}
            </svg>
            <div className="tl-axis">
              {proj.map((m, i) => <div className="m" key={m.k}>{i % 2 === 0 ? m.label : ""}</div>)}
            </div>
            {short && (
              <div className="note bad mt12">
                Projected cash falls below zero in {short.month} by {u.usd(short.amount)}, and below the {u.usd(floor)} reserve
                floor earlier still. The breach is driven by {u.usd(short.quarterCalls)} of {short.quarter} calls landing in
                a single quarter.
              </div>
            )}
          </div>
        </div>

        <div className="grid mt16" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Panel title="Committed capital calls" sub="Contractual and projected">
            <table className="t dense">
              <thead><tr><th>Fund</th><th>Date</th><th className="n">Amount</th><th>Status</th></tr></thead>
              <tbody>
                {D.capitalCalls.map((c) => (
                  <tr key={c.id}>
                    <td className="tname">{c.fund}</td>
                    <td className="num">{u.fmtDate(c.date)}</td>
                    <td className="n num">{u.usd(c.amount)}</td>
                    <td><span className="bdg plain">{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td>Total</td><td></td><td className="n num">{u.usd(u.sum(D.capitalCalls, (c) => c.amount))}</td><td></td></tr></tfoot>
            </table>
          </Panel>
          <Panel title="Expected distributions" sub="Announced and projected">
            <table className="t dense">
              <thead><tr><th>Source</th><th>Date</th><th className="n">Amount</th><th>Status</th></tr></thead>
              <tbody>
                {D.distributions.map((c) => (
                  <tr key={c.id}>
                    <td className="tname">{c.fund}</td>
                    <td className="num">{u.fmtDate(c.date)}</td>
                    <td className="n num">{u.usd(c.amount)}</td>
                    <td><span className="bdg plain">{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td>Total</td><td></td><td className="n num">{u.usd(u.sum(D.distributions, (c) => c.amount))}</td><td></td></tr></tfoot>
            </table>
          </Panel>
        </div>
      </>
    );
  }

  /* -------------------------------------------------------------- tax tab */
  function TaxTab({ positions }) {
    const lots = u.taxLots(positions).sort((a, b) => b.value - a.value);
    const realized = u.realizedYTD(positions);
    const harvest = lots.filter((l) => l.harvest);
    const nearLT = lots.filter((l) => !l.longTerm && l.held > 300);
    return (
      <>
        <div className="band mt16">
          <div className="cell"><div className="stat-l">Realised YTD</div><div className="stat-v"><Money v={realized} compact /></div><div className="stat-s">across {positions.filter((p) => p.realizedYTD).length} positions</div></div>
          <div className="cell"><div className="stat-l">Unrealised</div><div className="stat-v"><Money v={u.unrealized(positions)} compact /></div></div>
          <div className="cell"><div className="stat-l">Long-term lots</div><div className="stat-v">{lots.filter((l) => l.longTerm).length} <span className="tri" style={{ fontSize: 13 }}>/ {lots.length}</span></div><div className="stat-s">held 12 months or more</div></div>
          <div className="cell"><div className="stat-l">Harvest candidates</div><div className="stat-v">{harvest.length}</div><div className="stat-s">liquid positions below cost</div></div>
          <div className="cell"><div className="stat-l">Approaching long-term</div><div className="stat-v">{nearLT.length}</div><div className="stat-s">within 65 days</div></div>
        </div>

        <div className="mt16">
          <Agent where="Tax"
            why={["Acquisition dates per lot from the reconciled book",
                  "Carrying values as of today's marks",
                  "Holding period measured against a 365-day long-term threshold",
                  "Realised gains and losses booked year to date"]}>
            {harvest.length > 0
              ? <>{harvest.length} liquid positions are carried below cost, together {u.usd(Math.abs(u.sum(harvest, (l) => l.gain)))} of unrealised
                loss — enough to offset {u.pct((Math.abs(u.sum(harvest, (l) => l.gain)) / Math.max(realized, 1)) * 100, 0)} of the
                gains realised this year. {nearLT.length > 0 && <>Separately, {nearLT.length} lot{nearLT.length > 1 ? "s cross" : " crosses"} the
                long-term threshold within 65 days.</>}</>
              : <>No harvest candidates. Every liquid position is carried above cost.</>}
          </Agent>
        </div>

        <div className="panel mt16">
          <div className="panel-hd"><h3>Lots</h3><span className="tri" style={{ fontSize: 11 }}>Holding period and classification per position</span></div>
          <table className="t dense">
            <thead>
              <tr><th>Position</th><th>Acquired</th><th className="n">Held</th><th>Classification</th>
                <th className="n">Cost</th><th className="n">Value</th><th className="n">Unrealised</th><th className="n">Realised YTD</th><th></th></tr>
            </thead>
            <tbody>
              {lots.map((l) => (
                <tr key={l.id}>
                  <td><div className="tname">{l.name}</div><div className="tsub">{l.ticker || u.subLabel(l.sub)}</div></td>
                  <td className="num">{u.fmtDate(l.acquired)}</td>
                  <td className="n num">{(l.held / 365).toFixed(1)}y</td>
                  <td>
                    <span className={"bdg plain " + (l.longTerm ? "" : "")}>{l.longTerm ? "Long-term" : "Short-term"}</span>
                    {!l.longTerm && l.held > 300 && <span className="chip" style={{ marginLeft: 6, color: "var(--amber)" }}>{365 - l.held}d to LT</span>}
                  </td>
                  <td className="n num">{u.usd(l.cost)}</td>
                  <td className="n num">{u.usd(l.value)}</td>
                  <td className="n"><Delta v={l.gain} usd /> <span className="tri num" style={{ fontSize: 11 }}>{u.sgn(l.gainPct)}</span></td>
                  <td className="n num">{l.realizedYTD ? u.usd(l.realizedYTD) : "—"}</td>
                  <td className="right">{l.harvest && <span className="bdg self warn"><i className="pt" />Harvest</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="note mt16">
          Observations only. Barbell does not provide tax advice. Holding periods and classifications are computed from the
          reconciled book and should be confirmed with your tax adviser before any action.
        </div>
      </>
    );
  }

  /* ------------------------------------------------------------ alpha tab */
  function AlphaTab({ positions }) {
    const alpha = positions.filter((p) => p.sleeve === "alpha");
    const t = u.total(positions);
    const av = u.total(alpha);
    const capacity = S.alphaCapacity();
    const active = alpha.filter((p) => p.liq !== "Daily");
    const fits = [...D.market].sort((a, b) => b.fit - a.fit).slice(0, 4);
    return (
      <>
        <div className="panel mt16">
          <div className="panel-hd"><h3>Alpha positions</h3>
            <div className="btn-row"><button className="btn sm p" onClick={() => S.navigate("/marketplace")}>Find the next one</button></div></div>
          <table className="t dense">
            <thead><tr><th>Position</th><th>Subcategory</th><th>Provenance</th><th>Liquidity</th>
              <th className="n">Cost</th><th className="n">Value</th><th className="n">Unrealised</th><th className="n">% of sleeve</th></tr></thead>
            <tbody>
              {alpha.sort((a, b) => b.value - a.value).map((p) => (
                <tr key={p.id} className="clickable" onClick={() => S.navigate("/portfolio/" + p.cls + "?sub=" + p.sub)}>
                  <td><div className="tname">{p.name}</div><div className="tsub">{p.ticker || p.grp}</div></td>
                  <td>{u.subLabel(p.sub)}</td>
                  <td><ProvBadge p={p} showDate={false} /></td>
                  <td><span className="bdg plain">{p.liq}</span></td>
                  <td className="n num">{u.usd(p.cost)}</td>
                  <td className="n num">{u.usd(p.value)}</td>
                  <td className="n"><Delta v={p.value - p.cost} usd /></td>
                  <td className="n num">{u.pct((p.value / av) * 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid mt16" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
          <Panel title="Discovery" sub="Highest-ranked offerings for this family"
            right={<button className="btn sm" onClick={() => S.navigate("/marketplace")}>Open marketplace</button>}>
            <table className="t dense">
              <thead><tr><th>Opportunity</th><th>Fills</th><th>Liquidity</th><th className="n">Minimum</th><th className="n">Fit</th><th></th></tr></thead>
              <tbody>
                {fits.map((m) => (
                  <tr key={m.id} className="clickable" onClick={() => S.navigate("/marketplace/" + m.id)}>
                    <td><div className="tname">{m.name}</div><div className="tsub">{m.ret}</div></td>
                    <td>{u.subLabel(m.fills)}</td>
                    <td><span className="bdg plain">{m.liq}</span></td>
                    <td className="n num">{u.usd(m.min)}</td>
                    <td className="n"><BB.ui.Fit score={m.fit} /></td>
                    <td className="right"><span className="tri">›</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title="Authority" sub="What this account can do without asking">
            <div className="kv">
              <span className="k">The Alpha sleeve</span><span className="v">Yours to act on</span>
              <span className="k">The rest of the book</span><span className="v">Visible, not yours to move</span>
              <span className="k">Commit without asking, up to</span><span className="v">{u.usd(capacity)}</span>
              <span className="k">Beyond that</span><span className="v">The Principal decides</span>
            </div>
            <div className="note mt12">
              Wherever you cannot act, the button is still there — greyed, with the reason on it. You can always write the
              trade or commitment up and send it: it lands in the Principal's inbox with your reasoning attached.
            </div>
            <button className="btn mt12 block" onClick={() => S.navigate("/approvals")}>View submitted proposals</button>
          </Panel>
        </div>
      </>
    );
  }

  /* ------------------------------------------------------------- the page */
  function Portfolio({ route }) {
    const st = S.useStore();
    const isSuccessor = st.account === "successor";
    const wanted = route && route.query && route.query.tab;
    const [tab, setTab] = useState(wanted || (isSuccessor ? "alpha" : "alloc"));
    /* Switching account changes the home view, not just the permissions. */
    React.useEffect(() => { setTab(st.account === "successor" ? "alpha" : "alloc"); }, [st.account]);
    /* …and a link may ask for a particular tab. */
    React.useEffect(() => { if (wanted) setTab(wanted); }, [wanted]);
    const ps = st.positions;
    const t = u.total(ps);
    const sl = u.sleeveTotals(ps);
    const cls = u.byClass(ps);
    const priv = ps.filter((p) => p.liq !== "Daily");
    const privShare = (u.total(priv) / t) * 100;
    const privCount = priv.length;
    const liq = u.liquidity90(ps);
    const stale = ps.filter((p) => p.prov === "self" && u.staleness(p).d > 90);
    const alpha = ps.filter((p) => p.sleeve === "alpha");
    const calls60 = D.capitalCalls.filter((c) => u.days(D.TODAY, c.date) <= 60 && u.days(D.TODAY, c.date) >= 0);

    const tabs = (isSuccessor ? [{ k: "alpha", label: "Alpha sleeve" }] : [])
      .concat([{ k: "alloc", label: "Allocation" }, { k: "liq", label: "Liquidity" }, { k: "tax", label: "Tax" }]);

    return (
      <div className="wrap page hasagent">
        <div className="between" style={{ alignItems: "flex-start" }}>
          <div>
            <div className="eyebrow">{D.family.name} · {isSuccessor ? "Successor Mode" : "Sovereign Mode"}</div>
            {/* one number carries the page; everything else is a supporting line */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6 }}>
              <h1 className="num" style={{ fontSize: 34, letterSpacing: "-.03em", lineHeight: 1.05 }}>
                {u.usdC(isSuccessor ? u.total(alpha) : t)}
              </h1>
              <span className="sub" style={{ fontSize: 13.5 }}>{isSuccessor ? "Alpha sleeve" : "Total assets"}</span>
            </div>
            {isSuccessor && (
              <div className="tri" style={{ fontSize: 11.5, marginTop: 3 }}>
                {u.pct((u.total(alpha) / t) * 100)} of assets
              </div>
            )}
          </div>
          <div className="right">
            <div className="num tri" style={{ fontSize: 11.5 }}>Updated {u.fmtTs(D.family.asOf)} KST</div>
            <div style={{ display: "flex", gap: 14, justifyContent: "flex-end", marginTop: 5 }}>
              {calls60.length > 0 && (
                <button className="link" onClick={() => setTab("liq")}>
                  {calls60.length} capital calls within 60 days · {u.usdC(u.sum(calls60, (c) => c.amount))}
                </button>
              )}
              {stale.length > 0 && (
                <button className="link" onClick={() => setTab("alloc")}>
                  <span className="stale-dot" />{stale.length} positions stale
                </button>
              )}
            </div>
          </div>
        </div>

        {/* secondary figures, deliberately quiet */}
        <div className="subline">
          {(isSuccessor
            ? [["Unrealised", <Delta v={u.unrealized(alpha)} usd />, u.sgn((u.unrealized(alpha) / (u.total(alpha) - u.unrealized(alpha))) * 100) + " on cost"],
               ["Remaining capacity", u.usdC(S.alphaCapacity()), "commit direct up to this"],
               ["Total assets", u.usdC(t), "yours to see, not to move"]]
            : [["Unrealised", <Delta v={u.unrealized(ps)} usd />, u.sgn((u.unrealized(ps) / (t - u.unrealized(ps))) * 100) + " on cost"]]
          ).map((m, i) => (
            <span className="item" key={i}>
              <span className="k">{m[0]}</span>
              <span className="v num">{m[1]}</span>
              <span className="n">{m[2]}</span>
            </span>
          ))}
        </div>

        <div className="mt16"><Tabs tabs={tabs} active={tab} onChange={setTab} /></div>
        {tab === "alpha" && <AlphaTab positions={ps} />}
        {tab === "alloc" && <AllocationTab positions={ps} />}
        {tab === "liq" && <LiquidityTab positions={ps} />}
        {tab === "tax" && <TaxTab positions={ps} />}

        {tab !== "alloc" && <QueryBar positions={ps} />}
      </div>
    );
  }

  BB.pages = BB.pages || {};
  BB.pages.Portfolio = Portfolio;
})();
