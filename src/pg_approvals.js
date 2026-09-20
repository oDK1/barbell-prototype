/* /approvals — the Principal's inbox. Accept, decline, or return with comment. */
(function () {
  const { useState } = React;
  const D = BB.data, u = BB.u, S = BB.store;
  const { Money, Delta, Panel, Modal } = BB.ui;

  function Decision({ a, onClose }) {
    const [mode, setMode] = useState("approved");
    const [comment, setComment] = useState("");
    const labels = { approved: "Approve", declined: "Decline", returned: "Return with comment" };
    return (
      <Modal title={labels[mode]} sub={a.title} onClose={onClose}
        footer={<>
          <div className="tri" style={{ fontSize: 11.5 }}>Written to the shared activity log, visible to both accounts.</div>
          <div className="btn-row">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn p" disabled={mode === "returned" && !comment}
              onClick={() => { S.actions.decide(a.id, mode, comment); onClose(); }}>{labels[mode]}</button>
          </div>
        </>}>
        <BB.ui.Seg options={[{ v: "approved", label: "Approve" }, { v: "returned", label: "Return" }, { v: "declined", label: "Decline" }]}
          value={mode} onChange={setMode} />
        <div className="kv mt16 mb16">
          <span className="k">Submitted by</span><span className="v">{D.accounts[a.from].name}</span>
          <span className="k">Type</span><span className="v">{a.type}</span>
          <span className="k">Amount</span><span className="v">{u.usd(a.amount)}</span>
          <span className="k">Sleeve</span><span className="v">{a.sleeve === "core" ? "Core" : "Alpha"}</span>
        </div>
        <div className="note mb16">{a.rationale}</div>
        <label className="f"><span>{mode === "returned" ? "Comment (required)" : "Comment (optional)"}</span>
          <textarea rows="3" value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder={mode === "returned" ? "What needs to change before resubmission." : "Any condition attached to the decision."} /></label>
        {mode === "approved" && a.payload && (
          <div className="note ok mt12">
            Approving executes the underlying {a.payload.kind === "trade" ? "order" : "commitment"} immediately against the
            Core sleeve and updates the allocation.
          </div>
        )}
      </Modal>
    );
  }

  function Approvals() {
    const st = S.useStore();
    const [open, setOpen] = useState(null);
    const isPrincipal = st.account === "principal";
    const pending = st.approvals.filter((a) => a.status === "pending");
    const decided = st.approvals.filter((a) => a.status !== "pending");

    const Card = ({ a }) => (
      <div className="panel mb12" style={{ borderLeft: "2px solid " + (a.status === "pending" ? "var(--navy)" : a.status === "approved" ? "var(--pos)" : a.status === "declined" ? "var(--neg)" : "var(--amber)") }}>
        <div className="panel-hd">
          <div>
            <div className="row tight" style={{ alignItems: "center" }}>
              <span className="bdg plain">{a.type}</span>
              <span className={"bdg " + (a.sleeve === "alpha" ? "alpha" : "core")}>{a.sleeve === "alpha" ? "Alpha" : "Core"}</span>
              <span className="tri" style={{ fontSize: 11 }}>{u.fmtTs(a.ts)} · {D.accounts[a.from].name}</span>
            </div>
            <h2 className="mt8" style={{ fontSize: 15 }}>{a.title}</h2>
          </div>
          <div className="right">
            <div className="lbl">Amount</div>
            <div className="num" style={{ fontWeight: 600, fontSize: 15 }}>{u.usd(a.amount)}</div>
          </div>
        </div>
        <div className="panel-bd">
          <div className="prose" style={{ fontSize: 12.5 }}>{a.rationale}</div>
          {a.comment && (
            <div className="note mt12" style={{ borderLeft: "2px solid var(--g2)" }}>
              <b>{D.accounts.principal.name}:</b> {a.comment}
            </div>
          )}
          <div className="between mt12">
            <div className="tri" style={{ fontSize: 11.5 }}>
              {a.status === "pending" ? "Awaiting the Principal" : (a.status[0].toUpperCase() + a.status.slice(1)) + " " + u.fmtTs(a.decidedTs)}
            </div>
            <div className="btn-row">
              {a.target && String(a.target).startsWith("m") && (
                <button className="btn sm" onClick={() => S.navigate("/marketplace/" + a.target)}>View instrument</button>
              )}
              {a.status === "pending" && isPrincipal && (
                <>
                  <button className="btn sm p" onClick={() => setOpen(a)}>Decide</button>
                </>
              )}
              {a.status === "pending" && !isPrincipal && (
                <span className="tip" data-tip={S.LOCK_TIP}><button className="btn sm" disabled>Decide</button></span>
              )}
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div className="wrap page" style={{ maxWidth: 1080 }}>
        <div className="between">
          <div>
            <div className="eyebrow">{isPrincipal ? "Sovereign Mode" : "Successor Mode"}</div>
            <h1 className="mt8">{isPrincipal ? "Approval inbox" : "Your proposals"}</h1>
            <div className="sub mt8" style={{ maxWidth: "72ch" }}>
              {isPrincipal
                ? "Anything the successor account proposes outside the Alpha sleeve queues here. Approving executes it; returning sends it back with a comment."
                : "Proposals you have submitted to the Principal. You can see the decision and the comment; you cannot decide."}
            </div>
          </div>
          <div className="right">
            <div className="stat-l">Pending</div>
            <div className="stat-v">{pending.length}</div>
            <div className="stat-s">{u.usd(u.sum(pending, (a) => a.amount))} of proposed transactions</div>
          </div>
        </div>

        {!isPrincipal && (
          <div className="note mt16">
            This inbox belongs to the Principal. It is shown here read-only so both sides of the workflow are visible in
            the prototype — switch accounts in the top right to decide.
          </div>
        )}

        <h2 className="mt24 mb12">Pending</h2>
        {pending.length === 0 ? <div className="panel"><div className="empty">Nothing awaiting a decision.</div></div> : pending.map((a) => <Card key={a.id} a={a} />)}

        <h2 className="mt24 mb12">Decided</h2>
        {decided.length === 0 ? <div className="panel"><div className="empty">No decisions yet.</div></div> : decided.map((a) => <Card key={a.id} a={a} />)}

        {open && <Decision a={open} onClose={() => setOpen(null)} />}
      </div>
    );
  }

  BB.pages = BB.pages || {};
  BB.pages.Approvals = Approvals;
})();
