---
title: "Iterator Invalidation"
date: "2014-07-25"
post: true
description: A context-manager based idea to prevent an age-old memory problem with vectors
tags:
  - "c"
---

You might be fooled into thinking by using `std::vector` and avoiding bare arrays created with `new T[]` that you'll be avoiding all possible old-fashioned pointer-misuse bugs from the C era for that variable, for instance, null pointer dereferences, out of bounds access, memory corruption, etc. Not so - if you keep iterators  and references around to elements of a vector and then do anything to change its size, the standard says that those iterators and references may be invalidated by that operation(\*). More importantly, **you don't get a warning about this** and static analysis tools like *cppcheck* might not detect it in all cases (for instance, collection is modified by a function further down the call stack).

At least for operations like `push_back` which only affect the end of a group of iterators - there's a simple trick you can do to save and restore a group of iterators after such an operation.

```cpp
namespace detail {
  /* Main implementation of KeepIteratorsAlive -
   * counts down through all the iterators through
   * a recursive call until we get to N = 0, at which
   * point call the function in question
   */
  template <typename Function, typename Collection, typename IteratorTuple, size_t N>
  struct PreserveIterator {
    IteratorTuple operator () (Function const &function, Collection &collection, IteratorTuple const &tuple) {
      /* We need to call std::begin twice as the value of it * may change after we've called our iterator-modifying
       * function
       */
      auto distance = std::distance (std::begin (collection), std::get <N - 1> (tuple));
      auto result (PreserveIterator <Function, Collection, IteratorTuple, N - 1> () (function, collection, tuple));
      std::get <N - 1> (result) = std::begin (collection) + distance; return result;
      }
  };

  /* Specialisation for N == 0, at this point
   * we call the function and return an empty tuple
   * to fill up with the correct iterators again
   */
  template <typename Function, typename Collection, typename IteratorTuple>
  struct PreserveIterator <Function, Collection, IteratorTuple, 0> {
    IteratorTuple operator () (Function const &function, Collection &collection, IteratorTuple const &tuple) {
      function ();
      return IteratorTuple ();
    }
  };
}

template <typename Function, typename Collection, typename IteratorTuple> IteratorTuple
KeepIteratorsAlive (Function const &function, Collection &collection, IteratorTuple const &tuple) {
  typedef Function F;
  typedef Collection C;
  typedef IteratorTuple T;
  constexpr size_t const S = std::tuple_size <IteratorTuple>::value;

  return detail::PreserveIterator <F, C, T, S> () (function, collection, tuple);
}
```

You can use it like

```cpp
std::vector <MyType> vector; vector.push_back (MyType ());
auto it = vector.begin ();
std::tie (it) = KeepIteratorsAlive ([&vector]() { vector.push_back (MyType ()); }, vector, std::make_tuple (it));
```

As for reference and pointer stability - this is more difficult. You can either wrap the object type in `std::unique_ptr` (and take a reference to it) or `std::shared_ptr` (and make a copy of the `std::shared_ptr`), which means you'll pay the cost of another allocation and indirection costs on access, or you can assign each object a unique identifier by which you can use to look it up in the `std::vector` later.

If you want to avoid messing around with iterators, additional allocation or identifiers and _in general_ iterator, reference and pointer stability is more important than performance then you can use [`boost::stable_vector`](http://www.boost.org/doc/libs/1_53_0/doc/html/boost/container/stable_vector.html)

The main difference between the two is that `boost::stable_vector` is not contiguous, so if you have a lot of internal fragmentation (for instance, in these [tests](https://gist.github.com/smspillaz/e393e46b41ed40e0c239), 2 random erases for every three insertions) it can be a lot slower than `std::vector`. If array access performance is more important than insert/delete, then iterator adjustment and identifier tracking above can be used.

```
[smspillaz@平和猫とケーキ build (work)] $ ./src/benchmark 2000 2000 of boost::stable_vector (cold)
0.000143s wall, 0.000000s user + 0.000000s system = 0.000000s CPU (n/a%)
2000 of boost::stable_vector (warm) 0.000111s wall, 0.000000s user + 0.000000s system = 0.000000s CPU (n/a%)
2000 of std::vector (cold) 0.000048s wall, 0.000000s user + 0.000000s system = 0.000000s CPU (n/a%)
2000 of std::vector (warm) 0.000040s wall, 0.000000s user + 0.000000s system = 0.000000s CPU (n/a%)
2000 of std::list (cold) 0.000104s wall, 0.000000s user + 0.000000s system = 0.000000s CPU (n/a%)
2000 of std::list (warm) 0.000069s wall, 0.000000s user + 0.000000s system = 0.000000s CPU (n/a%)
```

(\*) [Detailed by Louis Feng here.](http://www.outofcore.com/2011/04/c-container-iterator-invalidation/)
