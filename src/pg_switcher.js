/* / — demo entry. Two accounts, one family office. */
(function () {
  const D = BB.data, u = BB.u, S = BB.store;
  const { Dropzone, FileRow, Steps } = BB.ui;

  function Switcher() {
    const st = S.useStore();

    return (
      <div className="wrap page" style={{ maxWidth: 1080 }}>
        <div className="eyebrow">Demo entry</div>
        <h1 className="mt8">{D.family.name}</h1>
        <div className="sub mt8" style={{ maxWidth: "70ch" }}>
          One balance sheet — public and private, liquid and illiquid — held by two accounts with different authority.
          Switch between them at any time from the top right.
        </div>

        {/* the way in: three steps, stated before the first one is asked for */}
        <div className="between mt24 mb12">
          <h2>Set the book up</h2>
          <span className="tri" style={{ fontSize: 11.5 }}>Three steps · about two minutes</span>
        </div>
        <Steps at="upload" />

        <div className="panel">
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

      </div>
    );
  }

  BB.pages = BB.pages || {};
  BB.pages.Switcher = Switcher;
})();
