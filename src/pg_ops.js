/* /ops — internal settlement view. Custody language everywhere else. */
(function () {
  const D = BB.data, u = BB.u, S = BB.store;

  function Ops() {
    const st = S.useStore();
    return (
      <div className="wrap page" style={{ maxWidth: 1080 }}>
        <div className="eyebrow">Operations · internal</div>
        <h1 className="mt8">Settlement ledger</h1>
        <div className="sub mt8" style={{ maxWidth: "72ch" }}>
          Instrument identifiers and settlement finality timestamps. Internal demo view; members see custody language —
          transfer, settlement, ownership record — and never this screen.
        </div>

        <div className="band mt16">
          <div className="cell"><div className="stat-l">Records</div><div className="stat-v">{st.ops.length}</div></div>
          <div className="cell"><div className="stat-l">Median finality</div><div className="stat-v sm">2.0 s</div><div className="stat-s">from instruction to final</div></div>
          <div className="cell"><div className="stat-l">Failed settlements</div><div className="stat-v">0</div></div>
          <div className="cell"><div className="stat-l">Settlement window</div><div className="stat-v sm">Same day</div><div className="stat-s">atomic, no netting cycle</div></div>
        </div>

        <div className="panel mt16">
          <table className="t dense">
            <thead><tr><th>Instructed</th><th>Instrument</th><th>Description</th><th className="n">Quantity</th><th>Reference</th><th>Finality</th><th>State</th></tr></thead>
            <tbody>
              {st.ops.map((o) => (
                <tr key={o.id}>
                  <td className="num tri">{u.fmtTs(o.ts)}</td>
                  <td className="mono">{o.instr}</td>
                  <td className="tname">{o.desc}</td>
                  <td className="n num">{o.qty}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{o.ref}</td>
                  <td className="num">{u.fmtTs(o.finality)}</td>
                  <td><span className="bdg live"><i className="pt" />{o.state}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  BB.pages = BB.pages || {};
  BB.pages.Ops = Ops;
})();
