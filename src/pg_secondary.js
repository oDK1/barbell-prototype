/* /secondary — bulletin board for illiquid positions originated on Barbell. */
(function () {
  const { useState } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Money, Delta, Panel, Crumb, Tabs, Fit, MiniBar } = BB.ui;
  const { Agent } = BB.agent;

  const STATUS_MEANS = {
    "Open": "Available. Take the ask, or bid below it.",
    "Settled": "Sold. Ownership record updated.",
  };
  function StatusBadge({ s }) {
    return <span className={"bdg " + (s === "Settled" ? "live" : "plain")} title={STATUS_MEANS[s] || ""}>
      {s === "Settled" && <i className="pt" />}{s}
    </span>;
  }

  function Board() {
    const st = S.useStore();
    const [list, setList] = useState(null);
    const [buy, setBuy] = useState(null);
    const [allRows, setAllRows] = useState(false);
    const [allMine, setAllMine] = useState(false);
    /* the board is what can be bought — settled listings are history */
    const rows = st.listings.filter((l) => l.status === "Open");
    const ctx = u.marketContext(st.positions, st.mandate, st.realizedClosed);
    /* eligible first: the rows that can actually be acted on */
    const mine = st.positions.filter((p) => p.liq !== "Daily")
      .sort((a, b) => (u.eligibility(b).ok ? 1 : 0) - (u.eligibility(a).ok ? 1 : 0) || b.value - a.value);
    const SHOW = 5, SHOW_MINE = 4;
    const shownRows = allRows ? rows : rows.slice(0, SHOW);
    const shownMine = allMine ? mine : mine.slice(0, SHOW_MINE);

    return (
      <div className="wrap page">
        <div className="between">
          <div>
            <div className="eyebrow">Secondary · members only</div>
            <h1 className="mt8">Secondary board</h1>
          </div>
        </div>

        <div className="panel mt16">
          <div className="panel-hd">
            <h3>Listings <span className="tri" style={{ fontWeight: 400 }}>{shownRows.length} of {rows.length}</span></h3>
            <span className="tri" style={{ fontSize: 11 }}>
              Sellers are blind identifiers · a listing stays open until someone takes the ask or the seller accepts a bid
            </span>
          </div>
          <div className="tscroll">
          <table className="t">
            <thead>
              <tr>
                <th style={{ minWidth: 240 }}>Instrument</th><th>Fills</th><th className="n">Current IRR</th><th>Liquidity</th>
                <th className="n">Last NAV</th><th className="n">Size offered</th><th className="n">Fit</th>
                <th className="hide-narrow" style={{ minWidth: 170 }}>Why</th><th></th>
              </tr>
            </thead>
            <tbody>
              {shownRows.map((l) => {
                const v = u.listingView(l, ctx);
                return (
                  <tr key={l.id} className="clickable" onClick={() => S.navigate("/secondary/" + l.id)}>
                    <td>
                      <div className="tname">{l.instrument}</div>
                      <div className="tsub">{l.manager} · vintage {l.vintage}</div>
                    </td>
                    <td>{u.subLabel(l.sub)}<div className="tsub">{u.modelClassLabel(l.sub)}</div></td>
                    <td className="n">
                      {v.irr
                        ? <span title={"Annualised from the interest's own capital account to the " + u.fmtDate(l.account[l.account.length - 1][0]) + " mark, which is the manager's own."}>
                            <Delta v={v.irr.irr} dp={1} />
                            <div className="tsub">since {v.irr.since}</div>
                          </span>
                        : <span className="tri">—</span>}
                    </td>
                    <td><span className="bdg plain">Locked</span></td>
                    <td className="n num">{u.usd(l.nav)}</td>
                    <td className="n num">{u.usd(l.size)}</td>
                    <td className="n"><Fit score={v.sc.score} /></td>
                    <td className="hide-narrow" style={{ maxWidth: 260 }}>
                      <div className="tsub" style={{ fontSize: 11.5, color: "var(--g1)" }}>{v.why}</div>
                    </td>
                    <td className="right">
                      {!l.mine
                        ? <button className="btn sm" onClick={(e) => { e.stopPropagation(); setBuy(l); }}>
                            Buy at {u.pct(l.askPct)}
                          </button>
                        : <span className="tri">›</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          {rows.length > SHOW && (
            <button className="btn block" style={{ border: 0, borderTop: "1px solid var(--g3)", borderRadius: 0 }}
              onClick={() => setAllRows(!allRows)}>
              {allRows ? "Show fewer" : "Show all " + rows.length + " listings"}
              <span className="tri" style={{ marginLeft: 6 }}>{allRows ? "▴" : "▾"}</span>
            </button>
          )}
        </div>

        <h2 className="mt24 mb12">Your positions</h2>
        <div className="panel">
          <div className="panel-hd">
            <h3>Eligibility <span className="tri" style={{ fontWeight: 400 }}>{shownMine.length} of {mine.length}</span></h3>
            <span className="tri" style={{ fontSize: 11 }}>Only illiquid positions originated on Barbell, held 12 months, are listable.</span>
          </div>
          <table className="t dense">
            <thead><tr><th>Position</th><th>Subcategory</th><th>Origin</th><th className="n">Held</th><th className="n">Value</th><th>Eligibility</th><th></th></tr></thead>
            <tbody>
              {shownMine.map((p) => {
                const e = u.eligibility(p);
                return (
                  <tr key={p.id} style={e.ok ? null : { opacity: .55 }}>
                    <td><div className="tname">{p.name}</div>{p.legacy && <div className="tsub mono">{p.legacy}</div>}</td>
                    <td>{u.subLabel(p.sub)}</td>
                    <td>{p.onBarbell ? <span className="bdg hanwha"><i className="pt" />Barbell</span> : <span className="bdg plain">External</span>}</td>
                    <td className="n num">{Math.floor(u.days(p.acquired) / 30)}m</td>
                    <td className="n num">{u.usd(p.value)}</td>
                    <td>{e.ok ? <span className="bdg live"><i className="pt" />Eligible</span> : <span className="tri">{e.reason}</span>}</td>
                    <td className="right">
                      {e.ok
                        ? <button className="btn sm p" onClick={() => setList(p)}>List on secondary</button>
                        : <span className="tip" data-tip={e.reason}><button className="btn sm" disabled>List on secondary</button></span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {mine.length > SHOW_MINE && (
            <button className="btn block" style={{ border: 0, borderTop: "1px solid var(--g3)", borderRadius: 0 }}
              onClick={() => setAllMine(!allMine)}>
              {allMine ? "Show fewer" : "Show all " + mine.length + " positions"}
              <span className="tri" style={{ marginLeft: 6 }}>{allMine ? "▴" : "▾"}</span>
            </button>
          )}
        </div>

        <div className="note mt16">
          Listed instruments never appear here. An ETF or a Treasury line carries ordinary market liquidity and sells
          through the order ticket in the portfolio — which is why the portfolio shows “Sell” on those rows and
          “List on secondary” only on the illiquid ones.
        </div>

        {list && <BB.flows.ListingFlow p={list} onClose={() => setList(null)} />}
        {buy && <BB.flows.BuyNowFlow listing={buy} onClose={() => setBuy(null)} />}
      </div>
    );
  }

  function Listing({ route }) {
    const st = S.useStore();
    const l = st.listings.find((x) => x.id === route.parts[1]);
    const [bid, setBid] = useState(false);
    const [buy, setBuy] = useState(false);
    const [tab, setTab] = useState("thesis");
    if (!l) return <div className="wrap page"><div className="empty">Unknown listing.</div></div>;
    const bids = st.bids.filter((b) => b.listingId === l.id);
    const isSeller = !!l.mine;
    const consideration = Math.round(l.size * l.askPct / 100);
    const discount = 100 - l.askPct;

    /* Scored on the same four grounds as a primary offering, so a listing and
       a deal can be compared. On a secondary board the price is the merit
       argument, so merit is the discount to the last mark. */
    const ctx = u.marketContext(st.positions, st.mandate, st.realizedClosed);
    const sc = u.listingView(l, ctx).sc;
    const hist = u.tradeHistory(l.id, st.trades, l.askPct);
    const gap = u.bySub(st.positions).find((x) => x.key === l.sub);
    const gapWord = (x) => u.num(Math.abs(x || 0), 1) + "pp " + ((x || 0) > 0 ? "below" : "above") + " the model";
    const why = u.listingView(l, ctx).why;

    const tabs = [{ k: "thesis", label: "Overview" }, { k: "terms", label: "Terms" },
      { k: "docs", label: "Documents", n: u.listingDocs(l).length }];

    return (
      <div className="wrap page">
        <Crumb items={[{ label: "Secondary", to: "/secondary" }, { label: l.instrument }]} />
        <div className="between">
          <div>
            <div className="row tight" style={{ alignItems: "center" }}>
              <span className="bdg plain">{u.subLabel(l.sub)}</span>
              <span className="bdg plain">Vintage {l.vintage}</span>
              <StatusBadge s={l.status} />
            </div>
            <h1 className="mt8">{l.instrument}</h1>
            <div className="sub mt8">{l.manager} · seller {l.seller}</div>
          </div>
          <div className="btn-row">
            {!isSeller && (
              <>
                <button className="btn p lg" disabled={l.status === "Settled"} onClick={() => setBuy(true)}>
                  Buy now at {u.pct(l.askPct)} · {u.usdC(consideration)}
                </button>
                <button className="btn lg" disabled={l.status === "Settled"} onClick={() => setBid(true)}>Bid below the ask</button>
              </>
            )}
          </div>
        </div>

        {l.status !== "Open" && (
          <div className={"note mt12 " + (l.status === "Settled" ? "" : "warn")}>
            <b>{l.status}.</b> {STATUS_MEANS[l.status]}
          </div>
        )}

        <div className="band mt16">
          <div className="cell"><div className="stat-l">Last NAV</div><div className="stat-v"><Money v={l.nav} compact /></div>
            <div className="stat-s">as of 30 Jun 2026</div></div>
          <div className="cell"><div className="stat-l">Size offered</div><div className="stat-v"><Money v={l.size} compact /></div></div>
          <div className="cell"><div className="stat-l">Ask</div><div className="stat-v">{u.pct(l.askPct)}</div>
            <div className="stat-s">{u.usd(consideration)} consideration</div></div>
          <div className="cell"><div className="stat-l">Indicative fair range</div><div className="stat-v sm">{l.indicative[0]}–{l.indicative[1]}%</div>
            <div className="stat-s">platform estimate</div></div>
          <div className="cell"><div className="stat-l">Fit</div><div className="stat-v sm"><Fit score={sc.score} /></div>
            <div className="stat-s">{l.days} days listed</div></div>
        </div>

        <div className="mt16">
          <Agent where="Deal fit"
            why={["Allocation " + sc.allocation + "/100 — " + u.subLabel(l.sub) + " sits " + gapWord(ctx.under[l.sub]),
                  "Liquidity " + sc.liquidity + "/100 — a transferred interest is locked until the fund returns capital, against " +
                    u.usdC(ctx.calls24) + " of calls over 24 months",
                  "Tax " + sc.tax + "/100 — " + u.usd(ctx.tax.realized) + " realised year to date",
                  "Merit " + sc.merit + "/100 — the discount to the last mark, which is the whole argument on a secondary",
                  "Weighting: merit 35% · allocation 30% · liquidity 20% · tax 15%"]}
            actions={<button className="btn sm" onClick={() => S.navigate("/secondary")}>Compare the board</button>}>
            {why}
            <table className="t dense mt12" style={{ maxWidth: 520 }}>
              <tbody>
                {[["Allocation", sc.allocation, u.subLabel(l.sub) + " " + gapWord(ctx.under[l.sub])],
                  ["Liquidity", sc.liquidity, "locked" + (ctx.short ? " · cash breaks " + ctx.short.month : " · calls covered")],
                  ["Tax", sc.tax, ["pe", "vc", "preipo"].indexOf(l.sub) >= 0 ? "gain deferred to exit" : "taxable as it arrives"],
                  ["Instrument merit", sc.merit, discount > 0 ? u.pct(discount) + " below the last mark" : "above the last mark"]].map((r) => (
                  <tr key={r[0]}>
                    <td style={{ width: 140 }} className="tri">{r[0]}</td>
                    <td style={{ width: 90 }}><Fit score={r[1]} /></td>
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
                <div>
                  <div className="prose">{l.rationale || "No rationale given by the seller."}</div>
                  <h3 className="mt16" style={{ fontSize: 13 }}>Capital account history</h3>
                  <table className="t dense mt8">
                    <thead><tr><th>Date</th><th>Event</th><th className="n">Amount</th></tr></thead>
                    <tbody>
                      {l.account.map((r, i) => (
                        <tr key={i}>
                          <td className="num">{u.fmtDate(r[0])}</td>
                          <td className="tname">{r[1]}</td>
                          <td className="n num">{r[2] < 0 ? "−" + u.usd(Math.abs(r[2])) : u.usd(r[2])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {tab === "terms" && (
                <table className="t dense">
                  <tbody>
                    {[["Instrument", l.instrument], ["Manager", l.manager], ["Vintage", l.vintage],
                      ["IRR to date", u.currentIRR(l)
                        ? u.sgn(u.currentIRR(l).irr) + " annualised since " + u.currentIRR(l).since
                          + " — to the last mark, which the manager reports"
                        : "Not computable from the capital account"],
                      ["Subcategory", u.subLabel(l.sub)], ["Last NAV", u.usd(l.nav) + " as of 30 Jun 2026"],
                      ["Size offered", u.usd(l.size)], ["Ask", u.pct(l.askPct) + " of last NAV"],
                      ["Consideration", u.usd(consideration)],
                      ["Indicative fair range", l.indicative[0] + "–" + l.indicative[1] + "% of last NAV"],
                      ["Unfunded commitment", l.unfunded ? u.usd(l.unfunded) + " transfers with the interest" : "None"],
                      ["Transfer mechanics", "Ownership record updated on acceptance"],
                      ["Settlement", "Same day"],
                      ["GP consent", "Pre-cleared for platform transfers"],
                      ["Seller", l.seller + " · blind identifier"]].map((r) => (
                      <tr key={r[0]}><td className="tri" style={{ width: 220 }}>{r[0]}</td><td className="tname">{r[1]}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
              {tab === "docs" && (
                <table className="t dense">
                  <tbody>{u.listingDocs(l).map((d) => (
                    <tr key={d[0]}>
                      <td><span className="mono tri" style={{ marginRight: 10 }}>DOC</span><span className="tname">{d[0]}</span></td>
                      <td className="tri">{d[1]}</td>
                      <td className="right"><button className="btn sm" onClick={() => S.toast("Document opened — " + d[0])}>Open</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </div>

          <div>
            <Panel title="Transaction" sub="Secondary transfer · same-day settlement">
              <div className="kv">
                <span className="k">Mechanic</span><span className="v">Take the ask, or bid below it</span>
                <span className="k">Ask</span><span className="v">{u.pct(l.askPct)} of last NAV</span>
                <span className="k">You pay</span><span className="v">{u.usd(consideration)}</span>
                <span className="k">IRR to date</span>
                <span className="v">{u.currentIRR(l) ? u.sgn(u.currentIRR(l).irr) : "—"}</span>
                <span className="k">Liquidity</span><span className="v">Locked until the fund returns capital</span>
                {l.unfunded ? <><span className="k">Unfunded</span><span className="v">{u.usd(l.unfunded)}</span></> : null}
                <span className="k">Days listed</span><span className="v">{l.days}</span>
              </div>
            </Panel>

            <div className="mt16">
              <Panel title="Allocation context">
                <div className="kv">
                  <span className="k">Subcategory</span><span className="v">{gap ? gap.label : u.subLabel(l.sub)}</span>
                  <span className="k">Held today</span><span className="v">{u.pct(gap ? gap.wt : 0)}</span>
                  <span className="k">Mandate target</span><span className="v">{u.pct(gap ? gap.target : 0)}</span>
                </div>
                {gap && <div className="mt12"><MiniBar cur={gap.wt} target={gap.target} max={Math.max(gap.wt, gap.target) * 1.4} /></div>}
              </Panel>
            </div>
          </div>
        </div>

        <div className="panel mt16">
          <div className="panel-hd">
            <div>
              <h3>Transfer history</h3>
              <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>
                What this interest has cleared at on the platform before
              </div>
            </div>
            {hist.last && (
              <span className="tri" style={{ fontSize: 11.5 }}>
                Last cleared <b className="num">{u.pct(hist.last.pricePct)}</b> on {u.fmtDate(hist.last.ts)} ·
                today's ask is <b className="num">{u.pp(hist.vsLast)}</b> against it
              </span>
            )}
          </div>
          {hist.rows.length === 0
            ? <div className="empty">No prior transfers of this interest on the platform.</div>
            : (
              <table className="t dense">
                <thead><tr><th>Date</th><th className="n">Size</th><th className="n">Price</th>
                  <th className="n">Consideration</th><th>Cleared</th><th>Priced against</th><th>Counterparties</th></tr></thead>
                <tbody>
                  {hist.rows.map((t) => (
                    <tr key={t.id}>
                      <td className="num">{u.fmtDate(t.ts)}</td>
                      <td className="n num">{u.usd(t.size)}</td>
                      <td className="n num" style={{ fontWeight: 600 }}>{u.pct(t.pricePct)}</td>
                      <td className="n num">{u.usd(Math.round(t.size * t.pricePct / 100))}</td>
                      <td><span className="bdg plain">{t.method}</span></td>
                      <td className="tri num">{u.fmtDate(t.navDate)} NAV</td>
                      <td className="mono tri" style={{ fontSize: 11 }}>{t.seller} → {t.buyer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>

        <div className="panel mt16">
          <div className="panel-hd">
            <h3>{isSeller ? "Inbound bids" : "Bid activity"}</h3>
            <span className="tri" style={{ fontSize: 11 }}>{isSeller ? "Accept, counter or decline." : "Bids are non-binding until the seller accepts."}</span>
          </div>
          {bids.length === 0 ? <div className="empty">No bids yet.</div> : (
            <table className="t dense">
              <thead><tr><th>Bidder</th><th>Submitted</th><th className="n">Price</th><th className="n">Size</th><th className="n">Consideration</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {bids.map((b) => (
                  <tr key={b.id}>
                    <td className="mono">{b.bidder || (b.from === "principal" ? "Member #0147" : "Member #0148")}</td>
                    <td className="num">{u.fmtTs(b.ts)}</td>
                    <td className="n num">{u.pct(b.price)}</td>
                    <td className="n num">{u.usd(b.size)}</td>
                    <td className="n num">{u.usd(Math.round(b.size * b.price / 100))}</td>
                    <td><span className="bdg plain">{b.status}</span></td>
                    <td className="right">
                      {b.status === "Submitted" && (
                        <div className="rowbtns">
                          <button className="btn sm p" onClick={() => S.actions.decideBid(b.id, "Accepted")}>Accept</button>
                          <button className="btn sm" onClick={() => S.actions.decideBid(b.id, "Countered")}>Counter</button>
                          <button className="btn sm danger" onClick={() => S.actions.decideBid(b.id, "Declined")}>Decline</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="note" style={{ borderTop: "1px solid var(--g3)", borderLeft: 0, borderRight: 0, borderBottom: 0 }}>
Two ways in: take the ask and it settles immediately, or bid below it and wait for the seller to accept
            from the queue above. A bid does not reserve anything — the listing stays open meanwhile.
          </div>
        </div>

        {bid && <BB.flows.BidFlow listing={l} onClose={() => setBid(false)} />}
        {buy && <BB.flows.BuyNowFlow listing={l} onClose={() => setBuy(false)} />}
      </div>
    );
  }

  BB.pages = BB.pages || {};
  BB.pages.Secondary = Board;
  BB.pages.Listing = Listing;
})();
