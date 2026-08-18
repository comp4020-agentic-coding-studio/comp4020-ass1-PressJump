# PROCESS.md

I set the order of the work before anything happened, CLAUDE.md first,
then the code that works out the timelines, then the page around it
once that was solid, and these are the moments where that actually
mattered.

## 1. Time units instead of seconds

The obvious thing was to put real looking timings on the page, like a
build takes forty seconds, and it would have looked more impressive
that way. Instead I had CLAUDE.md written before any code with a rule
that the whole page works in plain time units, since what the page is
showing is how the three setups compare and not how long anything takes
in the real world (commit `c1a4653`). Every timing lives in one place
in `src/model.ts` and the axis just says time units, and nobody can
pick a fight with the page over whether a build really takes forty
seconds, because the comparison between the setups stays the same
whatever the actual numbers are.

## 2. One of my own rules could not be true

In my plan I wrote that the real work each agent does must add up the
same across all three setups, because it sounded solid. Before writing
any code the agent pointed out that it cannot be, cold builds are
longer than incremental ones so timelines worked out correctly would
break my own rule. My first thought was to just drop it, but when it
asked me which way to go I went the other way and got it to rework how
the timelines are calculated, so now every build is split into an
incremental part that counts as real work and a cold penalty that
counts as overhead (commit `13e3fd1`). What convinced me was that the
rule became true again, and the waste I nearly dropped is now the
hatched red you can actually see on the page.

## 3. The colours I liked failed the validator

My first colour scheme was shades of blue with a green for builds and
looked fine to me. I ran it through a colour validator anyway and it
failed on chroma and on how close the blues sat, which I would never
have caught by eye. So the second go used four separate hues, ordered so
the two pairs the validator flagged, orange next to green and blue next
to violet, never touch on the timeline (commit `787016f`). Trusting the
script over my own eye is the part I would repeat.

## 4. The agent said the phone was fine, my phone said otherwise

The agent ran the page at an emulated 375px viewport, saw no overflow
and reported the phone layout as fine, with the scaling coming out the
same across screens (commit `787016f`). I wanted to make sure myself
because I have run into this before, where the emulated viewport agrees
but a real screen does not. So I opened the dev server on my phone using my laptop's IP
and port, and everything was way too zoomed in, the heading took up the
screen and the whole page looked like a desktop layout scaled up. Since
I knew this problem from past projects I did not argue with what it had
reported, I told it what I was seeing and got it to zoom the small screens
back out, a smaller root font and tighter spacing under 44rem
(commit `0d63c87`). Sometimes what the agent sees is great on its end
but you do always have to check it yourself to make sure its fine on your
end as well.
