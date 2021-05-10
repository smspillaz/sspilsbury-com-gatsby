---
title: "Maintainers for the unsupported plugins"
date: "2012-09-07"
post: true
description: A brief call
---

I'm looking for people who are willing to step up and maintain some of the compiz plugins which we do not enable by default in Unity. These include:

- cubeaddon
- animation\*
- wobbly
- group
- etc

I won't remove these plugins from the source tree because I'm all for people using what they want, but its becoming increasingly difficult for Daniel and I to keep these plugins up to date. At the moment, if we need to make an important API change and it would be non-trivial to update a plugin which is not used in Unity, that plugin is disabled for building.

I think our history is important, and there are people out there who would be willing to keep them alive. If there aren't, then I'm happy to leave them disabled until we get time to continue maintaining them or someone else steps up.

If there's a plugin that you really love that isn't supported in the Unity usecase, and you want to maintain it across API breaks, hop onto #compiz-dev on freenode, send me an email or contact compiz-team on launchpad and let us know. While we might not have time to actually do the maintenance, I'm very willing to help and give advice to people who want to step up and do it. Love to have you on board.
