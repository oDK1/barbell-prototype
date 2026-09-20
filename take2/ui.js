/* =============================================================================
   Take 2 — primitives. Cards, pills, stat tiles, drawer, modal, locks.
   ============================================================================= */
(function () {
  const D = BB.data, u = BB.u, S = T2.store;
  const h = React.createElement;

  /* class → the validated categorical slot. Fixed order, never cycled. */
  const CLS_COLOR = { equity: "var(--s1)", debt: "var(--s2)", real: "var(--s3)", cash: "var(--s4)" };
  const CLS_HEX = { equity: "#2a78d6", debt: "#eb6834", real: "#1baf7a", cash: "#eda100" };

  function Money({ v, krw, dp, className }) {
    return h("span", { className },
      u.usd(v, dp === undefined ? 0 : dp),
      krw ? h("span", { className: "krw" }, u.krwC(v)) : null);
  }

  function Pill({ tone, children, dot }) {
    return h("span", { className: "pill " + (tone || "") },
      dot ? h("span", { className: "dot", style: { background: dot } }) : null, children);
  }

  function Swatch({ cls }) {
    return h("span", { className: "swatch", style: { background: CLS_COLOR[cls] } });
  }

  /* Stat tile: label · value · optional delta. Proportional figures on the
     value — tabular-nums is for columns, not display numbers. */
  function Stat({ label, value, delta, tone, sub, children }) {
    return h("div", { className: "card stat" },
      h("div", { className: "eyebrow" }, label),
      h("div", { className: "stat-val" }, value),
      delta ? h("div", { className: "stat-delta " + (tone || "") }, delta) : null,
      sub ? h("div", { className: "stat-delta" }, sub) : null,
      children);
  }

  function Card({ title, desc, right, children, foot, pad }) {
    return h("div", { className: "card" },
      title ? h("div", { className: "card-hd" },
        h("div", null,
          h("h3", null, title),
          desc ? h("div", { className: "tri mini", style: { marginTop: 2 } }, desc) : null),
        h("div", { className: "gap" }),
        right) : null,
      h("div", { className: pad === false ? "" : "card-bd" }, children),
      foot ? h("div", { className: "card-ft" }, foot) : null);
  }

  /* A control the current account may not use. Renders disabled with the
     reason on hover rather than disappearing — the Successor should see that
     the action exists and who owns it. */
  function Lock({ children, reason }) {
    return h("span", { className: "lockwrap" }, children,
      h("span", { className: "tip" }, reason || S.LOCK));
  }

  function Btn({ kind, size, onClick, disabled, children, lock }) {
    const b = h("button", {
      className: "btn" + (kind ? " " + kind : "") + (size ? " " + size : ""),
      onClick, disabled: disabled || !!lock,
    }, children);
    return lock ? h(Lock, { reason: lock }, b) : b;
  }

  function Seg({ value, onChange, options }) {
    return h("div", { className: "seg" }, options.map((o) =>
      h("button", {
        key: o.k, className: value === o.k ? "on" : "",
        onClick: () => onChange(o.k),
      }, o.label)));
  }

  function Select({ value, onChange, options, width }) {
    return h("select", {
      className: "input", value, style: width ? { width } : null,
      onChange: (e) => onChange(e.target.value),
    }, options.map((o) => h("option", { key: o.k, value: o.k }, o.label)));
  }

  function Modal({ title, desc, children, foot, onClose, wide }) {
    React.useEffect(() => {
      const on = (e) => e.key === "Escape" && onClose();
      window.addEventListener("keydown", on);
      return () => window.removeEventListener("keydown", on);
    }, []);
    return h("div", { className: "modal-wrap" },
      h("div", { className: "scrim", onClick: onClose }),
      h("div", { className: "modal" + (wide ? " wide" : ""), style: { position: "relative", zIndex: 96 } },
        h("div", { className: "modal-hd" },
          h("h2", null, title),
          desc ? h("div", { className: "tri mini", style: { marginTop: 4 } }, desc) : null),
        h("div", { className: "modal-bd" }, children),
        h("div", { className: "modal-ft" }, foot)));
  }

  function Drawer({ title, eyebrow, badge, children, foot, onClose }) {
    React.useEffect(() => {
      const on = (e) => e.key === "Escape" && onClose();
      window.addEventListener("keydown", on);
      return () => window.removeEventListener("keydown", on);
    }, []);
    return h("div", null,
      h("div", { className: "scrim", onClick: onClose }),
      h("div", { className: "drawer" },
        h("div", { className: "drawer-hd" },
          h("div", { style: { flex: 1, minWidth: 0 } },
            eyebrow ? h("div", { className: "eyebrow", style: { marginBottom: 5 } }, eyebrow) : null,
            h("h2", null, title),
            badge ? h("div", { className: "row mt-s wrap" }, badge) : null),
          h("button", { className: "btn quiet sm", onClick: onClose }, "Close")),
        h("div", { className: "drawer-bd" }, children),
        foot ? h("div", { className: "drawer-ft" }, foot) : null));
  }

  function Meter({ pct, tone }) {
    const c = tone === "crit" ? "var(--critical)" : tone === "warn" ? "var(--warn)" : "var(--accent)";
    return h("div", { className: "meter" },
      h("div", { style: { width: Math.max(0, Math.min(100, pct)) + "%", background: c } }));
  }

  /* Provenance is a first-class badge in both takes: where a number came from
     and how old it is. */
  function Prov({ p }) {
    if (p.prov === "live") return h(Pill, { tone: "good" }, "Live");
    if (p.prov === "hanwha") return h(Pill, { tone: "accent" }, "Hanwha NAV");
    const d = u.days(p.asOf || S.get().syncedAt);
    const tone = d > 180 ? "crit" : d > 90 ? "warn" : "";
    return h(Pill, { tone }, d + "d old");
  }

  function Avatar({ id }) {
    const a = D.accounts[id];
    return h("div", { className: "avatar" + (id === "successor" ? " alt" : "") },
      a.name.split(" ").map((x) => x[0]).join("").replace(/\./g, "").slice(0, 2));
  }

  function Empty({ children }) { return h("div", { className: "empty" }, children); }

  /* The activity log carries entries the platform itself wrote (who: "system"),
     which is not one of the two accounts. */
  function actor(who) {
    return D.accounts[who] || { name: "Barbell", title: "Platform", scope: "" };
  }
  const actorColor = (who) =>
    who === "principal" ? "var(--accent)" : who === "successor" ? "var(--s1)" : "var(--faint)";

  /* A number input that reads as money and never produces NaN. */
  function MoneyInput({ value, onChange, width, step }) {
    return h("div", { className: "row", style: { gap: 0 } },
      h("span", {
        style: { padding: "8px 2px 8px 11px", border: "1px solid var(--line)", borderRight: 0,
                 borderRadius: "10px 0 0 10px", background: "var(--card)", color: "var(--muted)" },
      }, "$"),
      h("input", {
        className: "input", type: "text", inputMode: "numeric",
        style: { width: width || 150, borderRadius: "0 10px 10px 0", borderLeft: 0,
                 fontVariantNumeric: "tabular-nums" },
        value: value ? Number(value).toLocaleString("en-US") : "",
        onChange: (e) => {
          const n = Number(String(e.target.value).replace(/[^0-9]/g, ""));
          onChange(isNaN(n) ? 0 : n);
        },
      }));
  }

  T2.ui = { h, Money, Pill, Swatch, Stat, Card, Lock, Btn, Seg, Select, Modal, Drawer,
            Meter, Prov, Avatar, Empty, MoneyInput, actor, actorColor, CLS_COLOR, CLS_HEX };
})();
