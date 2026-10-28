# 0003 — An illustrative 4 Hz calibre with a coherent ratio chain

MW-01 is not a replica of a commercial calibre. It is a 4 Hz (28,800 vph) manual-wind movement whose numbers are chosen so the mechanism agrees with itself: a 20-tooth escape wheel advanced half a tooth per beat, a fourth wheel turning once per minute, a center wheel turning once per hour, motion works producing a 12:1 hour reduction, and a barrel that turns once per six hours for a 42-hour power reserve.

**Why:** the product's claim is "see exactly how a mechanical watch works". Copying a real calibre's every dimension would add research risk without adding explanatory value, while arbitrary per-part animation would break the promise. A small, fully consistent model gives the viewer something they can reason about. The README states clearly that the calibre is illustrative.

**Consequences:** ratios live in one module and drive both tests and animation. The escape wheel does not use the common 15-tooth count because the resulting ratio chain would need an unrealistic pinion; 20 teeth keeps every pinion plausible. Finishing and component naming follow real practice so the vocabulary transfers to real watches.
