---
title: "Benchmarking some of the new performance changes coming up in compiz"
date: "2013-02-12"
post: true
description: Theory to practice
---

In December I blogged about some changes I was working on for compiz which [should help with performance across the board](http://smspillaz.wordpress.com/2012/12/13/experimental-ppa-with-performance-improvements/) , and I later talked in depth about one of those changes, being [support for GLX_EXT_buffer_age](http://smspillaz.wordpress.com/2012/12/23/new-old-buffers/). Now that we're finally on the road to getting these changes back into mainline, I took some time to get some benchmarks of what the performance impact was as part of the [review procedure](https://code.launchpad.net/~compiz-team/compiz/compiz.fix_1024304/+merge/147832).

Huge thanks goes out to **Esokrates** who volunteered some of their time to provide the standard phoronix-test-suite benchmarks to guide where to look for where these changes made the most difference. I will publish those as soon as I have permission, because they are quite interesting.

For now, I'll report on some of the benchmarks I've been doing. My main interest is in redirect non-fullscreen windows, because this is where GLX_EXT_buffer_age would have the most impact. For fullscreen windows, we already unredirect those and they are hardly affected by the compositor. As a reminder, GLX_EXT_buffer_age effectively allows us to have asynchronous vsync support (no blocking rendering on a timer) without filling up every frame and wasting fill-rate because new frames are "undefined".

Phoronix Test Suite (PTS) does not support running any of the game benchmarks as windowed by default, which is why I've only run a select few, because I had to modify PTS to get them to run.

![Super Tux Kart](https://sspilsbury-com-images.s3.amazonaws.com/posts/wordpress/images/supertuxkart.png)

For some reason, supertuxkart struggled to get above 20FPS no matter what I did, and no matter which compositor was run (although their results are not shown here). I will note that the buffer-age-support configurations had a nice 4FPS boost in both the vsync-on and vsync-off cases

[Tremulous](https://sspilsbury-com-images.s3.amazonaws.com/posts/wordpress/images/tremulous.png)

My hardware had no problems with tremulous, and again, there was a 7FPS difference between buffer-age-support and no buffer-age support

[Unigine](https://sspilsbury-com-images.s3.amazonaws.com/posts/wordpress/images/unigine.png)

The big difference really came with the unigine sanctuary demo, which my hardware could barely handle. It is very heavy on postprocessing, HDR lighting and real time particle effects. This requires a lot of fragment bandwidth. With buffer-age-support, we got a 13FPS or 5x boost on performance in windowed mode. I am sure that the curve for the % improvement is probably logarithmic if it were to be tested on other hardware, but it is still quite promising.

![Performance Chart](https://sspilsbury-com-images.s3.amazonaws.com/posts/wordpress/images/compiz-perf-graph.png)

This graph shows the performance of compiz (measured by the bench plugin with output on the stdout captured by a python script) while the three tests were running. The orange and red lines represent runs with buffer-age-support on. As you can see, they reach the tremulous tests much earlier, and the blue line (which is the non-buffer-age support codepath) flatlines when the unigine test is reached, whereas the others stay at a steady 20FPS.

Hopefully that should show what is in store.

**Edit:** Now that I have permission, here are some more benchmarks of fullscreen games both with and without unredirection, compared to some of the other compositors. Thanks **Esokrates**.

![Benchmarks](http://smspillaz.files.wordpress.com/2013/02/4.png)

![Benchmarks](http://smspillaz.files.wordpress.com/2013/02/5-svg.png)

![Benchmarks](http://smspillaz.files.wordpress.com/2013/02/7.png)

Generally speaking I take full-screen benchmarks with a grain of salt, because there are so many factors that could affect their performance. But I think these three show that we've consistently improved across the board.
