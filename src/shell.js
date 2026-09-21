/* App shell: top bar, navigation, account switcher, router. */
(function () {
  const { useState, useEffect } = React;
  const D = BB.data, u = BB.u, S = BB.store;

  function AccountSwitcher() {
    const st = S.useStore();
    const [open, setOpen] = useState(false);
    const a = D.accounts[st.account];
    useEffect(() => {
      if (!open) return;
      const on = () => setOpen(false);
      window.addEventListener("click", on);
      return () => window.removeEventListener("click", on);
    }, [open]);
    return (
      <div className="acct" onClick={(e) => e.stopPropagation()}>
        <button className="acct-btn" onClick={() => setOpen(!open)}>
          <span className={"dot" + (st.account === "successor" ? " alt" : "")} />
          <span>
            <span className="nm">{a.name}</span>
            <span className="rl" style={{ display: "block" }}>{a.mode}</span>
          </span>
          <span className="tri" style={{ marginLeft: 4 }}>{open ? "▴" : "▾"}</span>
        </button>
        {open && (
          <div className="acct-menu">
            <div className="hd between">
              <span className="lbl">Switch account</span>
              <span className="demo-tag">Demo</span>
            </div>
            {["principal", "successor"].map((k) => {
              const x = D.accounts[k];
              return (
                <button key={k} className={"acct-opt" + (st.account === k ? " on" : "")}
                  onClick={() => { S.actions.setAccount(k); setOpen(false); }}>
                  <div className="t">
                    <span>{x.name} · {x.mode}</span>
                    {st.account === k && <span className="bdg hanwha"><i className="pt" />Active</span>}
                  </div>
                  <div className="d">{x.scope}</div>
                </button>
              );
            })}
            <div style={{ padding: "10px 12px", fontSize: 11, color: "var(--g2)", lineHeight: 1.6 }}>
              Both accounts belong to {D.family.name}. The switcher changes authority, home screen and information
              architecture — not the data.
            </div>
          </div>
        )}
      </div>
    );
  }

  function Nav({ route }) {
    const st = S.useStore();
    const pending = st.approvals.filter((a) => a.status === "pending").length;
    const items = [
      { to: "/portfolio", label: "Portfolio", match: (p) => p.startsWith("/portfolio") },
      { to: "/marketplace", label: "Marketplace", match: (p) => p.startsWith("/marketplace") },
      { to: "/secondary", label: "Secondary", match: (p) => p.startsWith("/secondary") },
      { to: "/approvals", label: st.account === "principal" ? "Approvals" : "Proposals", match: (p) => p.startsWith("/approvals"), n: pending },
      { to: "/activity", label: "Activity", match: (p) => p.startsWith("/activity") },
    ];
    return (
      <nav className="nav">
        {items.map((i) => (
          <a key={i.to} href={"#" + i.to} className={i.match(route.path) ? "on" : ""}>
            {i.label}{i.n ? <span className="badge-n">{i.n}</span> : null}
          </a>
        ))}
      </nav>
    );
  }

  function TopBar({ route }) {
    return (
      <header className="topbar">
        <div className="wrap">
          <div className="brand" onClick={() => S.navigate("/")}>
            <span className="mark"><span /></span>
            <b>Barbell</b>
            <span className="tri" style={{ fontSize: 11, marginLeft: 2 }}>{D.family.name}</span>
          </div>
          <Nav route={route} />
          <span className="spacer" />
          <span className="tri" style={{ fontSize: 11 }}>Switch account →</span>
          <AccountSwitcher />
        </div>
      </header>
    );
  }

  function Footer() {
    return (
      <footer className="foot">
        <div className="wrap" style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <span>Barbell · institutional wealth operating system · prototype</span>
          <span className="spacer" style={{ flex: 1 }} />
          <a href="#/onboarding/upload">Onboarding</a>
          <a href="#/activity">Activity</a>
          <a href="#/ops">Ops</a>
        </div>
      </footer>
    );
  }

  function Router() {
    const route = S.useRoute();
    const P = BB.pages;
    const p = route.path;
    let view = null;

    if (p === "/" || p === "") view = <P.Switcher />;
    else if (p === "/onboarding/upload") view = <P.Upload />;
    else if (p === "/onboarding/reconcile") view = <P.Reconcile />;
    else if (p === "/onboarding/mandate") view = <P.Mandate />;
    else if (p === "/portfolio") view = <P.Portfolio route={route} />;
    else if (p.startsWith("/portfolio/")) view = <P.AssetClass route={route} />;
    else if (p === "/marketplace") view = <P.Marketplace route={route} />;
    else if (p.startsWith("/marketplace/")) view = <P.Deal route={route} />;
    else if (p === "/secondary") view = <P.Secondary />;
    else if (p.startsWith("/secondary/")) view = <P.Listing route={route} />;
    else if (p === "/approvals") view = <P.Approvals />;
    else if (p === "/activity") view = <P.Activity />;
    else if (p === "/ops") view = <P.Ops />;
    else if (p === "/invitation") view = <P.Invitation route={route} />;
    else view = (
      <div className="wrap page">
        <div className="empty">
          <div>No route at <span className="mono">{p}</span>.</div>
          <button className="btn mt12" onClick={() => S.navigate("/portfolio")}>Go to the portfolio</button>
        </div>
      </div>
    );

    const bare = p === "/" || p === "/invitation" || p.startsWith("/onboarding");
    return (
      <div className="app">
        {!bare && <TopBar route={route} />}
        {bare && (
          <header className="topbar">
            <div className="wrap">
              <div className="brand" onClick={() => S.navigate("/")}>
                <span className="mark"><span /></span><b>Barbell</b>
              </div>
              <span className="spacer" />
              <button className="btn sm" onClick={() => S.navigate("/portfolio")}>Skip to the portfolio</button>
              <AccountSwitcher />
            </div>
          </header>
        )}
        {view}
        <Footer />
        <BB.ui.Toast />
      </div>
    );
  }

  BB.Router = Router;
})();
