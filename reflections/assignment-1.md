# Assignment 1 reflection

## What was the breakthrough that moved the work forward?

My page is about what happens when you run a bunch of AI coding agents
on the same codebase at once, because it feels like eight agents should
give you eight times the speed but in reality they end up fighting over
the same folder of code and waiting for each other. I picked the topic
because it is something I actually know well, since I have worked with
this kind of software for a while and I was the maintainer of one of
these tools myself, so I have seen the queueing and the wasted rebuilds
happen for real, and I knew the fix that barely gets talked about,
which is giving every agent its own copy of the code while they all
share one build cache.

In the development of the website, I looked at https://john.fun/elevators
as reference which was provided in the assignment spec. This was actually
a website I had seen in the start of August on HackerNews and I knew I
wanted to make my website for this assessment something that was close to
it for displaying and showing information in a creative and interactive
way. My first version of the page was nothing like that though, it was
just the slider, the three setup buttons and one timeline, and it worked
but it read like a tool you had to already understand rather than a page
that explains something to you.

The breakthrough was a pretty simple decision in the end, which was to
not write the explanation separately from the page. Instead of putting
screenshots or made up example numbers into the story sections, each
section just has another copy of the timeline in it, drawn by the same
code as the main one but locked to a fixed setting, and the numbers in
the captions get filled in by that code as well rather than typed by
hand (commit `4fc796b`). So when a caption says the wall clock lands at
39 time units, that number came from the page working it out and not
from me writing it, and if I ever change how the timelines are worked
out the captions update themselves, so the text cannot end up
disagreeing with what is drawn right above it.

That choice also forced the writing to be honest in a way I did not
expect, because at four agents the two worktree setups genuinely tie on
wall clock, and since the caption number comes straight out of the
calculation I could not round the story up to a win, so I had to write
that the win
hides in the wasted rebuilds and send the visitor down to the lab to
crank the agent count and watch the gap open for themselves, which
honestly made the page better than the version where I could have just
claimed it.

The habit I am taking from this is to let the page do the talking
instead of describing it myself, because numbers typed into the text go
stale the moment the thing they describe changes, while numbers the
page works out fresh each time cannot. That is also what I liked about
Elevators in the first place, since everything it tells you comes from
the elevators actually moving around on screen rather than from a
write up next to a picture of them. It is cool! and makes sense why
HackerNews posted it high.
