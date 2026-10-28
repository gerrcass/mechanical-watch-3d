# 0007 — Art-direction concessions in the assembled presentation

The exhibit is a teaching object first and a physical simulation second. Three deliberate concessions make the mechanism legible at the hero angle; each is visible in the code and in the catalogue copy, and none changes the ratios or the beat.

## The keyless works are presented on the dial side

A conventional movement hides the crown wheel, ratchet, click and stem behind the main plate; from the dial side you see none of them. In MW-01 the keyless works sit at `z ≈ 2.2`, above the plate and the train, so winding can be watched: the crown turns, the crown wheel and ratchet step round, and the click rides the teeth.

The exploded view still returns them to the **rear** of the stack (layer shift −6.5 mm), teaching the assembly order in which they belong. The cost is that during an explosion the keyless parts travel through the plate. The benefit is that the winding story is visible in the assembled object, which is the product's primary verb.

## The chapter ring is dark rhodium, not sapphire

Ticket 04 asked for a sapphire chapter ring. A transparent ring over a dark skeleton movement disappeared at the hero distance, and the applied indices floated without a ground. The shipped ring is dark rhodium with polished anglage, applied gold indices and printed numerals; the crystal above it is still sapphire. This keeps the ring legible and gives the hands something to read against.

## The case is champagne gold

The spec fixes the palette (obsidian, champagne, rhodium, ruby, ivory) but not the case metal. A polished-steel case reflecting a dark studio read as a black tyre around the movement. Champagne gold separates the case from the rhodium bridges, ties it to the gilt wheels and hands, and matches the vitrine's warm key light.

## The escape wheel completes a revolution in 40 beats, not 20

Ticket 03 says "half a tooth (9°) per beat, and completes one revolution in 20 beats (2.5 s)". Twenty beats at 9° is 180°, not a revolution. The spec's own definition — 20 teeth, half a tooth per beat, one revolution per five seconds, escape at 12 rev/min from the ratio chain — is self-consistent at **40 beats / 5 s**, and that is what `beatAt()` and the tests implement. The ticket's arithmetic is the outlier; following it would have made the escape wheel disagree with the train.

## Consequence

Reviewers should judge the object against these concessions rather than against a literal dial-side movement. The README states that MW-01 is illustrative, and `docs/spec.md` remains the product contract for everything else.
