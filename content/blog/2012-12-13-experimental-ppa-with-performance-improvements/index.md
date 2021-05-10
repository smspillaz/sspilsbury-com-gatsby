---
title: "Experimental PPA with performance improvements"
date: "2012-12-13"
post: true
description: Repainting tricks to a desktop near you
---

Hey All,

There won't be many merges going on in lp:compiz over the holiday break, so I've put together a PPA with various performance and other improvements for compiz so that we can get some wider testing before merging.

You can find it here:

**ppa:unity-team/staging**

**ppa:smspillaz/compiz-experimental**

Notable changes include:

- Support for the [recently released](http://www.nvidia.com/object/linux-display-ia32-313.09-driver.html) support for GLX_EXT_buffer_age (currently only supported on nvidia, but my understanding is that it will be supported in most of the Mesa drivers by 3.8)
- A fix for one of the last window-stacking bugs, regarding our handling of windows destroyed on the server side but we haven't yet received a DestroyNotify for
- Support for `GL_EXT_blit_framebuffer` to enable fast framebuffer copies when rendering with postprocessing
- Fixes to prevent us from flooding the server with ConfigureWindow requests when moving windows around. This fixes a significant performance bottleneck on nvidia, especially when doing the same while an OpenGL window is running at the same time. Enable "lazy positioning" to ensure that ConfigureWindow requests are only sent when the window is actually ungrabbed.

There should be an across-the-board framerate increase when using this PPA. Please throw it at the wall and report bugs for any functionality that doesn't work or works a little weird (especially to do with window move and resize). Tag them with compiz-experimental-ppa.

Support for `GLX_EXT_buffer_age` means that on platforms which support it, we are able to have tear-free rendering with the same performance as doing incremental updates to the backbuffer. For simple cases, with framerate throttling turned off (which is not a good metric), this resulted in a 200FPS increase.

**note: unity is mostly working now, however there is an interaction problem that's making it less optimal than it could be. I'm working on a way to eliminate that problem.**

**edit:** **ppa's don't work the way I think they do. You will also need to add ppa:unity-team/staging**
