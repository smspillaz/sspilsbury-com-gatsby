---
title: "Getting AWS Lambda and API Gateway to support binary, 2018 edition"
description: Time moves on, APIs break
post: true
date: "2018-03-04T09:11:32.667Z"
categories: []
keywords: []
slug: >-
  /@smspillaz/getting-aws-lambda-and-api-gateway-to-support-binary-2018-edition-9dfd81ab9291
---

I [wrote](https://smspillaz.wordpress.com/2017/11/19/serverless-react-boilerplate/) about getting a Node and React App up and running on AWS Lambda last year, but with the caveat that getting binary responses to work seemed nearly impossible to the point where I basically just skipped over it.

This post is about coming back again to finish the job.

Lambda and API gateway probably weren’t really designed to be used as web servers in the ordinary sense when they launched. It just so happens that developers have figured out ways to run Express servers on it by writing bridges such as [serverless-http](https://www.npmjs.com/package/serverless-http). So its not really a surprise that some things might not work the way we expect them to.

The basic crux of the issue is that Lambda isn’t a hosting platform. Its a place to put some code that receives JSON on a message queue and spits out JSON on another message queue. Its only API Gateway that actually allows you to build a web-server out of that, by translating web requests into JSON and back again.

JSON-in-JSON-out implies then that you’re working with text and not binary data. Try to send binary data in the middle of a text stream and its a recipie for trouble. Express and friends don’t really understand that and try to do it anyway, causing everything to get mangled up when API Gateway tries to decode the response on the other end.

One way to work around this is to convert all the binary data being returned by your server into the subset of bytes acceptable in text stream and then have API Gateway unserialize all that back into binary before it hits the browser. Unfortunately, easier said than done. But it can be done!

#### Step 1: Tell serverless-http to base64 encode binary content-types

In the normal case, you would have wrapped your server with `serverless` like this:

```js
const serverless = require('serverless-http');
const app = require('./server/server');

module.exports = {
 handler: serverless(app),
};

You’ll need to provide some options to tell it to intercept certain responses depending on their content type and base64 encode them instead, then hint back to API Gateway that they are base64 encoded.

const serverless = require('serverless-http');
const app = require('./server/server');

module.exports = {
 handler: serverless(app, {
 binary: ['image/png', 'image/jpeg', 'image/x-icon'],
 }),
};
```

#### Step 2: Tell API Gateway to base64 decode encoded content

This was the part I spent the better part of a day and a half Googling around for. Unfortunately, even though API Gateway got a hint that the response was base64 encoded by your Lambda function, [it won’t actually decode it](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-payload-encodings.html) unless the `Accept` header sent in the request matches the `Content-Type` header in the response **exactly**.

Unfortunately that’s rather useless if you want to host something browser-accessible, because browsers do this:

Accept: image/png,image/svg+xml,image/_;q=0.8,video/_;q=0.8,_/_;q=0.5

To get around that, you have to force API gateway to decode the base64 encoded response. Unfortunately again, pretty much all the documentation I’ve seen on how to do this does not seem to work. AWS also moved the “Binary Content Types” option in the API Gateway Console and the documentation does not seem to have been updated. The good news is that I found it, so now you get the benefit of that.

First, go to your API Gateway console:

![API gateway console](https://sspilsbury-com-images.s3.amazonaws.com/posts/medium/img/1__88kEDUwmWTrwl4mI37__Ibw.png)

Then, go to “settings” and add `*/*` to “Binary Media Types”:

![Binary Media Types Setting](https://sspilsbury-com-images.s3.amazonaws.com/posts/medium/img/1__uPFZPs89__gGpon__pYJJw1A.png)

And voila, after deploying it again, it should work and static images served from Lambda should render correctly in the browser.

Its also worth noting that this option seems to survive redeployments, which is nice.
