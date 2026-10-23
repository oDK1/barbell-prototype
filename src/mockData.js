/* =============================================================================
   Barbell — mockData
   The single source of seeded truth. Every screen reads from here.
   Edit this file to change the demo; nothing else holds data.
   Family office: Namsan Family Office. Reference date: 2026-09-19.
   ============================================================================= */
(function () {
  const KRW = 1383;            // ₩ per $1 — used for the secondary KRW line everywhere
  const TODAY = "2026-09-19";

  const family = {
    name: "Namsan Family Office",
    established: 1998,
    baseCurrency: "USD",
    reportingCurrency: "KRW",
    fx: KRW,
    asOf: "2026-09-19T15:42:00+09:00",
    totalAUM: 62400000,
    coreTarget: 0.9,
    alphaTarget: 0.1,
    operatingCompany: "Hanmi Chemical Holdings Co., Ltd.",
  };

  const accounts = {
    principal: {
      id: "principal",
      mode: "Sovereign Mode",
      name: "Y.S. Park",
      title: "Chairman · Principal",
      age: 68,
      mandate: "Capital preservation",
      scope: "Acts on the whole portfolio · has the final say on proposals",
      desc: "Buys, sells and commits anywhere in the book, and sets the objective everything else is measured against. Every commitment the successor proposes arrives here first.",
    },
    successor: {
      id: "successor",
      mode: "Successor Mode",
      name: "Jae-won Park",
      title: "Director · Successor",
      age: 34,
      mandate: "Growth",
      scope: "Sees the whole book · commitments go to the Principal",
      desc: "The same balance sheet as the Principal, in full. Can raise a trade or a commitment anywhere in it, and each one is sent to the Principal to settle rather than executed.",
    },
  };

  /* ---------------------------------------------------------------- taxonomy */
  const classes = [
    { key: "equity", label: "Equity", target: 35.0, sw: "sw-eq", color: "#1B2A4A" },
    { key: "debt", label: "Debt", target: 40.0, sw: "sw-dt", color: "#3F7183" },
    { key: "real", label: "Real Assets", target: 18.0, sw: "sw-ra", color: "#9A7B2E" },
    { key: "cash", label: "Cash Equivalents", target: 7.0, sw: "sw-cs", color: "#A9A396" },
  ];

  const subs = [
    { key: "pubeq", cls: "equity", label: "Public Equity", target: 24.0, note: "KR listed · US listed · ETFs" },
    { key: "pe", cls: "equity", label: "Private Equity", target: 4.5, note: "Buyout co-invest · growth" },
    { key: "vc", cls: "equity", label: "Venture Capital", target: 4.0, note: "Funds · direct SPVs" },
    { key: "preipo", cls: "equity", label: "Pre-IPO Secondaries", target: 2.5, note: "Late-stage blocks" },
    { key: "sov", cls: "debt", label: "Sovereign", target: 16.0, note: "UST · KTB" },
    { key: "ig", cls: "debt", label: "Investment Grade Credit", target: 9.0, note: "Corporate IG" },
    { key: "pcred", cls: "debt", label: "Private Credit / Direct Lending", target: 11.0, note: "Senior secured · direct" },
    { key: "struct", cls: "debt", label: "Structured", target: 4.0, note: "Notes · autocall" },
    { key: "re", cls: "real", label: "Real Estate", target: 9.0, note: "Direct · funds" },
    { key: "infra", cls: "real", label: "Infrastructure", target: 6.5, note: "Incl. data centers" },
    { key: "comm", cls: "real", label: "Commodities", target: 2.5, note: "Bullion · resources" },
    { key: "mmf", cls: "cash", label: "MMF", target: 2.5, note: "" },
    { key: "tbill", cls: "cash", label: "T-Bills", target: 1.5, note: "" },
    { key: "dep", cls: "cash", label: "Bank Deposits", target: 2.0, note: "" },
    { key: "fx", cls: "cash", label: "FX Balances", target: 1.0, note: "" },
  ];

  /* --------------------------------------------------------------- positions */
  /* prov: live | hanwha | self      liq: Immediate — everything, always       */
  const positions = [
    /* ---- EQUITY · Public (12) ------------------------------------------- */
    { id: "p01", name: "Hanmi Chemical Holdings Co., Ltd.", ticker: "004370.KS", cls: "equity", sub: "pubeq", grp: "KR listed",
      line: "pubeq",
      sleeve: "core", prov: "live", value: 11391011, cost: 7006599, qty: 80174, px: 196500, ccy: "KRW", pxUsd: 142.08, chg: 0.82,
      sector: "Materials", geo: "Korea", liq: "Immediate", acquired: "2009-06-12", realizedYTD: 0, affiliate: true,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B14" },
      note: "Family operating company. Board seat held by the Principal." },
    { id: "p02", name: "Samsung Electronics Co., Ltd.", ticker: "005930.KS", cls: "equity", sub: "pubeq", grp: "KR listed",
      line: "pubeq",
      bucket: "conviction", theme: "pubtech",
      sleeve: "core", prov: "live", value: 1855645, cost: 1360918, qty: 34914, px: 73500, ccy: "KRW", pxUsd: 53.15, chg: -0.41,
      sector: "Info Tech", geo: "Korea", liq: "Immediate", acquired: "2016-03-02", realizedYTD: 84000,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B15" } },
    { id: "p03", name: "SK hynix Inc.", ticker: "000660.KS", cls: "equity", sub: "pubeq", grp: "KR listed",
      line: "pubeq",
      bucket: "conviction", theme: "pubtech",
      sleeve: "core", prov: "live", value: 805966, cost: 466759, qty: 5708, px: 195300, ccy: "KRW", pxUsd: 141.20, chg: 1.94,
      sector: "Info Tech", geo: "Korea", liq: "Immediate", acquired: "2021-11-08", realizedYTD: 0,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B16" } },
    { id: "p04", name: "NVIDIA Corporation", ticker: "NVDA", cls: "equity", sub: "pubeq", grp: "US listed",
      line: "pubeq",
      bucket: "conviction", theme: "pubtech",
      sleeve: "core", prov: "live", value: 2005760, cost: 695456, qty: 9375, px: 214.00, ccy: "USD", pxUsd: 214.00, chg: 1.12,
      sector: "Info Tech", geo: "United States", liq: "Immediate", acquired: "2022-10-14", realizedYTD: 312000,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B21" } },
    { id: "p05", name: "Microsoft Corporation", ticker: "MSFT", cls: "equity", sub: "pubeq", grp: "US listed",
      line: "pubeq",
      bucket: "conviction", theme: "pubtech",
      sleeve: "core", prov: "live", value: 1517798, cost: 1034748, qty: 3120, px: 486.30, ccy: "USD", pxUsd: 486.30, chg: 0.34,
      sector: "Info Tech", geo: "United States", liq: "Immediate", acquired: "2020-05-19", realizedYTD: 0,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B22" } },
    { id: "p06", name: "Apple Inc.", ticker: "AAPL", cls: "equity", sub: "pubeq", grp: "US listed",
      line: "pubeq",
      bucket: "conviction", theme: "pubtech",
      sleeve: "core", prov: "live", value: 1106731, cost: 806990, qty: 4217, px: 262.40, ccy: "USD", pxUsd: 262.40, chg: -0.28,
      sector: "Info Tech", geo: "United States", liq: "Immediate", acquired: "2019-08-07", realizedYTD: 0,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B23" } },
    { id: "p07", name: "Alphabet Inc. Class A", ticker: "GOOGL", cls: "equity", sub: "pubeq", grp: "US listed",
      line: "pubeq",
      bucket: "conviction", theme: "pubtech",
      sleeve: "alpha", prov: "live", value: 647004, cost: 457390, qty: 3055, px: 211.75, ccy: "USD", pxUsd: 211.75, chg: 0.61,
      sector: "Comm Services", geo: "United States", liq: "Immediate", acquired: "2024-02-21", realizedYTD: 0,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B24" } },
    { id: "p08", name: "Taiwan Semiconductor Mfg. (ADR)", ticker: "TSM", cls: "equity", sub: "pubeq", grp: "US listed",
      line: "pubeq",
      bucket: "conviction", theme: "pubtech",
      sleeve: "core", prov: "live", value: 693088, cost: 386155, qty: 2580, px: 268.90, ccy: "USD", pxUsd: 268.90, chg: 1.47,
      sector: "Info Tech", geo: "Taiwan", liq: "Immediate", acquired: "2023-01-30", realizedYTD: 0,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B25" } },
    { id: "p09", name: "Toyota Motor Corporation", legacy: "TOYOTA (JPY口座) — 東証", ticker: "7203.T", cls: "equity", sub: "pubeq", grp: "US listed",
      line: "pubeq",
      sleeve: "core", prov: "live", value: 1816883, cost: 1570445, qty: 80536, px: 3320, ccy: "JPY", pxUsd: 22.56, chg: -0.62,
      sector: "Consumer Disc.", geo: "Japan", liq: "Immediate", acquired: "2018-09-11", realizedYTD: 0, fxFlag: true,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet2!D7" },
      note: "JPY-denominated. Held in the Japan sub-account since the 2018 restructuring." },
    { id: "p10", name: "iShares MSCI ACWI ETF", ticker: "ACWI", cls: "equity", sub: "pubeq", grp: "ETF",
      line: "pubeq",
      sleeve: "core", prov: "live", value: 3597396, cost: 2920758, qty: 25946, px: 138.65, ccy: "USD", pxUsd: 138.65, chg: 0.22,
      sector: "Diversified", geo: "Global", liq: "Immediate", acquired: "2021-04-06", realizedYTD: 0,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B31" } },
    { id: "p11", name: "Vanguard S&P 500 ETF", ticker: "VOO", cls: "equity", sub: "pubeq", grp: "ETF",
      line: "pubeq",
      sleeve: "core", prov: "live", value: 2983860, cost: 2163724, qty: 4873, px: 612.40, ccy: "USD", pxUsd: 612.40, chg: 0.19,
      sector: "Diversified", geo: "United States", liq: "Immediate", acquired: "2022-01-18", realizedYTD: 0,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B32" } },
    { id: "p12", name: "KODEX 200 ETF", ticker: "069500.KS", cls: "equity", sub: "pubeq", grp: "ETF",
      line: "pubeq",
      sleeve: "core", prov: "live", value: 1396004, cost: 1237565, qty: 43088, px: 44800, ccy: "KRW", pxUsd: 32.40, chg: 0.44,
      sector: "Diversified", geo: "Korea", liq: "Immediate", acquired: "2023-07-25", realizedYTD: 0,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B33" } },

    /* ---- EQUITY · Private (7) ------------------------------------------- */
    { id: "p13", name: "Woori Industrial Buyout Co-Invest II", cls: "equity", sub: "pe", grp: "Buyout co-invest",
      line: "fof",
      bucket: "conviction", theme: "venture",
      sleeve: "core", prov: "hanwha", value: 1732731, cost: 1312180, ccy: "USD", liq: "Immediate", term: "2029 wind-down",
      sector: "Industrials", geo: "Korea", asOf: "2026-06-30", acquired: "2022-05-18", onBarbell: true, vintage: "2022",
      src: { file: "PE_Capital_Calls_v7_FINAL.xlsx", cell: "Fund List!A4" },
      note: "Hanwha-originated. Capital account pushed from the platform." },
    { id: "p14", name: "Sunrise Growth Partners IV, L.P.", cls: "equity", sub: "pe", grp: "Growth",
      line: "fof",
      bucket: "conviction", theme: "venture",
      sleeve: "alpha", prov: "hanwha", value: 1143469, cost: 890408, ccy: "USD", liq: "Immediate", term: "2031 term",
      sector: "Diversified", geo: "United States", asOf: "2026-06-30", acquired: "2023-09-01", onBarbell: true, vintage: "2023",
      src: { file: "PE_Capital_Calls_v7_FINAL.xlsx", cell: "Fund List!A5" } },
    { id: "p15", name: "Foundry Venture Partners VII, L.P.", cls: "equity", sub: "vc", grp: "Funds",
      line: "fof",
      bucket: "conviction", theme: "venture",
      sleeve: "alpha", prov: "hanwha", value: 984135, cost: 843543, ccy: "USD", liq: "Immediate", term: "2033 term",
      sector: "Technology", geo: "United States", asOf: "2026-06-30", acquired: "2024-03-14", onBarbell: true, vintage: "2024",
      unfunded: 1312180,
      src: { file: "PE_Capital_Calls_v7_FINAL.xlsx", cell: "Fund List!A6" } },
    { id: "p16", name: "Daol Ventures Korea Fund III", cls: "equity", sub: "vc", grp: "Funds",
      line: "fof",
      bucket: "conviction", theme: "venture",
      sleeve: "alpha", prov: "hanwha", value: 637345, cost: 562362, ccy: "USD", liq: "Immediate", term: "2032 term",
      sector: "Technology", geo: "Korea", asOf: "2026-06-30", acquired: "2023-02-09", onBarbell: true, vintage: "2023",
      unfunded: 299926,
      src: { file: "PE_Capital_Calls_v7_FINAL.xlsx", cell: "Fund List!A7" } },
    { id: "p17", name: "Helios AI Infrastructure SPV I", cls: "equity", sub: "vc", grp: "Direct SPV",
      line: "preipo",
      bucket: "conviction", theme: "gpu",
      sleeve: "alpha", prov: "hanwha", value: 505292, cost: 374291, ccy: "USD", liq: "Immediate", term: "Exit-driven",
      sector: "Technology", geo: "United States", asOf: "2026-06-30", acquired: "2026-05-22", onBarbell: true, vintage: "2026",
      src: { file: "PE_Capital_Calls_v7_FINAL.xlsx", cell: "Fund List!A8" } },
    { id: "p18", name: "Aeris Aerospace — Series F secondary block", cls: "equity", sub: "preipo", grp: "Pre-IPO",
      line: "preipo",
      bucket: "conviction", theme: "privco",
      sleeve: "alpha", prov: "hanwha", value: 767295, cost: 598864, ccy: "USD", liq: "Immediate", term: "Until listing",
      sector: "Aerospace", geo: "United States", asOf: "2026-08-31", acquired: "2025-01-16", onBarbell: true, vintage: "2025",
      src: { file: "PE_Capital_Calls_v7_FINAL.xlsx", cell: "Fund List!A9" } },
    { id: "p19", name: "Viva Republica (Toss) common — 2023 block", legacy: "비바리퍼블리카 구주 (2023년 매입)", cls: "equity", sub: "preipo", grp: "Pre-IPO",
      line: "preipo",
      bucket: "conviction", theme: "privco",
      sleeve: "alpha", prov: "self", value: 411720, cost: 411720, ccy: "USD", liq: "Immediate", term: "Until listing",
      sector: "Fintech", geo: "Korea", asOf: "2026-03-31", acquired: "2023-06-30", onBarbell: false, vintage: "2023",
      src: { file: "PE_Capital_Calls_v7_FINAL.xlsx", cell: "Sheet3!C22" },
      note: "Self-maintained. No NAV received since Q1 2026." },

    /* ---- DEBT · Public (6) ---------------------------------------------- */
    { id: "p20", name: "US Treasury 4.25% 15-Nov-2034", ticker: "US91282CLM1", cls: "debt", sub: "sov", grp: "Sovereign",
      line: "ttreas",
      sleeve: "core", prov: "live", value: 3338368, cost: 3255702, qty: 3426779, px: 97.42, ccy: "USD", pxUsd: 0.9742, chg: 0.11,
      sector: "Government", geo: "United States", liq: "Immediate", acquired: "2024-11-20", realizedYTD: 0, ytm: 4.41, dur: 6.9,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B44" } },
    { id: "p21", name: "US Treasury 3.875% 15-Aug-2029", ticker: "US912828YB0", cls: "debt", sub: "sov", grp: "Sovereign",
      line: "ttreas",
      sleeve: "core", prov: "live", value: 2246143, cost: 2222946, qty: 2272275, px: 98.85, ccy: "USD", pxUsd: 0.9885, chg: 0.06,
      sector: "Government", geo: "United States", liq: "Immediate", acquired: "2023-08-24", realizedYTD: 0, ytm: 4.14, dur: 2.7,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B45" } },
    { id: "p22", name: "Korea Treasury Bond 3.25% 10-Sep-2032", legacy: "국고03250-3209(22-8)", ticker: "KR103502GC93", cls: "debt", sub: "sov", grp: "Sovereign",
      line: "ttreas",
      sleeve: "core", prov: "live", value: 2142940, cost: 2092801, qty: 2225045, px: 96.31, ccy: "KRW", pxUsd: 0.9631, chg: -0.04,
      sector: "Government", geo: "Korea", liq: "Immediate", acquired: "2022-09-15", realizedYTD: 0, ytm: 3.62, dur: 5.4,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B46" } },
    { id: "p23", name: "Apple Inc. 3.85% 04-May-2043", ticker: "US037833AT7", cls: "debt", sub: "ig", grp: "Corporate IG",
      line: "ttreas",
      sleeve: "core", prov: "live", value: 2529454, cost: 2644865, qty: 3006959, px: 84.12, ccy: "USD", pxUsd: 0.8412, chg: 0.21,
      sector: "Info Tech", geo: "United States", liq: "Immediate", acquired: "2021-06-11", realizedYTD: 0, ytm: 5.02, dur: 11.4, rating: "AA+",
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B51" } },
    { id: "p24", name: "SK Telecom 4.45% 21-Mar-2031", ticker: "US78440PAC3", cls: "debt", sub: "ig", grp: "Corporate IG",
      line: "ttreas",
      sleeve: "core", prov: "live", value: 2500463, cost: 2476937, qty: 2560901, px: 97.64, ccy: "USD", pxUsd: 0.9764, chg: 0.09,
      sector: "Comm Services", geo: "Korea", liq: "Immediate", acquired: "2024-04-02", realizedYTD: 0, ytm: 4.92, dur: 3.9, rating: "A-",
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B52" } },
    { id: "p25", name: "Hanwha TotalEnergies Petrochemical 4.10% 2028", ticker: "KR6008921D28", cls: "debt", sub: "ig", grp: "Corporate IG",
      line: "ttreas",
      sleeve: "core", prov: "live", value: 2172555, cost: 2151576, qty: 2188310, px: 99.28, ccy: "KRW", pxUsd: 0.9928, chg: 0.02,
      sector: "Materials", geo: "Korea", liq: "Immediate", acquired: "2025-03-18", realizedYTD: 0, ytm: 4.28, dur: 1.9, rating: "A",
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B53" } },

    /* ---- DEBT · Private (4) --------------------------------------------- */
    { id: "p26", name: "Northgate Data Center Credit Facility (Senior Secured)", cls: "debt", sub: "pcred", grp: "Direct lending",
      line: "tpc",
      sleeve: "core", prov: "hanwha", value: 2513589, cost: 2413964, ccy: "USD", liq: "Immediate", term: "5yr · matures 2029",
      sector: "Infrastructure", geo: "United States", asOf: "2026-08-31", acquired: "2024-06-28", onBarbell: true, vintage: "2024",
      ytm: 9.10, rating: "Unrated (senior secured)",
      src: { file: "PE_Capital_Calls_v7_FINAL.xlsx", cell: "Fund List!A12" } },
    { id: "p27", name: "Meridian Direct Lending Fund II", cls: "debt", sub: "pcred", grp: "Direct lending",
      line: "tpc",
      sleeve: "core", prov: "hanwha", value: 1385405, cost: 1311937, ccy: "USD", liq: "Immediate", term: "Evergreen",
      sector: "Diversified", geo: "United States", asOf: "2026-06-30", acquired: "2023-11-30", onBarbell: true, vintage: "2023",
      ytm: 8.40,
      src: { file: "PE_Capital_Calls_v7_FINAL.xlsx", cell: "Fund List!A13" } },
    { id: "p28", name: "Seongsu redevelopment bridge loan", legacy: "성수동 개인대여금 (김부장 건)", cls: "debt", sub: "pcred", grp: "Direct lending",
      line: "tpc",
      sleeve: "core", prov: "self", value: 818649, cost: 818649, ccy: "KRW", liq: "Immediate", term: "Matures 2027-03",
      sector: "Real Estate", geo: "Korea", asOf: "2026-02-10", acquired: "2024-03-05", onBarbell: false,
      ytm: 7.50,
      src: { file: "부동산_임대현황.xlsx", cell: "Sheet1!F19" },
      note: "Legacy spreadsheet entry. Interest received in cash; principal unverified since February." },
    { id: "p29", name: "Hanwha Securities ELS 2024-11 (KOSPI200 / S&P 500 autocall)", cls: "debt", sub: "struct", grp: "Structured",
      line: "mmv",
      sleeve: "core", prov: "hanwha", value: 2623874, cost: 2518919, ccy: "KRW", liq: "Immediate", term: "3yr · autocall observed quarterly",
      sector: "Structured", geo: "Korea", asOf: "2026-09-15", acquired: "2024-11-12", onBarbell: true, vintage: "2024",
      ytm: 6.80,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B61" } },

    /* ---- REAL ASSETS (6) ------------------------------------------------- */
    { id: "p30", name: "Teheran-ro office — floors 3–4, Gangnam", legacy: "강남 테헤란로 빌딩 3,4층 (본사옆)", cls: "real", sub: "re", grp: "Direct",
      line: "realassets",
      sleeve: "core", prov: "self", value: 4303155, cost: 2991216, ccy: "KRW", liq: "Immediate", term: "Direct title",
      sector: "Office", geo: "Korea", asOf: "2026-08-31", acquired: "2011-04-01", onBarbell: false,
      yieldPct: 4.2,
      src: { file: "부동산_임대현황.xlsx", cell: "Sheet1!B4" },
      note: "Appraisal-based. Last third-party valuation August 2026." },
    { id: "p31", name: "Yongsan residential — leased unit", legacy: "용산 아파트 (임대중) — 2호", cls: "real", sub: "re", grp: "Direct",
      line: "realassets",
      sleeve: "core", prov: "self", value: 1941666, cost: 1385405, ccy: "KRW", liq: "Immediate", term: "Direct title",
      sector: "Residential", geo: "Korea", asOf: "2026-05-20", acquired: "2014-10-20", onBarbell: false,
      yieldPct: 2.6,
      src: { file: "부동산_임대현황.xlsx", cell: "Sheet1!B12" } },
    { id: "p32", name: "Hanwha Korea Logistics REIT Co-Invest", cls: "real", sub: "re", grp: "Funds",
      line: "realassets",
      sleeve: "core", prov: "hanwha", value: 1700270, cost: 1574324, ccy: "KRW", liq: "Immediate", term: "2030 exit",
      sector: "Logistics", geo: "Korea", asOf: "2026-06-30", acquired: "2026-01-10", onBarbell: true, vintage: "2026",
      yieldPct: 6.1,
      src: { file: "PE_Capital_Calls_v7_FINAL.xlsx", cell: "Fund List!A16" } },
    { id: "p33", name: "Pacific Core Real Estate Fund IV", cls: "real", sub: "re", grp: "Funds",
      line: "realassets",
      sleeve: "core", prov: "hanwha", value: 1868199, cost: 1784234, ccy: "USD", liq: "Immediate", term: "Open-end",
      sector: "Diversified RE", geo: "Asia-Pacific", asOf: "2026-06-30", acquired: "2022-11-04", onBarbell: true, vintage: "2022",
      unfunded: 734684, yieldPct: 4.8,
      src: { file: "PE_Capital_Calls_v7_FINAL.xlsx", cell: "Fund List!A17" } },
    { id: "p34", name: "Songdo Hyperscale Data Center Platform", cls: "real", sub: "infra", grp: "Infrastructure",
      line: "realassets",
      sleeve: "core", prov: "hanwha", value: 2455946, cost: 2204054, ccy: "USD", liq: "Immediate", term: "2034 concession",
      sector: "Data Centers", geo: "Korea", asOf: "2026-06-30", acquired: "2025-02-27", onBarbell: true, vintage: "2025",
      yieldPct: 7.4,
      src: { file: "PE_Capital_Calls_v7_FINAL.xlsx", cell: "Fund List!A18" } },
    { id: "p35", name: "Gold bullion — KRX custody account", cls: "real", sub: "comm", grp: "Commodities",
      line: "store",
      /* bullion falls inside conviction's subcategory list, so it says plainly
         where it belongs: a store of value held for a return, not a view */
      bucket: "engine",
      sleeve: "core", prov: "live", value: 3785174, cost: 2630829, qty: 912, px: 5735000, ccy: "KRW", pxUsd: 4147.06, chg: 0.37,
      sector: "Precious Metals", geo: "Korea", liq: "Immediate", acquired: "2020-08-19", realizedYTD: 0,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B72" } },

    /* ---- CASH (7) -------------------------------------------------------- */
    { id: "p36", name: "Samsung KRW Money Market Fund", cls: "cash", sub: "mmf", grp: "MMF",
      line: "ttreas",
      sleeve: "core", prov: "live", value: 1060045, cost: 1060045, ccy: "KRW", liq: "Immediate", sector: "Cash", geo: "Korea",
      acquired: "2026-01-05", ytm: 3.05, src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B80" } },
    { id: "p37", name: "Mirae Asset USD Money Market Fund", cls: "cash", sub: "mmf", grp: "MMF",
      line: "ttreas",
      sleeve: "alpha", prov: "live", value: 797657, cost: 797657, ccy: "USD", liq: "Immediate", sector: "Cash", geo: "United States",
      acquired: "2026-02-12", ytm: 4.18, dryPowder: true,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B81" },
      note: "Alpha sleeve dry powder." },
    { id: "p38", name: "US Treasury Bill — 4 week", ticker: "US912797MK2", cls: "cash", sub: "tbill", grp: "T-Bills",
      line: "ttreas",
      sleeve: "core", prov: "live", value: 1029878, cost: 1027509, qty: 1033806, px: 99.62, ccy: "USD", pxUsd: 0.9962, chg: 0.01,
      sector: "Government", geo: "United States", liq: "Immediate", acquired: "2026-09-04", ytm: 4.22,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B82" } },
    { id: "p39", name: "KEB Hana Bank — KRW time deposit", cls: "cash", sub: "dep", grp: "Deposits",
      line: "ttreas",
      sleeve: "core", prov: "live", value: 901293, cost: 901293, ccy: "KRW", liq: "Immediate", sector: "Cash", geo: "Korea",
      acquired: "2026-04-30", ytm: 3.40, src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B83" } },
    { id: "p40", name: "Citibank N.A. — USD demand deposit", cls: "cash", sub: "dep", grp: "Deposits",
      line: "ttreas",
      sleeve: "core", prov: "live", value: 545766, cost: 545766, ccy: "USD", liq: "Immediate", sector: "Cash", geo: "United States",
      acquired: "2025-12-01", ytm: 0.85, src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B84" } },
    { id: "p41", name: "FX balance — JPY", cls: "cash", sub: "fx", grp: "FX",
      line: "ttreas",
      sleeve: "core", prov: "live", value: 165829, cost: 173175, ccy: "JPY", liq: "Immediate", sector: "Cash", geo: "Japan",
      acquired: "2025-06-18", fxFlag: true, src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet2!D19" } },
    { id: "p42", name: "FX balance — EUR", cls: "cash", sub: "fx", grp: "FX",
      line: "ttreas",
      sleeve: "core", prov: "live", value: 96559, cost: 94459, ccy: "EUR", liq: "Immediate", sector: "Cash", geo: "Europe",
      acquired: "2025-06-18", fxFlag: true, src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet2!D20" } },

    /* ---- ANCHOR YIELD PRODUCTS (5) --------------------------------------
       Bucket 1 candidates from the asset wishlist, held rather than offered,
       so the book occupies the upper half of the shelf instead of leaving it
       empty. Rungs 8 through 12. Every figure is invented. */
    { id: "p43", name: "Korean Corporate Compute Offtake Note 2026-A", cls: "debt", sub: "struct", grp: "Structured",
      line: "gpun",
      prov: "hanwha", value: 1490360, cost: 1469370, ccy: "KRW", liq: "Immediate", term: "4yr",
      sector: "Structured", geo: "Korea", asOf: "2026-06-30", acquired: "2026-02-18", onBarbell: true, vintage: "2026",
      yieldPct: 8.4, src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B91" },
      note: "Lends against aggregated compute-usage contracts from Korean corporates. Hanwha underwrites offtaker credit that outside lenders cannot assess." },
    { id: "p44", name: "Qcells Residential Storage Programme — Texas", cls: "debt", sub: "struct", grp: "Structured",
      line: "ttf",
      prov: "hanwha", value: 1238469, cost: 1206982, ccy: "USD", liq: "Immediate", term: "7yr amortising",
      sector: "Energy", geo: "United States", asOf: "2026-06-30", acquired: "2026-01-29", onBarbell: true, vintage: "2026",
      yieldPct: 9.2, src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B92" },
      note: "Receivables from residential solar-and-battery installations. Panels at cost from the group; batteries recoverable on default." },
    { id: "p45", name: "Hanwha Compute Offtake Facility I", cls: "debt", sub: "pcred", grp: "Private Credit / Direct Lending",
      line: "gpun",
      prov: "hanwha", value: 1847207, cost: 1784234, ccy: "USD", liq: "Immediate", term: "5yr · 2031 maturity",
      sector: "Infrastructure", geo: "United States", asOf: "2026-06-30", acquired: "2025-11-12", onBarbell: true, vintage: "2025",
      yieldPct: 9.6, src: { file: "PE_Capital_Calls_v7_FINAL.xlsx", cell: "Fund List!A21" },
      note: "GPU financing secured on a Hanwha offtake. The lender underwrites Hanwha's credit, not the hardware." },
    { id: "p46", name: "Hanwha Offtake-Backed Copper Facility", cls: "debt", sub: "pcred", grp: "Private Credit / Direct Lending",
      line: "ttf",
      prov: "hanwha", value: 1301441, cost: 1259459, ccy: "USD", liq: "Immediate", term: "3yr",
      sector: "Materials", geo: "ROW", asOf: "2026-06-30", acquired: "2026-04-07", onBarbell: true, vintage: "2026",
      yieldPct: 10.9, src: { file: "PE_Capital_Calls_v7_FINAL.xlsx", cell: "Fund List!A22" },
      note: "Pre-export financing against a Hanwha purchase commitment. The commitment replaces the operator's credibility and concentrates the risk on Hanwha." },
    { id: "p47", name: "Kazakh Uranium Offtake Facility — Series 2", cls: "debt", sub: "pcred", grp: "Private Credit / Direct Lending",
      line: "ttf",
      prov: "hanwha", value: 1584820, cost: 1521847, ccy: "USD", liq: "Immediate", term: "4yr",
      sector: "Energy", geo: "ROW", asOf: "2026-06-30", acquired: "2025-09-23", onBarbell: true, vintage: "2025",
      yieldPct: 11.8, src: { file: "PE_Capital_Calls_v7_FINAL.xlsx", cell: "Fund List!A23" },
      note: "The reference case for the trust argument: an asset discounted because investors cannot verify the operator, priced on Hanwha's commitment instead." },
    { id: "p48", name: "Hanwha Korean Talent Fund I — first close", cls: "equity", sub: "preipo", grp: "Participations",
      line: "talent",
      bucket: "conviction", theme: "koreatalent",
      prov: "hanwha", value: 1199379, cost: 1119420, ccy: "USD", liq: "Immediate", term: "10yr",
      sector: "Media", geo: "Korea", asOf: "2026-06-30", acquired: "2026-06-30", onBarbell: true, vintage: "2026",
      src: { file: "PE_Capital_Calls_v7_FINAL.xlsx", cell: "Fund List!A24" },
      note: "Participations in the future earnings of Korean professionals, athletes and creators. The remaining capacity in the same fund is on the board." },
    /* ---- FRONTIER GROWTH (3) ---------------------------------------------
       The model asks for tail contracts, leveraged equity and novelty real-
       world assets, and the book held none of them. `line` governs where a
       holding sits in the model; `sub` still governs tax, exit and credit,
       so each one borrows the closest existing subcategory. */
    { id: "p49", name: "Kalshi macro and tariff contracts", cls: "equity", sub: "preipo", grp: "Event contracts",
      line: "tail",
      bucket: "conviction", theme: "privco",
      prov: "hanwha", value: 1887023, cost: 1439255, ccy: "USD", liq: "Immediate", term: "Rolling, to settlement",
      sector: "Financials", geo: "United States", asOf: "2026-06-30", acquired: "2026-05-11", onBarbell: true, vintage: "2026",
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B95" },
      note: "A ladder of macro, tariff and energy event contracts. Most expire worthless; the position is sized on that assumption." },
    { id: "p50", name: "Leveraged index and single-stock ETFs", cls: "equity", sub: "pubeq", grp: "Leveraged",
      line: "levered",
      bucket: "conviction", theme: "pubtech",
      prov: "live", value: 2094915, cost: 1679130, ccy: "USD", liq: "Immediate",
      sector: "Info Tech", geo: "United States", acquired: "2026-03-02", realizedYTD: 0,
      src: { file: "Holdings_Master_2026Q3.xlsx", cell: "Sheet1!B96" },
      note: "Amplified equity exposure, held small. Decay makes this a position to hold deliberately or not at all." },
    { id: "p51", name: "Tokenised trophy assets — art and franchise stakes", cls: "equity", sub: "preipo", grp: "Novelty RWA",
      line: "rwa",
      bucket: "conviction", theme: "teams",
      prov: "hanwha", value: 3134376, cost: 2878509, ccy: "USD", liq: "Immediate", term: "Exit-driven",
      sector: "Media", geo: "ROW", asOf: "2026-06-30", acquired: "2026-01-20", onBarbell: true, vintage: "2026",
      src: { file: "PE_Capital_Calls_v7_FINAL.xlsx", cell: "Fund List!A25" },
      note: "Fractional interests in blue-chip art and minority franchise stakes, held through Hanwha vehicles." },
    /* ---- RESIDENCE (1) ----------------------------------------------------
       The model asks for a primary residence and the uploaded book had none:
       the family's property lines were all income-producing. */
    { id: "p52", name: "Hannam-dong residence", cls: "real", sub: "re", grp: "Direct",
      line: "residence",
      legacy: "한남동 자택",
      prov: "self", value: 5300000, cost: 3100000, ccy: "KRW", liq: "Immediate", term: "Held indefinitely",
      sector: "Residential", geo: "Korea", asOf: "2026-03-31", acquired: "2014-09-18",
      src: { file: "부동산_임대현황.xlsx", cell: "Sheet1!B4" },
      note: "The family home. A fixed need rather than an allocation choice, and the only line the model shrinks as wealth grows." },
  ];


  /* ------------------------------------------------------------- onboarding */
  const uploadFiles = [
    { id: "f1", name: "Holdings_Master_2026Q3.xlsx", size: "412 KB", sheets: 4, rows: 63, note: "Custodian export, hand-edited" },
    { id: "f2", name: "PE_Capital_Calls_v7_FINAL.xlsx", size: "188 KB", sheets: 3, rows: 41, note: "Maintained by the family CFO" },
    { id: "f3", name: "부동산_임대현황.xlsx", size: "96 KB", sheets: 2, rows: 22, note: "Rental schedule, KRW, no headers" },
  ];

  const ingestSteps = ["Reading files", "Extracting positions", "Matching to securities", "Reconciling"];

  /* 7 deliberate exceptions. Everything else lands high-confidence. */
  const exceptions = [
    { id: "e3", kind: "Duplicate across files", file: "PE_Capital_Calls_v7_FINAL.xlsx + 부동산_임대현황.xlsx", cell: "Fund List!A18 ↔ Sheet1!B22",
      raw: "Songdo Hyperscale DC Platform / 송도 데이터센터 지분", qty: "—", conf: 0.63,
      issue: "The same position appears in two files with values $3,921,671 and ₩5.43B ($3,925,900). Booking both would overstate assets by 3.9%.",
      type: "select", options: ["Merge — keep Hanwha-sourced NAV ($3,921,671)", "Merge — keep spreadsheet value (₩5.43B)", "Keep both (not recommended)"],
      answer: "Merge — keep Hanwha-sourced NAV ($3,921,671)" },
    { id: "e4", kind: "Ambiguous currency", file: "부동산_임대현황.xlsx", cell: "Sheet1!F19",
      raw: "성수동 개인대여금 (김부장 건)   1,080,000,000", qty: "—", conf: 0.38,
      issue: "No currency column on this sheet. 1,080,000,000 reads as KRW ($780,910) but the adjacent column is formatted as USD.",
      type: "select", options: ["KRW — ₩1.08B ≈ $780,000", "USD — $1,080,000,000", "USD — $1,080,000"],
      answer: "KRW — ₩1.08B ≈ $780,000" },
  ];


  /* ================================================= the anchor shelf
     The anchor is not an asset allocation. It is a shelf of funds, each named
     for the yield it targets — a 5% fund, a 6% fund, a 7% fund — and the
     family states a yield rather than a set of asset classes. What sits inside
     a fund is the manager's problem: whatever instruments clear that return
     at that risk. Fixed income at the bottom, absolute-return and yield
     strategies at the top.

     The family never picks one. A target yield between 4% and 12% is stated
     and the basket is built across these funds to reach it.

     Each description says what the fund lends against and where the risk
     sits — "limited Hanwha support", "rank behind senior lenders" — because a
     rung that only states a number is asking to be read as a promise.

     Yield targets are illustrative, net of vehicle fees and before personal
     tax. No real manager or strategy is named. */
  const anchorShelf = [
    { band: 4,  name: "Target Yield 4%",  liq: "Immediate", vol: 1.9,
      inside: "Government bills and bank deposits maturing within a year, held to maturity." },
    { band: 5,  name: "Target Yield 5%",  liq: "Immediate", vol: 2.6,
      inside: "Bonds maturing in 1–5 years from investment-grade companies, with little or no fund borrowing." },
    { band: 6,  name: "Target Yield 6%",  liq: "Immediate", vol: 3.4,
      inside: "Longer-maturity investment-grade corporate bonds, and securities backed by mortgage or other loan payments." },
    { band: 7,  name: "Target Yield 7%",  liq: "Immediate", vol: 4.6,
      inside: "High-yield corporate bonds and pools of homeowner solar or battery loans, with repayments collected by a servicer." },
    { band: 8,  name: "Target Yield 8%",  liq: "Immediate", vol: 5.9,
      inside: "Senior GPU loans repaid over time, backed by identified hardware and enforceable Hanwha compute-purchase obligations." },
    { band: 9,  name: "Target Yield 9%",  liq: "Immediate", vol: 7.2,
      inside: "Direct loans to mid-sized companies, secured first against their assets, at rates that move with the base rate." },
    { band: 10, name: "Target Yield 10%", liq: "Immediate", vol: 8.6,
      inside: "Loans against pooled Korean corporate compute contracts, with mixed customer credit quality and limited Hanwha support." },
    { band: 11, name: "Target Yield 11%", liq: "Immediate", vol: 10.0,
      inside: "Commodity loans backed by Hanwha purchase commitments, where repayment also depends on production and cross-border delivery." },
    { band: 12, name: "Target Yield 12%", liq: "Immediate", vol: 11.6,
      inside: "GPU loans to Chinese companies, secured by hardware and borrower cash flows; also selected loans that rank behind senior lenders." },
  ];

  const SHELF_FLOOR = 4;   /* the lowest fund on the shelf */
  const SHELF_CEIL  = 12;

  /* ================================================= exit, not redemption
     Every asset on this platform converts to cash immediately. There
     are no quarterly windows, no gates and no notice periods, because every
     position is a token on a rail with a standing bid.

     What that removes is waiting. What it does not remove is price. A bid is
     not a mark, and the secondary board's own history clears between 80% and
     115% of the last NAV depending on the asset. So the product stops asking
     "when can this be sold?" and starts asking "what does it fetch today?" —
     which is the question that still has a real answer.

     And because everything trades, everything has a price. A private fund
     interest is no longer marked by its manager once a quarter — it is marked
     by the board, continuously, like a listed line. That is what makes it
     usable as collateral, which is the third consequence and the one that
     changes what a family can actually do.

     `exitPct` is now read as how tight a subcategory's market is: the share
     of the mark a seller clears against the spread. Listed instruments and
     cash are at par; it widens with how hard the thing is to price. */
  const exitPct = {
    pubeq: 100, sov: 100, ig: 100, mmf: 100, tbill: 100, dep: 100, fx: 100,
    comm: 99.5,
    struct: 98.0,
    pcred: 96.5,
    infra: 94.5,
    re: 93.0,
    preipo: 90.0,
    pe: 91.0,
    vc: 87.0,
  };

  /* The fund that always sits beneath the basket. A minimum dollar amount is
     held here whatever the target yield. Nothing is locked any more, so this
     is not about being able to raise cash — it is about not having to pay
     the spread to raise it. It is part of the anchor, and it drags —
     which the screen shows rather than hides. */
  const cashFund = { name: "Cash reserve", yield: 3.8, liq: "Immediate", vol: 0.4,
    inside: "Money market funds, T-bills and bank deposits." };

  /* ============================================== borrowing against the book
     The third thing liquidity changes, after the redemption schedule and the
     mark.

     A lender advances against what it can price and sell. Before the rail a
     private fund interest was neither — no market price, no way out — so the
     advance rate against it was zero or close to it, and a family office
     borrowed against its listed lines and nothing else. Give the same
     interest a clearing price and same-day settlement and it becomes
     collateral like any other, at an advance rate set by how tight its market
     is rather than by what kind of thing it is.

     `advanceRates` is [what a lender will advance now, what it would have
     advanced before the rail]. The gap is the point. Rates are illustrative. */
  const advanceRates = {
    mmf: [95, 95], tbill: [95, 95], dep: [95, 95], sov: [95, 90], fx: [90, 90],
    ig: [85, 75],
    comm: [75, 60],
    pubeq: [70, 50],
    struct: [75, 25],
    pcred: [70, 15],
    infra: [65, 10],
    re: [60, 20],
    pe: [50, 0],
    preipo: [50, 0],
    vc: [45, 0],
  };

  /* What a facility against the book costs. Illustrative. */
  const creditTerms = { base: 4.55, baseName: "SOFR", spread: 2.10, ltvCall: 85 };

  /* ================================================= conviction exposures
     Bucket 2 is a menu of things to have a view about, not an asset class.

     Each entry carries what it actually is — `claim` — because "private
     equity", "an income-share claim" and "asset ownership through an SPV"
     are three different things to own and the label alone hides that.
     `candidates` names what a position would be taken through.

     Three entries are flagged. None of them is a security yet, and how they
     would list on the group's BD/ATS is unresolved. */
  const themes = [
    { key: "compute", label: "Compute & AI infrastructure", color: "#1B2A4A",
      sub: "Platforms, power & data centers", claim: "Equity ownership", candidates: "SMH",
      note: "The physical layer under AI — silicon, the data centres around it, and the power underneath." },
    { key: "pubtech", label: "Established public technology", color: "#3F7183",
      sub: "Listed technology leaders", claim: "Listed shares", candidates: "QQQM",
      note: "Listed technology held by name, because of the company — not as a slice of an index." },
    { key: "privco", label: "Leading private companies", color: "#5A74A0",
      sub: "Growth & secondaries", claim: "Private equity", candidates: "SPRING",
      note: "Late-stage private companies before they list, taken through growth rounds and secondaries." },
    { key: "venture", label: "Venture & frontier technology", color: "#85AEBC",
      sub: "Emerging software, space & robotics", claim: "Private equity", candidates: "ARKVX",
      note: "Top-tier funds through Hanwha's LP positions, and emerging managers the group's diligence can vouch for before anyone else can." },
    { key: "gpu", label: "GPU cluster ownership", color: "#2F6E7A",
      sub: "Hardware & operator partnerships", claim: "Asset / SPV ownership",
      candidates: "Operator-managed B300 cluster-owning SPV · IREN",
      note: "Owning the hardware rather than lending against it. Inference margins are high and the group's own demand underwrites utilisation." },
    { key: "hedge", label: "Leading hedge funds", color: "#6B7F8C",
      sub: "Absolute return & market neutral", claim: "Fund interests",
      note: "Managers whose return is skill rather than market direction, at ticket sizes a family office cannot normally reach." },
    { key: "energy", label: "Power generation & storage", color: "#4E7A5E",
      sub: "Behind-the-meter power projects", claim: "Project equity",
      candidates: "Behind-the-meter generation and storage SPV",
      note: "Generation built next to the load it serves, which is what gets a data centre past an interconnection queue." },
    { key: "health", label: "Korean health & drug development", color: "#7A5E8C",
      sub: "Clinical programmes & screening", claim: "Private equity",
      note: "Korean drug pipelines, metabolic and peptide therapies, and screening. Binary outcomes that foreign investors cannot assess alone." },
    { key: "realestate", label: "Prime & tokenised real estate", color: "#8C6E4E",
      sub: "Supply-constrained residential", claim: "Fractional ownership",
      note: "Prime residential in markets where supply is fixed, at ticket sizes that fractional ownership opens up." },
    { key: "koreatalent", label: "Korean talent", color: "#7D6B9E",
      sub: "Global placement & income shares", claim: "Income-share claim",
      candidates: "Hanwha Korean talent ISA pilot",
      note: "Korean professionals, athletes and creators are priced on the home market and reprice when they reach a larger one." },
    { key: "artists", label: "Korean IP & creators", color: "#9A7B2E", flagged: true,
      sub: "Royalties & creator catalogues", claim: "Royalty claims",
      note: "Royalty streams from Korean music, film and television, which reprice when a global audience finds them." },
    { key: "teams", label: "Sports teams & esports", color: "#A98C3E", flagged: true,
      sub: "Franchises & esports organisations", claim: "Minority equity",
      note: "Minority stakes where the value turns on broadcast rights the group already holds in Korea." },
    { key: "players", label: "Sports players", color: "#C0A765", flagged: true,
      sub: "Athlete earnings participations", claim: "Income-share claim",
      note: "Participations in the future earnings of individual athletes." },
  ];

  /* ===================================================== the model portfolio
     Every family holds a barbell: a Core of 80–90% that protects principal,
     compounds and funds spending, and a Frontier of 10–20% in asymmetric
     bets. Core is three groups — the residence, the yield engines and
     traditional markets — and Frontier is one.

     Targets are given at three family sizes and interpolated between them.
     Reading across a row shows what changes with scale: the residence falls
     from a quarter of net worth to a rounding error, shallow pools like
     market-making vaults shrink as capacity binds, and thin-market lines like
     pre-IPO grow as the need for liquidity eases. */
  const sleeves = [
    { key: "core", label: "Core", color: "#1B2A4A",
      role: "Protects principal, compounds, funds spending",
      band: "80–90% of net worth",
      note: "The residence, the capital that pays for the family's life, and traditional markets." },
    { key: "frontier", label: "Frontier Growth", color: "#9A7B2E",
      role: "Asymmetric bets",
      band: "10–20% of net worth",
      note: "Sized so that losing all of any one line changes nothing. Judged on the thesis, not against a benchmark." },
  ];

  const allocGroups = [
    { key: "residence", sleeve: "core", label: "Residence", color: "#DDD6C7",
      note: "The family's own home. A fixed need rather than an allocation choice, and the line that shrinks fastest with scale." },
    { key: "yield", sleeve: "core", label: "Yield Engines", color: "#22304F",
      note: "The capital that pays for the family's life. Income-producing, and the largest single group at every size." },
    { key: "traditional", sleeve: "core", label: "Traditional", color: "#4C7489",
      note: "Public markets, multi-strategy funds and stores of value." },
    { key: "frontier", sleeve: "frontier", label: "Frontier Growth", color: "#C6A64E",
      note: "Tail contracts, pre-IPO outliers and novelty real-world assets." },
  ];

  /* tiers are percentages of net worth at $10M, $100M and $1B */
  const allocLines = [
    { key: "residence", group: "residence", label: "Primary residence",
      access: "Held directly", examples: "The family's home", payoff: "—",
      tiers: { 10: 25, 100: 5, 1000: 1 } },

    { key: "ttreas", group: "yield", label: "Tokenized Treasuries",
      access: "Available today", examples: "BlackRock BUIDL", payoff: "~4%",
      tiers: { 10: 17, 100: 9, 1000: 6 } },
    { key: "tpc", group: "yield", label: "Tokenized private credit",
      access: "Target partner", examples: "Apollo, Blackstone", payoff: "9–10%",
      tiers: { 10: 12, 100: 14, 1000: 17 } },
    { key: "mmv", group: "yield", label: "Market-making vaults",
      access: "Available today", examples: "Lighter LLP, Hyperliquid HLP", payoff: "12–16%",
      tiers: { 10: 6, 100: 5, 1000: 2 } },
    { key: "gpun", group: "yield", label: "GPU-backed notes",
      access: "Hanwha direct", examples: "Risk reduced via offtake", payoff: "11–13%",
      tiers: { 10: 2, 100: 4, 1000: 5 } },
    { key: "ttf", group: "yield", label: "Tokenized trade finance",
      access: "Hanwha direct", examples: "Affiliate receivables", payoff: "6–8%",
      tiers: { 10: 3, 100: 5, 1000: 6 } },
    { key: "hgrowth", group: "yield", label: "Hanwha Growth",
      access: "Hanwha direct", examples: "Shipbuilding, energy", payoff: "12–15%",
      tiers: { 10: 5, 100: 7, 1000: 7 } },
    /* Not on the model. Direct property and infrastructure are held outside
       it, and the zero target is the model's own view: it would rather own
       that risk through the tokenized credit lines than through buildings. */
    { key: "realassets", group: "yield", label: "Direct property and infrastructure",
      access: "Held directly", examples: "Offices, REITs, data centres", payoff: "6–9%",
      offModel: true, tiers: { 10: 0, 100: 0, 1000: 0 } },

    { key: "pubeq", group: "traditional", label: "Public equities",
      access: "Available today", examples: "QQQ, intl. tech, ex-tech", payoff: "1–2%",
      tiers: { 10: 12, 100: 17, 1000: 14 } },
    { key: "multistrat", group: "traditional", label: "Multi-strategy funds",
      access: "Target partner", examples: "Citadel, Millennium", payoff: "—",
      tiers: { 10: 2, 100: 6, 1000: 8 } },
    { key: "fof", group: "traditional", label: "Tokenized VC & PE FoF",
      access: "Target partner", examples: "Top-tier managers", payoff: "—",
      tiers: { 10: 4, 100: 10, 1000: 10 } },
    { key: "store", group: "traditional", label: "Gold and bitcoin",
      access: "Available today", examples: "Gold, bitcoin", payoff: "—",
      tiers: { 10: 2, 100: 3, 1000: 4 } },

    { key: "tail", group: "frontier", label: "Tail event contracts",
      access: "Hanwha direct", examples: "Macro, tariff and energy contracts on Kalshi", payoff: "10–50x",
      tiers: { 10: 2, 100: 2, 1000: 1 } },
    { key: "preipo", group: "frontier", label: "Pre-IPO outliers",
      access: "Hanwha direct", examples: "OpenAI, Anthropic, Anduril, Saronic", payoff: "Asymmetric",
      tiers: { 10: 3, 100: 6, 1000: 9 } },
    { key: "levered", group: "frontier", label: "Leveraged equities",
      access: "Available today", examples: "10x index and single-stock exposure", payoff: "Amplified equity",
      tiers: { 10: 2, 100: 2, 1000: 3 } },
    { key: "rwa", group: "frontier", label: "Novelty RWA tokens",
      access: "Hanwha direct", examples: "Sports teams, blue-chip art, trophy real estate", payoff: "Asymmetric",
      tiers: { 10: 1, 100: 3, 1000: 6 } },
    { key: "talent", group: "frontier", label: "Korean talent",
      access: "Hanwha direct", examples: "Income-share agreements with Korean talent", payoff: "Mispriced upside",
      tiers: { 10: 2, 100: 2, 1000: 1 } },
  ];

  /* ===================================================== risk / return buckets
     The product is organised by risk and return, not by asset class. Two
     buckets, confirmed.

     What a position is no longer decides which bucket it sits in. A listed
     technology company held by name is a view; the same exposure bought as an
     index slice is not. So bucket membership is carried on the position
     itself, and `subs` below is only the fallback used for marketplace
     offerings, which are not yet owned by anybody.

     Engine is a shelf of funds indexed by target return (see anchorShelf).
     Conviction is a set of themes the family picks (see themes). Neither is
     an asset-class taxonomy, and neither is shown as one. */
  const buckets = [
    { key: "engine", label: "Anchor", color: "#1B2A4A",
      role: "Return you specify",
      band: "5–15% shelf",
      note: "One rung of the shelf. The fund decides what to hold; the family decides what to ask of it.",
      subs: ["pubeq", "pcred", "struct", "re", "infra", "sov", "ig", "mmf", "tbill", "dep", "fx"] },
    { key: "conviction", label: "Conviction", color: "#9A7B2E",
      role: "Upside you choose",
      band: "Themes you pick",
      note: "Concentrated positions in things the family has a view about. Judged on the thesis, not against a benchmark.",
      subs: ["pe", "vc", "preipo", "comm"] },
  ];

  /* One control: the rung the family asks the anchor to target. Raising it
     raises the return asked for and, inversely, shrinks the anchor. The
     family's own 95/5, 90/10 and 80/20 fall out of it at rungs 5, 7 and 11. */
  const RISK_BASE = { band: 8, conviction: 10 };
  const bucketPresets = { preservation: 5, balanced: 10, growth: 20 };

  /* What each bucket is made of, in the six classes. The model portfolio is
     these two compositions blended at whatever the slider says — which is how
     one control replaces a nine-cell matrix. Engine draws only on classes its
     own subcategories can reach; Conviction only on private equity and the
     commodity line. Each row sums to 100. */
  const bucketMix = {
    engine:     { pubeq: 34, priveq: 0,  pubdebt: 30, privdebt: 12, real: 12, cash: 12 },
    conviction: { pubeq: 0,  priveq: 75, pubdebt: 0,  privdebt: 0,  real: 25, cash: 0  },
  };
  /* ------------------------------------------------- six-class model framework */
  /* The model is stated in six classes, equity and debt each split public /
     private, so the implementation question ("through what vehicle?") sits
     beside the risk question ("how much?"). Every subcategory rolls up to
     exactly one of these, so nothing is counted twice. `min` is the smallest
     cheque the class can be entered with on this platform. */
  const modelClasses = [
    { key: "pubeq",    label: "Public equity",    color: "#1B2A4A", subs: ["pubeq"],                     min: 0,
      note: "Listed shares and equity ETFs" },
    { key: "priveq",   label: "Private equity",   color: "#5A74A0", subs: ["pe", "vc", "preipo"],        min: 250000,
      note: "Buyout, venture and pre-IPO" },
    { key: "pubdebt",  label: "Public debt",      color: "#3F7183", subs: ["sov", "ig", "struct"],       min: 0,
      note: "Sovereign, investment grade, structured" },
    { key: "privdebt", label: "Private debt",     color: "#85AEBC", subs: ["pcred"],                     min: 500000,
      note: "Direct lending, senior secured" },
    { key: "real",     label: "Real assets",      color: "#9A7B2E", subs: ["re", "infra", "comm"],       min: 500000,
      /* The same $500,000 fund minimum under every objective. A 5% slot only
         clears it at $10M, so real assets enter at that tier and not before —
         a preservation book is no more able to diversify one building than a
         growth book is. */
      note: "Property, infrastructure, commodities" },
    { key: "cash",     label: "Cash equivalents", color: "#A9A396", subs: ["mmf", "tbill", "dep", "fx"], min: 0,
      note: "MMF, T-bills, deposits, FX" },
  ];

  /* Why a class is not recommended, by whichever rule excluded it. */
  const modelExcuses = {
    real: {
      size: "Property and infrastructure enter through funds that start at $500,000. Below that cheque the allocation buys one building at one address — a concentration, not a diversifier. The weight does more work in public equity until the book can carry a diversified real-asset position.",
      split: "Real assets enter through Conviction. At this split the slice is too small to clear a fund minimum.",
    },
    priveq: {
      size: "A ten-year lock-up behind a $250,000 minimum. At this size that cheque is a concentrated bet on one fund in one vintage — the opposite of what the bucket is for. Listed equity carries the same market exposure, daily.",
      split: "Conviction is set to zero. Private equity is the bucket's main instrument, so nothing is allocated to it.",
    },
    privdebt: {
      size: "Direct lending funds start at $500,000. Below that cheque a public credit ETF buys the same spread without the exit discount a private book carries.",
      split: "Not reachable at this split.",
    },
  };


  /* ----------------------------------------------- secondary trade history */
  /* Prior transfers of the same interest on the platform. A thin board, so not
     every listing has a history — and where there is one, the direction of the
     clearing price matches what the capital account says about the asset. */
  const secondaryTrades = [
    /* Foundry VC — marked down through 2025, and the price follows */
    { id: "t01", listing: "s01", ts: "2025-09-12", size: 300000, pricePct: 98.0, navDate: "2025-06-30", method: "Ask taken",    buyer: "Member #0088", seller: "Member #0209" },
    { id: "t02", listing: "s01", ts: "2026-03-18", size: 450000, pricePct: 94.5, navDate: "2025-12-31", method: "Bid accepted", buyer: "Member #0315", seller: "Member #0088" },

    /* Northgate credit — contractual cash flows, so it trades near par */
    { id: "t03", listing: "s02", ts: "2025-11-05", size: 500000, pricePct: 99.0,  navDate: "2025-06-30", method: "Bid accepted", buyer: "Member #0147", seller: "Member #0401" },
    { id: "t04", listing: "s02", ts: "2026-05-22", size: 750000, pricePct: 99.8,  navDate: "2025-12-31", method: "Ask taken",    buyer: "Member #0032", seller: "Member #0147" },

    /* Aeris — Series F mark-up pulled it to a premium */
    { id: "t05", listing: "s03", ts: "2025-07-30", size: 350000, pricePct: 96.0,  navDate: "2025-06-30", method: "Bid accepted", buyer: "Member #0209", seller: "Member #0512" },
    { id: "t06", listing: "s03", ts: "2026-02-14", size: 600000, pricePct: 101.0, navDate: "2025-12-31", method: "Ask taken",    buyer: "Member #0088", seller: "Member #0209" },

    /* Daol — flat since inception, and bid down */
    { id: "t07", listing: "s09", ts: "2025-10-02", size: 250000, pricePct: 88.0,  navDate: "2025-06-30", method: "Ask taken",    buyer: "Member #0401", seller: "Member #0315" },
    { id: "t08", listing: "s09", ts: "2026-04-09", size: 180000, pricePct: 85.5,  navDate: "2025-12-31", method: "Bid accepted", buyer: "Member #0512", seller: "Member #0401" },

    /* Helios — the board's best performer, and the only one at a real premium */
    { id: "t09", listing: "s11", ts: "2026-01-16", size: 200000, pricePct: 109.0, navDate: "2025-06-30", method: "Bid accepted", buyer: "Member #0032", seller: "Member #0147" },
    { id: "t10", listing: "s11", ts: "2026-06-04", size: 300000, pricePct: 115.0, navDate: "2025-12-31", method: "Ask taken",    buyer: "Member #0209", seller: "Member #0032" },

    /* Seoul Station retail — three years of a falling clearing price */
    { id: "t11", listing: "s12", ts: "2024-11-21", size: 400000, pricePct: 91.0,  navDate: "2024-06-30", method: "Ask taken",    buyer: "Member #0315", seller: "Member #0088" },
    { id: "t12", listing: "s12", ts: "2025-08-13", size: 350000, pricePct: 84.0,  navDate: "2025-06-30", method: "Bid accepted", buyer: "Member #0401", seller: "Member #0315" },
    { id: "t13", listing: "s12", ts: "2026-05-30", size: 300000, pricePct: 80.5,  navDate: "2025-12-31", method: "Bid accepted", buyer: "Member #0512", seller: "Member #0401" },
  ];

  /* ----------------------------------------------------------------- mandate */
  const mandates = [
    { key: "preservation", label: "Protect capital", core: 95, alpha: 5,
      line: "Sovereign duration and cash carry the book. Alternatives only where they are contractual and secured.",
      targets: { equity: 25, debt: 50, real: 17, cash: 8 } },
    { key: "balanced", label: "Fund the family", core: 90, alpha: 10,
      line: "Income first — private credit, property and investment grade credit pay the distributions.",
      targets: { equity: 35, debt: 40, real: 18, cash: 7 }, current: true },
    { key: "growth", label: "Grow the estate", core: 80, alpha: 20,
      line: "Total return, equity-led, with private growth alongside rather than instead of it.",
      targets: { equity: 46, debt: 28, real: 20, cash: 6 } },
  ];

  const survey = [
    { id: "q1", sharpens: "Sets how hard locked offerings are marked down in the marketplace", q: "Liquidity needed from the portfolio over the next 24 months",
      type: "select", options: ["None — external income covers spending", "Under $2M", "$2M – $5M", "Over $5M"], a: "$2M – $5M" },
    { id: "q2", sharpens: "Checked against the call schedule already read from your files", q: "Known capital calls already committed",
      type: "select", options: ["None", "Under $2M", "$2M – $6M", "Over $6M"], a: "$2M – $6M" },
    { id: "q3", sharpens: "Sets the level the concentration flag fires at", q: "Concentration in the family operating company",
      type: "select", options: ["Under 5% of assets", "5 – 10%", "10 – 25%", "Over 25%"], a: "5 – 10%",
      note: "Currently 6.8% — Hanmi Chemical Holdings." },
    { id: "q4", sharpens: "Decides which currency the return is decomposed against", q: "FX base currency for reporting and risk",
      type: "select", options: ["KRW", "USD", "USD with KRW reporting"], a: "USD with KRW reporting" },
    { id: "q5", sharpens: "Frames the holding-period observations on the Tax tab", q: "Tax residency",
      type: "select", options: ["Korea", "United States", "Dual KR / US", "Other"], a: "Korea" },
    { id: "q6", sharpens: "Bounds how far the model may tilt from the posture above", q: "Drawdown tolerance — the loss that would force a change of plan",
      type: "select", options: ["$3M (−4.8%)", "$6M (−9.6%)", "$12M (−19.2%)", "$19M (−30.4%)"], a: "$6M (−9.6%)",
      note: "Stated in dollars, not percentages, because that is how the decision is actually made." },
    { id: "q7", sharpens: "Sets how far the model will reach down the shelf for return", q: "Generational transfer horizon",
      type: "select", options: ["Within 5 years", "5 – 10 years", "10 – 20 years", "No defined horizon"], a: "5 – 10 years" },
    { id: "q8", sharpens: "Removes those sectors from the marketplace entirely", q: "Prohibited sectors",
      type: "multi", options: ["Tobacco", "Gaming / casinos", "Defence", "Fossil fuel extraction", "Crypto-native"], a: ["Gaming / casinos", "Crypto-native"] },
  ];

  /* ------------------------------------------------------- model portfolios */
  const modelPortfolios = {
    "1m": { label: "$1M tier", subs: { pubeq: 38, pe: 0, vc: 2, preipo: 0, sov: 22, ig: 12, pcred: 3, struct: 0, re: 10, infra: 3, comm: 2, mmf: 4, tbill: 2, dep: 2, fx: 0 } },
    "10m": { label: "$10M tier", subs: { pubeq: 30, pe: 3, vc: 3, preipo: 1, sov: 18, ig: 10, pcred: 8, struct: 3, re: 10, infra: 5, comm: 2, mmf: 3, tbill: 2, dep: 2, fx: 0 } },
    "100m": { label: "$100M tier", subs: { pubeq: 22, pe: 6, vc: 5, preipo: 3, sov: 15, ig: 8, pcred: 12, struct: 4, re: 9, infra: 8, comm: 2, mmf: 2, tbill: 2, dep: 1, fx: 1 } },
  };

  /* The objective the family is optimising for. Each goal tilts the model by
     group — alternatives, liquid markets, cash — and equity against debt.
     Weights are renormalised to 100 after the tilt. */
  const ALT_SUBS = ["pe", "vc", "preipo", "pcred", "re", "infra"];
  /* One set of keys with `mandates` above: the posture stated in onboarding is
     the posture the model is drawn for.

     Each objective is a different SHAPE, not a different point on one risk
     ladder — tilts are per subcategory, so "fund the family" loads credit and
     property while "grow the estate" loads equity, and the two produce visibly
     different books rather than two doses of the same medicine.
     Anything unlisted stays at 1.0. */
  const modelGoals = [
    { key: "preservation", label: "Protect capital",
      tilt: { sov: 1.70, tbill: 1.60, dep: 1.50, mmf: 1.50, fx: 1.20, ig: 1.25, struct: 0.80,
              pcred: 0.65, re: 0.85, infra: 0.75, comm: 1.15, pubeq: 0.65, pe: 0.35, vc: 0.20, preipo: 0.15 } },
    { key: "balanced", label: "Fund the family", default: true,
      tilt: { pcred: 1.65, re: 1.45, infra: 1.40, ig: 1.35, struct: 1.20, sov: 0.90, tbill: 0.90, fx: 0.80,
              pubeq: 0.85, pe: 0.70, vc: 0.30, preipo: 0.25, comm: 0.60 } },
    { key: "growth", label: "Grow the estate",
      tilt: { pubeq: 1.50, pe: 1.35, vc: 1.35, preipo: 1.25, infra: 1.00, re: 0.80, sov: 0.55, ig: 0.70,
              pcred: 0.95, struct: 0.80, comm: 0.80, mmf: 0.70, tbill: 0.70, dep: 0.70, fx: 0.70 } },
  ];

  /* Long-run assumptions used only for the projection strip under the model.
     Nominal USD, before fees and tax. Stated on the chart, not hidden in code. */
  const expectedReturn = { equity: 7.5, debt: 5.0, real: 7.0, cash: 4.0 };
  const expectedVol = { equity: 18.0, debt: 5.0, real: 11.0, cash: 1.0 };
  /* Correlations between the four classes. Private holdings are marked
     quarterly, which understates their true correlation to listed markets;
     these are the economic figures, not the smoothed ones. */
  const classCorr = {
    equity: { equity: 1.0, debt: 0.10, real: 0.55, cash: 0.00 },
    debt:   { equity: 0.10, debt: 1.0, real: 0.25, cash: 0.10 },
    real:   { equity: 0.55, debt: 0.25, real: 1.0, cash: 0.00 },
    cash:   { equity: 0.00, debt: 0.10, real: 0.00, cash: 1.0 },
  };
  /* A class average assumes the class is held as an index. It is not: the book
     holds nine single names, one of them the family's own operating company.
     Specific risk on an individual equity, over and above its market. */
  const idiosyncraticVol = 45.0;

  /* --------------------------------------------------- calls & distributions */
  const capitalCalls = [
    { id: "cc1", fund: "Foundry Venture Partners VII, L.P.", pid: "p15", date: "2026-10-28", amount: 1100000, status: "Due" },
    { id: "cc2", fund: "Pacific Core Real Estate Fund IV", pid: "p33", date: "2026-11-12", amount: 700000, status: "Due" },
    { id: "cc3", fund: "Daol Ventures Korea Fund III", pid: "p16", date: "2027-01-20", amount: 320000, status: "Scheduled" },
    { id: "cc4", fund: "Foundry Venture Partners VII, L.P.", pid: "p15", date: "2027-02-15", amount: 1100000, status: "Scheduled" },
    { id: "cc5", fund: "Pacific Core Real Estate Fund IV", pid: "p33", date: "2027-02-28", amount: 700000, status: "Scheduled" },
    { id: "cc6", fund: "Songdo Hyperscale Data Center Platform", pid: "p34", date: "2027-03-05", amount: 2550000, status: "Scheduled" },
    { id: "cc7", fund: "Foundry Venture Partners VII, L.P.", pid: "p15", date: "2027-06-30", amount: 400000, status: "Projected" },
    { id: "cc8", fund: "Sunrise Growth Partners IV, L.P.", pid: "p14", date: "2027-09-15", amount: 450000, status: "Projected" },
    { id: "cc9", fund: "Daol Ventures Korea Fund III", pid: "p16", date: "2028-01-18", amount: 280000, status: "Projected" },
    { id: "cc10", fund: "Songdo Hyperscale Data Center Platform", pid: "p34", date: "2028-04-10", amount: 600000, status: "Projected" },
  ];

  const distributions = [
    { id: "d1", fund: "Woori Industrial Buyout Co-Invest II", date: "2026-12-15", amount: 480000, status: "Announced" },
    { id: "d2", fund: "Hanwha Securities ELS 2024-11", date: "2026-11-30", amount: 160000, status: "Coupon" },
    { id: "d3", fund: "Northgate Data Center Credit Facility", date: "2026-10-31", amount: 54000, status: "Coupon" },
    { id: "d4", fund: "Northgate Data Center Credit Facility", date: "2027-01-31", amount: 54000, status: "Coupon" },
    { id: "d5", fund: "Meridian Direct Lending Fund II", date: "2027-02-28", amount: 92000, status: "Projected" },
    { id: "d6", fund: "Woori Industrial Buyout Co-Invest II", date: "2027-06-30", amount: 640000, status: "Projected" },
    { id: "d7", fund: "Hanwha Korea Logistics REIT Co-Invest", date: "2027-04-30", amount: 120000, status: "Projected" },
    { id: "d8", fund: "Pacific Core Real Estate Fund IV", date: "2027-09-30", amount: 210000, status: "Projected" },
    { id: "d9", fund: "Aeris Aerospace — Series F block", date: "2028-03-31", amount: 900000, status: "Projected (listing)" },
    { id: "d10", fund: "Songdo Hyperscale Data Center Platform", date: "2028-06-30", amount: 340000, status: "Projected" },
  ];

  /* ------------------------------------------------------------ performance */
  const benchmark = { label: "60% MSCI ACWI / 40% Bloomberg Global Aggregate", hedgeable: true };

  const performance = {
    MTD: { port: 0.9, bench: 0.7, fx: -0.3, hedged: 1.2 },
    QTD: { port: 3.1, bench: 2.6, fx: -0.8, hedged: 3.9 },
    YTD: { port: 9.4, bench: 7.8, fx: 1.9, hedged: 7.5 },
    ITD: { port: 41.2, bench: 33.6, fx: 4.4, hedged: 36.8 },
  };

  const attribution = {
    MTD: [ { n: "NVIDIA Corporation", pp: 0.31 }, { n: "SK hynix Inc.", pp: 0.12 }, { n: "Hanmi Chemical Holdings", pp: 0.09 },
           { n: "US Treasury 4.25% 2034", pp: 0.04 }, { n: "Toyota Motor Corporation", pp: -0.06 }, { n: "Apple Inc.", pp: -0.04 } ],
    QTD: [ { n: "NVIDIA Corporation", pp: 1.02 }, { n: "Hanmi Chemical Holdings", pp: 0.58 }, { n: "SK hynix Inc.", pp: 0.41 },
           { n: "Songdo Hyperscale DC Platform", pp: 0.33 }, { n: "Apple Inc. 3.85% 2043", pp: -0.19 }, { n: "FX translation (KRW)", pp: -0.31 } ],
    YTD: [ { n: "NVIDIA Corporation", pp: 2.84 }, { n: "Hanmi Chemical Holdings", pp: 1.61 }, { n: "Aeris Aerospace block", pp: 0.72 },
           { n: "Songdo Hyperscale DC Platform", pp: 0.55 }, { n: "SK hynix Inc.", pp: 0.49 }, { n: "Apple Inc. 3.85% 2043", pp: -0.41 },
           { n: "Viva Republica (Toss) block", pp: -0.22 } ],
    ITD: [ { n: "Hanmi Chemical Holdings", pp: 9.40 }, { n: "NVIDIA Corporation", pp: 8.05 }, { n: "Teheran-ro office", pp: 4.10 },
           { n: "Microsoft Corporation", pp: 2.20 }, { n: "Apple Inc. 3.85% 2043", pp: -0.90 } ],
  };

  /* ---------------------------------------------------------- marketplace */
  /* One schema for everything. `kind` only changes the transaction mechanic. */
  /* ===================================================== where a listing comes from
     Listings are not only Hanwha's own direct deals. They also include
     funds Hanwha works with or creates through its LP position, and DeFi or
     co-created products. Hanwha's involvement is the trust signal, so
     the source is stated on the row, not buried in a tab.

     Names below the group's own are placeholders. No real third-party manager,
     protocol or counterparty is named. */
  const sourceTypes = [
    { key: "direct", label: "Hanwha direct", short: "Direct", color: "#1B2A4A",
      note: "Originated by Hanwha. The group holds the same instrument on the same terms as members." },
    { key: "fund", label: "Fund · Hanwha LP", short: "LP access", color: "#5A74A0",
      note: "A third-party fund Hanwha is an LP in. The member tranche is carved out of Hanwha's own commitment — which is the only reason the minimum is reachable at this size." },
    { key: "cocreated", label: "Co-created", short: "Co-created", color: "#9A7B2E",
      note: "Built by Hanwha with the manager for this platform. The structure does not exist elsewhere and the terms were set by Hanwha's own participation." },
    { key: "defi", label: "Digital", short: "Digital", color: "#3F7183",
      note: "On-chain yield, wrapped by Hanwha into a vehicle a Korean family office can hold, custody and report. Hanwha carries the protocol diligence and the operational risk." },
  ];

  /* What was actually checked, by source type, where a listing does not carry
     its own list. Stated as work done, not as a guarantee. */
  const dueDiligence = {
    direct: ["Credit and structure reviewed by the originating desk", "Hanwha balance sheet committed on identical terms", "Independent valuation on file"],
    fund: ["Manager reviewed under Hanwha's LP diligence", "Track record verified against audited fund accounts", "Side-letter terms extended to the member tranche"],
    cocreated: ["Structure designed and priced by Hanwha", "Counterparty credit reviewed by the group", "Hanwha retains a first-loss or anchor position"],
    defi: ["Protocol code audited by two independent firms", "Custody through a regulated Korean qualified custodian", "Counterparty and bridge risk reviewed by the group's digital asset desk", "Daily proof-of-reserve reconciliation"],
  };

  const market = [
    /* ---- Sovereign / duration ---------------------------------------- */
    { id: "m01", kind: "listed", name: "US Treasury 4.125% 15-Aug-2036", ticker: "US91282CMR9", fills: "sov", cls: "debt",
      ret: "4.38% YTM", retNum: 4.38, liq: "Immediate", term: "10yr", min: 10000, avail: "Continuous", fit: 94,
      why: "On-the-run 10-year — the deepest, most liquid way to hold long sovereign duration.",
      sector: "Government", geo: "United States", ccy: "USD", px: 99.31, chg: 0.08, ytm: 4.38, dur: 8.2, rating: "AA+",
      overview: "On-the-run 10-year Treasury. The fixed income sleeve carries a weighted duration of 5.2 years against a 7.5-year policy; this is the cleanest instrument for lengthening it.",
      terms: [["Settlement", "T+1"], ["Coupon", "4.125%, semi-annual"], ["Duration", "8.2 years"], ["Minimum", "$10,000 face"], ["Custody", "Hanwha Securities"]],
      docs: [["Offering circular", "PDF · 42pp"], ["Auction results", "PDF · 3pp"]],
      qa: [["Is this hedged to KRW?", "No. A KRW-hedged sleeve can be requested at the order ticket; the hedge is booked as a separate line."]] },
    { id: "m02", kind: "listed", name: "Korea Treasury Bond 3.375% 10-Sep-2036", ticker: "KR103502GJ44", fills: "sov", cls: "debt",
      ret: "3.71% YTM", retNum: 3.71, liq: "Immediate", term: "10yr", min: 10000, avail: "Continuous", fit: 90,
      why: "KRW-denominated duration; matches the reporting currency without an FX overlay.",
      sector: "Government", geo: "Korea", ccy: "KRW", px: 97.88, chg: -0.03, ytm: 3.71, dur: 8.4, rating: "AA",
      overview: "Benchmark 10-year KTB. For a family reporting in KRW, sovereign duration held in the reporting currency removes the translation line that currently costs −0.8pp QTD.",
      terms: [["Settlement", "T+1"], ["Coupon", "3.375%, semi-annual"], ["Duration", "8.4 years"], ["Minimum", "₩10,000,000 face"], ["Custody", "Hanwha Securities"]],
      docs: [["Issue terms", "PDF · 18pp"]],
      qa: [["Withholding for a Korean resident?", "KTB interest is subject to standard Korean withholding. Barbell does not provide tax advice."]] },
    { id: "m03", kind: "listed", name: "iShares 7-10 Year Treasury Bond ETF", ticker: "IEF", fills: "sov", cls: "debt",
      ret: "4.21% yield", retNum: 4.21, liq: "Immediate", term: "Open-ended", min: 1000, avail: "Continuous", fit: 88,
      why: "The whole 7–10 year Treasury curve in one order, 0.15%, daily liquidity.",
      sector: "Government", geo: "United States", ccy: "USD", px: 96.44, chg: 0.14, expense: 0.15, dur: 7.4,
      overview: "Index exposure to the 7–10 year Treasury curve. The cheapest way to add duration in a single ticket while a direct ladder is built out over subsequent quarters.",
      terms: [["Settlement", "T+1"], ["Expense ratio", "0.15%"], ["Distribution", "Monthly"], ["Minimum", "1 share"], ["Custody", "Hanwha Securities"]],
      docs: [["Prospectus", "PDF · 88pp"], ["Fact sheet", "PDF · 2pp"]],
      qa: [["Why an ETF rather than the bonds?", "Speed. The ETF fills the gap this week; the direct ladder can replace it over two quarters without a further allocation decision."]] },
    { id: "m04", kind: "listed", name: "iShares 1-3 Year Treasury Bond ETF", ticker: "SHY", fills: "sov", cls: "debt",
      ret: "4.11% yield", retNum: 4.11, liq: "Immediate", term: "Open-ended", min: 1000, avail: "Continuous", fit: 71,
      why: "Low duration and low volatility — a parking place for capital-call reserves, not a duration holding.",
      sector: "Government", geo: "United States", ccy: "USD", px: 82.90, chg: 0.02, expense: 0.15, dur: 1.9,
      overview: "Short-dated Treasuries. The natural landing place for the Q1 2027 capital call reserve.",
      terms: [["Settlement", "T+1"], ["Expense ratio", "0.15%"], ["Duration", "1.9 years"], ["Minimum", "1 share"]],
      docs: [["Prospectus", "PDF · 88pp"]], qa: [] },
    { id: "m05", kind: "listed", name: "KOSEF 10Y KTB ETF", ticker: "148070.KS", fills: "sov", cls: "debt",
      ret: "3.58% yield", retNum: 3.58, liq: "Immediate", term: "Open-ended", min: 1000, avail: "Continuous", fit: 82,
      why: "KRW duration in ETF form; settles in the domestic account already in use.",
      sector: "Government", geo: "Korea", ccy: "KRW", px: 118450, chg: 0.06, expense: 0.15, dur: 8.1,
      overview: "Domestic ETF tracking the 10-year KTB index. Settles in the existing Hanwha Securities KRW account with no new custody arrangement.",
      terms: [["Settlement", "T+2"], ["Expense ratio", "0.15%"], ["Minimum", "1 share"]],
      docs: [["투자설명서", "PDF · 64pp"]], qa: [] },

    { id: "m34", kind: "private", name: "Korea Housing Finance Corp — private placement MBS 2026-C", fills: "sov", cls: "debt",
      ret: "4.62% YTM", retNum: 4.62, liq: "Immediate", term: "3 years", min: 500000, avail: "₩18B of ₩150B remaining", fit: 86,
      why: "Government-guaranteed KRW credit at a 91bp spread over the KTB curve, in exchange for holding to maturity.",
      sector: "Government", geo: "Korea", ccy: "KRW", manager: "Korea Housing Finance Corporation", closing: "2026-10-08",
      hanwha: true, anchor: "Hanwha Life holds ₩400B of the same programme across recent vintages.",
      trust: "strong",
      source: "direct", role: "Hanwha Life anchored the programme and Hanwha Securities arranged the placement.",
      overview: "Senior tranche of a government-guaranteed residential mortgage securitisation. Sovereign-equivalent credit with a 91bp pickup over the on-the-run KTB, in exchange for holding to maturity. Fills the duration gap in the reporting currency without an FX overlay.",
      terms: [["Yield to maturity", "4.62%"], ["Guarantee", "Korea Housing Finance Corporation (government-backed)"], ["Term", "3 years, no early redemption"], ["Minimum", "₩700,000,000 (≈$500,000)"], ["Coupon", "Quarterly"], ["Closing", "8 October 2026"]],
      docs: [["Programme prospectus", "PDF · 96pp"], ["Pool characteristics", "XLSX"], ["Guarantee terms", "PDF · 12pp"]],
      qa: [["Why is this on the same list as an ETF?", "Because it answers the same need. It pays 91bp more than the liquid alternative and cannot be sold for three years — that is a price and a term, not a separate category of product."]] },

    /* ---- Private credit ---------------------------------------------- */
    { id: "m06", kind: "private", name: "Northgate Data Center Credit Facility II", fills: "pcred", cls: "debt",
      ret: "9.2% target", retNum: 9.2, liq: "Immediate", term: "5 years", min: 1000000, avail: "$4.2M of $60M remaining", fit: 96,
      why: "Senior secured against contracted data centre cash flows, on the same security package as the Facility I position already held.",
      sector: "Infrastructure", geo: "United States", ccy: "USD", manager: "Northgate Capital Partners", closing: "2026-10-30",
      hanwha: true, anchor: "Hanwha Life holds $180M of the senior tranche on identical terms.",
      trust: "partial",
      source: "direct", role: "Originated by Hanwha's infrastructure credit desk; the group took the senior tranche first.",
      overview: "Senior secured lending against a 220MW US hyperscale data center platform, 94% contracted to two investment-grade tenants on 12-year leases. First-lien on the operating entity, 55% LTV on an independent appraisal, cash sweep above 1.35x DSCR. The family already holds the Facility I position at $2.39M; this is the same borrower, same security package, one tranche later.",
      terms: [["Target return", "9.2% (SOFR + 475bps, 4.0% floor)"], ["Term", "5 years, no extension"], ["Security", "First lien, 55% LTV"], ["Minimum", "$1,000,000"], ["Distribution", "Quarterly cash"], ["Closing", "30 October 2026"], ["Fees", "1.0% management, no carry"]],
      docs: [["Information memorandum", "PDF · 64pp"], ["Credit agreement (draft)", "PDF · 212pp"], ["Third-party appraisal", "PDF · 38pp"], ["Tenant lease summary", "XLSX"]],
      qa: [["What happens if a tenant defaults?", "DSCR falls to 0.82x on a single-tenant default, triggering the cash sweep and a standstill. The appraisal supports 68% recovery at the first-lien level."],
           ["Can this be sold before maturity?", "Yes, from day one. The position is a token in an SPV; selling it is a transfer on the rail, not a redemption from the facility."]] },
    { id: "m07", kind: "private", name: "Meridian Direct Lending Fund III", fills: "pcred", cls: "debt",
      ret: "8.4% target", retNum: 8.4, liq: "Immediate", term: "Evergreen", min: 500000, avail: "Open", fit: 89,
      why: "8.4% target, sold on the rail like everything else; the family holds Fund II and the reporting line is identical.",
      sector: "Diversified", geo: "United States", ccy: "USD", manager: "Meridian Credit", closing: "Quarterly close",
      hanwha: true, anchor: "Hanwha Life holds $150M in the same evergreen vehicle, on the same terms.",
      trust: "strong",
      source: "fund", role: "Hanwha has been an LP in Meridian's credit vehicles since Fund I. The member tranche sits inside that relationship.",
      overview: "Diversified senior secured lending to sponsor-backed mid-market borrowers, 128 positions, average hold 1.4% of the fund. Positions are tokenised, so an exit is a sale on the rail rather than a redemption from the fund.",
      terms: [["Target return", "8.4% net"], ["Liquidity", "Immediate — sold on the rail at the standing bid"], ["Minimum", "$500,000"], ["Fees", "1.25% / 10% over 6%"], ["Leverage", "0.85x"]],
      docs: [["Private placement memorandum", "PDF · 118pp"], ["Q2 2026 investor letter", "PDF · 12pp"]],
      qa: [["What does an exit actually cost?", "There is no gate and no queue — the position is sold on the rail. The cost is the spread to the last mark, which the secondary board publishes."]] },
    /* ---- listings beyond Hanwha's own direct deals -----------------------
       Three placeholders standing for the three sources DW named that the
       board did not previously carry: a product Hanwha co-created, on-chain
       yield wrapped for a Korean family office, and an emerging-market
       deposit programme. Names, counterparties and figures are invented. */
    { id: "m43", kind: "private", name: "Hanwha Korea Income Participation Note 2026-A", fills: "struct", cls: "debt",
      ret: "8.8% target", retNum: 8.8, liq: "Immediate", term: "4yr", min: 0, avail: "₩90B tranche open", fit: 87,
      why: "Anchor-grade yield, exited on the rail — co-created, so the terms are Hanwha's own rather than a distributor's.",
      sector: "Structured", geo: "Korea", ccy: "KRW", manager: "Hanwha Securities", closing: "Quarterly close",
      hanwha: true, anchor: "Hanwha Life holds the ₩300B first-loss tranche beneath this note.",
      trust: "strong",
      source: "cocreated", role: "Designed, priced and issued by Hanwha. The note did not exist before this platform asked for it.",
      dd: ["Structure designed and priced in-house", "Hanwha Life holds the first-loss tranche beneath members", "Underlying collateral pool reviewed quarterly by the group's credit committee", "Independent pricing agent appointed"],
      overview: "A participation note referencing a diversified pool of Korean mid-market receivables, with Hanwha Life holding a first-loss tranche beneath the member tranche. Built for this platform: the quarterly put and the absence of a minimum are both consequences of Hanwha taking the subordinate position.",
      terms: [["Target return", "8.8% net"], ["Exit", "Immediate, at the standing bid"], ["Subordination", "Hanwha Life first loss, ₩300B"], ["Sizing", "Fractional — any amount"], ["Fees", "0.75%, no carry"]],
      docs: [["Term sheet", "PDF · 11pp"], ["Collateral pool summary", "PDF · 26pp"], ["Issuer disclosure", "PDF · 46pp"]], qa: [] },

    { id: "m44", kind: "private", name: "Aegis Tokenised USD Yield Programme", fills: "struct", cls: "debt",
      ret: "9.6% target", retNum: 9.6, liq: "Immediate", term: "Open-ended", min: 0, avail: "Open", fit: 79,
      why: "On-chain lending yield at daily liquidity, wrapped so it can be custodied and reported like any other line.",
      sector: "Digital Assets", geo: "United States", ccy: "USD", manager: "Aegis Digital (placeholder)", closing: "Continuous",
      hanwha: true, anchor: "Hanwha holds $25M in the same programme and carries the operational risk of the wrapper.",
      trust: "partial",
      source: "defi", role: "Hanwha selected the venues, built the feeder vehicle and stands between members and the protocol.",
      dd: ["Protocol code audited by two independent firms", "Custody through a regulated Korean qualified custodian", "Counterparty and bridge risk reviewed by the group's digital asset desk", "Daily proof-of-reserve reconciliation", "Hanwha capital invested on identical terms"],
      overview: "Over-collateralised USD lending across a small set of audited on-chain venues, held through a Hanwha feeder so the family's exposure is a single reportable line rather than a wallet. Yield is variable and has ranged from 6.1% to 14.3% over the last twenty-four months.",
      terms: [["Target return", "9.6%, variable"], ["Liquidity", "Immediate — same-day settlement"], ["Collateralisation", "Over-collateralised, 142% weighted"], ["Sizing", "Fractional — any amount"], ["Custody", "Regulated Korean qualified custodian"], ["Fees", "0.90%"]],
      docs: [["Programme memorandum", "PDF · 38pp"], ["Audit reports (2)", "PDF · 94pp"], ["Custody and wrapper structure", "PDF · 16pp"], ["Historical yield series", "XLSX"]],
      qa: [["What is the worst case here?", "Loss of principal through a protocol failure or a custody failure. Over-collateralisation protects against borrower default, not against a flaw in the venue itself."]] },

    { id: "m45", kind: "private", name: "Emerging Markets Deposit Programme — Series 4", fills: "ig", cls: "debt",
      ret: "9.1% target", retNum: 9.1, liq: "Immediate", term: "2yr rolling", min: 0, avail: "Open", fit: 81,
      why: "Bank deposit yield well above the Korean curve, spread across six jurisdictions rather than taken in one.",
      sector: "Financials", geo: "Asia", ccy: "USD", manager: "Hanwha Securities", closing: "Monthly close",
      hanwha: true, anchor: "Hanwha Life places $400M across the same bank panel each quarter.",
      trust: "strong",
      source: "cocreated", role: "Hanwha assembled the bank panel, negotiated the rates and places member capital alongside its own.",
      dd: ["Each bank reviewed against the group's own counterparty limits", "Deposits spread across six jurisdictions, no bank above 25%", "Rates negotiated on the group's aggregate volume", "Reviewed quarterly by the group's treasury"],
      overview: "Term deposits placed across a panel of emerging-market banks, aggregated so that a family-office ticket earns the rate the group's volume commands. Currency risk is hedged to USD; the credit risk is the banks'.",
      terms: [["Target return", "9.1% net of hedging"], ["Liquidity", "Immediate — sold on the rail at the standing bid"], ["Concentration", "No single bank above 25%"], ["Sizing", "Fractional — any amount"], ["Hedging", "Fully hedged to USD"]],
      docs: [["Programme terms", "PDF · 22pp"], ["Bank panel and limits", "PDF · 9pp"]], qa: [] },

    /* ---- DEAL IDEAS FROM THE ASSET WISHLIST -----------------------------
       Each one is a candidate from the framework: an asset discounted because
       investors cannot verify the operator, counterparty or jurisdiction, and
       which Hanwha's name can reach. `trust` records how far the group's
       involvement actually closes that gap — strong, partial or weak — rather
       than implying it always does.

       Names, counterparties, sizes and returns are invented. */

    /* --- 1 · AI ------------------------------------------------------- */
    { id: "m46", kind: "private", name: "Compute Offtake Facility II — Hanwha-backed GPU financing", fills: "pcred", cls: "debt",
      ret: "9.8% target", retNum: 9.8, liq: "Immediate", term: "5 years", min: 0, avail: "$6.1M of $120M remaining", fit: 93,
      why: "Lenders underwrite the offtaker, not the hardware — so the question is Hanwha's credit, not whether the GPUs stay busy.",
      sector: "Infrastructure", geo: "United States", ccy: "USD", manager: "Hanwha Asset Management", closing: "2026-11-14",
      hanwha: true, anchor: "Hanwha provides the offtake and holds $400M of the senior tranche on identical terms.",
      source: "direct", trust: "partial",
      role: "Hanwha wrote the offtake against its own forward compute demand, then financed against it.",
      dd: ["Offtake sized against the group's internal compute demand forecast", "First lien on the hardware and the operating entity", "Hanwha senior tranche committed on identical terms", "Independent residual-value study on file"],
      overview: "Senior secured lending against GPU capacity whose revenue is contracted to Hanwha under a multi-year offtake. The financing exists because lenders will underwrite Hanwha's credit and will not underwrite a GPU. That is also the risk: the structure transfers it to Hanwha rather than removing it.",
      terms: [["Target return", "9.8% (SOFR + 540bps)"], ["Term", "5 years"], ["Security", "First lien on hardware and opco"], ["Offtake", "Hanwha, 5 years, take-or-pay"], ["Sizing", "Fractional — any amount"], ["Closing", "14 November 2026"]],
      docs: [["Information memorandum", "PDF · 58pp"], ["Offtake agreement (summary)", "PDF · 14pp"], ["Residual value study", "PDF · 31pp"]],
      qa: [["What happens if the offtake is not renewed?", "The facility amortises against contracted revenue through year five; renewal risk sits beyond final maturity."],
           ["Is this really diversified from Hanwha?", "No. The credit question here is the group's, and a family already holding Hanwha paper should size it accordingly."]] },

    { id: "m47", kind: "private", name: "Korean Corporate Compute Offtake — Series B", fills: "struct", cls: "debt",
      ret: "8.9% target", retNum: 8.9, liq: "Immediate", term: "4yr", min: 0, avail: "₩140B tranche open", fit: 90,
      why: "Aggregated usage contracts from Korean corporates — credits a foreign lender cannot price and Hanwha can.",
      sector: "Structured", geo: "Korea", ccy: "KRW", manager: "Hanwha Securities", closing: "Quarterly close",
      hanwha: true, anchor: "Hanwha Life holds the ₩260B subordinate tranche beneath members.",
      source: "cocreated", trust: "strong",
      role: "Hanwha aggregated the contracts, underwrote each offtaker, and takes the first loss.",
      dd: ["Each offtaker reviewed against the group's own counterparty limits", "No single corporate above 15% of the pool", "Hanwha Life holds the subordinate tranche", "Usage metered and reconciled monthly"],
      overview: "Lending against a diversified pool of compute-usage contracts written by Korean corporates. The pool prices better than its parts because Hanwha can assess borrowers that outside lenders have no way of reading — which is the whole argument, and the whole concentration.",
      terms: [["Target return", "8.9% net"], ["Exit", "Immediate, at the standing bid"], ["Pool", "31 corporate offtakers, none above 15%"], ["Subordination", "Hanwha Life, ₩260B"], ["Sizing", "Fractional — any amount"]],
      docs: [["Term sheet", "PDF · 12pp"], ["Pool composition and limits", "PDF · 19pp"], ["Issuer disclosure", "PDF · 46pp"]], qa: [] },

    { id: "m48", kind: "private", name: "Hanwha GPU Cluster Co-Ownership SPV", fills: "vc", cls: "equity", theme: "gpu",
      ret: "2.6x target", retNum: 24.0, liq: "Immediate", term: "Exit-driven", min: 0, avail: "$3.4M of $40M", fit: 86,
      why: "Owning the hardware rather than lending against it — the equity return, with the group's own demand underwriting utilisation.",
      sector: "Data Centers", geo: "Korea", ccy: "USD", manager: "Hanwha Asset Management", closing: "2026-12-05",
      hanwha: true, anchor: "Hanwha and Korean corporates contract for 71% of the cluster's capacity from day one.",
      source: "direct", trust: "strong",
      role: "Hanwha built the cluster, brought the demand, and co-owns it alongside members.",
      dd: ["Utilisation underwritten by contracted Hanwha and Korean corporate demand", "Hardware refresh and residual value modelled to year six", "Power contracted for the full term", "Hanwha capital invested on identical terms"],
      overview: "Direct ownership of an operating GPU cluster. Inference margins are high and the hardware pays back well inside its useful life, so the economics are equity-like rather than credit-like. Utilisation is the risk, and 71% of capacity is already contracted.",
      terms: [["Target", "2.6x over six years"], ["Structure", "Co-ownership SPV"], ["Contracted capacity", "71% at close"], ["Sizing", "Fractional — any amount"], ["Fees", "0.5% / 10% over 8%"], ["Closing", "5 December 2026"]],
      docs: [["SPV memorandum", "PDF · 34pp"], ["Capacity contracts (summary)", "PDF · 11pp"], ["Hardware and refresh model", "XLSX"], ["Power purchase agreement", "PDF · 27pp"]],
      qa: [["What if utilisation falls?", "Below roughly 55% the vehicle stops covering its cost of capital. The contracted base is 71%."]] },

    /* --- 2 · Energy --------------------------------------------------- */
    { id: "m49", kind: "private", name: "Qcells Residential Storage Programme — Series 3", fills: "struct", cls: "debt",
      ret: "9.4% target", retNum: 9.4, liq: "Immediate", term: "7yr amortising", min: 0, avail: "Open", fit: 82,
      why: "Receivables from solar-and-battery installations, with panels supplied at cost by the group and batteries recoverable on default.",
      sector: "Energy", geo: "United States", ccy: "USD", manager: "Hanwha Qcells", closing: "Monthly close",
      hanwha: true, anchor: "Hanwha Qcells manufactures the panels and holds the residual risk on recovered hardware.",
      source: "cocreated", trust: "weak",
      role: "Hanwha supplies the hardware at cost, services the receivables, and takes back the batteries if a homeowner defaults.",
      dd: ["Panels supplied at manufacturing cost by the group", "Batteries physically recoverable and re-deployable", "Homeowner credit screened at origination", "Texas generation held as a price hedge"],
      overview: "Amortising receivables from residential solar-and-storage installations in US markets where retail power has risen sharply. Pricing is at a discount to the prevailing utility rate rather than fixed, so the programme tracks the thing that is actually going up.",
      terms: [["Target return", "9.4% net"], ["Term", "7 years, amortising"], ["Liquidity", "Immediate — sold on the rail at the standing bid"], ["Recovery", "Batteries recoverable; panels at cost"], ["Sizing", "Fractional — any amount"]],
      docs: [["Programme memorandum", "PDF · 41pp"], ["Receivables performance 2024-26", "XLSX"], ["Recovery and redeployment policy", "PDF · 9pp"]],
      qa: [["What is the weak point?", "Homeowner relocation. The obligation follows the property, and transfer at sale is the programme's main operational friction."]] },

    { id: "m50", kind: "private", name: "Behind-the-Meter Power SPV — turbine and storage", fills: "infra", cls: "real", theme: "energy",
      ret: "16.5% target IRR", retNum: 16.5, liq: "Immediate", term: "2042 concession", min: 0, avail: "$5.0M of $75M", fit: 77,
      why: "Generation built next to the load it serves, which is what gets a data centre past an interconnection queue.",
      sector: "Energy", geo: "United States", ccy: "USD", manager: "Hanwha Asset Management", closing: "2027-01-20",
      hanwha: true, anchor: "Hanwha Qcells supplies the solar; the group holds 35% of the equity.",
      source: "direct", trust: "weak",
      role: "Hanwha assembled the project and supplies the generation equipment, but cannot underwrite the offtake.",
      dd: ["Equipment supplied by the group", "Site control and permitting complete", "Turbine delivery slot secured", "Offtake not yet contracted — stated as the open risk"],
      overview: "Solar, gas turbine and storage built behind the meter for data-centre load, bypassing an interconnection queue measured in years. The constraint it solves is real. The offtake is not yet contracted, which is the honest weakness and the reason it is priced where it is.",
      terms: [["Target", "16.5% IRR"], ["Term", "Concession to 2042"], ["Offtake", "Not contracted at close"], ["Sizing", "Fractional — any amount"], ["Closing", "20 January 2027"]],
      docs: [["Project memorandum", "PDF · 52pp"], ["Permitting file", "PDF · 88pp"], ["Turbine supply agreement", "PDF · 23pp"]],
      qa: [["Why is the trust fit weak?", "Because Hanwha supplies equipment here but does not stand behind the revenue. The group's name does not close this gap, and the page says so."]] },

    /* --- 3 · Venture and private markets ------------------------------ */
    { id: "m51", kind: "private", name: "Tokenised Venture Fund-of-Funds I", fills: "vc", cls: "equity", theme: "venture",
      ret: "2.9x target net", retNum: 19.5, liq: "Immediate", term: "12 years", min: 0, avail: "$8.2M of $250M", fit: 94,
      why: "Twenty top-tier managers and thirty emerging ones in a single tokenised line, through LP positions a family office cannot open on its own.",
      sector: "Diversified", geo: "United States", ccy: "USD", manager: "Hanwha Asset Management", closing: "Quarterly close",
      hanwha: true, anchor: "Built on Hanwha's existing LP positions; the group commits alongside members at each close.",
      source: "fund", trust: "partial",
      role: "Hanwha contributes its own LP access and runs the manager diligence; the wrapper is the group's.",
      dd: ["Built on the group's existing LP positions", "Emerging managers screened through the LP network's own data", "No single manager above 6% of the vehicle", "Quarterly transfer on the secondary board after year three"],
      overview: "A tokenised fund-of-funds across roughly twenty established managers and thirty emerging ones. Top managers have compounded above 20% IRR for decades and have been closed to tickets this size; the access comes from the group's LP relationships rather than from a placement agent. Adverse manager selection is the live risk, and a sectoral bubble would hit every line at once.",
      terms: [["Target", "2.9x net / 19.5% net IRR"], ["Term", "12 years"], ["Liquidity", "Immediate, from day one"], ["Concentration", "No manager above 6%"], ["Sizing", "Fractional — any amount"], ["Fees", "0.8% / 5% over 8%"]],
      docs: [["Vehicle memorandum", "PDF · 96pp"], ["Manager roster and diligence summary", "PDF · 44pp"], ["LP access letters", "PDF · 18pp"], ["Tokenisation and transfer mechanics", "PDF · 16pp"]],
      qa: [["What does Hanwha add that a placement agent would not?", "The LP positions themselves. Several of these managers do not accept new LPs at all; the allocation is carved from commitments the group already holds."]] },

    { id: "m52", kind: "private", name: "Emerging Manager Secondaries — Vintage 2021-23", fills: "vc", cls: "equity", theme: "venture",
      ret: "2.4x target", retNum: 21.0, liq: "Immediate", term: "Until wind-down", min: 0, avail: "$2.7M block", fit: 88,
      why: "Thin public track records priced as unknowable risk — where the group's own data can tell one manager from another.",
      sector: "Diversified", geo: "United States", ccy: "USD", manager: "Hanwha Asset Management", closing: "2026-11-28",
      hanwha: true, anchor: "Hanwha takes the larger half of every block on identical terms.",
      source: "direct", trust: "strong",
      role: "Hanwha's diligence is the product here: the discount exists because other buyers cannot assess these managers.",
      dd: ["Managers assessed against the LP network's own portfolio data", "Underlying company marks cross-checked against the group's other positions", "Blocks bought at a discount to the most recent manager mark", "Hanwha invests alongside at the same price"],
      overview: "LP interests in 2021-23 vintage funds run by managers without a long public record, bought from LPs who need liquidity. The discount is a function of what other buyers cannot see, not of what the assets are worth — which is the clearest version of the trust argument on the platform.",
      terms: [["Target", "2.4x"], ["Entry", "Weighted 18% discount to last manager mark"], ["Term", "Until wind-down, est. 2031"], ["Sizing", "Fractional — any amount"], ["Closing", "28 November 2026"]],
      docs: [["Block summary", "PDF · 22pp"], ["Manager-by-manager diligence", "PDF · 61pp"], ["Transfer and consent pack", "PDF · 34pp"]], qa: [] },

    /* --- 4 · Human premium -------------------------------------------- */
    { id: "m53", kind: "private", name: "Korean Esports Franchise — minority stake", fills: "pe", cls: "equity", theme: "teams",
      ret: "3.2x target", retNum: 23.0, liq: "Immediate", term: "Exit-driven", min: 0, avail: "$1.6M of $18M", fit: 71,
      why: "A team foreign investors have no way of valuing, in a market where the group holds the broadcast relationships.",
      sector: "Media", geo: "Korea", ccy: "KRW", manager: "Hanwha Asset Management", closing: "2027-02-10",
      hanwha: true, anchor: "Hanwha holds a controlling stake and the Korean broadcast relationships behind it.",
      source: "direct", trust: "partial",
      role: "Hanwha selected the team and stages the minority stakes; monetisation remains immature and the page says so.",
      dd: ["Team selected and held by the group", "Broadcast and sponsorship relationships held in Korea", "Staged minority stakes rather than a single block", "Revenue model stress-tested against a flat sponsorship market"],
      overview: "A minority stake in a Korean esports organisation. The argument is that monetisation is immature rather than absent, and that a foreign investor cannot tell a good roster from a bad one. Hanwha can. Whether that is worth holding at all is the family's call.",
      terms: [["Target", "3.2x"], ["Structure", "Staged minority stake"], ["Term", "Exit-driven"], ["Sizing", "Fractional — any amount"], ["Closing", "10 February 2027"]],
      docs: [["Investment memorandum", "PDF · 29pp"], ["Revenue and sponsorship model", "XLSX"], ["Roster and contract summary", "PDF · 12pp"]],
      qa: [["Is this a security?", "The stake is an equity interest in a Korean operating company, so yes. The sports-adjacent participations elsewhere on the platform are a different question and are flagged as unresolved."]] },

    { id: "m54", kind: "private", name: "K-Content Royalty Basket — 2026 vintage", fills: "preipo", cls: "equity", theme: "artists",
      ret: "14.0% target", retNum: 14.0, liq: "Immediate", term: "10yr", min: 0, avail: "Open", fit: 74,
      why: "Verified royalty streams from Korean content, which reprice when a global audience finds them.",
      sector: "Media", geo: "Korea", ccy: "KRW", manager: "Hanwha Asset Management", closing: "Quarterly close",
      hanwha: true, anchor: "Hanwha verifies each royalty stream against distributor settlement data.",
      source: "cocreated", trust: "partial",
      role: "Hanwha assembled the basket and verifies the underlying royalties; it does not guarantee them.",
      dd: ["Each royalty stream verified against distributor settlement data", "Basket of 40+ works, no single work above 8%", "Quarterly reconciliation against platform reporting", "Catalogue rights confirmed by Korean counsel"],
      overview: "A basket of royalty streams from Korean music, film and television. Earnings step up sharply when a work reaches a worldwide audience, and the home market has historically priced these at a discount. AI-generated content eroding artist earnings is the structural risk and is not hedged.",
      terms: [["Target return", "14.0%"], ["Term", "10 years"], ["Liquidity", "Immediate — sold on the rail at the standing bid"], ["Diversification", "40+ works, none above 8%"], ["Sizing", "Fractional — any amount"]],
      docs: [["Basket memorandum", "PDF · 37pp"], ["Royalty verification methodology", "PDF · 15pp"], ["Historical settlement data", "XLSX"]], qa: [] },

    /* --- 7 · Real estate ----------------------------------------------- */
    { id: "m55", kind: "private", name: "Tokenised Prime Seoul Residential — Gangnam portfolio", fills: "re", cls: "real", theme: "realestate",
      ret: "11.2% target IRR", retNum: 11.2, liq: "Immediate", term: "8yr", min: 0, avail: "₩62B of ₩400B", fit: 83,
      why: "Prime Seoul apartments at ticket sizes that have always excluded the buyers who want them most.",
      sector: "Residential", geo: "Korea", ccy: "KRW", manager: "Hanwha Asset Management", closing: "Quarterly close",
      hanwha: true, anchor: "Hanwha holds 30% of the portfolio and is the issuer of record for foreign buyers.",
      source: "cocreated", trust: "partial",
      role: "Hanwha is the trusted issuer that makes foreign ownership workable, and holds the regulatory relationships.",
      dd: ["Title and ownership structure confirmed by Korean counsel", "Hanwha holds 30% of the portfolio on identical terms", "Rental income verified against lease registry", "Regulatory position documented with the relevant authority"],
      overview: "Fractional ownership of a portfolio of prime Gangnam apartments. Supply is constrained, demand is not, and the ticket size has historically kept out exactly the buyers who want the exposure. Regulatory opposition to anything that looks like speculation is the principal risk.",
      terms: [["Target", "11.2% IRR"], ["Term", "8 years"], ["Liquidity", "Immediate, from day one"], ["Sizing", "Fractional — any amount"], ["Issuer", "Hanwha, for foreign holders of record"]],
      docs: [["Portfolio memorandum", "PDF · 68pp"], ["Title and counsel opinion", "PDF · 42pp"], ["Lease registry extract", "XLSX"], ["Regulatory position paper", "PDF · 17pp"]],
      qa: [["What is the regulatory risk exactly?", "Korean policy toward residential speculation changes, and a tokenised fractional structure is visible. The position paper sets out the current treatment; it is not a guarantee of future treatment."]] },

    /* --- 5 · Health ----------------------------------------------------- */
    { id: "m56", kind: "private", name: "Korean Drug Discovery Basket — Series 1", fills: "vc", cls: "equity", theme: "health",
      ret: "3.6x target", retNum: 26.0, liq: "Immediate", term: "Exit-driven", min: 0, avail: "$2.2M of $30M", fit: 69,
      why: "Twelve Korean clinical programmes in one line — binary outcomes that no single foreign investor can assess alone.",
      sector: "Healthcare", geo: "Korea", ccy: "USD", manager: "Hanwha Asset Management", closing: "2027-01-08",
      hanwha: true, anchor: "Hanwha selects the programmes and invests alongside at the same valuation.",
      source: "direct", trust: "partial",
      role: "Hanwha's selection is the product; the clinical outcomes are nobody's to guarantee.",
      dd: ["Twelve programmes, none above 14% of the basket", "Each reviewed by the group's healthcare specialists", "Staged funding tied to clinical milestones", "Hanwha invested at the same valuation"],
      overview: "A basket of Korean clinical-stage programmes. AI has made candidate generation cheap and moved the value to testing and approval, which is where Korean capability is strong and foreign capital is thin. Outcomes are binary; the basket is the only defence and it is not a complete one.",
      terms: [["Target", "3.6x"], ["Structure", "Basket of 12 programmes"], ["Funding", "Staged on clinical milestones"], ["Sizing", "Fractional — any amount"], ["Closing", "8 January 2027"]],
      docs: [["Basket memorandum", "PDF · 48pp"], ["Programme-by-programme summaries", "PDF · 112pp"], ["Specialist review notes", "PDF · 26pp"]], qa: [] },

    /* --- 8 · Talent ---------------------------------------------------- */
    { id: "m57", kind: "private", name: "Hanwha Korean Talent Fund I", fills: "preipo", cls: "equity", theme: "koreatalent",
      ret: "2.8x target", retNum: 22.5, liq: "Immediate", term: "10yr", min: 0, avail: "$2.4M of $35M", fit: 72,
      why: "Korean professionals, athletes and creators are priced on the home market and reprice when they reach a larger one.",
      sector: "Media", geo: "Korea", ccy: "USD", manager: "Hanwha Asset Management", closing: "2027-03-12",
      hanwha: true, trust: "strong",
      anchor: "Hanwha screens every participant and invests alongside on identical terms.",
      source: "direct",
      role: "The screening is the product. Finding the right talent is the whole difficulty, and the group's reach into Korean sport, industry and entertainment is what makes a shortlist possible.",
      dd: ["Each participant screened by the group", "Participations capped at a single-digit share of any individual's earnings", "Basket of 60+ participants, none above 5%", "Structured and reviewed by Korean counsel"],
      overview: "A diversified basket of participations in the future earnings of Korean professionals moving abroad, athletes reaching a major league, and creators whose work is finding a global audience. Earnings step up sharply at the point of that move; the home market has never priced that step. Selection is the entire risk, and selection is also the only thing on offer here.",
      terms: [["Target", "2.8x over ten years"], ["Structure", "Participation basket, 60+ individuals"], ["Concentration", "No individual above 5%"], ["Cap", "Single-digit share of any individual's earnings"], ["Sizing", "Fractional — any amount"], ["Closing", "12 March 2027"]],
      docs: [["Fund memorandum", "PDF · 44pp"], ["Screening methodology", "PDF · 18pp"], ["Counsel opinion — participation structure", "PDF · 29pp"]],
      qa: [["Is a participation in someone's earnings a security?", "That is unresolved. The structure is being reviewed against the group's BD/ATS permissions and the fund wrapper is what settles it."]] },

    { id: "m08", kind: "listed", name: "Invesco Senior Loan ETF", ticker: "BKLN", fills: "pcred", cls: "debt",
      ret: "7.60% yield", retNum: 7.6, liq: "Immediate", term: "Open-ended", min: 1000, avail: "Continuous", fit: 76,
      why: "Floating-rate senior loans with daily liquidity — the same credit risk without the lock-up.",
      sector: "Diversified", geo: "United States", ccy: "USD", px: 20.88, chg: 0.05, expense: 0.65,
      overview: "Index exposure to the US leveraged loan market. Lower yield than direct lending and no origination premium, but it fills the credit gap immediately and can be sold to fund the Q1 2027 capital calls if needed.",
      terms: [["Settlement", "T+1"], ["Expense ratio", "0.65%"], ["Distribution", "Monthly"], ["Minimum", "1 share"]],
      docs: [["Prospectus", "PDF · 92pp"]],
      qa: [["Why does this score below the private options?", "Fit weights what an exit would clear at. BKLN yields 7.6% against 9.2% for equivalent first-lien risk in the Northgate facility, and both sell the same day."]] },
    { id: "m09", kind: "listed", name: "Ares Capital Corporation", ticker: "ARCC", fills: "pcred", cls: "debt",
      ret: "9.1% dividend", retNum: 9.1, liq: "Immediate", term: "Listed BDC", min: 1000, avail: "Continuous", fit: 74,
      why: "Direct-lending economics in listed form; carries equity-market beta the private facilities do not.",
      sector: "Financials", geo: "United States", ccy: "USD", px: 22.41, chg: -0.31,
      overview: "The largest listed business development company. Exposure to a $27bn senior secured loan book, priced daily and therefore volatile in a way the underlying loans are not.",
      terms: [["Settlement", "T+1"], ["Dividend", "Quarterly"], ["Premium / discount to NAV", "+4.2%"], ["Minimum", "1 share"]],
      docs: [["10-K 2025", "PDF · 214pp"], ["Q2 2026 supplement", "PDF · 28pp"]], qa: [] },
    { id: "m10", kind: "listed", name: "Hanwha Securities Floating Rate Note 2026-06", ticker: "HWFRN2606", fills: "pcred", cls: "debt",
      ret: "6.85% coupon", retNum: 6.85, liq: "Immediate", term: "3yr", min: 100000, avail: "₩40B tranche open", fit: 80,
      why: "Floating KRW coupon — credit-like yield, sold whenever the family wants out.",
      sector: "Structured", geo: "Korea", ccy: "KRW", ytm: 6.85,
      hanwha: true, anchor: "Issued by Hanwha Securities; Hanwha Life holds ₩120B of the same series.",
      overview: "Senior unsecured floating rate note referencing 91-day CD + 285bps, sold on the rail at the standing bid. Sits between the money market sleeve and private credit on yield, and alongside both on liquidity.",
      terms: [["Coupon", "CD91 + 285bps, quarterly reset"], ["Exit", "Immediate, at the standing bid"], ["Minimum", "₩100,000,000"], ["Issuer rating", "A+ (KIS)"]],
      docs: [["Term sheet", "PDF · 8pp"], ["Issuer disclosure", "PDF · 46pp"]], qa: [] },

    /* ---- Infrastructure ---------------------------------------------- */
    { id: "m11", kind: "private", name: "Songdo Hyperscale Data Center Platform II", fills: "infra", cls: "real",
      ret: "13.5% target IRR", retNum: 13.5, liq: "Immediate", term: "8 years", min: 750000, avail: "$11M of $140M remaining", fit: 93,
      why: "Second phase of an asset the family already owns, at the same entry basis as Hanwha Life.",
      sector: "Data Centers", geo: "Korea", ccy: "USD", manager: "Hanwha Asset Management", closing: "2026-11-14",
      hanwha: true, anchor: "Hanwha Life is the anchor investor at $220M, subscribed at the same price and terms as members.",
      trust: "strong",
      source: "direct", role: "Developed and financed by Hanwha; the group remains the largest equity holder.",
      overview: "Second phase of the Songdo campus: 180MW of contracted capacity with a signed 15-year offtake from a global cloud operator. Phase I, which the family already holds at $2.34M, is 100% leased and distributing at a 7.4% cash yield.",
      terms: [["Target IRR", "13.5% gross / 11.8% net"], ["Cash yield", "6.2% from year 3"], ["Term", "8 years"], ["Minimum", "$750,000"], ["Fees", "1.5% / 15% over 8%"], ["Closing", "14 November 2026"]],
      docs: [["Investment memorandum", "PDF · 88pp"], ["Offtake agreement summary", "PDF · 14pp"], ["Power supply agreement", "PDF · 22pp"], ["Phase I performance", "PDF · 9pp"]],
      qa: [["Is the power supply secured?", "A 20-year PPA with KEPCO covers 140MW; the balance is contracted through a private generator with a take-or-pay floor."],
           ["What is the concentration effect?", "Committing $750K takes data center exposure to 5.0% of total assets across Phase I, Phase II and the Northgate credit facility."]] },
    { id: "m12", kind: "private", name: "Hanwha Korea Logistics REIT Co-Invest II", fills: "infra", cls: "real",
      ret: "9.8% target IRR", retNum: 9.8, liq: "Immediate", term: "6 years", min: 300000, avail: "$6M of $45M remaining", fit: 85,
      why: "$300,000 minimum, quarterly cash from year one; Co-Invest I is marking at 1.08x.",
      sector: "Logistics", geo: "Korea", ccy: "KRW", manager: "Hanwha Asset Management", closing: "2026-12-05",
      hanwha: true, anchor: "Hanwha Life holds 40% of the REIT's equity alongside co-investors.",
      trust: "strong",
      source: "cocreated", role: "Structured by Hanwha with the REIT manager so that member tickets could sit alongside the group's own 40%.",
      overview: "Cold-chain and last-mile logistics assets in the Seoul metropolitan area, 91% occupied on a weighted 6.2-year lease term. Distributions quarterly from year 1.",
      terms: [["Target IRR", "9.8%"], ["Cash yield", "5.9% from year 1"], ["Term", "6 years"], ["Minimum", "$300,000"], ["Fees", "1.2% / 12% over 7%"], ["Closing", "5 December 2026"]],
      docs: [["Co-investment memorandum", "PDF · 52pp"], ["Asset schedule", "XLSX"], ["Valuation report", "PDF · 30pp"]],
      qa: [["How does this differ from Co-Invest I?", "Same manager and asset type; Co-Invest II adds three cold-chain facilities and excludes the Incheon site that anchored Fund I."]] },
    { id: "m13", kind: "listed", name: "Global X Data Center & Digital Infrastructure ETF", ticker: "DTCR", fills: "infra", cls: "real",
      ret: "8.5% est. total", retNum: 8.5, liq: "Immediate", term: "Open-ended", min: 1000, avail: "Continuous", fit: 77,
      why: "The same theme as the two private data center positions, liquid, at a listed-market multiple.",
      sector: "Data Centers", geo: "Global", ccy: "USD", px: 18.62, chg: 0.74, expense: 0.50,
      overview: "Listed data center REITs and digital infrastructure operators. Prices daily against private marks that move quarterly — useful as a sanity check on the Songdo carrying value as much as an allocation.",
      terms: [["Settlement", "T+1"], ["Expense ratio", "0.50%"], ["Distribution", "Semi-annual"], ["Minimum", "1 share"]],
      docs: [["Prospectus", "PDF · 74pp"]], qa: [] },
    { id: "m14", kind: "listed", name: "Macquarie Korea Infrastructure Fund", ticker: "088980.KS", fills: "infra", cls: "real",
      ret: "6.4% dividend", retNum: 6.4, liq: "Immediate", term: "Listed fund", min: 1000, avail: "Continuous", fit: 81,
      why: "Regulated KRW infrastructure cash flows with daily liquidity; the only listed route into the domestic toll and tunnel base.",
      sector: "Infrastructure", geo: "Korea", ccy: "KRW", px: 13240, chg: 0.23,
      overview: "Listed closed-end fund holding 17 Korean toll roads, tunnels and a gas distribution network, most with minimum revenue guarantees. Dividend paid semi-annually and covered 1.3x by operating cash flow.",
      terms: [["Settlement", "T+2"], ["Dividend", "Semi-annual"], ["Premium / discount to NAV", "−2.8%"], ["Minimum", "1 share"]],
      docs: [["사업보고서 2025", "PDF · 180pp"]], qa: [] },
    { id: "m15", kind: "listed", name: "Brookfield Infrastructure Partners L.P.", ticker: "BIP", fills: "infra", cls: "real",
      ret: "5.9% distribution", retNum: 5.9, liq: "Immediate", term: "Listed LP", min: 1000, avail: "Continuous", fit: 72,
      why: "Global diversified infrastructure; K-1 reporting adds administrative burden for a Korean-resident holder.",
      sector: "Infrastructure", geo: "Global", ccy: "USD", px: 36.15, chg: -0.18,
      overview: "Listed partnership holding utilities, transport, midstream and data infrastructure across 30 countries. Distribution growth target 5–9% annually.",
      terms: [["Settlement", "T+1"], ["Distribution", "Quarterly"], ["Tax reporting", "Schedule K-1"], ["Minimum", "1 unit"]],
      docs: [["Annual report 2025", "PDF · 168pp"]], qa: [] },

    /* ---- Everything else ---------------------------------------------- */
    { id: "m16", kind: "listed", name: "iShares iBoxx USD Investment Grade Corporate Bond ETF", ticker: "LQD", fills: "ig", cls: "debt",
      ret: "5.12% yield", retNum: 5.12, liq: "Immediate", term: "Open-ended", min: 1000, avail: "Continuous", fit: 64,
      why: "Broad IG credit at 0.14% — duplicates exposure the book already holds in single names.",
      sector: "Corporate", geo: "United States", ccy: "USD", px: 109.74, chg: 0.11, expense: 0.14, dur: 8.3,
      overview: "Broad US investment grade corporate exposure. The book already holds this risk in single names; shown for completeness.",
      terms: [["Settlement", "T+1"], ["Expense ratio", "0.14%"], ["Minimum", "1 share"]], docs: [["Prospectus", "PDF · 96pp"]], qa: [] },
    { id: "m17", kind: "listed", name: "Hanwha Life 3.95% 12-Feb-2030", ticker: "KR6088350D30", fills: "ig", cls: "debt",
      ret: "4.06% YTM", retNum: 4.06, liq: "Immediate", term: "4yr", min: 100000, avail: "Secondary market", fit: 66,
      why: "Adds to issuer concentration the book already carries through the ELS note.",
      sector: "Financials", geo: "Korea", ccy: "KRW", px: 99.56, chg: 0.01, ytm: 4.06, dur: 3.3, rating: "AAA (KIS)",
      hanwha: true, anchor: "Issued by Hanwha Life Insurance.",
      overview: "Senior unsecured KRW paper from Hanwha Life. Included because it is frequently requested.",
      terms: [["Settlement", "T+1"], ["Coupon", "3.95% annual"], ["Minimum", "₩100,000,000"]], docs: [["Issue terms", "PDF · 22pp"]], qa: [] },
    { id: "m18", kind: "listed", name: "Apple Inc. 4.30% 10-May-2033", ticker: "US037833EF2", fills: "ig", cls: "debt",
      ret: "4.74% YTM", retNum: 4.74, liq: "Immediate", term: "7yr", min: 10000, avail: "Secondary market", fit: 62,
      why: "Duplicates the existing 2043 Apple line at a shorter maturity.",
      sector: "Info Tech", geo: "United States", ccy: "USD", px: 96.88, chg: 0.06, ytm: 4.74, dur: 5.8, rating: "AA+",
      overview: "Intermediate Apple paper. The book already holds the 2043 line at $2.41M.",
      terms: [["Settlement", "T+1"], ["Coupon", "4.30% semi-annual"], ["Minimum", "$10,000 face"]], docs: [], qa: [] },
    { id: "m19", kind: "private", name: "Sequoia Capital — LP tranche", fills: "vc", cls: "equity",
      ret: "Top-quartile venture", retNum: 22.0, liq: "Immediate", term: "10 years", min: 0, avail: "$3.5M of $45M tranche", fit: 91,
      why: "An access tranche in a fund that is closed to new LPs, carved out of Hanwha's own commitment.",
      sector: "Technology", geo: "United States", ccy: "USD", manager: "Sequoia Capital", closing: "2026-10-15",
      hanwha: true, anchor: "Hanwha is an LP in the fund; the member tranche is carved out of that commitment.",
      theme: "venture",
      trust: "strong",
      illustrative: true,
      source: "fund", role: "Hanwha's LP position is the access. Without it there is no tranche, at any cheque size.",
      dd: ["Access carved from the group's own LP commitment", "Side-letter terms extended to the member tranche", "Transfer pre-cleared with the GP for platform members", "Hanwha invested on identical terms"],
      overview: "An access tranche in an established US venture fund. The reason this exists is not diligence or pricing — it is that the fund does not take commitments of this size, and Hanwha's existing LP position does. Terms, sizes and timing on this page are illustrative and do not describe any actual arrangement with the manager named.",
      terms: [["Access", "Carved from Hanwha's LP commitment"], ["Term", "10 years + 2 one-year extensions"], ["Sizing", "Fractional — any amount"], ["Drawdown", "Over 4 years, ~25% per year"], ["Closing", "15 October 2026"]],
      docs: [["Fund PPM", "PDF · 142pp"], ["LPA (tranche)", "PDF · 96pp"], ["Side letter", "PDF · 6pp"]],
      qa: [["What are the drawdown mechanics?", "Approximately 25% per year over four years on 10 business days' notice. Model the commitment, not the cheque."],
           ["Can the tranche be resold?", "Yes, from day one, on the Barbell board. The GP's consent right is pre-cleared for platform transfers."]] },
    { id: "m20", kind: "private", name: "Aeris Aerospace — Series G secondary block", fills: "preipo", cls: "equity",
      ret: "1.9x target", retNum: 18.0, liq: "Immediate", term: "Until listing (est. 2028)", min: 500000, avail: "$2.8M block", fit: 87,
      why: "Averages into an existing Series F position at a 12% discount to the last primary round.",
      sector: "Aerospace", geo: "United States", ccy: "USD", manager: "Direct block", closing: "2026-10-22",
      hanwha: true, anchor: "Hanwha Life took $40M of the same secondary block at $186.00 — the price members pay.",
      trust: "partial",
      source: "direct", role: "Sourced by Hanwha's pre-IPO desk from a selling employee holder; the group took the larger half of the block.",
      overview: "Secondary block in a large private aerospace manufacturer, sold by an early employee holder. Priced at $186/share against the Series G primary at $211. The family holds the Series F block at $820K, entered at $142.",
      terms: [["Price", "$186.00 per share"], ["Discount to last round", "11.8%"], ["Minimum", "$500,000"], ["Transfer", "Company right of first refusal, 30 days"], ["Closing", "22 October 2026"]],
      docs: [["Company overview", "PDF · 46pp"], ["Cap table summary", "PDF · 8pp"], ["ROFR waiver process", "PDF · 4pp"], ["Audited financials 2025", "PDF · 62pp"]],
      qa: [["What if the ROFR is exercised?", "The commitment is returned in full within 5 business days. No fee."],
           ["When does this become listable?", "Twelve months after settlement, on the Barbell secondary board."]] },
    { id: "m21", kind: "private", name: "Helios AI Infrastructure SPV II", fills: "vc", cls: "equity",
      ret: "4.0x target", retNum: 28.0, liq: "Immediate", term: "Exit-driven", min: 250000, avail: "$1.9M of $25M", fit: 84,
      why: "Growth-stage AI infrastructure; the family holds SPV I, marked at 1.35x after 17 months.",
      sector: "Technology", geo: "United States", ccy: "USD", manager: "Helios Partners", closing: "2026-11-01",
      hanwha: true, anchor: "Hanwha Life holds $45M of the same Series D, subscribed alongside the SPV at the round price.",
      theme: "gpu",
      trust: "partial",
      source: "cocreated", role: "The SPV was formed by Hanwha to carry member capital into a round the group was already taking.",
      overview: "Single-asset SPV into the Series D of a GPU cloud operator with $310M of contracted revenue. Concentrated: one company, one round, no diversification.",
      terms: [["Target", "4.0x"], ["Structure", "Single-asset SPV"], ["Minimum", "$250,000"], ["Fees", "0% management / 10% carry"], ["Closing", "1 November 2026"]],
      docs: [["SPV memorandum", "PDF · 28pp"], ["Company deck", "PDF · 34pp"], ["Series D term sheet", "PDF · 12pp"]],
      qa: [["How concentrated is this?", "Entirely. A $250K commitment represents 4.0% of the Alpha sleeve in a single private company."]] },
    { id: "m22", kind: "private", name: "Pacific Core Real Estate Fund V", fills: "re", cls: "real",
      ret: "8.1% target", retNum: 8.1, liq: "Immediate", term: "Open-end", min: 500000, avail: "Open", fit: 58,
      why: "Core open-end property; the family holds Fund IV and the exposure would be duplicative.",
      sector: "Diversified RE", geo: "Asia-Pacific", ccy: "USD", manager: "Pacific Core", closing: "Quarterly close",
      hanwha: true, anchor: "Hanwha Life holds $210M in the fund on identical terms.",
      trust: "weak",
      source: "fund", role: "Hanwha has stood in the same redemption queue as members since Fund III.",
      overview: "Core open-end Asia-Pacific property fund. Shown because the family holds Fund IV.",
      terms: [["Target return", "8.1% net"], ["Liquidity", "Immediate, at the standing bid"], ["Minimum", "$500,000"], ["Fees", "1.0% / no carry"]],
      docs: [["PPM", "PDF · 104pp"]], qa: [] },
    { id: "m23", kind: "listed", name: "Samsung Electronics Co., Ltd.", ticker: "005930.KS", fills: "pubeq", cls: "equity",
      ret: "—", retNum: 0, liq: "Immediate", term: "—", min: 1000, avail: "Continuous", fit: 55,
      why: "Already held at $1.98M; Korean technology is 11.0% of the book before adding to it.",
      sector: "Info Tech", geo: "Korea", ccy: "KRW", px: 73500, chg: -0.41,
      overview: "Held already at $1.98M, alongside SK hynix and three other semiconductor exposures.",
      terms: [["Settlement", "T+2"], ["Minimum", "1 share"]], docs: [], qa: [] },
    { id: "m24", kind: "listed", name: "Taiwan Semiconductor Mfg. (ADR)", ticker: "TSM", fills: "pubeq", cls: "equity",
      ret: "—", retNum: 0, liq: "Immediate", term: "—", min: 1000, avail: "Continuous", fit: 54,
      why: "Already held; adds to semiconductor concentration that runs through four other positions.",
      sector: "Info Tech", geo: "Taiwan", ccy: "USD", px: 268.90, chg: 1.47,
      overview: "Held already at $739K.", terms: [["Settlement", "T+1"], ["Minimum", "1 share"]], docs: [], qa: [] },
    { id: "m25", kind: "listed", name: "Vanguard Total World Stock ETF", ticker: "VT", fills: "pubeq", cls: "equity",
      ret: "—", retNum: 0, liq: "Immediate", term: "Open-ended", min: 1000, avail: "Continuous", fit: 57,
      why: "9,800 holdings at 0.06% — the cheapest single line the public sleeve could consolidate into.",
      sector: "Diversified", geo: "Global", ccy: "USD", px: 142.08, chg: 0.21, expense: 0.06,
      overview: "9,800 holdings across 49 markets. The cheapest single line the public sleeve could be consolidated into.",
      terms: [["Settlement", "T+1"], ["Expense ratio", "0.06%"], ["Minimum", "1 share"]], docs: [["Prospectus", "PDF · 78pp"]], qa: [] },
    { id: "m26", kind: "listed", name: "iShares Core MSCI Emerging Markets ETF", ticker: "IEMG", fills: "pubeq", cls: "equity",
      ret: "—", retNum: 0, liq: "Immediate", term: "Open-ended", min: 1000, avail: "Continuous", fit: 60,
      why: "Diversifies a public sleeve that is 62% Korea and US technology, without changing its size.",
      sector: "Diversified", geo: "Emerging Markets", ccy: "USD", px: 64.32, chg: 0.38, expense: 0.09,
      overview: "Emerging market exposure ex-Korea overweight. A swap candidate rather than an addition.",
      terms: [["Settlement", "T+1"], ["Expense ratio", "0.09%"], ["Minimum", "1 share"]], docs: [], qa: [] },
    { id: "m27", kind: "listed", name: "Hyundai Motor Company", ticker: "005380.KS", fills: "pubeq", cls: "equity",
      ret: "—", retNum: 0, liq: "Immediate", term: "—", min: 1000, avail: "Continuous", fit: 52,
      why: "Korean large cap; correlated with the operating company holding that already triggers the concentration flag.",
      sector: "Consumer Disc.", geo: "Korea", ccy: "KRW", px: 248500, chg: 0.92,
      overview: "Included in the domestic universe. Correlation to Hanmi Chemical Holdings over 3 years is 0.61.",
      terms: [["Settlement", "T+2"], ["Minimum", "1 share"]], docs: [], qa: [] },
    { id: "m28", kind: "listed", name: "SPDR Gold Shares", ticker: "GLD", fills: "comm", cls: "real",
      ret: "—", retNum: 0, liq: "Immediate", term: "Open-ended", min: 1000, avail: "Continuous", fit: 70,
      why: "The liquid equivalent of the KRX bullion account, without the storage arrangement.",
      sector: "Precious Metals", geo: "Global", ccy: "USD", px: 412.66, chg: 0.36, expense: 0.40,
      overview: "Physically backed gold. The family holds 340g in KRX custody; GLD is the same exposure without the storage arrangement.",
      terms: [["Settlement", "T+1"], ["Expense ratio", "0.40%"], ["Minimum", "1 share"]], docs: [["Prospectus", "PDF · 58pp"]], qa: [] },
    { id: "m29", kind: "listed", name: "iShares S&P GSCI Commodity-Indexed Trust", ticker: "GSG", fills: "comm", cls: "real",
      ret: "—", retNum: 0, liq: "Immediate", term: "Open-ended", min: 1000, avail: "Continuous", fit: 61,
      why: "Broad commodity exposure; roll cost has averaged −1.8% annually over five years.",
      sector: "Commodities", geo: "Global", ccy: "USD", px: 22.14, chg: -0.22, expense: 0.75,
      overview: "Futures-based broad commodity index.", terms: [["Settlement", "T+1"], ["Expense ratio", "0.75%"]], docs: [], qa: [] },
    { id: "m30", kind: "listed", name: "Hanwha Securities ELS 2026-09 (KOSPI200 / S&P 500 autocall)", ticker: "HWELS2609", fills: "struct", cls: "debt",
      ret: "7.20% p.a. if called", retNum: 7.2, liq: "Immediate", term: "3yr · quarterly observation", min: 100000, avail: "₩60B tranche open", fit: 79,
      why: "A replacement for the 2024-11 note, which is likely to autocall in November.",
      sector: "Structured", geo: "Korea", ccy: "KRW",
      hanwha: true, anchor: "Issued by Hanwha Securities. Hanwha Life holds ₩200B of the same series.",
      overview: "Three-year autocallable note on KOSPI200 and S&P 500 with a 55% knock-in barrier, 7.2% annual coupon if called at any quarterly observation. Principal is at risk below the barrier at maturity.",
      terms: [["Coupon", "7.20% p.a. if called"], ["Barrier", "55% knock-in, observed at maturity"], ["Observation", "Quarterly, 90/90/85/85/80/80…"], ["Minimum", "₩100,000,000"], ["Early redemption", "Quarterly at market value"]],
      docs: [["Term sheet", "PDF · 10pp"], ["Risk disclosure", "PDF · 18pp"], ["Backtest", "PDF · 6pp"]],
      qa: [["What is the historical knock-in frequency?", "On this barrier and underlier pair, 4.1% of rolling 3-year windows since 2001 ended below the barrier."]] },
    { id: "m31", kind: "listed", name: "Hanwha Principal-Protected USD/KRW Note 2026-08", ticker: "HWFX2608", fills: "struct", cls: "debt",
      ret: "0–9.5% range", retNum: 4.5, liq: "Immediate", term: "2yr · principal protected", min: 100000, avail: "₩25B tranche open", fit: 73,
      why: "Expresses a KRW view while protecting principal — relevant given the −0.8pp QTD currency drag.",
      sector: "Structured", geo: "Korea", ccy: "KRW",
      hanwha: true, anchor: "Issued by Hanwha Securities.",
      overview: "Two-year note returning principal plus 60% of any USD/KRW appreciation above 1,380, capped at 9.5% total. Principal protected by the issuer's credit.",
      terms: [["Participation", "60% of USD/KRW upside above 1,380"], ["Cap", "9.5% total return"], ["Protection", "100% of principal at maturity, issuer credit"], ["Minimum", "₩100,000,000"]],
      docs: [["Term sheet", "PDF · 8pp"], ["Risk disclosure", "PDF · 16pp"]], qa: [] },
    { id: "m32", kind: "listed", name: "KODEX Korea REIT ETF", ticker: "329200.KS", fills: "re", cls: "real",
      ret: "5.8% dividend", retNum: 5.8, liq: "Immediate", term: "Open-ended", min: 1000, avail: "Continuous", fit: 49,
      why: "Listed Korean REITs — duplicates direct property the family already owns outright.",
      sector: "Real Estate", geo: "Korea", ccy: "KRW", px: 5840, chg: 0.17, expense: 0.09,
      overview: "Basket of listed Korean REITs. The family already owns Korean property directly.",
      terms: [["Settlement", "T+2"], ["Expense ratio", "0.09%"]], docs: [], qa: [] },
    { id: "m33", kind: "listed", name: "iShares TIPS Bond ETF", ticker: "TIP", fills: "sov", cls: "debt",
      ret: "2.15% real", retNum: 2.15, liq: "Immediate", term: "Open-ended", min: 1000, avail: "Continuous", fit: 83,
      why: "The only explicit inflation hedge available to the fixed income sleeve.",
      sector: "Government", geo: "United States", ccy: "USD", px: 108.20, chg: 0.09, expense: 0.19, dur: 6.6,
      overview: "Inflation-protected Treasuries — the only explicit inflation hedge in the fixed income sleeve.",
      terms: [["Settlement", "T+1"], ["Expense ratio", "0.19%"], ["Real yield", "2.15%"], ["Minimum", "1 share"]],
      docs: [["Prospectus", "PDF · 82pp"]], qa: [] },
  ];

  /* ----------------------------------------------------------- secondary */
  /* Bulletin board. Inventory is positions originated on Barbell; listed
     securities never appear, because an exchange already prices those. */
  const secondary = [
    { id: "s01", instrument: "Foundry Venture Partners VII, L.P. — LP interest", sub: "vc", cls: "equity", vintage: "2024",
      nav: 1240000, size: 620000, askPct: 92.0, indicative: [88, 95], seller: "Member #0147", days: 14, status: "Open",
      rationale: "Rebalancing toward income-producing assets ahead of a generational transfer.",
      unfunded: 820000, manager: "Foundry Venture Partners",
      account: [["2024-03-14", "Commitment", 2500000], ["2024-04-02", "Capital call #1", 625000], ["2024-11-18", "Capital call #2", 500000],
                ["2025-06-30", "Capital call #3", 400000], ["2026-06-30", "NAV mark", 1240000]] },
    { id: "s02", instrument: "Northgate Data Center Credit Facility — participation", sub: "pcred", cls: "debt", vintage: "2024",
      nav: 2000000, size: 1000000, askPct: 99.5, indicative: [98, 101], seller: "Member #0032", days: 6, status: "Open",
      rationale: "Portfolio reached its single-borrower limit following Facility II.",
      manager: "Northgate Capital Partners",
      account: [["2024-06-28", "Funded", 2000000], ["2025-06-30", "Coupon received", 184000], ["2026-06-30", "Coupon received", 188000], ["2026-08-31", "NAV mark", 2000000]] },
    { id: "s03", instrument: "Aeris Aerospace — Series E block", sub: "preipo", cls: "equity", vintage: "2023",
      nav: 1560000, size: 780000, askPct: 104.0, indicative: [99, 108], seller: "Member #0209", days: 3, status: "Open",
      rationale: "Taking partial liquidity ahead of the expected 2028 listing.",
      manager: "Direct block",
      account: [["2023-05-19", "Purchase", 900000], ["2025-11-30", "Series F mark-up", 1400000], ["2026-08-31", "NAV mark", 1560000]] },
    { id: "s04", instrument: "Sunrise Growth Partners IV, L.P. — LP interest", sub: "pe", cls: "equity", vintage: "2023",
      nav: 980000, size: 490000, askPct: 88.5, indicative: [85, 93], seller: "Member #0401", days: 31, status: "Open",
      rationale: "Consolidating manager relationships.", unfunded: 310000, manager: "Sunrise Growth Partners",
      account: [["2023-09-01", "Commitment", 1500000], ["2023-10-15", "Capital call #1", 600000], ["2024-09-30", "Capital call #2", 450000], ["2026-06-30", "NAV mark", 980000]] },
    { id: "s05", instrument: "Pacific Core Real Estate Fund IV — units", sub: "re", cls: "real", vintage: "2022",
      nav: 1420000, size: 710000, askPct: 95.0, indicative: [93, 98], seller: "Member #0147", days: 22, status: "Open",
      rationale: "Reducing Asia-Pacific property weight.", unfunded: 350000, manager: "Pacific Core",
      account: [["2022-11-04", "Commitment", 2000000], ["2023-01-20", "Capital call #1", 800000], ["2024-04-18", "Capital call #2", 600000],
                ["2025-09-30", "Distribution", -180000], ["2026-06-30", "NAV mark", 1420000]] },
    { id: "s06", instrument: "Songdo Hyperscale Data Center Platform — co-invest units", sub: "infra", cls: "real", vintage: "2025",
      nav: 2340000, size: 1170000, askPct: 101.5, indicative: [99, 104], seller: "Member #0088", days: 9, status: "Open",
      rationale: "Balance sheet rotation; no view on the asset.", manager: "Hanwha Asset Management",
      account: [["2025-02-27", "Funded", 2100000], ["2026-06-30", "NAV mark", 2340000]] },
    { id: "s07", instrument: "Meridian Direct Lending Fund II — units", sub: "pcred", cls: "debt", vintage: "2023",
      nav: 1320000, size: 660000, askPct: 97.5, indicative: [96, 99], seller: "Member #0315", days: 41, status: "Open",
      rationale: "Funding a capital call elsewhere.", manager: "Meridian Credit",
      account: [["2023-11-30", "Subscription", 1250000], ["2025-12-31", "Income reinvested", 70000], ["2026-06-30", "NAV mark", 1320000]] },
    { id: "s08", instrument: "Woori Industrial Buyout Co-Invest II — participation", sub: "pe", cls: "equity", vintage: "2022",
      nav: 1848698, size: 924000, askPct: 93.0, indicative: [90, 96], seller: "Member #0032", days: 18, status: "Open",
      rationale: "Exit expected 2029; seller's horizon is shorter.", manager: "Woori PE",
      account: [["2022-05-18", "Funded", 1400000], ["2025-06-30", "NAV mark", 1690000], ["2026-06-30", "NAV mark", 1848698]] },
    { id: "s09", instrument: "Daol Ventures Korea Fund III — LP interest", sub: "vc", cls: "equity", vintage: "2023",
      nav: 680000, size: 340000, askPct: 84.0, indicative: [80, 89], seller: "Member #0512", days: 56, status: "Open",
      rationale: "Domestic venture exposure no longer required.", unfunded: 320000, manager: "Daol Investment",
      account: [["2023-02-09", "Commitment", 1000000], ["2023-03-30", "Capital call #1", 400000], ["2024-08-14", "Capital call #2", 280000], ["2026-06-30", "NAV mark", 680000]] },
    { id: "s10", instrument: "Hanwha Korea Logistics REIT Co-Invest — units", sub: "re", cls: "real", vintage: "2024",
      nav: 1620000, size: 810000, askPct: 98.0, indicative: [96, 100], seller: "Member #0088", days: 2, status: "Open",
      rationale: "Rotating into the Co-Invest II vehicle.", manager: "Hanwha Asset Management",
      account: [["2024-09-10", "Funded", 1500000], ["2026-06-30", "NAV mark", 1620000]] },
    { id: "s11", instrument: "Helios AI Infrastructure SPV I — units", sub: "vc", cls: "equity", vintage: "2025",
      nav: 540000, size: 270000, askPct: 118.0, indicative: [110, 125], seller: "Member #0209", days: 11, status: "Settled",
      rationale: "Partial realisation after the Series D mark-up.", manager: "Helios Partners",
      account: [["2025-04-22", "Funded", 400000], ["2026-06-30", "NAV mark", 540000]] },
    { id: "s12", instrument: "Seoul Station Retail Co-Invest — participation", sub: "re", cls: "real", vintage: "2021",
      nav: 890000, size: 445000, askPct: 79.0, indicative: [74, 84], seller: "Member #0401", days: 88, status: "Open",
      rationale: "Asset has underperformed; seller is exiting the sector.", manager: "Koramco",
      account: [["2021-07-01", "Funded", 1100000], ["2024-06-30", "NAV mark", 960000], ["2026-06-30", "NAV mark", 890000]] },
  ];

  /* Two listings open with a bid already sitting with the seller. A bid does
     not change the listing's state — it stays open to anyone taking the ask. */
  const bidsSeed = [
    { id: "b1", listingId: "s04", price: 85.0, size: 300000, ts: "2026-09-15T10:20:00+09:00",
      bidder: "Member #0233", status: "Submitted" },
    { id: "b2", listingId: "s07", price: 96.0, size: 400000, ts: "2026-09-11T14:05:00+09:00",
      bidder: "Member #0512", status: "Submitted" },
  ];

  /* ------------------------------------------------------------ approvals */
  const approvalsSeed = [
    { id: "a1", ts: "2026-09-17T11:22:00+09:00", from: "successor", type: "Commitment",
      title: "Commit $1,000,000 to Northgate Data Center Credit Facility II",
      target: "m06", amount: 1000000, sleeve: "core",
      rationale: "9.2% senior secured on the same security package as the Facility I position we already hold, which is performing. Above the Alpha sleeve's $760,000 capacity, so it is submitted rather than executed.",
      status: "pending" },
    { id: "a2", ts: "2026-09-12T09:05:00+09:00", from: "successor", type: "Trade",
      title: "Buy $420,000 iShares 7-10 Year Treasury Bond ETF (IEF) in Core",
      target: "m03", amount: 420000, sleeve: "core",
      rationale: "The fixed income sleeve is short duration against the policy. This is the fastest instrument to lengthen it while a direct ladder is built.",
      status: "pending" },
    { id: "a3", ts: "2026-08-28T16:40:00+09:00", from: "successor", type: "Commitment",
      title: "Commit $250,000 to Helios AI Infrastructure SPV II",
      target: "m21", amount: 250000, sleeve: "alpha",
      rationale: "Follow-on to SPV I at a 1.35x mark.",
      status: "approved", decidedTs: "2026-08-29T08:15:00+09:00", comment: "Approved. Keep single-company exposure under 5% of the sleeve." },
    { id: "a4", ts: "2026-08-14T13:12:00+09:00", from: "successor", type: "Trade",
      title: "Sell $600,000 Apple Inc. 3.85% 2043 from Core",
      target: "p23", amount: 600000, sleeve: "core",
      rationale: "Duration is long and the position is below cost.",
      status: "returned", decidedTs: "2026-08-15T10:02:00+09:00",
      comment: "Returned. Selling at a loss to fund a position we already hold twice over is the wrong order of operations. Resubmit with the proceeds directed to sovereign duration." },
  ];

  /* ------------------------------------------------------------- activity */
  const activitySeed = [
    { id: "l1", ts: "2026-09-18T16:31:00+09:00", who: "successor", kind: "Valuation", text: "Updated valuation for Viva Republica (Toss) common — 2023 block", detail: "No change to carrying value; flagged as stale pending a Q3 statement." },
    { id: "l2", ts: "2026-09-17T11:22:00+09:00", who: "successor", kind: "Proposal", text: "Submitted proposal — Commit $1,000,000 to Northgate Data Center Credit Facility II", detail: "Exceeds Alpha sleeve capacity of $760,000. Routed to the Principal." },
    { id: "l3", ts: "2026-09-16T10:14:00+09:00", who: "principal", kind: "Mandate", text: "Confirmed target allocation — Balanced (90/10)", detail: "Equity 35.0 · Debt 40.0 · Real Assets 18.0 · Cash 7.0" },
    { id: "l4", ts: "2026-09-12T09:05:00+09:00", who: "successor", kind: "Proposal", text: "Submitted proposal — Buy $420,000 IEF in Core", detail: "A Core sleeve trade — only the Principal can approve it." },
    { id: "l5", ts: "2026-09-08T14:48:00+09:00", who: "principal", kind: "Trade", text: "Bought 2,000 shares NVIDIA Corporation", detail: "$428,000 at $214.00. Core sleeve. Settled same day." },
    { id: "l6", ts: "2026-09-02T09:30:00+09:00", who: "system", kind: "Capital call", text: "Capital call received — Foundry Venture Partners VII, $1,100,000", detail: "Due 28 October 2026. Added to the liquidity projection." },
    { id: "l7", ts: "2026-08-31T18:00:00+09:00", who: "system", kind: "Valuation", text: "Hanwha-sourced NAVs refreshed for 9 positions", detail: "As of 30 June 2026 capital accounts." },
    { id: "l8", ts: "2026-08-29T08:15:00+09:00", who: "principal", kind: "Approval", text: "Approved proposal — Commit $250,000 to Helios AI Infrastructure SPV II", detail: "Comment: keep single-company exposure under 5% of the sleeve." },
    { id: "l9", ts: "2026-08-15T10:02:00+09:00", who: "principal", kind: "Approval", text: "Returned proposal — Sell $600,000 Apple 3.85% 2043", detail: "Returned with comment for resubmission." },
    { id: "l10", ts: "2026-08-04T11:40:00+09:00", who: "successor", kind: "Commitment", text: "Committed $400,000 to the Sequoia Capital LP tranche", detail: "Within the conviction sleeve. Executed directly." },
    { id: "l11", ts: "2026-07-22T15:05:00+09:00", who: "principal", kind: "Onboarding", text: "Portfolio ingestion completed — 42 positions mapped", detail: "3 source files. 2 exceptions resolved by the Principal." },
  ];

  /* ------------------------------------------------ operations (internal) */
  const opsLedger = [
    { id: "x1", ts: "2026-09-08T14:48:12+09:00", instr: "NVDA", desc: "NVIDIA Corporation", qty: "2,000", ref: "BBL-2026-0908-0041", finality: "2026-09-08T14:48:14+09:00", state: "Final" },
    { id: "x2", ts: "2026-08-04T11:40:02+09:00", instr: "SEQ-LP-T", desc: "Sequoia Capital LP tranche", qty: "$400,000", ref: "BBL-2026-0804-0018", finality: "2026-08-04T11:40:04+09:00", state: "Final" },
    { id: "x3", ts: "2026-06-30T23:59:58+09:00", instr: "SONGDO-I", desc: "Songdo Hyperscale DC Platform — NAV update", qty: "—", ref: "BBL-2026-0630-0902", finality: "2026-06-30T23:59:59+09:00", state: "Final" },
    { id: "x4", ts: "2026-05-22T10:02:31+09:00", instr: "HELIOS-I", desc: "Helios AI Infrastructure SPV I", qty: "$400,000", ref: "BBL-2026-0522-0007", finality: "2026-05-22T10:02:33+09:00", state: "Final" },
    { id: "x5", ts: "2026-01-10T09:14:07+09:00", instr: "HKLR-I", desc: "Hanwha Korea Logistics REIT Co-Invest", qty: "$1,500,000", ref: "BBL-2026-0110-0003", finality: "2026-01-10T09:14:09+09:00", state: "Final" },
  ];

  const referrals = { sent: 3, joined: 1,
    invites: [
      { id: "r1", to: "Member of Daesan family office", deal: "Northgate Data Center Credit Facility II", ts: "2026-09-10", state: "Viewed" },
      { id: "r2", to: "S.H. Chung", deal: "Sequoia Capital — LP tranche", ts: "2026-08-22", state: "Joined" },
      { id: "r3", to: "Kwon family office", deal: "Songdo Hyperscale DC Platform II", ts: "2026-07-30", state: "Committed" },
    ] };

  const liquidityAssumptions = { monthlyIncome: 160000, monthlySpend: 205000, reserveFloor: 1000000 };

  window.BB = window.BB || {};
  BB.data = {
    KRW, TODAY, family, accounts, classes, subs, positions,
    uploadFiles, ingestSteps, exceptions, mandates, survey, modelPortfolios,
    capitalCalls, distributions, benchmark, performance, attribution, modelGoals, ALT_SUBS,
    sourceTypes, dueDiligence, anchorShelf, cashFund, exitPct, advanceRates, creditTerms, SHELF_FLOOR, SHELF_CEIL, themes, modelClasses, modelExcuses, buckets, bucketPresets, bucketMix, RISK_BASE, sleeves, allocGroups, allocLines, expectedReturn, expectedVol, classCorr, idiosyncraticVol,
    market, secondary, secondaryTrades, bidsSeed, approvalsSeed, activitySeed, opsLedger, referrals, liquidityAssumptions,
  };
})();
