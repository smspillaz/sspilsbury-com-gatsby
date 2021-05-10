---
title: "XBMC on Wayland Compositors, take two"
date: "2013-07-16"
description: An initial pull request
post: true
tags:
  - "wayland"
  - "xbmc"
---

In late February this year, I [published a proof of concept](http://smspillaz.wordpress.com/2013/02/27/hello-from-xbmc-on-wayland/) demonstrating the XBMC Media Center on the Weston system compositor. It was basically a hack which used SDL's existing wayland compositor support with [a few additions](https://github.com/smspillaz/SDL) required to make XBMC work. [XBMC plans to drop SDL usage](http://smspillaz.wordpress.com/2013/02/27/hello-from-xbmc-on-wayland/#comment-8473) and use window systems directly, which makes a lot of sense, but it meant that this proof of concept would have to be largely rewritten.

As such, I've decided to do so as a Google Summer of Code [project](http://www.google-melange.com/gsoc/project/google/gsoc2013/smspillaz/10001) (suprise!), as a kind of "take-two", except that it uses the Wayland client interface directly, (shouldn't) crash, (should) have some more comprehensive test coverage and perhaps could be expanded to support other display systems like Mir and direct display on the framebuffer via kms/gbm.

![Wayland on Weston on X](https://sspilsbury-com-images.s3.amazonaws.com/posts/wordpress/images/wayland-on-weston-on-x.png)

I've just published a new [pull request](https://github.com/xbmc/xbmc/pull/2989) for an initial version of this work. Hopefully users will be able to use this (and perhaps much more at the end of the GSoC cycle).
