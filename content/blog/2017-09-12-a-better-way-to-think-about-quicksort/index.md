---
title: "A better way to think about Quicksort"
post: true
description: Lessons learned from haskell
date: "2017-09-12"
---

Recently I've been learning [haskell](https://www.haskell.org), a purely functional programming language. I still don't really understand why I'm doing that; I think functional *style* is great and it makes a lot of sense to divide programs up into mostly atomic units, composable at the domain level. In a functional style, you generally try to put the majority of your code into imdepotent functions whose outputs are strictly defined by their inputs. The function itself is kind of a black box and checks the "functional style" checkbox as long as there's no observable side effects. [Imperative shell, functional core](https://www.destroyallsoftware.com/talks/boundaries). I find that programs that use a functional style is a lot easier to reason about, to test and to re-use. *Purely* functional programming on the other hand always seemed like overkill to me, sacrificing comprehensibility for the sake of functional programming principles.

So what does this have to do with Quicksort? Well, it turns out that [Chapter 5 of Learn You a Haskell](http://learnyouahaskell.com/recursion#quick-sort) has a very motivating example:

```hs
quicksort :: (Ord a) => [a] -> [a]  
quicksort [] = []  
quicksort (x:xs) =  
 let smallerSorted = quicksort [a | a <- xs, a <= x] 
        biggerSorted = quicksort [a | a <- xs, a > x] 
 in  smallerSorted ++ [x] ++ biggerSorted
```

Now I appreciate that haskell's syntax is a little obtuse, so lets rephrase that in another more widely known language:

```py
def quicksort(elements):
    if elements:
        pivot = elements[0]
        smaller = quicksort([e for e in elements[1:] if e =< pivot])
        larger = quicksort([e for e in elements[1:] if e > pivot])
        return smaller + [pivot] + larger

    return []
```

When I first saw this example it was like a lightbulb went off in my head. Quicksort finally made **sense**. It wasn't this weird looking algorithm that just happened to work and have decent time complexity for some reason. See, if you ever took a Data Structures and Algorithms course at university, you were probably taught (in-place) Quicksort like this:

```
quicksort(elements, left, right) {
    if (left == right) {
        return
    }

    pivot = partition(elements, left, right)
    quicksort(elements, left, pivot)
    quicksort(elements, pivot, right)
}
```

Which probably lead to the first "WTF" - in my case - "WTF does a partition and a pivot have to do with sorting?"

```
partition(elements, left, right) {
    cmp = elements[left];
    pivot = left + 1;

    for (i = (left + 1); i < right; ++i) {
        if (elements[i] < cmp) {
            tmp = elements[pivot];
            elements[pivot] = elements[i];
            elements[i] = elements[pivot];

            pivot++;
        }
    }

    tmp = elements[pivot];
    elements[pivot] = cmp;
    elements[left] = tmp;

    return pivot - 1;
}
```

At which point 95% of people in the class would think be thinking "WTF????????"

And then the prof will usually open their mouth and say something like "[so first you pick a pivot](https://xkcd.com/1185/)" and then everyone in the room will immediately switch off and just pray that they can rote-learn their way through the upcoming test and forget about it.

Really, the functional way of looking at it makes far more sense.

But hang on, you say, "my textbook said that Quicksort was O(n log n) in the best case and O(n^2) in the worst case - why would you want to use it over merge sort when merge sort is guaranteed to be O(n log n) and both methods require concatenating lists together?"

That's a good point. The purely functional style doesn't allow for inner mutability of the array, so you can't exactly sort in place. But it is a good way to understand what on earth is going on with the in-place sort. But to understand that, first you need to understand why the recurrent version of quicksort works and how it is related to merge sort.

If you've seen the recurrent version of merge sort, it looks sort of similar to the recurrent version of quicksort:

```py
def mergesort(elements):
    if len(elements) <= 1:
        return elements;

    midway = floor(len(elements) / 2)
    left = mergesort(elements[0:midway])
    right = mergesort(elements[midway:1])

    merged = []

    leftIdx = 0
    rightIdx = 0
    while leftIdx < len(left) or rightIdx < len(right):
        if leftIdx < len(left) and left[leftIdx] < right[rightIdx]:
            merged.append(left[leftIdx])
            leftIdx += 1
        else if rightIdx < len(right):
            merged.append(right[rightIdx])
            rightIdx += 1

    return merged
```

An important property of comparison sorts is that lower time complexity bound is _n log n_. That is to say that in order to provide some sort of operation which gets the array into a "more sorted" state than it was before, you need to evaluate all the elements and *at best* you'll probably have to do that operation about log n times. So what is the incremental thing that merge-sort is doing here? Well, it looks at two chunks of an array and once it is done with its O(n) operation, it guarantees the *inner ordering* of that chunk, so if you were looking at `[1, 5]` and `[4, 7]`, the result would be `[1,4,5,7]`. *But* it doesn't say anything about the ordering of the resultant chunk in relation to other chunks in the array, nor does it guarantee that that chunk contains all the elements in within the range 1-7 that also appear in the array. All that said, the more you keep comparing two separate chunks and guaranteeing their inner ordering, the more "sorted" the array becomes. Because we kept halving the array, it stands to reason that if you do this about _log n_ times, you'll eventually end up with a sorted array.

If you compare the two recurrent equations, you'll realise that quicksort is the same thing but in *reverse*. Quicksort guarantees that the *outer ordering* between two chunks is maintained - each number in the right hand side will always be greater than each number in the left hand side. But it *doesn't* say anything about the *inner ordering* of those two chunks. All that said, if you keep going and doing the same thing on each of the two chunks, you'll eventually get to the point where there is no outer ordering to be maintained and thus each chunk has an inner ordering. Again, in the best case, you'll probably be halving the array, so you can recursively maintain outer-ordering between two chunks in *log n* time (although in the worst case, you'll be splitting the array into two parts - _1_ and _n - 1_ elements, at which point you have to maintain outer-ordering *n* times).

Okay, so what does this have to do with the overly-complicated looking in-place *partition* function? Well, imagine there was some atomic function that could take an array and make it outer ordered, such that all the elements in one part were always greater than all the elements in some other part just by looking at each element in the list once. That's what *partition* does. All the elements less than a certain value get swapped over to the left hand side and all the elements greater than it get swapped over to the right hand side. Then you just put the centrepiece back in place and you're done.

I still think the functional style is a lot easier to understand though. Maybe purely functional programming isn't so bad after all.
