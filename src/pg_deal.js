/* /marketplace/:dealId — one detail template serving listed and private alike. */
(function () {
  const { useState } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Money, Delta, Panel, Tabs, Crumb, Fit, Lock } = BB.ui;
  const { Agent } = BB.agent;

  function Deal({ route }) {
    const st = S.useStore();
    const m = D.market.find((x) => x.id === route.parts[1]);
    const [tab, setTab] = useState("thesis");
    const [act, setAct] = useState(false);
    const [share, setShare] = useState(false);
    const [ask, setAsk] = useState("");
    const [asked, setAsked] = useState([]);

    if (!m) return <div className="wrap page"><div className="empty">Unknown opportunity.</div></div>;

    const isListed = m.kind === "listed";
    const gap = u.bySub(st.positions).find((s) => s.key === m.fills);
    const ctx = u.marketContext(st.positions, st.mandate);
    const sc = u.scoreFor(m, ctx);
    const gapWord = (x) => u.num(Math.abs(x), 1) + "pp " + (x > 0 ? "below" : "above") + " the model";
    const capacity = S.alphaCapacity();
    const needsProposal = st.account === "successor" && (isListed ? false : m.min > capacity);

    const tabs = [{ k: "thesis", label: isListed ? "Overview" : "Thesis" }, { k: "terms", label: "Terms" }, { k: "docs", label: "Documents", n: m.docs.length }]
      .concat(m.hanwha ? [{ k: "hanwha", label: "Hanwha's position" }] : [])
      .concat([{ k: "qa", label: "Q&A", n: m.qa.length + asked.length }]);

    return (
      <div className="wrap page">
        <Crumb items={[{ label: "Marketplace", to: "/marketplace" }, { label: u.subLabel(m.fills), to: "/marketplace?gap=" + m.fills }, { label: m.name }]} />
        <div className="between">
          <div style={{ maxWidth: "70ch" }}>
            <div className="row tight" style={{ alignItems: "center" }}>
              <span className="bdg plain">{u.subLabel(m.fills)}</span>
              <span className="bdg plain">{m.liq}{m.term && m.term !== "—" ? " · " + m.term : ""}</span>
              {m.hanwha && <span className="bdg hanwha"><i className="pt" />Hanwha-originated</span>}
            </div>
            <h1 className="mt8">{m.name}</h1>
            <div className="sub mt8">{m.ticker ? <span className="mono">{m.ticker}</span> : m.manager} · {m.sector} · {m.geo}</div>
          </div>
          <div className="btn-row">
            <button className="btn" onClick={() => setShare(true)}>Share</button>
            <Lock sleeve={st.account === "successor" ? "alpha" : "core"}>
              <button className="btn p lg" onClick={() => setAct(true)}>
                {isListed ? "Buy" : needsProposal ? "Submit proposal to Principal" : "Commit"}
              </button>
            </Lock>
          </div>
        </div>

        <div className="band mt16">
          <div className="cell"><div className="stat-l">{isListed ? "Yield / return" : "Target return"}</div><div className="stat-v sm">{m.ret}</div></div>
          <div className="cell"><div className="stat-l">Liquidity</div><div className="stat-v sm">{m.liq}</div><div className="stat-s">{m.term || "—"}</div></div>
          <div className="cell"><div className="stat-l">Minimum</div><div className="stat-v sm"><Money v={m.min} compact /></div></div>
          <div className="cell"><div className="stat-l">Availability</div><div className="stat-v sm" style={{ fontSize: 14 }}>{m.avail}</div></div>
          <div className="cell"><div className="stat-l">Fit</div><div className="stat-v sm"><Fit score={sc.score} /></div>
            <div className="stat-s">{m.why}</div></div>
        </div>

        <div className="mt16">
          <Agent where="Deal fit"
            why={["Allocation " + sc.allocation + "/100 — " + u.subLabel(m.fills) + " sits " + gapWord(ctx.under[m.fills]),
                  "Liquidity " + sc.liquidity + "/100 — " + m.liq + (m.term ? " · " + m.term : "") + " against " +
                    u.usdC(ctx.calls24) + " of calls over 24 months",
                  "Tax " + sc.tax + "/100 — " + u.usd(ctx.tax.realized) + " realised year to date",
                  "Merit " + sc.merit + "/100 — terms, manager, security, overlap with what is held",
                  "Weighting: merit 35% · allocation 30% · liquidity 20% · tax 15%"]}
            actions={<button className="btn sm" onClick={() => S.navigate("/marketplace")}>Compare the alternatives</button>}>
            {m.why}
            <table className="t dense mt12" style={{ maxWidth: 520 }}>
              <tbody>
                {[["Allocation", sc.allocation, u.subLabel(m.fills) + " " + gapWord(ctx.under[m.fills])],
                  ["Liquidity", sc.liquidity, m.liq + (ctx.short ? " · cash breaks " + ctx.short.month : " · calls covered")],
                  ["Tax", sc.tax, ["pe", "vc", "preipo"].indexOf(m.fills) >= 0 ? "gain deferred to exit" : "taxable as it arrives"],
                  ["Instrument merit", sc.merit, "terms, manager, security"]].map((r) => (
                  <tr key={r[0]}>
                    <td style={{ width: 140 }} className="tri">{r[0]}</td>
                    <td style={{ width: 90 }}><BB.ui.Fit score={r[1]} /></td>
                    <td className="tsub">{r[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Agent>
        </div>

        <div className="grid mt16" style={{ gridTemplateColumns: "1.6fr 1fr", alignItems: "start" }}>
          <div className="panel">
            <Tabs tabs={tabs} active={tab} onChange={setTab} />
            <div className="panel-bd">
              {tab === "thesis" && (
                <div className="prose">{m.overview}</div>
              )}
              {tab === "terms" && (
                <table className="t dense">
                  <tbody>{m.terms.map((r) => (
                    <tr key={r[0]}><td className="tri" style={{ width: 200 }}>{r[0]}</td><td className="tname">{r[1]}</td></tr>
                  ))}</tbody>
                </table>
              )}
              {tab === "docs" && (
                m.docs.length === 0 ? <div className="empty">No documents for this instrument.</div> : (
                  <table className="t dense">
                    <tbody>{m.docs.map((d) => (
                      <tr key={d[0]}>
                        <td><span className="mono tri" style={{ marginRight: 10 }}>DOC</span><span className="tname">{d[0]}</span></td>
                        <td className="tri">{d[1]}</td>
                        <td className="right"><button className="btn sm" onClick={() => S.toast("Document opened — " + d[0])}>Open</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                )
              )}
              {tab === "hanwha" && (
                <div>
                  <div className="note ok" style={{ fontSize: 12.5 }}>
                    <b>Hanwha Life holds an anchor position in this instrument, on the same terms.</b>
                  </div>
                  <div className="prose mt12">{m.anchor}</div>
                  <div className="prose mt12">
                    Barbell shows this because it is the trust argument. The platform is not selling inventory it declined
                    to own: where an opportunity is Hanwha-originated, the institution's own balance sheet is in the same
                    security, at the same price, with the same documentation. Where it is not, the badge is absent.
                  </div>
                  <table className="t dense mt16">
                    <tbody>
                      <tr><td className="tri" style={{ width: 200 }}>Anchor investor</td><td className="tname">Hanwha Life Insurance</td></tr>
                      <tr><td className="tri">Terms</td><td className="tname">Identical — no preferential economics</td></tr>
                      <tr><td className="tri">Originated by</td><td className="tname">{m.manager || "Hanwha"}</td></tr>
                      <tr><td className="tri">Member allocation</td><td className="tname">{m.avail}</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
              {tab === "qa" && (
                <div>
                  {m.qa.concat(asked).length === 0 && <div className="empty">No questions yet.</div>}
                  {m.qa.map((qa, i) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div className="tname">{qa[0]}</div>
                      <div className="prose mt8" style={{ fontSize: 12.5 }}>{qa[1]}</div>
                      <hr className="hr" />
                    </div>
                  ))}
                  {asked.map((qa, i) => (
                    <div key={"a" + i} style={{ marginBottom: 16 }}>
                      <div className="tname">{qa[0]}</div>
                      <div className="sub mt8" style={{ fontSize: 12.5 }}>{qa[1]}</div>
                      <hr className="hr" />
                    </div>
                  ))}
                  <div className="row tight">
                    <input type="text" placeholder="Ask the sponsor a question" value={ask} onChange={(e) => setAsk(e.target.value)} />
                    <button className="btn" disabled={!ask} onClick={() => {
                      setAsked(asked.concat([[ask, "Submitted to " + (m.manager || "the issuer") + ". Answers are posted here and visible to all members."]]));
                      setAsk("");
                    }}>Submit</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <Panel title="Transaction" sub={isListed ? "Order ticket · same-day settlement" : "Subscription · closes " + (m.closing === "Quarterly close" ? "at the next quarterly close" : u.fmtDate(m.closing))}>
              <div className="kv">
                <span className="k">Mechanic</span><span className="v">{isListed ? "Buy" : "Commit"}</span>
                <span className="k">Minimum</span><span className="v">{u.usd(m.min)}</span>
                <span className="k">Liquidity</span><span className="v">{m.liq}</span>
                {m.expense !== undefined && <><span className="k">Expense ratio</span><span className="v">{u.pct(m.expense, 2)}</span></>}
                {m.ytm !== undefined && <><span className="k">Yield to maturity</span><span className="v">{u.pct(m.ytm, 2)}</span></>}
                {m.dur !== undefined && <><span className="k">Duration</span><span className="v">{m.dur} years</span></>}
                {m.rating && <><span className="k">Rating</span><span className="v">{m.rating}</span></>}
                {m.px !== undefined && <><span className="k">Last price</span><span className="v">{u.localPx(m)}</span></>}
                {m.chg !== undefined && <><span className="k">Intraday</span><span className="v"><Delta v={m.chg} dp={2} /></span></>}
              </div>
              <Lock sleeve={st.account === "successor" ? "alpha" : "core"}>
                <button className="btn p block mt12" onClick={() => setAct(true)}>
                  {isListed ? "Open order ticket" : needsProposal ? "Submit proposal to Principal" : "Commit"}
                </button>
              </Lock>
              {st.account === "successor" && !isListed && (
                <div className={"note mt12 " + (needsProposal ? "warn" : "ok")} style={{ fontSize: 11.5 }}>
                  {needsProposal
                    ? "Minimum exceeds the Alpha sleeve's remaining capacity of " + u.usd(capacity) + ". The button submits a proposal."
                    : "Within the Alpha sleeve's remaining capacity of " + u.usd(capacity) + ". Executes directly."}
                </div>
              )}
              <button className="btn block mt8" onClick={() => setShare(true)}>Share with a member</button>
            </Panel>

            <div className="mt16">
              <Panel title="Allocation context">
                <div className="kv">
                  <span className="k">Subcategory</span><span className="v">{gap.label}</span>
                  <span className="k">Held today</span><span className="v">{u.pct(gap.wt)}</span>
                  <span className="k">Mandate target</span><span className="v">{u.pct(gap.target)}</span>
                </div>
                <div className="mt12"><BB.ui.MiniBar cur={gap.wt} target={gap.target} max={Math.max(gap.wt, gap.target) * 1.4} /></div>
              </Panel>
            </div>
          </div>
        </div>

        {act && (isListed
          ? <BB.flows.TradeTicket instrument={{ ...m, sub: m.fills, sleeve: st.account === "successor" ? "alpha" : "core", pxUsd: m.px }} side="buy" onClose={() => setAct(false)} />
          : <BB.flows.CommitFlow deal={m} onClose={() => setAct(false)} />)}
        {share && <BB.flows.ShareModal deal={m} onClose={() => setShare(false)} />}
      </div>
    );
  }

  /* Non-member landing page reached from a shared link. */
  function Invitation({ route }) {
    const st = S.useStore();
    const m = D.market.find((x) => x.id === route.query.deal) || D.market[0];
    const ref = st.account === "principal" ? D.accounts.principal : D.accounts.successor;
    const [sent, setSent] = useState(false);
    return (
      <div className="wrap page" style={{ maxWidth: 760 }}>
        <div className="panel">
          <div className="panel-hd">
            <div>
              <div className="eyebrow">Invitation</div>
              <h2 className="mt8">{ref.name} has shared an opportunity with you</h2>
              <div className="sub" style={{ fontSize: 12 }}>{ref.title} · {D.family.name}</div>
            </div>
            <span className="bdg hanwha"><i className="pt" />Members only</span>
          </div>
          <div className="panel-bd">
            <h1>{m.name}</h1>
            <div className="sub mt8">{u.subLabel(m.fills)} · {m.sector} · {m.geo}</div>
            <div className="prose mt16">{m.overview}</div>
            <hr className="hr" />
            <div className="row" style={{ gap: 32 }}>
              <div><div className="lbl">Liquidity</div><div>{m.liq}</div></div>
              <div><div className="lbl">Target return</div><div style={{ filter: "blur(5px)", userSelect: "none" }}>{m.ret}</div></div>
              <div><div className="lbl">Minimum</div><div style={{ filter: "blur(5px)", userSelect: "none" }}>{u.usd(m.min)}</div></div>
              <div><div className="lbl">Allocation remaining</div><div style={{ filter: "blur(5px)", userSelect: "none" }}>{m.avail}</div></div>
            </div>
            <div className="note mt16">
              Terms, documents and allocation are visible to members of Barbell. Membership is by introduction from an
              existing member.
            </div>
            <div className="btn-row mt16">
              <button className="btn p lg" disabled={sent} onClick={() => setSent(true)}>
                {sent ? "Request sent — you'll hear from us" : "Request membership"}
              </button>
              <button className="btn lg" onClick={() => S.navigate("/marketplace/" + m.id)}>← Back to the member view</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  BB.pages = BB.pages || {};
  BB.pages.Deal = Deal;
  BB.pages.Invitation = Invitation;
})();
