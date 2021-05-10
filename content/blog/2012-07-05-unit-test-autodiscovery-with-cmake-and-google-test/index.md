---
post: true
title: "Unit Test Autodiscovery with CMake and Google Test"
date: "2012-07-05"
description: A trick to get more specificity in your CTest output
---

Since last year at the Product Strategy group at Canonical, we have shifted our focus to quality, testing and best practices development.

One commitment was to use a unified framework for Unit Testing and Continuous Integration so that we could move to Test Driven Development. For that, in the Compiz and Unity projects we have chosen to use [CMake/CTest](http://www.cmake.org/) and [Google Test](http://code.google.com/p/googletest/).

Google Test comes with some code to integrate with CTest, such that you can run make test and the buildsystem will run each test in each test case independently, and give you per-test resolution rather than per-executable resolution. It looks something like this:

`gtest_discover_tests (BINARY SRC COMMENT)`

This allows for it to scan for tests in the source file SRC to run against the binary BINARY with a comment COMMENT at build system generation time.

This is great, and we've been using it to generate our "make test" command for quite some times. However, because it does the scanning at build system generation time and not at build time, the level of introspection provided is not complete and it has a few drawbacks.

1. The code assumes that each test SRC has at least one TEST defined in it, otherwise it fails with a non obvious error (probably more or an implementation bug)
2. The code assumes that there is no space between TEST and the opening parens, any spaces that lie there will be assumed not be tests and ignored
3. No support for [value parameterized](http://code.google.com/p/googletest/wiki/AdvancedGuide#Value_Parameterized_Tests) or [typed tests](http://code.google.com/p/googletest/wiki/AdvancedGuide#Type-Parameterized_Tests), which are really useful if you want to run the same test multiple times with lots of different value sets, or test an implementation conforms with the contract an interface is supposed to have (as they use templates)

As such, in about half a day of hacking, I wrote a quick program used to introspect the test binaries at runtime, so that these cases will be supported properly. As such, CTest will now show all the tests, and not just the ones supported by the source scanner.

You can find the implementation [here](https://code.launchpad.net/~compiz-team/compiz/compiz.compiz_discover_tests/+merge/113324).
