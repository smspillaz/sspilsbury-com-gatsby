---
title: "Exploring faster blurs"
post: true
description: Going sub-quadratic
date: "2017-10-08"
---

This week I a saw blog post on Hacker News entitled "[Fastest Gaussian Blur](http://blog.ivank.net/fastest-gaussian-blur.html)" (by Ivan Kutskir). That caught my interest, because one thing that always irked me back when I worked on Unity was the fact that our UI blurs felt quite sluggish and there didn't seem to be much we could do to speed them up given the size of the blur radii that we were using. I had a Sunday afternoon to kill and recently broke my ankle again (no gym or rock climbing), so I figured why not try implementing some of them.

# Gaussian Blur

The post goes over four different algorithms for implementing gaussian blur, the first one being the standard approach of just doing an R-squared pass over every pixel and calculating its normalised [gaussian distribution weights](https://en.wikipedia.org/wiki/Normal_distribution) inline. As you can imagine, this is [terribly slow](http://www.saikurain.com/artwork/gaussblur/), because you need to sample R-squared pixels for the entire image (and needlessly recompute the gaussian weights!). As is typically the case, its also the most trivial to implement in a fragment shader - you just take the input image and do two nested loops for the radius, [sampling each neighbouring pixel and applying its calculated gaussian weight](https://github.com/smspillaz/smspillaz.github.io/blob/master/js/gaussblur.js#L35).

As a simple blur shader, its pretty satisfying to implement, since it is probably the most accurate in terms of what we consider a "blur" to be. But alas, the performance sucks. So can we do better?

# Box Blur

Well, the article says yes, we can. Algorithms 2 and 3 in the article go over a technique called "box blur", which is basically a way to approximate gaussian blur without having to compute weights. The trick here is to do [several passes](https://github.com/smspillaz/smspillaz.github.io/blob/master/js/boxblur.js#L193) over the image each with different radii that you work out using some calculus. The article goes into more detail about why the math behind this works. As it says, the nice thing about box blurs is that you don't need to worry about computing weights - the application of different blur radii tends to converge on the same result.

The only difference Algorithms 2 and 3 is that Algorithm 3 explicitly separates out the horizontal and vertical passes (thus, you have an O(2(nr)) operation as opposed to an O(n\*r^2) operation. Most blurring approaches I've seen tend to do this because the complexity saving alone outweighs the cost of doing multiple framebuffer passes. In practice, it does turn out to be [more performant](http://www.saikurain.com/artwork/boxblur/), which is nice.

# Precomputed Weights with a Data Texture

I was tempted to go back and try implement this in GNOME-Shell, though I saw that someone had already [beaten me to it](https://github.com/yozoon/gnome-shell-extension-blyr). Initially I was a little defeated, but then I became curious looking at the approach. It seems as though this extension uses a bunch of hardcoded weights separated into "bands", though it initialises those weights on each pixel. I thought that was a little odd, so I dug a bit deeper into what it was doing by [reimplementing it](https://github.com/smspillaz/smspillaz.github.io/blob/master/js/fastblur.js#L59).

What was neat about this approach is that it is essentially a 2-pass gaussian blur, O(2(n \* r)), except without the cost of having to recompute all those weights all the time. That's handy, though since the weights are precomputed, its easy to run into a situation where you "run out" of weights if you want a bigger blur kernel.

Luckily, the author included a tool to compute weights up to a given blur radius. What was interesting is that the weights are put into "bands" for each stepping of 5 units on the radius. I presume that this was done to save on space inside the fragment shader since they _are_ all hardcoded.

Now, the size of the computed weights array changes as you increase the radius, since that gaussian distribution function kind of "flattens out" and more area along the x-axis becomes significant. The original author dealt with this problem by hardcoding a size-31 array that only fills up once we get to the last "band" and assigning the each hardcoded weights array to it depending on which "band" your radius was in. Unfortunately, the notation the author uses for directly assigning the array [isn't implemented](https://stackoverflow.com/questions/10467110/how-to-define-constant-array-in-glsl-opengl-es-2-0) in OpenGL ES 2 (which is what WebGL uses). First I tried just brute-forcing the problem and using a regex to generate code that assigned the weights directly, but I realised that there is a much nicer alternative.

You can't pass variable length arrays to shaders through uniforms in GLSL - I believe that doing so would probably violate the linker's expectations as to memory layout etc. But you can pass handles to textures to sample instead!

Textures used to be this special datatype in OpenGL, but thanks to OES_texture_float and hacks where we treat textures as "memory", they're now useful as general purpose variable-length storage. So much so its how GPGPU in WebGL works  - the threejs people even have an [example](https://threejs.org/examples/webgl_gpgpu_birds.html) on how to use it. I once did a project where I used the depth buffer value to dynamically scale a blur radius - maybe that can be the subject of a future blog post.

So of course, what you can do to pass these gaussian weights down to the shader without having to hardcode or precompute them is to create a texture using GL*FLOAT as the storage type and set the red channel to the weight value. Then just [sample](https://github.com/smspillaz/smspillaz.github.io/blob/master/js/fastblur.js#L70) the texture using _texture2D* inside the fragment shader to get the weight value for a given radius offset.

In my testing, such an implementation seemed to have [pretty good performance](http://www.saikurain.com/artwork/fastblur/) even for very large blur kernels, however, it appears as though the sampling mechanism diverges from what I'm used to with gaussian blur  and we end up giving more weight to things outside the focal point of the pixel very quickly. Perhaps something to be looked into for next time.
