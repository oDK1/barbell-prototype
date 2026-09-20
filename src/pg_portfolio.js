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
    return (
      <div className="askbar">
        {res && (
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
        )}
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

  /* ------------------------------------------------------------- mandate */
  /* Where the family states what it is trying to do with the money. It sets the
     Core/Alpha split and every class target, so it belongs at the top of the
     portfolio, not only in onboarding. Principal authority. */
  /* Sits at the top of the model panel: the stated goal, then the chart drawn
     for it. Principal authority — the Successor sees it, locked. */
  function MandateRow({ mandate, activity }) {
    const m = D.mandates.find((x) => x.key === mandate) || D.mandates[1];
    const confirmed = activity.find((a) => a.kind === "Mandate");
    return (
      <div style={{
        padding: "10px 14px", borderBottom: "1px solid var(--g3)", background: "#FCFBF8",
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
      }}>
        <span className="lbl" style={{ whiteSpace: "nowrap" }}>Mandate</span>
        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{m.label}</span>
        <span className="bdg plain">{m.core} / {m.alpha} Core / Alpha</span>
        <span className="tri" style={{ fontSize: 12 }}>{m.line}</span>
        <span style={{ flex: 1 }} />
        <span className="tri num" style={{ fontSize: 11, whiteSpace: "nowrap" }}>
          {D.classes.map((c) => c.label.split(" ")[0] + " " + u.pct(c.target)).join(" · ")}
        </span>
        {confirmed && <span className="tri" style={{ fontSize: 11, whiteSpace: "nowrap" }}>Confirmed {u.fmtDate(confirmed.ts)}</span>}
        <Lock sleeve="core">
          <button className="btn sm" onClick={() => S.navigate("/onboarding/mandate")}>Refine with 8 questions</button>
        </Lock>
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
    const altShare = (u.total(positions.filter((p) => D.ALT_SUBS.indexOf(p.sub) >= 0)) / t2) * 100;

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

        <div className="mt16">
          <Agent where="Allocation"
            why={["Current class and subcategory weights from the reconciled book",
                  "Mandate: " + mandateLabel + ", as confirmed in the activity log",
                  "Model allocation for this AUM tier and objective",
                  "Listed positions marked live; private marks as of 30 Jun 2026"]}
            actions={<button className="btn sm" onClick={() => {
              const el = document.getElementById("model-panel");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}>Compare with the model</button>}>
            The book is {cls.map((c) => u.pct(c.wt) + " " + c.label.toLowerCase()).join(", ")}. Cutting across three of
            those four, <b>{u.pct(altShare)}</b> sits in alternatives — private equity, venture, pre-IPO, private credit,
            real estate and infrastructure — against {u.pct(model.alts)} in the model for this size and objective.
            Differences of a few points are normal and not, on their own, a reason to trade.
          </Agent>
        </div>

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
    const cls = u.byClass(positions);
    const subs = u.bySub(positions);
    const clsRows = cls.map((c) => ({
      ...c, model: model.classes[c.key], delta: model.classes[c.key] - c.wt,
      kids: subs.filter((sb) => sb.cls === c.key)
        .map((sb) => ({ ...sb, model: model.subs[sb.key], delta: model.subs[sb.key] - sb.wt })),
    }));
    const flat = clsRows.reduce((a, c) => a.concat(c.kids), []);
    const SCALE = 45;                                   // one shared axis for every bar
    const altNow = (u.total(positions.filter((p) => D.ALT_SUBS.indexOf(p.sub) >= 0)) / t) * 100;

    /* how the alternatives weight moves with size — the one trend worth a picture */
    const N = 25, SW = 180, SH = 30;
    const vals = [];
    for (let i = 0; i < N; i++) vals.push(u.modelWeights(fromPos(i / (N - 1)), goal).alts);
    /* scale to the series, not to 0–100, or the rise is invisible */
    const lo = Math.min(...vals), hi = Math.max(...vals), span = Math.max(hi - lo, 1);
    const sy = (v) => SH - 3 - ((v - lo) / span) * (SH - 8);
    const spark = vals.map((v, i) => ((i / (N - 1)) * SW).toFixed(1) + "," + sy(v).toFixed(1)).join(" ");
    const here = { x: pos(aum) * SW, y: sy(model.alts) };
    const at10 = u.modelWeights(10e6, goal), at100 = u.modelWeights(100e6, goal);

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
              <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>{model.goal.line}</div>
            </div>
            <div className="btn-row">
              <Seg options={D.modelGoals.map((g) => ({ v: g.key, label: g.goal }))} value={goal} onChange={setGoal} />
              <button className="btn sm" onClick={() => setPath(true)}>Rebalancing path</button>
            </div>
          </div>

          <MandateRow mandate={st.mandate} activity={st.activity} />

          {whatIf && (
            <div className="note warn" style={{ border: 0, borderBottom: "1px solid var(--g3)", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ flex: 1 }}>
                <b>What-if.</b> The mandate is {(D.mandates.find((x) => x.key === st.mandate) || {}).label};
                this model is drawn for {model.goal.goal}.
              </span>
              <span className="btn-row">
                <button className="btn sm" onClick={() => setGoal(st.mandate)}>Discard</button>
                <Lock sleeve="core">
                  <button className="btn sm p" onClick={() => S.actions.setMandate(goal)}>Adopt as mandate</button>
                </Lock>
              </span>
            </div>
          )}

          {/* size */}
          <div style={{ padding: "9px 14px", borderBottom: "1px solid var(--g3)", display: "flex", alignItems: "center", gap: 14 }}>
            <span className="lbl" style={{ whiteSpace: "nowrap" }}>Modelled at</span>
            <span className="num" style={{ fontWeight: 600, fontSize: 15, minWidth: 66 }}>{short(aum)}</span>
            <input type="range" min="0" max="1000" step="1" value={Math.round(pos(aum) * 1000)}
              onChange={(e) => setAum(Math.round(fromPos(+e.target.value / 1000) / 1e5) * 1e5)}
              style={{ flex: 1, accentColor: "var(--navy)" }} />
            <div className="btn-row">
              {[10e6, 50e6, 100e6].map((a) => (
                <button key={a} className="btn sm" onClick={() => setAum(a)}>{short(a)}</button>
              ))}
              <button className={"btn sm" + (Math.abs(aum - t) < 1e5 ? " p" : "")} onClick={() => setAum(t)}>Today</button>
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

          {/* the one trend: alternatives against size */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--g3)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span className="lbl" style={{ whiteSpace: "nowrap" }}>Alternatives</span>
            <span className="tri" style={{ fontSize: 11.5 }}>across the classes above, not a fifth one</span>
            <span className="num" style={{ fontSize: 12.5 }}>
              <b>{u.pct(altNow)}</b> held · model {u.pct(model.alts)}
            </span>
            <svg className="spark" viewBox={"0 0 " + SW + " " + SH} width={SW} height={SH}
              style={{ flexShrink: 0, border: "1px solid var(--g3)", background: "var(--paper)" }}>
              <polyline points={spark} fill="none" stroke="var(--navy)" strokeWidth="1.5" />
              <circle cx={here.x} cy={here.y} r="2.5" fill="var(--ink)" />
            </svg>
            <span className="tri" style={{ fontSize: 11.5 }}>
              {u.pct(at10.alts)} at $10M → {u.pct(at100.alts)} at $100M · the illiquidity budget follows the size of
              the balance sheet that has to fund the calls
            </span>
            <span className="tri" style={{ fontSize: 11 }}>
              = private equity + venture + pre-IPO + private credit + real estate + infrastructure
            </span>
            <span style={{ flex: 1 }} />
            <span className="tri" style={{ fontSize: 11 }}>Class and subcategory only — never individual securities</span>
          </div>
        </div>
        {path && <PathModal rows={flat} t={t} model={{ label: model.goal.label + " · " + short(aum) }} onClose={() => setPath(false)} />}
      </>
    );
  }

  function PathModal({ rows, t, model, onClose }) {
    const ordered = rows.filter((r) => Math.abs(r.delta) > 0.2).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
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
          <thead><tr><th style={{ width: 28 }}>#</th><th>Action</th><th>Subcategory</th><th className="n">Amount</th><th>Execution</th></tr></thead>
          <tbody>
            {ordered.map((r, i) => {
              const add = r.delta > 0;
              const liquid = ["pubeq", "sov", "ig", "comm", "mmf", "tbill", "dep", "fx"].indexOf(r.key) >= 0;
              return (
                <tr key={r.key}>
                  <td className="tri num">{i + 1}</td>
                  <td><b>{r.cls === "cash" ? (add ? "Build" : "Deploy") : add ? (liquid ? "Buy" : "Commit") : (liquid ? "Sell" : "Redeem / list")}</b></td>
                  <td>{r.label}<div className="tsub">{u.clsLabel(r.cls)}</div></td>
                  <td className="n num">{u.usd(Math.abs((r.delta / 100) * t))}</td>
                  <td className="tri">{r.cls === "cash" ? "Sweep · same-day" : liquid ? "Order ticket · same-day settlement" : add ? "Subscription · next close" : "Secondary board or redemption queue"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="note mt12">
          Executing the liquid legs first funds the illiquid commitments without breaching the liquidity floor.
        </div>
      </Modal>
    );
  }

  /* ------------------------------------------------------ provenance */
  function ProvenancePanel({ positions }) {
    const [edit, setEdit] = useState(null);
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
          <div className="panel-hd">
            <div>
              <h3>Data provenance</h3>
              <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>
                {counts.live} live · {counts.hanwha} Hanwha-sourced · {counts.self} self-maintained
              </div>
            </div>
            {stale.length > 0 && <span className="bdg self warn"><i className="pt" />{stale.length} positions stale</span>}
          </div>
          <table className="t dense">
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
          </table>
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
        <div className="panel-hd">
          <div>
            <h3>All positions</h3>
            <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>
              The entire book at fund and deal level — {positions.length} positions ·{" "}
              {positions.filter((p) => p.liq === "Daily").length} listed ·{" "}
              {positions.filter((p) => p.liq !== "Daily").length} private. Any column sorts.
            </div>
          </div>
          <div className="btn-row">
            <button className={"btn sm" + (cls ? "" : " p")} onClick={() => setCls("")}>All</button>
            {D.classes.map((c) => (
              <button key={c.key} className={"btn sm" + (cls === c.key ? " p" : "")} onClick={() => setCls(c.key)}>{c.label}</button>
            ))}
            <div className="search" style={{ width: 210 }}>
              <input type="text" placeholder="Find a fund, deal or ticker" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="tscroll">
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
        </div>
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
        <div className="band mt16">
          <div className="cell"><div className="stat-l">Alpha sleeve</div><div className="stat-v"><Money v={av} compact /></div>
            <div className="stat-s">{u.pct((av / t) * 100)} of assets · target {u.pct(D.family.alphaTarget * 100)}</div></div>
          <div className="cell"><div className="stat-l">Unrealised P&L</div><div className="stat-v"><Delta v={u.unrealized(alpha)} usd /></div>
            <div className="stat-s">{u.sgn((u.unrealized(alpha) / (av - u.unrealized(alpha))) * 100)} on cost</div></div>
          <div className="cell"><div className="stat-l">Remaining capacity</div><div className="stat-v"><Money v={capacity} compact /></div>
            <div className="stat-s">commit directly up to this amount</div></div>
          <div className="cell"><div className="stat-l">Active private positions</div><div className="stat-v">{active.length}</div>
            <div className="stat-s">{u.usd(u.total(active))}</div></div>
          <div className="cell"><div className="stat-l">Core sleeve</div><div className="stat-v sm">Read-only</div>
            <div className="stat-s">{u.usd(t - av)} · Principal authority</div></div>
        </div>

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
              <span className="k">Alpha sleeve</span><span className="v">Full read/write</span>
              <span className="k">Core sleeve</span><span className="v">Read-only</span>
              <span className="k">Direct commitment limit</span><span className="v">{u.usd(capacity)}</span>
              <span className="k">Above that limit</span><span className="v">Proposal to the Principal</span>
            </div>
            <div className="note mt12">
              Core controls render disabled throughout the product, with the reason attached. Anything outside the sleeve
              can still be composed as a proposal — it queues in the Principal's approval inbox with your rationale.
            </div>
            <button className="btn mt12 block" onClick={() => S.navigate("/approvals")}>View submitted proposals</button>
          </Panel>
        </div>
      </>
    );
  }

  /* ------------------------------------------------------------- the page */
  function Portfolio() {
    const st = S.useStore();
    const isSuccessor = st.account === "successor";
    const [tab, setTab] = useState(isSuccessor ? "alpha" : "alloc");
    /* Switching account changes the home view, not just the permissions. */
    React.useEffect(() => { setTab(st.account === "successor" ? "alpha" : "alloc"); }, [st.account]);
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
      <div className="wrap page" style={{ paddingBottom: 110 }}>
        <div className="between">
          <div>
            <div className="eyebrow">{D.family.name} · {isSuccessor ? "Successor Mode" : "Sovereign Mode"}</div>
            <h1 className="mt8">Portfolio</h1>
          </div>
          <div className="right">
            <div className="tri" style={{ fontSize: 11.5 }}>
              Listed positions live · private marks as of 30 Jun 2026
            </div>
            <div className="num" style={{ fontSize: 12, marginTop: 2 }}>
              Updated {u.fmtTs(D.family.asOf)} KST
            </div>
            <div style={{ display: "flex", gap: 14, justifyContent: "flex-end", marginTop: 4 }}>
              {calls60.length > 0 && (
                <button className="link" onClick={() => setTab("liq")}>
                  {calls60.length} capital calls due within 60 days · {u.usdC(u.sum(calls60, (c) => c.amount))}
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

        <div className="band mt16">
          {isSuccessor ? (
            <>
              <div className="cell"><div className="stat-l">Alpha sleeve</div><div className="stat-v"><Money v={u.total(alpha)} compact /></div>
                <div className="stat-s">{u.pct((u.total(alpha) / t) * 100)} of assets</div></div>
              <div className="cell"><div className="stat-l">Alpha unrealised P&L</div><div className="stat-v"><Delta v={u.unrealized(alpha)} usd /></div>
                <div className="stat-s">on {u.usd(u.total(alpha) - u.unrealized(alpha))} of cost</div></div>
              <div className="cell"><div className="stat-l">Remaining capacity</div><div className="stat-v"><Money v={S.alphaCapacity()} compact /></div>
                <div className="stat-s">direct commitment limit</div></div>
              <div className="cell"><div className="stat-l">Total assets (read-only)</div><div className="stat-v"><Money v={t} compact /></div>
                <div className="stat-s">Core {u.usd(sl.core)} · Principal authority</div></div>
              <div className="cell"><div className="stat-l">Private assets</div><div className="stat-v">{u.pct(privShare)}</div>
                <div className="stat-s">{privCount} positions · locked or quarterly</div></div>
            </>
          ) : (
            <>
              <div className="cell"><div className="stat-l">Total assets</div><div className="stat-v"><Money v={t} compact /></div>
                <div className="stat-s">{ps.length} positions</div></div>
              <div className="cell"><div className="stat-l">Core / Alpha</div><div className="stat-v sm">{u.pct(sl.corePct)} / {u.pct(sl.alphaPct)}</div>
                <div className="stat-s">{u.usdC(sl.core)} · {u.usdC(sl.alpha)} — target 90 / 10</div></div>
              <div className="cell"><div className="stat-l">Unrealised P&L</div><div className="stat-v"><Delta v={u.unrealized(ps)} usd /></div>
                <div className="stat-s">{u.sgn((u.unrealized(ps) / (t - u.unrealized(ps))) * 100)} on cost</div></div>
              <div className="cell"><div className="stat-l">Liquidity · next 90 days</div><div className="stat-v"><Money v={liq.within90} compact /></div>
                <div className="stat-s">{u.usdC(liq.cash)} cash · {u.usdC(liq.listed)} listed</div></div>
              <div className="cell"><div className="stat-l">Private assets</div><div className="stat-v">{u.pct(privShare)}</div>
                <div className="stat-s">{privCount} positions · locked or quarterly · {ps.length - privCount} listed</div></div>
            </>
          )}
        </div>

        <div className="mt16"><Tabs tabs={tabs} active={tab} onChange={setTab} /></div>
        {tab === "alpha" && <AlphaTab positions={ps} />}
        {tab === "alloc" && <AllocationTab positions={ps} />}
        {tab === "liq" && <LiquidityTab positions={ps} />}
        {tab === "tax" && <TaxTab positions={ps} />}

        <QueryBar positions={ps} />
      </div>
    );
  }

  BB.pages = BB.pages || {};
  BB.pages.Portfolio = Portfolio;
})();
