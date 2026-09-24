/* /marketplace — one ranked surface, ordered by how well each offering suits
   this family. The model allocation is context in the sidebar, not the
   organising principle. No public/private tabs. */
(function () {
  const { useState } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Money, Delta, Panel, Fit, Lock } = BB.ui;
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
        <td>{u.subLabel(m.fills)}<div className="tsub hide-narrow">{u.clsLabel(m.cls)}</div></td>
        <td className="n num">{m.ret}</td>
        <td>
          <span className="bdg plain">{m.liq}</span>
          {m.term && m.term !== "—" && <div className="tsub hide-narrow">{m.term}</div>}
        </td>
        <td className="n num">{u.usd(m.min)}</td>
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
            <Lock sleeve={st.account === "successor" ? "alpha" : "core"}>
              <button className="btn sm p" onClick={(e) => { e.stopPropagation(); onAct(m, sug && sug.amount); }}>
                {isListed ? "Buy" : "Commit"}
              </button>
            </Lock>
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
          <th className="n">Minimum</th><th className="n">Suggested</th><th className="n">Fit</th>
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
    const gapFocus = route.query.gap;
    const isSuccessor = st.account === "successor";

    /* The account decides what the marketplace contains. The Principal holds the
       whole balance sheet and sees one unsegmented list of everything. The
       Successor holds the Alpha sleeve, whose mandate is private growth, so the
       same surface carries private-market offerings only. */
    const lens = isSuccessor;

    const t = u.total(st.positions);
    const capacity = S.alphaCapacity();
    const model = u.modelWeights(t, st.mandate);

    const pass = (m) => {
      if (lens && m.kind !== "private") return false;
      if (gapFocus && m.fills !== gapFocus) return false;
      if (f.cls && m.cls !== f.cls) return false;
      if (f.liq && m.liq !== f.liq) return false;
      if (f.sector && m.sector !== f.sector) return false;
      if (f.geo && m.geo !== f.geo) return false;
      if (f.ret && m.retNum < +f.ret) return false;
      if (q && !(m.name + " " + (m.ticker || "") + " " + m.sector).toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    };
    const ctx = u.marketContext(st.positions, st.mandate);
    const scored = D.market.map((m) => ({ ...m, s: u.scoreFor(m, ctx) }));
    const all = (asked && asked.rows.length ? asked.rows : scored.filter(pass)).sort((a, b) => b.s.score - a.s.score);
    /* Private, inside the sleeve's remaining cash — committable without asking. */
    const readyNow = scored
      .filter((m) => m.kind === "private" && m.min <= capacity)
      .sort((a, b) => b.s.score - a.s.score);
    const top3 = all.slice(0, 3);
    /* what could actually fund a purchase today */
    const funds = st.account === "principal"
      ? u.total(st.positions.filter((x) => x.cls === "cash"))
      : S.alphaCapacity();
    const sectors = Array.from(new Set(D.market.map((m) => m.sector))).sort();
    const geos = Array.from(new Set(D.market.map((m) => m.geo))).sort();

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
                      <option value="">Any</option>{D.classes.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
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
                      <option value="">Any</option>{geos.map((s) => <option key={s}>{s}</option>)}
                    </select></label></div>
                  <div className="f-item"><label className="f"><span>Target return</span>
                    <select value={f.ret} onChange={(e) => setF({ ...f, ret: e.target.value })}>
                      <option value="">Any</option><option value="4">4%+</option><option value="6">6%+</option>
                      <option value="8">8%+</option><option value="12">12%+</option>
                    </select></label></div>
                  <button className="btn" onClick={() => { setF({ cls: "", liq: "", sector: "", geo: "", ret: "" }); setQ(""); }}>Reset</button>
                </div>
                {lens && (
                  <div className="tri mt8" style={{ fontSize: 11, maxWidth: "78ch" }}>
                    This account sees private-market offerings — funds, co-investments, secondaries and direct
                    credit. Listed instruments settle in the Core sleeve, which is the Principal's remit.
                  </div>
                )}
              </div>
            </div>

            {/* what the Successor can act on unaided */}
            {isSuccessor && !gapFocus && readyNow.length > 0 && (
              <div className="gapsec mt24">
                <div className="gaphd">
                  <span className="g-t">Within your authority</span>
                  <span className="g-d">{u.usd(capacity)} of Alpha sleeve capacity remaining</span>
                  <span className="spacer" style={{ flex: 1 }} />
                  <span className="tri" style={{ fontSize: 11.5 }}>
                    {readyNow.length} of {D.market.filter((m) => m.kind === "private").length} private-market
                    offerings fit the capacity · the rest need the Principal
                  </span>
                </div>
                <div className="tscroll">
                  <table className="t dense"><Head />
                    <tbody>{readyNow.map((m) => <Row key={m.id} m={m} sug={u.suggestAmount(m, ctx, funds)} onOpen={open} onAct={onAct} />)}</tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="between mt24 mb12">
              <h2>{asked && asked.rows.length ? asked.label : gapFocus ? u.subLabel(gapFocus) : "Ranked for this family"}</h2>
              <div className="btn-row">
                {gapFocus && <button className="btn sm" onClick={() => S.navigate("/marketplace")}>Show everything</button>}
                <span className="tri" style={{ fontSize: 11.5 }}>{all.length} of {D.market.length} shown</span>
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
            <Panel title="Allocation context" sub={"Against the model for " + u.usdC(t)}>
              <table className="t dense">
                <thead><tr><th>Class</th><th className="n">Now</th><th className="n">Model</th></tr></thead>
                <tbody>
                  {u.byClass(st.positions).map((c) => (
                    <tr key={c.key}>
                      <td><div className="tname" style={{ fontSize: 12 }}>{c.label}</div></td>
                      <td className="n num">{u.pct(c.wt)}</td>
                      <td className="n num tri">{u.pct(model.classes[c.key])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="tri mt8" style={{ fontSize: 11 }}>
                Context, not a queue of trades. Nothing on this page is ranked by how far the book sits from the model.
              </div>
              <button className="btn sm block mt8" onClick={() => S.navigate("/portfolio")}>Open the model</button>
            </Panel>

            <div className="mt16">
              <Panel title="Invitations" sub={st.referrals.sent + " sent · " + st.referrals.joined + " joined"}>
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
                <div className="tri mt8" style={{ fontSize: 11 }}>
                  Members invite members. Recipients see the thesis; terms and allocation stay gated behind a membership request.
                </div>
              </Panel>
            </div>

            <div className="mt16">
              <Panel title="Liquidity context" sub="What the next two years demand">
                <div className="kv">
                  <span className="k">Calls · next 90 days</span><span className="v">{u.usdC(ctx.calls90)}</span>
                  <span className="k">Calls · 24 months</span><span className="v">{u.usdC(ctx.calls24)}</span>
                  <span className="k">Redeemable in 90 days</span><span className="v">{u.usdC(ctx.liq.within90)}</span>
                  <span className="k">Runway</span>
                  <span className="v" style={ctx.short ? { color: "var(--neg)" } : null}>
                    {ctx.short ? "breaks " + ctx.short.month : "holds 24 months"}
                  </span>
                </div>
                <div className="tri mt8" style={{ fontSize: 11 }}>
                  {ctx.short
                    ? "Offerings that lock capital past " + ctx.short.month + " are scored down."
                    : "Illiquidity can be paid for, so locked offerings are scored up."}
                </div>
                <button className="btn sm block mt8" onClick={() => S.navigate("/portfolio?tab=liq")}>Open the liquidity view</button>
              </Panel>
            </div>

            <div className="mt16">
              <Panel title="Tax context" sub="Observations, not advice">
                <div className="kv">
                  <span className="k">Realised year to date</span><span className="v">{u.usdC(ctx.tax.realized)}</span>
                  <span className="k">Harvestable loss</span>
                  <span className="v">{u.usdC(ctx.tax.harvestable)}{ctx.tax.harvestCount ? " · " + ctx.tax.harvestCount + " lots" : ""}</span>
                  <span className="k">Inside 65 days of long-term</span><span className="v">{ctx.tax.nearLT} lots</span>
                </div>
                <div className="tri mt8" style={{ fontSize: 11 }}>
                  {ctx.tax.realized > 250000
                    ? "With gains already booked, offerings that defer to exit score above those paying taxable income now."
                    : "Little realised so far, so income and deferral are scored alike."}
                </div>
                <button className="btn sm block mt8" onClick={() => S.navigate("/portfolio?tab=tax")}>Open the tax view</button>
              </Panel>
            </div>

            <div className="mt16">
              <Panel title="What you can do here">
                <div className="kv">
                  <span className="k">Signed in as</span>
                  <span className="v">{st.account === "principal" ? D.accounts.principal.name : D.accounts.successor.name}</span>
                  <span className="k">Can commit without asking</span>
                  <span className="v">{st.account === "principal" ? "Any amount" : "Up to " + u.usd(S.alphaCapacity())}</span>
                </div>
                <div className="tri mt8" style={{ fontSize: 11 }}>
                  {st.account === "principal"
                    ? "Whatever you buy or commit to here happens straight away."
                    : "Past that amount the button changes: instead of buying, it sends the Principal a proposal."}
                </div>
              </Panel>
            </div>
          </div>
        </div>

        {/* agent — fixed to the foot of the window, reachable from any scroll position */}
        <div className="askbar agentbar">
          {asked && (
            <div className="askhint" style={{ paddingBottom: 8 }}>
              {asked.rows.length
                ? <><b>{asked.label}</b> — {asked.rows.length} shown below. {asked.note}</>
                : <>Nothing on the marketplace matches that. Members sometimes sell what they already hold on the{" "}
                  <button className="link" onClick={() => S.navigate("/secondary")}>secondary board</button>.</>}
            </div>
          )}
          <div className="askrow">
            <span className="lbl" style={{ whiteSpace: "nowrap" }}>Marketplace Agent</span>
            <div className="search" style={{ flex: 1 }}>
              <input type="text" value={ask} placeholder="Ask: what closes the rebalancing? · Hanwha-sourced credit · private, under $500K"
                onChange={(e) => setAsk(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setAsked(askMarket(ask, scored, ctx))} />
            </div>
            <button className="btn sm" onClick={() => setAsked(askMarket(ask, scored, ctx))}>Ask</button>
            {asked && <button className="btn sm q" onClick={() => { setAsked(null); setAsk(""); }}>Clear</button>}
          </div>
        </div>

        {act && (act.m.kind === "listed"
          ? <BB.flows.TradeTicket instrument={{ ...act.m, sub: act.m.fills, sleeve: st.account === "successor" ? "alpha" : "core", pxUsd: act.m.px }}
              side="buy" amount0={act.amount} onClose={() => setAct(null)} />
          : <BB.flows.CommitFlow deal={act.m} amount0={act.amount} onClose={() => setAct(null)} />)}
      </div>
    );
  }

  BB.pages = BB.pages || {};
  BB.pages.Marketplace = Marketplace;
})();
