---
title: "Bringing some of the missing plugins to Modern OpenGL builds"
date: "2012-12-26"
post: true
description: A tale of porting from fixed function to programmable pipelines
tags:
  - "compiz"
---

When we merged in OpenGL|ES support for compiz, we didn't have the resources to continue maintenance of some of the plugins which were were more complicated in their OpenGL usage. As such, those plugins were disabled for building until a later time.

I've taken some of my spare time to make the **cubeaddon** plugin work with the new OpenGL API.

![Image](https://sspilsbury-com-images.s3.amazonaws.com/posts/wordpress/images/screenshot-from-2012-12-26-224446.png)

![Image](https://sspilsbury-com-images.s3.amazonaws.com/posts/wordpress/images/screenshot-from-2012-12-26-224712.png)

![Image](https://sspilsbury-com-images.s3.amazonaws.com/posts/wordpress/images/epson002.jpg)

![Image](https://sspilsbury-com-images.s3.amazonaws.com/posts/wordpress/images/epson003.jpg)

![Image](https://sspilsbury-com-images.s3.amazonaws.com/posts/wordpress/images/screenshot-from-2012-12-26-223910.png)

In this reduced-resolution version, two quads are rendered per cube face, so we only submit eight vertices each time we render, but the texture co-ordinate planes and object transformation matrices are rotated each time. This gives us our full image.

## Other interesting parts

Some other fun parts were to remove fixed-function pipeline usage and replace it with client side or shader equivalents. For example, cubeaddon used this code:

```cpp
s_gen[0] = texMat[0];
s_gen[1] = texMat[8];
s_gen[2] = texMat[4];
s_gen[3] = texMat[12];
t_gen[0] = texMat[1];
t_gen[1] = texMat[9];
t_gen[2] = texMat[5];
t_gen[3] = texMat[13];

glTexGenfv(GL_T, GL_OBJECT_PLANE, t_gen);
glTexGenfv(GL_S, GL_OBJECT_PLANE, s_gen);

glTexGeni(GL_S, GL_TEXTURE_GEN_MODE, GL_OBJECT_LINEAR);
glTexGeni(GL_T, GL_TEXTURE_GEN_MODE, GL_OBJECT_LINEAR);

glEnable(GL_TEXTURE_GEN_S);
glEnable(GL_TEXTURE_GEN_T);
```

in order to generate texture co-ordinates for the cubecaps inside OpenGL, but that is not supported in OpenGL|ES, so I had to replace it with a client side simulation:

```cpp
GLVector sGen (texMat[0], texMat[8], texMat[4], texMat[12]);
GLVector tGen (texMat[1], texMat[9], texMat[5], texMat[13]);

/* Generate texCoords for the top section of the
 * cap */

texCoords.reserve ((CAP_ELEMENTS + 2) * 2);

for (unsigned int i = 0; i < CAP_ELEMENTS + 2; i++)
{
    GLVector v (mCapFill[i * 3],
                mCapFill[i * 3 + 1],
                mCapFill[i * 3 + 2],
                1.0f);

    float s = v * sGen;
    float t = v * tGen;
    texCoords.push_back (s);
    texCoords.push_back (t);
}
```

Texture co-ordinate generation with GL_OBJECT_LINEAR just takes the dot product of the object vertex and texture plane.

Another challenge was the usage of glDrawElements

```cpp
glDrawElements (GL_QUADS, CAP_NIDX, GL_UNSIGNED_SHORT,
		        mCapFillIdx);
```

`glDrawElements` uses a technique called **index buffer objects**, which is a clever optimization to prevent sending the GPU a lot of geometry. Instead of uploading lots of vertices which might overlap (you saw this in my diagrams earlier, it was often the case that v3 and v1 overlapped each other), you send OpenGL an array of unique vertices, then send it an array of *indicies* which reference which vertex in the vertex buffer should be drawn next. So for example you might have:

```cpp
GLfloat vertices[] =
{
    0.0f, 0.0f, 0.0f
    1.0f, 0.0f, 0.0f
    0.0f, 1.0f, 0.0f,
    0.0f, 1.0f, 0.0f,
    1.0f, 1.0f, 0.0f,
    1.0f, 0.0f, 0.0f
};

glVertexPointer (3, GL_FLOAT, 0, vertices);
glDrawArrays (GL_TRIANGLES, 0, 6);
```

As you can tell, there are some overlapping vertices here, so just calling glDrawArrays means that the vertex processor needs to walk every vertex.

```cpp
GLfloat vertices[] =
{
    0.0f, 0.0f, 0.0f
    1.0f, 0.0f, 0.0f
    0.0f, 1.0f, 0.0f,
    1.0f, 1.0f, 0.0f,
};

GLushort indicies[] ={
    0, 1, 2,
    2, 1, 3
}

glVertexPointer (3, GL_FLOAT, 0, vertices);
glDrawElements (GL_TRIANGLES, 6, GL_UNSIGNED_SHORT, indicies);
```

Instead of providing 6 vertices, we only had to provide 4, and we ask OpenGL to use vertices 0, 1, 2 for the first triangle, and then 2, 1, 3 for the second.

Unfortunately, our **GLVertexBuffer** class doesn't really support the semantics of using IBOs, so I had to add some code to extract the "real" vertex data in place. Thankfully this isn't too hard.

```cpp
std::vector <GLfloat> vertexData;
vertexData.reserve (nIndicies * 3);
for (unsigned int i = 0; i < nIndicies; ++i)
{
    unsigned short vertexBase = indicies[i] * 3;
    vertexData.push_back (vertices[vertexBase]);
    vertexData.push_back (vertices[vertexBase + 1]);
    vertexData.push_back (vertices[vertexBase + 2]);
};

vertexBuffer->addVertices (nIndices, vertexData);
```

## Guide on adapting old plugins

I've used some of my experience to write up a guide on adapting old plugins for the new API. You can find it on the [compiz wiki](http://wiki.compiz.org/Development/zero-nine/GLESPorting "GLES porting").
