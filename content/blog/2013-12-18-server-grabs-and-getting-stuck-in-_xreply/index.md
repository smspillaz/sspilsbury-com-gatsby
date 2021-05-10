---
title: "Server Grabs and getting stuck in _XReply"
post: true
description: Some niche X11 API causing problems
date: "2013-12-18"
---

Here's a quick reference to anyone in the future who ever gets stuck debugging some external library being stuck in \_XReply

```
> #0 _XReply
>
> #1 ???
>
> #2 some_library_do_thing
>
> \# 3 my_app_do_thing
```

Check if your app is using server grabs (`XGrabServer, XUngrabServer`).

Some third party libraries open up new X Server connections in the same process as yours. They shouldn't do this, but they do anyways (graphics drivers are notorious culprits for this).

If you are holding a server grab and then call into a third party library which makes a synchronous call on its own X connection **you will get a deadlock**. This is because of how server grabs work - they prevent all **connections** from reading or writing any data until your connection has released the server grab.

When using server grabs (please don't unless you really need atomic semantics around a series of X calls), always try to limit them to the closest possible subset of protocol requests you actually need atomic semantics around. Don't just wrap some entire function in a server grab. Especially not if you plan to be calling callbacks which you don't control or calling into libraries that are subject to change.

Also remember that `XUngrabServer` is not a synchronous operation - you will need to call `XSync` after using it in order to completely release the grab for other connections.
