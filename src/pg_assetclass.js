/* /portfolio/:assetClass — position-level drill-down. The listed book gets the
   same depth as the private book, because by count it is the larger half. */
(function () {
  const { useState } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Money, Delta, Panel, Seg, ProvBadge, SleeveBadge, Lock, Crumb, Fit } = BB.ui;
  const { Agent } = BB.agent;

  /* YTD contribution of currency translation, by denomination. */
  const FX_RET = { USD: 0, KRW: -1.2, JPY: -3.4, EUR: 0.8 };

  function PerfModule({ positions, clsKey }) {
    const [win, setWin] = useState("YTD");
    const [hedged, setHedged] = useState(false);
    const p = D.performance[win];
    const v = hedged ? p.hedged : p.port;
    return (
      <Panel title="Performance vs benchmark" sub={D.benchmark.label}
        right={<>
          <Seg options={[{ v: "MTD", label: "MTD" }, { v: "QTD", label: "QTD" }, { v: "YTD", label: "YTD" }, { v: "ITD", label: "Since inception" }]} value={win} onChange={setWin} />
          <button className={"btn sm" + (hedged ? " p" : "")} onClick={() => setHedged(!hedged)}>KRW-hedged</button>
        </>}>
        <div className="row" style={{ gap: 28 }}>
          <div>
            <div className="lbl">Time-weighted return</div>
            <div className="num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.02em" }}>{u.sgn(v)}</div>
            <div className="tri" style={{ fontSize: 11 }}>{hedged ? "hedged to KRW" : "unhedged, USD base"}</div>
          </div>
          <div>
            <div className="lbl">Benchmark</div>
            <div className="num" style={{ fontSize: 26, fontWeight: 600, color: "var(--g1)" }}>{u.sgn(p.bench)}</div>
            <div className="tri" style={{ fontSize: 11 }}>60 / 40 blend</div>
          </div>
          <div>
            <div className="lbl">Excess</div>
            <div style={{ fontSize: 26, fontWeight: 600 }}><Delta v={v - p.bench} pp /></div>
            <div className="tri" style={{ fontSize: 11 }}>after fees</div>
          </div>
          <div style={{ borderLeft: "1px solid var(--g3)", paddingLeft: 28 }}>
            <div className="lbl">of which FX</div>
            <div style={{ fontSize: 26, fontWeight: 600 }}><Delta v={p.fx} pp /></div>
            <div className="tri" style={{ fontSize: 11 }}>KRW base, broken out separately</div>
          </div>
        </div>
        <div className="note mt12">
          A Korean family running USD assets against a KRW base needs the decomposition, not the headline: of the{" "}
          {u.sgn(p.port)} unhedged return, <b>{u.pp(p.fx)}</b> is currency translation and{" "}
          <b>{u.pp(p.port - p.fx)}</b> is the assets themselves.
        </div>
      </Panel>
    );
  }

  function ConcentrationModule({ positions }) {
    const t = u.total(positions);
    const top = u.topHoldings(positions, 10);
    const topShare = (u.total(top) / t) * 100;
    const aff = u.affiliateExposure(positions);
    return (
      <Panel title="Concentration" sub="Top 10 holdings as a share of total assets">
        <div className="row" style={{ gap: 28, alignItems: "flex-start" }}>
          <div style={{ minWidth: 150 }}>
            <div className="lbl">Top 10</div>
            <div className="num" style={{ fontSize: 26, fontWeight: 600 }}>{u.pct(topShare)}</div>
            <div className="tri" style={{ fontSize: 11 }}>of {u.usdC(t)} total assets</div>
          </div>
          <div style={{ flex: 1 }}>
            <table className="t dense">
              <tbody>
                {top.slice(0, 6).map((p) => (
                  <tr key={p.id}>
                    <td style={{ width: 240 }}>
                      <div className="tname">{p.name}</div>
                      {p.affiliate && <div className="tsub" style={{ color: "var(--neg)" }}>Family operating company</div>}
                    </td>
                    <td><BB.ui.MiniBar cur={p.wt} target={0} max={8} /></td>
                    <td className="n num" style={{ width: 60 }}>{u.pct(p.wt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {aff.value > 0 && (
          <div className="note bad mt12">
            <b>Affiliated exposure flag.</b> {aff.items.map((i) => i.name).join(", ")} represents {u.pct(aff.wt)} of total
            assets ({u.usd(aff.value)}). The family's wealth and its income are exposed to the same balance sheet; the
            mandate caps this at 10%.
          </div>
        )}
      </Panel>
    );
  }

  function AttributionModule() {
    const [win, setWin] = useState("YTD");
    const rows = D.attribution[win];
    const max = Math.max(...rows.map((r) => Math.abs(r.pp)));
    return (
      <Panel title="Attribution" sub="Positions that drove the period's return"
        right={<Seg options={[{ v: "MTD", label: "MTD" }, { v: "QTD", label: "QTD" }, { v: "YTD", label: "YTD" }, { v: "ITD", label: "ITD" }]} value={win} onChange={setWin} />}>
        <table className="t dense">
          <tbody>
            {rows.map((r) => (
              <tr key={r.n}>
                <td style={{ width: 230 }} className="tname">{r.n}</td>
                <td>
                  <div style={{ position: "relative", height: 8, background: "var(--g4)" }}>
                    <div style={{
                      position: "absolute", top: 0, bottom: 0, left: "50%",
                      width: (Math.abs(r.pp) / max) * 48 + "%",
                      transform: r.pp < 0 ? "translateX(-100%)" : "none",
                      background: r.pp < 0 ? "var(--neg)" : "var(--pos)", opacity: .8,
                    }} />
                    <div style={{ position: "absolute", left: "50%", top: -2, bottom: -2, width: 1, background: "var(--g3)" }} />
                  </div>
                </td>
                <td className="n" style={{ width: 70 }}><Delta v={r.pp} pp dp={2} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    );
  }

  /* ------------------------------------------------------------ the table */
  function PositionTable({ rows, total, sleeveTotal, onTrade, onList, onValue }) {
    const st = S.get();
    return (
      <div className="tscroll">
      <table className="t">
        <thead>
          <tr>
            <th style={{ minWidth: 240 }}>Position</th>
            <th>Provenance</th>
            <th className="n">Price</th>
            <th className="n">Chg</th>
            <th className="n">Quantity</th>
            <th className="n">Cost basis</th>
            <th className="n">Value</th>
            <th className="n">Unrealised</th>
            <th className="n hide-narrow">Realised YTD</th>
            <th className="n hide-narrow">Wt sleeve</th>
            <th className="n">Wt total</th>
            <th className="n hide-narrow">FX</th>
            <th className="hide-narrow">Tags</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const listed = p.liq === "Daily";
            const el = u.eligibility(p);
            const fx = FX_RET[p.ccy] || 0;
            return (
              <tr key={p.id}>
                <td>
                  <div className="tname">{p.name}</div>
                  <div className="tsub">
                    {p.ticker ? <span className="mono">{p.ticker}</span> : p.grp}
                    {p.legacy && <> · was <span className="mono">{p.legacy}</span></>}
                  </div>
                </td>
                <td><ProvBadge p={p} /></td>
                <td className="n num">{p.px ? u.localPx(p) : "—"}
                  {p.ccy !== "USD" && p.px ? <span className="krw">{u.usd(p.pxUsd, 2)}</span> : null}</td>
                <td className="n">{p.chg !== undefined ? <Delta v={p.chg} dp={2} /> : <span className="tri">—</span>}</td>
                <td className="n num">{p.qty ? u.num(p.qty) : "—"}</td>
                <td className="n num">{u.usd(p.cost)}</td>
                <td className="n"><Money v={p.value} /></td>
                <td className="n"><Delta v={p.value - p.cost} usd />
                  <span className="krw">{u.sgn(((p.value - p.cost) / p.cost) * 100)}</span></td>
                <td className="n num hide-narrow">{p.realizedYTD ? u.usd(p.realizedYTD) : "—"}</td>
                <td className="n num hide-narrow">{u.pct((p.value / sleeveTotal) * 100)}</td>
                <td className="n num">{u.pct((p.value / total) * 100)}</td>
                <td className="n hide-narrow">
                  <span className="bdg plain">{p.ccy}</span>
                  {fx !== 0 && <div className="krw"><Delta v={fx} pp /></div>}
                </td>
                <td className="hide-narrow">
                  <span className="chip">{p.sector}</span>
                  <span className="chip">{p.geo}</span>
                  {p.affiliate && <span className="chip" style={{ color: "var(--neg)", borderColor: "#E7C7C2" }}>Affiliate</span>}
                </td>
                <td className="right">
                  <div className="rowbtns">
                    {listed ? (
                      <>
                        <Lock sleeve={p.sleeve}><button className="btn sm p" onClick={() => onTrade(p, "buy")}>Trade</button></Lock>
                        <Lock sleeve={p.sleeve}><button className="btn sm" onClick={() => onTrade(p, "sell")}>Sell</button></Lock>
                        {/* Trading Core is the Principal's; proposing it is not. */}
                        {!S.canWrite(p.sleeve) && (
                          <button className="btn sm" onClick={() => onTrade(p, "buy")}>Propose</button>
                        )}
                      </>
                    ) : (
                      <>
                        {p.prov === "self" && (
                          <Lock sleeve={p.sleeve}><button className="btn sm" onClick={() => onValue(p)}>Update valuation</button></Lock>
                        )}
                        {el.ok
                          ? <Lock sleeve={p.sleeve}><button className="btn sm p" onClick={() => onList(p)}>List on secondary</button></Lock>
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
    const [trade, setTrade] = useState(null);
    const [list, setList] = useState(null);
    const [value, setValue] = useState(null);

    React.useEffect(() => { setSubFilter(route.query.sub || ""); }, [route.query.sub, key]);

    if (!cls) return <div className="wrap page"><div className="empty">Unknown asset class.</div></div>;

    const all = st.positions.filter((p) => p.cls === key);
    const rows = subFilter ? all.filter((p) => p.sub === subFilter) : all;
    const t = u.total(st.positions);
    const clsTotal = u.total(all);
    const subs = u.bySub(st.positions).filter((s) => s.cls === key);
    const info = u.byClass(st.positions).find((c) => c.key === key);
    const deep = key === "equity" || key === "debt";

    return (
      <div className="wrap page">
        <Crumb items={[{ label: "Portfolio", to: "/portfolio" }, { label: cls.label }]} />
        <div className="between">
          <div>
            <h1>{cls.label}</h1>
            <div className="sub mt8">{all.length} positions · {all.filter((p) => p.liq === "Daily").length} listed · {all.filter((p) => p.liq !== "Daily").length} private</div>
          </div>
          <div className="right">
            <div className="stat-l">Weight vs target</div>
            <div className="stat-v sm">{u.pct(info.wt)} <span className="tri">/ {u.pct(info.target)} target</span></div>
          </div>
        </div>

        <div className="band mt16">
          <div className="cell"><div className="stat-l">Value</div><div className="stat-v"><Money v={clsTotal} compact /></div></div>
          <div className="cell"><div className="stat-l">Cost basis</div><div className="stat-v"><Money v={u.sum(all, (p) => p.cost)} compact /></div></div>
          <div className="cell"><div className="stat-l">Unrealised</div><div className="stat-v"><Delta v={u.unrealized(all)} usd /></div>
            <div className="stat-s">{u.sgn((u.unrealized(all) / u.sum(all, (p) => p.cost)) * 100)} on cost</div></div>
          <div className="cell"><div className="stat-l">Realised YTD</div><div className="stat-v"><Money v={u.realizedYTD(all)} compact /></div></div>
          <div className="cell"><div className="stat-l">Daily-liquid share</div>
            <div className="stat-v">{u.pct((u.total(all.filter((p) => p.liq === "Daily")) / clsTotal) * 100)}</div>
            <div className="stat-s">{u.usdC(u.total(all.filter((p) => p.liq === "Daily")))} realisable</div></div>
        </div>

        {deep && (
          <>
            <div className="grid mt16" style={{ gridTemplateColumns: "1fr" }}><PerfModule positions={all} clsKey={key} /></div>
            <div className="grid mt16" style={{ gridTemplateColumns: "1.25fr 1fr" }}>
              <ConcentrationModule positions={st.positions} />
              <AttributionModule />
            </div>
          </>
        )}

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
              <PositionTable rows={items} total={t} sleeveTotal={clsTotal}
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
