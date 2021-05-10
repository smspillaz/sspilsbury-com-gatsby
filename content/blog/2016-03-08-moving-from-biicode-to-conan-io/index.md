---
title: "Moving from biicode to conan.io"
description: A nice package manager for C++
post: true
date: "2016-03-08"
---

Today I moved a [bunch](https://www.conan.io/source/cmake-include-guard/master/smspillaz/cmake-include-guard) [of](https://www.conan.io/source/cmake-unit/master/smspillaz/cmake-unit) [projects](https://www.conan.io/source/accelerate-target-cmake/master/smspillaz/accelerate-target-cmake) over from biicode to [conan.io](http://conan.io/). It was certainly and interesting experience and I think it is worth talking about conan and what they are doing for the C++ community.

Most established programming languages and runtimes these days have their own de-facto package managers. Node has npm, Python has pypi. CPAN apparently the [most important thing](https://en.wikipedia.org/wiki/Perl#CPAN_Acme) to have happened Perl, and so the list goes on.

C and C++ have gone without for quite some time. Some might argue that your distribution's package manager is really the "true" package manager for systems-level languages. That's true to some extent, but it is a solution with difficulties in its design. Distribution packages are typically installed systemwide. They require super-user access to be installed. Usually you can only install one version of a package at a time, unless the package is re-named and installed into separate directories such that two installations can co-exist. It is typically also not the maintainer of the software who maintains the package in each distribution, which generally leads to a fragmentation in update frequency and overall slowdown in getting new versions of code out to users.

Language based packaging systems take the opposite approach. The software maintainer maintains the packaging information, which is usually built right into the build system. For most modern languages, its entirely feasible to run development versions of an application in a "virtual environment", where packages can be installed isolated from the rest of the system. Node takes this approach by the default. Python and Ruby have got [virtualenv](https://virtualenv.readthedocs.org/) and [bundler](http://bundler.io/) respectively. As a part of your build, you can update all your dependencies as once and lock dependencies to particular versions on a per-app basis.

Creating such a system for C++ has been known for a long time to have been fraught with difficulty. For one, there's no standard build system for C++ and attempts to create [the](https://www.gnu.org/software/automake/) [one](http://cmake.org/) [true](http://scons.org/) [build](http://www.boost.org/build/)\-[system](https://gyp.gsrc.io/docs/UserDocumentation.md) have all [failed](https://xkcd.com/927/). That means that there's no way to simply build a package manager into a build system that has a wealth of information about every project. Every platform has its own preferred compiler and usually a preferred build system too. There are binary compatibility nightmares. Compiling C++ code takes a long time and it looks like that won't be fixed until we have modules. Most C and C++ projects were written during the time when we expected that distributions to package everything and so many projects will dynamically link to libraries already installed on the system, systemwide.

Conan is here to try and tackle what seems like an insurmountable problem and they have an approach that is seriously worth checking out. It provides a model that is a reasonable hybrid of what we've come to expect from distribution packaging systems and language based package managers. It doesn't depend on any build system in particular and tries to support all the major ones.

It works by having either the maintainer or someone else write a "conanfile." A conanfile can be either an ini or python file that describes briefly what the package is about, what its dependencies are and how it is built. One of the really nice things about it is that you don't have to upload the entire package source code or binaries to the conan servers if they're already hosted somewhere - just provide a URL to a zip file and some information on how to deal with it. For instance, on each release of my CMake modules, I upload a new package description which links to a download for a tarball of the git tag of that version.

Conan will try to fetch any uploaded binaries that match your system configuration if it can (reducing the binary compatibility problem), but if not, it will rebuild a package from source upon installation. All a package's dependencies, whether binary or otherwise, are pulled in for your project's use upon running _conan install_. Nothing gets installed systemwide. Once _conan install_ is done, it generates a file that can be used by your build system. In the case of [cmake](http://docs.conan.io/en/latest/integrations/cmake.html), that file sets all of the include, library and cmake paths so that a dependency can be used in a project. Just include and link to it as you usually would and it should all just work.

conan.io runs their own package registry, but you can also host your own since the server software is open source. Creating and uploading a package is a relatively straightforward procedure. Each version of a package is treated as a unique entry, so an upload of a newer version will not overwrite an older version in case anybody else needs to depend on an older version of a package. A package descriptor in conan might look something like "my-package/version@user/channel." Everything after the "@" allow for multiple copies of the same package to be maintained by different users if there are modifications those users would like to apply. The channel allows each user to maintain a separate copy of each version of a package if there is a need to subdivide further.

To upload a package, you first need to register it with your "local store" using *conan export* inside the package directory where the conanfile is located like so:

```
conan export smspillaz/my-package
```

After that, you can upload the specified version to conan, which depending on your exports setting, might upload just the conanfile or some other files if there's no need to fetch the source code from another location.

```
conan upload my-package/master@smspillaz/my-package
```

For most of my projects, I only needed to maintain one copy, so it was as as simple as having a version called "master" (which pointed to the most up-to-date tarball) and numerical versions where appropriate. Everything was just under the "smspillaz/my-package" stream.

A dependency can be re-used within a project by specifying its full descriptor (e.g., _my-package/master@smspillaz/my-package_ in the dependencies section of the conanfile).

Overall, I would really recommend checking out conan and looking into making your software available as a dependency, if you're developing a C++ module that you want others to use. Modules like [catch](https://www.conan.io/source/catch/1.3.0/TyRoXx/stable), [boost](https://www.conan.io/source/Boost/1.60.0/lasote/testing) and [sfml](https://www.conan.io/source/sfml/2015.8.12/TyRoXx/develop) are already available. There's no lock in, in the sense that your build process doesn't have to depend on conan if you start using it, though there's certainly very little disadvantage in doing so. Hopefully with conan we'll start seeing a greater proliferation of small C++ modules so that developers and focus on making great applications as opposed to choosing between re-inventing the wheel or managing another dependency across several platforms.
