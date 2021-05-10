---
title: "Transforming GObject Introspection data with XSLT"
date: "2013-02-04"
post: true
description: Using GI data to generate code functionally
---

**[GObject Introspection](https://live.gnome.org/GObjectIntrospection)** was always a project that caught my interest. Its a unique solution to an interesting problem - how can we provide frameworks like language bindings and documentation that aren't just based on static analysis (with little understanding of the runtime framework behind the code) and also doesn't involve lots of laborious hand-editing which results in out-of-date bindings.

What GObject Introspection is, is effectively a series of tools (**g-ir-scanner**, **g-ir-compiler**) which generates some semantic data about the static (C-level) and runtime level details of your code if it uses the GObject framework. By combining the two data sets, it can provide structured information about the objects and interfaces defined in a library, their C-function signatures, properties, signals, methods and also finer details like object ownership when passed between function boundaries.

The first output for GIR data is in a structured XML-like format. This means that it is possible to transform that information into something more useful using **XSLT.** XSLT is a turing-complete functional-template language often used by the web to transform the data contained by XML documents into a more desired format, such as HTML, or as another XML document with restructured data. It can also output plain-text using the data contained in the XML file. This is what is used in a number of places in **compiz** to generate glue that would otherwise be a pain to do by hand - such as GSettings and GConf schemas as well as the glue .cpp and .h code to directly address and manipulate options.

I'm looking into doing a small project with GIR data (which I will talk about more once its done), and one of the main things is to transform this GIR data. XSLT seemed like a natural way to immediately evaluate the document tree and produce information from it. Since this hasn't been done before as far as I can tell, here's some information on how to do it. I am omitting information on how to use **g-ir-scanner** as that is a different topic in and of itself.

First of all, looking at a sample GObject Introspection file, there are a number of different XML namespaces in use:

```xml
<repository version="1.2"
 xmlns="http://www.gtk.org/introspection/core/"
 xmlns:c="http://www.gtk.org/introspection/c/1.0"
 xmlns:glib="http://www.gtk.org/introspection/glib/1.0">
```

We need to ensure that those are defined in our XSLT file like so:

```xml
<xsl:stylesheet version="1.0"
xmlns:gi="http://www.gtk.org/introspection/core/1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
xmlns:c="http://www.gtk.org/introspection/c/1.0"
xmlns:glib="http://www.gtk.org/introspection/glib/1.0">
```

The line `xmlns:gi="http://www.gtk.org/introspection/core/1.0"` is really important, because GIR sits in the http://gtk.org/introspection/core/1.0 namespace (as indicated by): `xmlns="http://www.gtk.org/introspection/core/1.0"`

That one is easy to miss, and will cause the template match on /repository to silently fail if not defined somewhere.

Now we can start matching stuff:

```xml
<!-- This file is released under the terms of the GPL v3 licence -->
<xsl:stylesheet version="1.0"
<xsl:stylesheet version="1.0"
                xmlns:gi="http://www.gtk.org/introspection/core/1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:c="http://www.gtk.org/introspection/c/1.0"
                xmlns:glib="http://www.gtk.org/introspection/glib/1.0">

    <xsl:output method="text"/>

    <xsl:template name="processArgument">
        <xsl:text> parameter type: </xsl:text><xsl:value-of select="gi:type/@c:type"/>
        <xsl:value-of select="$newline"/>
        <xsl:text> parameter name: </xsl:text><xsl:value-of select="@name"/>
        <xsl:value-of select="$newline"/>
    </xsl:template>

    <xsl:template name="processVirtualMethod">
        <xsl:text>Found virtual method: </xsl:text><xsl:value-of select="@name"/>
        <xsl:value-of select="$newline"/>
        <xsl:text> returns: </xsl:text><xsl:value-of select="gi:return-value/gi:type/@c:type"/>
        <xsl:value-of select="$newline"/>
        <xsl:for-each select="gi:parameters/gi:parameter">
            <xsl:call-template name="processArgument"/>
        </xsl:for-each>
    </xsl:template>

    <xsl:template name="processInterface">
        <xsl:text>Found interface: </xsl:text><xsl:value-of select="@name"/>
        <xsl:value-of select="$newline"/>
        <xsl:for-each select="gi:virtual-method">
            <xsl:call-template name="processVirtualMethod"/>
        </xsl:for-each>
    </xsl:template>

    <xsl:template name="processNamespace">
        <xsl:text>Found namespace: </xsl:text><xsl:value-of select="@name"/>
        <xsl:value-of select="$newline"/>
        <xsl:for-each select="gi:interface">
            <xsl:call-template name="processInterface"/>
        </xsl:for-each>
    </xsl:template>

    <xsl:template match="/gi:repository">
        <xsl:for-each select="gi:namespace">
            <xsl:call-template name="processNamespace"/>
        </xsl:for-each>
    </xsl:template>

</xsl:stylesheet>
```

That sample stylesheet will match every namespace, every interface within that namespace and every virtual function that interface provides and provide some data on it. Perhaps it will be of some use?
