/* /marketplace — one ranked surface, ordered by how well each offering suits
   this family. The model allocation is context in the sidebar, not the
   organising principle. No public/private tabs. */
(function () {
  const { useState } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Money, Delta, Panel, Fit, Lock, AgentBar } = BB.ui;
  const { askMarket } = BB.agent;

  function Row({ m, sug, onOpen, onAct }) {
    const st = S.get();
    const isListed = m.kind === "listed";
    const place = u.offerPlace(m);
    const dep = u.depthOf(m);
    return (
      <tr className="clickable" onClick={() => onOpen(m)}>
        <td style={{ minWidth: 260 }}>
          <div className="tname">{m.name}</div>
          <div className="tsub" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span>{m.ticker ? <span className="mono">{m.ticker}</span> : m.manager}</span>
            {/* Hanwha's involvement is the trust signal, so say which
                kind it is rather than flagging every row the same way. */}
            {m.source
              ? <span className="bdg src" style={{ borderColor: (D.sourceTypes.find((x) => x.key === m.source) || {}).color }}>
                  <i className="pt" style={{ background: (D.sourceTypes.find((x) => x.key === m.source) || {}).color }} />
                  {(D.sourceTypes.find((x) => x.key === m.source) || {}).label}
                </span>
              : m.hanwha && <span className="bdg hanwha"><i className="pt" />Hanwha-sourced</span>}
            {m.trust && <span className={"trustfit sm " + m.trust}><i />{m.trust}</span>}
          </div>
        </td>
        {/* where this lands: a rung of the anchor shelf, or a conviction theme */}
        <td>
          <span style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>
            <i className="sw" style={{ width: 8, height: 8, display: "inline-block", background: place.color }} />
            <span className="tname" style={{ fontSize: 12 }}>{place.label}</span>
          </span>
          <div className="tsub">{place.detail}</div>
        </td>
        <td className="n">
          {place.bucket === "conviction"
            ? <><span className="tri">—</span>
                <div className="tsub">thesis, not a target</div></>
            : <span className="num">{m.ret}</span>}
        </td>
        {/* everything settles same day, so the question is size, not timing */}
        <td>
          {dep
            ? <><span className="depth" style={{ color: dep.color, borderColor: dep.color }}>
                  <i style={{ background: dep.color }} />{dep.label}
                </span>
                <div className="tsub num">{u.usdC(dep.clears)} clears at the mark</div></>
            : <span className="tri">—</span>}
        </td>
        <td className="n">
          {sug
            ? <><span className="num" style={{ fontWeight: 600, opacity: sug.unfunded ? .5 : 1 }}>{u.usdC(sug.amount)}</span>
              <div className="tsub">{sug.basis}</div></>
            : <span className="tri">—</span>}
        </td>

        <td className="n"><Fit score={m.s ? m.s.score : m.fit} /></td>
        <td className="hide-narrow" style={{ maxWidth: 260 }}><div className="tsub" style={{ fontSize: 11.5, color: "var(--g1)" }}>{m.why}</div></td>
        <td className="right">
          <div className="rowbtns">
            
              <button className="btn sm p" onClick={(e) => { e.stopPropagation(); onAct(m, sug && sug.amount); }}>
                {isListed ? "Buy" : "Commit"}
              </button>
            
          </div>
        </td>
      </tr>
    );
  }

  function Head() {
    return (
      <thead>
        <tr>
          <th>Opportunity</th><th>Where it lands</th><th className="n">Target yield</th><th>Liquidity depth</th>
          <th className="n">Suggested</th><th className="n">Fit</th>
          <th className="hide-narrow" style={{ minWidth: 170 }}>Why</th><th></th>
        </tr>
      </thead>
    );
  }

  function Marketplace({ route }) {
    const st = S.useStore();
    const [f, setF] = useState({ bucket: "", rung: "", theme: "", src: "", trust: "", depth: "", sector: "", geo: "", ret: "" });
    const [q, setQ] = useState("");
    const [act, setAct] = useState(null);
    const [ask, setAsk] = useState("");
    const [asked, setAsked] = useState(null);
    /* A question asked on a deal page lands here as ?ask=, so the answer is
       the ranked list rather than a second result surface. */
    const wantAsk = route.query.ask;
    const gapFocus = route.query.gap;
    const isSuccessor = st.account === "successor";

    /* The marketplace carries private-market offerings only. Listed instruments
       are not transacted on this surface. */
    const offered = D.market.filter((m) => m.kind === "private");

    const t = u.total(st.positions);
    const model = u.modelWeights(t, st.mandate);

    const pass = (m) => {
      if (gapFocus && m.fills !== gapFocus) return false;
      if (f.bucket && u.offerBucket(m) !== f.bucket) return false;
      if (f.rung && u.offerRung(m) !== +f.rung) return false;
      if (f.theme && u.offerTheme(m) !== f.theme) return false;
      if (f.src && m.source !== f.src) return false;
      if (f.trust && m.trust !== f.trust) return false;
      if (f.depth && (u.depthOf(m) || {}).key !== f.depth) return false;
      if (f.sector && m.sector !== f.sector) return false;
      if (f.geo && u.geoBucket(m.geo) !== f.geo) return false;
      if (f.ret && (u.offerBucket(m) === "conviction" || m.retNum < +f.ret)) return false;
      if (q && !(m.name + " " + (m.ticker || "") + " " + m.sector).toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    };
    const ctx = u.marketContext(st.positions, st.mandate, st.realizedClosed);
    const scored = offered.map((m) => ({ ...m, s: u.scoreFor(m, ctx) }));
    const all = (asked && asked.rows.length ? asked.rows : scored.filter(pass)).sort((a, b) => b.s.score - a.s.score);
    const top3 = all.slice(0, 3);
    /* what could actually fund a purchase today */
    const funds = u.total(st.positions.filter((x) => x.cls === "cash"));
    const sectors = Array.from(new Set(offered.map((m) => m.sector))).sort();

    React.useEffect(() => {
      if (!wantAsk) return;
      setAsk(wantAsk);
      setAsked(askMarket(wantAsk, scored, ctx));
    }, [wantAsk]);

    const open = (m) => S.navigate("/marketplace/" + m.id);
    const onAct = (m, amount) => setAct({ m, amount });


    return (
      <div className="wrap page hasagent">
        <div className="between">
          <div>
            <h1>Marketplace</h1>
          </div>
        </div>

        <div className="row mt16" style={{ alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* filters */}
            <div className="panel">
              <div className="panel-bd">
                <div className="filters">
                  <div className="f-item search">
                    <input type="text" placeholder="Search opportunities" value={q} onChange={(e) => setQ(e.target.value)} />
                  </div>
                  {/* no asset-class filter: the board is filtered by what a
                      listing is for, which is a rung or a theme */}
                  <div className="f-item"><label className="f"><span>Bucket</span>
                    <select value={f.bucket} onChange={(e) => setF({ ...f, bucket: e.target.value, rung: "", theme: "" })}>
                      <option value="">Any</option>
                      <option value="engine">Anchor</option>
                      <option value="conviction">Conviction</option>
                    </select></label></div>
                  {f.bucket !== "conviction" && (
                    <div className="f-item"><label className="f"><span>Anchor rung</span>
                      <select value={f.rung} onChange={(e) => setF({ ...f, rung: e.target.value })}>
                        <option value="">Any</option>
                        {D.anchorShelf.map((x) => <option key={x.band} value={x.band}>{x.name} · {x.band}%</option>)}
                      </select></label></div>
                  )}
                  {f.bucket !== "engine" && (
                    <div className="f-item"><label className="f"><span>Theme</span>
                      <select value={f.theme} onChange={(e) => setF({ ...f, theme: e.target.value })}>
                        <option value="">Any</option>
                        {D.themes.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
                      </select></label></div>
                  )}
                  <div className="f-item"><label className="f"><span>Source</span>
                    <select value={f.src} onChange={(e) => setF({ ...f, src: e.target.value })}>
                      <option value="">Any</option>{D.sourceTypes.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select></label></div>
                  <div className="f-item"><label className="f"><span>Liquidity depth</span>
                    <select value={f.depth} onChange={(e) => setF({ ...f, depth: e.target.value })}>
                      <option value="">Any</option>
                      {D.depthTiers.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                    </select></label></div>
                  <div className="f-item"><label className="f"><span>Trust fit</span>
                    <select value={f.trust} onChange={(e) => setF({ ...f, trust: e.target.value })}>
                      <option value="">Any</option>
                      <option value="strong">Strong</option>
                      <option value="partial">Partial</option>
                      <option value="weak">Weak</option>
                    </select></label></div>
                  <div className="f-item"><label className="f"><span>Sector</span>
                    <select value={f.sector} onChange={(e) => setF({ ...f, sector: e.target.value })}>
                      <option value="">Any</option>{sectors.map((s) => <option key={s}>{s}</option>)}
                    </select></label></div>
                  <div className="f-item"><label className="f"><span>Geography</span>
                    <select value={f.geo} onChange={(e) => setF({ ...f, geo: e.target.value })}>
                      <option value="">Any</option>{u.GEO_BUCKETS.map((g) => <option key={g}>{g}</option>)}
                    </select></label></div>
                  <div className="f-item"><label className="f"><span>Target yield</span>
                    <select value={f.ret} onChange={(e) => setF({ ...f, ret: e.target.value })}>
                      <option value="">Any</option><option value="4">4%+</option><option value="6">6%+</option>
                      <option value="8">8%+</option><option value="12">12%+</option>
                    </select></label></div>
                  <button className="btn" onClick={() => { setF({ cls: "", liq: "", sector: "", geo: "", ret: "" }); setQ(""); }}>Reset</button>
                </div>
              </div>
            </div>

            <div className="between mt24 mb12">
              <h2>{asked && asked.rows.length ? asked.label : gapFocus ? u.subLabel(gapFocus) : "Ranked for this family"}</h2>
              <div className="btn-row">
                {gapFocus && <button className="btn sm" onClick={() => S.navigate("/marketplace")}>Show everything</button>}
                <span className="tri" style={{ fontSize: 11.5 }}>{all.length} of {offered.length} shown</span>
              </div>
            </div>
            <div className="panel">
              {all.length === 0 ? (
                <div className="empty">
                  <div>Nothing on the marketplace matches these filters.</div>
                  <div className="tri mt8" style={{ fontSize: 12 }}>
                    Allocation here is finite. Members sell positions they already hold on the secondary board —{" "}
                    {st.listings.filter((l) => l.status === "Open").length} listings are open.
                  </div>
                  <button className="btn mt12" onClick={() => S.navigate("/secondary")}>Look at the secondary board</button>
                </div>
              ) : (
                <div className="tscroll">
                  <table className="t dense"><Head />
                    <tbody>{all.map((m) => <Row key={m.id} m={m} sug={u.suggestAmount(m, ctx, funds)} onOpen={open} onAct={onAct} />)}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* sidebar */}
          <div style={{ width: 280, flexShrink: 0 }}>
            {/* the buying surface answers to the same two buckets as
                the portfolio. The six classes stay one level down. */}
            <Panel title="Allocation context">
              {/* the two sleeves, which is as much as a buying decision needs */}
              {u.modelBook(st.positions, st.frontierPct).rows.map((b) => (
                <div key={b.key} className="mkb">
                  <div className="mkb-hd">
                    <i style={{ background: b.color }} />
                    <span className="mkb-n">{b.label}</span>
                    <span className="spacer" />
                    <span className="num mkb-w">{u.pct(b.wt)}</span>
                  </div>
                  <div className="bk-bar"><i style={{ width: Math.min(100, b.wt) + "%", background: b.color }} />
                    <b style={{ left: Math.min(100, b.target) + "%" }} /></div>
                  <div className="mkb-ft tri">
                    model {u.pct(b.target)} · {u.pp(b.drift)}
                  </div>
                </div>
              ))}
              <button className="btn sm block mt8" onClick={() => S.navigate("/portfolio")}>Open the model</button>
            </Panel>

            <div className="mt16">
              <Panel title="Invitations">
                <table className="t dense">
                  <tbody>
                    {st.referrals.invites.slice(0, 5).map((i) => (
                      <tr key={i.id}>
                        <td><div className="tname" style={{ fontSize: 12 }}>{i.to}</div><div className="tsub">{i.deal}</div></td>
                        <td className="n"><span className="bdg plain">{i.state}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            </div>

            <div className="mt16">
              {/* nothing has a notice period and everything has a price, so
                  what is worth knowing here is what the book will carry */}
              <Panel title="Credit context">
                <div className="kv">
                  <span className="k">Borrowing power</span><span className="v">{u.usdC(ctx.credit.now)}</span>
                  <span className="k">Rate</span><span className="v">{u.pct(ctx.credit.rate)}</span>
                  <span className="k">Calls · next 90 days</span><span className="v">{u.usdC(ctx.calls90)}</span>
                  <span className="k">Calls · 24 months</span><span className="v">{u.usdC(ctx.calls24)}</span>
                </div>
                <div className="tri mt8" style={{ fontSize: 11, lineHeight: 1.5 }}>
                  A commitment can be met from the facility instead of from a sale.
                </div>
                <button className="btn sm block mt8" onClick={() => S.navigate("/portfolio?tab=credit")}>Open the credit view</button>
              </Panel>
            </div>

            <div className="mt16">
              <Panel title="Tax context">
                <div className="kv">
                  <span className="k">Realised year to date</span><span className="v">{u.usdC(ctx.tax.realized)}</span>
                  <span className="k">Harvestable loss</span>
                  <span className="v">{u.usdC(ctx.tax.harvestable)}{ctx.tax.harvestCount ? " · " + ctx.tax.harvestCount + " lots" : ""}</span>
                </div>
                <button className="btn sm block mt8" onClick={() => S.navigate("/portfolio?tab=tax")}>Open the tax view</button>
              </Panel>
            </div>

          </div>
        </div>

        {/* agent — fixed to the foot of the window, reachable from any scroll position */}
        <AgentBar label="Marketplace Agent" note={asked && (asked.rows.length
          ? <><b>{asked.label}</b> — {asked.rows.length} shown below. {asked.note}</>
          : <>Nothing on the marketplace matches that. Members sometimes sell what they already hold on the{" "}
            <button className="link" onClick={() => S.navigate("/secondary")}>secondary board</button>.</>)}>
          <div className="search" style={{ flex: 1 }}>
            <input type="text" value={ask} placeholder="Ask: what closes the rebalancing? · Hanwha-sourced credit · private, under $500K"
              onChange={(e) => setAsk(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setAsked(askMarket(ask, scored, ctx))} />
          </div>
          <button className="btn sm" onClick={() => setAsked(askMarket(ask, scored, ctx))}>Ask</button>
          {asked && <button className="btn sm q" onClick={() => { setAsked(null); setAsk(""); }}>Clear</button>}
        </AgentBar>

        {act && (act.m.kind === "listed"
          ? <BB.flows.TradeTicket instrument={{ ...act.m, sub: act.m.fills, pxUsd: act.m.px }}
              side="buy" amount0={act.amount} onClose={() => setAct(null)} />
          : <BB.flows.CommitFlow deal={act.m} amount0={act.amount} onClose={() => setAct(null)} />)}
      </div>
    );
  }

  BB.pages = BB.pages || {};
  BB.pages.Marketplace = Marketplace;
})();
