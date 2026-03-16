const DEFAULT_SONGS = [
  { title:"Island In The Sun", artist:"Weezer", members:{ vox:["Michaela M.","Chris H."], guitar:["Alison B.","Chris H.","Maria W."], bass:["Coleman T."], drums:["Ilia V."], keys:[], aux_perc:[] }},
  { title:"A-Punk", artist:"Vampire Weekend", members:{ vox:["Seth N.","Alison B."], guitar:["Artem S.","Christian K."], bass:["Tom K."], drums:["Bex L."], keys:["David K."], aux_perc:[] }},
  { title:"Icky Thump", artist:"The White Stripes", members:{ vox:["Jocelyn L."], guitar:["John K."], bass:["Hex K."], drums:["Bex L."], keys:["David K."], aux_perc:[] }},
  { title:"Last Nite", artist:"The Strokes", members:{ vox:["David K."], guitar:["Dimitry K.","Artem S."], bass:["Trevor W."], drums:["John K."], keys:[], aux_perc:[] }},
  { title:"The Pretender", artist:"Foo Fighters", members:{ vox:["Jocelyn L.","Chris H.","Jen B."], guitar:["Christian K.","Dimitry K.","Chris H."], bass:["Trevor W."], drums:["Jim H."], keys:[], aux_perc:[] }},
  { title:"That's What You Get", artist:"Paramore", members:{ vox:["Alison B.","Michaela M.","Jen B."], guitar:["John K.","Artem S."], bass:["Hex K."], drums:["Jim H."], keys:[], aux_perc:[] }},
  { title:"The Middle", artist:"Jimmy Eat World", members:{ vox:["Michaela M.","Seth N."], guitar:["Christian K.","Seth N.","Maria W."], bass:["Coleman T."], drums:["Ilia V."], keys:[], aux_perc:["Bex L."] }},
  { title:"Crazy", artist:"Gnarls Barkley", members:{ vox:["Michaela M."], guitar:["Chris H.","Alison B.","Maria W."], bass:["Trevor W."], drums:["Ilia V."], keys:["David K."], aux_perc:[] }},
  { title:"Joker And The Thief", artist:"Wolfmother", members:{ vox:["Jen B.","Michaela M.","Jocelyn L."], guitar:["Dimitry K.","Christian K."], bass:["Hex K."], drums:["Bex L."], keys:["Jim H."], aux_perc:[] }},
  { title:"Mr. Brightside", artist:"The Killers", members:{ vox:["David K."], guitar:["Artem S.","Alison B."], bass:["Coleman T."], drums:["Jim H."], keys:["John K."], aux_perc:[] }},
  { title:"Snow (Hey Oh)", artist:"Red Hot Chili Peppers", members:{ vox:["Chris H.","Jen B.","Michaela M."], guitar:["Christian K.","Chris H."], bass:["Trevor W."], drums:["Bex L."], keys:["Jim H."], aux_perc:[] }},
  { title:"Take Me Out", artist:"Franz Ferdinand", members:{ vox:["Seth N.","Hex K."], guitar:["John K.","Dimitry K."], bass:["Tom K."], drums:["Ilia V."], keys:[], aux_perc:[] }},
  { title:"Are You Gonna Be My Girl", artist:"Jet", members:{ vox:["Jocelyn L."], guitar:["Artem S.","Alison B."], bass:["Coleman T."], drums:["Jim H."], keys:[], aux_perc:["Ilia V."] }},
  { title:"Uprising", artist:"Muse", members:{ vox:["Jen B.","Hex K."], guitar:["Christian K.","Seth N.","Maria W."], bass:["Tom K."], drums:["Bex L."], keys:["David K."], aux_perc:[] }}
];

