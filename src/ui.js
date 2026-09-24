/* Shared primitives. Institutional, quiet, dense. */
(function () {
  const { useState, useEffect, useRef } = React;
  const D = BB.data, u = BB.u, S = BB.store;

  /* USD primary, KRW secondary beneath in smaller grey type. */
  function Money({ v, compact, krw = true, dp, className }) {
    return (
      <span className={"num " + (className || "")}>
        {compact ? u.usdC(v) : u.usd(v, dp)}
        {krw && <span className="krw">{u.krwC(v)}</span>}
      </span>
    );
  }

  function Delta({ v, pp: isPp, usd: isUsd, dp }) {
    const cls = v > 0 ? "pos" : v < 0 ? "neg" : "tri";
    const t = isPp ? u.pp(v, dp) : isUsd ? u.sgnUsd(v) : u.sgn(v, dp);
    return <span className={cls + " num"}>{t}</span>;
  }

  function ProvBadge({ p, showDate = true }) {
    if (p.prov === "live") return (
      <span className="bdg live" title={"Marked to market " + (D.family.asOf.slice(11, 16))}>
        <i className="pt" />Live{showDate && <span style={{ opacity: .75, fontWeight: 500 }}>{" " + D.family.asOf.slice(11, 16)}</span>}
      </span>);
    if (p.prov === "hanwha") return (
      <span className="bdg hanwha" title="NAV and capital account pushed from the platform">
        <i className="pt" />Hanwha-sourced{showDate && <span style={{ opacity: .75, fontWeight: 500 }}>{" as of " + u.fmtDate(p.asOf).slice(0, 6)}</span>}
      </span>);
    const st = u.staleness(p);
    return (
      <span className={"bdg self " + (st.level === "bad" ? "bad" : st.level === "warn" ? "warn" : "")}
        title={"Last updated " + u.fmtDate(p.asOf)}>
        <i className="pt" />Self-maintained{showDate && <span style={{ opacity: .8, fontWeight: 500 }}>{" " + st.d + "d"}</span>}
      </span>);
  }

  function SleeveBadge({ s }) {
    return <span className={"bdg " + (s === "alpha" ? "alpha" : "core")}>{s === "alpha" ? "Alpha" : "Core"}</span>;
  }

  function LiqBadge({ liq, term }) {
    return <span className="bdg plain" title={term || ""}>{liq}{term ? " · " + term : ""}</span>;
  }

  /* A control the current account may not use. Renders visibly disabled with a tooltip. */
  function Lock({ sleeve, children, tip }) {
    const allowed = S.canWrite(sleeve);
    if (allowed) return children;
    return (
      <span className="tip" data-tip={tip || S.LOCK_TIP}>
        {React.cloneElement(children, { disabled: true, onClick: (e) => e.preventDefault() })}
      </span>
    );
  }

  function Stat({ label, value, sub, delta, tone }) {
    return (
      <div className="cell">
        <div className="stat-l">{label}</div>
        <div className={"stat-v " + (tone || "")}>{value}</div>
        {(sub || delta !== undefined) && (
          <div className="stat-s">
            {delta !== undefined && <Delta v={delta} pp />}
            {delta !== undefined && sub ? " · " : ""}{sub}
          </div>
        )}
      </div>
    );
  }
  function Band({ children }) { return <div className="band">{children}</div>; }

  function Panel({ title, right, children, sub, flush }) {
    return (
      <div className="panel">
        {(title || right) && (
          <div className="panel-hd">
            <div>
              <h3>{title}</h3>
              {sub && <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>{sub}</div>}
            </div>
            <div className="btn-row">{right}</div>
          </div>
        )}
        <div className={"panel-bd" + (flush ? " tight" : "")}>{children}</div>
      </div>
    );
  }

  function Tabs({ tabs, active, onChange }) {
    return (
      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.k} className={active === t.k ? "on" : ""} onClick={() => onChange(t.k)}>
            {t.label}{t.n !== undefined && <span className="tri" style={{ marginLeft: 6 }}>{t.n}</span>}
          </button>
        ))}
      </div>
    );
  }

  function Seg({ options, value, onChange }) {
    return (
      <div className="seg">
        {options.map((o) => (
          <button key={o.v} className={value === o.v ? "on" : ""} onClick={() => onChange(o.v)}>{o.label}</button>
        ))}
      </div>
    );
  }

  function Modal({ title, sub, children, footer, onClose, wide }) {
    useEffect(() => {
      const on = (e) => { if (e.key === "Escape") onClose(); };
      window.addEventListener("keydown", on);
      return () => window.removeEventListener("keydown", on);
    }, [onClose]);
    return (
      <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className={"modal" + (wide ? " wide" : "")}>
          <div className="modal-hd">
            <div>
              <h2>{title}</h2>
              {sub && <div className="tri" style={{ marginTop: 3, fontSize: 12 }}>{sub}</div>}
            </div>
            <button className="x" onClick={onClose}>×</button>
          </div>
          <div className="modal-bd">{children}</div>
          {footer && <div className="modal-ft">{footer}</div>}
        </div>
      </div>
    );
  }

  /* One subcategory: filled bar for current, tick for target. */
  function MiniBar({ cur, target, max }) {
    const m = max || Math.max(cur, target) * 1.35 || 1;
    return (
      <div className="minibar">
        <i style={{ width: Math.min(100, (cur / m) * 100) + "%" }} />
        <b style={{ left: Math.min(100, (target / m) * 100) + "%" }} title={"Target " + u.pct(target)} />
      </div>
    );
  }

  function Fit({ score }) {
    return (
      <span className="fit">
        <span className="fitbar"><i style={{ width: score + "%" }} /></span>
        <span className="num" style={{ fontSize: 11.5, fontWeight: 600 }}>{score}</span>
      </span>
    );
  }

  function Crumb({ items }) {
    return (
      <div className="crumb">
        {items.map((it, i) => (
          <span key={i}>
            {i > 0 && <span style={{ margin: "0 6px", color: "var(--g3)" }}>/</span>}
            {it.to ? <button onClick={() => S.navigate(it.to)}>{it.label}</button> : <span>{it.label}</span>}
          </span>
        ))}
      </div>
    );
  }

  function Toast() {
    const st = S.useStore();
    useEffect(() => {
      if (!st.toast) return;
      const t = setTimeout(() => S.actions.dismissToast(), 3200);
      return () => clearTimeout(t);
    }, [st.toast && st.toast.id]);
    if (!st.toast) return null;
    return (
      <div style={{
        position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
        background: "var(--ink)", color: "#fff", padding: "9px 16px", fontSize: 12.5, zIndex: 120,
        display: "flex", gap: 14, alignItems: "center",
      }}>
        <span>{st.toast.msg}</span>
        <button className="x" style={{ color: "#8D939B" }} onClick={() => S.actions.dismissToast()}>×</button>
      </div>
    );
  }

  /* The two accounts in full: who they are, what they may do, and why.
     Clicking one makes it the active account. */
  function AccountCard({ a, on, onPick }) {
    return (
      <button className="panel" onClick={onPick}
        style={{ textAlign: "left", cursor: "pointer", padding: 0, borderColor: on ? "var(--navy)" : "var(--g3)", background: "var(--paper)" }}>
        <div className="panel-hd">
          <div>
            <div className="eyebrow" style={{ color: "var(--navy)" }}>{a.mode}</div>
            <h2 style={{ marginTop: 4 }}>{a.name}</h2>
            <div className="sub" style={{ fontSize: 12 }}>{a.title} · {a.age}</div>
          </div>
          {on && <span className="bdg hanwha"><i className="pt" />Active</span>}
        </div>
        <div className="panel-bd">
          <div className="kv" style={{ gridTemplateColumns: "auto 1fr" }}>
            <span className="k">Mandate</span><span className="v">{a.mandate}</span>
            <span className="k">Authority</span><span className="v">{a.scope}</span>
          </div>
          <hr className="hr" />
          <div className="prose" style={{ fontSize: 12.5 }}>{a.desc}</div>
        </div>
      </button>
    );
  }

  function AccountCards({ onPick }) {
    const st = S.useStore();
    return (
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {["principal", "successor"].map((k) => (
          <AccountCard key={k} a={D.accounts[k]} on={st.account === k}
            onPick={() => (onPick ? onPick(k) : S.actions.setAccount(k))} />
        ))}
      </div>
    );
  }

  /* The onboarding session in full, so the mandate step is visible from the
     start rather than appearing only once the files are read. A step you have
     not earned yet is disabled with the reason attached. */
  function Steps({ at }) {
    const st = S.useStore();
    const cleared = st.exceptions.every((e) => e.resolved);
    const steps = [
      { k: "upload", n: 1, label: "Upload", sub: "bring the spreadsheets in", to: "/onboarding/upload",
        done: st.ingestDone, block: null },
      { k: "reconcile", n: 2, label: "Reconcile", sub: "clear the exceptions", to: "/onboarding/reconcile",
        done: st.ingestDone && cleared, block: st.ingestDone ? null : "Read the files first" },
      { k: "mandate", n: 3, label: "Mandate", sub: "set the posture", to: "/onboarding/mandate",
        done: false, block: cleared ? null : "Clear the exceptions first" },
    ];
    return (
      <div className="steps">
        {steps.map((x) => {
          const cls = "step" + (at === x.k ? " on" : "") + (x.done && at !== x.k ? " done" : "");
          const btn = (
            <button className={cls} disabled={!!x.block && at !== x.k} onClick={() => S.navigate(x.to)}>
              <span className="n">{x.done && at !== x.k ? "✓" : x.n}</span>
              <span className="l">{x.label}</span>
              <span className="s">{x.sub}</span>
            </button>
          );
          return x.block && at !== x.k
            ? <span className="tip" key={x.k} data-tip={x.block} style={{ display: "block" }}>{btn}</span>
            : <React.Fragment key={x.k}>{btn}</React.Fragment>;
        })}
      </div>
    );
  }

  /* Which account is doing the onboarding, stated at the top of every step.
     The two modes have different authority over what these screens set. */
  function ModeStrip() {
    const st = S.useStore();
    return (
      <div className="modestrip">
        {["principal", "successor"].map((k) => {
          const a = D.accounts[k];
          const on = st.account === k;
          return (
            <button key={k} className={"mode" + (on ? " on" : "")} onClick={() => S.actions.setAccount(k)}>
              <span style={{ display: "flex", alignItems: "center", width: "100%", gap: 10 }}>
                <span className="m-mode">{a.mode}</span>
                <span style={{ flex: 1 }} />
                {on
                  ? <span className="bdg hanwha"><i className="pt" />Active</span>
                  : <span className="tri" style={{ fontSize: 10.5 }}>Switch</span>}
              </span>
              <span className="m-name">{a.name}</span>
              <span className="m-scope">{a.scope}</span>
            </button>
          );
        })}
      </div>
    );
  }

  /* Drop target for spreadsheets. Used on the entry screen and in onboarding,
     so a file added in one place shows up in the other. */
  function Dropzone({ onFiles, title, hint, compact }) {
    const [hot, setHot] = useState(false);
    const input = useRef(null);
    const take = (list) => { const f = Array.from(list || []); if (f.length) onFiles(f); };
    return (
      <div className={"dz" + (hot ? " hot" : "") + (compact ? " sm" : "")}
        onDragOver={(e) => { e.preventDefault(); setHot(true); }}
        onDragLeave={() => setHot(false)}
        onDrop={(e) => { e.preventDefault(); setHot(false); take(e.dataTransfer.files); }}
        onClick={() => input.current && input.current.click()}
        style={{ cursor: "pointer" }}>
        <input ref={input} type="file" multiple style={{ display: "none" }}
          onChange={(e) => { take(e.target.files); e.target.value = ""; }} />
        <div style={{ fontSize: compact ? 14.5 : 16, fontWeight: 600 }}>{title}</div>
        <div className="tri mt8" style={{ fontSize: 12 }}>{hint}</div>
      </div>
    );
  }

  /* One staged file, with whatever the agent has managed to read from it. */
  function FileRow({ f, state, pct, onRemove }) {
    return (
      <div className="fi">
        <span className="mono tri">XLS</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="nm">{f.name}</div>
          <div className="mt">{f.size}{f.sheets ? " · " + f.sheets + " sheets" : ""} · {f.note}</div>
        </div>
        {state && (
          <div style={{ width: 230 }}>
            <div className="between" style={{ marginBottom: 4 }}>
              <span className="tri" style={{ fontSize: 11 }}>{state}</span>
              <span className="tri num" style={{ fontSize: 11 }}>{Math.round(pct)}%</span>
            </div>
            <div className="prog"><i style={{ width: pct + "%" }} /></div>
          </div>
        )}
        {pct >= 100 && <span className="bdg live"><i className="pt" />Done</span>}
        {onRemove && <button className="x" title="Remove" onClick={(e) => { e.stopPropagation(); onRemove(f.id); }}>×</button>}
      </div>
    );
  }

  /* Amount field that accepts typed numbers and shows the KRW equivalent. */
  function Amount({ value, onChange, placeholder, min }) {
    return (
      <div>
        <input type="text" inputMode="numeric" placeholder={placeholder || "0"}
          value={value === "" ? "" : u.num(value)}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, "");
            onChange(raw === "" ? "" : Math.min(999999999, parseInt(raw, 10)));
          }} />
        <div className="tri" style={{ fontSize: 11, marginTop: 4 }}>
          {value ? u.krwFull(value) : "—"}{min ? " · minimum " + u.usd(min) : ""}
        </div>
      </div>
    );
  }

  /* Ten years of simulated outcomes: today's actual mix against a model stated
     in classes. Used by the portfolio's model panel and by the mandate step of
     onboarding, so both argue from the same maths. */
  function GrowthFan({ positions, modelClasses, modelLabel, collapsible, defaultOpen }) {
    const [open, setOpen] = useState(defaultOpen !== false);
    const t = u.total(positions);
    const YEARS = 10, CW = 720, CH = 230;

    const curW = {};
    u.byClass(positions).forEach((c) => { curW[c.key] = c.wt; });
    const cur = u.projectMix(curW, t, YEARS, positions);
    const mod = u.projectMix(modelClasses, t, YEARS);
    const curR = cur.mu, modR = mod.mu;

    const hi = Math.max(...cur.path.map((q) => q.p90), ...mod.path.map((q) => q.p90));
    const lo = Math.min(...cur.path.map((q) => q.p10), ...mod.path.map((q) => q.p10), t) * 0.97;
    const X = (y) => (y / YEARS) * CW;
    const Y = (v) => CH - ((v - lo) / (hi - lo)) * CH;
    const pts = (path, k) => path.map((q) => X(q.y).toFixed(1) + "," + Y(q[k]).toFixed(1)).join(" ");
    const band = (path) => pts(path, "p90") + " " + path.slice().reverse().map((q) => X(q.y).toFixed(1) + "," + Y(q.p10).toFixed(1)).join(" ");
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => lo + (hi - lo) * f);
    const curEnd = cur.path[YEARS].mean, modEnd = mod.path[YEARS].mean;

    return (
      <>
        <div className={"panel-hd" + (collapsible ? " clickable" : "")}
          style={collapsible ? { cursor: "pointer", borderTop: "1px solid var(--g3)", borderBottom: 0 } : null}
          onClick={collapsible ? () => setOpen(!open) : null}>
          <div>
            <h3>
              {collapsible && <span style={{ fontSize: 11, color: "var(--g1)", marginRight: 7 }}>{open ? "▾" : "▸"}</span>}
              Projected growth
            </h3>
            <div className="tri" style={{ fontSize: 11.5, marginTop: 2, paddingLeft: collapsible ? 18 : 0 }}>
              Ten years of simulated outcomes — today's mix at {u.pct(curR)} ± {u.pct(cur.sigma)} against the model at{" "}
              {u.pct(modR)} ± {u.pct(mod.sigma)}
            </div>
          </div>
          <span className="tri num" style={{ fontSize: 12 }}>
            {u.usdC(cur.path[YEARS].p10)}–{u.usdC(cur.path[YEARS].p90)} vs {u.usdC(mod.path[YEARS].p10)}–{u.usdC(mod.path[YEARS].p90)}
          </span>
        </div>
        {open && (
          <div className="panel-bd">
            <div className="row" style={{ gap: 0, alignItems: "stretch" }}>
              <div style={{ width: 58, position: "relative", flexShrink: 0 }}>
                {ticks.map((v, i) => (
                  <span key={i} className="tri num" style={{
                    position: "absolute", right: 8, top: (CH - (i / (ticks.length - 1)) * CH) - 6,
                    fontSize: 10, whiteSpace: "nowrap",
                  }}>{u.usdC(v)}</span>
                ))}
              </div>
              <svg viewBox={"0 0 " + CW + " " + CH} preserveAspectRatio="none"
                style={{ flex: 1, height: CH, display: "block", border: "1px solid var(--g3)" }}>
                {ticks.slice(1, -1).map((v, i) => (
                  <line key={i} x1="0" y1={Y(v)} x2={CW} y2={Y(v)} stroke="var(--g4)" strokeWidth="1"
                    vectorEffect="non-scaling-stroke" />
                ))}
                {/* ranges first, so the mean paths read on top of them */}
                <polygon points={band(cur.path)} fill="#9A7B2E" opacity=".18" />
                <polygon points={band(mod.path)} fill="var(--navy)" opacity=".16" />
                <polyline points={pts(cur.path, "p10")} fill="none" stroke="#9A7B2E" strokeWidth="1"
                  strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
                <polyline points={pts(mod.path, "p10")} fill="none" stroke="var(--navy)" strokeWidth="1"
                  strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
                <polyline points={pts(cur.path, "mean")} fill="none" stroke="#9A7B2E" strokeWidth="2"
                  vectorEffect="non-scaling-stroke" />
                <polyline points={pts(mod.path, "mean")} fill="none" stroke="var(--navy)" strokeWidth="2"
                  vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
            <div style={{ display: "flex", paddingLeft: 58 }}>
              <div style={{ flex: 1, display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--g2)", paddingTop: 4 }}>
                {Array.from({ length: 6 }, (_, i) => <span key={i}>{i * 2 === 0 ? "now" : "yr " + i * 2}</span>)}
              </div>
            </div>

            <table className="t dense mt12">
              <thead><tr><th></th><th className="n">Expected a year</th><th className="n">Volatility</th>
                <th className="n">After 10 years</th><th className="n">Poor decade (10th)</th><th className="n">Good decade (90th)</th></tr></thead>
              <tbody>
                <tr>
                  <td><span className="sw" style={{ display: "inline-block", width: 9, height: 9, background: "#9A7B2E", marginRight: 8 }} />
                    Today's mix</td>
                  <td className="n num">{u.pct(curR)}</td>
                  <td className="n"><span className="num">{u.pct(cur.sigma)}</span>
                    <div className="tsub">{u.pct(cur.marketSigma)} market + {u.pct(cur.specificSigma)} single names</div></td>
                  <td className="n num">{u.usdC(curEnd)}</td>
                  <td className="n num tri">{u.usdC(cur.path[YEARS].p10)}</td>
                  <td className="n num tri">{u.usdC(cur.path[YEARS].p90)}</td>
                </tr>
                <tr>
                  <td><span className="sw" style={{ display: "inline-block", width: 9, height: 9, background: "var(--navy)", marginRight: 8 }} />
                    Model · {modelLabel}</td>
                  <td className="n num">{u.pct(modR)}</td>
                  <td className="n"><span className="num">{u.pct(mod.sigma)}</span>
                    <div className="tsub">diversified by construction</div></td>
                  <td className="n num">{u.usdC(modEnd)}</td>
                  <td className="n num tri">{u.usdC(mod.path[YEARS].p10)}</td>
                  <td className="n num tri">{u.usdC(mod.path[YEARS].p90)}</td>
                </tr>
              </tbody>
            </table>

            <div className="note mt12">
              Shaded bands are the 10th to 90th percentile, dashed lines the 10th — the poor decade, which is the
              number worth looking at. Lognormal outcomes from fixed assumptions:
              {" " + D.classes.map((c) => c.label.split(" ")[0] + " " + u.pct(D.expectedReturn[c.key]) + " ± " + u.pct(D.expectedVol[c.key])).join(" · ")},
              correlated as listed markets normally are, before fees, tax and capital calls.
              {" "}Today's mix carries {u.pct(cur.specificSigma)} on top of that for specific risk — the book holds
              nine single names including {u.pct(u.affiliateExposure(positions).wt)} in the family's own operating
              company, and a class average assumes an index. The model is stated in classes, so it carries none, which
              is most of the gap. Not a backtest and not a forecast — the range these assumptions imply.
            </div>
          </div>
        )}
      </>
    );
  }

  BB.ui = { Money, Delta, ProvBadge, SleeveBadge, LiqBadge, Lock, Stat, Band, Panel, Tabs, Seg, Modal, MiniBar, Fit, Crumb, Toast, Amount, Dropzone, FileRow, ModeStrip, AccountCard, AccountCards, Steps, GrowthFan };
})();
