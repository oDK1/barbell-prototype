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
    /* the Core / Frontier boundary the model asks for, measured round the
       same circle — drawn only when the book has actually drifted off it */
    const coreTarget = rows[0].target;
    const coreHeld = rows[0].wt;
    const markAt = (coreTarget / 100) * Math.PI * 2;
    const [mx0, my0] = pt(RI - 6, markAt), [mx1, my1] = pt(RO + 6, markAt);
    const drifted = Math.abs(coreHeld - coreTarget) > 0.5;

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
            {/* the two sleeves, and only those. The groups inside Core are a
                level down, where the Core card already carries them. */}
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

                  {/* Core stops at its three groups. Frontier has no groups
                      of its own, so it opens onto the model's lines — which
                      are the interesting part of it. */}
                  {open && r.groups.length > 1 && (
                    <div className="bk-in">
                      <table className="t dense">
                        <thead><tr><th>Group</th><th className="hide-narrow">What it is for</th>
                          <th className="n">Held</th><th className="n">Model</th>
                          <th className="n">Against model</th><th className="n">Value</th></tr></thead>
                        <tbody>
                          {r.groups.map((g) => (
                            <tr key={g.key}>
                              <td>
                                <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                                  <i className="sw" style={{ width: 9, height: 9, display: "inline-block", background: g.color }} />
                                  <span className="rung-n">{g.label}</span>
                                </span>
                                <div className="tsub">{g.count} position{g.count === 1 ? "" : "s"}</div>
                              </td>
                              <td className="tsub hide-narrow" style={{ maxWidth: 360 }}>{g.note}</td>
                              <td className="n num">{u.pct(g.wt)}</td>
                              <td className="n num tri">{u.pct(g.target)}</td>
                              <td className="n"><VsTarget v={g.drift} /></td>
                              <td className="n num">{g.value ? u.usd(g.value) : <span className="tri">—</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {open && r.groups.length === 1 && (
                    <div className="bk-in">
                      <table className="t dense">
                        <thead><tr>
                          <th>Line</th><th className="hide-narrow">Access</th>
                          <th className="hide-narrow">Examples</th><th className="n">Yield / payoff</th>
                          <th className="n">Held</th><th className="n">Model</th><th className="n">Value</th>
                        </tr></thead>
                        <tbody>
                          {r.groups[0].lines.map((l) => (
                            <tr key={l.key} className={l.count ? "" : "rung-muted"}>
                              <td>
                                <span className="rung-n">{l.label}</span>
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

  /* ------------------------------------------------- the model portfolio ----
     Two levers and the shape they produce. Size and risk preference are the
     only things a family sets here; everything else — the four group weights
     and the portfolio yield they imply — follows from the published model. */
  function TierBar({ groups }) {
    return (
      <div className="tierbar">
        {groups.filter((g) => g.pct > 0.4).map((g) => (
          <div key={g.key} className="tb-seg" style={{ width: g.pct + "%", background: g.color }}
            title={g.label + " · " + u.pct(g.pct)}>
            <span style={{ color: g.key === "residence" ? "var(--ink)" : "#FAFAF8" }}>{u.pct(g.pct, 0)}</span>
          </div>
        ))}
      </div>
    );
  }

  function ModelPanel({ positions }) {
    const st = S.useStore();
    const t = u.total(positions);
    const [fp, setFp] = useState(st.frontierPct);
    const [aumM, setAumM] = useState(u.total(positions) / 1e6);
    React.useEffect(() => { setFp(st.frontierPct); }, [st.frontierPct]);
    const [path, setPath] = useState(false);

    const mb = u.modelBook(positions, fp);
    const mine = u.tierShape(aumM, fp);
    const atToday = Math.abs(aumM - t / 1e6) < 0.5;
    const aumVal = aumM * 1e6;
    const whatIf = fp !== st.frontierPct;
    const confirmed = st.activity.find((a) => a.kind === "Mandate");

    const THUMB = 16;
    /* log rail: 0 at $10M, 1 at $1B */
    const aPos = (m) => (Math.log10(Math.max(10, Math.min(1000, m))) - 1) / 2;
    const aFrom = (v) => Math.pow(10, 1 + v * 2);
    const shortM = (m) => m >= 1000 ? "$" + (m / 1000).toFixed(m % 1000 ? 1 : 0) + "B" : "$" + Math.round(m) + "M";

    return (
      <>
        <div className="panel mt16" id="model-panel">
          <div className="panel-hd">
            <div>
              <h3>As wealth grows, the frontier widens and fixed needs shrink</h3>
              <div className="tri" style={{ fontSize: 11.5, marginTop: 3, maxWidth: "88ch", lineHeight: 1.55 }}>
                Every family holds a barbell: an 80–90% core that protects principal, compounds and funds
                spending, and a 10–20% frontier of asymmetric bets.
              </div>
            </div>
            <button className="btn sm" onClick={() => setPath(true)}>What to do about it</button>
          </div>

          {/* the two levers, and nothing else to set */}
          <div className="levers2">
            <div className="lv">
              <div className="lv-hd">
                <span className="lbl">Size</span>
                <span className="spacer" />
                <span className="num lv-v">{shortM(aumM)}</span>
              </div>
              <div className="sl-track">
                <div className="sl-chips">
                  {[10, 100, 1000].map((m) => (
                    <button key={m} onClick={() => setAumM(m)} className={Math.abs(aumM - m) < 0.5 ? "on" : ""}
                      style={{ left: "calc(" + (aPos(m) * 100) + "% + " + ((0.5 - aPos(m)) * THUMB).toFixed(1) + "px)" }}>
                      {shortM(m)}
                    </button>
                  ))}
                </div>
                <input type="range" min="0" max="1000" step="1" value={Math.round(aPos(aumM) * 1000)}
                  onChange={(e) => setAumM(aFrom(+e.target.value / 1000))} />
              </div>
              <div className="lv-ft tri">
                {atToday
                  ? <>Today's assets.</>
                  : <>A what-if — today's assets are {u.usdC(t)}. <button className="link g" onClick={() => setAumM(t / 1e6)}>Back to today</button></>}
              </div>
            </div>

            <div className="lv">
              <div className="lv-hd">
                <span className="lbl">Risk preference</span>
                <span className="spacer" />
                <span className="num lv-v" style={{ color: "#C6A64E" }}>{fp}%</span>
              </div>
              <div className="sl-track">
                <div className="sl-chips">
                  {[0, 5, 10, 15, 20].map((v) => (
                    <button key={v} onClick={() => setFp(v)} className={fp === v ? "on" : ""}
                      style={{ left: "calc(" + ((v / 20) * 100) + "% + " + ((0.5 - v / 20) * THUMB).toFixed(1) + "px)" }}>
                      {v}%
                    </button>
                  ))}
                </div>
                <input type="range" min="0" max="20" step="1" value={fp}
                  onChange={(e) => setFp(+e.target.value)} />
              </div>
              <div className="lv-ft tri">
                Frontier Growth · {u.usdC((fp / 100) * aumVal)}
                {fp < 10 ? " — below the model's 10% floor, so the barbell stops being one." : "."}
              </div>
            </div>
          </div>

          {/* the shape those two produce */}
          <div className="tiers">
            <div className="tier mine">
              <div className="tier-hd">
                <span className="tier-n">{atToday ? "This family · " + u.usdC(t) : "Modelled at " + shortM(aumM)}</span>
                <span className="spacer" />
                <span className="tri">Portfolio yield {u.pct(mine.yieldPct)} of net worth</span>
              </div>
              <TierBar groups={mine.groups} />
            </div>
            <div className="tierlegend">
              {D.allocGroups.map((g) => (
                <span key={g.key}><i style={{ background: g.color }} />{g.label} {u.pct(mine.groups.find((x) => x.key === g.key).pct)}</span>
              ))}
            </div>
          </div>

          {whatIf ? (
            <div className="lever-note warn" style={{ margin: "0 14px 14px" }}>
              <span style={{ flex: 1 }}>A what-if. The family holds <b>{st.frontierPct}%</b> in Frontier Growth.</span>
              <span className="btn-row">
                <button className="link g" onClick={() => setFp(st.frontierPct)}>Discard</button>
                <button className="btn sm p" onClick={() => { S.actions.setFrontierPct(fp); S.actions.commitSplit(); }}>Adopt this</button>
              </span>
            </div>
          ) : (
            <div className="lever-note" style={{ margin: "0 14px 14px" }}>
              <span style={{ flex: 1 }}>
                <b>{100 - fp}%</b> Core · <b>{fp}%</b> Frontier Growth
                {confirmed ? " · confirmed " + u.fmtDate(confirmed.ts) : ""}
              </span>
              <button className="link g" onClick={() => S.navigate("/onboarding/mandate")}>Refine with 8 questions</button>
            </div>
          )}

          <GrowthFan positions={positions} modelClasses={u.modelFour(8, fp)}
            modelLabel={(100 - fp) + " / " + fp + " barbell"}
            collapsible defaultOpen={false} />
          <div style={{ padding: "8px 14px", borderTop: "1px solid var(--g3)", fontSize: 11, color: "var(--g2)" }}>
            Yields are illustrative, net of vehicle fees and before personal tax. Frontier returns are not modelled.
          </div>
        </div>
        {path && <PathModal positions={positions} mb={mb} fp={fp} t={t} onClose={() => setPath(false)} />}
      </>
    );
  }

  function PathModal({ positions, mb, fp, t, onClose }) {
    const items = [];

    /* where the book sits against the model it was given */
    mb.groups.filter((g) => Math.abs(g.drift) > 1.5).forEach((g) => items.push({
      t: g.label + " is " + u.pct(g.wt) + " against " + u.pct(g.target),
      d: g.drift > 0
        ? u.usdC((g.drift / 100) * t) + " more than the model asks for. " + g.note
        : "Room for " + u.usdC((Math.abs(g.drift) / 100) * t) + " more. " + g.note,
      cta: "Open the marketplace", to: "/marketplace",
    }));

    /* lines the model asks for and the book does not hold at all */
    mb.lines.filter((l) => l.count === 0 && l.target > 1).forEach((l) => items.push({
      t: l.label + " is empty against " + u.pct(l.target),
      d: l.examples + " · " + l.access + ". That is " + u.usdC((l.target / 100) * t) + " the model puts somewhere the book does not.",
      cta: "Find it", to: "/marketplace?ask=" + encodeURIComponent(l.label),
    }));

    /* and lines held well past what the model wants */
    mb.lines.filter((l) => l.count > 0 && l.drift > 4).forEach((l) => items.push({
      t: l.label + " is " + u.pct(l.wt) + " against " + u.pct(l.target),
      d: l.offModel
        ? "The model asks for none of this and the book holds " + u.usdC(l.value) + ". It would rather own that risk through the credit lines than through buildings."
        : u.usdC((l.drift / 100) * t) + " more than the model asks for.",
      cta: "Review it", to: "/portfolio",
    }));

    /* concentration the allocation does not show */
    const all = u.spread(positions, null);
    const aff = u.affiliateExposure(positions);
    if (aff.wt > 5) items.push({
      t: "One company carries " + u.pct(aff.wt) + " of the book",
      d: aff.items.map((i2) => i2.name).join(", ") + ". The family's wealth and its income move together.",
      cta: "See the holding", to: "/portfolio/equity?sub=pubeq",
    });
    if (all.topGeo && all.topGeo.wt > 40) items.push({
      t: all.topGeo.v + " is " + u.pct(all.topGeo.wt) + " of everything",
      d: "Geography is the cheapest uncorrelated exposure to add, and fractional sizing means a position no longer has to clear a fund minimum to be worth taking.",
      cta: "Find exposure elsewhere", to: "/marketplace?ask=" + encodeURIComponent("outside " + all.topGeo.v),
    });

    return (
      <Modal title="What to do about it" sub="Everything the book could be doing better, ordered by what it costs to leave alone"
        onClose={onClose} wide
        footer={<>
          <div className="tri" style={{ fontSize: 11.5 }}>Observations. Every decision is the family's.</div>
          <div className="btn-row">
            <button className="btn" onClick={onClose}>Close</button>
            <button className="btn p" onClick={() => { onClose(); S.navigate("/marketplace"); }}>Open the marketplace</button>
          </div>
        </>}>
        {items.length === 0
          ? <div className="empty">The book sits where the family asked it to.</div>
          : items.map((x, i2) => (
            <div key={i2} className="improve">
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
