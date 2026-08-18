# Assignment 1 reflection

## The suite that lied by staying green

The breakthrough of this assignment was watching a test suite I was proud
of pass while the code it guarded was broken, and realising the fix
belonged in the harness, not the code.

I built the simulation model test-first, on purpose. Before any UI
existed I specified four properties the scheduler had to satisfy. With
one agent, all three setups produce an identical wall clock. Busy time
per agent is conserved across every setup and agent count. Wall clock is
monotonically non-increasing from shared checkout to worktrees to shared
cache. And no two spans holding the same exclusive resource ever overlap.
My plan also carried a rule I'd written half as ritual. Before trusting
the tests, deliberately break the scheduler and show me that they fail.

The second planted bug behaved. Letting two agents hold the working tree
at once tripped the exclusion properties immediately. The first one is
the breakthrough. We deleted the cache-invalidation-on-handover line,
the single line that makes the shared checkout the villain of the whole
page, and ran the suite. **All four properties stayed green.**
Conservation, monotonicity, exclusion and single-agent equality are all
true of that broken scheduler too. Nothing anywhere counted how many
builds go cold, which is the one thing the page exists to show.

What clicked is that a passing suite is a claim about the tests, not
about the code. The properties I'd chosen were mathematically pretty and
collectively blind, and no amount of re-running them would have told me
that. So the correction didn't land as a retry. It landed twice in the
harness. First as a fifth property that pins the exact cold-build count
per mode (n×3 for a shared checkout, one per agent for cold worktrees,
one total for the shared cache), which fails under the mutation with
`n=2 shared-tree: expected 1 to be 6` (commit `288c4f8`). Second as a
new CLAUDE.md rule that no future property test is trusted until it has
caught a planted bug (commit `5a5ab83`).

The same theme had already surfaced once, before a line of code. My own
spec's conservation property contradicted the mechanic (cold builds are
longer, so busy time can't be conserved as I'd written it), and the
repair was to redesign the model so waste is its own span kind rather
than to soften the test. What I'll carry forward is the habit both
moments share. The checks are a work product, and they need testing
harder than the code does.
