---
title: "A note on compiz development and Unity / Ubuntu"
date: "2013-01-10"
post: true
description: Some quick debunking
---

I was quite disappointed to see this in a bug comment today:

```
> Compiz [...]. The only work on it are hacks to bend it to the will of Unity
```

There seems to be a misconception going around that Compiz exists only to serve the needs of Unity as the compositor framework, and that development of compiz exists as a series of "bends" to make Unity work.

That is not true, and has never been true.

Internally at Canonical, compiz was always handled as a separate upstream project. It was a separate upstream project before I worked there, a separate upstream project while I worked there, and is a separate upstream project after I left.

Not once was any development decision in compiz made for the sole benefit of those who use Unity to the detriment of those who use compiz as a standalone window manager or with other desktop environments. If it did - you would know about it. Unity is a very tightly designed desktop shell in which many of the parts that make it up were highly dependent on the other parts. That was by design - the team that led the implementation of Unity wanted to create a great desktop shell, and not to create a series of independent parts.

Compiz was always the exception to the rule.

If compiz truly was a compositing framework that was a part-and-parcel of Unity, then one would see that the entire plugin system / settings framework would have been dropped - the window decorators would have been dropped, many of the plugins would have been dropped from the source tree completely, and much of the window management behaviour would have been rewritten internally to match the Unity design guidelines.

That never happened, because the DX team and later the Product Strategy team at Canonical saw the value of keeping compiz as a separate upstream project, in which Canonical and the Ubuntu community invested effort into which benefited all users and not just those who used Unity.

What did happen, during my employment at Canonical, and while compiz is the compositing framework for Unity is that the developers who are working on it tend to put their priority on things that affect the most users. Considering that its the default desktop on Ubuntu - that's a very large chunk of users. The good thing is, that all of the effort put into that maintenance usually always benefits those who don't use Unity as well.

There's only one place where I screwed up in this aspect, and that was in the maintenance of the grid plugin. I believe that's one area where I let design requirements take over the original intent of the plugin. The better thing to do would have been to implement it inside of the Unity shell. So to the original author - an apology. I've messed up in that regard. But I hope that all of the work I did both at Canonical and outside of Canonical has been worth it for everyone who uses compiz, and not just those who used it with Unity.
