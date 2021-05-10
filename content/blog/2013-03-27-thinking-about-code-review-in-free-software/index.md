---
title: "Thinking about Code Review in Free Software"
date: "2013-03-27"
description: Some ideas about guidelines
post: true
---

Code review can be a bit of a recipe for drama. There was a large-ish amount of drama in a close project quite recently that stemmed from patch review, and it got me thinking about how we handle this in free software.

In free software code review, along with other practices that we call "agile practices" (such as continuous integration, unit testing, behavior driven design, test driven development) is a relatively new thing in some projects, especially those on the desktop stack.

Code review tends to fall into an intersection which might otherwise be called an "HR-nightmare". There are lots of competing factors which can make things very dramatic.

1. The person submitting the patch has invested some time and effort into it.
2. The reviewer's responsibility is mediating the change proposed by the patch and the quality of the code as a whole.
3. People disagree on the best way to do things, and sometimes these differences are fundamental and irreconcilable.
4. People have differing views on what the purpose of review is, and what priorities should be given to reviews.
5. Reviews are often seen as a "chore" and a necessary part of project management.

Beck and Mezaros have used the terms "Code Smells" and "Test Smells" to describe whats wrong with the non-agile way of doing both of those things, perhaps its time we coined the term "Review Smells" for looking at how we can do review better? Though maybe not. Maybe it would be good to look at what makes for a good review, and how we as a community can do review better.

## Reviews aren't for rejecting what's bad, but growing what's good

In most (legacy) projects, code review generally starts up because a manager heard about this new-fangled thing called "agile development" and how code review along with other  agile practices would do amazing things like reduce technical debt and improve quality, allowing engineers to be even more efficient, which in turn means that your organization can cut ballooning costs and not increase resources so much. Managers say "we've had enough of this, we're not allowing any more crap in the codebase, so we're introducing code review".

While parts of this are certainly true, its not really the right way to start reviews. If you want to stop crappy code from going into the codebase, then you don't hire engineers who don't know what they're doing. Of course, in free software this isn't really an option.

Generally I live my life by the mantra "people don't think they're evil". If someone proposes a change to a project, they generally think they're trying to make it better. And generally speaking - they are, whether or not that be adding a new spec'd out feature, or fixing a bug or cleaning up some of the code.

This of course, doesn't mean that you just accept the change because all changes are amazing. The point is that no change is perfect, but **the job of the reviewers is to mentor the one proposing the change to make it the best they possibly can**. Good reviewers ask questions and provide suggestions on:

1. How can we make this change, and prevent regressions in other areas?
2. How can we ensure this change is well tested, so that it can't accidentally be stomped on in future?
3. How can we make the code even clearer to everyone who uses the project than it is now?
4. How can we make this code even faster than it is now?

Those kinds of questions are the kinds of questions that promote healthy discussion and help to both the reviewee and the reviewer to learn new things in the process. Its often the case that in reviews like this, both parties will come up with a solution that was even better than either one of them could have done alone. Its an environment that promotes collaboration and rewards both the reviewer and the reviewee.

It also means that the quality of your codebase will improve moreso than if the policy is to just reject things that don't meet the standards. Having a policy of saying "no" to anything you don't like without providing mentorship might mean that bugs never get fixed, or that specs never get completed, because nobody wants to go through that process only to run the very high risk of just being turned down again.

## Keep code reviews about code, and RFCs for specs

I've seen it many times before - someone proposes a patch to change the behavior of a system and the patch gets rejected because the system wasn't meant to behave that way in the first place. That's a fair call for the maintainers - the scope of the software needs to remain determinate, as does it's specified behavior.

The best thing to do in this case is **document exactly how your system is supposed to work, even for the bits that haven't been completed yet**.

Then review becomes a two-step process - first, contributors propose an RFC to change the proposed behavior, get that added to the specification, and then they propose the code to make that specification a reality.

No wasted time writing patches that get turned down because of the unwanted change in behavior  Clearer expectations for everyone involved.

## Use a centralized review system

Many free software projects use the model of "patches on a mailing list". This works for small-scale projects and small-scale patches with a small number of maintainers, because the patches just flow in with the rest of their email. It gets really out of hand for large projects. Here are some of the problems with using email to manage patches:

