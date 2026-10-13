/* /credit — what being liquid is actually for.

   Lending sat inside the portfolio as a tab for one version, which was wrong:
   it is not a view of what is held, it is a thing the family can do because
   of what is held. A lender advances against what it can price and sell, and
   everything on this platform is both — so the private half of the book stops
   being excluded from collateral, which is the single largest practical
   consequence of the liquidity assumption. */
(function () {
  const { useState } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Money, Delta, Panel, Modal, AgentBar } = BB.ui;


  /* What liquidity is actually for. A lender advances against what it can
     price and sell, and until everything on the platform was both, a family
     office borrowed against its listed lines and nothing else. The whole
     private half of the book was worth zero as collateral — not because it
     was bad collateral, but because nobody could value it or take it.

     This tab is the Liquidity tab's slot, which is the right place for it:
     the schedule that used to live here had no content once everything
     settled same-day, and what immediacy buys does. */
  function CreditBody({ positions }) {
    const bp = u.borrowingPower(positions);
    const mk = u.marked(positions);
    const t = u.total(positions);
    const calls90 = D.capitalCalls.filter((c) => u.days(D.TODAY, c.date) <= 90 && u.days(D.TODAY, c.date) >= 0);
    const callTotal = u.sum(calls90, (c) => c.amount);
    const [ask, setAsk] = useState(false);
    const maxUnlock = Math.max(1, ...bp.rows.map((r) => r.now));

    /* the forward cash picture, carried over from the tab this one replaces */
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

    return (
      <>
        <div className="band mt16">
          <div className="cell"><div className="stat-l">Borrowing power</div>
            <div className="stat-v"><Money v={bp.now} compact /></div>
            <div className="stat-s">{u.pct(bp.ltvNow)} of the book, no sale required</div></div>
          <div className="cell"><div className="stat-l">Before the rail</div>
            <div className="stat-v"><Money v={bp.was} compact /></div>
            <div className="stat-s">{u.pct(bp.ltvWas)} — listed lines only</div></div>
          <div className="cell"><div className="stat-l">Unlocked by a market price</div>
            <div className="stat-v" style={{ color: "var(--pos)" }}>{u.usdC(bp.unlocked)}</div>
            <div className="stat-s">against the private half of the book</div></div>
          <div className="cell"><div className="stat-l">Indicative rate</div>
            <div className="stat-v">{u.pct(bp.rate)}</div>
            <div className="stat-s">{D.creditTerms.baseName} + {u.pct(D.creditTerms.spread)}</div></div>
          <div className="cell"><div className="stat-l">Calls · next 90 days</div>
            <div className="stat-v"><Money v={callTotal} compact /></div>
            <div className="stat-s">{callTotal <= bp.now ? "coverable without selling anything" : "exceeds the facility"}</div></div>
        </div>

        <div className="panel mt16">
          <div className="panel-hd">
            <div>
              <h3>What a lender will advance</h3>
              <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>
                Set by how tight a market is, not by what kind of asset it is
              </div>
            </div>
            <button className="btn sm p" onClick={() => setAsk(true)}>Request a facility</button>
          </div>
          <table className="t dense">
            <thead><tr><th>Held as</th><th className="n">Value</th>
              <th className="n">Advance</th><th className="n">Before the rail</th>
              <th style={{ width: "24%" }}>Borrowing power</th><th className="n">Unlocked</th></tr></thead>
            <tbody>
              {bp.rows.map((r) => (
                <tr key={r.sub}>
                  <td><span className="tname">{r.label}</span>
                    <div className="tsub">{r.count} position{r.count === 1 ? "" : "s"}</div></td>
                  <td className="n num">{u.usd(r.value)}</td>
                  <td className="n num">{u.pct(r.rate.now, 0)}</td>
                  <td className="n num tri">{r.rate.was === 0 ? "none" : u.pct(r.rate.was, 0)}</td>
                  <td><div className="wbar" title={u.usdC(r.now) + " against " + u.usdC(r.value)}>
                    <i style={{ width: Math.min(100, (r.now / maxUnlock) * 100) + "%", background: "#1B2A4A" }} />
                    <b style={{ left: Math.min(100, (r.was / maxUnlock) * 100) + "%" }} />
                  </div></td>
                  <td className="n num" style={{ color: r.now - r.was > 0 ? "var(--pos)" : undefined }}>
                    {r.now - r.was > 0 ? "+" + u.usd(r.now - r.was) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="why" style={{ borderTop: "1px solid var(--g3)" }}>
            The filled bar is what the position supports today; the tick is what it supported before it had a
            market price. Everything to the right of a tick is collateral that existed all along and could not
            be used. Borrowing is the Principal's decision — this screen states capacity, not advice.
          </div>
        </div>

        {/* a position with no market price is not collateral, whatever it is */}
        {mk.unmarked.length > 0 && (
          <div className="panel mt16">
            <div className="panel-hd">
              <div>
                <h3>Not priced by the market</h3>
                <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>
                  Held outside the platform, so valued by the family rather than by a market
                </div>
              </div>
              <span className="tri" style={{ fontSize: 11 }}>
                {u.pct(100 - mk.share)} of the book · carries no borrowing power
              </span>
            </div>
            <table className="t dense">
              <thead><tr><th>Position</th><th>Mark</th><th className="n">Value</th><th className="n">Would advance</th><th></th></tr></thead>
              <tbody>
                {mk.unmarked.map((p) => (
                  <tr key={p.id}>
                    <td><div className="tname">{p.name}</div><div className="tsub">{u.subLabel(p.sub)}</div></td>
                    <td><span className="bdg plain">{u.markSource(p).label}</span>
                      <div className="tsub">{u.fmtDate(p.asOf || p.acquired)}</div></td>
                    <td className="n num">{u.usd(p.value)}</td>
                    <td className="n num tri">{u.usd(p.value * (u.advanceOf(p).now / 100))}</td>
                    <td className="right"><button className="btn sm"
                      onClick={() => S.toast("Onboarding request sent — " + p.name)}>Bring onto the platform</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="why" style={{ borderTop: "1px solid var(--g3)" }}>
              Nothing is wrong with these holdings. They simply have no price anyone else agrees to, which is the
              one thing a lender cannot work around.
            </div>
          </div>
        )}

        {/* the forward cash picture still matters: a facility is cheaper than a
            sale, but it is not free, and a call still has to be met somehow */}
        <div className="panel mt16">
          <div className="panel-hd">
            <h3>24 months of cash</h3>
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
          <Panel id="sec-calls" title="Committed capital calls" sub="Contractual and projected">
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

        {ask && (
          <Modal title="Request a facility" sub="Secured on the book · indicative terms" onClose={() => setAsk(false)}
            footer={<>
              <div className="tri" style={{ fontSize: 11.5 }}>Nothing is drawn by sending this.</div>
              <div className="btn-row">
                <button className="btn" onClick={() => setAsk(false)}>Cancel</button>
                <button className="btn p" onClick={() => { setAsk(false); S.toast("Facility request sent to Hanwha"); }}>Send the request</button>
              </div>
            </>}>
            <div className="kv">
              <span className="k">Maximum advance</span><span className="v">{u.usdC(bp.now)}</span>
              <span className="k">Indicative rate</span><span className="v">{D.creditTerms.baseName} + {u.pct(D.creditTerms.spread)} · {u.pct(bp.rate)} today</span>
              <span className="k">Collateral</span><span className="v">The book, marked by the market</span>
              <span className="k">Margin call at</span><span className="v">{u.pct(D.creditTerms.ltvCall, 0)} of advance value</span>
              <span className="k">Settlement on a call</span><span className="v">Same day — collateral sells on the rail</span>
            </div>
            <div className="note mt12" style={{ fontSize: 12 }}>
              The same immediacy that makes this collateral acceptable is what makes a margin call fast. A lender
              that can sell your position inside a day will.
            </div>
          </Modal>
        )}
      </>
    );
  }

  function Credit() {
    const st = S.useStore();
    const ps = st.positions;
    const bp = u.borrowingPower(ps);

    return (
      <div className="wrap page hasagent">
        <div className="between" style={{ alignItems: "flex-start" }}>
          <div>
            <h1>Credit</h1>
            <div className="sub mt8" style={{ maxWidth: "76ch" }}>
              Borrow against the book instead of selling out of it. Everything here has a market price and
              settles the same day, which is what makes the private half usable as collateral at all.
            </div>
          </div>
        </div>

        <CreditBody positions={ps} />

        <AgentBar label="Credit Agent" note={"Borrowing power " + u.usdC(bp.now) + " at " + u.pct(bp.rate)}>
          <div className="search" style={{ flex: 1 }}>
            <input type="text" placeholder="Ask: what could I raise without selling? · what does a margin call look like?" readOnly />
          </div>
          <button className="btn p" onClick={() => S.toast("The credit agent is a stub in this prototype")}>Ask</button>
        </AgentBar>
      </div>
    );
  }

  BB.pages = BB.pages || {};
  BB.pages.Credit = Credit;
})();
