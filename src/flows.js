/* Transaction flows. Identical in shape for listed and private instruments;
   only the mechanic at the point of transaction differs. */
(function () {
  const { useState } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Modal, Money, Delta, Amount } = BB.ui;

  /* Allocation impact — shown before every confirmation. */
  function Impact({ subKey, amount }) {
    const st = S.get();
    if (!amount) return <div className="note">Enter an amount to see the allocation impact.</div>;
    const i = u.impact(st.positions, subKey, amount);
    return (
      <div className="panel">
        <div className="panel-hd"><h3>Allocation impact</h3>
          <span className="tri" style={{ fontSize: 11 }}>for information</span></div>
        <table className="t dense">
          <thead><tr><th></th><th className="n">Before</th><th className="n">After</th><th className="n">vs target</th></tr></thead>
          <tbody>
            <tr>
              <td><div className="tname">{i.sub.label}</div><div className="tsub">target {u.pct(i.sub.target)}</div></td>
              <td className="n num">{u.pct(i.sub.wt)}</td>
              <td className="n num">{u.pct(i.subAfter)}</td>
              <td className="n tri num">{(i.subDriftAfter > 0 ? "+" : "−") + Math.abs(i.subDriftAfter).toFixed(1) + "pp"}</td>
            </tr>
            <tr>
              <td><div className="tname">{i.cls.label}</div><div className="tsub">target {u.pct(i.cls.target)}</div></td>
              <td className="n num">{u.pct(i.cls.wt)}</td>
              <td className="n num">{u.pct(i.clsAfter)}</td>
              <td className="n tri num">{(i.clsDriftAfter > 0 ? "+" : "−") + Math.abs(i.clsDriftAfter).toFixed(1) + "pp"}</td>
            </tr>
          </tbody>
        </table>
        <div className="why" style={{ borderTop: "1px solid var(--g3)" }}>
          {i.sub.label} would move from {u.pct(i.sub.wt)} to {u.pct(i.subAfter)} of total assets.
        </div>
      </div>
    );
  }

  function SleevePicker({ sleeve, setSleeve, note }) {
    const st = S.get();
    if (st.account === "principal") {
      return (
        <label className="f"><span>Sleeve</span>
          <select value={sleeve} onChange={(e) => setSleeve(e.target.value)}>
            <option value="core">Core — $56.2M · Principal authority</option>
            <option value="alpha">Alpha — $6.2M · Successor authority</option>
          </select>
        </label>
      );
    }
    return (
      <label className="f"><span>Sleeve</span>
        <select value={sleeve} onChange={(e) => setSleeve(e.target.value)}>
          <option value="alpha">Alpha — within your authority</option>
          <option value="core">Core — requires the Principal's approval</option>
        </select>
        {note && <div className="tri" style={{ fontSize: 11, marginTop: 4 }}>{note}</div>}
      </label>
    );
  }

  /* --------------------------------------------------------- order ticket */
  function TradeTicket({ instrument, side: side0, onClose }) {
    const st = S.useStore();
    const [side, setSide] = useState(side0 || "buy");
    const [mode, setMode] = useState("notional");
    const [amount, setAmount] = useState("");
    const [qty, setQty] = useState("");
    const [orderType, setOrderType] = useState("market");
    const [limit, setLimit] = useState(instrument.px || "");
    const [sleeve, setSleeve] = useState(instrument.sleeve || (st.account === "successor" ? "alpha" : "core"));
    const [rationale, setRationale] = useState("");

    const px = instrument.pxUsd || instrument.px || 1;
    const notional = mode === "notional" ? (amount || 0) : Math.round((qty || 0) * px);
    const needsApproval = st.account === "successor" && sleeve === "core";
    const cash = u.total(st.positions.filter((p) => p.cls === "cash" && (sleeve === "alpha" ? p.sleeve === "alpha" : true)));
    const overCash = side === "buy" && notional > cash;

    const confirm = () => {
      const args = {
        side, name: instrument.name, ticker: instrument.ticker, sub: instrument.sub, cls: instrument.cls,
        amount: notional, qty: mode === "qty" ? qty : Math.round(notional / px), px, sleeve, orderType, limit,
      };
      if (needsApproval) {
        S.actions.propose({
          type: "Trade", sleeve: "core", amount: notional,
          title: (side === "buy" ? "Buy " : "Sell ") + u.usd(notional) + " " + instrument.name + " in Core",
          target: instrument.id || instrument.ticker,
          rationale: rationale || "Submitted from the order ticket.",
          payload: { kind: "trade", args },
        });
      } else {
        S.actions.trade(args);
      }
      onClose();
    };

    return (
      <Modal title="Order ticket" sub={instrument.name + (instrument.ticker ? " · " + instrument.ticker : "")} onClose={onClose} wide
        footer={
          <>
            <div className="tri" style={{ fontSize: 11.5 }}>
              Routed through Hanwha Securities · settles same day · ownership record updated on settlement.
            </div>
            <div className="btn-row">
              <button className="btn" onClick={onClose}>Cancel</button>
              <button className="btn p" disabled={!notional || overCash} onClick={confirm}>
                {needsApproval ? "Submit proposal to Principal" : side === "buy" ? "Confirm purchase" : "Confirm sale"}
              </button>
            </div>
          </>
        }>
        <div className="row" style={{ gap: 16, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div className="grid" style={{ gap: 12 }}>
              <div className="row tight">
                <BB.ui.Seg options={[{ v: "buy", label: "Buy" }, { v: "sell", label: "Sell" }]} value={side} onChange={setSide} />
                <BB.ui.Seg options={[{ v: "market", label: "Market" }, { v: "limit", label: "Limit" }]} value={orderType} onChange={setOrderType} />
              </div>
              <div className="row tight">
                <BB.ui.Seg options={[{ v: "notional", label: "Notional" }, { v: "qty", label: "Quantity" }]} value={mode} onChange={setMode} />
              </div>
              {mode === "notional"
                ? <label className="f"><span>Amount (USD)</span><Amount value={amount} onChange={setAmount} /></label>
                : <label className="f"><span>Quantity</span>
                    <input type="text" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))} />
                    <div className="tri" style={{ fontSize: 11, marginTop: 4 }}>≈ {u.usd(notional)} at {u.usd(px, 2)}</div>
                  </label>}
              {orderType === "limit" && (
                <label className="f"><span>Limit price</span>
                  <input type="text" value={limit} onChange={(e) => setLimit(e.target.value)} /></label>
              )}
              <SleevePicker sleeve={sleeve} setSleeve={setSleeve}
                note={needsApproval ? "This sleeve is not yours to act on, so the order becomes a proposal." : null} />
              {needsApproval && (
                <label className="f"><span>Rationale for the Principal</span>
                  <textarea rows="3" value={rationale} onChange={(e) => setRationale(e.target.value)}
                    placeholder="Why this closes a gap in the mandate." /></label>
              )}
              {overCash && <div className="note bad">Exceeds available cash in this sleeve ({u.usd(cash)}).</div>}
            </div>
          </div>
          <div style={{ width: 320 }}>
            <Impact subKey={instrument.sub} amount={side === "buy" ? notional : -notional} />
            <div className="kv mt12">
              <span className="k">Last price</span><span className="v">{instrument.px ? u.localPx(instrument) : "—"}</span>
              <span className="k">Cash in sleeve</span><span className="v">{u.usd(cash)}</span>
              <span className="k">Settlement</span><span className="v">Same day</span>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  /* ------------------------------------------------------- subscription */
  function CommitFlow({ deal, onClose }) {
    const st = S.useStore();
    const [amount, setAmount] = useState(deal.min);
    const [ack, setAck] = useState(false);
    const [sleeve, setSleeve] = useState(st.account === "successor" ? "alpha" : "core");
    const [rationale, setRationale] = useState("");
    const capacity = S.alphaCapacity();
    const overCapacity = st.account === "successor" && (sleeve === "core" || amount > capacity);
    const belowMin = amount < deal.min;

    const confirm = () => {
      const args = { deal, amount, sleeve: overCapacity ? "core" : sleeve };
      if (overCapacity) {
        S.actions.propose({
          type: "Commitment", sleeve: "core", amount,
          title: "Commit " + u.usd(amount) + " to " + deal.name,
          target: deal.id,
          rationale: rationale || ("Fills the " + u.subLabel(deal.fills) + " gap. Above the Alpha sleeve's remaining capacity of " + u.usd(capacity) + "."),
          payload: { kind: "commit", args: { deal, amount, sleeve: "core" } },
        });
      } else {
        S.actions.commit(args);
      }
      onClose();
    };

    return (
      <Modal title="Commitment" sub={deal.name} onClose={onClose} wide
        footer={
          <>
            <div className="tri" style={{ fontSize: 11.5 }}>
              Closing {deal.closing === "Quarterly close" ? "at the next quarterly close" : u.fmtDate(deal.closing)} · ownership record updated on settlement.
            </div>
            <div className="btn-row">
              <button className="btn" onClick={onClose}>Cancel</button>
              <button className="btn p" disabled={!ack || belowMin} onClick={confirm}>
                {overCapacity ? "Submit proposal to Principal" : "Confirm commitment"}
              </button>
            </div>
          </>
        }>
        <div className="row" style={{ gap: 16, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div className="grid" style={{ gap: 12 }}>
              <label className="f"><span>Commitment amount (USD)</span>
                <Amount value={amount} onChange={setAmount} min={deal.min} /></label>
              {belowMin && <div className="note bad">Below the minimum of {u.usd(deal.min)}.</div>}
              <SleevePicker sleeve={sleeve} setSleeve={setSleeve} />
              {st.account === "successor" && (
                <div className={"note " + (overCapacity ? "warn" : "ok")}>
                  Alpha sleeve capacity: <b>{u.usd(capacity)}</b>.{" "}
                  {overCapacity
                    ? "This commitment exceeds it, so the button submits a proposal to the Principal rather than executing."
                    : "This commitment is within your authority and executes directly."}
                </div>
              )}
              {overCapacity && (
                <label className="f"><span>Rationale for the Principal</span>
                  <textarea rows="3" value={rationale} onChange={(e) => setRationale(e.target.value)}
                    placeholder="Why this closes a gap in the mandate." /></label>
              )}
              <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, cursor: "pointer" }}>
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} style={{ width: 14, marginTop: 2 }} />
                <span>I acknowledge the offering documents: {deal.docs.map((d) => d[0]).join(", ") || "—"}.</span>
              </label>
            </div>
          </div>
          <div style={{ width: 320 }}>
            <Impact subKey={deal.fills} amount={amount || 0} />
            <div className="kv mt12">
              <span className="k">Minimum</span><span className="v">{u.usd(deal.min)}</span>
              <span className="k">Liquidity</span><span className="v">{deal.liq}{deal.term ? " · " + deal.term : ""}</span>
              <span className="k">Target return</span><span className="v">{deal.ret}</span>
              <span className="k">Availability</span><span className="v">{deal.avail}</span>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  /* --------------------------------------------------- valuation editor */
  function ValuationEditor({ p, onClose }) {
    const [v, setV] = useState(p.value);
    const st = u.staleness(p);
    return (
      <Modal title="Update valuation" sub={p.name} onClose={onClose}
        footer={<>
          <div className="tri" style={{ fontSize: 11.5 }}>Self-maintained position · the update is written to the activity log.</div>
          <div className="btn-row">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn p" onClick={() => { S.actions.updateValuation(p.id, v); onClose(); }}>Save valuation</button>
          </div>
        </>}>
        <div className="kv mb16">
          <span className="k">Current carrying value</span><span className="v">{u.usd(p.value)}</span>
          <span className="k">Last updated</span><span className="v">{u.fmtDate(p.asOf)} · {st.d} days ago</span>
          <span className="k">Source</span><span className="v mono" style={{ fontSize: 11 }}>{p.src.file}</span>
        </div>
        <label className="f"><span>New valuation (USD)</span><Amount value={v} onChange={setV} /></label>
        <div className="note mt12">
          Self-maintained positions are the family's own marks. Barbell records what you enter, dates it, and shows
          everyone how old it is.
        </div>
      </Modal>
    );
  }

  /* -------------------------------------------------------- list / bid */
  function ListingFlow({ p, onClose }) {
    const [askPct, setAskPct] = useState(95);
    const [size, setSize] = useState(Math.round(p.value / 2));
    const [why, setWhy] = useState("");
    return (
      <Modal title="List on secondary" sub={p.name} onClose={onClose}
        footer={<>
          <div className="tri" style={{ fontSize: 11.5 }}>Seller identity is shown to members as a blind identifier.</div>
          <div className="btn-row">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn p" onClick={() => { S.actions.listPosition({ pid: p.id, askPct: +askPct, size, rationale: why }); onClose(); S.navigate("/secondary"); }}>
              Post listing
            </button>
          </div>
        </>}>
        <div className="kv mb16">
          <span className="k">Last NAV</span><span className="v">{u.usd(p.value)}</span>
          <span className="k">NAV date</span><span className="v">{u.fmtDate(p.asOf)}</span>
          <span className="k">Held</span><span className="v">{Math.floor(u.days(p.acquired) / 30)} months</span>
          <span className="k">Indicative range</span><span className="v">91 – 98% of NAV</span>
        </div>
        <div className="grid" style={{ gap: 12 }}>
          <label className="f"><span>Size offered (USD)</span><Amount value={size} onChange={setSize} /></label>
          <label className="f"><span>Ask — % of last NAV</span>
            <input type="text" value={askPct} onChange={(e) => setAskPct(e.target.value.replace(/[^0-9.]/g, ""))} />
            <div className="tri" style={{ fontSize: 11, marginTop: 4 }}>≈ {u.usd(Math.round(size * (askPct / 100)))} proceeds</div>
          </label>
          <label className="f"><span>Rationale (optional, shown to bidders)</span>
            <textarea rows="2" value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Why you are selling." /></label>
        </div>
      </Modal>
    );
  }

  function BidFlow({ listing, onClose }) {
    const [price, setPrice] = useState(listing.askPct);
    const [size, setSize] = useState(Math.round(listing.size / 2));
    return (
      <Modal title="Place a bid" sub={listing.instrument} onClose={onClose}
        footer={<>
          <div className="tri" style={{ fontSize: 11.5 }}>Bids are non-binding until the seller accepts.</div>
          <div className="btn-row">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn p" onClick={() => { S.actions.bid({ listingId: listing.id, price: +price, size }); onClose(); }}>Submit bid</button>
          </div>
        </>}>
        <div className="kv mb16">
          <span className="k">Ask</span><span className="v">{u.pct(listing.askPct)} of NAV</span>
          <span className="k">Indicative fair range</span><span className="v">{listing.indicative[0]}–{listing.indicative[1]}%</span>
          <span className="k">Size offered</span><span className="v">{u.usd(listing.size)}</span>
        </div>
        <div className="grid" style={{ gap: 12 }}>
          <label className="f"><span>Bid — % of last NAV</span>
            <input type="text" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))} /></label>
          <label className="f"><span>Size (USD)</span><Amount value={size} onChange={setSize} /></label>
          <div className="note">Consideration at this bid: <b>{u.usd(Math.round(size * (price / 100)))}</b>.</div>
        </div>
      </Modal>
    );
  }

  /* ------------------------------------------------------------- sharing */
  function ShareModal({ deal, onClose }) {
    const st = S.useStore();
    const link = "https://barbell.app/i/" + deal.id + "?ref=" + (st.account === "principal" ? "ysp-0147" : "jwp-0148");
    const [copied, setCopied] = useState(false);
    return (
      <Modal title="Share this opportunity" sub={deal.name} onClose={onClose} wide
        footer={<>
          <div className="tri" style={{ fontSize: 11.5 }}>Non-members see the thesis. Terms, allocation and documents stay gated.</div>
          <div className="btn-row">
            <button className="btn" onClick={onClose}>Close</button>
            <button className="btn p" onClick={() => { S.actions.share(deal.name); setCopied(true); }}>
              {copied ? "Link copied" : "Copy invitation link"}
            </button>
          </div>
        </>}>
        <label className="f"><span>Invitation link</span>
          <input type="text" readOnly value={link} onFocus={(e) => e.target.select()} /></label>
        <div className="lbl mt16" style={{ marginBottom: 6 }}>What the recipient sees</div>
        <div className="panel" style={{ background: "#FCFBF8" }}>
          <div className="panel-bd">
            <div className="eyebrow">Invitation from {st.account === "principal" ? D.accounts.principal.name : D.accounts.successor.name} · {D.family.name}</div>
            <h2 className="mt8">{deal.name}</h2>
            <div className="sub mt8" style={{ fontSize: 12.5, lineHeight: 1.6 }}>{deal.overview.split(". ")[0]}.</div>
            <hr className="hr" />
            <div className="row" style={{ gap: 24 }}>
              <div><div className="lbl">Asset class</div><div>{u.subLabel(deal.fills)}</div></div>
              <div><div className="lbl">Liquidity</div><div>{deal.liq}</div></div>
              <div><div className="lbl">Target return</div><div style={{ filter: "blur(4px)", userSelect: "none" }}>{deal.ret}</div></div>
              <div><div className="lbl">Minimum</div><div style={{ filter: "blur(4px)", userSelect: "none" }}>{u.usd(deal.min)}</div></div>
            </div>
            <div className="note mt12">Terms and allocation are visible to members. Request an introduction to continue.</div>
            <button className="btn p mt12" onClick={() => S.navigate("/invitation?deal=" + deal.id)}>Preview the invitation screen →</button>
          </div>
        </div>
      </Modal>
    );
  }

  BB.flows = { TradeTicket, CommitFlow, ValuationEditor, ListingFlow, BidFlow, ShareModal, Impact };
})();
