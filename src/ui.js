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

  BB.ui = { Money, Delta, ProvBadge, SleeveBadge, LiqBadge, Lock, Stat, Band, Panel, Tabs, Seg, Modal, MiniBar, Fit, Crumb, Toast, Amount };
})();
