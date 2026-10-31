# Chronoscope: a deterministic time-travel civilization sandbox

Watch 3,000 years of history unfold, travel back, change **one small thing**, and
watch the future rewrite itself. Peoples settle, farm, multiply, fight, trade
ideas, catch plagues, rise into empires and shatter into successor states.
None of that is scripted: it emerges from a handful of simple rules.

**Play:** open `timetraveler/index.html` in a browser. It works from `file://`
with no build step or dependencies.

```
node timetraveler/test/run.js                 # determinism + time-travel tests
node timetraveler/tools/chronicle.js 1 3000   # print a world's full history headless
```

## How to play

| Action | How |
| --- | --- |
| Play / pause | Space, or ▶ |
| Travel in time | Click or drag the history chart; ←/→ (Shift ×10); Home/End |
| Change history | Pick a tool on the left, click the map |
| Compare timelines | "vs" dropdown, *Divergence* map mode, *Only changes* in the chronicle |
| Follow a people | Inspect tool → click a realm, or double-click a band in the chart |
| Undo | Ctrl+Z |
| Share | *Copy link*: the URL is `#seed=…&iv=…`, which is the entire timeline |

Interventions: bless or salt the land, seed a new people, send a prophet,
gift knowledge, release plague, smite, raise mountains, flood land, raise land
bridges.

## Why it is deterministic (and why that matters for gameplay)

A timeline is **only** `(seed, list of interventions)`. Everything else is a
cache that recomputes identically.

1. **No shared random stream.** All chance is `hash(seed, year, tile, channel)`.
   With a classic PRNG, any change shifts every later dice roll and the whole
   world diverges instantly for no in-world reason. Here randomness is keyed by
   *where and when*, so a change spreads **only through cause and effect**:
   migration, war, plague, borders and ideas. This is what makes the butterfly
   effect legible.
2. **Integer math only.** Results are bit-identical across browsers and Node.
3. **Flat typed arrays.** A snapshot is a handful of `slice()` calls, about 200 KB.
4. **Fixed iteration order.** Each year uses a hash-chosen permutation, never
   object identity or insertion order.
5. **Identity is not an index.** A civilization's name, colour and traits come
   from its signature `hash(year founded, tile)`, so seeding a new tribe
   doesn't rename every civilization founded after it.

### Time travel

- **Keyframes** every 50 years. Seeking to year *t* means restoring the nearest
  keyframe at or before *t* and re-simulating at most 49 years.
- **Branching:** acting in year *T* forks a new timeline that *shares* every
  keyframe up to *T* with its parent. Edits made in the same year extend the
  same branch.
- The future is computed in the background, about 10 ms per frame, so the
  chronicle shows events that haven't happened yet (*foretold*, in italics).
- Old branches' caches are evicted (LRU, 4 kept) and recompute on demand.

## The rules (`js/sim.js`, `step()`)

| System | Rule | Feedback it creates |
| --- | --- | --- |
| Land | Soil regenerates toward a base fertility (rivers and coasts are richer); farming depletes it, faster with technology. | Overfarmed heartlands weaken. |
| People | Logistic growth toward capacity = soil × tech × climate; starvation above it; overflow migrates to empty or less-crowded land. | Expansion waves, famines. |
| Solidarity (*asabiya*) | Grows on frontiers facing other peoples (half as fast facing wilderness); decays in interiors and during famine. | Empires grow strong at the edge and rot from the middle (Turchin's metaethnic frontier model). |
| War | Power = mean solidarity × size × tech, fading with distance from the capital (reach grows with tech). It must beat the defender by 25%, with terrain, river and capital bonuses. | Shifting borders, sacked capitals. |
| Ideas | Tech grows with log(population), decays slowly, diffuses across borders, and successors inherit 85%. | Ages of progress, dark ages after collapses. Seafaring unlocks overseas colonies. |
| Collapse | Solidarity below a threshold for 15 years shatters an empire into 2–7+ successor states; low solidarity also makes far provinces secede. | The rise and fall cycle. |
| Plague | Dense tiles spawn outbreaks that spread tile to tile, kill about 35%, then leave decades of immunity. | Demographic shocks that tip fragile realms. |
| Climate | Smooth regional droughts and golden ages, about 90-year cycles. | Regional famines that start wars and collapses. |
| New peoples | Tribes appear in empty fertile wilderness. | Re-population after collapse. |

Every tuning knob is in `CFG` at the top of `sim.js`.

## Files

```
timetraveler/
  index.html        UI shell
  css/style.css
  js/sim.js         deterministic simulation (pure, runs in Node and the browser)
  js/timeline.js    keyframes, branches, views, divergence, chronicle diff, links
  js/ui.js          canvas map, history chart, playback, panels
  test/run.js       determinism & time-travel tests
  tools/chronicle.js headless history printer for tuning
```

## Ideas for next steps

- Goals and puzzles: "keep the Naelir alive past year 1500", "unite the continent", scored by how few interventions you use.
- Trade routes and cities as explicit entities; religions as a second solidarity layer.
- A Web Worker for computation (needs to be served over http, not `file://`).
- A "causality trace" that highlights the first tiles to diverge after an intervention.
