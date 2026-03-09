const songs = [
  {
    title: "Crazy",
    artist: "Gnarls Barkley",
    members: {
      vox: ["Michaela M."],
      guitar: ["Chris H.", "Alison B.", "Maria W."],
      bass: ["Trevor W."],
      drums: ["Ilia V."],
      keys: ["David K."],
      aux_perc: [],
    },
  },
  {
    title: "Joker And The Thief",
    artist: "Wolfmother",
    members: {
      vox: ["Jen B.", "Michaela M.", "Jocelyn L."],
      guitar: ["Dimitry K.", "Christian K."],
      bass: ["Hex K."],
      drums: ["Bex L."],
      keys: ["Jim H."],
      aux_perc: [],
    },
  },
  {
    title: "Mr. Brightside",
    artist: "The Killers",
    members: {
      vox: ["David K."],
      guitar: ["Artem S.", "Alison B."],
      bass: ["Coleman T."],
      drums: ["Jim H."],
      keys: ["John K."],
      aux_perc: [],
    },
  },
  {
    title: "Snow (Hey Oh)",
    artist: "Red Hot Chili Peppers",
    members: {
      vox: ["Chris H.", "Jen B.", "Michaela M."],
      guitar: ["Christian K.", "Chris H."],
      bass: ["Trevor W."],
      drums: ["Bex L."],
      keys: ["Jim H."],
      aux_perc: [],
    },
  },
  {
    title: "Take Me Out",
    artist: "Franz Ferdinand",
    members: {
      vox: ["Seth N.", "Hex K."],
      guitar: ["John K.", "Dimitry K."],
      bass: ["Tom K."],
      drums: ["Ilia V."],
      keys: [],
      aux_perc: [],
    },
  },
  {
    title: "Are You Gonna Be My Girl",
    artist: "Jet",
    members: {
      vox: ["Jocelyn L."],
      guitar: ["Artem S.", "Alison B."],
      bass: ["Coleman T."],
      drums: ["Jim H."],
      keys: [],
      aux_perc: ["Ilia V."],
    },
  },
  {
    title: "Uprising",
    artist: "Muse",
    members: {
      vox: ["Jen B.", "Hex K."],
      guitar: ["Christian K.", "Seth N.", "Maria W."],
      bass: ["Tom K."],
      drums: ["Bex L."],
      keys: ["David K."],
      aux_perc: [],
    },
  },
];

// ---------------------------------------------------------------------------
// Traveling Salesman — Optimal Setlist
//
// "Distance" between two songs = number of musicians shared between them.
// While one band plays, the next rehearses in another room, so shared
// musicians create conflicts. We minimise total overlap across the circular
// setlist (last song wraps back to first).
// ---------------------------------------------------------------------------

function getMusicians(song) {
  const set = new Set();
  for (const role of Object.values(song.members)) {
    for (const name of role) set.add(name);
  }
  return set;
}

function overlap(songA, songB) {
  const a = getMusicians(songA);
  const b = getMusicians(songB);
  let count = 0;
  for (const m of a) {
    if (b.has(m)) count++;
  }
  return count;
}

function buildDistanceMatrix(songs) {
  const n = songs.length;
  const dist = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = overlap(songs[i], songs[j]);
      dist[i][j] = d;
      dist[j][i] = d;
    }
  }
  return dist;
}

// Exact TSP via Held-Karp (dynamic programming on bitmasks).
// O(n² · 2ⁿ) — practical up to ~20 songs.
function heldKarp(dist) {
  const n = dist.length;
  const FULL = (1 << n) - 1;
  const dp = Array.from({ length: 1 << n }, () =>
    new Array(n).fill(Infinity)
  );
  const parent = Array.from({ length: 1 << n }, () =>
    new Array(n).fill(-1)
  );

  // Start from node 0
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

  // Close the loop back to node 0
  let bestCost = Infinity;
  let lastNode = -1;
  for (let u = 1; u < n; u++) {
    const cost = dp[FULL][u] + dist[u][0];
    if (cost < bestCost) {
      bestCost = cost;
      lastNode = u;
    }
  }

  // Reconstruct path
  const path = [];
  let mask = FULL;
  let cur = lastNode;
  while (cur !== -1) {
    path.push(cur);
    const prev = parent[mask][cur];
    mask ^= 1 << cur;
    cur = prev;
  }
  path.reverse();

  return { cost: bestCost, path };
}

function sharedMusicians(songA, songB) {
  const a = getMusicians(songA);
  const b = getMusicians(songB);
  const shared = [];
  for (const m of a) {
    if (b.has(m)) shared.push(m);
  }
  return shared;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const dist = buildDistanceMatrix(songs);
const { cost, path } = heldKarp(dist);

console.log("=== OPTIMAL SETLIST (min musician overlap) ===\n");

for (let i = 0; i < path.length; i++) {
  const song = songs[path[i]];
  const nextSong = songs[path[(i + 1) % path.length]];
  const shared = sharedMusicians(song, nextSong);

  console.log(`  ${i + 1}. ${song.title} — ${song.artist}`);
  console.log(`     Band: ${[...getMusicians(song)].join(", ")}`);

  if (shared.length) {
    console.log(
      `     ⚠  Overlap with next song (${shared.length}): ${shared.join(", ")}`
    );
  } else {
    console.log(`     ✓  No overlap with next song`);
  }
  console.log();
}

console.log(`  ↩  Loop back to: ${songs[path[0]].title}\n`);
console.log(`Total musician-overlaps across setlist: ${cost}`);
