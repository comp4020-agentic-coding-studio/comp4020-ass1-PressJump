# Reflection — Assignment 1

<!--
STUB — this is the breakthrough you present at the week 4 retro, and it
must be written in your own voice. Candidate breakthrough, with the
evidence lined up:

The suite that lied by staying green. After the scheduler and four
property tests all passed, we deliberately deleted the one line that
makes shared-tree mode the villain of the page — cache invalidation on
handover — and the whole suite stayed green. The properties I'd specified
(conservation, monotonicity, exclusion, single-agent equality) were all
*true* of the broken scheduler too. The breakthrough was realising that a
passing test suite is a claim about the tests, not the code: the fix
wasn't a retry but two harness changes — a fifth property that pins the
cold-build count per mode (288c4f8) and a CLAUDE.md rule that no new
property test is trusted until it has caught a planted bug (5a5ab83).

Write it as: what you expected, what actually happened, what you changed
about how the work is checked (not what you changed about the code).
-->
