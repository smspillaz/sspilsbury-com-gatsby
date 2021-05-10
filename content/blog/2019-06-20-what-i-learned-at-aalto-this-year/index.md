---
post: true
title: What I learned at Aalto in 2019
description: Knowledge upgrade
date: "2019-06-20"
---

### What I learned in just one year of a Masters Degree in Computer Science

Last year I completely uprooted my life in Australia and moved to … literally the other side of the planet (Finland!) to pursue [a new study passion](https://medium.com/@smspillaz/visualising-my-summer-school-math-units-a2ff300b0244).

It has been an absolutely incredible year. Both for my [own self-development](https://medium.com/@smspillaz/self-developments-i-am-thankful-for-in-2018-e5061456b4af), and also because I learned a ton of new, useful things. This post is going to go into detail about some of the stuff I learned, the main takeaways, and why its useful.

**tl;dr**: If you an average software developer who wants to really challenge yourself, I absolutely recommend applying for the Master programmes, whether they be at Aalto University (where I am!), or any other well-established university in Europe, UK, the US or Canada.

![What a gorgeous campus](https://cdn-images-1.medium.com/max/800/1*WRQcfrC56tBa8MnZjebzAQ.jpeg)

---

**Data Science and Machine Learning Basics:** We started out with the “basic tools of the toolbox” with simple algorithms that could be used to solve most machine learning problems. For example, ways to embed data into vectors, [Principal Component Analysis](https://en.wikipedia.org/wiki/Principal_component_analysis) (PCA) for determining the directions of the most covariance and necessary components for reconstruction of the covariance, [maximum likelihood estimation](https://en.wikipedia.org/wiki/Maximum_likelihood_estimation) to fit probability distributions to data, bayesian linear regression, algorithmic and probabilistic clustering, itemset search, PageRank, linear and logistic regression, regularization and cross-validation strategies.

**Data Mining:** An algorithms course focusing on approximations to optimal algorithms over very large datasets that likely do not fit in memory. Covers very useful topics like distance functions and their properties, guarantees around sampling, the [Chernoff Bound](https://en.wikipedia.org/wiki/Chernoff_bound) and its implications for approximation algorithms (there are theoretical results showing that you can get arbitrarily close to an optimal result with high probability if you take enough samples), clustering and approximations of optimal clustering algorithms and graph signal processing and community detection.

**Computer Vision**: This field has an incredibly rich history which can be divided roughly into two eras. The first era could be described as the “Keypoints Era” starting from the invention of [SIFT keypoints](https://en.wikipedia.org/wiki/Scale-invariant_feature_transform) by David Lowe in 1999\. These keypoints are detected from image derivatives at multiple scales and can be used for all sorts of things, like image stitching,3D scene reconstruction and search-by-image. Then there is the deep learning area where Convolutional Neural Network architectures can be used for image signal classification and segmentation, starting with LeNet and converging on Deep ResNet like architectures. Obviously there’s much more on the deep learning side of things these days, but the course gave a great theoretical background on the underpinnings of image processing.

**Reinforcement Learning:** Also another field that can be split into two eras. The first era can be described as a “dynamic programming” era, where we propagate the value of taking certain actions in certain states over a discrete state space (Q learning) using the [Bellman Update Equation](https://en.wikipedia.org/wiki/Bellman_equation). Then, the “policy” is given by the optimal choice over the expected value of each action at each state over time. The second era is also defined by deep learning, which is essentially just using neural networks to approximate the Q function (deep Q learning) or just approximating the policy function directly, where the value function is implicit (policy gradients, actor-critic). Even though the dynamic programming stuff is kind of out of date, it is useful to understand because then the deep-RL side of things is essentially just an approximation of it using neural networks.

**Speech Recognition**: This course goes into the entire speech recognition pipeline, from audio processing using the Discrete Cosine Transform, to using Gaussian Mixture Models and Expectation Maximization to identify the probability of a particular phoneme in an utterance, to then using Hidden Markov Models and Viterbi Decoding to assemble phonemes into words, then using Language Models to determine the most likely sentence decoding. These components form the basis of most speech recognition pipelines today (deep learning hasn’t completely taken over yet, though [it is getting close](https://arxiv.org/pdf/1512.02595v1.pdf)).

**Natural Language Processing**: Another field that has both a “before deep learning” and “after deep learning” era. But like other fields, understanding the probability-based modelling leads to a better understanding of what the deep learning models are actually doing. We covered maximum likelihood approaches to language modelling, machine translation, sequence tagging, as well as lower-level tasks like encoding of linguistic morphology and stemming, then finally natural language generation metrics such as BLEU and METEOr for measuring the quality of sentences generated by machine translation models.

**Computational UX Design:** This course was a broad overview of many of the frontiers in UX design research, describing user interaction objectives in rigorous mathematical terms. Topics covered included a detailed overview of the human visual and perception system, combinatorial optimization, nonlinear transfer functions, layout optimization, Gaussian Processes, integer programming, human error, information foraging and reinforcement learning.

![Nonlinear second order control transfer functions](https://giphy.com/embed/WT934mOQ8XPyGNm3tj/twitter/iframe)

**Kernel Methods:** Extending on from the basic machine learning principles, this course examines the theoretical results behind kernelization, which is essentially the process of computing the N times N matrix of the inner product of each data point with every other datapoint after they are passed through some projection function. Such an inner product matrix is already used implicitly by common machine learning techniques such as Ridge Regression and the Support Vector Machine. These kernel techniques are very useful for limited dataset sizes, because they allow projections to theoretically infinite dimensional spaces to be represented by a finite-sized kernel matrix with complexity O(N²) in the number of data points that you have.

**Advanced Probabilistic Methods:** This course takes a more statistical perspective of model learning by illustrating some more complex models than just multidimensional Gaussians. The kinds of approaches discussed in this course are very useful because the have the property of explainability — the parameters of each model (for instance, the covariance or the mean) serve a very specific purpose in describing the underlying data distribution and can be easily adjusted. The course goes into detail about Expectation Maxmization, Variational Bayes and Stochastic Variational Inference, where the objective is to approximate an intractable data distribution using a tractable and minimize the overall divergence between the two distributions.

**Computational Learning Theory:** In this course we went into detail about the theoretical bounds of machine learning. The PAC-learning framework tells us about the kinds of problems that are learnable to an arbitrarily small error given enough data. The VC dimension, if computable, tells us about the capacity of a given model in terms of how much it can learn. We also covered theoretical bounds in online learning and submodular function optimization.

**Large Scale Data Analysis:** This course provided an overview of statistical learning theory, convex optimization, different forms of regularization and their effects on linear models, tensor composition and signal processing. It was a useful introduction to many fields on the optimization side of things.

**Deep Learning:** Who could ignore this course, which is the foundation for all of the exciting research we’ve seen over the last five years. The course goes into depth on the theoretical results behind the most popular deep learning approaches, for instance, why recurrent neural networks either suffer from the exploding gradient problem or the vanishing gradient problem, how the Long-Short Term Memory architecture mitigates this problem, how convolutional layers work and how Generative Adversarial Networks work. Some students also extended this coursework through a seminar course where we discussed and implemented recent papers such as Attention is you need, Capsule Networks, Wasserstein GANs, Graph Convolutions and Mean Teacher.

**Programming Parallel Computers:** Most computing hardware that exists in the hands of users today is severely underutilized. The course goes into detail about the possibilities for instruction level parallelism and efficient pipelining in most CPUs and how to design code that exploits this parallelism for very a substantial increase in program thoroughput. The course also details the architecture of modern GPUs and provides a useful introduction to the concepts and implementation in Single-Instruction-Multiple-Thread GPU programming.

There’s still so much stuff I want to learn in the future. I’m looking forward to another year of expanding my mathematical knowledge and understanding.

By [Sam Spilsbury](https://medium.com/@smspillaz) on [<time class="dt-published" datetime="2019-06-20T21:37:35.057Z">June 20, 2019</time>](https://medium.com/p/6545bdce5c53).

[Canonical link](https://medium.com/@smspillaz/what-i-learned-at-aalto-this-year-6545bdce5c53)

Exported from [Medium](https://medium.com) on May 8, 2021.
