---
title: "XBMC on Mir"
date: "2013-07-23"
post: true
description: Porting was fairly straightforward
---

As part of my GSoC project to make XBMC work on newer linux display systems, I also wrote a backend to make it render on the Mir display server too. This was actually quite straightforward, and took about the same amount of time to get to same point of completeness as it did for Wayland support.  There's no mouse or keyboard input support yet, but only because I haven't had the time to implement it yet. Should be done in a few days.

You can find it at `git://github.com/smspillaz/xbmc.git mir-gsoc-1`.

Incidentally, I think this is the first non-toolkit non-demo Mir client out there.