1. **The email filibuster can kill pretty much anything**: The huge problem with mailing lists is that they invite endless discussion, and email is not very good at keeping context. Stuff can be discussed endlessly, and its often not about the code
2. **Keeping track of multiple patches is a pain**: Email doesn't provide you a centralized list of unmerged patches. Its just all over the place in your inbox. Better hope that someone tagged it with [PATCH]
3. **Making changes to patches is a pain and also slow**: If you want to make a change to a patch on a mailing list, you have to rebase all of your patches in your vcs checkout, and then you have to undo a bunch of commits and re-do all the commits. Then you have to mail the new patches to the list and go through the review process all over again, with all of the original context lost in history. Granted, tools like [quilt](<http://en.wikipedia.org/wiki/Quilt_(software)>) make the first part of this a little easier, but not the second part.

There are so many tools out there for keeping track of patches and reviews nowadays. There are the project hosts like GitHub and Launchpad which provide integrated code review based on the merge-model, or there are tools you can host yourself like [patchwork](http://jk.ozlabs.org/projects/patchwork/), [reviewboard](http://www.reviewboard.org/), [gerrit](http://code.google.com/p/gerrit/) and if you don't mind paying, proprietary tools like [Crucible from Atlassian](http://www.atlassian.com/software/crucible/overview).

All these tools take the pain out of patch-management. The developer just hacks away on their own clone of the repo in their own branch, pushes stuff to that branch and then when ready, proposes a "merge" of that branch into mainline. Most tools allow you to make comments directly on specific parts of the code, and automatically update diffs as soon as new changes are made.

## Automate!

There is so much about patch review that is totally boring. Nobody likes hand-inspecting a piece of code to make sure it fits all the formatting and style conventions, making sure that it has adequate test coverage, making sure that it doesn't have any bugs that could be found by static analysis.

The good news is that most of this stuff can be automated. At Canonical we ran the same continuous-integration job on every active merge proposal, which, at least in the form that I worked with it, checked that the branch in it's current state could be:

1. Merged
2. Builds
3. Passes all tests
4. Installs correctly
5. Passes any runtime tests

You can do so much more with continuous integration too. You can also check that the code matches the style conventions ([StyleCop](http://en.wikipedia.org/wiki/StyleCop), [astyle](http://astyle.sourceforge.net/)). Furthermore, you can do some rudimentary static analysis with clang's [scan-build](http://clang-analyzer.llvm.org/scan-build.html) tool. You can check if all the various #ifdef combinations build correctly. You can check for performance regressions by having some standardized performance tests. In code, more stats about how your change affects the codebase are king, and serve to inform reviews rather than make them do guesswork about how changes in code might affect your product. That being said, metrics shouldn't drive review, but rather inform it. A goal of review should be to understand why the metrics say what they say, whether or not that's important, and then use that to determine where to go next with the patch.

## Apply the "better-in-than-out" principle

The thing about perfect is that its impossible. The question to any good review is "would the proposed change in its current state be something which we'd rather ship tomorrow as opposed to what trunk is today?". If so, then know where to put the boundaries of what the scope of the review is and call it a day. All software is a work-in-progress. If you know where to go after the patch is merged, then there's no sense delaying it any longer when it could be serving a good purpose now.

## Set a review deadline

One of the things that can absolutely kill a patch review and leave lots of patches lying around everywhere is a review that goes for a seemingly endless period of time. Especially in free software, people get frustrated, people get distracted, and then they move on, leaving the maintainer wondering what to do with the patch that still had some follow up left.

Review deadlines really help here. Evaluate the complexity of the change, think about what it affects and what work needs to be done at first instance, and then set a deadline based on that. Have both parties engage with the review process until that date, and then apply the better-in-than-out principle at that date, or if new circumstances arise, renegotiate the deadline. Having clear expectations about where a patch is going and how long a review is going to take will take away a real source of demotivation amongst contributors.

## Make it mandatory for everyone

There's nothing worse than a project where some people are treated as better than others. Make code review mandatory for everyone, including for that person who has been working on it for ten years. Not only will they learn new things they might not have thought of from fresh blood in the project, but it also instills a sense of both responsibility and equality in new contributors too, because they feel as though everyone is on an equal footing and not at some kind of prejudicial disadvantage by virtue of the fact that they are new.

This isn't an exhaustive list of all the things that will make code review a rewarding process as opposed to a dramatic one, but it certainly makes up some of the major factors that I've found in code review processes that are functional as opposed to dysfunctional.
