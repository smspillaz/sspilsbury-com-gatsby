---
title: "Integrating vera++ with CMake"
date: "2013-04-13"
description: Style checking in the build system
tags:
  - "testing"
  - "vera"
---

I've been looking into making automated code style checks part of a broader QA plan for a project I've been working on while its still relatively young. [Astyle](http://astyle.sourceforge.net/) seems to be good at handling lots of different languages but there isn't any mode for it to error out when it sees something in the code that it thinks is wrong. I like the idea of automated formatting, but sometimes for complicated expressions and macros, automated formatters can get things wrong. I wanted something that required manual intervention, but could still be run on an automated basis. And specifically designed for C++.

I noticed that [Mir](http://bazaar.launchpad.net/~mir-team/mir/trunk/files/head:/tools/vera%2B%2B/scripts/rules/) was using [vera++](https://bitbucket.org/ThArGos/vera/wiki/Home) in order to do something like this, but there wasn't any kind of automated build rule for running these checks on a continuous basis. I wanted to ensure that we could run checks on the files that were actually built so that style failures were errors actionable when the target was built. I also wanted to ensure that we didn't do style checks on things like autogenerated or imported code that would be difficult to exclude using a find rule.

Finally, I realized that having these checks integrated with the buildsystem could be useful for lots of other projects too, so I wanted to make it something separate from what I was working on already.

As such, I've just posted the first bits of [veracpp-cmake](https://github.com/smspillaz/veracpp-cmake) on my GitHub profile. veracpp-cmake is basically just two CMake macros to integrate vera++ into your build. First of all, it provides a FindVeraPP macro so that you can use it with find_package. It also provides some useful commands.

```cmake
verapp_import_default_rules_into_subdirectory_on_target
verapp_import_default_transformations_into_subdirectory_on_target
verapp_import_default_profiles_into_subdirectory_on_target
```

Will import the default rules, transformations and profiles installed with vera++ into a project subdirectory (usually in the build-dir) just before some target is executed. This means that you don't have to fork the default vera++ rules and can instead import them dynamically from the user's installation. All these three commands are just wrappers around `verapp_copy_files_in_dir_to_subdir_on_target`

Which provides a rule to copy files from on subdirectory to another just before a target is executed. Using this rule, you can copy your own rules, profiles or transformations into the same subdirectory as the default ones at build-time and then use both depending on which profile is set. Vera++ requires that all the rules, etc be in the same subdirectory of the same directory tree (eg, scripts / rules/ | transformations/, profiles /). `verapp_profile_check_source_files_conformance`

This function does a lot of the grunt-work in terms of checking source code file compliance. You just provide it with a target, the path to vera++ scripts, a profile and whether or not style check failures should be fatal or nonfatal errors. Then, just before your target is linked, it will have its source files scanned for style errors. That way, this integrates nicely with IDEs which parse the output of make.

Hopefully this will be useful to other projects. You can [import it as a git submodule](http://git-scm.com/book/en/Git-Tools-Submodules) and then adjust your CMAKE_MODULE_PATH and use it right away. The only caveat is that you need to both add it as a subdirectory with add_subdirectory () and also include it with include () because we need to build a [small tool to set the exit status correctl](https://github.com/smspillaz/veracpp-cmake/blob/master/src/exit_failure_on_stderr_wrapper.cpp)y when vera++ exits. I've filed a [bug](https://bitbucket.org/ThArGos/vera/issue/21/rfc-return-1-when-some-code-fails-a-rule) about this and hopefully I can get rid of this requirement soon.