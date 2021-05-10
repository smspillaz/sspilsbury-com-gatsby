---
title: "Explaining Boyer-Moore"
post: true
description: Why grep is so damn fast
date: "2017-09-23"
---

I had to implement the Boyer-Moore string search algorithm from scratch for an advanced algorithms class in 2015. It remember it took ages to get my head around the various concepts and I was so happy when I finally got it. So it was unsurprisingly disappointing that fast-forward to today, I've forgotten how it works.

Luckily, I'm on a bit of a mission to learn Rust and algorithms are a pretty good testing bed. So this article is partly for my benefit to summarise my own findings and partly for the benefit of the reader who might be scratching their head about how it works.

# Naive Substring Search

To understand why such a big deal is made about Boyer-Moore, you need to appreciate why "naive" substring search scales so poorly.  "naive" substring search is basically exactly how you'd expect to implement a substring search:

```c
char needle[] = "some word";
char haystack[] = "Why oh why must I always find the word, some word, any word";

size_t needle_len = strlen(needle);
size_t haystack_len = strlen(haystack);

for (size_t i = 0; i < (haystack_len - needle_len); ++i) {
    bool match = true;
    for (size_t j = 0; j < needle_len; ++j) {
        if (needle[i] != haystack[i + j]) {
            match = false;
            break;
        }
    }

    if (match) {
        return i;
    }
}
```

return -1;

This implementation of substring search is dutiful - it will try and match, from front to back, the needle at every position in the haystack. The problem is exactly that, it will try and match the needle at every single position in the haystack. In the worst case, it needs to check the length of the needle against the length of the haystack, haystack times. We say that this is `O(nm)`.

If you're just matching one or two characters against a very long body of text, its probably not too bad. But if you're thinking of checking if a paragraph is contained a book, you're gonna have a bad time.

If you visualize what is going on in the naive search, you'll probably notice all the unnecessary work:

```
Why oh why must I always find the word, some word, any word
some word
 some word
  some word
   some word
    some word
     some word
      some word
```

The astute reader might see this and realize that in every case above, we're just matching the letter "s" over and over again against cases that are futile anyway, because for the entire string to match, the last letter must also necessarily match and ... it doesn't. So lets handle that case now:

```c
char needle[] = "some word";
char haystack[] = "Why oh why must I always find the word, some word, any word";

size_t needle_len = strlen(needle);
size_t haystack_len = strlen(haystack);

for (size_t i = 0; i < (haystack_len - needle_len); ++i) {
    bool match = true;
    for (size_t j = 0; j < needle_len; ++j) {
        /* Compare back to front */
        if (needle[(needle_len - 1) - j] != haystack[i + ((needle_len - 1) - j)]) {
            match = false;
            break;
        }
    }

    if (match) {
        return i;
    }
}

return -1;
```

Main difference here is that we compare back to front - so at least we're catching all those futile mismatches early. While this is a little better, it is still technically O(nm) - the same problem could just happen in reverse, all the characters at the back could match, except for the first one. Now you're back to square one.

# Skipping Ahead

The impatient reader might wonder why we're bothering to re-examine all those sub-patterns within the pattern we just failed. That alignment didn't match, so why not check the next one instead? That would make the whole thing O(n), right?

```
Why oh why must I always find the word, some word, any word
some word
         some word
                  some word
                           some word
                                    some word
                                             some word
                                                  some word
```

Damn! We missed the match! The problem with this approach is that in skipping words you might partly overlap the match, then partly overlap another part of the match, but never actually see whole match. So this substring search approach is actually incorrect. What we'll need to do "intelligently" figure out how many characters to skip ahead so that we'll eventually align with the match in the haystack. And that is exactly what Boyer-Moore is about!

The Boyer-Moore algorithm defines two lookup tables, the **bad character** table and the **good suffix** table. The **tl;dr** of both of these tables is as follows:

1. The **bad character** table tells you how many characters to shift the pattern forward if you want to align the character in the **haystack string** where the mismatch occurred with the closest character in the **needle** **string** such that the two will match. The theory goes that if there's at least a character matching in the middle of the pattern, there's some likelihood that the new alignment itself is a match.
2. The **good suffix** table tells you how many characters to shift the pattern forward such that the **substring into the pattern you just matched** (eg, all the characters that did match up until the mismatch) occurs again. Generally speaking the good suffix table doesn't come into play very much, but it is relevant in cases where you have repeating patterns within the **needle string** and you need to check the repeated pattern against the input string. Usually this comes up in the context of trying to match DNA strings, where you only have an alphabet of GATC.

