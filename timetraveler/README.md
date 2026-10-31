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

## Story mode (default)

The world number decides the story, so anyone entering the same number is born into the same life.

1. **Prologue, year 1000.** You are twenty and named, born in a village of a realm that is alive in year 1000 and whose fall is foretold within a few centuries (realms whose fall the chronicle names, by conquest or collapse, are preferred). The opening describes your people from the actual simulation: their land, size, technology, temperament, customs, their named ruler and their neighbours. **The elders remember** true history: ancestry (which realm they broke from or rose out of), their long wars (taken from per-decade conquest records), census milestones (booms, disasters, golden ages) and chronicle events. The future is hidden and time travel is locked.
2. **Coming of age.** Walk to the capital (gold star) and swear the oath, spend a year learning, then help your people.
3. **The Chronoscope.** A stranger presses it into your hands and you see your realm's real fall, with a hint at the cause. **Quest: your realm must still hold at least one province 50 years after its foretold fall.** Time travel unlocks. The Journal tracks the realm's fate in whatever timeline you are in.
4. **Victory** unlocks the god-like Powers.

### Timelines are your lives
In story mode the original history is **"The world without you"**, and the timelines you make are **"Your first life"**, "Your first life, path 2" (when you go back and act again), **"Your second life"** (the next bearer), and so on. The impact meter therefore answers how much you mattered.

### Passing on the Chronoscope
There is no respawn. **Pass it on (P)**: give the Chronoscope to a young person wherever and whenever you stand, choosing the moment well, and your life as its bearer ends. If you die first, you press it into the hands of whoever finds you, someone nearby and of that land. Either way the new bearer begins at twenty with full health, knowing nothing you learned, and every deed of earlier bearers still stands in the timeline.

### The Chronoscope hums (hints and difficulty)
When the quest begins, the **Oracle** (`js/oracle.js`) quietly replays your current timeline from candidate years, about every 20 years over the 160 before the fall. In each it tries one simple deed a person could do: kill the rival ruler, sow discord in their capital, rally or irrigate your capital, or teach your people the world's best knowledge. It notes which deeds keep your realm alive. Because the world is deterministic, these aren't guesses. Then:
- The Journal shows the **difficulty**: "A few threads lead to salvation", or "No single deed will turn this fate. It will take many".
- The Chronoscope **hums faintly** in the right era, **hums** within a few provinces and years of a winning moment, and **sings**, lighting up the deed on the hotbar, when you stand exactly there and then.
- It re-reads whenever your timeline changes. Hints can be switched off in the Journal.

Across worlds 1–6, three quests have single-deed solutions (3–5 of about 40 tested) and three need several deeds.

### Aging and health

You age only while living through years (walking, deeds, resting, Play), never while travelling in time. Each year is judged on that exact year's world, stepped one year at a time, so health is reproducible. While you're alive, playback runs at most 100 years per second.

| Where you spend the year | Health |
| --- | --- |
| Among people / in a capital | +3 / +2 more |
| Wilderness / at sea | −3 / −5 |
| Famine | −8 |
| Plague on your tile / next door | −22 / −7 (survive it and you're immune for 25 years) |
| Harsh climate / kind weather | −3 / +1 |
| Mountains / desert without a river | −2 / −3 |
| Border with another realm | −2 |
| Age over 45 | −0.25 per year over 45; maximum health falls after 50 |

A quiet life at home ends around 65–85. Below 30 health you walk at two-thirds speed.

### Sharing and challenges
- **Share** in story mode copies a **challenge code** such as `seed=1&home=2089162062&born=35.65`. Whoever enters it in the World box is born where you were, in the same realm, facing the same fall.
- **Today** opens today's world (the number is the date, for example 20261031): the same life for everyone who plays that day.
- In sandbox mode, Share copies the full timeline code (world plus deeds).

**Sandbox mode** (in the help screen, or by opening a timeline code) skips the story: no aging, every power unlocked.

## Playing as a person

You are one traveller loose in time. A camera follows you through the world in
close view (houses, castles, forests, rivers), with a minimap; press **Z** for the
whole-world view.

- **Walk:** click the map or use WASD/arrows. A province takes about two months on foot; sea takes half a year by boat.
- **Deeds** (keys 1–8) act where you stand and take a year each. A greyed-out deed explains why it won't work here.

| Deed | Effect (all local: your province and its neighbours) |
| --- | --- |
| Dig irrigation | Soil fertility +12% |
| Rally the people | Solidarity +15 points |
| Tend the sick | Stops plague, short immunity |
| Lead settlers | Neighbours move into empty land, or you found a new people |
| Learn | You carry this people's knowledge (no change to the world) |
| Teach | Closes half the gap between their knowledge and what you carry |
| Sow discord | Solidarity −15 points |
| Assassinate | At a capital only: realm-wide succession crisis (solidarity ×0.68) |

Walking doesn't touch the simulation; it only spends your time. Deeds are
recorded as interventions, so a life of deeds replays exactly. Acting later in a
timeline continues it; going back in time and acting forks a new one. After a
deed you get the immediate local effect (for example "Their knowledge rises from
Iron Age (1100) to Classical Age (2600)"), and the impact meter shows **lives
changed** (immediate) and **lands ruled differently** (usually takes
centuries). Carrying ideas from an advanced people to a backward one, and
assassinating the ruler of an already fragile empire, are the strongest levers
in testing.

The god-like **Powers** (plague, floods, mountains…) are still on the left toolbar.

## How to play

| Action | How |
| --- | --- |
| Play / pause | Space, or ▶ |
| Travel in time | Click or drag the history chart; `,` / `.` (Shift ×10); Home/End |
| Change history | Deeds 1–8 where you stand, or a Power from the left toolbar and click the map |
| Compare timelines | "vs" dropdown, *Divergence* map mode, *Only changes* in the chronicle |
| Follow a people | Inspect tool → click a realm, or double-click a band in the chart |
| Undo | Ctrl+Z |
| Share | *Share timeline* copies a code like `seed=1&iv=700.plague.80.49`, which is the entire timeline. Paste it into the World box (or append it to the URL as `#…` when running locally) |

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
  js/story.js       home realm, prologue and memories, prophecy, quest fate, health rules
  js/oracle.js      replays the timeline with test deeds: hints and difficulty
  js/ui.js          canvas map, history chart, playback, panels
  test/run.js       determinism & time-travel tests
  tools/chronicle.js headless history printer for tuning
```

## Ideas for next steps

- Goals and puzzles: "keep the Naelir alive past year 1500", "unite the continent", scored by how few interventions you use.
- Trade routes and cities as explicit entities; religions as a second solidarity layer.
- A Web Worker for computation (needs to be served over http, not `file://`).
- A "causality trace" that highlights the first tiles to diverge after an intervention.
