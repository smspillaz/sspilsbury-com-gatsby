---
title: Co-pilot might be helping others infringe copyrights
date: "2021-05-08"
description: "But what does that mean in practice?"
post: true
---

It finally happened - a billions-of-parameters next-word-prediction model is fine-tuned
to predict [code from comments](https://copilot.github.com)[^1] and this finally [sparks](https://news.ycombinator.com/item?id=27687450)
[a](https://news.ycombinator.com/item?id=27724042) [debate](https://news.ycombinator.com/item?id=27736650) about copyright, the ethics of big models and other related things.
This debate is probably long overdue, considering that these big models can do things
like write [books](https://www.reddit.com/r/GPT3/comments/j05328/i_wrote_published_a_book_using_gpt3/), generate "realistic" [images](https://openai.com/blog/dall-e/), generate [music](https://openai.com/blog/jukebox/), presumably all in some sense with properties derived from the petabytes of training data used to fit the billions of parameters.

Anyway, GitHub freely admits that in "0.1% of cases"[^2], their code-from-comments prediction model, called Co-Pilot, will regurgitate its training data. And of course,
in some cases, this is clearly a Bad Thing because you can do things like reveal personally
identifying information or [secrets](https://twitter.com/alexjc/status/1411966249437995010) for web applications that people have posted on the
public internet without fully appreciating that it is, in fact, public. But that was
obviously going to happen because the web is a messy mess of good things like Wikipedia, journal articles and cat videos, but also bad things like warez, password leaks and hate
speech. The thing which people are up-in-arms about is the fact that Co-Pilot is GPT-3
fine-tuned on "publicly available source code" (presuambly the entire commit histories
on public repos on GitHub). And some of that source-code is licensed under the GPL[^3]
which doesn't allow you to do just *anything* with the source-code, but instead
imposes specific obligations on people who do copy and re-use it in certain ways,
which we'll get to in a minute. Now there's something bordering on collective
outrage that this product is going to start enabling mass-violations of the GPL.

To be clear, [regurgitating GPL-licensed code and slapping an MIT license notice on it](https://twitter.com/mitsuhiko/status/1410886329924194309) has bad optics and understandably
leaves a poor taste, but its sort of like coaching a 4-year-old to say offensive things
in that you actually have to put in some effort into making it do that - in this case,
giving it *exact same* function declaration (`float Q_rsqrt(float number)`) and also
a copyright notice that does not contain the author name, which, as you would expect,
will reproduce the body of the GPL licensed code, then reproduce the MIT license notice
because presumably most code on GitHub is licensed permissively, so that's what is going
to minimize the model's expected next-token loss. If the tweet author compiled that code,
then distributed only the object code, its quite likely that they'd be violating the original
 license, regardless of what Co-Pilot said that the license was, because, well, the author
using Co-Pilot knew what they were doing when they did that. And this is entirely the point.

To understand what constitutes "infringement of copyright" you have to
go back to understanding what copyright *is*. Now, I'm not acting as
your lawyer here nor am I intending for people to use this as legal advice
to justify or not justify their usage of Co-pilot internally. But I did
receive some legal training and I'm relatively confident that there is
at least an *argument* to suggest that this isn't so clear cut. But
compare copyright to other things that we have in the intellectual property
regime. We only recognize property in intellectual output to the extent
that it is necessary to have a "fair" economic system and people who put
work into things can reap the fruits of their labour, but also without
infringing too much on the intellectual freedom of everyone else. Patents,
for example, give you a limited economic monopoly on your invention but a 
part of the deal is that you have to go through a long registration process
and disclose your invention to everyone else on the registry. Once
you're done, you can stop others from using that invention even if they
came up with it independently.

Copyright on the other hand is much more limited. It doesn't restrict
intellectual freedom absolutely, but rather it restricts what people
can do with *your work*. Copyright, at its core, is the exclusive right
to *make copies of the work*, which is a verb in relation to the work and not a monopoly over the information contained within. Making an
*infringing* copy fundamentally requires *copying* which in turn requires
some intention to appropriate. If I happened to feed bits into a random
number generator and the resulting stream was something that happened to
look like a hollywood movie - I'd probably be in the clear as long as there
was no reason for me to believe that this was actually just a copy of
an existing movie because it featured an ensemble cast of Leonardo DiCaprio
and Nicole Kidman and whoever famous actors are these days. I would
probably be copying *The Avengers* if I keep feeding random bits into the
generator and eventually get lucky and generate something that basically
looks like *The Avengers* even if the generated title was *The Superheroes*.

I think Co-Pilot is in a similar boat. If I engineer
the inputs to Co-Pilot such that it generates what is know is extremely
likely to be a copy of some GPL-licensed code, then I use that code in
a way that violates the terms of the GPL, I'm quite likely to be
infringing the copyright of the original author. If I happen to generate
code that looks an awful lot like code that came from the kernel or
from GNOME, then I'm at least on notice that I should check if this really
is a copy before I use it in a way that might be infringing. But if I
happen to generate code that looks novel and adapted to solving my
particular problem and there's just no way that a reasonable person
in my position could suspect that it was a copy of something else, then
I'm probably in the clear.


[^1] This isn't exactly a mind-blowing advance. The GPT-3 [paper](https://arxiv.org/pdf/2005.14165.pdf) lists CommonCrawl as a dataset source, which is basically petabytes of text, some of which contains source code. Indeed, even [GPT-2](https://app.inferkit.com/demo) will autocomplete code that kind of looks like the kernel if you give it a snippit of comments from the kernel.

[^2] Its not clear to me how they got that number. User study? Random fuzzing?

[^3] Or APGL. Or MPL.