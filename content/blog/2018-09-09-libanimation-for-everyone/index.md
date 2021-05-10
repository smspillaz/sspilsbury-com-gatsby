---
title: "libanimation for everyone"
post: true
description: Separating math from rendering
date: "2018-09-09"
---

This blog post got reposted on [reddit](https://www.reddit.com/r/linux/comments/9fq4v9/compiz_effects_are_coming_back_to_gnome_shell/) with the title "Compiz effects are coming back to GNOME-Shell". That is **not** what is happening here at all. Don't expect any of this stuff to make it into any upcoming Shell releases, because it hasn't been discussed with anyone in the Shell team.

Instead, what I was **trying** to say was that I was looking into whether it was possible to do so and created libanimation in the process. Libanimation is a math library. Someone still has to write a binding on the compositor side to consume its outputs and make it work. I can say that at least for GNOME-Shell it is certainly **possible** to do so, but someone else would need to write it and upstream it.

**End big important edit: original blog post upcoming.**

Something I worked on when I first started at [Endless](https://endlessos.com/) was the rather interesting task of "making Wobbly Windows from Compiz work on GNOME-Shell".

This task is interesting in the sense that GNOME-Shell doesn't really work in the way that the wobbly plugin for Compiz wanted it to. There is the "Wobbly Windows" [extension](https://extensions.gnome.org/extension/669/wobbly-windows/) for the shell, but that was sort of out for Endless, since we didn't want to rely on the extensions mechanism and that extension also didn't quite work the way I had come to know and love.

What I really wanted to do with this project was replicate the same smooth wobbly windows from Compiz in the shell itself.

Where do you even start on such a project? The first hard part is trying to get the math to work and knowing that you have the math working. Thus, [libwobbly](https://github.com/smspillaz/libwobbly) was born - a library that reimplements the same math that Compiz itself used, allowing callers to create a 3x3 mesh of springs representing the physical effect of "wobbly" windows and providing functions to interpolate into that 3x3 mesh. Then, we used libwobbly in our fork of GNOME-Shell along with [ClutterDeformEffect](https://developer.gnome.org/clutter/stable/ClutterDeformEffect.html) and a [bridge](https://github.com/endlessm/gnome-shell/blob/master/src/wobbly-effect.c) to get the same, buttery smooth wobbly windows in GNOME-Shell.

However, this approach had its shortcomings. Up until very recently it only exported a C++ interface, because I very foolishly was obstinate about keeping things in C++ at the time. This made integration into the shell a pain for a variety of reasons, among them frequent ABI breaks due to compiler or boost changes, needing to have a whole separate GObject-Introspection typelib just to handle the C++ stuff, separate build rules, etc etc. Of course, this state of affairs wasn't well appreciated by others who work on our fork of the shell, with the running joke that whenever the shell breaks, it was always libwobbly's fault.

For a few reasons I won't get into, window animations became a priority at Endless again and we wanted to see if we could do a better take on libwobbly. I didn't want to throw the whole thing out, since it is quite well tested and a lot of thought went into its design.

The result is an improved library, [`libanimation`](https://github.com/endlessm/libanimation) designed to be used from C++ programs with a C++ interface as well as C and language bindings with a GObject interface wrapping the C++ interface. In future, we should also be able to create emscripten bindings to the C++ interface, allowing it to be used directly in web programs too.

The name change represents a broadening of the project scope. For a few reasons, we wanted to preserve not only wobbly windows, but also the other (decent) effects from Compiz too, among them **zoom**, **bounce**, **glide** and **magic lamp**. The library does not insist on taking over any of the rendering or scene graph management. Instead, `libanimation` is designed to provide "the math" and can be seen as a black box, where you feed it a requested animation configuration, a step function (linear, reverse, quadratic, sigmoid) and can "get out" a series of affine transformations or deformed co-ordinates given a pair of unit co-ordinates.

Over time, more animations will be added. I hope that the library will be useful to authors of other compositors or applications and help to preserve some of the more magical parts of Compiz as technology itself matches forward.
