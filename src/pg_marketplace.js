/* /marketplace — one ranked surface, ordered by how well each offering suits
   this family. The model allocation is context in the sidebar, not the
   organising principle. No public/private tabs. */
(function () {
  const { useState } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Money, Delta, Panel, Fit, Lock } = BB.ui;
  const { Agent } = BB.agent;

  function Row({ m, onOpen, onAct }) {
    const st = S.get();
    const isListed = m.kind === "listed";
    return (
      <tr className="clickable" onClick={() => onOpen(m)}>
        <td style={{ minWidth: 260 }}>
          <div className="tname">{m.name}</div>
          <div className="tsub">{m.ticker ? <span className="mono">{m.ticker}</span> : m.manager}{m.hanwha && <> · <span style={{ color: "var(--navy)" }}>Hanwha-originated</span></>}</div>
        </td>
        <td>{u.subLabel(m.fills)}<div className="tsub">{u.clsLabel(m.cls)}</div></td>
        <td className="n num">{m.ret}</td>
        <td>
          <span className="bdg plain">{m.liq}</span>
          {m.term && m.term !== "—" && <div className="tsub">{m.term}</div>}
        </td>
        <td className="n num">{u.usd(m.min)}</td>
        <td className="tri hide-narrow" style={{ fontSize: 11.5, maxWidth: 150 }}>{m.avail}</td>
        <td className="n"><Fit score={m.fit} /></td>
        <td style={{ maxWidth: 260 }}><div className="tsub" style={{ fontSize: 11.5, color: "var(--g1)" }}>{m.why}</div></td>
        <td className="right">
          <div className="rowbtns">
            <Lock sleeve={st.account === "successor" ? "alpha" : "core"}>
              <button className="btn sm p" onClick={(e) => { e.stopPropagation(); onAct(m); }}>
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
          <th className="n">Minimum</th><th className="hide-narrow">Availability</th><th className="n">Fit</th>
          <th style={{ minWidth: 190 }}>Why</th><th></th>
        </tr>
      </thead>
    );
  }

  function Marketplace({ route }) {
    const st = S.useStore();
    const [f, setF] = useState({ cls: "", liq: "", min: "", sector: "", geo: "", ccy: "", ret: "" });
    const [q, setQ] = useState("");
    const [act, setAct] = useState(null);
    const gapFocus = route.query.gap;
    const isSuccessor = st.account === "successor";

    /* The account decides what the marketplace contains. The Principal holds the
       whole balance sheet and sees one unsegmented list of everything. The
       Successor holds the Alpha sleeve, whose mandate is private growth, so the
       same surface carries private-market offerings only. */
    const lens = isSuccessor;

    const t = u.total(st.positions);
    const capacity = S.alphaCapacity();
    const mandateLabel = (D.mandates.find((m) => m.key === st.mandate) || D.mandates[1]).label;
    const model = u.modelWeights(t, st.mandate);

    const pass = (m) => {
      if (lens && m.kind !== "private") return false;
      if (gapFocus && m.fills !== gapFocus) return false;
      if (f.cls && m.cls !== f.cls) return false;
      if (f.liq && m.liq !== f.liq) return false;
      if (f.min && m.min > +f.min) return false;
      if (f.sector && m.sector !== f.sector) return false;
      if (f.geo && m.geo !== f.geo) return false;
      if (f.ccy && m.ccy !== f.ccy) return false;
      if (f.ret && m.retNum < +f.ret) return false;
      if (q && !(m.name + " " + (m.ticker || "") + " " + m.sector).toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    };
    const all = D.market.filter(pass).sort((a, b) => b.fit - a.fit);
    /* Private, inside the sleeve's remaining cash — committable without asking. */
    const readyNow = D.market
      .filter((m) => m.kind === "private" && m.min <= capacity)
      .sort((a, b) => b.fit - a.fit);
    const top3 = all.slice(0, 3);
    const sectors = Array.from(new Set(D.market.map((m) => m.sector))).sort();
    const geos = Array.from(new Set(D.market.map((m) => m.geo))).sort();

    const open = (m) => S.navigate("/marketplace/" + m.id);
    const onAct = (m) => setAct(m);


    return (
      <div className="wrap page">
        <div className="between">
          <div>
            <div className="eyebrow">Marketplace</div>
            <h1 className="mt8">What to buy next</h1>
            <div className="sub mt8" style={{ maxWidth: "76ch" }}>
              {isSuccessor
                ? <>One ranked list, judged on merit — terms, manager, security, and what the family already owns. This
                  account holds the Alpha sleeve, so the list is the private-market side of the book. Listed instruments
                  trade in Core, under the Principal.</>
                : <>One ranked list, judged on merit — terms, manager, security, liquidity, and what the family already
                  owns. A treasury ETF and a senior secured credit facility sit on the same list and compete on the same
                  grounds; the only difference is what happens when you press the button.</>}
            </div>
          </div>
        </div>

        <div className="row mt16" style={{ alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Agent where="Deal fit"
              why={["Terms, manager record and security package on each offering",
                    "Overlap with the 42 positions the family already holds",
                    "Liquidity against the 24-month capital call schedule",
                    "Minimum check size against the sleeve's available cash",
                    "Mandate: " + mandateLabel + " · prohibited sectors: gaming / casinos, crypto-native",
                    "Model allocation for this AUM tier, as context rather than as an instruction"]}>
              Fit weights the merits of the instrument — terms, manager, security, and whether the family already owns
              the risk — then checks it against the mandate and the cash that would fund it. The three ranked highest
              today are <b>{top3.map((m) => m.name.split(" — ")[0]).join(", ")}</b>.
              {isSuccessor && <> {readyNow.length} private-market {readyNow.length === 1 ? "offering fits" : "offerings fit"} inside
                your {u.usd(capacity)} of remaining capacity and can be committed without approval; the rest would go to the
                Principal as a proposal.</>}
            </Agent>

            {/* filters */}
            <div className="panel mt16">
              <div className="panel-bd">
                <div className="filters">
                  <div className="f-item search" style={{ minWidth: 220 }}>
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
                  <div className="f-item"><label className="f"><span>Minimum up to</span>
                    <select value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })}>
                      <option value="">Any</option><option value="10000">$10,000</option><option value="100000">$100,000</option>
                      <option value="250000">$250,000</option><option value="500000">$500,000</option><option value="1000000">$1,000,000</option>
                    </select></label></div>
                  <div className="f-item"><label className="f"><span>Sector</span>
                    <select value={f.sector} onChange={(e) => setF({ ...f, sector: e.target.value })}>
                      <option value="">Any</option>{sectors.map((s) => <option key={s}>{s}</option>)}
                    </select></label></div>
                  <div className="f-item"><label className="f"><span>Geography</span>
                    <select value={f.geo} onChange={(e) => setF({ ...f, geo: e.target.value })}>
                      <option value="">Any</option>{geos.map((s) => <option key={s}>{s}</option>)}
                    </select></label></div>
                  <div className="f-item"><label className="f"><span>Currency</span>
                    <select value={f.ccy} onChange={(e) => setF({ ...f, ccy: e.target.value })}>
                      <option value="">Any</option><option>USD</option><option>KRW</option>
                    </select></label></div>
                  <div className="f-item"><label className="f"><span>Target return</span>
                    <select value={f.ret} onChange={(e) => setF({ ...f, ret: e.target.value })}>
                      <option value="">Any</option><option value="4">4%+</option><option value="6">6%+</option>
                      <option value="8">8%+</option><option value="12">12%+</option>
                    </select></label></div>
                  <button className="btn" onClick={() => { setF({ cls: "", liq: "", min: "", sector: "", geo: "", ccy: "", ret: "" }); setQ(""); }}>Reset</button>
                </div>
                <div className="tri mt8" style={{ fontSize: 11, maxWidth: "78ch" }}>
                  {lens
                    ? <>This account sees private-market offerings — funds, co-investments, secondaries and direct
                      credit. Listed instruments settle in the Core sleeve, which is the Principal's remit.</>
                    : <>There is no public / private filter. A member who wants liquid instruments filters on liquidity,
                      which is what they actually mean.</>}
                </div>
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
                <table className="t dense"><Head />
                  <tbody>{readyNow.map((m) => <Row key={m.id} m={m} onOpen={open} onAct={onAct} />)}</tbody>
                </table>
              </div>
            )}

            <div className="between mt24 mb12">
              <h2>{gapFocus ? u.subLabel(gapFocus) : "Ranked for this family"}</h2>
              <div className="btn-row">
                {gapFocus && <button className="btn sm" onClick={() => S.navigate("/marketplace")}>Show everything</button>}
                <span className="tri" style={{ fontSize: 11.5 }}>{all.length} of {D.market.length} shown</span>
              </div>
            </div>
            <div className="panel">
              {all.length === 0 ? <div className="empty">Nothing matches these filters.</div> : (
                <table className="t dense"><Head />
                  <tbody>{all.map((m) => <Row key={m.id} m={m} onOpen={open} onAct={onAct} />)}</tbody>
                </table>
              )}
            </div>
          </div>

          {/* sidebar */}
          <div style={{ width: 280, flexShrink: 0 }}>
            <Panel title="Allocation context" sub={"Model for " + u.usdC(t) + " · " + mandateLabel}>
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
              <Panel title="Your authority">
                <div className="kv">
                  <span className="k">Account</span><span className="v">{st.account === "principal" ? "Principal" : "Successor"}</span>
                  <span className="k">Direct limit</span>
                  <span className="v">{st.account === "principal" ? "No limit" : u.usd(S.alphaCapacity())}</span>
                </div>
                <div className="tri mt8" style={{ fontSize: 11 }}>
                  {st.account === "principal"
                    ? "Commitments and orders execute directly."
                    : "Above the Alpha sleeve's capacity, the same button submits a proposal to the Principal."}
                </div>
              </Panel>
            </div>
          </div>
        </div>

        {act && (act.kind === "listed"
          ? <BB.flows.TradeTicket instrument={{ ...act, sub: act.fills, sleeve: st.account === "successor" ? "alpha" : "core", pxUsd: act.px }} side="buy" onClose={() => setAct(null)} />
          : <BB.flows.CommitFlow deal={act} onClose={() => setAct(null)} />)}
      </div>
    );
  }

  BB.pages = BB.pages || {};
  BB.pages.Marketplace = Marketplace;
})();
