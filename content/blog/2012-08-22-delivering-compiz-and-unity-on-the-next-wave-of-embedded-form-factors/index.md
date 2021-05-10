---
title: "Delivering Compiz and Unity on the next wave of embedded form factors."
date: "2012-08-22"
post: true
description: Moving on from the legacy OpenGL API
---

Today marks a very important day in the history of Compiz and Unity.

As of about six hours ago, the [OpenGL|ES branch](https://code.launchpad.net/~compiz-linaro-team/compiz/gles2) for compiz has been [merged](https://code.launchpad.net/~compiz-linaro-team/compiz/gles2/+merge/120361) into [mainline](https://code.launchpad.net/~compiz-team/compiz/0.9.8). That means as of now, you can build lp:compiz on a platform like the pandaboard below and expect it to run as it does on the desktop.

![PandaBoard Platform](https://sspilsbury-com-images.s3.amazonaws.com/posts/wordpress/images/2012-08-22-22-49-11.jpg)

It also means that we'll be able to deploy compiz on any other platform that implements OpenGL|ES 2.0.

We're a bit late to the party on this one - KWin has had support for OpenGL|ES for about two years now, and GNOME-Shell has had it through clutter (although I don't know how long clutter has supported using EGL_KHR_image_pixmap). We wanted to make sure that we landed this code during an appropriate time to ensure that the bug pressure would be applied at the right time. We believe that this cycle was the right time to make this move.

Of course, in order to port us over to OpenGL|ES, we have to use a subset of OpenGL which is common to both implementations. This meant that a number of plugins have been heavily altered to do this, and some plugins do not work at all at the moment. They are disabled for building and will be ported later if there is enough demand for them to work.

Now that this work is merged, we can continue our development focus on just one branch, and have it work on all platforms that we want to target.

Huge thanks goes out to the team at [Linaro Ltd](http://www.linaro.org/) and [Collabora](http://www.collabora.com/), specifically [Travis](https://launchpad.net/~amaranth), [Fredric](http://fredinfinite23.wordpress.com/) and [Pekka](http://ppaalanen.blogspot.com.au/) and finally my colleagues Daniel and Tim, for whom this all wouldn't have been possible without.
