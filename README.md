# Rock Setlist Optimizer

A TSP (Traveling Salesman Problem) based tool that finds the optimal song order for a setlist where one band plays on stage while the next band rehearses in another room. The algorithm minimizes musician overlap between consecutive songs so fewer people need to be in two places at once.

Uses the **Held-Karp algorithm** (exact dynamic programming on bitmasks) — guaranteed optimal for up to ~20 songs.

## Live

[artemtek.github.io/rock-setlist-optimizer](https://artemtek.github.io/rock-setlist-optimizer/)

## Features

- **Musician roster** — add/remove musicians; removal cascades across all songs
- **Song management** — create songs with role-based assignments (vocals, guitar, bass, drums, keys, aux/perc)
- **Partial sets** — checkbox to include/exclude songs for a given rehearsal
- **Optimal ordering** — one-click calculation of the best circular setlist
- **Persistent** — all data stored in localStorage, no backend needed

## Usage

Open `index.html` in a browser. No build step, no dependencies.

The CLI version is also available:

```bash
node code.js
```

## License

[GPL-2.0](LICENSE)
