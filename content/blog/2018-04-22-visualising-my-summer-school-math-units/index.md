---
title: Visualising my Summer School math units
post: true
description: Fancy notes
date: "2018-04-22T01:47:49.715Z"
categories: []
keywords: []
slug: /@smspillaz/visualising-my-summer-school-math-units-a2ff300b0244
---

Last year I decided that I wanted to undertake further study in Computer Science after completing my Bachelor at the University of Western Australia. Specially, I want to specialize in deep learning. Its the future, and an extension of Computer Science, so shouldn’t be too hard, right?

![](https://sspilsbury-com-images.s3.amazonaws.com/posts/medium/img/1__8DXtlvIovYZWhkuZ9TIHgw.jpeg)

Problem: I suck at math.

Contradiction: I worked on a [very math-heavy project](https://launchpad.net/compiz) for the better part of my career.

Yes, its a confession that a lot of self-taught programmers aren’t exactly the strongest when it comes to [mathematics](https://www.theatlantic.com/technology/archive/2015/09/you-dont-have-to-be-good-at-math-to-learn-to-code/403342/). The dirty secret of programming is that you really don’t need much math beyond basic arithmetic to achieve most of what you want to do.

No, really, you don’t.

Most programming is what I like to call “boxes and arrows”. You’re just taking one process and connecting it to another with some rules in between. Customer goes to website. Fetch data from database using a query. Marshal the data into a table. Display it. Done.

I can’t really remember the last time I wrote an algorithm for something that was customer facing. Or used math for that matter.

In fact, I went through my entire degree taking only the bridging high school calculus and geometry classes that were required for completion. Useful, but they don’t teach you anywhere near what’s required to understand deep learning.

So when I saw that the requirements of literally every degree programme I applied to were:

- Probability and Statistics
- Linear Algebra (Matricies, Vectors)
- Multivariate Calculus (Derivatives and Integrals of multidimensional objects)
- Analysis (Differential Equations)

Well, I kinda freaked out a little. How was I going to acquire so much understanding when my base knowledge was already so feeble? I was literally so bad at math that I scored within the bottom 30th percentile when I graduated from High School and I studied **really** hard.

[Summer school](http://www.student.uwa.edu.au/course/enrolments/summer), to the rescue. Not sure how I did it, but I basically learnt all that in the course of eight weeks through three intensive four hour classes per week plus homework and lectures in my own time. I remember that when I enrolled I got a note from the faculty advising me not to do it. I did it anyway.

Probably the hardest I’ve ever worked in my life. I was also working part time too.

Remembering stuff was a problem. [3b1b](https://www.youtube.com/channel/UCYO_jab_esuFRV4b17AJtAw) is probably one of the best resources ever, but it doesn’t have worked examples. So, code to the rescue.

![](https://sspilsbury-com-images.s3.amazonaws.com/posts/medium/img/1__0Z0mwK09IGflRi0Fju2vIA.png)

[Intuitive Math](https://intuitive-math.club) is a project that I’ve been working on since I started studying for my exams. It contains detailed visualizations and worked examples for concepts in Linear Algebra and Geometry. Built with React and WebGL. Hosted on a serverless instance because [I like that](https://medium.com/@smspillaz/getting-aws-lambda-and-api-gateway-to-support-binary-2018-edition-9dfd81ab9291). [Open source](https://github.com/smspillaz/intuitive-math), too.

I’m happy to say that it is available for the public to try and learn from today.

Some of the visualizations are pretty interesting.

Take [Elementary Row Reduction](https://www.intuitive-math.club/linear-algebra/elementary-row-operations) for example. This is the process of filling the bottom and top diagonals of a matrix with zeros by adding scalar combinations of rows to each other, such that you get all non-zero numbers down the diagonal. What is that actually doing?

![](https://sspilsbury-com-images.s3.amazonaws.com/posts/medium/img/1__8X6xhiyrAdHmbgdxg1rvjw.png)

Well, if you look carefully at the diagram, if we visualize each column as a plane, then you’ll see that the planes are being “straightend out” such that they all intersect at exactly one point:

![](https://sspilsbury-com-images.s3.amazonaws.com/posts/medium/img/1__iGMgfjrHk1FZYGuCm6g3mA.png)

Here’s another example: Doing super-elementary row reduction to find an [inverse](https://www.intuitive-math.club/linear-algebra/inverses) removes all the skew to start with:

![](https://sspilsbury-com-images.s3.amazonaws.com/posts/medium/img/1__Bm4waEEHCKp2s0a6MaoGgw.png)

But it is only when scaling by the determinant that the inverse is truly found:

![](https://sspilsbury-com-images.s3.amazonaws.com/posts/medium/img/1__OXohI796eGOqQOy__LZspmA.png)

[Eigenvalues](https://www.intuitive-math.club/linear-algebra/eigenvalues) are found when we find a single value which when subtracted from both dimensions, flattens space into a lower dimension:

![](https://sspilsbury-com-images.s3.amazonaws.com/posts/medium/img/1__r1Obaz6FcqQZZZzkqhQS3g.png)

If you want to find the [surface area](https://www.intuitive-math.club/geometry/surface-area) of a complex surface, observe that the normal vector for each small parallelogram patch is the same as the area for that patch. So just add up (integrate) all the normal vectors:

![](https://sspilsbury-com-images.s3.amazonaws.com/posts/medium/img/1__7bOOW9YfvAwh6PqCCKMdAA.png)

For more and worked examples of linear algebra and calculus problems, just [head on over](https://www.intuitive-math.club). I hope you find it useful.
