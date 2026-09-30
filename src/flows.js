/* Transaction flows. Identical in shape for listed and private instruments;
   only the mechanic at the point of transaction differs. */
(function () {
  const { useState } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Modal, Money, Delta, Amount, Dropzone } = BB.ui;

  /* Allocation impact — shown before every confirmation. */
  function Impact({ subKey, amount }) {
    const st = S.get();
    if (!amount) return <div className="note">Enter an amount to see the allocation impact.</div>;
    /* One row: the model class this lands in. The subcategory beneath it is a
       label, not a second allocation to reason about. */
    const i = u.impactSix(st.positions, subKey, amount, st.mandate);
    if (!i) return null;
    return (
      <div className="panel">
        <div className="panel-hd"><h3>Allocation impact</h3>
          <span className="tri" style={{ fontSize: 11 }}>for information</span></div>
        <table className="t dense">
          <thead><tr><th></th><th className="n">Before</th><th className="n">After</th><th className="n">vs model</th></tr></thead>
          <tbody>
            <tr>
              <td>
                <div className="tname">
                  <span style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>
                    <i className="sw" style={{ width: 8, height: 8, display: "inline-block", background: i.c.color }} />
                    {i.c.label}
                  </span>
                </div>
                <div className="tsub">{i.target === null ? "not modelled at this size" : "model " + u.pct(i.target)} · via {u.subLabel(subKey)}</div>
              </td>
              <td className="n num">{u.pct(i.before)}</td>
              <td className="n num">{u.pct(i.after)}</td>
              <td className="n tri num">{i.driftAfter === null ? "—" : u.pp(i.driftAfter)}</td>
            </tr>
          </tbody>
        </table>
        <div className="why" style={{ borderTop: "1px solid var(--g3)" }}>
          {i.c.label} would move from {u.pct(i.before)} to {u.pct(i.after)} of total assets.
        </div>
      </div>
    );
  }

  function TradeTicket({ instrument, side: side0, amount0, onClose }) {
    const st = S.useStore();
    const [side, setSide] = useState(side0 || "buy");
    const [mode, setMode] = useState("notional");
    const [amount, setAmount] = useState(amount0 || "");
    const [qty, setQty] = useState("");
    const [orderType, setOrderType] = useState("market");
    const [limit, setLimit] = useState(instrument.px || "");

    const [rationale, setRationale] = useState("");

    const px = instrument.pxUsd || instrument.px || 1;
    const notional = mode === "notional" ? (amount || 0) : Math.round((qty || 0) * px);
    /* One book: the Successor may act on any of it, but it goes to the
       Principal first. */
    const needsApproval = st.account === "successor";
    const cash = u.total(st.positions.filter((p) => p.cls === "cash"));
    const overCash = side === "buy" && notional > cash;

    const confirm = () => {
      const args = {
        side, name: instrument.name, ticker: instrument.ticker, sub: instrument.sub, cls: instrument.cls,
        amount: notional, qty: mode === "qty" ? qty : Math.round(notional / px), px, orderType, limit,
      };
      if (needsApproval) {
        S.actions.propose({
          type: "Trade", amount: notional,
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
              {needsApproval && (
                <label className="f"><span>Rationale for the Principal</span>
                  <textarea rows="3" value={rationale} onChange={(e) => setRationale(e.target.value)}
                    placeholder="Why this closes a gap in the mandate." /></label>
              )}
              {overCash && <div className="note bad">Exceeds available cash ({u.usd(cash)}).</div>}
            </div>
          </div>
          <div style={{ width: 320 }}>
            <Impact subKey={instrument.sub} amount={side === "buy" ? notional : -notional} />
            <div className="kv mt12">
              <span className="k">Last price</span><span className="v">{instrument.px ? u.localPx(instrument) : "—"}</span>
              <span className="k">Cash available</span><span className="v">{u.usd(cash)}</span>
              <span className="k">Settlement</span><span className="v">Same day</span>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  /* ------------------------------------------------------- subscription */
  function CommitFlow({ deal, amount0, onClose }) {
    const st = S.useStore();
    const [amount, setAmount] = useState(amount0 || "");
    const [ack, setAck] = useState(false);
    const [rationale, setRationale] = useState("");
    /* Every commitment the Successor makes is a proposal. */
    const needsApproval = st.account === "successor";

    const confirm = () => {
      const args = { deal, amount };
      if (needsApproval) {
        S.actions.propose({
          type: "Commitment", amount,
          title: "Commit " + u.usd(amount) + " to " + deal.name,
          target: deal.id,
          rationale: rationale || ("Fills the " + u.subLabel(deal.fills) + " gap."),
          payload: { kind: "commit", args },
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
              <button className="btn p" disabled={!ack || !amount} onClick={confirm}>
                {needsApproval ? "Submit proposal to Principal" : "Confirm commitment"}
              </button>
            </div>
          </>
        }>
        <div className="row" style={{ gap: 16, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div className="grid" style={{ gap: 12 }}>
              <label className="f"><span>Commitment amount (USD)</span>
                <Amount value={amount} onChange={setAmount} /></label>
              {needsApproval && (
                <div className="note warn">
                  Commitments are settled by the Principal, so this submits a proposal rather than executing.
                </div>
              )}
              {needsApproval && (
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
  /* A self-maintained mark is only as good as the document behind it, so the
     update is an upload, not a typed number. Barbell reads the file, shows the
     cell it read and what that moves the carrying value to, and records the
     filename as the position's new source. */
  function ValuationEditor({ p, onClose }) {
    const [file, setFile] = useState(null);
    const [reading, setReading] = useState(false);
    const [found, setFound] = useState(null);
    const st = u.staleness(p);

    /* Deterministic per position, so the same file always reads the same way. */
    const readFile = (f) => {
      setFile(f); setReading(true); setFound(null);
      const seed = p.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
      const drift = ((seed % 19) - 6) / 100;                 // −6% … +12%
      const value = Math.max(1000, Math.round((p.value * (1 + drift)) / 1000) * 1000);
      const cell = "Sheet1!" + String.fromCharCode(66 + (seed % 5)) + (11 + (seed % 27));
      const t = setTimeout(() => { setReading(false); setFound({ value, cell }); }, 900);
      return () => clearTimeout(t);
    };

    const delta = found ? found.value - p.value : 0;
    return (
      <Modal title="Update valuation" sub={p.name} onClose={onClose}
        footer={<>
          <div className="tri" style={{ fontSize: 11.5 }}>
            {found
              ? <>The filename and cell become this position's source. The update is written to the activity log.</>
              : <>Self-maintained position · a new mark needs the document it came from.</>}
          </div>
          <div className="btn-row">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn p" disabled={!found}
              onClick={() => { S.actions.updateValuation(p.id, found.value, { file: file.name, cell: found.cell }); onClose(); }}>
              {found ? "Apply " + u.usd(found.value) : "Upload a file first"}
            </button>
          </div>
        </>}>
        <div className="kv mb16">
          <span className="k">Current carrying value</span><span className="v">{u.usd(p.value)}</span>
          <span className="k">Last updated</span><span className="v">{u.fmtDate(p.asOf)} · {st.d} days ago</span>
          <span className="k">Current source</span><span className="v mono" style={{ fontSize: 11 }}>{p.src.file}</span>
        </div>

        {!file && (
          <Dropzone compact onFiles={(fs) => readFile(fs[0])}
            title="Drop the latest statement or valuation file"
            hint="Manager statement · capital account · appraisal · .xlsx · .csv · PDF · 한글 파일명 지원" />
        )}

        {file && (
          <div className="panel">
            <div className="panel-hd">
              <div>
                <div className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{file.name}</div>
                <div className="tri" style={{ fontSize: 11, marginTop: 2 }}>
                  {reading ? "Reading the file…" : "Read " + found.cell + " · " + u.fmtDate(D.TODAY)}
                </div>
              </div>
              <button className="link g" onClick={() => { setFile(null); setFound(null); setReading(false); }}>
                Use a different file
              </button>
            </div>
            {found && (
              <div className="panel-bd">
                <div className="kv">
                  <span className="k">Value read from the file</span>
                  <span className="v num" style={{ fontWeight: 600 }}>{u.usd(found.value)}</span>
                  <span className="k">Against the current mark</span>
                  <span className="v"><Delta v={delta} usd /> · {u.pct((delta / p.value) * 100)}</span>
                  <span className="k">New source cell</span>
                  <span className="v mono" style={{ fontSize: 11 }}>{file.name} · {found.cell}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="note mt12">
          Self-maintained positions are the family's own marks. Barbell will not take a number without the document
          behind it — the file becomes the position's source, and everyone can see how old it is.
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

  /* Buying a listing outright at the asking price. */
  function BuyNowFlow({ listing, onClose }) {
    const st = S.useStore();
    const consideration = Math.round(listing.size * listing.askPct / 100);
    const needsApproval = st.account === "successor";
    const discount = 100 - listing.askPct;
    return (
      <Modal title="Buy at the ask" sub={listing.instrument} onClose={onClose}
        footer={<>
          <div className="tri" style={{ fontSize: 11.5 }}>No negotiation · ownership record updated on settlement.</div>
          <div className="btn-row">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn p" onClick={() => {
              if (needsApproval) {
                S.actions.propose({
                  type: "Secondary purchase", amount: consideration,
                  title: "Buy " + u.usd(listing.size) + " of " + listing.instrument + " at " + listing.askPct.toFixed(1) + "% of NAV",
                  target: listing.id,
                  rationale: "Taking the ask on the secondary board.",
                  payload: { kind: "buyListing", args: { listing } },
                });
              } else {
                S.actions.buyListing({ listing });
              }
              onClose();
            }}>{needsApproval ? "Submit proposal to Principal" : "Buy at " + u.pct(listing.askPct)}</button>
          </div>
        </>}>
        <div className="kv mb16">
          <span className="k">Size offered</span><span className="v">{u.usd(listing.size)} of NAV</span>
          <span className="k">Ask</span><span className="v">{u.pct(listing.askPct)} of last NAV</span>
          <span className="k">Indicative fair range</span><span className="v">{listing.indicative[0]}–{listing.indicative[1]}%</span>
          <span className="k">You pay</span><span className="v" style={{ fontSize: 15 }}>{u.usd(consideration)}</span>
        </div>
        <Impact subKey={listing.sub} amount={listing.size} />
        <div className={"note mt12 " + (discount > 0 ? "ok" : "")}>
          {discount > 0
            ? <>You acquire {u.usd(listing.size)} of stated NAV for {u.usd(consideration)} — a {u.pct(discount)} discount,
              which books as unrealised gain at the next mark. The discount is the price of the seller's hurry, not a
              judgement on the asset.</>
            : <>The ask is {u.pct(-discount)} above last NAV. Above the indicative range means paying for access.</>}
        </div>
        {needsApproval && (
          <div className="note warn mt12">
            The Principal approves commitments, so this is submitted rather than executed.
          </div>
        )}
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
            </div>
            <div className="note mt12">Terms and allocation are visible to members. Request an introduction to continue.</div>
            <button className="btn p mt12" onClick={() => S.navigate("/invitation?deal=" + deal.id)}>Preview the invitation screen →</button>
          </div>
        </div>
      </Modal>
    );
  }

  BB.flows = { TradeTicket, CommitFlow, ValuationEditor, ListingFlow, BidFlow, BuyNowFlow, ShareModal, Impact };
})();
