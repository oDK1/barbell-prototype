/* /advisory — the AI and human layer DW asked for in item 4.
   [D] AI and blockchain are separate design dimensions, so nothing on this
   screen depends on tokenisation.
   [P] Professional-grade analysis on top of the agent: a risk review of the
   onboarded book, and perspectives modelled on named investors' approaches.
   [P] Hybrid human and AI advisory, paid per consult.

   TENSION, flagged not resolved: a risk review that recommends, and a paid
   specialist who advises, sit close to the discretionary line this product
   says it does not cross. Everything here is written as observation and
   option; the client still acts. See the open questions. */
(function () {
  const { useState } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Panel, Crumb, Fit, AgentBar } = BB.ui;

  /* Lenses are a way of reading the same book, not a claim about what anyone
     would actually say. Labelled as modelled approaches throughout. */
  const LENSES = [
    { key: "macro", who: "Macro-directional", after: "after Druckenmiller",
      q: "Where is the book exposed if the regime changes?",
      read: (ps) => {
        const sp = u.spread(ps);
        const liq = u.liquidity90(ps);
        return [
          "Concentration is the position, and " + (sp.topGeo ? sp.topGeo.v + " at " + u.pct(sp.topGeo.wt) : "the largest geography") + " is the position this book has taken, whether or not it was chosen.",
          "A regime change is survivable only if it can be acted on. " + u.usdC(liq.within90) + " is reachable inside 90 days against " + u.usdC(u.total(ps)) + " of assets.",
          "Nothing here expresses a view on rates. Duration sits in the reserve by default rather than by decision.",
        ];
      } },
    { key: "parity", who: "Risk-balanced", after: "after Dalio",
      q: "Is risk spread, or just capital?",
      read: (ps) => {
        const b = u.byBucket(ps, S.get().mandate);
        const eng = b.find((x) => x.key === "engine"), con = b.find((x) => x.key === "conviction");
        const sp = u.spread(ps);
        return [
          "Capital is split " + u.pct(eng.wt) + " / " + u.pct(con.wt) + " between compounding and conviction. Risk is not — the conviction sleeve carries far more of the variance than its weight suggests.",
          sp.effective.toFixed(1) + " effective holdings across " + sp.n + " positions. The gap between those two numbers is concentration that the allocation does not show.",
          "Uncorrelated is a property of pairs, not of labels. Two private credit funds lending to the same borrowers are one position.",
        ];
      } },
    { key: "tail", who: "Tail-risk", after: "black-swan exposure, DW [P]",
      q: "What has not been considered?",
      read: (ps) => {
        const aff = u.affiliateExposure(ps);
        const short = u.shortfall(ps);
        const locked = u.total(ps.filter((p) => p.liq === "Locked"));
        return [
          aff.wt > 0
            ? "The family's income and " + u.pct(aff.wt) + " of its wealth depend on the same balance sheet. In the event that matters, both move together."
            : "No affiliate concentration.",
          short
            ? "Projected cash breaks in " + short.month + ". A forced sale in a bad month is the loss, not the drawdown that caused it."
            : "Projected cash holds across the window.",
          u.pct((locked / u.total(ps)) * 100) + " of the book cannot be sold at any price inside a quarter. That is the real constraint under stress, not volatility.",
        ];
      } },
  ];

  /* Illustrative. DW's ~$100 is a placeholder and is labelled as one. */
  const DESKS = [
    { key: "fi", name: "Fixed income", who: "Hanwha Life — credit and duration",
      on: "Private credit terms, security packages, where a yield is actually coming from." },
    { key: "macro", name: "Macro", who: "Hanwha Securities — strategy",
      on: "Currency exposure against a KRW base, rate regimes, what a scenario does to the book." },
    { key: "tech", name: "Technology and AI", who: "Hanwha — growth and venture",
      on: "Diligence on a startup round, sector concentration, whether a thesis is already owned elsewhere." },
  ];

  function Advisory() {
    const st = S.useStore();
    const ps = st.positions;
    const [lens, setLens] = useState("macro");
    const [book, setBook] = useState(null);
    const L = LENSES.find((x) => x.key === lens);

    return (
      <div className="wrap page hasagent">
        <div className="between">
          <div>
            <div className="eyebrow">Advisory</div>
            <h1 className="mt8">Analysis and advice</h1>
          </div>
        </div>

        {/* ---- AI: risk review and lenses. END-STATE. ---- */}
        <div className="panel mt16">
          <div className="panel-hd">
            <div>
              <h3>Read this book another way</h3>
              <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>
                Modelled approaches, not quotations. Nobody named has seen this portfolio.
              </div>
            </div>
            <BB.ui.Seg options={LENSES.map((x) => ({ v: x.key, label: x.who }))} value={lens} onChange={setLens} />
          </div>
          <div className="panel-bd">
            <div className="lens-q">{L.q} <span className="tri">· {L.after}</span></div>
            {L.read(ps).map((line, i) => (
              <div key={i} className="lens-l"><span className="lens-n">{i + 1}</span><span>{line}</span></div>
            ))}
            <div className="note mt12" style={{ fontSize: 11.5 }}>
              Observations on the reconciled book. Barbell does not manage a mandate and does not decide anything here.
            </div>
          </div>
        </div>

        {/* ---- Paid human consults. END-STATE; Phase 1 is a request, not a booking. ---- */}
        <div className="panel mt16">
          <div className="panel-hd">
            <div>
              <h3>Talk to a specialist</h3>
              <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>
                Hanwha desks, booked by the hour. Pricing illustrative.
              </div>
            </div>
            <span className="tri" style={{ fontSize: 11 }}>$100 per consult · DW's figure, placeholder</span>
          </div>
          <table className="t">
            <thead><tr><th style={{ minWidth: 150 }}>Desk</th><th>Who</th><th>What they are useful for</th><th></th></tr></thead>
            <tbody>
              {DESKS.map((d) => (
                <tr key={d.key}>
                  <td><div className="tname">{d.name}</div></td>
                  <td className="tsub">{d.who}</td>
                  <td className="tsub" style={{ maxWidth: 420 }}>{d.on}</td>
                  <td className="right">
                    <button className="btn sm p" onClick={() => { setBook(d); }}>Request a consult</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="why" style={{ borderTop: "1px solid var(--g3)" }}>
            A specialist gives you their reading. They do not place orders and cannot act on the account.
          </div>
        </div>

        {book && (
          <BB.ui.Modal title="Request a consult" sub={book.name + " · " + book.who} onClose={() => setBook(null)}
            footer={<>
              <div className="tri" style={{ fontSize: 11.5 }}>Billed per consult. Illustrative in this prototype.</div>
              <div className="btn-row">
                <button className="btn" onClick={() => setBook(null)}>Cancel</button>
                <button className="btn p" onClick={() => {
                  S.actions.requestConsult(book.name);
                  setBook(null);
                }}>Request</button>
              </div>
            </>}>
            <div className="kv mb16">
              <span className="k">Desk</span><span className="v">{book.name}</span>
              <span className="k">Fee</span><span className="v">$100 · illustrative</span>
              <span className="k">Shared with the specialist</span><span className="v">The reconciled book, read-only</span>
              <span className="k">Authority</span><span className="v">None — advice only</span>
            </div>
            <div className="note">{book.on}</div>
          </BB.ui.Modal>
        )}

        <AgentBar label="Advisory Agent">
          <div className="search" style={{ flex: 1 }}>
            <input type="text" placeholder="Ask: what is my black-swan exposure? · what am I not seeing?"
              onKeyDown={(e) => e.key === "Enter" && S.toast("The lenses above answer this in the prototype.")} />
          </div>
          <button className="btn sm" onClick={() => S.toast("The lenses above answer this in the prototype.")}>Ask</button>
        </AgentBar>
      </div>
    );
  }

  BB.pages = BB.pages || {};
  BB.pages.Advisory = Advisory;
})();
