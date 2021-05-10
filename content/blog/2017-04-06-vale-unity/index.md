---
title: "Vale Unity"
post: true
description: Reminiscing and an outsider's postmortem
date: "2017-04-06"
---

Its been almost six years since Ubuntu shipped with Unity as the default desktop and compiz as the underlying compositor. For every release since then, a similar software stack has shipped on every subsequent release up until 17.04 . Those ten releases make up about half of the Ubuntu desktop's lifespan and certainly more than half of the person-hours invested into the project, so today's announcement to [wind it down](https://insights.ubuntu.com/2017/04/05/growing-ubuntu-for-cloud-and-iot-rather-than-phone-and-convergence/) is a pretty significant moment.

I haven't worked on Unity or Ubuntu for a very long time now, but the announcement today has filled me with a couple of emotions. On one hand its disappointing to know that your legacy and a project that you personally invested a lot into is going away. Time truly is the destroyer of all things. I know Mark and a lot of other people at Canonical must be feeling particularly gutted right now. On the other, maybe its a sigh of relief. Unity certainly hasn't been the most conflict free or easy project and maybe with this difficult decision the people involved finally have the freedom to move on without feeling guilty.

# The Team who Built Unity

I have nothing but good things to say about the Desktop Experience Team at Canonical - later the Product Strategy Team and the associated Ubuntu community. Our core engineering staff was a killer combo. We had two people, Jason and Neil, who had amazing experience with graphical toolkits and a passion for Desktop GL. We had Mirco, Gord and Jay who knew how to extract every last ounce of performance from a GPU. We had Tim and Alan who were a marvellous leaders and a champion of stability and software maturity. We had Alex, Thomi and Thomas who championed automated testing. We had Neil again because he literally filled far more shoes, so he deserves more than one mention. We had Michal and Mikkel -  who were a masters of desktop search. We had Didier and Seb, who could get things shipped, no matter what. We had Robert - who knew how to put the pieces together for groundbreaking web-integration. We Marco and Andrea, who took the lead in maintaining the desktop even when nobody ask them to. We had Daniel who was a leader in desktop quality. We had John, Otto and Rosie who were amazing designers. We had Jorge and Jono who were personable and enthusiastic community managers. There were countless others making invaluable contributions. And then we had me - and I'm just humbled to have crossed paths with all these people.

We were co-workers but we were also friends. Not only friends, but very close, lifelong friends. We often talked about non-work related stuff to each other and really went the extra mile to support each other. We were under a lot of pressure to make the dream a reality and when you gel well together, that pressure makes friendships even stronger. We didn't see each other in person much, but when we did, it honestly made up some of the happiest times of my life.

## The Fun Moments

We had a lot of great moments with each other building Unity. There was a time when we had to instruct Mark on how to pull and build a new build back when we didn't have stable updates in the alpha release. Mark was on a cellular connection and had to log out of IRC in order to restart his session. I remember Jason saying "whelp, if he doesn't come back in 1 minute, assume we are all fired". That got a few laughs.

There was another time when the DX team and the Design team had an ongoing prank-war with each other. This started with the "flies in the ice-cream" prank and eventually culminated with a sardine pizza being sent to Jason from England. I still have no idea how that happened. Then there was also the [bug report.](https://bugs.launchpad.net/unity/+bug/861710)

We slipped all sorts of easter eggs into Unity. One, which when launched with UNITY_NEKO=1, replaced all images in the dash with images of cats. Another which almost made it in filled the screen with fire when the konami code was pressed.

## The Low Moments

Of course, Unity's development had its bad times. The development was, understandably not well received by the established community members who saw the project as fragmentation. We faced numerous quality control problems when trying to get the desktop out on such a tight timeline. The stacking bugs kept me up day and night and required a lot of personal sacrifice to get to a state where they stopped occurring so frequently. Some of our users were randomly hateful and/or toxic. For instance, someone in a Reddit AMA told Jason that they hoped he would be "hit by a bus". That's not a very nice thing to say. In the later half of the 11.10 cycle, I began to feel overwhelmed with matters going on in both my personal life and the status of the project and entered a deep state of depression. There was additional pressure in the company as Unity 2D was developed and the projects inevitably, though perhaps not intentionally, were pitted against each other.

Then there were the post 12.10 staff departures. It was really sad to see the team break apart almost as quickly as it formed. I left during this time as well after most of my friends on the team had left.

# Unity 8

Unity 8 was a total reboot of the project, learning from the failures of Unity 7. There were a lot of high hopes. Canonical had recently been on a recruitment drive and hired a lot of smart people. On paper, Unity 8 looked technically groundbreaking. Unity was going to move away from an ageing, unmaintainable and limited display server architecture to one which was pervasively multithreaded, could take better advantage of mobile and desktop hardware, had high test coverage and really top-notch developers working on it. Global package management was going away in favour of isolated and atomically upgradeable containers known as 'snaps'. The OS was going to make mobile hardware a first class citizen. Touch was going to become the new interaction paradigm. Everything was going to become more internet connected and integrated than before. Apps were going to become smarter on power and resource usage. The project was moving to a toolkit which at the time had an incredible backing and momentum behind it. Legacy apps were going to be supported. "We have to go deeper" was the motto of the team.

The pieces were in motion. A very real demo of this was ready in 2013 for announcement to the world. The technology was so ground breaking that it was going to continue under wraps for a while until it could reach perfection. And then we'd be in free software utopia. Convergence would become a reality. Ubuntu would win, by sheer force of being better than anything that came before it. The plan, idea and resources available to execute on that plan were perfect.

And then it was delayed.

And then it was delayed again.

And then it was delayed for a third time.

...

And now its not shipping.

## An outsider's postmortem

I'd be lying if I said I didn't really see this coming, but not for the reasons that other people might say. The strategic decisions made were necessary - X11 was seriously limiting our ability to deliver on features and stability, without atomic updates, its hard to give people a secure and stable phone - but they were ultimately [fatal](https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/). I remember back when we decided to rewrite compiz and completely underestimated the scale and effort to make that work in a bug-free way. It killed the project. Once you rewrite one thing, its very difficult to resist the urge to start rewriting other things while you're at it. Porting compiz to C++ wasn't enough; we had to split rendering into plugins; we had to support the non-composting case; we had to support reparenting; we had to support a replacement for function pointer hooking; we had to drop multi-screen and we had to move to a more up to date rendering model. All at once. We had to understand code that we hadn't written and code where the original authors were long gone from the project. And to make it look like progress was made, we had to bolt on more features on top of the existing rewritten ones with fewer development resources than the ones who had already burnt out and quit.

About this time last year Unity 8 started to look an awful lot like compiz++ on a larger scale. Not only was it going to use Qt, it was going to use an entirely new display server! Not only was it going to use an entirely new display server, it was going to use an entirely new driver model! Not only was it going to use an entirely new driver model, it was going to use Android as the base for mobile! Not only was it going to use Android and Debian, but Debian would go away and we'd have containerised applications! Not only was it going to use containerised applications, but the applications would be all-new and written in Qt! And not only all that, but its going to be perfect!

The delays just kept on happening. And after ever delay, so as to motivate the base and show that Unity was still relevant, more scope was added. More scope led to more delays! More delays led to more scope! And its not going to ship until its perfect!

I became worried around this time last year that it was never going to ship. The reality was that "perfect" became a moving target. And the thing about aiming for perfection is that you can never hit it until you've had your imperfect product in front of users for a few years. Ironically, Unity 7 is now seen as "perfect" for a lot of people, because they don't remember the change from GNOME 2 to Unity. And now there's going to be another transition in moving to GNOME 3.

## Community

Unity was all about turning a community made platform into a product. The goals were noble - we wanted to get this amazing bit of community goodness into the hands of so many other users. We wanted to preach the word of free software. We wanted to show people that they do have an alternative to the big four companies that control the software they use on a daily basis. We wanted to show people that free software could **win\*\***!\*\* And the only way to do that was to turn it into a *product* that was so irresistible and incredible that you couldn't not buy it.

And that's where the problem was. The developers making it wanted a community but in order to get it to where it needed to be, it needed to become a product. There needed to be one direction instead of many. Linux was no longer about choice. It was about the masses. Unity had lost its soul.

# Where its all going

For now, it looks like Canonical has folded on client to double down on server. That was a very difficult decision to make and I applaud the leadership for their courage and for their ability to recognise what was becoming sunk cost. Its sad for the developers, product people and community involved, but at the end of the day, you have to make money.

Free software on the desktop might enter a dark age soon. There aren't very many companies in this space now.  Intel was out as of halfway through last year. Google is focused on Android and Chrome OS. Novell and Sun folded a long time ago. Nokia fell off a burning platform. IBM is nowhere to be found. And now Canonical is pivoting away too. Samsung's Tizen is potentially an interesting player, but everyone knows its a plan B.  Red Hat and SUSE remain and so does Endless. An of course there is still Collabora, Codethink, Igalia and other free software contracting firms, though **(edit)** their participation depends on the re-use of our technology by larger players outside the desktop space. There's room to grow, but there has certainly been a lot of disruptive change lately.

**(edit 10/04/2017: This section got a little more traffic than I was expecting and I wrote it quite quickly. I've made some changes to better reflect the state of affairs based on feedback. I've replaced "their participation depends on the larger players" with "their participation depends on re-use of our technology by larger players outside the desktop space" and clarified that its not all doom and gloom! Just that there has been a lot of change lately and things aren't pointing in the most golden direction right now)**

## A new hope

Lets not forget where the desktop free software revolution came from. It came from ordinary people, you and I, who wanted to make a difference. It came from people who didn't want to accept the Microsoft and Apple duopoly on computing. Even if the resources start to dry up now, it doesn't mean that free software is gone forever. Some of the best innovations came during the post-bubble period of 2000-2010 where the software world had become stagnant with Windows XP and IE6.

There will always be people who want to do something different. A community will form again. And once everyone has a clearer head, free software will rise again.
