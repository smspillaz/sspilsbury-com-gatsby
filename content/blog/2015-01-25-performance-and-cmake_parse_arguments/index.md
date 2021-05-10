---
title: "Performance and cmake_parse_arguments"
date: "2015-01-25"
post: true
description: An easily misunderstandable API
---

The only variable "type" that exists in the CMake language is the humble string. The language uses some library code on top of this fundamental type to weakly implement other types, like numbers and lists.

Lists in CMake are implemented as semicolon separated strings. If you wanted to iterate or find something in a list, then you'd tokenise it and work with the tokens. That's what the built-in [list](http://www.cmake.org/cmake/help/v3.1/command/list.html) family of functions do under the good.

Function call arguments in CMake are implemented as a list as well. The runtime sets a variable called [ARGV](http://www.cmake.org/cmake/help/v3.1/command/function.html?highlight=argn) in the function's scope. It also helpfully maps values from that list sequentially to the names passed to `function` when it was defined. Excess list items in the "call arguments" are put in `ARGN`. Most of the time you'll only ever deal with named arguments, but if you want to have a function call with variadic arguments you'll need to deal with `ARGN`.

Things start to break down when you want to pass lists to functions. If you want to pass a value directly to a function, so that one of its arguments contains the value you just passed, then usually you would dereference the variable in the function call, like so:

```cmake
function_call (${MY_VARIABLE})
```

Things start to break down when you want to pass a list. CMake parses space-separated identifies as a "list". If you dereference two list-containing variables next to each other, you get a single list. This makes cases like the following (which are perfectly reasonable) work the way you expect:

```cmake
set (MY_LIST ${FIRST_LIST} ${SECOND_LIST}
```

When this code runs, CMake sees something like this:

```cmake
set (MY_LIST "FIRST_LIST_ITEM_ONE;FIRST_LIST_ITEM_TWO;SECOND_LIST_ITEM_ONE;SECOND_LIST_ITEM_TWO")
```

Unfortunately, this makes life hard when you want to call a function:

```cmake
function (my_function VARIABLE_CONTAINING_LIST VARIABLE_CONTAINING_STRING) endfunction ()

my_function (${MY_LIST} ${MY_STRING})
```

When `MY_LIST` and `MY_STRING` get expanded, CMake sees a single list, as follows:

```cmake
my_function ("ITEM_ONE;ITEM_TWO;STRING")
```

And when CMake maps everything to variable names:

```cmake
VARIABLE_CONTAINING_LIST: ITEM_ONE VARIABLE_CONTAINING_STRING: ITEM_TWO ARGN: STRING
```

This is almost certainly what you would not expect. After all, the two variable dereferences were space separated and looked like they were intended to fill two separate arguments. Alas, that's not how CMake sees things. Its just one big flattened list.

There's a few solutions to this problem, but they all require the caller to keep track of when the intention is to pass a list as opposed to a single item of that list.

The first option is to quote the variable dereference at the call-site.

```cmake
my_function ("${MY_LIST}" "${MY_STRING}") VARIABLE_CONTAINING_LIST: ITEM_ONE;ITEM_TWO VARAIBLE_CONTAINING_STRING: STRING
```

The second option is to pass the name of the list as opposed to its value. This works because scopes have runtime lifetime as opposed to structural lifetime, so any live variables on the stack prior to the function call will also be available in that function's body:

```cmake
my_function (MY_LIST ${MY_STRING}) VARIABLE_CONTAINING_LIST: MY_LIST VARIABLE_CONTAINING_STRING: STRING ${VARIABLE_CONTAINING_LIST}: ITEM_ONE;ITEM_TWO
```

The third option, which appears to be the most prevalent, is to use a system of keyword arguments to denote what values as opposed to map to which names:

```cmake
my_function (LIST_VALUES ${VARIABLE_CONTAINING_LIST} STRING_VALUE ${MY_STRING}) ARGN: LIST_VALUES;ITEM_ONE;ITEM_TWO;STRING_VALUE;MY_STRING
```

The idea at this point would be to loop through all the items in `ARGN` and use the "markers" to determine where to set or append values. That's exactly what [cmake_parse_arguments](https://software.lanl.gov/MeshTools/trac/browser/cmake/modules/CMakeParseArguments.cmake) does. However, as with most things its always a question of trading usability for performance, and the performance implications can get very scary very quickly.

`cmake_parse_arguments` has a concept of "option arguments", "single value arguments" and "multi value arguments". If I were to use a table to summarise:

<table>
    <tbody>
        <tr>
            <td><strong>option arguments</strong>:</td>
            <td>Set to `ON` or `OFF` depending on whether name is present.</td>
        </tr>
        <tr>
            <td><strong>single value arguments</strong>:</td>
            <td>Set as "active" when encountered. Active variable is overwritten with subsequent values until another variable becomes "active".</td>
        </tr>
        <tr>
            <td><strong>multi value arguments</strong>:</td>
            <td>Set as "active" when encountered. Subsequent values appended until another variable becomes "active".</td>
        </tr>
    </tbody>
</table>

In order to implement this, you need to iterate all the values in `ARGN` (N) and then check whether any one of them matches a marker in either the option (M), single value (O) or multi-value arguments (P). So its O(NMOP). It gets really slow when you start passing the contents of long lists as the "value" to a multi-value token.

As an example, I just finished doing some profiling on a project I was working on, where CMake was taking a long time to run. Profiling indicated that `cmake_parse_arguments` was taking 38 seconds to run, which is absurdly long. I was calling `cmake_parse_arguments` to pass each line from a file I had just read using `file (STRINGS ...)`. It so happened that this file can be quite lengthy in some circumstances, which meant that `cmake_parse_arguments` had to do a lot of needless parsing. It was just faster to pass the filename in the end and open it in the local function. Making that change cut runtime to a few milliseconds.

As a general guideline, I now think that `cmake_parse_arguments` should probably be used sparingly, when you don't expect callers to give you a huge number of arguments. The way it works was always inherently going to be quite CPU-intense. If you've got a slow-running project, then passing too much stuff to `cmake_parse_arguments` may well be the culprit.
