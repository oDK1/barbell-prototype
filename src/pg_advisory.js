/* /advisory — the AI and human layer.

   AI and blockchain are separate design dimensions, so nothing on this screen
   depends on tokenisation. Two things sit on top of the agent: a risk review
   of the onboarded book with perspectives modelled on known investors'
   approaches, and human specialists, paid per consult.

   TENSION, flagged not resolved: a risk review that recommends, and a paid
   specialist who advises, sit close to the discretionary line this product
   says it does not cross. Everything here is written as observation and
   option; the client still acts. See the open questions. */
(function () {
  const { useState } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Panel, Crumb, Fit } = BB.ui;

  /* Lenses are a way of reading the same book, not a claim about what anyone
     would actually say. Labelled as modelled approaches throughout. */
  const LENSES = [
    { key: "macro", who: "Macro-directional", after: "after Druckenmiller",
      q: "Where is the book exposed if the regime changes?",
      read: (ps) => {
        const sp = u.spread(ps);
        const ex = u.exitToday(ps);
        return [
          "Concentration is the position, and " + (sp.topGeo ? sp.topGeo.v + " at " + u.pct(sp.topGeo.wt) : "the largest geography") + " is the position this book has taken, whether or not it was chosen.",
          "A regime change is survivable only if it can be acted on. Every position converts today — but acting costs " + u.usdC(ex.cost) + ", " + u.pct(ex.haircut) + " of the book, and that bill is only paid by whoever moves.",
          "Nothing here expresses a view on rates. Duration sits inside the anchor by default rather than by decision.",
        ];
      } },
    { key: "parity", who: "Risk-balanced", after: "after Dalio",
      q: "Is risk spread, or just capital?",
      read: (ps) => {
        const b = u.byBucket(ps, 100 - S.get().anchorPct);
        const eng = b.find((x) => x.key === "engine"), con = b.find((x) => x.key === "conviction");
        const sp = u.spread(ps);
        return [
          "Capital is split " + u.pct(eng.wt) + " / " + u.pct(con.wt) + " between compounding and conviction. Risk is not — the conviction sleeve carries far more of the variance than its weight suggests.",
          sp.effective.toFixed(1) + " effective holdings across " + sp.n + " positions. The gap between those two numbers is concentration that the allocation does not show.",
          "Uncorrelated is a property of pairs, not of labels. Two private credit funds lending to the same borrowers are one position.",
        ];
      } },
    { key: "tail", who: "Tail-risk", after: "black-swan exposure",
      q: "What has not been considered?",
      read: (ps) => {
        const aff = u.affiliateExposure(ps);
        const short = u.shortfall(ps);
        const ex2 = u.exitToday(ps);
        return [
          aff.wt > 0
            ? "The family's income and " + u.pct(aff.wt) + " of its wealth depend on the same balance sheet. In the event that matters, both move together."
            : "No affiliate concentration.",
          short
            ? "Projected cash breaks in " + short.month + ". A forced sale in a bad month is the loss, not the drawdown that caused it."
            : "Projected cash holds across the window.",
          "Everything here sells today, which removes the usual tail risk and installs a different one: a forced seller pays " + u.usdC(ex2.cost) + " to leave, and pays it precisely when the bid is thinnest.",
        ];
      } },
  ];

  /* Illustrative. The fee is a placeholder and is labelled as one. */
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
    const [q, setQ] = useState("");
    const [answer, setAnswer] = useState(null);
    const L = LENSES.find((x) => x.key === lens);

    /* The prototype answers through the lenses it already has: the question
       picks one rather than generating a new reading. */
    const route = (text) => {
      const t2 = (text || "").toLowerCase();
      if (/tail|black[- ]?swan|crash|worst|shock|blow/.test(t2)) return "tail";
      if (/rate|macro|regime|currency|fx|inflation|dollar|won/.test(t2)) return "macro";
      if (/risk|balanc|diversif|concentrat|spread|correlat/.test(t2)) return "parity";
      return null;
    };
    const ask = (text) => {
      const asked = typeof text === "string" ? text : q;
      if (!asked.trim()) return;
      const k = route(asked);
      if (k) {
        setLens(k);
        setAnswer("Answered through the " + LENSES.find((x) => x.key === k).who
          + " lens — the three readings below are what the agent has on this book.");
      } else {
        setAnswer("The prototype answers through the three lenses below. Try a question about tail risk, "
          + "concentration, or what a change in rates would do.");
      }
    };

    return (
      <div className="wrap page">
        <div className="between">
          <div>
            <div className="eyebrow">Advisory</div>
            <h1 className="mt8">Analysis and advice</h1>
            <div className="sub mt8" style={{ maxWidth: "78ch" }}>
              Two layers. The agent reads the whole book and costs nothing. A specialist reads the part you
              ask about, charges for it, and has done the thing before.
            </div>
          </div>
        </div>

        {/* ---- 01 · the agent ---- */}
        <div className="advsec mt16">
          <span className="as-n">01</span>
          <div>
            <div className="as-t">AI agent analysis</div>
            <div className="as-d">
              Reads all {ps.length} positions as they stand, in seconds and at no charge. It surfaces what is
              there — concentration, exposure, the risk nobody asked about — and never decides anything.
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hd">
            <div>
              <h3>Read this book another way</h3>
              <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>
                Three lenses over the same positions. Modelled approaches, not quotations — nobody named has
                seen this portfolio.
              </div>
            </div>
            <BB.ui.Seg options={LENSES.map((x) => ({ v: x.key, label: x.who }))} value={lens} onChange={setLens} />
          </div>
          <div className="panel-bd">
            <div className="lens-q">{L.q} <span className="tri">· {L.after}</span></div>
            {L.read(ps).map((line, i) => (
              <div key={i} className="lens-l"><span className="lens-n">{i + 1}</span><span>{line}</span></div>
            ))}
          </div>

          {/* ask the agent where the agent is, rather than from a bar that
              floats over the whole page */}
          <div className="agentbox">
            <div className="ab-hd lbl">Ask the agent</div>
            {answer && <div className="ab-a">{answer}</div>}
            <div className="ab-row">
              <div className="search" style={{ flex: 1 }}>
                <input type="text" value={q} placeholder="What is my black-swan exposure? · What am I not seeing?"
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && ask()} />
              </div>
              <button className="btn p" onClick={ask}>Ask</button>
            </div>
            <div className="ab-ex tri">
              {["What is my black-swan exposure?", "Where am I concentrated?", "What happens if rates move?"]
                .map((x) => (
                  <button key={x} className="link g" onClick={() => { setQ(x); ask(x); }}>{x}</button>
                ))}
            </div>
          </div>
        </div>

        {/* ---- 02 · the humans ---- */}
        <div className="advsec mt16">
          <span className="as-n">02</span>
          <div>
            <div className="as-t">Talk to a specialist</div>
            <div className="as-d">
              For the questions analysis cannot close: whether a security package is as good as it reads,
              whether a round is priced sensibly, what a regime change would actually do. A person, paid by
              the consult, with no authority over the account.
            </div>
          </div>
        </div>

        {/* a request, not a live booking */}
        <div className="panel">
          <div className="panel-hd">
            <div>
              <h3>Hanwha desks</h3>
              <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>
                Booked by the consult. Pricing illustrative.
              </div>
            </div>
            <span className="tri" style={{ fontSize: 11 }}>$100 per consult · illustrative</span>
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

      </div>
    );
  }

  BB.pages = BB.pages || {};
  BB.pages.Advisory = Advisory;
})();
