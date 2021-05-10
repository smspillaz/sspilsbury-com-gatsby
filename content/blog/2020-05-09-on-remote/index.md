---
title: Remote Work
date: "2021-05-08"
description: "The verdict, as usual, depends on context"
post: true
---

Before 2020, remote work was still kind of a niche thing. Outside of
the tech and startup bubble, the default was that work happened in the
office and remote was definitely treated as something
that maybe only "[certain types](https://theoatmeal.com/comics/working_home)" of people would do.

Of course then 2020 happened and a lot of organisations were thrown into remote work
as-the-norm because that was (and still is, in many places), the prevailing health advice.

Now as working from home is starting to become no-longer-mandatory in some parts of the world,
there are no shortage of columns telling us [why remote is going to stick](https://blog.coinbase.com/post-covid-19-coinbase-will-be-a-remote-first-company-cdac6e621df7),
or why its an [abberation](https://www.cnbc.com/2021/02/25/goldman-sachs-ceo-solomon-calls-working-from-home-an-aberration-.html)
that some can't wait to get rid of.

As usual, the reality, I think, depends on context. If people learned anything in 2020, you can't
just take your regular office job, send the workers to work from their home office in exactly the same
way, and call it a day. Remote needs an entirely different _style_ of working to work well and it
also suits some types of work much better than others.

# A history of anecdotes

Like the minority of workers before 2020, I have a somewhat different perspective on all this
commentary, because I started our my career remote and have worked remotely during my career
longer than I have worked in offices. I also have a pretty mixed opinion about remote work, but
interestingly enough, how I feel about remote work differs depending on what kind of work I am doing
at the time. So in this post, lets compare different roles in a table and figure out
there's any trend in the data.

| Location                  |  Commitment  | Org size |   Work type   |         Tools          | Community |    Verdict     |
| :------------------------ | :----------: | :------: | :-----------: | :--------------------: | :-------: | :------------: |
| Remote, Perth             |  part time   |  medium  |  product dev  |    launchpad\*, IRC    |   open    |     _Good_     |
| Remote, Perth             |   contract   |  small   |  feature dev  |      gh\* issues       |   open    |     _Good_     |
| Remote, Rio de Janeiro    |  full time   | startup  |  product dev  |       gh issues        |  closed   |      _OK_      |
| Remote, Perth             | 1 day a week | startup  |   tools dev   |     gh issues, IRC     |  closed   |     _Meh_      |
| Office, Perth             |  full time   |  small   |     legal     |       word, mail       |  closed   |      _OK_      |
| Remote, Perth             |  part time   |  small   |  product dev  | phabricator, gh, slack |  closed   |     _Good_     |
| Remote, Perth             | moonlighting | startup  |  product dev  |        gh suite        |  closed   |      _OK_      |
| Remote, Helsinki          |  part time   |  large   |   research    |          none          |  closed   |     _Meh_      |
| Office, Helsinki          |  part time   |  large   |   research    |          git           |  closed   |      _OK_      |
| Office, Helsinki          |  full time   | startup  | research se\* |     gh, whiteboard     |  closed   |      _OK_      |
| Remote, Lausanne          | 1 day a week | startup  | research se\* |     git, gh issues     |  closed   |     _Meh_      |
| Office, Lausanne          |  part time   |  large   |   research    |   git, self-managed    |  closed   |     _Meh_      |
| Office → Remote, Helsinki |  full time   | startup  | master thesis |    gh, self-managed    |  closed   | _OK, then Meh_ |
| Remote, Helsinki          |   contract   | contract |    web dev    |    git, spreadsheet    |  closed   |     _Good_     |
| Remote, Helsinki          |  full time   |  large   |   research    |       git, slack       |  closed   |     _Meh_      |

In this table, `launchpad` refers to the Launchpad sprint tracker, bug tracker, code hosting, code review, etc. `gh`
is GitHub. Some organizations use the GitHub issue board, others just use it for code hosting and review.

Just by counting up the verdicts, I'd say that some remote jobs have been 'Good', most have been 'OK' (tolerable)
and there have been more 'Meh' experiences than 'Good' ones. I haven't had an office job which I'd consider to be 'Good',
but also haven't had any office experiences which were 'Meh', either.

# Take-aways

## Remote works better when you know what you're doing

Pretty much none of my 'research' jobs have been marked 'Good', and have usually been pretty
'Meh' experiences when done remotely.

There's a big difference between research work and regular software engineering. In regular
software engineering you're told what to do by a boss and given (hopefully) detailed specifications.
In most software engineering projects you're just fixing bugs or regressions and it is usually
pretty clear if the bug is fixed or not. Therefore, it doesn't require so much thinking or collaboration;
you just look at the ticket, reproduce the issue, find out where the issue is happening, fix the code
so that it does the expected thing, submit a patch, go through the review process, then move on to the next thing.

In research work, things are a little bit more self-directed. Most of the time, you have a problem but you
don't have a clear idea of what the solution will be. Often times you just have to try things or read a bit
more of the literature to get ideas of what to try. Especially in machine learning, turnaround time
can be very long, so there's the frustration of staring at a progress bar and finally coming to the realization
that your big idea doesn't work. In this kind of work, it is nice to be able to have a discussion with
your colleagues, or work collaboratively on a problem, but this is difficult to do when everyone is working
on their own problems, remotely.

## High-pressure works better than low-pressure

All the jobs I had where there weren't at least soft deadlines and the amount of time that I would work
was too little ended up being quite demotivating. The fact that you have a low commitment to the project
means that your collegues also have a low commitment too, which in turn means that things move slowly
and there's not much feedback for progress or lack of progress.

On the contrary, work that I was doing full-time, or even part-time for most of the time, I had a better
sense of "flow", because everyone was more committed to the project. There's something nice about taking a ticket,
working on it, moving it to "ready", taking the next ticket, then seeing internal turnaround after about a day.

## Calls are pretty exhausting

Especially in 2020/2021, Zoom calls are somehow much more draining than I remember. There's something about
the tightness of the headphones, focusing on currently presented slides, the temptation to mutlitask etc that
makes them much more exhausting than I remember. Many of my better conversations have been had over Slack,
possibly because slack means that I can consume information at my own pace rather than having to keep up
with the speaker and remember everything that's been said before. There's also something about calls
that causes them to go around and around in circles, never with both participants never really sure
if a resolution to the thing which prompted the call has been achieved.

## Tools, tools, tools

This is probably a must in any organization, but seems to be doubly so when working remotely. You need
project management tools to keep track of and prioritize everything, otherwise the backlog becomes overwhelming and it is
easy to lose track of stuff. Access to workboards that everyone can edit mean that everyone is on the same page
as to where the project stands.

## Internal feedback loop

This is quite closely related to the nature of the work, but I do think that projects where you can immediately
see the outcome of a change (for example, web development, UI development or even backend and systems work)
are much more flow-inducing than projects where the turnaround time for a change is quite long. I suppose that
the 'long turnaround time' issue can be mitigated by having someone in the office to bounce ideas off of,
especially if you're pairing.

## External feedback loop

Finally, having a quick turnaround time on process is pretty important. Waiting a week to hear back on a pull
request, or a discussion on a ticket is demotivating. Same thing with pull requests that seem to drag on forever.
Better to split the work up into small chunks and keep things moving. For remote work, it creates a kind of
steady stream of 'reward', which I think makes you feel more connected to what you're working on.
