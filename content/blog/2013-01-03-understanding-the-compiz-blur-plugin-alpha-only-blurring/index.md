---
title: "Understanding the compiz blur plugin: alpha-only-blurring"
date: "2013-01-03"
post: true
description: Blurring "behind" things
---

A former compiz developer once told me that the blur plugin is (paraphrased, since I don't have the original quote), a bunch of voodoo in a `.cpp` file. After implementing it for newer versions of compiz that use GLSL instead of ARB shaders, I'd be almost inclined to agree. It uses a number of tricks to do its work in places that one wouldn't expect, but I think this information could be useful for other compositors. There's lots of tricks, so I'll try and space out what I find over different blog posts.

## Blurring algorithms

Surface blurring in OpenGL is a tricky problem, because every pixel in the region that you need to blur is dependent on every other pixel, which means that you need to render the whole region first, and then re-render the pixels in that region with blurring applied. Generally speaking, there are two different ways to do this. The first is to copy the read buffer into a texture, and then draw that texture on-screen with blur post-processing. For example:

```cpp
// draw stuff
GLuint read;
glGenTextures (1, &read);
glBindTexture (GL_TEXTURE_2D, read);

// set up texture

glCopyTexSubImage2D (GL_TEXTURE_2D, 0,
                     0, // x offset in texture co-ordinates
                     0, // y offset in texture co-ordinates
                     srcX,
                     srcY,
                     srcWidth,
                     srcHeight);

glBindTexture (GL_TEXTURE_2D, 0);

// set up blur program

glUseProgram (blurProgram);

float vertices[] =
{
    srcX, srcY, 0,
    srcX, srcY + srcHeight, 0,
    srcX + srcWidth, srcY, 0,
    srcX + srcWidth, srcY + srcHeight, 0
}

float texCoords[] =
{
    0, 0,
    0, 1,
    1, 0,
    1, 1
}

glActiveTexture (GL_TEXTURE_UNIT0_ARB);
glBindTexture (GL_TEXTURE_2D, read);
glEnableClientState (GL_VERTEX_ARRAY);
glEnableClientState (GL_TEXTURE_COORD_ARRAY);
glVertexPointer (3, GL_FLOAT, 0, vertices);
glTexCoordPointer (2, GL_FLOAT, 0, texCoords);
glDrawArrays (GL_TRIANGLE_STRIP, 0, 4);
glBindTexture (GL_TEXTURE_2D, 0);
glDisableClientState (GL_TEXTURE_COORD_ARRAY);
glDisableClientState (GL_TEXTURE_COORD_ARRAY);
```

Another way of doing it is to render the scene into a framebuffer object, and then draw that to the screen with blurs applied.

```cpp
GLuint fb, tex;
glGenFramebuffers (1, &fb);
glBindFramebuffer (GL_DRAW_FRAMEBUFFER, fb);
glGenTextures (1, &tex);
glBindTexture (GL_TEXTURE_2D, tex);
glTexImage2D (GL_TEXTURE_2D, 0, GL_RGBA, screenWidth, screenHeight, 0, GL_RGBA, GL_UNSIGNED_BYTE, NULL);
glTexParameteri (GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
glTexParameteri (GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
glBindTexture (GL_TEXTURE_2D, 0);
glFramebufferTexture2D (GL_DRAW_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, tex, 0);

// render scene ...

glBindFramebuffer (GL_DRAW_FRAMEBUFFER, 0);

glActiveTexture (GL_TEXTURE_UNIT0_ARB);
glBindTexture (GL_TEXTURE_2D, read);
glEnableClientState (GL_VERTEX_ARRAY);
glEnableClientState (GL_TEXTURE_COORD_ARRAY);

// render the non-blurred regions first
float vertices[] =
{
    0, 0, 0,
    0, screenHeight, 0,
    screenWidth, 0, 0,
    screenWidth, screenHeight, 0
}

float texCoords[] =
{
    0, 0,
    0, 1,
    1, 0,
    1, 1
}

glVertexPointer (3, GL_FLOAT, 0, vertices);
glTexCoordPointer (2, GL_FLOAT, 0, texCoords);
glDrawArrays (GL_TRIANGLE_STRIP, 0, 4);

// now render the blurred region, in this case its just a single rect
float bVertices[] =
{
    blurSrcX, blurSrcY, 0,
    blurSrcX, blurSrcY + blurSrcHeight, 0,
    blurSrcX + blurSrcWidth, blurSrcY, 0,
    blurSrcX + blurSrcWidth, blurSrcY + blurSrcHeight, 0
}

float bTexCoords[] =
{
    screenWidth / blurSrcX, screenHeight / blurSrcY,
    screenWidth / blurSrcX, screenHeight / (blurSrcY + blurSrcHeight),
    screenWidth / (blurSrcX + blurSrcWidth), screenHeight / blurSrcY,
    screenWidth / (blurSrcX + blurSrcWidth), screenHeight / (blurSrcY + blurSrcHeight)
}

glVertexPointer (3, GL_FLOAT, 0, bVertices);
glTexCoordPointer (2, GL_FLOAT, 0, bTexCoords);
glDrawArrays (GL_TRIANGLE_STRIP, 0, 4);
glBindTexture (GL_TEXTURE_2D, 0);
glDisableClientState (GL_TEXTURE_COORD_ARRAY);
glDisableClientState (GL_TEXTURE_COORD_ARRAY);
```

After that's done, you just render the object which had the transparent background on top of the blur, and it appears as though the background is blurred.

## Alpha-as-blur

The blur plugin is a little more clever than this though. It takes the same blur texture (using the former method, and a combination of the two for gaussian blur), and uses that to paint alpha regions as blur. The original implementation looked something like this:

```
!ARBfp1.0
TEMP output, blur_fCoord, blur_mask, blur_sum, blur_dst, blur_t0, blur_t1, blur_t2, blur_t3, blur_s0, blur_s1, blur_s2, blur_s3;

// Sample texcoord[0] from texture[0] into output
TEX output, fragment.texcoord[0], texture[0], 2D;

// Multiply the fragment color with the sample
MUL output, fragment.color, output;

// Multiply fragment position with var0
MUL blur_fCoord, fragment.position, program.env[0];

// Add fCoord to var2 and store in t0
ADD blur_t0, blur_fCoord, program.env[2];

// Sample texture[1] at t0 and store in s0
TEX blur_s0, blur_t0, texture[1], 2D;

// Subtract var2 from fCoord, store in t1
SUB blur_t1, blur_fCoord, program.env[2];

// Sample texture[1] at t1
TEX blur_s1, blur_t1, texture[1], 2D;

// Multiply var2 with {-1.0, 1.0, 0.0, 0.0}. add fCoord store in t2
MAD blur_t2, program.env[2], { -1.0, 1.0, 0.0, 0.0 }, blur_fCoord;

// Sample texture[1] at t2, store in s2
TEX blur_s2, blur_t2, texture[1], 2D;

// Multiply var2 with {-1.0, 1.0, 0.0, 0.0}. add fCoord store in t3
MAD blur_t3, program.env[2], { 1.0, -1.0, 0.0, 0.0 }, blur_fCoord;

// Sample texture[1] at t3, store in s3
TEX blur_s3, blur_t3, texture[1], 2D;

// Multiply output.a by program.env[1] scalar, store in blur_mask
MUL_SAT blur_mask, output.a, program.env[1];

// Multiply sample0 by 0.25, store in blur_sum
MUL blur_sum, blur_s0, 0.25;

// Mutiply sample1 by 0.25, add to blur_sum
MAD blur_sum, blur_s1, 0.25, blur_sum;

// Multiply sample2 by 0.25, add to blur_sum
MAD blur_sum, blur_s2, 0.25, blur_sum;

// Multiply sample3 by 0.25, add to blur sum
MAD blur_sum, blur_s3, 0.25, blur_sum;

// Multiply blur_mask by -alpha, add blur_mask and store in blur_dst
MAD blur_dst, blur_mask, -output.a, blur_mask;

// Multiply sum by blur_dst alpha, add output, store in output.rgb
MAD output.rgb, blur_sum, blur_dst.a, output;

// Add blur_dst.a to output.a
ADD output.a, output.a, blur_dst.a;

// Put output into result.color
MOV result.color, output;
END

Its the first and last few lines that we care about the most. Lets have a look at them:

// Sample texcoord[0] from texture[0] into output
TEX output, fragment.texcoord[0], texture[0], 2D;

// Multiply the fragment color with the sample
MUL output, fragment.color, output;

...

// Multiply output.a by program.env[1] scalar, store in blur_mask
MUL_SAT blur_mask, output.a, program.env[1];

...

// Multiply blur_mask by -alpha, add blur_mask and store in blur_dst
MAD blur_dst, blur_mask, -output.a, blur_mask;

// Multiply sum by blur_dst alpha, add output, store in output.rgb
MAD output.rgb, blur_sum, blur_dst.a, output;

// Add blur_dst.a to output.a
ADD output.a, output.a, blur_dst.a;

// Put output into result.color
MOV result.color, output;
```

Here's what it looks like in GLSL:

```cpp
vec4 originalPixel = texture2D (objectTexture, objectTexCoord);
vec4 blurMask = clamp (threshold * originalPixel.a, 0, 1);
...
vec4 blurDestination = blurMask * -originalPixel.a + blurMask;
originalPixel.rgb = blurredPixel.rgb * blurDestination.a + originalPixel.rgb
originalPixel.a += blurDestination.a
gl_FragColor = originalPixel;
```

What that little bit of code does, is figure out what the original pixel would have been before blending it with the rest of the scene had we drawn it without the blur, then using its alpha value to determine how to mix the blurred pixel in. Then we mix in that burred pixel and draw it as the final pixel. It means that you can draw the blurred background-as-the-alpha-pixel on the texture, which saves another call to glDrawArrays.

Its also responsible for smoothly fading out the blur as the window becomes more transparent. If you've got the blur plugin available (Quantal and Raring users - its in my ppa), try fading out a window to see!

Next up, I'll talk about mipmap blurring, optimizing out occluded areas, interaction with `GLX_EXT_buffer_age` and independent texture-coordinate fetches.
