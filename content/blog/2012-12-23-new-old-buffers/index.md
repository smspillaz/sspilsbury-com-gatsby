---
title: "New Old Buffers"
date: "2012-12-23"
post: true
description: Something smarter than the regular double-buffering
---

The `GLX_EXT_buffer_age extension` is gaining some traction. Now that a [spec](https://github.com/rib/gl-extensions/blob/master/GLX_EXT_buffer_age.txt) has been published for GLX (and [EGL](https://github.com/rib/gl-extensions/blob/master/EGL_EXT_buffer_age.txt)), we've seen implementations appear first in the [nvidia driver](http://www.nvidia.com/object/linux-display-amd64-313.09-driver.html) and now patches have appeared for [mesa](http://lists.freedesktop.org/archives/mesa-dev/2012-December/031601.html). In short, these patches allow compositing window managers to retain high performance with low-frame latency and zero tearing.

**edit:** I'm advised that the mesa patchset is EGL-on-wayland/KMS only at the moment.

For the curious, here's an explanation of how all of this is done.

OpenGL wasn't written with compositing window managers in mind. Instead, it was designed for 3D graphics software (think CAD) and games. Typically, these applications ran full-screen and used 3D models which needed be redrawn completely on every frame.

A common problem in graphics software is [tearing](http://en.wikipedia.org/wiki/Screen_tearing) which happens when the process stuffing pixels into memory isn't synchronised with another process that pulls those pixels out of memory and on to a display device of some sort. A race condition can occur where the display device shows a half finished image because the first process hasn't finished writing it.

[Double buffering](http://en.wikipedia.org/wiki/Multiple_buffering#Double_buffering_in_computer_graphics) was mostly designed to solve this problem. But it comes at a penalty, either in memory usage and performance, or latency. How? Lets see:

## The Problem:

The problem that double buffering presents is quite simple: You have two buffers, and a monitor running at XHz. The application fills buffer A, marks A as the "front" buffer and then fills up buffer B, all before the monitor even has a chance to display A. What now?

## Solution 1: Wait around for the monitor

The introduces latency into your application. It essentially means you have to block until the next vertical blank period, and then start rendering into buffer A again. One of the advantages of this approach is that you already know what's in buffer A, so if only a little bit changed, you can just update that little part. Unfortunately OpenGL never provided a deterministic method of knowing that buffer A actually has what you might expect in it (the specification says it is "[undefined](http://publib.boulder.ibm.com/infocenter/pseries/v5r3/index.jsp?topic=/com.ibm.aix.opengl/doc/openglrf/glXSwapBuffers.htm)", and we'll see why soon).

As such, most applications tend to emulate this approach by never actually doing buffer "flipping", but instead copying data from the back-buffer into the front-buffer just after the monitor has displayed the last frame. So it might look something like this:

```cpp
glFinish (); // Wait until the backbuffer is completely filled, this blocks the CPU
unsigned int oldCount = counter; // Frame counter

// wait until the monitor has displayed the last frame
do
    glWaitVideoSync (1, 0, &counter);
while (oldCount == counter)

// draw directly to front buffer
glDrawBuffer (GL_FRONT);
glReadBuffer (GL_BACK);
// copy from backbuffer to front buffer, either using hardware blitting with glXCopySubBufferMESA / eglPostSubBufferOES or texturing with glCopyPixels

// start drawing next frame to backbuffer
glDrawBuffer (GL_BACK);
```

This is what compiz did until earlier this year. As far as I'm aware, this is how mutter and kwin also do it, and for good reasons.

Unfortunately this approach has its problems:

- **Doesn't offer true tear-free rendering:** glXCopySubBufferMESA, eglPostSubBuffer and the fallback involving glCopyPixels are not atomic operations. What happens if someone interrupts your process halfway between these? Then you get tearing.
- **Have to block the CPU:** There are two places we have to block the CPU here: in the first *glFinish* call and also in *glWaitVideoSync*. In the worst case scenario, you might *just* miss the next frame and have to wait a whole other frame for glWaitVideoSync. That's no good.

## Solution 2: Render lots of frames, and let the GPU handle them

As I mentioned earlier, *glXSwapBuffers* does not give you a guarantee of a defined backbuffer. That means that you'll be at your own peril of garbage-on-screen unless you touch every single pixel in that backbuffer.

The reason for this is two fold.

First of all, for frames A, B and C, you might render A and B before the monitor has even gotten a chance to render A. Now in a double buffered scenario, you have two choices, wait around until A is available, or grab a new buffer C and start using that. The committee that designed OpenGL recognized that waiting around for A is a sub-optimal solution, so they allow implementations to just give you "an available frame", whether that be A or C.  Of course, C does not contain A's contents, so it is "undefined".

Secondly, if your window is resized, then you get entirely new buffers to render into, it doesn't make any sense to rely on the backbuffer after glXSwapBuffers being defined in this case.

That being said, the true-double-buffering approach has two key advantages:

- **Zero tearing:** The front-to-back swap is truly atomic - changing a pointer. The monitor gets either the old frame or the new frame, and nothing in between.
- **No waiting around**: Because the GPU is catching up with the CPU sending it commands, it can just put frame A as the "front buffer" when ready, and then frame B, and then frame C, since it intimately knows the monitor vertical blank timings.

After some consideration, this is the approach we decided to go with in compiz earlier this year.

But what about the undefined backbuffer problem? How do we avoid redrawing everything on every frame?

Well, there's a clever way around that, albeit at a slight performance hit: you can "emulate" a defined backbuffer by having ownership over the buffer that you render into, eg a framebuffer object.

```cpp
// we're going to read out of it later
glBindFramebufferEXT (GL_READ_FRAMEBUFFER, someFBHandle);
glBindFramebufferEXT (GL_DRAW_FRAMEBUFFER, someFBHandle);
// render scene, with the knowledge that the framebuffer contains exactly the same contents as the last frame

// we're done here, render to the backbuffer again
glBindFramebufferEXT (GL_DRAW_FRAMEBUFFER, 0);
// Do a fast "blit" operation from the framebuffer object to the backbuffer and redraw every pixel there
glBlitFramebufferEXT (0, 0, screenW, screenH, 0, 0, screenW, screenH, GL_COLOR, GL_LINEAR);
// This frame is done, ask the GPU for a new one
glXSwapBuffers ();
```

This approach is one of many to handle this problem. The other involves doing the buffer swap and then scraping the contents of the frontbuffer on to the backbuffer, but I haven't shown it because it requires the CPU to block and may involve copies into system memory. Framebuffer operations all happen on the GPU.

Of course, the problem here becomes fill-rate. GPU's can touch a certain number of pixels on every frame, doing it this way means that you have to touch WxH pixels on every frame. Once you exceed the fill rate, things slow down in a linear fashion and you start missing frames.

## Enter Old Buffers

What `GLX_EXT_buffer_age` allows us to do is query the age of the backbuffer in terms of frames. **This essentially means the old problem, where the backbuffer was undefined after glXSwapBuffers is now gone**. Its done by querying the `GLX_BACK_BUFFER_AGE` attribute on the backbuffer after a swap, and doesn't involve stalling the CPU because its all stored in the OpenGL context on the client side.

But what does knowing the age of a backbuffer mean for us?

Let say that we have a window with four equal sections, A, B, C and D. The render loop for this window is really simple, we just draw into A on frame 1, then B on frame 2, C on frame 3, D on frame 4 and then back to A on frame 5 and so on.

We want the effect here to be cumulative. So frame 1 should have A rendered, then frame 2 A and B and so on.

If the backbuffer was completely undefined, on frame 1 we'd render A, (nothing), (nothing), (nothing), (nothing) and then on frame 2 we'd render A, B, (nothing), (nothing) etc.

If the buffer age is 1 (eg, last frame) on frame 2, we already know that A, (nothing), (nothing), (nothing) is there, so we just render B.

If the buffer age is 2 on frame 3, then we know that A is there, but B is not yet there, so we render B and C.

If the buffer age is 2 on frame 4, then we know that A and B are there, but C isn't, so we do C and D.

If its 3 on frame 4, then we render B, C and D, since only A is there.

Drawing individual regions of the screen works something similar to this in compiz. Ideally when a blinking cursor changes, we only want to redraw just that cursor and nothing else.

Having `buffer_age` means that we can now get rid of those costly framebuffer binds, and that constant-time `glBlitFramebufferEXT`, which scales poorly. Problem solved.

## Other odds and ends

I've been continuing work into making this work well with compiz and unity, since I believe that so far, its our biggest performance bottleneck. Part of making sure that works is that when drawing stuff into the backbuffer, you actually have to mark it as "damaged", so we can redraw it properly if we get a frame that's older. Unfortunately, there were some plugins *cough*unity*cough* that didn't respect this, and just redrew everything to the backbuffer regardless of the damage region. So I've been busy hacking support for partial redraws back into nux and unity (it used to be there in previous versions, but was removed once we switched to method 2 earlier, because this problem would cause bleeding and other nasty artefacts).

I've mostly got it fixed up now, so I'd appreciate some more testing. And I'm sure you'll appreciate the FPS increase :)

**ppa:smspillaz/compiz-experimental**
