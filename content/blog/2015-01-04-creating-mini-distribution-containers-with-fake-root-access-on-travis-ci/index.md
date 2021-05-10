---
title: 'Creating mini-distribution containers with "fake" root access on travis-ci'
date: "2015-01-04"
---

For most of the projects I've started in the last two years, I've been using a service called [Travis CI](http://blog.travis-ci.com). Travis CI is a free-for-open-source projects continuous integration service which runs in the cloud. Its also really easy to set up - just specify a list of steps (as shell commands) in a ._travis.yml_ in the root directory of your project. If they all return with a successful exit code (e.g., 0), then your build is considered passing. Travis CI runs the same script on every new revision of your project and on all its pull-requests. It ties into GitHub's status notification API and is just all-round super useful.

What makes Travis CI so easy to use for all kinds of projects is that for each build you get an [OpenVZ](http://openvz.org/Main_Page) virtual machine with full root access, based on Ubuntu 12.04 LTS. You can use *apt* to install all your dependencies, add new repositories to your hearts content, download arbitrary files, execute arbitrary code, etc etc.

# Moving to Containers

One of the big downsides of virtual machines though is that they import a considerable amount of overhead. In order to provision them on demand, you need to have a a bunch of running instances in memory that you can dispatch jobs to. Once a job is completed, you need to roll back the disk image to an earlier state, kill the instance and clone a new one from an existing "clean" image. Keeping all these virtual machines around consumes a non-trivial amount of resources and in the cloud that costs money. We've recognised that virtual machines are not really the way to go for the future of the cloud for a [little while now](http://www.linuxjournal.com/content/containers—not-virtual-machines—are-future-cloud), and more lightweight "container" solutions like [Docker](https://www.docker.com) and [LXD](http://www.ubuntu.com/cloud/tools/lxd) are seeing increased adoption.

Container based solutions are kind of like a "chroot-on-steriods", in that they provide a way to run a (more or less) isolated user-space on top of an existing kernel, just like any other process. There's very little overhead involved. Travis CI [recently started rolling out infrastructure based on Docker](http://blog.travis-ci.com/2014-12-17-faster-builds-with-container-based-infrastructure/), where builds can be provisioned in seconds as opposed to minutes. I've tested this on some of my own projects and it really is true - in non-peak times builds have been provisioned within five to ten seconds of pushing code, and in peak times, about 30 seconds. That is an *insanely good* turnaround time for continuous integration.

# Problems with Containers

The caveat with contained based solutions, however, is that everything runs as a much more restricted user. You don't have access to *sudo* and as such you don't have access to tools like *apt*. This makes doing a lot of the build tasks which were easy to do on the *OpenVZ* based infrastructure almost impossible on containers. Travis CI has suggested using precompile binaries uploaded to S3 and downloaded as part of your build process as a replacement for *apt* in the time being. That's not really an ideal solution, especially when you want to track a rolling package release cycle.

# Mini-Distributions

I was quite keen on switching over as many of my builds to the container based infrastructure as possible. But the lack of root access was going to be a bit of a problem as most of my builds require the installation of packages outside the default install set.

I initially had the idea of using *debootstrap* to create a *chroot* inside the container where I could install my own stuff, just like how a p*builder* works.  Unfortunately both *chroot* and *debootstrap* require root access.

I did, however, come across another interesting project which could fill the niche quite well. [PRoot](http://proot.me) (short for p*trace-root*) is a project that uses the Linux *ptrace* utility to hook system calls and effectively pretend to be the root user operating on another root filesystem. This works quite well in the majority of cases - applications think that they are running as the root user and also believe that the directory you pass to the *proot* command is the root directory.

Most linux distributions ship a "minimal" or "core" version - usually a few megabytes, which contains the bare necessities to bootstrap and install packages, but is otherwise a fully-functioning, booting filesystem. This can be extracted to a subdirectory and used directly with _p\_\_root_. An added bonus is that the *proot* authors have added support for Qemu user space binary translation, which means that you can download a distribution root filesystem for another CPU architecture and have its code dynamically translated to run on the host architecture directly.

Using proot, it is possible to create a mini-distribution where *apt* can be installed to install whatever packages you want to install, and to run and link to the resulting packages inside the mini-distribution. This was perfect for use with travis-ci's containers.

Incidentally, Travis CI also enabled [build caching](http://docs.travis-ci.com/user/caching/) for projects running on the container based infrastructure. This mean that you can cache the directory the mini-distribution was created in between builds to avoid having to download and install packages in it all the time.

# Introducing Polysquare Travis Container

I wanted to make this functionality easy to use for people looking to move to the container based infrastructure, so I've created a project called [_polysquare-travis-container_](https://github.com/polysquare/polysquare-travis-container) on GitHub. It isn't available on PyPI, but you can install it with the following:

pip install git+http://github.com/polysquare/polysquare-travis-container

Two commands are available. The first, *psq-travis-container-create* allows you to create a mini-distribution in a specified directory. It automatically downloads proot and qemu for your CPU architecture. The *\--distro, CONTAINER_DISTRO* environment variable allows you to specify the name of a Linux Distribution to use (Ubuntu, Fedora, Debian). The *\--release*, CONTAINER*RELEASE option and environment variable allow you to specify the name of the release to use. *\--arch, CONTAINER*ARCH* are used to specify a target CPU architecture.  You can also specify *\--repositories PATH_TO_FILE* and *\--packages* *PATH_TO_FILE* to specify files containing lists of repositories and packages to be installed inside that mini-distribution.

If a container exists in the specified directory with that configuration, it will be retained and nothing will be re-downloaded. This allows you to seamlessly integrate the mini-distribution with the caching system.

_psq-travis-container-exec_ can be used to execute commands inside a container. It reads the same options and environment variables as *psq-travis-container-create* as well as an optional *\--cmd* to specify the command to run. The command is looked up in the mini-distribution's PATH, so *\--cmd bash* would run the mini-distribution's version of *bash* and not the host's.

This is what it looks like on your build output:

```
**✓ Using pre-existing proot distribution** Configured Distribution:
 - Distribution Name: Ubuntu
 - Release: precise
 - Architecture: amd64 \- Package System: Dpkg **✓ Using pre-existing folder for distro Ubuntu precise (amd64)**
**✓ Container has been set up in /home/travis/container**
```

# Concluding Notes

I hope this project is useful to anyone who was thinking about moving to the new container based infrastructure after it was announced late last year. I've already started using it for [one of my own projects](https://travis-ci.org/polysquare/cmake-ast) (which I'll post about later) and I plan to move many more to it in future.
