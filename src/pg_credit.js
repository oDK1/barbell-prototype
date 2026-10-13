/* /credit — what the book will borrow.

   Two questions and no others: what will each holding support, and what does
   that come to. Everything on this platform has a market price and settles
   the same day, so a lender will advance against all of it rather than
   against the listed lines alone — but the page does not argue that, it just
   shows the number each position produces. */
(function () {
  const { useState } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Money, Modal, AgentBar } = BB.ui;

  function Credit() {
    const st = S.useStore();
    const ps = st.positions;
    const bp = u.borrowingPower(ps);
    const t = u.total(ps);
    const [ask, setAsk] = useState(false);
    const [sort, setSort] = useState({ k: "loan", dir: -1 });

    /* one row per holding: what it is worth, what fraction a lender will take
       it at, and the dollars that produces */
    const rows = ps.map((p) => {
      const mark = u.markSource(p);
      const rate = mark.live ? u.advanceOf(p).now : 0;
      return { p, mark, rate, value: p.value, loan: p.value * (rate / 100) };
    });

    const val = (r, k) => k === "name" ? r.p.name.toLowerCase()
      : k === "held" ? u.subLabel(r.p.sub)
      : k === "rate" ? r.rate : r[k];
    const shown = rows.slice().sort((a, b) => {
      const x = val(a, sort.k), y = val(b, sort.k);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });

    const Th = ({ k, label, n }) => (
      <th className={n ? "n" : ""} style={{ cursor: "pointer" }}
        onClick={() => setSort({ k, dir: sort.k === k ? -sort.dir : (k === "name" || k === "held" ? 1 : -1) })}>
        {label}<span className="tri" style={{ marginLeft: 4 }}>{sort.k === k ? (sort.dir === 1 ? "▲" : "▼") : ""}</span>
      </th>
    );

    return (
      <div className="wrap page hasagent">
        <div className="between" style={{ alignItems: "flex-start" }}>
          <div>
            <h1>Credit</h1>
            <div className="sub mt8" style={{ maxWidth: "70ch" }}>
              Borrow against the book instead of selling out of it.
            </div>
          </div>
          <div className="right">
            <div className="stat-l">You can borrow</div>
            <div className="stat-v" style={{ fontSize: 34 }}>{u.usdC(bp.now)}</div>
            <div className="stat-s">
              {u.pct(bp.ltvNow)} of {u.usdC(t)} · at {u.pct(bp.rate)}
            </div>
          </div>
        </div>

        <div className="panel mt16">
          <div className="panel-hd">
            <div>
              <h3>What each holding supports</h3>
              <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>
                {ps.length} positions · any column sorts
              </div>
            </div>
            <button className="btn sm p" onClick={() => setAsk(true)}>Request a facility</button>
          </div>
          <div className="tscroll">
            <table className="t dense">
              <thead>
                <tr>
                  <Th k="name" label="Holding" />
                  <Th k="held" label="Held as" />
                  <Th k="value" label="Value" n />
                  <Th k="rate" label="Advance" n />
                  <Th k="loan" label="Can borrow" n />
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.p.id} className={r.rate === 0 ? "rung-muted" : ""}>
                    <td style={{ minWidth: 260 }}>
                      <div className="tname">{r.p.name}</div>
                      <div className="tsub">
                        {r.p.ticker ? <span className="mono">{r.p.ticker}</span> : r.p.manager || r.p.grp}
                      </div>
                    </td>
                    <td>{u.subLabel(r.p.sub)}
                      {!r.mark.live && <div className="tsub">no market price</div>}</td>
                    <td className="n num">{u.usd(r.value)}</td>
                    <td className="n num tri">{r.rate === 0 ? "—" : u.pct(r.rate, 0)}</td>
                    <td className="n num" style={{ fontWeight: 600 }}>
                      {r.loan === 0 ? <span className="tri">$0</span> : u.usd(r.loan)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="creditfoot">
                  <td colSpan={2}><b>Total</b></td>
                  <td className="n num">{u.usd(t)}</td>
                  <td className="n num tri">{u.pct(bp.ltvNow, 0)}</td>
                  <td className="n num"><b>{u.usd(bp.now)}</b></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="why" style={{ borderTop: "1px solid var(--g3)" }}>
            The advance rate follows how tight a holding's market is, not what kind of asset it is. A holding
            with no market price supports nothing, whatever it is worth. Borrowing is the Principal's decision —
            this is capacity, not advice.
          </div>
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

        <AgentBar label="Credit Agent" note={u.usdC(bp.now) + " available at " + u.pct(bp.rate)}>
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