function app() {
  return {
    ROLES: ["vox", "guitar", "bass", "drums", "keys", "aux_perc"],
    ROLE_LABELS: { vox: "Vocals", guitar: "Guitar", bass: "Bass", drums: "Drums", keys: "Keys", aux_perc: "Aux / Perc" },

    tab: "musicians",
    musicians: [],
    songs: [],
    excluded: [],
    newMusician: "",
    editingIndex: -1,
    songForm: null,
    results: null,

    // ── Lifecycle ──────────────────────────────────────────────────────

    init() {
      if (!localStorage.getItem("rock_init")) {
        const names = new Set();
        for (const s of DEFAULT_SONGS)
          for (const arr of Object.values(s.members))
            for (const m of arr) names.add(m);
        this.musicians = [...names].sort().map(name => ({ name, weight: 1 }));
        this.songs = JSON.parse(JSON.stringify(DEFAULT_SONGS));
        this.persist();
        localStorage.setItem("rock_init", "1");
      } else {
        this.load();
      }
    },

    load() {
      const raw = this._read("musicians", []);
      if (raw.length && typeof raw[0] === "string") {
        this.musicians = raw.map(name => ({ name, weight: 1 }));
      } else {
        this.musicians = raw;
      }
      this.songs = this._read("songs", []);
      this.excluded = this._read("excluded", []);
    },

    persist() {
      localStorage.setItem("musicians", JSON.stringify(this.musicians));
      localStorage.setItem("songs", JSON.stringify(this.songs));
      localStorage.setItem("excluded", JSON.stringify(this.excluded));
    },

    _read(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },

    _saveMusicians() { localStorage.setItem("musicians", JSON.stringify(this.musicians)); },
    _saveSongs() { localStorage.setItem("songs", JSON.stringify(this.songs)); },
    _saveExcluded() { localStorage.setItem("excluded", JSON.stringify(this.excluded)); },

    // ── Musicians ─────────────────────────────────────────────────────

    addMusician() {
      const name = this.newMusician.trim();
      if (!name) return;
      if (this.musicians.some(m => m.name === name)) return;
      this.musicians.push({ name, weight: 1 });
      this.musicians.sort((a, b) => a.name.localeCompare(b.name));
      this._saveMusicians();
      this.newMusician = "";
    },

    updateWeight(name, value) {
      const m = this.musicians.find(m => m.name === name);
      if (m) m.weight = Math.max(1, parseInt(value) || 1);
      this._saveMusicians();
    },

    removeMusician(name) {
      const affected = this.songs.filter(s =>
        Object.values(s.members).some(arr => arr.includes(name))
      );
      let msg = `Remove "${name}" from the program?`;
      if (affected.length)
        msg += `\n\nWill be removed from ${affected.length} song(s): ${affected.map(s => s.title).join(', ')}`;
      if (!confirm(msg)) return;
      this.musicians = this.musicians.filter(m => m.name !== name);
      for (const s of this.songs)
        for (const role of this.ROLES)
          s.members[role] = (s.members[role] || []).filter(m => m !== name);
      this._saveMusicians();
      this._saveSongs();
    },

    // ── Songs ─────────────────────────────────────────────────────────

    showSongForm(idx) {
      this.editingIndex = idx;
      if (idx >= 0) {
        const s = this.songs[idx];
        const members = {};
        for (const r of this.ROLES) members[r] = [...(s.members[r] || [])];
        this.songForm = { title: s.title, artist: s.artist, members };
      } else {
        const members = {};
        for (const r of this.ROLES) members[r] = [];
        this.songForm = { title: "", artist: "", members };
      }
    },

    cancelSongForm() {
      this.songForm = null;
      this.editingIndex = -1;
    },

    availableForRole(role) {
      if (!this.songForm) return [];
      const assigned = new Set();
      for (const r of this.ROLES)
        for (const m of this.songForm.members[r]) assigned.add(m);
      return this.musicians.filter(m => !assigned.has(m.name));
    },

    addMemberToRole(role, name) {
      if (!name || !this.songForm) return;
      this.songForm.members[role].push(name);
    },

    removeMemberFromRole(role, name) {
      if (!this.songForm) return;
      this.songForm.members[role] = this.songForm.members[role].filter(m => m !== name);
    },

    saveSong() {
      if (!this.songForm || !this.songForm.title) return;
      const song = JSON.parse(JSON.stringify(this.songForm));
      if (this.editingIndex >= 0) {
        this.songs[this.editingIndex] = song;
      } else {
        this.songs.push(song);
      }
      this._saveSongs();
      this.songForm = null;
      this.editingIndex = -1;
    },

    deleteSong(idx) {
      this.songs.splice(idx, 1);
      this._saveSongs();
    },

    // ── Setlist ───────────────────────────────────────────────────────

    toggleExcluded(idx) {
      const pos = this.excluded.indexOf(idx);
      if (pos >= 0) {
        this.excluded.splice(pos, 1);
      } else {
        this.excluded.push(idx);
      }
      this._saveExcluded();
    },

    // ── Helpers ───────────────────────────────────────────────────────

    allMembers(song) {
      const set = new Set();
      for (const arr of Object.values(song.members))
        for (const m of arr) set.add(m);
      return set;
    },

    allMembersList(song) {
      return [...this.allMembers(song)];
    },

    overlapLabel(entry) {
      if (!entry.shared.length) return "No overlap with next song";
      const names = entry.shared
        .map(s => s.weight > 1 ? s.name + " \u00d7" + s.weight : s.name)
        .join(", ");
      return "Overlap with next (cost " + entry.transCost + "): " + names;
    },

    // ── TSP Engine ───────────────────────────────────────────────────

    getWeightMap() {
      const map = {};
      for (const m of this.musicians) map[m.name] = m.weight;
      return map;
    },

    overlapCost(a, b, weights) {
      const sa = this.allMembers(a);
      const sb = this.allMembers(b);
      let c = 0;
      for (const m of sa) if (sb.has(m)) c += (weights[m] || 1);
      return c;
    },

    sharedInfo(a, b, weights) {
      const sa = this.allMembers(a);
      const sb = this.allMembers(b);
      const shared = [];
      let cost = 0;
      for (const m of sa) {
        if (sb.has(m)) {
          const w = weights[m] || 1;
          shared.push({ name: m, weight: w });
          cost += w;
        }
      }
      return { shared, cost };
    },

    buildDist(songs) {
      const n = songs.length;
      const weights = this.getWeightMap();
      const d = Array.from({ length: n }, () => new Array(n).fill(0));
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) {
          const v = this.overlapCost(songs[i], songs[j], weights);
          d[i][j] = v; d[j][i] = v;
        }
      return d;
    },

    heldKarp(dist) {
      const n = dist.length;
      if (n === 0) return { cost: 0, path: [] };
      if (n === 1) return { cost: 0, path: [0] };
      const FULL = (1 << n) - 1;
      const dp = Array.from({ length: 1 << n }, () => new Array(n).fill(Infinity));
      const parent = Array.from({ length: 1 << n }, () => new Array(n).fill(-1));
      dp[1][0] = 0;

      for (let mask = 1; mask <= FULL; mask++) {
        for (let u = 0; u < n; u++) {
          if (dp[mask][u] === Infinity) continue;
          if (!(mask & (1 << u))) continue;
          for (let v = 0; v < n; v++) {
            if (mask & (1 << v)) continue;
            const next = mask | (1 << v);
            const cost = dp[mask][u] + dist[u][v];
            if (cost < dp[next][v]) {
              dp[next][v] = cost;
              parent[next][v] = u;
            }
          }
        }
      }

      let bestCost = Infinity, lastNode = -1;
      for (let u = 1; u < n; u++) {
        const cost = dp[FULL][u] + dist[u][0];
        if (cost < bestCost) { bestCost = cost; lastNode = u; }
      }

      const path = [];
      let mask = FULL, cur = lastNode;
      while (cur !== -1) {
        path.push(cur);
        const prev = parent[mask][cur];
        mask ^= 1 << cur;
        cur = prev;
      }
      path.reverse();
      return { cost: bestCost, path };
    },

    calculate() {
      const included = this.songs.filter((_, i) => !this.excluded.includes(i));
      if (included.length < 2) {
        this.results = { error: "Need at least 2 songs to calculate." };
        return;
      }

      const dist = this.buildDist(included);
      const { cost, path } = this.heldKarp(dist);
      const weights = this.getWeightMap();

      const entries = [];
      for (let i = 0; i < path.length; i++) {
        const song = included[path[i]];
        const next = included[path[(i + 1) % path.length]];
        const { shared, cost: transCost } = this.sharedInfo(song, next, weights);
        entries.push({ song, shared, transCost });
      }

      this.results = {
        entries,
        loopBackTitle: included[path[0]].title,
        totalCost: cost,
        songCount: path.length
      };
    }
  };
}
