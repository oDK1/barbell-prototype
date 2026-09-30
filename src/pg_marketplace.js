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
    return (
      <tr className="clickable" onClick={() => onOpen(m)}>
        <td style={{ minWidth: 260 }}>
          <div className="tname">{m.name}</div>
          <div className="tsub" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span>{m.ticker ? <span className="mono">{m.ticker}</span> : m.manager}</span>
            {m.hanwha && <span className="bdg hanwha"><i className="pt" />Hanwha-sourced</span>}
          </div>
        </td>
        <td>{u.subLabel(m.fills)}<div className="tsub">{u.modelClassLabel(m.fills)}</div></td>
        <td className="n num">{m.ret}</td>
        <td>
          <span className="bdg plain">{m.liq}</span>
          {m.term && m.term !== "—" && <div className="tsub hide-narrow">{m.term}</div>}
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
          <th>Opportunity</th><th>Fills</th><th className="n">Return</th><th>Liquidity</th>
          <th className="n">Suggested</th><th className="n">Fit</th>
          <th className="hide-narrow" style={{ minWidth: 170 }}>Why</th><th></th>
        </tr>
      </thead>
    );
  }

  function Marketplace({ route }) {
    const st = S.useStore();
    const [f, setF] = useState({ cls: "", liq: "", sector: "", geo: "", ret: "" });
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
      if (f.cls) {
        const mc = D.modelClasses.find((c) => c.key === f.cls);
        if (!mc || mc.subs.indexOf(m.fills) < 0) return false;
      }
      if (f.liq && m.liq !== f.liq) return false;
      if (f.sector && m.sector !== f.sector) return false;
      if (f.geo && u.geoBucket(m.geo) !== f.geo) return false;
      if (f.ret && m.retNum < +f.ret) return false;
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
                  <div className="f-item"><label className="f"><span>Asset class</span>
                    <select value={f.cls} onChange={(e) => setF({ ...f, cls: e.target.value })}>
                      <option value="">Any</option>{D.modelClasses.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select></label></div>
                  <div className="f-item"><label className="f"><span>Liquidity</span>
                    <select value={f.liq} onChange={(e) => setF({ ...f, liq: e.target.value })}>
                      <option value="">Any</option><option>Daily</option><option>Quarterly</option><option>Locked</option>
                    </select></label></div>
                  <div className="f-item"><label className="f"><span>Sector</span>
                    <select value={f.sector} onChange={(e) => setF({ ...f, sector: e.target.value })}>
                      <option value="">Any</option>{sectors.map((s) => <option key={s}>{s}</option>)}
                    </select></label></div>
                  <div className="f-item"><label className="f"><span>Geography</span>
                    <select value={f.geo} onChange={(e) => setF({ ...f, geo: e.target.value })}>
                      <option value="">Any</option>{u.GEO_BUCKETS.map((g) => <option key={g}>{g}</option>)}
                    </select></label></div>
                  <div className="f-item"><label className="f"><span>Target return</span>
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
            <Panel title="Allocation context">
              <table className="t dense">
                <thead><tr><th>Class</th><th className="n">Now</th><th className="n">Model</th></tr></thead>
                <tbody>
                  {u.holdingsSix(st.positions, st.mandate).map((c) => (
                    <tr key={c.key} style={c.blocked ? { opacity: .5 } : null}>
                      <td>
                        <span style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>
                          <i className="sw" style={{ width: 8, height: 8, display: "inline-block", background: c.color }} />
                          <span className="tname" style={{ fontSize: 12 }}>{c.label}</span>
                        </span>
                      </td>
                      <td className="n num">{u.pct(c.wt)}</td>
                      <td className="n num tri">{c.blocked ? "—" : u.pct(c.model)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <Panel title="Liquidity context">
                <div className="kv">
                  <span className="k">Calls · next 90 days</span><span className="v">{u.usdC(ctx.calls90)}</span>
                  <span className="k">Calls · 24 months</span><span className="v">{u.usdC(ctx.calls24)}</span>
                  <span className="k">Redeemable in 90 days</span><span className="v">{u.usdC(ctx.liq.within90)}</span>
                  <span className="k">Runway</span>
                  <span className="v" style={ctx.short ? { color: "var(--neg)" } : null}>
                    {ctx.short ? "breaks " + ctx.short.month : "holds 24 months"}
                  </span>
                </div>
                <button className="btn sm block mt8" onClick={() => S.navigate("/portfolio?tab=liq")}>Open the liquidity view</button>
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
