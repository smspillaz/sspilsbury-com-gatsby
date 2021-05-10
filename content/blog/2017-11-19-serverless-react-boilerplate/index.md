---
title: "Serverless React Boilerplate"
post: true
description: Lambda to the rescue!
date: "2017-11-19"
---

I've been keeping my eye on [serverless](https://serverless.com) as a way to do hosting and deployments for my next react project when I get around to it and this week I finally got a chance to look into it.

![React Serverless.png](https://sspilsbury-com-images.s3.amazonaws.com/posts/wordpress/images/react-serverless.png)

The _tl;dr_ is that I've forked **[react-boilerplate](https://github.com/react-boilerplate/react-boilerplate)** as [**react-boilerplate-serverless**](https://github.com/smspillaz/react-boilerplate-serverless) if you just want to get started with serverless deployments. You should be able to immediately use *npm run serverless-deploy*.

For the uninitiated, the main difference brought with so-called "serverless" applications is that they don't run on a dedicated virtual machine or container that is running 24/7. Instead, your code is abstracted behind infinitely scaleable architecture and you only pay for the execution time of your code as opposed to the server itself. This is the sort of automatic scaleability that people like to talk about with cloud computing.

There's a few important distinctions with serverless computing that comes with its architecture. First, we call serverless deployments "functions" because they really are just that - the infrastructure hosting the serverless service takes care of all the network IO and just calls your "function" when a particular endpoint is accessed. In that sense, you lose control over how network IO is handled and the process which is handling that network IO. The "function" you are deploying in this case is really a loadable library which can be a collection of scripts and data but with no associated running "process". Instead the library is loaded at runtime, which means that the serverless computing provider can bill you only for the executing time your library actually uses in handling requests.

In practice, this distinction tends not to matter so much. It turns out to be relatively trivial (with some caveats) to turn any express-like application into a serverless application thanks to tools like [serverless-http.](https://www.npmjs.com/package/serverless-http) If you wrap your express application with the **serverless** wrapper from that package, infrastructure like AWS lambda will just call your route handlers directly after being invoked from a frontend server like AWS API Gateway. To your application, this is essentially no different than the route handlers being invoked asynchronously by **libuv** and node's **nextTick** function.

There's some other practical annoyances to be aware of as well, though they can all be mitigated.

## Support for compression and binary data is still sketchy at best

Unfortunately, AWS API Gateway handles binary content in a particularly awkward way, expecting it to be serialised to base64 by the request handler (e.g., your serverless function) before it goes back to the API Gateway (which should, in theory, unserialise it back into binary). For a long time, API Gateway didn't even support binary responses and only gained support for it [last year](https://aws.amazon.com/about-aws/whats-new/2016/11/binary-data-now-supported-by-api-gateway/) making it possible to actually host a server that serves image data directly with Lambda. **But** you still need to manually specify the MIME types that should be treated as binary on the API Gateway configuration. I've found that this works well enough for things like images but it completely broke down when it came to compressed text.

Most node servers, including the server set up in react-boilerplate use [compression-middleware](https://github.com/expressjs/compression) which allows for the client and server to agree for responses to be gzipped. Unfortunately, API Gateway chokes on the binary data if you give it the compressed response directly and specifying that the binary data be encoded in base64 causes the client to choke. I haven't found any way to get around this problem other than just disabling compression. Maybe the story will improve in time to come and we won't have to worry about messing about with settings to support binary content.

## Execution time

Since popular servers like node are single-threaded and event based you probably shouldn't be performing any too-long-running or expensive tasks from within your server anyway. But you really need to watch out with in-function asynchronous tasks that could take longer than 10 minutes, since the execution time is [limited to 300 seconds](http://docs.aws.amazon.com/lambda/latest/dg/limits.html#limits-list). This could be a problem if you need to upload large files with the help of the function. One workaround for that is to just have the client [upload the files directly to an S3 bucket,](http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingHTTPPOST.html) though that might require a little more stuffing about than you would like.

## Everything is stateless

Again, if you designed your web server in line with RESTful principles this shouldn't be a problem in theory, though it could be a problem if you have logic that runs on first start.

## You don't own the infrastructure

If you're used to Platform-as-a-Service this isn't a huge deal, but its worth keeping in mind that you don't control the runtime that your application is "running" on. In fact, you don't even control whether your application is running at a given moment, other than when it is handling requests.

# Check it out

So far I've had enough luck to be able to get a render of a page including images and associated scripts and styles, which proves that this definitely can be done. Hopefully this will become a more affordable and simpler way to deploy simple servers in the future, without having to worry about provisioning entire virtual machines or containers running 24/7 for the sake of hosting.
