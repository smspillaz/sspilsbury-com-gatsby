---
title: "Improvements to polysquare-travis-container"
post: true
description: Shrinking containers and running them without root
date: "2016-08-07"
---

After some time out, I sat down to make some changes to `polysquare-travis-container` based on some things I had recently learned about package managers.

My job at [Endless](http://endlessm.com) requires that I occasionally work with Debian packages. One tool I have been working with quite a lot lately has been [chdist](http://manpages.ubuntu.com/manpages/trusty/man1/chdist.1.html) from the devscripts package.

Whilst also being a wonderful tool to compare Debian-based distributions, the fact that a tool like chdist exists quite handily proved that it should be possible to use apt and dpkg in a separate subdirectory, without needing root access. This was the initial _raison d'être_ for `polysquare-travis-container`.

One of my thoughts recently has been that while proot was a great tool to start out with, it is probably too heavyweight for what I am really trying to do with this project. What I really want is a way to quickly install things that only exist in Debian packages, install them without root access and ensure that the installation, compile and test process for a project requiring those packages is reproducible at least on the same platform. The overall goal is to enable users to run their CI setup locally, as painlessly as possible.

With this new knowledge, I took some time this weekend to look into how chdist works.

In essence, chdist is a perl wrapper around apt which specifies configuration options such that apt is able to run locally. It does that by specifying the `Dir`, `Dir::State` and `Dir::Cache` options. That mirrors closely what you might find on a Debian installation in `/var/cache` and `/var/lib/dpkg`.

Assuming that the directory structure both dpkg and apt expect exist at those paths, you can run apt-get update without root on a custom lists file and even start downloading packages along with their dependencies.

My goal was to get polysquare-travis-container to a point where it wasn't necessary to download an Ubuntu filesystem image or use proot. After hacking around for a little while, I'm more or less settled on the idea that doing so isn't particularly trivial unless you have access to something like debootstrap because of all the initial circular dependencies. Ideally you want to be running apt from within the nested filesystem as well, since the "jailing" of apt by using the aforementioned variables isn't perfect.

Most software from the new filesystem can be run without root access somewhat comfortably. Hardcoded paths, particular in shebangs, may cause trouble however. You will need to set the following environment variables:

- `PATH`: Where the system should look for executables. Obviously you want this so that typing an executable name into a shell will find the executable in your filesystem tree.
- `LD_LIBRARY_PATH`: Where ld.so should look for dynamic libraries. It is effectively mandatory to set this to `/usr/lib` and `/usr/lib/${arch-triple}`, otherwise running binaries from the filesystem root will attempt to bring in libraries from your system filesystem (which likely won't work).
- `PKG_CONFIG_PATH`: Needed for building software.
- `LIBRARY_PATH`: Needed for some static linking cases.
- `INCLUDE_PATH`: Needed if you installed a compiler in your filesystem root, since this is the first place gcc and clang will look for headers.
- `CPATH`: See above.
- `CPPPATH`: See above.

I have now released polysquare-travis-container 0.0.38 which takes into account these considerations. It now ships with a `\--local` option for Ubuntu, which downloads an Ubuntu core image, minifies it to about 20MB using dpkg and proot and from that point onward uses only environment variables and a specially-configured apt to install packages and run software. It is about as lightweight as you can get for this kind of thing. Please feel free to try it and give feedback.
