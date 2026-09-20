/* /activity — the shared, timestamped log. The trust layer. */
(function () {
  const { useState } = React;
  const D = BB.data, u = BB.u, S = BB.store;

  function Activity() {
    const st = S.useStore();
    const [who, setWho] = useState("");
    const [kind, setKind] = useState("");
    const kinds = Array.from(new Set(st.activity.map((a) => a.kind)));
    const rows = st.activity.filter((a) => (!who || a.who === who) && (!kind || a.kind === kind));

    const name = (w) => w === "system" ? "Barbell" : D.accounts[w] ? D.accounts[w].name : w;

    return (
      <div className="wrap page" style={{ maxWidth: 1080 }}>
        <div className="between">
          <div>
            <div className="eyebrow">Shared</div>
            <h1 className="mt8">Activity</h1>
            <div className="sub mt8" style={{ maxWidth: "72ch" }}>
              Every state-changing action by either account, timestamped and visible to both. Nothing in this product
              happens off the record.
            </div>
          </div>
          <div className="btn-row">
            <BB.ui.Seg options={[{ v: "", label: "Everyone" }, { v: "principal", label: "Principal" }, { v: "successor", label: "Successor" }, { v: "system", label: "System" }]}
              value={who} onChange={setWho} />
          </div>
        </div>

        <div className="btn-row mt16">
          <button className={"btn sm" + (kind ? "" : " p")} onClick={() => setKind("")}>All events</button>
          {kinds.map((k) => (
            <button key={k} className={"btn sm" + (kind === k ? " p" : "")} onClick={() => setKind(k)}>{k}</button>
          ))}
        </div>

        <div className="panel mt16">
          <table className="t">
            <thead><tr><th style={{ width: 190 }}>Timestamp</th><th style={{ width: 130 }}>Account</th><th style={{ width: 110 }}>Event</th><th>Detail</th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="num tri">{u.fmtTs(a.ts)}</td>
                  <td>
                    <span className="bdg plain" style={a.who === "principal" ? { borderColor: "#C9D2E2", color: "var(--navy)" } : null}>
                      {name(a.who)}
                    </span>
                  </td>
                  <td><span className="tri">{a.kind}</span></td>
                  <td>
                    <div className="tname">{a.text}</div>
                    {a.detail && <div className="tsub">{a.detail}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  BB.pages = BB.pages || {};
  BB.pages.Activity = Activity;
})();
