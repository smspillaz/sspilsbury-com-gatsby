---
title: "Naming things"
post: true
description: Deferring a hard problem
date: "2016-05-30"
---

Naming things is apparently one of the hardest problems in software engineering.

I have a bunch of side projects with rather generic and uninspiring names. I'd like to see them gain some wider usage and I think the names are putting people off. Unfortunately, I can't think of any decent names. So I'd like to throw it out to the community to see if we can find a better name for them! Here's a list of projects and what they do. If you can think of a better name, just post it in the comments.

## [polysquare-ci-scripts](http://github.com/polysquare/polysquare-ci-scripts)

**Elevator Pitch**: Getting software to run on CI environments like Travis-CI requires installing a bunch of dependencies, activating environments and doing other setup. This creates a lot of duplicate code in configuration files. These extensible scripts, written in Python, can be directly fetched with CURL and executed. They set up any required language environments, install dependencies and do deployment-specific steps.

## [polysquare-travis-container](http://github.com/polysquare/polysquare-travis-container)

**Elevator Pitch:** System package managers are great, but they make life painful when trying to reproduce builds between systems. They often require system level access - something you don't always have or want. Docker and Vagrant partially solve this problem, but one only works for linux guests and the other is quite heavy-weight. This project creates a local version of your operating system's package manager so you can install just what you need and nothing else. You run binaries through it and it will automatically set up any required PATHs or LD_LIBRARY_PATHS to make it work.

## [cmake-ast](http://github.com/polysquare/cmake-ast)

**Elevator Pitch:** Parse CMake files and create an abstract syntax tree, usable from Python.

## [polysquare-cmake-linter](http://github.com/polysquare/polysquare-cmake-linter)

**Elevator Pitch:** Catches bad practice in CMake files. Like [cmake-lint](https://github.com/richq/cmake-lint), but it checks for other things, especially variable quoting.

## [polysquare-generic-file-linter](http://github.com/polysquare/polysquare-generic-file-linter)

I can't think of a worse name!

**Elevator Pitch:** Ensures that each source code file's header is consistently styled and checks for spelling mistakes in comments and user facing strings. For instance, it checks to make sure that every file contains a copyright notice, or that if the name of the file appears at the top of its copyright notice, that the name is actually correct. It also makes sure that anything referred to in a code comment can actually be found in the code if it is not an english word.

## [polysquare-setuptools-lint](http://github.com/polysquare/polysquare-setuptools-lint)

**Elevator Pitch:** Integrates every decent python linting tool into a setuptools command. Collects all the output into a single format and de-duplicates any warnings. Runs prospector, flake8, pyroma and polysquare-generic-file-linter. Caches results and parallelises the linter processes where possible to speed up builds.

## [travis-bump-version](http://github.com/polysquare/travis-bump-version)

**Elevator Pitch:** Bumps your project's version number, tags a new release and pushes tags to git on request. Uses [bumpversion](https://github.com/peritus/bumpversion) under the good. Designed to be used in conjunction with Travis-CI.

## [tooling-cmake-util](http://github.com/polysquare/tooling-cmake-util)

**Elevator Pitch:** A library for CMake that makes it easy to integrate new static analysis tools into your build. Just run _psq_run_tool_for_each_source_ on a target with your tool's binary and arguments and that tool will run every time that target is updated during your build.

## [common-universal-cmake](http://github.com/polysquare/common-universal-cmake)

**Elevator Pitch:** Add it to your project, add executables and libraries through it, and you get amazing tooling like CPPCheck, clang-tidy, include-what-you-use, vera++ and others for free. Adds an option to build code with AddressSanitizer, UndefinedBehaviourSanitizer, MemorySanitizer and ThreadSanitizer. Adds an option which turns on pre-compiled headers and unity builds without having to make any underlying changes to the build system.

## [cmake-header-language](http://github.com/polysquare/cmake-header-language)

**Elevator Pitch:** Examine a header file to determine all of its dependencies and whether it is C only or involves C++. Many tools require that the language be specified manually for such headers.

If you can think of a better name for any of these, please let me know. I'll take any suggestion!
