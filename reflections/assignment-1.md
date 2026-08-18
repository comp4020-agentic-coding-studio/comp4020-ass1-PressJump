# Assignment 1 reflection

## The invariant that couldn't be true

The breakthrough of this assignment happened before a single line of
code existed, when part of my own spec turned out to be impossible and
fixing it properly ended up designing the page for me.

Planning the simulation, I wrote down what felt like a rigorous claim.
Busy time per agent must be conserved across all three setups, with only
waiting time allowed to differ. It sounded like exactly the kind of
invariant a well-behaved model should have. When I handed the plan over,
Claude flagged the contradiction straight away. Cold builds are longer
than incremental builds, and the difference between the setups is
precisely how many builds run cold, so a correct scheduler could never
satisfy the claim as I'd written it. The thing I'd stated as a check on
the work was actually at war with the mechanic the whole page exists to
explain.

My first instinct was to quietly drop the claim and move on. Asked to
choose between weakening it and rebuilding around it, I went the other
way. The model now splits every build into an incremental base, the work
a change genuinely requires, and a separate cold penalty span classed as
overhead, the work the setup wastes (commit `13e3fd1`). With that split
the invariant came back to life, every agent does identical busy work in
every setup at every agent count, and everything a setup costs you shows
up as either overhead or waiting.

What made this the breakthrough rather than just a fix is what it did to
the page. The hatched red blocks a visitor sees are exactly those
overhead spans, and the dotted lines are exactly the waiting. The visual
language of the explainer fell straight out of repairing the spec, the
waste I nearly defined away became the single most legible thing on the
screen, and the page's argument, that the shared cache removes the cold
tax, is literally the red disappearing as you switch setups.

The habit I'm taking forward is about where corrections should land.
When a claim about the work turns out to be wrong, the tempting move is
softening the claim until it passes. The better move, at least this
time, was treating the claim as load-bearing and reshaping the work
until the claim held, because the reshaping is where the insight lived.
