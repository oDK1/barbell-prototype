/* /portfolio — the core screen. Default landing for both accounts. */
(function () {
  const { useState } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Money, Delta, Panel, Tabs, Seg, MiniBar, ProvBadge, Modal, GrowthFan } = BB.ui;
  const { runQuery } = BB.agent;

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
            positions”, “Korea equity”, “Hanwha-sourced”.
          </div>
        )}
        <div className="askrow">
          <span className="lbl" style={{ whiteSpace: "nowrap" }}>Portfolio Agent</span>
          <div className="search" style={{ flex: 1 }}>
            <input type="text" value={q} placeholder="What's my exposure to US data centers?"
              onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
              onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} />
          </div>
          <button className="btn sm" onClick={run}>Ask</button>
          {res && <button className="btn sm q" onClick={() => { setRes(null); setQ(""); }}>Clear</button>}
        </div>
      </div>
    );
  }

  /* The product should always show how the portfolio could be
     improved, including wider diversification across uncorrelated exposures.
     Tokenised fractional sizing is what makes that reachable at small ticket
     sizes — the sizing line below says so explicitly. */
  /* ------------------------------------------------------- the book, as a ring */
  /* Two segments, because the book has two parts. Held is the ring; the tick
     on the rim is what the family asked for, so a book that has drifted says
     so without a second chart. */
  function BookRing({ rows, total, onPick, active }) {
    const C = 150, RO = 138, RI = 92;
    const pt = (r, a) => [(C + r * Math.sin(a)).toFixed(2), (C - r * Math.cos(a)).toFixed(2)];
    const arc = (r0, r1, a0, a1) => {
      const big = a1 - a0 > Math.PI ? 1 : 0;
      const [x0, y0] = pt(r1, a0), [x1, y1] = pt(r1, a1);
      const [x2, y2] = pt(r0, a1), [x3, y3] = pt(r0, a0);
      return `M${x0} ${y0}A${r1} ${r1} 0 ${big} 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${big} 0 ${x3} ${y3}Z`;
    };
    let a = 0;
    const segs = rows.filter((r) => r.wt > 0).map((r) => {
      const a0 = a, a1 = a + (r.wt / 100) * Math.PI * 2;
      a = a1;
      return { ...r, a0, a1 };
    });
    /* the asked-for boundary, measured round the same circle */
    const markAt = (rows[0].target / 100) * Math.PI * 2;
    const [mx0, my0] = pt(RI - 6, markAt), [mx1, my1] = pt(RO + 6, markAt);
    const drifted = Math.abs(rows[0].drift) > 0.5;

    return (
      <svg viewBox="0 0 300 300" className="bookring" role="img"
        aria-label={"Book split: " + rows.map((r) => r.label + " " + u.pct(r.wt)).join(", ")}>
        {segs.map((r) => {
          const on = active === r.key, dim = active && !on;
          return (
            <path key={r.key} d={arc(on ? RI - 5 : RI, on ? RO + 5 : RO, r.a0, r.a1)}
              fill={r.color} stroke="var(--paper)" strokeWidth="2"
              opacity={dim ? .42 : 1} style={{ cursor: "pointer" }}
              onClick={() => onPick(r.key)}>
              <title>{r.label + " · " + u.pct(r.wt) + " · " + u.usdC(r.value) + " — click to open"}</title>
            </path>
          );
        })}
        {drifted && <line x1={mx0} y1={my0} x2={mx1} y2={my1} stroke="var(--ink)" strokeWidth="2" />}
        <text x={C} y={C - 4} textAnchor="middle" fill="var(--ink)"
          style={{ fontSize: 30, fontWeight: 600, fontVariantNumeric: "tabular-nums", letterSpacing: "-.025em" }}>
          {u.usdC(total)}
        </text>
        <text x={C} y={C + 18} textAnchor="middle" fill="var(--g2)"
          style={{ fontSize: 9.5, letterSpacing: ".11em" }}>TOTAL ASSETS</text>
      </svg>
    );
  }

  /* ------------------------------------------------------- allocation tab */
  function AllocationTab({ positions, openSignal }) {
    const t = u.total(positions);
    const st = S.useStore();
    /* Core arrives open: its three groups are the shape of the book, not a
       detail to go looking for. Frontier is one group and stays folded. */
    const [bOpen, setBOpen] = useState({ core: true });
    const mb = u.modelBook(positions, st.frontierPct);
    const [calls, setCalls] = useState(false);
    /* Clicking a segment of the ring opens the sleeve it stands for and takes
       you to it — the graphic is the way into the detail, not a decoration
       beside it. */
    const openSleeve = (k) => {
      setBOpen({ ...bOpen, [k]: true });
      setTimeout(() => {
        const el = document.getElementById("bk-" + k);
        if (el) el.scrollIntoView({ block: "center" });
      }, 40);
    };

    return (
      <>
        {/* Core and Frontier Growth, with Core opening onto its three groups
            and every group onto its lines. The model is published at three
            family sizes; the targets here are interpolated for this one. */}
        <div className="allocsplit mt16">
          <div className="ringwrap">
            <BookRing rows={mb.rows} total={t} onPick={openSleeve}
              active={Object.keys(bOpen).filter((k) => bOpen[k])[0] || null} />
            <div className="ringlegend">
              {mb.rows.map((r) => (
                <button key={r.key} className={"rl-row" + (bOpen[r.key] ? " on" : "")}
                  onClick={() => openSleeve(r.key)}>
                  <i style={{ background: r.color }} />
                  <span className="rl-n">{r.label}</span>
                  <span className="rl-w num">{u.pct(r.wt)}</span>
                  <span className="rl-t tri num">model {u.pct(r.target)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="buckets">
            {mb.rows.map((r) => {
              const open = !!bOpen[r.key];
              return (
                <div key={r.key} className="bk" id={"bk-" + r.key}>
                  <div className="bk-hd clickable" onClick={() => setBOpen({ ...bOpen, [r.key]: !open })}>
                    <div className="bk-id">
                      <i style={{ background: r.color }} />
                      <div>
                        <div className="bk-name">{r.label}</div>
                        <div className="bk-role">{r.role} · {r.band}</div>
                      </div>
                    </div>
                    <div className="bk-num">
                      <div className="num bk-wt">{u.pct(r.wt)}</div>
                      <div className="tri num">{u.usdC(r.value)} · model {u.pct(r.target)}</div>
                    </div>
                  </div>
                  <div className="bk-bar"><i style={{ width: Math.min(100, r.wt) + "%", background: r.color }} />
                    <b style={{ left: Math.min(100, r.target) + "%" }} /></div>
                  <div className="bk-ft">
                    <span className="tri">{r.count} positions{r.groups.length > 1 ? " · " + r.groups.length + " groups" : ""}</span>
                    <span className="tri">{u.pp(r.drift)} against the model</span>
                    <span className="spacer" />
                    <button className="link g" onClick={(e) => { e.stopPropagation(); setBOpen({ ...bOpen, [r.key]: !open }); }}>
                      {open ? "Hide" : "What is inside"}
                    </button>
                  </div>

                  {open && (
                    <div className="bk-in">
                      {r.groups.map((g) => (
                        <div key={g.key} className="agroup">
                          {r.groups.length > 1 && (
                            <div className="ag-hd">
                              <i style={{ background: g.color }} />
                              <span className="ag-n">{g.label}</span>
                              <span className="spacer" />
                              <span className="num ag-w">{u.pct(g.wt)}</span>
                              <span className="tri num">model {u.pct(g.target)}</span>
                            </div>
                          )}
                          <table className="t dense">
                            <thead><tr>
                              <th>Line</th><th className="hide-narrow">Access</th>
                              <th className="hide-narrow">Examples</th><th className="n">Yield / payoff</th>
                              <th className="n">Held</th><th className="n">Model</th><th className="n">Value</th>
                            </tr></thead>
                            <tbody>
                              {g.lines.map((l) => (
                                <tr key={l.key} className={l.count ? "" : "rung-muted"}>
                                  <td>
                                    <span className="rung-n">{l.label}</span>
                                    {l.offModel && <span className="bdg plain" style={{ marginLeft: 7 }}>off the model</span>}
                                    <div className="tsub">{l.count} position{l.count === 1 ? "" : "s"}</div>
                                  </td>
                                  <td className="tsub hide-narrow">{l.access}</td>
                                  <td className="tsub hide-narrow">{l.examples}</td>
                                  <td className="n num tri">{l.payoff}</td>
                                  <td className="n num">{u.pct(l.wt)}</td>
                                  <td className="n num tri">{u.pct(l.target)}</td>
                                  <td className="n num">{l.count ? u.usd(l.value) : <span className="tri">—</span>}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <QueryBar positions={positions} />

        <ModelPanel positions={positions} />

        {/* commitments already made: a calendar, not a liquidity problem —
            a call can be met from the credit facility or from a sale */}
        <div className="panel mt16" id="sec-calls">
          <div className="panel-hd clickable" onClick={() => setCalls(!calls)} style={{ cursor: "pointer" }}>
            <div>
              <h3><span style={{ fontSize: 11, color: "var(--g1)", marginRight: 7 }}>{calls ? "▾" : "▸"}</span>Committed capital calls</h3>
              <div className="tri" style={{ fontSize: 11.5, marginTop: 2, paddingLeft: 18 }}>
                {D.capitalCalls.length} contracted and projected · {u.usdC(u.sum(D.capitalCalls, (c) => c.amount))} over 24 months
              </div>
            </div>
            <button className="btn sm" onClick={(e) => { e.stopPropagation(); S.navigate("/credit"); }}>Cover from credit</button>
          </div>
          {calls && (
            <table className="t dense">
              <thead><tr><th>Fund</th><th>Date</th><th className="n">Amount</th><th>Status</th></tr></thead>
              <tbody>
                {D.capitalCalls.map((c) => (
                  <tr key={c.id}>
                    <td className="tname">{c.fund}</td>
                    <td>{u.fmtDate(c.date)}</td>
                    <td className="n num">{u.usd(c.amount)}</td>
                    <td><span className={"bdg " + (c.status === "Due" ? "warn" : "plain")}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <ProvenancePanel positions={positions} openSignal={openSignal} />
        <AllPositions positions={positions} />
      </>
    );
  }

  /* ------------------------------------------------- the model, in two parts */
  /* Two settings the family makes, and one that follows. How much sits in the
     anchor; what the anchor is asked to earn; and conviction, which is simply
     what is left. There is no asset allocation anywhere on this screen. */
  function ModelPanel({ positions }) {
    const st = S.useStore();
    const t = u.total(positions);
    const [fp, setFp] = useState(st.frontierPct);
    const pctA = 100 - fp;
    const [yld, setYld] = useState(st.targetYield);
    const floor = st.cashFloor;          /* fixed by the product, not by the family */
    React.useEffect(() => { setFp(st.frontierPct); setYld(st.targetYield); },
      [st.frontierPct, st.targetYield]);
    const [path, setPath] = useState(false);
    const [menu, setMenu] = useState(false);

    const conv = fp;
    const mp = u.modelBook(positions, fp);
    const anchorValue = (pctA / 100) * t;
    const built = u.buildAnchor(anchorValue, yld, floor);
    const lad = u.anchorLadder(positions, null);
    const themeRows = u.byTheme(positions, st.themes);
    const bk = u.byBucket(positions, conv);
    const anchorRow = bk[0], convRow = bk[1];
    const whatIf = fp !== st.frontierPct || yld !== st.targetYield;
    const confirmed = st.activity.find((a) => a.kind === "Mandate");

    const THUMB = 16;
    const fy = (v) => (v - D.SHELF_FLOOR) / (D.SHELF_CEIL - D.SHELF_FLOOR);
    const maxBar = Math.max(1, ...built.rows.map((r) => r.pct), built.cashPct);

    return (
      <>
        <div className="panel mt16" id="model-panel">
          <div className="panel-hd">
            <div>
              <h3>How this book is built</h3>
              <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>
                Two settings. Core is whatever Frontier Growth does not take.
              </div>
            </div>
            <button className="btn sm" onClick={() => setPath(true)}>What to do about it</button>
          </div>

          {/* 1 — risk preference, which the model says moves Frontier Growth
              inside a 10–20% band. Core is the remainder and splits itself. */}
          <div className="splitlever">
            <div className="sl-hd">
              <div className="lbl">1 · Frontier Growth</div>
              <div className="sl-read">
                <span className="sl-a num" style={{ color: "#9A7B2E" }}>{fp}</span>
                <span className="sl-sep">%</span>
              </div>
              <div className="sl-leg">
                <span><i style={{ background: "#1B2A4A" }} />Core {u.usdC(((100 - fp) / 100) * t)}</span>
                <span><i style={{ background: "#9A7B2E" }} />Frontier {u.usdC((fp / 100) * t)}</span>
              </div>
            </div>
            <div className="sl-track">
              <div className="sl-chips">
                {[10, 12, 15, 17, 20].map((v) => (
                  <button key={v} onClick={() => setFp(v)} className={fp === v ? "on" : ""}
                    style={{ left: "calc(" + (((v - 10) / 10) * 100) + "% + " + ((0.5 - (v - 10) / 10) * THUMB).toFixed(1) + "px)" }}>
                    {v}%
                  </button>
                ))}
              </div>
              <input type="range" min="10" max="20" step="1" value={fp}
                onChange={(e) => setFp(+e.target.value)} />
            </div>
            <div className="sl-inside tri">
              Core takes the rest and splits itself by the published model for a book this size —
              residence {u.pct(mp.groups[0].target)}, yield engines {u.pct(mp.groups[1].target)},
              traditional {u.pct(mp.groups[2].target)}.
            </div>
          </div>

          {/* 2 — what the anchor is asked to earn */}
          <div className="splitlever">
            <div className="sl-hd">
              <div className="lbl">2 · Yield engines target</div>
              <div className="sl-read">
                <span className="sl-a num" style={{ color: "#1B2A4A" }}>{yld.toFixed(1)}</span>
                <span className="sl-sep">%</span>
              </div>
              <div className="sl-leg">
                <span>built from <b>{built.rows.length}</b> {built.rows.length === 1 ? "fund" : "funds"} plus the cash reserve</span>
              </div>
            </div>
            <div className="sl-track">
              <div className="sl-chips">
                {[4, 6, 8, 10, 12].map((v) => (
                  <button key={v} onClick={() => setYld(v)} className={Math.abs(yld - v) < 0.05 ? "on" : ""}
                    style={{ left: "calc(" + (fy(v) * 100) + "% + " + ((0.5 - fy(v)) * THUMB).toFixed(1) + "px)" }}>
                    {v}%
                  </button>
                ))}
              </div>
              <input type="range" min={D.SHELF_FLOOR * 10} max={D.SHELF_CEIL * 10} step="1" value={Math.round(yld * 10)}
                onChange={(e) => setYld(+e.target.value / 10)} />
            </div>

            {/* the cash floor sits with the yield, because it is what makes the
                rest of the basket work harder */}
            <div className="sl-split">
              <div className="ss-l">
                <span className="lbl">Always in cash</span>
                <span className="ss-read num">{u.usdC(floor)}</span>
                <span className="tri" style={{ fontSize: 11 }}>
                  {u.pct(built.cashPct)} of the yield engines at {u.pct(D.cashFund.yield)}
                </span>
              </div>
              <span className="spacer" />
              <span className="tri" style={{ fontSize: 11 }}>Fixed — not a setting</span>
            </div>
            <div className="sl-inside tri">
              Holding {u.usdC(floor)} at {u.pct(D.cashFund.yield)} means the other {u.usdC(built.rest)} has to
              earn <b>{u.pct(built.needed)}</b> for the yield engines to return {yld.toFixed(1)}%.
              {!built.reachable && " That is past the top of the shelf — the basket is as high as it goes."}
            </div>

            {whatIf ? (
              <div className="lever-note warn">
                <span style={{ flex: 1 }}>
                  A what-if. The family holds <b>{st.frontierPct}%</b> in Frontier Growth, with the yield engines at <b>{st.targetYield}%</b>.
                </span>
                <span className="btn-row">
                  <button className="link g" onClick={() => { setFp(st.frontierPct); setYld(st.targetYield); }}>Discard</button>
                  <button className="btn sm p" onClick={() => {
                    S.actions.setFrontierPct(fp); S.actions.setTargetYield(yld);
                    S.actions.commitSplit();
                  }}>Adopt this</button>
                </span>
              </div>
            ) : (
              <div className="lever-note">
                <span style={{ flex: 1 }}>
<b>{pctA}%</b> Core · <b>{fp}%</b> Frontier Growth · yield engines at <b>{yld.toFixed(1)}%</b>
                  {confirmed ? " · confirmed " + u.fmtDate(confirmed.ts) : ""}
                </span>
                <button className="link g" onClick={() => S.navigate("/onboarding/mandate")}>Refine with 8 questions</button>
              </div>
            )}
          </div>

          {/* the basket that target buys — built, not chosen */}
          <div className="shelfwrap">
            <div className="shelf-hd">
              <span className="lbl">The basket this builds</span>
              <span className="tri" style={{ fontSize: 11.5 }}>
                {u.usdC(anchorValue)} across {built.rows.length + 1} funds, blended at <b>{u.pct(built.blended)}</b>
              </span>
            </div>
            <table className="t dense">
              <thead><tr><th style={{ width: 170 }}>Fund · named for its target</th><th>What it holds</th>
                <th className="n" style={{ width: 90 }}>Targets</th>
                <th style={{ width: "22%" }}>Weight</th>
                <th className="n" style={{ width: 80 }}>Of anchor</th>
                <th className="n" style={{ width: 110 }}>Amount</th></tr></thead>
              <tbody>
                <tr className="rung-cash">
                  <td><span className="rung-n">{D.cashFund.name}</span>
                    <div className="tsub">{D.cashFund.liq} · floor</div></td>
                  <td className="tsub">{D.cashFund.inside}</td>
                  <td className="n num tri">{u.pct(D.cashFund.yield)}</td>
                  <td><div className="wbar"><i style={{ width: (built.cashPct / maxBar) * 100 + "%", background: "#A9A396" }} /></div></td>
                  <td className="n num">{u.pct(built.cashPct)}</td>
                  <td className="n num">{u.usd(built.cash)}</td>
                </tr>
                {built.rows.map((f) => (
                  <tr key={f.band}>
                    <td><span className="rung-n">{f.name}</span>
                      <div className="tsub">{f.liq} · vol {u.pct(f.vol)}</div></td>
                    <td className="tsub">{f.inside}</td>
                    <td className="n num tri">{u.pct(f.band)}</td>
                    <td><div className="wbar"><i style={{ width: (f.pct / maxBar) * 100 + "%", background: "#1B2A4A" }} /></div></td>
                    <td className="n num">{u.pct(f.ofAnchor)}</td>
                    <td className="n num">{u.usd(f.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="shelf-ft tri">
              The basket is built for the target, not picked from a list. Raising the target narrows it toward the
              top of the shelf; lowering it narrows it toward the bottom.
              {Math.abs(lad.blended - yld) > 0.5 && <> Against this, what the family actually holds
                blends at <b>{u.pct(lad.blended)}</b>.</>}
            </div>
          </div>

          {/* Conviction shows what the family has picked. The rest of the menu
              is one click away but does not clutter the book with exposures
              nobody chose. */}
          <div className="themewrap">
            <div className="shelf-hd">
              <span className="lbl">3 · What conviction is pointed at</span>
              <span className="tri" style={{ fontSize: 11.5 }}>
                {u.usdC(convRow.value)} held · {u.pct(convRow.wt)} of the book against {u.pct(conv)} left for it
              </span>
              <span className="spacer" style={{ flex: 1 }} />
              <button className="link g" onClick={() => setMenu(!menu)}>
                {menu ? "Done" : "Change what is picked"}
              </button>
            </div>
            <div className="themes">
              {themeRows.filter((th) => st.themes.indexOf(th.key) >= 0 || th.count > 0).map((th) => (
                <button key={th.key} className={"th on" + (th.count ? " held" : "")}
                  onClick={() => S.actions.toggleTheme(th.key)} title={th.note}>
                  <span className="th-hd">
                    <i style={{ background: th.color }} />
                    <span className="th-n">{th.label}</span>
                    {th.flagged && <span className="bdg plain">open question</span>}
                  </span>
                  {th.sub && <span className="th-sub tri">{th.sub}</span>}
                  <span className="th-v num">
                    {th.count ? u.pct(th.wt) + " · " + u.usdC(th.value) : "picked, nothing held"}
                  </span>
                  {/* what the thing actually is to own, and through what */}
                  <span className="th-claim">
                    <b>{th.claim}</b>{th.candidates ? " · " + th.candidates : ""}
                  </span>
                </button>
              ))}
            </div>

            {menu && (() => {
              const rest = themeRows.filter((th) => st.themes.indexOf(th.key) < 0 && th.count === 0);
              return (
                <div className="themeadd">
                  <div className="lbl" style={{ marginBottom: 8 }}>Not picked</div>
                  {rest.length === 0
                    ? <div className="empty">Every exposure on the menu is picked.</div>
                    : <div className="themes">
                        {rest.map((th) => (
                          <button key={th.key} className="th" onClick={() => S.actions.toggleTheme(th.key)} title={th.note}>
                            <span className="th-hd">
                              <i style={{ background: th.color, opacity: .3 }} />
                              <span className="th-n">{th.label}</span>
                              {th.flagged && <span className="bdg plain">open question</span>}
                            </span>
                            {th.sub && <span className="th-sub tri">{th.sub}</span>}
                            <span className="th-v num">not picked</span>
                            <span className="th-claim"><b>{th.claim}</b>{th.candidates ? " · " + th.candidates : ""}</span>
                          </button>
                        ))}
                      </div>}
                </div>
              );
            })()}

            <div className="shelf-ft tri">
              Picking an exposure does not buy anything. It tells the marketplace what to rank first.
            </div>
          </div>

          <GrowthFan positions={positions} modelClasses={u.modelFour(yld, conv)}
            modelLabel={pctA + "% anchor at " + yld.toFixed(1) + "%"}
            collapsible defaultOpen={false} />
          <div style={{ padding: "8px 14px", borderTop: "1px solid var(--g3)", fontSize: 11, color: "var(--g2)" }}>
            Fund returns are targets and holding returns are expectations. Neither is a promise.
          </div>
        </div>
        {path && <PathModal positions={positions} lad={lad} bk={bk} themeRows={themeRows}
          built={built} yld={yld} t={t} onClose={() => setPath(false)} />}
      </>
    );
  }

  /* --------------------------------------------------- what to do about it */
  function PathModal({ positions, lad, bk, themeRows, built, yld, t, onClose }) {
    const convRow = bk[1];
    const items = [];

    const gap = lad.blended - yld;
    if (Math.abs(gap) > 0.75) items.push({
      t: "What is held blends at " + u.pct(lad.blended) + ", not " + yld.toFixed(1) + "%",
      d: gap < 0
        ? "It is " + u.pp(gap) + " short of the target. Moving capital into the basket closes it; so does lowering the target, which is the more honest fix if the risk is not wanted."
        : "It is " + u.pp(gap) + " ahead of the target, which means more risk is being carried than the family asked for.",
      cta: "Open the marketplace", to: "/marketplace",
    });

    if (Math.abs(convRow.drift) > 2) items.push({
      t: "Conviction is " + u.pct(convRow.wt) + " against " + u.pct(convRow.target) + " left for it",
      d: convRow.drift > 0
        ? "Single-name equity and private positions add up to more of a view than the anchor setting leaves room for. Nothing is wrong with that — but it was arrived at, not chosen."
        : "There is room for " + u.usdC((Math.abs(convRow.drift) / 100) * t) + " more conviction than is held.",
      cta: "Review the exposures", to: "/portfolio#model-panel",
    });

    /* Wider diversification across uncorrelated exposures. These used
       to sit in a panel of their own on the portfolio; they belong with the
       rest of what the family could act on. */
    const all = u.spread(positions, null);
    const conv = u.inBucket(positions, "conviction");
    const cs = u.spread(conv, null);
    const aff = u.affiliateExposure(positions);

    if (aff.wt > 5) items.push({
      t: "One company carries " + u.pct(aff.wt) + " of the book",
      d: aff.items.map((i) => i.name).join(", ") + ". The family's wealth and its income move together. Nothing here is uncorrelated with it.",
      cta: "See the holding", to: "/portfolio/equity?sub=pubeq",
    });
    if (all.topGeo && all.topGeo.wt > 40) items.push({
      t: all.topGeo.v + " is " + u.pct(all.topGeo.wt) + " of everything",
      d: "Geography is the cheapest uncorrelated exposure to add. Fractional tokenised sizing means a position no longer has to clear a fund minimum to be worth taking.",
      cta: "Find exposure elsewhere", to: "/marketplace?ask=" + encodeURIComponent("outside " + all.topGeo.v),
    });
    if (all.topSector && all.topSector.wt > 25) items.push({
      t: all.topSector.v + " runs through " + u.pct(all.topSector.wt) + " of the book",
      d: "Sector concentration survives any split between buckets — it does not show up against a yield target or an exposure menu.",
      cta: "Open the marketplace", to: "/marketplace",
    });
    if (cs.effective < 6 && cs.n > 0) items.push({
      t: "Conviction rests on " + cs.effective.toFixed(1) + " effective holdings",
      d: "A conviction sleeve is meant to be concentrated, but "
        + (cs.largest ? cs.largest.name + " alone is " + u.pct((cs.largest.value / t) * 100) + " of the book" : "it is narrow")
        + ". Splitting one ticket across several theses costs nothing once positions are fractional.",
      cta: "Widen the sleeve", to: "/marketplace?ask=" + encodeURIComponent("venture"),
    });

    themeRows.filter((th) => th.picked && th.count === 0 && !th.fixed).forEach((th) => items.push({
      t: th.label + " is picked, and empty",
      d: th.note + " Fractional tokenised sizing means a position here no longer has to clear a fund minimum to be worth taking.",
      cta: "Find " + th.label, to: "/marketplace?ask=" + encodeURIComponent(th.label),
    }));

    return (
      <Modal title="What to do about it" sub="Everything the book could be doing better, ordered by what it costs to leave alone" onClose={onClose} wide
        footer={<>
          <div className="tri" style={{ fontSize: 11.5 }}>Observations. Every decision is the family's.</div>
          <div className="btn-row">
            <button className="btn" onClick={onClose}>Close</button>
            <button className="btn p" onClick={() => { onClose(); S.navigate("/marketplace"); }}>Open the marketplace</button>
          </div>
        </>}>
        {items.length === 0
          ? <div className="empty">The book sits where the family asked it to.</div>
          : items.map((x, i) => (
            <div key={i} className="improve">
              <div className="imp-t">{x.t}</div>
              <div className="imp-d">{x.d}</div>
              <button className="btn sm mt8" onClick={() => { onClose(); S.navigate(x.to); }}>{x.cta} →</button>
            </div>
          ))}
      </Modal>
    );
  }


  function ProvenancePanel({ positions, openSignal }) {
    const [edit, setEdit] = useState(null);
    const [open, setOpen] = useState(false);
    /* the header's "positions stale" link opens this panel on its way here */
    React.useEffect(() => { if (openSignal) setOpen(true); }, [openSignal]);
    const self = positions.filter((p) => p.prov === "self");
    const stale = self.filter((p) => u.staleness(p).d > 90);
    const counts = {
      live: positions.filter((p) => p.prov === "live").length,
      hanwha: positions.filter((p) => p.prov === "hanwha").length,
      self: self.length,
    };
    return (
      <>
        <div className="panel mt16" id="sec-provenance">
          <div className="panel-hd clickable" onClick={() => setOpen(!open)} style={{ cursor: "pointer" }}>
            <div>
              <h3><span style={{ fontSize: 11, color: "var(--g1)", marginRight: 7 }}>{open ? "▾" : "▸"}</span>Where the marks come from</h3>
              <div className="tri" style={{ fontSize: 11.5, marginTop: 2, paddingLeft: 18 }}>
                {/* everything on the platform is priced by a market; the only
                    hand-kept numbers left are the holdings outside it */}
                {counts.live + counts.hanwha} priced by a market · {counts.self} hand-kept
                {open ? "" : " · open to review and update the hand-kept marks"}
              </div>
            </div>
            {stale.length > 0 && <span className="bdg self warn"><i className="pt" />{stale.length} positions stale</span>}
          </div>
          {open && <table className="t dense">
            <thead><tr><th>Hand-kept position</th><th>Source</th><th className="n">Carrying value</th><th className="n">Last updated</th><th></th></tr></thead>
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
                      
                        <button className="btn sm" onClick={() => setEdit(p)}>Update valuation</button>
                      
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
  /* Where a holding sits, in the structure the rest of the product uses:
     a rung of the anchor shelf, or a conviction theme. Never an asset class. */
  function placeOf(p) {
    if (u.bucketKeyOf(p) === "conviction") {
      const th = D.themes.find((x) => x.key === p.theme);
      return { bucket: "conviction", label: "Conviction", color: "#9A7B2E",
        detail: th ? th.label : "—", sortKey: "2" + (th ? th.label : "") };
    }
    const r = u.rungOf(p);
    const f = r === null ? null : D.anchorShelf.find((x) => x.band === r);
    return { bucket: "engine", label: "Anchor", color: "#1B2A4A",
      detail: f ? f.name + " fund" : "—",
      sortKey: "1" + String(r === null ? 0 : r).padStart(2, "0") };
  }

  function AllPositions({ positions }) {
    const [q, setQ] = useState("");
    const [cls, setCls] = useState("");
    const [sort, setSort] = useState({ k: "value", dir: -1 });
    const [show, setShow] = useState(false);
    const t = u.total(positions);

    const val = (p, k) => {
      if (k === "name") return p.name.toLowerCase();
      if (k === "cls") return placeOf(p).sortKey;
      if (k === "sub") return u.subLabel(p.sub);
      if (k === "prov") return u.provLabel(p);
      if (k === "liq") return u.markSource(p).label;
      if (k === "gain") return p.value - p.cost;
      if (k === "gainPct") return (p.value - p.cost) / p.cost;
      return p[k];
    };
    const rows = positions
      .filter((p) => !cls || (cls === "engine" || cls === "conviction"
        ? u.bucketKeyOf(p) === cls
        : cls.charAt(0) === "t" ? p.theme === cls.slice(1) : u.rungOf(p) === (cls === "below" ? null : +cls)))
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
              {positions.filter(u.isListed).length} listed ·{" "}
              {positions.filter((p) => !u.isListed(p)).length} private
              {show ? ". Any column sorts." : ". Open to search and sort it."}
            </div>
          </div>
          <div className="btn-row" onClick={(e) => e.stopPropagation()} style={{ display: show ? "flex" : "none" }}>
            <button className={"btn sm" + (cls ? "" : " p")} onClick={() => setCls("")}>All</button>
            <button className={"btn sm" + (cls === "engine" ? " p" : "")} onClick={() => setCls("engine")}>Anchor</button>
            <button className={"btn sm" + (cls === "conviction" ? " p" : "")} onClick={() => setCls("conviction")}>Conviction</button>
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
                <Th k="cls" label="Where it sits" />
                <Th k="sub" label="Instrument" />
                <Th k="prov" label="Provenance" />
                <Th k="liq" label="Marked by" />
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
                  <td>
                    <span style={{ display: "inline-flex", gap: 7, alignItems: "center", whiteSpace: "nowrap" }}>
                      <i className="sw" style={{ width: 8, height: 8, display: "inline-block",
                        background: placeOf(p).color }} />
                      {placeOf(p).label}
                    </span>
                    <div className="tsub">{placeOf(p).detail}</div>
                  </td>
                  <td>{u.subLabel(p.sub)}</td>
                  <td><ProvBadge p={p} showDate={false} /></td>
                  <td><span className="bdg plain">{u.markSource(p).label}</span></td>
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
  function TaxTab({ positions }) {
    const [sell, setSell] = useState(null);
    const lots = u.taxLots(positions).sort((a, b) => b.value - a.value);
    const realized = S.realizedBook();
    const harvest = lots.filter((l) => l.harvest);
    const nearLT = lots.filter((l) => !l.longTerm && l.held > 300);
    return (
      <>
        <div className="band mt16">
          <div className="cell"><div className="stat-l">Realised YTD</div><div className="stat-v"><Money v={realized} compact /></div><div className="stat-s">across {positions.filter((p) => p.realizedYTD).length} positions{S.get().realizedClosed ? " · incl. closed" : ""}</div></div>
          <div className="cell"><div className="stat-l">Unrealised</div><div className="stat-v"><Money v={u.unrealized(positions)} compact /></div></div>
          <div className="cell"><div className="stat-l">Long-term lots</div><div className="stat-v">{lots.filter((l) => l.longTerm).length} <span className="tri" style={{ fontSize: 13 }}>/ {lots.length}</span></div><div className="stat-s">held 12 months or more</div></div>
          <div className="cell"><div className="stat-l">Harvest candidates</div><div className="stat-v">{harvest.length}</div><div className="stat-s">listed positions below cost</div></div>
          <div className="cell"><div className="stat-l">Approaching long-term</div><div className="stat-v">{nearLT.length}</div><div className="stat-s">within 65 days</div></div>
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
                  <td className="right">
                    {/* a tax lot's whole point is the action it implies, so the
                        flag is the button: it opens a sell for the full position */}
                    {l.harvest && (
                      
                        <button className="btn sm harvest" onClick={() => setSell(l)}
                          title={"Sell " + l.name + " and realise " + u.usd(Math.abs(l.gain)) + " of loss"}>
                          Harvest {u.usdC(Math.abs(l.gain))}
                        </button>
                      
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="note mt16">
          Observations only. Barbell does not provide tax advice. Holding periods and classifications are computed from the
          reconciled book and should be confirmed with your tax adviser before any action.
        </div>

        {sell && (
          <BB.flows.TradeTicket instrument={sell} side="sell" amount0={sell.value}
            onClose={() => setSell(null)} />
        )}
      </>
    );
  }

  function Portfolio({ route }) {
    const st = S.useStore();
    const isSuccessor = st.account === "successor";
    const wanted = route && route.query && route.query.tab;
    const [tab, setTab] = useState(wanted || "alloc");
    /* Switching tab and scrolling are two paints apart: the tab's content does
       not exist until React has re-rendered, so the scroll waits for it. */
    const [focus, setFocus] = useState(null);
    /* useLayoutEffect runs after the DOM commit, so the newly-switched tab's
       markup already exists. Retries go through setTimeout rather than
       requestAnimationFrame, which never fires in a pane that is not
       painting. Collapsed targets open themselves first, so the retry covers
       the extra commit. */
    React.useLayoutEffect(() => {
      if (!focus) return;
      let tries = 0, timer = null;
      const find = () => {
        const el = document.getElementById(focus.id);
        if (!el) { if (tries++ < 20) timer = setTimeout(find, 16); return; }
        el.classList.add("flash");
        /* A collapsed target opens itself as it is reached, which moves it
           after the first scroll — so settle onto it rather than assuming one
           measurement holds. */
        let passes = 0;
        const settle = () => {
          const top = el.getBoundingClientRect().top;
          if (Math.abs(top - 78) > 4 && passes++ < 8) {
            window.scrollTo(0, Math.max(0, window.scrollY + top - 78));
            timer = setTimeout(settle, 40);
          } else {
            timer = setTimeout(() => el.classList.remove("flash"), 1200);
          }
        };
        settle();
      };
      find();
      return () => timer && clearTimeout(timer);
    }, [focus]);
    const jump = (t, id) => { setTab(t); setFocus({ id, n: Date.now() }); };
    /* Switching account changes the home view, not just the permissions. */
    React.useEffect(() => { setTab("alloc"); }, [st.account]);
    /* …and a link may ask for a particular tab. */
    React.useEffect(() => { if (wanted) setTab(wanted); }, [wanted]);
    const ps = st.positions;
    const t = u.total(ps);
    const cls = u.byClass(ps);
    const liq = u.exitToday(ps);
    const stale = ps.filter((p) => p.prov === "self" && u.staleness(p).d > 90);
    const calls90 = D.capitalCalls.filter((c) => u.days(D.TODAY, c.date) <= 90 && u.days(D.TODAY, c.date) >= 0);

    const tabs = [{ k: "alloc", label: "Allocation" }, { k: "tax", label: "Tax" }];

    return (
      <div className="wrap page hasagent">
        <div className="between" style={{ alignItems: "flex-start" }}>
          <div>
            <div className="eyebrow">{D.family.name} · {isSuccessor ? "Successor Mode" : "Sovereign Mode"}</div>
            {/* one number carries the page; everything else is a supporting line */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6 }}>
              <h1 className="num" style={{ fontSize: 34, letterSpacing: "-.03em", lineHeight: 1.05 }}>
                {u.usdC(t)}
              </h1>
              <span className="sub" style={{ fontSize: 13.5 }}>Total assets</span>
            </div>
          </div>
          <div className="right">
            <div className="num tri" style={{ fontSize: 11.5 }}>Updated {u.fmtTs(D.family.asOf)} KST</div>
            <div style={{ display: "flex", gap: 14, justifyContent: "flex-end", marginTop: 5 }}>
              {calls90.length > 0 && (
                <button className="link" onClick={() => jump("alloc", "sec-calls")}>
                  {calls90.length} capital calls within 90 days · {u.usdC(u.sum(calls90, (c) => c.amount))}
                </button>
              )}
              {stale.length > 0 && (
                <button className="link" onClick={() => jump("alloc", "sec-provenance")}>
                  <span className="stale-dot" />{stale.length} positions stale
                </button>
              )}
            </div>
          </div>
        </div>

        {/* secondary figures, deliberately quiet */}
        <div className="subline">
          {[["Unrealised", <Delta v={u.unrealized(ps)} usd />, u.sgn((u.unrealized(ps) / (t - u.unrealized(ps))) * 100) + " on cost"]].map((m, i) => (
            <span className="item" key={i}>
              <span className="k">{m[0]}</span>
              <span className="v num">{m[1]}</span>
              <span className="n">{m[2]}</span>
            </span>
          ))}
        </div>

        <div className="mt16"><Tabs tabs={tabs} active={tab} onChange={setTab} /></div>
        {tab === "alloc" && <AllocationTab positions={ps} openSignal={focus && focus.id === "sec-provenance" ? focus.n : 0} />}
        {tab === "tax" && <TaxTab positions={ps} />}

        {tab !== "alloc" && <QueryBar positions={ps} />}
      </div>
    );
  }

  BB.pages = BB.pages || {};
  BB.pages.Portfolio = Portfolio;
})();