That probably didn't mean very much without examples, so lets start with the **bad character rule**. Look again at what we were doing when we tried to just blindly skip ahead by the text length:

```c
Why oh why must I always find the word, some word, any word
some word
         some word
                  some word
                           some word
                                    some word
                                             some word
                                                  some word
```

If you're observant, you'll see that we got close, but we just missed out, specifically, here:

```
ord, some
some word
```

We mismatched on the last character (remember, starting from the back!), d != e. But we know that the character 'e' occurs in our pattern! If we just shift the pattern forward such that the two 'e' characters align....

```
some word
some word
```

Ah-hah! We have our match! So by using the **bad character** rule we were able to keep skipping words(\*) all the way until we got close to the match, and then we just aligned with the match! That's very very close to linear performance for something that was previously quadratic!

So where does the **good suffix rule** come in to it? Well, to illustrate this, I'll have to use another example:

```
ababa abcbb abcab
abcab
```

Yes, this is slightly more contrived, but it demonstrates that the bad character rule on its own is not sufficient to ensure correct matching:

```
ababa abcbb abcab abccb
abcab
 abcab
      abcab
        abcab
         abcab
              abcab
                  abcab
```

Uh-oh, we missed it! So why did that happen? Well, we got close, but then this happened:

```
ababa abcbb abcab abccb
         abcab
```

"ab" matched "ab" at the end of the needle, which was a good start. But then "c" didn't match "a". Since " " does not occurr within our string, we skip forward by five characters (eg, the length of the needle) and completely miss the fact that we could have aligned "ab" at the start of the string with the "ab" that we just matched! The **good suffix rule** accounts for this. We kept a record of how far back in the string the same subpattern "ab" occurs again. In this case, it is three characters away, because we matched two characters, we shift forward by three:

```
ababa abcbb abcab abccb
            abcab
```

And we're done!

# Computing the tables

By far the most annoying part of implementing the algorithm the algorithm is computing the tables for the **bad character rule** and **good suffix rule**. Most of the content I've seen around this has literally been as useful as code snippits with cryptic variable names or just snapshots of the already-computed tables. I'm going to walk you through how the tables actually work, step by step.

Starting with the **bad character** **rule** table, recall what the bad character rule actually did:

```
Why oh why must I always find the word, som**e** word, any word
some word
         some word
                  some word
                           some word        5 <- (shift for e from d)
                                    som**e** word
                                         som**e** word (shift by only 5)
```

We saw that we mismatched on 'e' at the **last** character in the **needle**. We know from there that the character 'e' is five characters before that last character, so we shift forward only five characters the next time. So it stands to reason that we'll need to compute a 2D table - for every character in the alphabet and every position in the needle, how far back do we need to look in order to the character in the alphabet in the needle?Again, it isn't the character in the needle at the given index that we're interested in, its the character in the alphabet that we're looking at (and we do it for each character in the alphabet). So yes, this is quite a large table:

```
    a b c d e f g h i j k l m n o p q r s t u v ... w
0 s
1 o                                     1
2 m                             1       2
3 e         1               1   2       3
4           2               2   3       4
5 w         3               3   4       5
6 o         4               4   5       6           1
7 r         5               5   6       7           2
8 d         6               6   7     1 8           3
```

Notice a convenient pattern? All we're doing is figuring out how many characters backwards into the needle we need to go in order to reach that character in the alphabet. If we can't find it, then no worries, we just don't put an entry  there (or typically, we'd put some sentinel value like 0 or -1). In rust, you might have code that looks like this:

```rust
fn find_pending_character_index(chars: &Vec<char>, start: usize, needle: &char) -> usize {
    let len = chars.len();

    for i in (start +1)..len {
        if chars[i] == *needle {
            return i - start;
        }
    }

    return 0;
}

fn bad_character_table(pattern: &str) -> Vec<Vec<usize>> {
    /* Go backwards through the string for each character and work out how many characters
     * away that character is (backwards) */
    let mut table =vec![vec![(0asusize); pattern.len()]; ASCII_LOWER.len()];

    /* String gets reversed here */
    let chars: Vec<char>= pattern.chars().rev().collect();
    let len = chars.len();

    /* Enumerate through the characters, back to front (idx here starts
     * at zero, but think of it as (len - 1) - idx */
    for (idx, _) in chars.iter().enumerate() {
        for (alphabet_index, c) in ASCII_LOWER.iter().enumerate() {
            /* How many characters from this one until we reach the end
             * or see this character again */
            let res = find_pending_character_index(&chars, idx, c);
            /* Since idx was zero-index, we invert it here, insert
             * number of steps backwards we have to go to find this
             * character in the alphabet */
            table[alphabet_index][(len - 1) - idx] = res;
        }
    }

    return table;
}
```

