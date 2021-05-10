---
title: "Experiencing the Mir client API"
date: "2013-07-27"
post: true
description: Some documentation from a third party
---

Now that [XBMC has display, mouse and keyboard support on Mir](https://github.com/smspillaz/xbmc/commit/8c5623439852de7b651bf68c623af2fe65b40026), I feel somewhat qualified to write about using the [Mir client API](http://unity.ubuntu.com/mir/), from the perspective of porting an existing application.

From a high level, the Mir client API (affectionately known as mir*toolkit in libmirclient) follows some of the basic constructs that you would find in Wayland. Namely, you have a _MirConnection* which is responsible for application-level communication with the display server, and a *MirSurface* which is responsible for managing some remote surface, drawing into it and handling events. Aside from `MirWaitHandle`, those are the only two objects that you'll be concerned with, so its a little unlike Wayland which splits its "Surface" concept up into separate interfaces like _wl_surface_, _wl_shell_surface_ and *wl_egl_window*(\*) and its "Connection" concept up into *wl_display*, *wl_registry*, *wl_compositor*, *wl_shell* etc.

(\*) Technically, _wl_egl_window_ is not an interface but just a wrapper around *wl_surface* and *wl_buffer* which uses *wl_drm* under the hood.

Synchronously opening a connection and creating an OpenGL(ES)-renderable surface in Mir is a simple-enough affair:

```cpp
MirConnection *connection =
  mir_connect_sync (path_to_socket, app_name);

MirSurfaceParameters parameters =
{
  surface_name,
  width,
  height,
  mir_pixel_format_argb_8888,
  mir_buffer_usage_hardware
};

MirSurface *surface =
  mir_connection_create_surface_sync(connection, &parameters);

EGLNativeDisplayType nativeDisplay =
  mir_connection_get_egl_native_display(connection);
EGLNativeWindowType nativeWindow =
  mir_connection_get_egl_native_window(surface);
```

From there, all you need to do is just initialize EGL, create an EGLDisplay with *eglGetDisplay*, create an EGLContext with _eglCreateContext_, create an EGLSurface with *eglCreateWindowSurface,* and then call *eglMakeCurrent* and start using OpenGL(ES) to render to your surface.

## Usually Asynchronous

Earlier I mentioned that a *MirConnection* and *MirSurface* can be created synchronously, but they can also be created asynchronously too. A callback can be registered on *mir_connect* and `mir_connection_create_surface` which will be called as soon as the connection or surface is ready. Your application can do other initialization tasks which don't depend on a *MirConnection* or *MirSurface* while it waits for the server to return them.

## Pervasively Multithreaded

One of the really interesting things about these callbacks and other callbacks, for example, the callback provided through *MirEventDelegate* to *mir_surface_set_event_handler*, is that your callback gets called in a completely independent thread. This means that there's no main loop to spin or poll on - the display server will wake up the thread that's interested in the particular data that its sending.

I believe that Mir is unique here in that no other display server has been designed to work this way. Doing it this way has some immediate benefits - handling input in applications can be somewhat expensive, because your application will often need to go through some complicated process to look up what to do in response to some particular combination of input. Instead of blocking the main thread, all this can happen in a worker thread which then tells the main thread what to do.

Unfortunately for legacy applications, the vast majority of which are single threaded and pretty much all of which do input and display handling in one thread, it means that the author of the application needs to lock a queue, push the incoming data on to that queue and then unlock the queue (and vice-versa in the main-thread) in order to preserve compatibility with other windowing system backends. The client library's documentation provides that you as the author are responsible for thread-safety.

```cpp
/**
 * Set the event handler to be called when events arrive for a surface.
 * \warning event_handler could be called from another thread. You must do
 * and locking appropriate to protect your data accessed in the
 * callback. There is also a chance that different events will be
 * called back in different threads, for the same surface,
 * simultaneously.
 * \param [in] surface The surface
 * \param [in] event_handler The event handler to call
 */
void mir_surface_set_event_handler(MirSurface *surface,
 MirEventDelegate const *event_handler);
```

Thankfully, there aren't going to be too many consumers of `mir_toolkit` other than application toolkits or other special-case cross platform applications like XBMC. This design also opens up some interesting future possibilities. I'm looking into doing some of the (somewhat time-consuming) keysym-to-internal-keysym processing inside of the worker thread before handing it off to the XBMC main thread as a kind of demonstration of how that would work.
