---
title: "Automated testing and Compiz"
date: "2013-01-07"
post: true
description: Testing the untestable
tags:
  - "compiz"
  - "testing"
---

One of the best decisions we ever made for Compiz was to invest in a solid automated testing framework late last year. Today, and likely by our 0.9.9 release we will have about [1163 tests](https://jenkins.qa.ubuntu.com/job/compiz-ci/build=pbuilder,distribution=quantal,flavor=amd64/348/testReport/%28root%29/) running in continuous-integration, and just under 1200 tests total. Unity has about 700 or so tests, and Nux has about 300.

For Compiz, over 1000 tests might seem like a large number, but its actually a relatively small one, especially in terms of code coverage. The code coverage is pretty dismal - the figure is probably below 10% the last time I checked. That's not necessarily a bad thing though - compiz is a large project, with several parts that haven't been touched in quite some time. It obviously makes sense to invest testing effort in the bits that change a lot, and I think over time, we have been relatively successful at that.

We have automated testing which covers all sorts of stuff, including but not limited to:

- How pixmap-to-texture binding behaviour works with pixmaps provided by external applications
- How the GNOME configuration backends pick the right options to integrate with
- How those backends actually integrate properly with those options
- How the GSettings configuration backend works, in every aspect of its functionality (profile management, writing out different key types, handling of lists, handling of updates from both compiz and gsettings). This makes up the majority of our tests, because there are lots of things to think about.
- How the grid plugin picks which state the window should be in when its resized (maximized, maximized vertically etc)
- How the place plugin handles screen size changes
- How the decor plugin communicates image updates from the decorator process
- How the settings for gtk-window-decorator affect its internal state.
- How timers work under different conditions
- How button presses are handled
- How plugins are sorted
- How keyboard modifiers are converted to strings
- How offsets are applied to the expo plugin's animations
- How vsync behaviour works on different hardware
- How fullscreen window unredirection detects when a window can safely be unredirected
- How decoration shadow clipping works
- How certain window stacking cases work
- How --replace behaviour works

Whenever we go back to those - and other sections of the code, _make test_ becomes a very useful piece of documentation. One can make a change and check straight away if they broke anything that was covered by the testing suite. Then upon closer examination, the tests themselves provide pre-and-post assertions for certain codepaths. If the expected behaviour was meant to change, then just update the test. If it wasn't - it means that your new code has unintended side-effects.

[**Test Driven** **Development**](http://en.wikipedia.org/wiki/Test_Driven_Development) is another aspect of automated testing, which involves creating a sort of "walking skeleton" of how you expect a particular system to work, in terms of how its actors interact and what interface it provides to external entities within the system. All the functional code is just stubbed out and does nothing. Then once the "skeleton" is created, you create tests to assert what the behaviours and outputs of certain methods and interactions on your system should be. These tests initially fail, you write the code which fulfils the assertions until the tests pass.

This whole process has taught me a few things I feel like sharing.

## Testing framework

The first is to pick a good [xUnit](https://jenkins.qa.ubuntu.com/job/compiz-ci/build=pbuilder,distribution=quantal,flavor=amd64/348/testReport/%28root%29/)\-like framework and write tests to that. xUnit is not really the name of a standard, or a library, or anything in particular as it is to refer to a collection of tools available for most languages to craft tests in terms of individual tests, shared code between tests (fixtures) and pre-and-post-conditions after executing certain blocks of code. xUnit like frameworks help to bring consistency into how testing is done in your project, and typically adapt to most codebases quite well. For example, instead of writing something like this:

```cpp
#include "mything.h"

bool test_that_mything_x_returns_42_after_foo ()
{
    MyThing mything;
    mything.setupState ();
    mything.doOtherStuff ();

    mything.foo ();
    int result = mything.x ();

    bool ret = false;

    if (result == 42)
    {
        printf ("Passed: mything returned 42\n");
        ret = true;
    }
    else
    {
        printf ("Failed: mything did not return 42\n");
        ret = false;
    }

    mything.shutdown ();
    mything.cleanup ();

    return ret;
}

bool test_another_boring_thing ()
{
    ...
}

int main (void)
{
    bool result = false;
    result |= test_mything_x_returns_42_after_foo ();
    result |= test_another_boring_thing ();

    if (result)
        return 0;
    else
        return 1;
}

You can write something like this:

#include "gtest/gtest.h"
#include "mything.h"

class TestMyThing :
    public ::testing::Test
{
    public:
        virtual void SetUp ()
        {
            mything.setupState ();
            mything.doOtherStuff ();
        }

        virtual void TearDown ()
        {
            mything.shutdown ();
            mything.cleanup ();
        }
};

TEST_F (TestMyThing, XReturns42AfterFoo)
{
    mything.foo ();
    ASSERT_EQ (42, mything.x ());
}

TEST_F (TestMyThing, OtherBoringThing)
{
    ...
}
```

The latter is much easier to read and also much more consistent, because all of the code required to get your object into a state where it can be tested is done in one place, and done for every test. In addition, we don't need to manually call every test, and the results are printed for us. The ASSERT*\* and EXPECT*\* postconditions will automatically pass or fail the test, and the former will instantly bail out.

That was actually an example of [**Google Test**](http://code.google.com/p/googletest/) usage, which is what we are using in compiz. Google Test is very versatile, and has been an excellent choice of unit testing framework. I can't think of a single thing which I haven't been able to get Google Test to do, and as you can see on its advanced guide, [the kinds of testing setups you can do are very very varied indeed](http://code.google.com/p/googletest/wiki/AdvancedGuide).

One of the reasons why we have over one thousand tests in compiz in less than the space of the year is that Google Test supports a kind of [table-driven-testing](http://en.wikipedia.org/wiki/Keyword-driven_testing) framework through the use of type and value parameterized tests. This means that you can run the same test over and over with slightly different inputs and postconditions each time. This allows you to excersize every possible path that your application might take if it responds slightly differently to different inputs. This was very useful for testing the GSettings backend for example, where [we have a single test which tests reading of every possible value type](http://bazaar.launchpad.net/~compiz-team/compiz/0.9.9/view/head:/compizconfig/tests/compizconfig_backend_concept_test.h#L668), but also reports every single value type as an independent test. The code that reads and writes setting values is different for every type of value, but similar in a number of ways. With that kind of test, we can test that the interface is consistent, and see where reading one value type fails where another passes.

## Understanding the impact of testing on the codebase

One of the biggest issues I've seen come up in changing a project to use automated testing is that the test suite often becomes an afterthought rather than a core driving factor of the project.

The first thing to realize is that testing any codebase that was not architected for testing is hard. Really hard in fact. One of the fundamental aspects of automated testing is being able to verify causes and effects within your codebase, and if the effects are scattered and indirectly associated with the causes, then testing it becomes a real problem. Unfortunately, without the stricter requirements on architecture that automated testing forces upon engineers, codebases often tend to become large systems which are amalgamations of side effects. They work just **fine** internally, but are impossible to reason about in the language of direct causes and effects at a micro level.

What this means is that when working with a legacy codebase, you'll often run into the problem where you just can't get the thing you want to test into a test fixture because it depends on too much other stuff. For loosely typed and duck typed languages, sometimes you can get away with simulating the stuff you need for the code to work. For statically typed languages like C and C++ where compiling the code brings in dependencies, the only way out of the mess is to accept that you will need to redesign the code that you want to get under test so that it can be reasoned about in terms of direct causes and effects.

For engineers who are trying to do the right thing by writing tests for their code, this is often seen to be a slap in the face. Now, not only can you not write tests for your change, but in order to do so, you need to make invasive changes to the code just to get it under test so you can make your change. Understandably so, this is quite frustrating. Unfortunately there's not much of a way around it, you just need to bite the bullet and accept its for the greater good. But the key is making a good start, and understanding that when a project adopts automated testing after it was developed, the core value of having automated testing shapes the codebase, rather than the codebase shaping the tests.

(As an aside, Feathers presents some solutions to the problems engineers often face in getting old codebases under test in [Working Effectively with Legacy Code](http://www.amazon.com/Working-Effectively-Legacy-Michael-Feathers/dp/0131177052). The solutions he presents are usually quite intuitive and obvious in their implementation, for those who need a good way reference. It uses a mix of C++ and Java as the languages for samples).

Another thing to keep in mind is that the automated testing process really needs to a part-and-parcel of the build-deploy-test-run process. All too often test suites are abandoned within the tests/ subdirectory of the source code, with a few tests here and there that do not run very often and not built by default.

A test suite is only useful if its is built by default, and can be run in its entirety after a default build. Anything less means that your test suite is not doing its job.

C and C++ make this problem annoying to deal with. You can't tests to executables at all. Usually, for plugin-based systems you cant link tests to plugins. Pulling in an entire library might unintentionally introduce runtime dependencies or symbol conflicts you really don't want to care about. Compiling files twice is an abomination. Usually the only way out is to structure the build system around the test system.

In compiz, you might notice that we build a ton of static libraries. For example, _gtk_window_decorator_settings_storage_gsettings_ is a small library which internally represents the process by which settings for gtk-window-decorator are stored in gsettings. Then, when we want to test it, we have an individual test binary which just links that library. If we need to test functionality across those libraries, then you just link in each library as needed to the various tests.

## Thinking about the testing level

Unfortunately the world of automated testing tends to be dominated by professionals and managers who like to throw around a lot of jargon. This jargon tends to confuse newcomers, who would easily be led into thinking that they all mean the same thing. So I'll define a few terms now:

- **Unit Testing**: Testing at a "unit" level, which is generally the smallest level that one can feed inputs and observe outputs. It often means testing individual parts of your system and not the entire system itself. A good candidate would be, for example, testing the function that finds the nearest prime number to an input. A bad candidate would be a function that synchronizes a database to a remote server.
- **Integration Testing**: Testing how different components of the system interact with each other where there is a clear dependency on the interfaces that either provides. Often times, it is the case that the external system is one that you don't have any control over, and you want to test that you are using it properly. A good candidate is checking that when we make certain Xlib API calls, a window on the X Server ends up in a certain state.
- **Acceptance Testing / End-to-End Testing**: Testing that the system works in its entirety. Unity has a very sophisticated acceptance testing framework called [autopilot](https://code.launchpad.net/~autopilot/autopilot/trunk). If you've not seen autopilot in action, and you're curious, I'd suggest trying it one day. What it does is automatically interact with certain elements in the shell and communicate with Unity over a D-Bus interface to verify certain parts of the program state. For example, whether or not clicking on the Ubuntu button opened the Dash. (It gets much more sophisticated though - all the way down to how the show-desktop behaviour operates when certain windows are open or minimized, to how the alt-tab behaviour operates when you have lots of windows from a certain app open).

Generally speaking, the different kinds of problems that you'll face in development will be better suited to different kinds of testing. The most important thing to realize is that the test suite is not useful if the majority of the pre-and-post conditions can't be verified in a matter of seconds, or can't be done without other stuff running on the system. Continuous Integration (CI) servers are usually quite bare-bones, and the Ubuntu CI server will not run anything that depends on a working X11 server. The rule of thumb is that if it isn't in your memory space and completely within your control, the unit tests should not touch it.

In Compiz, the goal with testing has generally been to start with tests at the unit level, and then test the how the units fit into the broader picture at higher levels. Unit tests are not an end-all solution to every testing problem. Mocking frameworks can ease some of the pain, but if your system's job is mostly to interact with some other external system, then mocking out a bunch of API calls and checking that you made them is not very useful, because it doesn't actually test that you're using the external system correctly, or that the series of API calls puts it in the state you expect it to.

There are only two places we currently we do integration tests in compiz. The first is with GSettings, which has a special "memory only" backend, where you can use the library to manipulate an in-process structure of settings. The second is with [xorg-gtest](http://who-t.blogspot.com.au/2012/08/xorg-integration-test-suite.html), which spawns a headless X-Server on each test and allows your application to connect to it and manipulate its state, and make verifications based on the events it sends back, or the synchronous requests that can be made to get the current state.

The most important thing to note about both of those is that they only exist as integration tests **in order to test integration with those components**. The preferable alternative is almost always to design the code under test so that the dependency not available in CI is optional.

One area which I really believe needs a good integration testing story is OpenGL. Partly by nature of its state-machine and bindful design, and partly by way of the fact that its outputs are pixels, OpenGL is extremely difficult to reason about from a testing perspective. The only ways to test usage of OpenGL at the moment are by doing pixel comparisons, or by mocking out the whole API. Both are unsatisfactory because one is imprecise, and the other doesn't effectively test the system at hand. Its a project I'd be willing to get on board with, but I can imagine it would be very complicated to get right, as we don't even know what good things to test in-between API calls and output pixels even are.

If you've made it this far, then congratulations. I've got a lot more I could write on this subject, but I've wanted to give an overview about automated testing in Compiz for quite some time.
