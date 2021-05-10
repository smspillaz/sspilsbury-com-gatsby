---
title: "Regression Testing for crashes on Google Test"
date: "2013-05-18"
description: A suggestion on using "death tests"
post: true
tags:
  - "testing"
---

One common use for automated testing is to put tests in place that reproduce bugs to ensure that the same kind of bug can't happen again once the failing test is fixed.

There is a small caveat when doing this with bugs that result in segfaults however - which is that a test that fails-by-crashing will cause the entire test binary to halt as well, meaning that you won't see the results of any tests afterwards. Its also difficult to see what it was in the test itself that crashed at a glance without using a debugger of some sort.

Thankfully, google-test provides a method to test for things-that-shouldn't-crash - by [forking and checking the exit code of the forked process](https://code.google.com/p/googletest/wiki/V1_6_AdvancedGuide#How_It_Works).

So my new best practice for writing these sorts of tests is now:

```cpp
using ::testing::ExitedWithCode;

TEST(FooDeathTest, FooPtrFromBarIsSafe)
{
    std::unique_ptr <Foo> foo (from_bar ());

    EXPECT_EXIT({
        foo->baz = 1;
        std::cerr << "Success!" << std::endl;
        exit (0);
    }, ExitedWithCode (0), "Success");
}
```

Instead of:

```
TEST(Foo, FooPtrFromBarIsSafe)
{
    std::unique_ptr <Foo> foo (from_bar ());
    foo->baz = 1; // won't crash if foo is valid
}
```

There are three benefits to doing it this way:

**Whoever is reading the test source can instantly see that the thing you're testing is that some operation succeeds and exits cleanly**

This is especially the case when EXPECT_EXIT ({ }, ExitedWithCode (0), "") becomes somewhat of an idiom.

**You can test the inverse - that is - you can test that something will crash with the same style:**

```cpp
using ::testing::ExitedWithCode;

TEST(FooDeathTest, FooPtrFromBarIsNotSafe)
{
    std::unique_ptr <Foo> foo (from_bar ());

    EXPECT_DEATH({
        foo->baz = 1;
        exit (0);
    }, "");
}
```

**You get a much more informative error message at a first glance:**

```
[RUN    ] FooDeathTest.FooPtrFromBarIsSafe
Failed expectation (lineno):
    Expected that the block:
    {
        foo->baz = 1;
        std::cerr << "Success!" << std::endl;
        exit (0);
    }
    Would exit with the message "Success" and an exit code of 0;
Actual:
    Exited with no message and an exit code of 9
[    FAIL] FooDeathTest.FooPtrFromBarIsSafe
(other tests run here)
```

As opposed to:

```
[RUN    ] Foo.FooPtrFromBarIsSafe
Segmentation Fault
(no other tests run here)
```
