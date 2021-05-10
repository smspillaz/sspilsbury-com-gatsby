---
title: "A unit testing framework for CMake"
description: Based on XUnit
post: true
date: "2016-01-25"
---

The first question that might pop into your head is **why**. The answer to that is pretty straightforward - CMake code can get quite complex very quickly. There can be a lot of edge cases based on different configuration options and different platforms.

One popular CMake module, [cotire](https://github.com/sakra/cotire) is about [3900 lines](https://github.com/sakra/cotire/blob/master/CMake/cotire.cmake) long at this count. Cotire provides a simple layer to use precompiled headers across the three main compilers. It has about 75 functions and 13 macros to handle all sorts of stuff, from getting compiler definitions to parsing include trees. Getting that stuff right is hard. Getting it wrong on just one set of options or system definition can cause no end of annoyance for users of your library. Especially for those users left to debug the problem and not familiar with the details of the language.

Over the last year I've been working on a unit testing framework for CMake so that module authors can catch these kinds of bugs before they happen. Note that I don't propose that people start testing their project build definitions as found in the CMakeLists.txt. Those definitions are typically written to be as declarative as possible. Your continuous integration process which builds the project should catch any relevant problems in those build definition files. I'm more interested in testing modules that ship with libraries, or just modules that provide useful functionality to CMake, of which there has been a great proliferation over the last few years.

The framework is called, somewhat unimaginatively, [**cmake-unit**](http://github.com/polysquare/cmake-unit). It supports everything that you'd expect in a typical xUnit-like framework, including:

- Multiple test definitions per file.
- A generic `cmake_unit_assert_that` function which can take pre-defined or user-defined matcher functions to verify that a value matches certain criteria.
- Automatic test discovery and execution.
- Suppression of output messages except on failure.
- Conditional enabling of test cases.
- XML output of test results.
- Clean execution slate between tests.
- Code coverage reports.

There's currently no support for test fixtures, though in my own testing, I've found that they haven't really been necessary. CMake doesn't have the concept of resources that need to be managed manually. If shared setup needs to be done for a set of tests, it can be refactored into a separate function and called from the test definition.

CMake presents some interesting problems in terms of implementing a test framework, which **cmake-unit** tries to accommodate:

- **Multiple Phases:** Configuring, building and testing a CMake build-specification is separated into multiple phases, with the state at the end of each phase available only ephemerally before the execution of the next one. The framework allows for custom cmake code to be run for each phase, all contained within the same test. It also allows for variables to propagate across phases of a test.
- **No support for first class functions:** The language doesn't provide a mechanism to call a function by a name specified in a variable. The framework provides a work-around and calling convention encapsulated in *cmake_call_function* to provide this functionality. This is what makes custom matchers and test-case auto discovery possible.
- **Build system commands operate on source files:** Most CMake commands that would  directly affect Makefile generation are not available in CMake's script mode. Hand writing source files for each test case can be frustrating. The framework provides a mechanism to create a minimal build environment for supported source types and functions to declaratively generate source files.
- **Location of output binaries varies by platform:** On some platforms, binaries are nested within a directory specified by _CMAKE_CFG_INTDIR._ The value of this directory varies by platform and is not readable in script mode. The framework provides a mechanism obtain the true location of a binary and transfer that value between phases.

**cmake-unit**'s [own test suite](https://github.com/polysquare/cmake-unit/blob/master/CMakeLists.txt) provides a great deal of examples as to what tests can look like. The simplest test, which generates a library and executable, then links the two together, looks as follows

```cmake
function (namespace_test_one)

    function (_namespace_configure)
        cmake_unit_create_simple_library (library SHARED FUNCTIONS function) cmake_unit_create_simple_executable (executable) target_link_libraries (executable library)
        cmake_unit_assert_that (executable is_linked_to library)
    endfunction ()

    function (_namespace_verify)
        cmake_unit_get_log_for (INVOKE_BUILD OUTPUT BUILD_OUTPUT)
        cmake_unit_assert_that ("${BUILD_OUTPUT}" file_contents any_line matches_regex "^.*executable.*$")
    endfunction ()

    cmake_unit_configure_test (INVOKE_CONFIGURE LANGUAGES C CXX CONFIGURE COMMAND _namespace_configure VERIFY COMMAND _namespace_verify)

endfunction ()
```

The entire test is encapsulated inside *namespace_test_one* function. There are two phase that we're interested in - the *configure* and *verify* phases. These are also the only two phases you'll need in most tests.

The *configure* phase just looks exactly like a user would use your library in a CMakeLists.txt file. It runs in project-generation mode, so you have complete access to the Makefile generating functions. Since CMakeUnit.cmake has already been included, you can start asserting things right away, for instance, checking before the build even happens whether *executable* is set up to be linked to *library*.

The *verify* phase runs in script mode after both *cmake --build* and *ctest* have been run on the project.  A utility function, _cmake_unit_get_log_for_ provides a way to get the full output of both the standard output and standard error of any phase. From there, you can make assertions, either about the state of the build tree or about what was found in the build log.

The final command, *cmake_unit_configure_test* is a function with metadata about the test. It tells **c\*\***make-unit\*\* what functions will be used to configure and verify the build process and whether support for particular programming languages should be enabled. It is worth noting that support for all programming languages on each test are turned off by default, since the overhead for some generators to initialise support for those languages can be quite high.

Finally, in your test file, you will need to call _cmake_unit_init_ to start the test auto-discovery process and register files for coverage reports. For example:

The _NAMESPACE_ option tells **c\*\***make-unit\*\* to look for any functions in the current file  which start with ${_NAMESPACE}\_test_ and add them to the execution list. Any files specified in *COVERAGE_FILES* will have coverage information recorded about them if *CMAKE_UNIT_LOG_COVERAGE* is enabled.

From there, testing a CMake module is as easy as building a CMake project. Just create a build directory, use *cmake* to configure the project and discover all the tests, then use _ctest_ to run the tests.

```cmake
cmake_unit_init (NAMESPACE namespace)

COVERAGE_FILES "${CMAKE_CURRENT_LIST_DIR}/Module.cmake")
```

I've waited quite some time before publishing this framework, mainly because I actually started it in early 2014 and re-wrote it in early 2015. Since then, I've been using it in about ten or so of my own modules and its reached a state of relative stability. I'd like to get some feedback from other module maintainers to see if this project is useful.

You can find the project on biicode on the [smspillaz/cmake-unit](https://www.biicode.com/smspillaz/cmake-unit) block. I'll eventually move everything over to [conan](http://conan.io) once I get a chance. If you need to include it in a non-bii project, you'll need to copy the dependencies into the *bii/deps* directory manually.

I've been working on some other cool development-related projects in the last year, so I'll be blogging about them soon. Stay tuned!
