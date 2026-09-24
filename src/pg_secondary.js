/* /secondary — bulletin board for illiquid positions originated on Barbell. */
(function () {
  const { useState } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Money, Delta, Panel, Crumb, Lock } = BB.ui;

  const STATUS_MEANS = {
    "Open": "No bids yet. Take the ask, or bid below it.",
    "Under negotiation": "A bid below the ask is with the seller. Taking the ask still settles immediately.",
    "Settled": "Sold. Ownership record updated.",
  };
  function StatusBadge({ s }) {
    const cls = s === "Settled" ? "live" : s === "Under negotiation" ? "self warn" : "plain";
    return <span className={"bdg " + cls} title={STATUS_MEANS[s] || ""}>{cls !== "plain" && <i className="pt" />}{s}</span>;
  }

  function Board() {
    const st = S.useStore();
    const [f, setF] = useState("");
    const [list, setList] = useState(null);
    const [buy, setBuy] = useState(null);
    const rows = st.listings.filter((l) => !f || l.status === f);
    const mine = st.positions.filter((p) => p.liq !== "Daily");

    return (
      <div className="wrap page">
        <div className="between">
          <div>
            <div className="eyebrow">Secondary · members only</div>
            <h1 className="mt8">Liquidity for the illiquid half</h1>
            <div className="sub mt8" style={{ maxWidth: "76ch" }}>
              A bulletin board, not a continuous order book. The inventory is deliberately narrow: private offerings bought
              on Barbell and held at least twelve months. Listed securities are absent because they already have a market.
            </div>
          </div>
          <div className="btn-row">
            <BB.ui.Seg options={[{ v: "", label: "All" }, { v: "Open", label: "Open" }, { v: "Under negotiation", label: "Negotiating" }, { v: "Settled", label: "Settled" }]}
              value={f} onChange={setF} />
          </div>
        </div>

        <div className="band mt16">
          <div className="cell"><div className="stat-l">Listings</div><div className="stat-v">{st.listings.length}</div>
            <div className="stat-s">{st.listings.filter((l) => l.status === "Open").length} open</div></div>
          <div className="cell"><div className="stat-l">Offered size</div><div className="stat-v"><Money v={u.sum(st.listings, (l) => l.size)} compact /></div></div>
          <div className="cell"><div className="stat-l">Median ask</div>
            <div className="stat-v">{u.pct(st.listings.map((l) => l.askPct).sort((a, b) => a - b)[Math.floor(st.listings.length / 2)])}</div>
            <div className="stat-s">of last NAV</div></div>
          <div className="cell"><div className="stat-l">Your eligible positions</div>
            <div className="stat-v">{mine.filter((p) => u.eligibility(p).ok).length}</div>
            <div className="stat-s">{mine.filter((p) => !u.eligibility(p).ok).length} not yet eligible</div></div>
          <div className="cell"><div className="stat-l">Settlement</div><div className="stat-v sm">Same day</div>
            <div className="stat-s">ownership record updated on acceptance</div></div>
        </div>

        <div className="panel mt16">
          <div className="panel-hd">
            <h3>Listings</h3>
            <span className="tri" style={{ fontSize: 11 }}>
              Sellers are blind identifiers · “Under negotiation” means a bid is with the seller; the ask is still open
            </span>
          </div>
          <table className="t">
            <thead>
              <tr>
                <th style={{ minWidth: 260 }}>Instrument</th><th>Vintage</th><th className="n">Last NAV</th><th className="n">Size offered</th>
                <th className="n">Ask</th><th className="n">Indicative</th><th>Seller</th><th className="n">Days listed</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="clickable" onClick={() => S.navigate("/secondary/" + l.id)}>
                  <td>
                    <div className="tname">{l.instrument}</div>
                    <div className="tsub">{u.subLabel(l.sub)} · {l.manager}</div>
                  </td>
                  <td className="num">{l.vintage}</td>
                  <td className="n num">{u.usd(l.nav)}</td>
                  <td className="n num">{u.usd(l.size)}</td>
                  <td className="n num" style={{ fontWeight: 600 }}>{u.pct(l.askPct)}</td>
                  <td className="n num tri">{l.indicative[0]}–{l.indicative[1]}%</td>
                  <td className="mono" style={{ fontSize: 11 }}>{l.seller}</td>
                  <td className="n num">{l.days}</td>
                  <td><StatusBadge s={l.status} /></td>
                  <td className="right">
                    {l.status !== "Settled" && !l.mine
                      ? <Lock sleeve={st.account === "successor" ? "alpha" : "core"}>
                          <button className="btn sm" onClick={(e) => { e.stopPropagation(); setBuy(l); }}>
                            Buy at {u.pct(l.askPct)}
                          </button>
                        </Lock>
                      : <span className="tri">›</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt24 mb12">Your positions</h2>
        <div className="panel">
          <div className="panel-hd">
            <h3>Eligibility</h3>
            <span className="tri" style={{ fontSize: 11 }}>Only illiquid positions originated on Barbell, held 12 months, are listable.</span>
          </div>
          <table className="t dense">
            <thead><tr><th>Position</th><th>Subcategory</th><th>Origin</th><th className="n">Held</th><th className="n">Value</th><th>Eligibility</th><th></th></tr></thead>
            <tbody>
              {mine.map((p) => {
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
                        ? <Lock sleeve={p.sleeve}><button className="btn sm p" onClick={() => setList(p)}>List on secondary</button></Lock>
                        : <span className="tip" data-tip={e.reason}><button className="btn sm" disabled>List on secondary</button></span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
    if (!l) return <div className="wrap page"><div className="empty">Unknown listing.</div></div>;
    const bids = st.bids.filter((b) => b.listingId === l.id);
    const isSeller = !!l.mine;

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
                <Lock sleeve={st.account === "successor" ? "alpha" : "core"}>
                  <button className="btn p lg" disabled={l.status === "Settled"} onClick={() => setBuy(true)}>
                    Buy now at {u.pct(l.askPct)} · {u.usdC(Math.round(l.size * l.askPct / 100))}
                  </button>
                </Lock>
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
            <div className="stat-s">{u.usd(Math.round(l.size * l.askPct / 100))} consideration</div></div>
          <div className="cell"><div className="stat-l">Indicative fair range</div><div className="stat-v sm">{l.indicative[0]}–{l.indicative[1]}%</div>
            <div className="stat-s">platform estimate</div></div>
          <div className="cell"><div className="stat-l">Days listed</div><div className="stat-v">{l.days}</div>
            <div className="stat-s">{l.unfunded ? u.usd(l.unfunded) + " unfunded transfers with the interest" : "no unfunded commitment"}</div></div>
        </div>

        <div className="grid mt16" style={{ gridTemplateColumns: "1.4fr 1fr", alignItems: "start" }}>
          <Panel title="Capital account history">
            <table className="t dense">
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
          </Panel>
          <div>
            <Panel title="Seller's rationale">
              <div className="prose" style={{ fontSize: 12.5 }}>{l.rationale || "No rationale given."}</div>
              <hr className="hr" />
              <div className="kv">
                <span className="k">Transfer mechanics</span><span className="v">Ownership record updated on acceptance</span>
                <span className="k">Settlement</span><span className="v">Same day</span>
                <span className="k">GP consent</span><span className="v">Pre-cleared for platform transfers</span>
              </div>
            </Panel>
          </div>
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
Two ways in: take the ask and it settles immediately, or bid below it and the listing moves to
            “Under negotiation” for the seller to accept from the queue above. Both are walkable here.
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
