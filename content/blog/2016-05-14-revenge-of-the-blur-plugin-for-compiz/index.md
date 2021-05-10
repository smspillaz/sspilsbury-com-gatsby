---
title: "Revenge of the blur plugin for compiz"
post: true
description: Making the blur plugin work with the modern OpenGL API
date: "2016-05-14"
---

A couple of years ago I [blogged](https://smspillaz.wordpress.com/2013/01/04/understanding-the-compiz-blur-plugin-alpha-only-blurring/) about the blur plugin for compiz - how it worked and some of the changes necessary to make it work with the modernised codebase. I wanted it to be available for the rest of the Ubuntu users, but I was a little overzealous about how much I chose to re-write and I took a rather long hiatus from development before I was able to get it through review.

![Blur Plugin on Compiz 0.9](https://sspilsbury-com-images.s3.amazonaws.com/posts/wordpress/images/revenge-of-the-blur-plugin.png)

I've decided to revive that branch and minimise the change-set so that there might be one last chance of it making it into 16.10 before Unity 7 is dropped. I have to admit that these days there isn't really all that much use for it, unless you like transparent terminals. Transparent panels and window decorations have more or less gone away now and most WM-integrated shells handle blurs on their own just fine.

It can be found at [lp:~smspillaz/compiz/compiz.revenge-of-the-blur-plugin](https://code.launchpad.net/~smspillaz/compiz/compiz.revenge-of-the-blur-plugin). What can I say, reviving it has even been a little fun!