Okay, now for the **good suffix** table. Thankfully, it is much smaller than the **bad character** table, but it is a little more complicated to generate. Recall what the **good suffix** rule was doing:

```
ababa abcbb **ab**cab abccb
abcab
 abcab
      abcab
        abcab
         abc**ab** <- (shift forward by 3 to align subpattern)
            abcab (shifted only by 3, not by 5)
```

So essentially we need to keep track of, for each suffix how many characters we can look backwards in the needle to find the same suffix again. Simple enough to say it, but how do we actually implement something like that?

Well, the best way to explain it is that for each suffix, we have a sliding window starting from one character before which is the same size of the suffix. We scan both the substring pointed to by the window and the suffix to see if there is a match, and if so, we take note of how many characters away our window was:

```
abcab
    b (suffix)
   _ (window)
  _
 b (suffix appeared again, 4 characters away)
```

Same thing with the "ab" suffix...

```
abcab
   ab (suffix)
  __
 __
```

ab (suffix appeared again, 3 characters away)

So our overall **good suffix table** will look like this:

```
0 1 2 3 4
a b c a b
---------
      3 4
```

What does that look like in implementation? Well, something like this:

```rust
fn good_suffix_table(pattern: &str) -> Vec<usize> {
    /* For each character in the string, take the subpattern from char[i]..char[len]
     * and see if such a subpattern exists elsewhere in the string, moving the window
     * back one by one. This is an O(N^2) operation over the pattern, since you have
     * to check the subpattern over each window from the current position. */
    let chars: Vec<char>= pattern.chars().rev().collect();
    let mut table =vec![(0asusize); chars.len()];

    for idx in 0..chars.len() {
        /* Add one here since the outer loop was exclusive, we do not want the inner
         * loop to be exclusive of the last index */
       for candidate in 1..((chars.len() +1) - idx) {
           /* Checking two empty subpatterns against each other doesn't make
            * much sense - we want a full shift in that case */
           if idx > 0 && matching_subpatterns(&chars, 0, candidate, idx) {
               table[(chars.len() - 1) - idx] = candidate;
               break;
           }
       }
   }

    return table;
}
```

# Putting it all together

So now that we went to all that effort to construct our **good suffix** and **bad character** tables, how do we make use of them in the overall algorithm? Well, it is remarkably simple:

```rust
fn boyer_moore(input: &str,
               pattern: &str,
               bad_character: &Vec<Vec<usize>>,
               good_suffix: &Vec<usize>) -> Option<usize> {
    /* Some obvious cases */
    let pattern_chars: Vec<char>= pattern.chars().collect();
    let input_chars: Vec<char>= input.chars().collect();

    if pattern_chars.len() > input_chars.len() {
        return None;
    }

    /* Align at the first character */
    let mut alignment = 0;
    let max_alignment = input.len() - pattern.len();

    loop {
        let mut mismatch =false;

        for (pattern_index, i) in (alignment..(alignment + pattern_chars.len())).enumerate().rev() {
            if input_chars[i] != pattern_chars[pattern_index] {
               mismatch = true;

               /* If we're on the last alignment, return now,
                * as there are no matches */
               if alignment == (input.len() - pattern.len()) {
                  return None;
               }

               /* Mismatch occurred here, look up this character/index pair
                * in the good suffix and bad character tables to see how far
                * forward to shift. If the shift amount is zero, shift
                * forward by the entire pattern size */
               let charidx = (input_chars[i] as usize) - ('a' as usize);
               /* Shift amount is the higher of either the bad character
                * rule or the good suffix rule */
               let shift = std::cmp::max(bad_character[charidx][pattern_index],
                                         good_suffix[pattern_index]);

               if shift == 0 {
                   /* No shift found, shift as far as we can, either to
                    * the end or by the length of the needle */
                   alignment = std::cmp::min(max_alignment,
                                             alignment + pattern_chars.len());
               } else {
                   alignment = std::cmp::min(max_alignment, alignment + shift);
               }

               break;
            }
        }
    }

    /* No mismatches, return the current alignment */

    if !mismatch {
        return Some(alignment);
    }
}
```

Essentially what we're doing is starting at the beginning and matching from back to front. If we find a mismatch, we record which character we found a mismatch on and look up both the input character and the mismatch character index in the pattern in the good suffix and bad character tables. If those tell us how far to shift, we shift by that amount. Otherwise, we shift forward by the full pattern length.

And that, is how you get super fast linear time string matching!
