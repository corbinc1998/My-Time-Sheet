import { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import './styles.css';

const characters = [
  "Mario","Luigi","Peach","Yoshi","Bowser","Toad","Toadette","Koopa Troopa",
  "Wario","Waluigi","Baby Mario","Baby Luigi","Baby Peach","Baby Daisy",
  "Baby Rosalina","Pauline","Shy Guy","Donkey Kong","Daisy","Rosalina",
  "Lakitu","Birdo","King Boo","Bowser Jr.","Goomba","Wiggler","Dry Bones",
  "Hammer Bro","Nabbit","Piranha Plant","Sidestepper","Monty Mole","Stingby",
  "Penguin","Cheep Cheep","Cow","Para-Biddybud","Pokey","Snowman","Spike",
  "Cataquack","Pianta","Rocky Wrench","Conkdor","Peepa","Swoop","Fish Bone",
  "Coin Coffer","Dolphin","Chargin' Chuck"
];

const vehicles = [
  "Standard Pipe","Rally Kart","Standard Bike","Rally Bike","Plushbuggy",
  "Baby Blooper","Cute Scoot","Mach Rocket","Zoom Buggy","Chargin' Truck",
  "Hyper Pipe","Funky Dorrie","Hot Rod","Ribbit Revster","Tune Thumper",
  "Junkyard Hog","Roadster Royale","B Dasher","W-Twin Chopper","Lobster Roller",
  "Biddybuggy","Tiny Titan","Dread Sled","Stellar Sled","Reel Racer","Bumble V",
  "Fin Twin","R.O.B. H.O.G.","Carpet Flyer","Cloud 9","Dolphin Dasher",
  "Blastronaut III","Big Horn","Lil' Dumpy","Loco Moto","Mecha Trike",
  "Pipe Frame","Billdozer","Rallygator","Bowser Bruiser"
];

const tracks = [
  "Acorn Heights","Airship Fortress","Boo Cinema","Bowser's Castle",
  "Cheep Cheep Falls","Choco Mountain","Crown City","Dandelion Depths",
  "Desert Hills","Dino Dino Jungle","DK Pass","DK Spaceport",
  "Dry Bones Burnout","Faraway Oasis","Great ? Block Ruins",
  "Koopa Troopa Beach","Mario Bros. Circuit","Mario Circuit",
  "Moo Moo Meadows","Peach Beach","Peach Stadium","Rainbow Road",
  "Salty Salty Speedway","Shy Guy Bazaar","Sky-High Sundae",
  "Starview Peak","Toad's Factory","Wario Stadium",
  "Wario's Galleon","Whistlestop Summit"
];

/* ── Searchable Dropdown ── */
const SearchableDropdown = ({ options, value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value || "");
  const ref = useRef(null);

  useEffect(() => { setSearch(value || ""); }, [value]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="dropdown-wrapper">
      <input
        value={search}
        placeholder={placeholder}
        onChange={(e) => { setSearch(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="input-field"
      />
      {open && filtered.length > 0 && (
        <div className="dropdown-menu">
          {filtered.map(o => (
            <div
              key={o}
              onClick={() => { onChange(o); setSearch(o); setOpen(false); }}
              className={`dropdown-item ${o === value ? 'active' : ''}`}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Time helpers ── */
const timeToMs = (s) => {
  if (!s || !s.trim()) return 0;
  const p = s.split(":");
  let min = 0, sec;
  if (p.length === 2) { min = parseInt(p[0]) || 0; sec = p[1]; }
  else if (p.length === 1) sec = p[0];
  else return 0;
  const sp = sec.split(".");
  return min * 60000 + (parseInt(sp[0]) || 0) * 1000 + (parseInt(sp[1]) || 0);
};

const msToTime = (ms) => {
  if (ms <= 0) return "0.000";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const ml = ms % 1000;
  return m > 0
    ? `${m}:${String(s).padStart(2, "0")}.${String(ml).padStart(3, "0")}`
    : `${s}.${String(ml).padStart(3, "0")}`;
};

const fmt = (t) => {
  if (!t) return "--:--.---";
  const ms = timeToMs(t);
  return ms <= 0 ? "--:--.---" : msToTime(ms);
};

/* ── Main Component ── */
export default function MarioKartTimeTrials() {
  const [trials, setTrials] = useState([]);
  const [cur, setCur] = useState({ track: "", character: "", vehicle: "", lap1: "", lap2: "", finishedTime: "" });
  const [filter, setFilter] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("timeTrials")) || [];
      setTrials(saved);
    } catch { /* ignore */ }
  }, []);

  const save = (t) => { setTrials(t); localStorage.setItem("timeTrials", JSON.stringify(t)); };

  const lap3 = useMemo(() => {
    const f = timeToMs(cur.finishedTime), l1 = timeToMs(cur.lap1), l2 = timeToMs(cur.lap2);
    if (f > 0 && l1 > 0 && l2 > 0 && f - l1 - l2 > 0) return msToTime(f - l1 - l2);
    return "";
  }, [cur.finishedTime, cur.lap1, cur.lap2]);

  const addTrial = () => {
    if (!cur.track || !cur.character || !cur.vehicle || !cur.lap1 || !cur.lap2 || !cur.finishedTime) return;
    const n = { ...cur, lap3, id: Date.now(), date: new Date().toLocaleDateString() };
    save([...trials, n]);
    setCur({ track: "", character: "", vehicle: "", lap1: "", lap2: "", finishedTime: "" });
  };

  const bestSplits = useMemo(() => {
    const s = {};
    trials.forEach(t => {
      if (!s[t.track]) s[t.track] = { lap1: null, lap2: null, lap3: null };
      const b = s[t.track];
      if (!b.lap1 || timeToMs(t.lap1) < timeToMs(b.lap1.time))
        b.lap1 = { time: t.lap1, char: t.character, veh: t.vehicle, date: t.date };
      if (!b.lap2 || timeToMs(t.lap2) < timeToMs(b.lap2.time))
        b.lap2 = { time: t.lap2, char: t.character, veh: t.vehicle, date: t.date };
      if (t.lap3 && (!b.lap3 || timeToMs(t.lap3) < timeToMs(b.lap3.time)))
        b.lap3 = { time: t.lap3, char: t.character, veh: t.vehicle, date: t.date };
    });
    return s;
  }, [trials]);

  const filteredTrials = useMemo(() => {
    if (!filter) return trials;
    return trials.filter(t => t.track === filter);
  }, [trials, filter]);

  /* ── XLSX Export ── */
  const exportXLSX = () => {
    const wb = XLSX.utils.book_new();
    const byTrack = {};
    trials.forEach(t => {
      if (!byTrack[t.track]) byTrack[t.track] = [];
      byTrack[t.track].push(t);
    });

    const summaryRows = tracks.filter(tr => byTrack[tr]).map(tr => {
      const b = bestSplits[tr] || {};
      const bestFinishMs = byTrack[tr].reduce((best, t) => {
        const ms = timeToMs(t.finishedTime);
        return ms > 0 && (!best || ms < best) ? ms : best;
      }, null);
      return {
        Track: tr,
        Runs: byTrack[tr].length,
        "Best Lap 1": b.lap1 ? fmt(b.lap1.time) : "",
        "Best Lap 2": b.lap2 ? fmt(b.lap2.time) : "",
        "Best Lap 3": b.lap3 ? fmt(b.lap3.time) : "",
        "Best Split Sum": b.lap1 && b.lap2 && b.lap3
          ? msToTime(timeToMs(b.lap1.time) + timeToMs(b.lap2.time) + timeToMs(b.lap3.time)) : "",
        "Best Finish": bestFinishMs ? msToTime(bestFinishMs) : ""
      };
    });

    if (summaryRows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(summaryRows);
      ws["!cols"] = [{ wch: 24 }, { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws, "Summary");
    }

    Object.entries(byTrack).sort(([a], [b]) => a.localeCompare(b)).forEach(([track, runs]) => {
      const rows = runs.map(r => ({
        Date: r.date || "", Character: r.character, Vehicle: r.vehicle,
        "Lap 1": fmt(r.lap1), "Lap 2": fmt(r.lap2), "Lap 3": fmt(r.lap3), Finished: fmt(r.finishedTime)
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [{ wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, ws, track.length > 31 ? track.slice(0, 31) : track);
    });

    XLSX.writeFile(wb, "mario-kart-time-trials.xlsx");
  };

  const exportJSON = () => {
    const b = new Blob([JSON.stringify(trials, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "time-trials.json"; a.click();
  };

  const exportCSV = () => {
    const h = "track,character,vehicle,lap1,lap2,lap3,finishedTime,date";
    const r = trials.map(t => `${t.track},${t.character},${t.vehicle},${t.lap1},${t.lap2},${t.lap3||""},${t.finishedTime},${t.date||""}`);
    const b = new Blob([[h, ...r].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "time-trials.csv"; a.click();
  };

  const importFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        let imp;
        if (file.name.endsWith(".json")) imp = JSON.parse(ev.target.result);
        else if (file.name.endsWith(".csv")) {
          const lines = ev.target.result.trim().split("\n");
          const hdr = lines[0].split(",");
          imp = lines.slice(1).filter(l => l.trim()).map(l => {
            const v = l.split(","); const o = {};
            hdr.forEach((h, i) => { o[h.trim()] = v[i]?.trim() || ""; }); return o;
          });
        }
        if (Array.isArray(imp) && imp.length > 0) {
          save(imp.map((t, i) => ({ ...t, id: t.id || Date.now() + i })));
        } else {
          alert("No data found in file.");
        }
      } catch (err) { alert("Import failed: " + err.message); }
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const canAdd = cur.track && cur.character && cur.vehicle && cur.lap1 && cur.lap2 && cur.finishedTime;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-flag">🏁</div>
        <h1 className="header-title">Mario Kart World</h1>
        <p className="header-sub">Time Trial Tracker</p>
      </header>

      <div className="main-content">
        {/* Add Trial */}
        <section className="card card-entry">
          <div className="card-label">New Entry</div>
          <div className="row-3">
            <SearchableDropdown options={tracks} value={cur.track} onChange={(v) => setCur(p => ({ ...p, track: v }))} placeholder="Track" />
            <SearchableDropdown options={characters} value={cur.character} onChange={(v) => setCur(p => ({ ...p, character: v }))} placeholder="Character" />
            <SearchableDropdown options={vehicles} value={cur.vehicle} onChange={(v) => setCur(p => ({ ...p, vehicle: v }))} placeholder="Vehicle" />
          </div>
          <div className="row-3">
            <div className="field-group">
              <label className="field-label">Lap 1</label>
              <input className="input-field" value={cur.lap1} onChange={(e) => setCur(p => ({ ...p, lap1: e.target.value }))} placeholder="SS.mmm" />
            </div>
            <div className="field-group">
              <label className="field-label">Lap 2</label>
              <input className="input-field" value={cur.lap2} onChange={(e) => setCur(p => ({ ...p, lap2: e.target.value }))} placeholder="SS.mmm" />
            </div>
            <div className="field-group">
              <label className="field-label">Finish</label>
              <input className="input-field" value={cur.finishedTime} onChange={(e) => setCur(p => ({ ...p, finishedTime: e.target.value }))} placeholder="M:SS.mmm" />
            </div>
          </div>
          <div className="row-add">
            <div className="field-group lap3-display">
              <label className="field-label">Lap 3</label>
              <span className="lap3-value">{lap3 ? fmt(lap3) : "—"}</span>
            </div>
            <button className={`btn btn-add ${canAdd ? '' : 'btn-disabled'}`} onClick={addTrial}>
              Add Trial
            </button>
          </div>
        </section>

        {/* Import / Export */}
        <section className="card card-io">
          <div className="io-row">
            <button className="btn btn-xlsx" onClick={exportXLSX}>Export .xlsx</button>
            <button className="btn btn-secondary" onClick={exportJSON}>Export JSON</button>
            <button className="btn btn-secondary" onClick={exportCSV}>Export CSV</button>
            <label className="btn btn-secondary btn-import">
              Import
              <input type="file" accept=".json,.csv" onChange={importFile} hidden />
            </label>
          </div>
        </section>

        {/* Filter */}
        {trials.length > 0 && (
          <div className="filter-bar">
            <SearchableDropdown
              options={["All Tracks", ...Array.from(new Set(trials.map(t => t.track))).sort()]}
              value={filter || "All Tracks"}
              onChange={(v) => setFilter(v === "All Tracks" ? "" : v)}
              placeholder="Filter by track..."
            />
            <span className="trial-count">{filteredTrials.length} run{filteredTrials.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Trials List */}
        <section className="trials-list">
          {filteredTrials.length > 0 ? filteredTrials.slice().reverse().map((t, i) => (
            <div key={t.id} className="trial-row" style={{ animationDelay: `${i * 0.03}s` }}>
              <div className="trial-top">
                <div>
                  <span className="trial-track">{t.track}</span>
                  <span className="trial-meta">{t.character} · {t.vehicle}{t.date ? ` · ${t.date}` : ""}</span>
                </div>
                <button className="btn-delete" onClick={() => save(trials.filter(x => x.id !== t.id))} title="Delete">×</button>
              </div>
              <div className="trial-splits">
                <div className="split">
                  <span className="split-label">L1</span>
                  <span className="split-time">{fmt(t.lap1)}</span>
                </div>
                <div className="split">
                  <span className="split-label">L2</span>
                  <span className="split-time">{fmt(t.lap2)}</span>
                </div>
                <div className="split">
                  <span className="split-label">L3</span>
                  <span className="split-time">{fmt(t.lap3)}</span>
                </div>
                <div className="split split-finish">
                  <span className="split-label">FIN</span>
                  <span className="split-time">{fmt(t.finishedTime)}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="empty-state">
              <span className="empty-icon">🏎️</span>
              <p>No runs yet — add your first time trial above!</p>
            </div>
          )}
        </section>

        {/* Best Splits */}
        {Object.keys(bestSplits).length > 0 && (
          <section className="best-section">
            <h2 className="section-title">Personal Bests</h2>
            {Object.entries(bestSplits).sort(([a], [b]) => a.localeCompare(b)).map(([track, s]) => {
              const sum = s.lap1 && s.lap2 && s.lap3
                ? msToTime(timeToMs(s.lap1.time) + timeToMs(s.lap2.time) + timeToMs(s.lap3.time)) : null;
              return (
                <div key={track} className="best-card">
                  <div className="best-track">{track}</div>
                  <div className="best-laps">
                    {[["L1", s.lap1], ["L2", s.lap2], ["L3", s.lap3]].map(([label, d]) => (
                      <div key={label} className="best-lap">
                        <span className="best-lap-label">{label}</span>
                        <span className="best-lap-time">{d ? fmt(d.time) : "—"}</span>
                        {d && <span className="best-lap-info">{d.char} · {d.veh}</span>}
                      </div>
                    ))}
                  </div>
                  {sum && <div className="best-sum">Split sum: {sum}</div>}
                </div>
              );
            })}
          </section>
        )}

        <footer className="footer">
          {trials.length} total run{trials.length !== 1 ? 's' : ''} logged
        </footer>
      </div>
    </div>
  );
}