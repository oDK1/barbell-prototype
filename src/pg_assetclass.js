/* /portfolio/:assetClass — position-level drill-down. The listed book gets the
   same depth as the private book, because by count it is the larger half. */
(function () {
  const { useState } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Money, Delta, ProvBadge, Lock, Crumb } = BB.ui;

  /* ------------------------------------------------------------ the table */
  function PositionTable({ rows, total, onTrade, onList, onValue }) {
    const st = S.get();
    return (
      <div className="tscroll">
      <table className="t">
        <thead>
          <tr>
            <th style={{ minWidth: 240 }}>Position</th>
            <th className="n" style={{ minWidth: 118 }}>Value</th>
            <th className="n">Price</th>
            <th className="n">Chg</th>
            <th className="n">Quantity</th>
            <th className="n">Cost basis</th>
            <th className="n">Unrealised</th>
            <th className="n">Wt total</th>
            <th className="hide-narrow">Tags</th>
            <th>Provenance</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const listed = p.liq === "Daily";
            const el = u.eligibility(p);
            return (
              <tr key={p.id}>
                <td>
                  <div className="tname">{p.name}</div>
                  <div className="tsub">
                    {p.ticker ? <span className="mono">{p.ticker}</span> : p.grp}
                    {p.legacy && <> · was <span className="mono">{p.legacy}</span></>}
                  </div>
                </td>
                {/* what the position is worth leads the row */}
                <td className="n val"><Money v={p.value} /></td>
                <td className="n num">{p.px ? u.localPx(p) : "—"}
                  {p.ccy !== "USD" && p.px ? <span className="krw">{u.usd(p.pxUsd, 2)}</span> : null}</td>
                <td className="n">{p.chg !== undefined ? <Delta v={p.chg} dp={2} /> : <span className="tri">—</span>}</td>
                <td className="n num">{p.qty ? u.num(p.qty) : "—"}</td>
                <td className="n num">{u.usd(p.cost)}</td>
                <td className="n"><Delta v={p.value - p.cost} usd />
                  <span className="krw">{u.sgn(((p.value - p.cost) / p.cost) * 100)}</span></td>
                <td className="n num">{u.pct((p.value / total) * 100)}</td>
                <td className="hide-narrow">
                  <span className="chip">{p.sector}</span>
                  <span className="chip">{p.geo}</span>
                  {p.affiliate && <span className="chip" style={{ color: "var(--neg)", borderColor: "#E7C7C2" }}>Affiliate</span>}
                </td>
                <td><ProvBadge p={p} /></td>
                <td className="right">
                  <div className="rowbtns">
                    {listed ? (
                      <>
                        <button className="btn sm p" onClick={() => onTrade(p, "buy")}>Trade</button>
                        {/* Trading Core is the Principal's; proposing it is not. */}
                        {!S.canWrite() && (
                          <button className="btn sm" onClick={() => onTrade(p, "buy")}>Propose</button>
                        )}
                      </>
                    ) : (
                      <>
                        {p.prov === "self" && (
                          <button className="btn sm" onClick={() => onValue(p)}>Update valuation</button>
                        )}
                        {el.ok
                          ? <button className="btn sm p" onClick={() => onList(p)}>List on secondary</button>
                          : <span className="tip" data-tip={el.reason}><button className="btn sm" disabled>List on secondary</button></span>}
                      </>
                    )}
                  </div>
                  {!listed && !el.ok && <div className="tsub right" style={{ marginTop: 2 }}>{el.reason}</div>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    );
  }

  /* -------------------------------------------------------------- the page */
  function AssetClass({ route }) {
    const st = S.useStore();
    const key = route.parts[1];
    const cls = D.classes.find((c) => c.key === key);
    const [subFilter, setSubFilter] = useState(route.query.sub || "");
    /* ?group=<model class> narrows to that class's subcategories — public
       equity and private equity live in the same book class, so opening one
       must not show the other. */
    const group = D.modelClasses.find((c) => c.key === route.query.group) || null;
    const [trade, setTrade] = useState(null);
    const [list, setList] = useState(null);
    const [value, setValue] = useState(null);

    React.useEffect(() => { setSubFilter(route.query.sub || ""); }, [route.query.sub, key, route.query.group]);

    if (!cls) return <div className="wrap page"><div className="empty">Unknown asset class.</div></div>;

    const inGroup = (p) => !group || group.subs.indexOf(p.sub) >= 0;
    const all = st.positions.filter((p) => p.cls === key && inGroup(p));
    const rows = subFilter ? all.filter((p) => p.sub === subFilter) : all;
    const t = u.total(st.positions);
    const clsTotal = u.total(all);
    const subs = u.bySub(st.positions).filter((s) => s.cls === key && (!group || group.subs.indexOf(s.key) >= 0));
    const info = u.byClass(st.positions).find((c) => c.key === key);
    const gRow = group ? u.holdingsSix(st.positions, st.mandate).find((r) => r.key === group.key) : null;

    return (
      <div className="wrap page">
        <Crumb items={group
          ? [{ label: "Portfolio", to: "/portfolio" }, { label: cls.label, to: "/portfolio/" + key }, { label: group.label }]
          : [{ label: "Portfolio", to: "/portfolio" }, { label: cls.label }]} />
        <div className="between">
          <div>
            <h1>{group ? group.label : cls.label}</h1>
            <div className="sub mt8">{all.length} positions · {all.filter((p) => p.liq === "Daily").length} listed · {all.filter((p) => p.liq !== "Daily").length} private</div>
          </div>
          <div className="right">
            <div className="stat-l">Weight vs model</div>
            <div className="stat-v sm">
              {group
                ? <>{u.pct(gRow.wt)} <span className="tri">/ {u.pct(gRow.model)} model</span></>
                : <>{u.pct(info.wt)} <span className="tri">/ {u.pct(info.target)} target</span></>}
            </div>
          </div>
        </div>

        <div className="band mt16">
          <div className="cell"><div className="stat-l">Value</div><div className="stat-v"><Money v={clsTotal} compact /></div></div>
          <div className="cell"><div className="stat-l">Cost basis</div><div className="stat-v"><Money v={u.sum(all, (p) => p.cost)} compact /></div></div>
          <div className="cell"><div className="stat-l">Unrealised</div><div className="stat-v"><Delta v={u.unrealized(all)} usd /></div>
            <div className="stat-s">{u.sgn((u.unrealized(all) / u.sum(all, (p) => p.cost)) * 100)} on cost</div></div>
          <div className="cell"><div className="stat-l">Daily-liquid share</div>
            <div className="stat-v">{u.pct((u.total(all.filter((p) => p.liq === "Daily")) / clsTotal) * 100)}</div>
            <div className="stat-s">{u.usdC(u.total(all.filter((p) => p.liq === "Daily")))} realisable</div></div>
        </div>

        <div className="between mt24 mb12">
          <h2>Positions</h2>
          <div className="btn-row">
            <button className={"btn sm" + (subFilter ? "" : " p")} onClick={() => setSubFilter("")}>All</button>
            {subs.map((s) => (
              <button key={s.key} className={"btn sm" + (subFilter === s.key ? " p" : "")} onClick={() => setSubFilter(s.key)}>
                {s.label} <span style={{ opacity: .6 }}>{s.count}</span>
              </button>
            ))}
          </div>
        </div>

        {(subFilter ? subs.filter((s) => s.key === subFilter) : subs).map((s) => {
          const items = all.filter((p) => p.sub === s.key);
          if (!items.length) return null;
          return (
            <div className="panel mb16" key={s.key}>
              <div className="panel-hd">
                <div>
                  <h3>{s.label}</h3>
                  <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>{s.note}</div>
                </div>
                <div className="row" style={{ gap: 24, alignItems: "center" }}>
                  <div className="right"><div className="lbl">Weight</div><div className="num">{u.pct(s.wt)} <span className="tri">/ {u.pct(s.target)}</span></div></div>
                  <div className="right"><div className="lbl">vs target</div>
                    <div className="tri num">{(s.drift > 0 ? "+" : s.drift < 0 ? "−" : "") + Math.abs(s.drift).toFixed(1) + "pp"}</div></div>
                  <div className="right"><div className="lbl">Value</div><div className="num">{u.usd(s.value)}</div></div>
                  <button className="btn sm" onClick={() => S.navigate("/marketplace?gap=" + s.key)}>Opportunities</button>
                </div>
              </div>
              <PositionTable rows={items} total={t}
                onTrade={(p, side) => setTrade({ p, side })} onList={setList} onValue={setValue} />
            </div>
          );
        })}

        {trade && <BB.flows.TradeTicket instrument={trade.p} side={trade.side} onClose={() => setTrade(null)} />}
        {list && <BB.flows.ListingFlow p={list} onClose={() => setList(null)} />}
        {value && <BB.flows.ValuationEditor p={value} onClose={() => setValue(null)} />}
      </div>
    );
  }

  BB.pages = BB.pages || {};
  BB.pages.AssetClass = AssetClass;
})();
