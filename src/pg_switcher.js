/* / — demo entry. Two accounts, one family office. */
(function () {
  const D = BB.data, u = BB.u, S = BB.store;
  const { Money, Dropzone, FileRow } = BB.ui;

  function Card({ a, on, onPick }) {
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

  function Switcher() {
    const st = S.useStore();
    const t = u.total(st.positions);
    const sl = u.sleeveTotals(st.positions);
    const pick = (id) => { S.actions.setAccount(id); S.navigate("/portfolio"); };

    return (
      <div className="wrap page" style={{ maxWidth: 1080 }}>
        <div className="eyebrow">Demo entry</div>
        <h1 className="mt8">{D.family.name}</h1>
        <div className="sub mt8" style={{ maxWidth: "70ch" }}>
          One balance sheet — public and private, liquid and illiquid — held by two accounts with different authority.
          Choose an account to begin, or switch at any time from the top right.
        </div>

        {/* the way in: give the product the spreadsheets the family already runs on */}
        <div className="panel mt24">
          <div className="panel-hd">
            <div>
              <h3>Start here — bring the spreadsheets in</h3>
              <div className="tri" style={{ fontSize: 11.5, marginTop: 2 }}>
                Holdings, capital call schedules, rent rolls, custodian exports. Format and language do not matter.
              </div>
            </div>
            <span className="bdg plain">{st.uploads.length} files staged</span>
          </div>
          <div className="panel-bd">
            <Dropzone compact onFiles={(f) => S.actions.addUploads(f)}
              title="Drop your portfolio spreadsheets. Any format."
              hint=".xlsx · .xls · .csv · .numbers · PDF statements · 한글 파일명 지원" />
            <div className="filelist mt12">
              {st.uploads.map((f) => (
                <FileRow key={f.id} f={f} onRemove={(id) => S.actions.removeUpload(id)} />
              ))}
            </div>
            <div className="btn-row mt12">
              <button className="btn p lg" disabled={!st.uploads.length}
                onClick={() => S.navigate("/onboarding/upload")}>
                Read {st.uploads.length} files and extract positions →
              </button>
              <span className="tri" style={{ fontSize: 11.5 }}>
                Three files are already staged from the family CFO, so you can walk the flow without uploading anything.
              </span>
            </div>
          </div>
        </div>

        <h2 className="mt32 mb12">Or open the book as it stands</h2>
        <div className="band">
          <div className="cell"><div className="stat-l">Total assets</div><div className="stat-v"><Money v={t} compact /></div></div>
          <div className="cell"><div className="stat-l">Core sleeve</div><div className="stat-v"><Money v={sl.core} compact /></div>
            <div className="stat-s">{u.pct(sl.corePct)} · target {u.pct(D.family.coreTarget * 100)}</div></div>
          <div className="cell"><div className="stat-l">Alpha sleeve</div><div className="stat-v"><Money v={sl.alpha} compact /></div>
            <div className="stat-s">{u.pct(sl.alphaPct)} · target {u.pct(D.family.alphaTarget * 100)}</div></div>
          <div className="cell"><div className="stat-l">Positions</div><div className="stat-v">{st.positions.length}</div>
            <div className="stat-s">{st.positions.filter((p) => p.liq === "Daily").length} listed · {st.positions.filter((p) => p.liq !== "Daily").length} private</div></div>
        </div>

        <div className="grid mt16" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Card a={D.accounts.principal} on={st.account === "principal"} onPick={() => pick("principal")} />
          <Card a={D.accounts.successor} on={st.account === "successor"} onPick={() => pick("successor")} />
        </div>

        <div className="panel mt24">
          <div className="panel-hd"><h3>Start elsewhere</h3></div>
          <div className="panel-bd">
            <div className="btn-row">
              <button className="btn" onClick={() => S.navigate("/marketplace")}>Marketplace</button>
              <button className="btn" onClick={() => S.navigate("/secondary")}>Secondary board</button>
              <button className="btn" onClick={() => S.navigate("/activity")}>Activity log</button>
            </div>
            <div className="note mt12">
              Prototype. All data is seeded and held in memory; every action resolves locally and is written to the
              shared activity log. Nothing leaves the browser.
            </div>
          </div>
        </div>
      </div>
    );
  }

  BB.pages = BB.pages || {};
  BB.pages.Switcher = Switcher;
})();
