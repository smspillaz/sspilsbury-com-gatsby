---
title: "HasNoExceptMemFun type trait"
post: true
description: Template metaprogramming to ensure that you're calling a noexcept function
date: "2014-07-29"
---

When creating policy based classes we can use `std::enable_if` with SFINAE and type traits as a mostly-works substitute for real concepts in order to enforce certain things about those policies. This is somewhat like the `override` keyword that clients can have to ensure that they conform exactly to part of an interface, including `const` 'ness and `noexcept` .There does not appear to be any type traits to determine if a type's member function is `const` or `noexcept` . This is important if you want to call a template argument's member function and need to maintain a `const` or `noexcept` guarantee. `noexcept` in particular is particularly easy to get wrong as one could inadvertently call a function which throws an exception inside another `noexcept` func, risking calls to `std::terminate` .By mucking about with `std::declval` and _perfect forwarding_ we can test a member function to see if it is `noexcept` .

```cpp
template <class Object, class MemFun, class... Args> struct HasNoExceptMemFun {
  static constexpr bool value = noexcept (((std::declval <Object> ()).*(MemFun ()))(std::declval <Args> ()...));
};

template <class Object, class MemFun> struct EnableIfHasNoExceptMemFun :
  public std::enable_if <HasNoExceptMemFun <Object, MemFun>::value>::type
{
};

template <class T, typename = typename EnableIfHasNoExceptMemFun <T, decltype (&T::MyFunc)>::type> struct MyTemplate {
  void MyFunc () noexcept {
    T t;
    t.MyFunc ();
  }
}
```

One might be tempted to say _gesundheit_ after seeing something like that, but it can be decomposed fairly easily:

```cpp
class... Args
```

is what's known as a _parameter pack_ and effectively allows you to have an arbitrary number of parameters to a template. We use this to grab the types of the arguments to the member function.

```cpp
noexcept ()
```

Generates a _const-expression_ based on whether or not a particular operation is noexcept. If any operation within `noexcept ()` is not noexcept (true) then `noexcept ()` will return _constexpr_ false.

```cpp
std::declval <Object>
```

Is the magic that allows us to skip having to "construct" `Object` in order to "call" `MemFun` inside the `noexcept` block. It simply turns a type into an rvalue reference. One might be posed to ask why such a seemingly unsafe construct (turn nothing into an rvalue reference?!) made its way into the standard, but it is effectively a function that [does nothing](http://akrzemi1.wordpress.com/2011/11/12/functions-that-do-nothing/) in practice and is only there to help the compiler. With our new eval reference, we can go ahead and call `MemFun`

```cpp
((std::declval <Object> ()).*(MemFun ()))
```

Since the rvalue reference returned by `std::declval` is a temporary, we need to put it in brackets. `.*` is the _pointer-to-member_ operator which allows us to access some member by providing a pointer to it. Since `MemFun` is a _type_ and not a _pointer_ we need to "construct" it and also put it in braces since it is a temporary. Finally the entire operation needs to be put in brackets as `operator()` takes precedence over `operator.*`.

```cpp
(std::declval <Args>...)
```

Turns out that `std::declval` can be used with parameter packs too, so we're going to get "free" rvalue references to all of `MemFun`'s parameters.

Now that we've "called" `MemFun` with `Object` the value will be stored in the _`static bool` const-expression_ `value`.

From there we can use it with `std::enable_if`.

```cpp
std::enable_if <HasNoExceptMemFun <Object, MemFun>::value>::type
```

`std::enable_if` is basically one of the closest things we have to concepts at the moment. Effectively, it creates an erroneous substitution if the value passed as its first argument is `false` and a valid substitution if the value passed as its first argument is `true`. The second argument, if specified, represents the type that the nested `typedef type` will be.

Remember that `HasNoExceptMemFun` will be `true` if the arguments are a no-except member function of that type and `false` if they aren't. Thus, it is only in the `true` situation that we're able to inherit from `type`.

In order to use this, we define a small helper as follows (helps to avoid really long lines):

```cpp
template <class Object, class MemFun> struct EnableIfHasNoExceptMemFun : public std::enable_if <HasNoExceptMemFun <Object, MemFun>::value>::type { };
```

And then we use that helper like so

```cpp
template <class T, typename = typename EnableIfHasNoExceptMemFun <T, decltype (&T::MyFunc)>::type>
```

Remember that the `MemFun` template parameter is a _type_ and not a _pointer_ so we need to convert the actual member function pointer which we wish to check to its type. We can do that using `decltype`.

From there, we can finally be sure that in calling that member function of the template parameter that we're not running the risk of having exceptions thrown, because we can guarantee that the function is `noexcept`.

[Feel free to play with it here.](http://ideone.com/Ek8KMT)
