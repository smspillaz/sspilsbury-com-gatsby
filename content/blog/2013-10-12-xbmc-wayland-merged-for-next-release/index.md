---
title: "XBMC Wayland merged for next release"
date: "2013-10-12"
description: Coming to an HTPC near you
post: true
tags:
  - "gsoc"
  - "xbmc"
---

[Support for wayland compositors](http://smspillaz.wordpress.com/2013/07/16/xbmc-on-wayland-compositors-take-two/) is something that Cory Fields and I worked on over the past few months, and it has finally landed in [xbmc git master](https://github.com/xbmc/xbmc/pull/2978). As of today and by the next release, you'll be able to use xbmc as a fullscreen application directly on any wayland compositor (gnome-shell, weston, hawaii).

There's some other interesting fixes and hidden functionality that might be of interest to more technically minded users as well since the last update.

# Testing Framework

XBMC is probably one of the first standalone wayland clients that comes with a full unit and acceptance automated testing framework for its wayland backend. This means that we can use [continuous integration](http://en.wikipedia.org/wiki/Continuous_integration) systems, like team-xbmc's jenkins instance, to get early warnings and ensure that the backend remains functional across different wayland client library versions (more on that later) and also ensure that other people don't accidentally break a backend they most likely won't be using for a while. Getting the backend under a high level of test coverage at both a unit and acceptance level was a key deliverable for my GSoC project - X11 alternatives like Wayland/Weston and Mir are only just coming to fruition now and there is a very small subset of users who will be using them on a day-to-day basis. This general lack of usage (for the time being) presents a substantial risk that the backend will be accidentally broken by a seemingly unrelated as very few people will be testing it. This all depends of course, on enabling, building and running-in-continuous-integration the tests by default, which is going to be part of some follow up work. The tests also provide a mechanism for people working on the wayland backend to quickly verify if they accidentally broke anything.

## Implementation of the Testing Framework

The main test driver for XBMC is [Google Test](https://code.google.com/p/googletest/), and knowing gtest quite well, it was very straightforward to bootstrap some tests with that.

The amount of coverage we can achieve with the unit tests more or less depends on the architecture of the code. I made sure to write the wayland backend such that the architecture forms a [directed acyclic graph](http://en.wikipedia.org/wiki/Directed_acyclic_graph) with [loose coupling](<http://en.wikipedia.org/wiki/Coupling_(computer_programming)>) in between the nodes. That is basically jargon for saying that each class or function in the system can generally be used with mock classes or data at test time and that data flows throughout the system in a single direction with no externally unobservable side effects. Take for example, the way that keyboard events are processed:

![Keyboard Events Architecture](https://sspilsbury-com-images.s3.amazonaws.com/posts/wordpress/images/keyboard-events-architecture.png)

PollThread runs in the background for us and gathers up events from the event queue to be dispatched later. Once we want to process some events, CWinEvents::MessagePump (a static function that we have registered at build time) calls into our internal `xbmc::wayland::Loop::Dispatch` which, depending on the wayland client library version, delegates to a version specific event dispatch mechanism (more on that later). Through some magic in the wayland client library, this results in our registered proxy object (in this instance, `Keyboard`) having its callback function for the particular event we're interested in (a key press or release on a surface) being called. Once `Keyboard` knows about this, it sends raw data about that event over to `KeyboardProcessor` which looks up a scancode and keysym in the registered `Keymap` (in this case, `CXKBKeymap`, implemented using libxkbcommon) and then converts it into an XBMC_Event, which is something that XBMC understands. It then sends that to a registered `EventListener`, for which the production implementation calls CApplication::OnEvent where control leaves our subsystem.

Two things to note about this description:

1. Data flows from the top of the chart to the bottom of the chart. The same data in process never re-enters any other part of the system its already been into. This means that we can observe all effects in the system by looking at the outputs of each node.
2. Each node knows very little about the node before it or after it. `KeyboardProcessor` receives *raw* data which is looked up in *registered* `Keymap`. So long as `KeyboardProcessor` gets some raw data and and `Keymap` can turn that into a keysym, then `KeyboardProcessor` won't be affected by the operation of either.

This makes `KeyboardProcessor`, which probably does the bulk of the work, very easy to test. You register a fake keymap (which you control) with it and give it some fake keycodes and then expect the right XBMC_Events to come out the other end when it calls the registered `EventListener::OnEvent` function (which you also control). Indeed, this is exactly how the PointerProcessor tests work!

```cpp
using ::testing::Values;
using ::testing::WithParamInterfacee

namespace xw = xbmc::wayland;

class WaylandPointerProcessor :
 public ::testing::Test
{
public:
  WaylandPointerProcessor();
protected:
  StubCursorManager cursorManager;
  StubEventListener listener;
  xbmc::PointerProcessor processor;
};
WaylandPointerProcessor::WaylandPointerProcessor() :
  processor(listener, cursorManager){
}
TEST_F(WaylandPointerProcessor, Motion)
{
  const float x = 5.0;
  const float y = 5.0;
  xw::IPointerReceiver &receiver =
    static_cast<xw::IPointerReceiver &>(processor);
  receiver.Motion(0, x, y);

  XBMC_Event event(listener.FetchLastEvent());
  EXPECT_EQ(XBMC_MOUSEMOTION, event.type);
  EXPECT_EQ(::round(x), event.motion.xrel);
  EXPECT_EQ(::round(y), event.motion.yrel);
}
```

We're able to call directly into the `PointerProcessor::Motion` event above and make sure that the registered listener gets an XBMC_MOUSEMOTION event as we expect.

This this effectively tests that we're able to convert some raw data provided to a hypothetical wayland callback into an XBMC_Event, and runs very quickly (in microseconds), but it doesn't test that the entire system works the way we expect. More importantly, it doesn't test that if we **actually** receive a mouse motion event from a wayland compositor that it is going to be dispatched properly and then turned into the XBMC_Event that we're looking for. For that, we will want something more substantial and less fine-grained.

### Acceptance Tests Driver

If we really want to ensure that the whole system works for a particular usecase, you need to test the entire process from providing real external input to watching the output of your system at its boundary. For this, I took some inspiration from a project called [wayland-fits](https://github.com/01org/wayland-fits) which runs a series of automated test cases against real instances of weston and libraries like Gtk+, Qt and EFL.

For the purposes of testing a client, simulating things like keyboard and mouse interaction is a matter of sending those events to the client. Weston provides a fairly flexible extension API and amongst other things, allows you to easily define new private protocols to talk to clients that understand that protocol.

In XBMC's acceptance tests then, we launch an instance of weston on a private socket name (effectively, just a randomly generated filename in /tmp/) with the "headless backend", which does not use OpenGL at all and does not need access to the hardware mouse and keyboard or the underlying display framework. It allows clients to connect to it and to manipulate some state on the compositor side, but it doesn't actually have any real outputs other than the events it sends back to clients. We then also tell Weston to load our private "xbmcwayland" module, which in turn registers a global protocol for clients that understand it to talk to.

This global protocol allows clients to make Weston "deliver" input events to themselves or manipulate state on the compositor side. For instance:

```xml
<request name="move_pointer_to_on_surface">
 <arg name="surface" type="object" interface="wl_surface"/>
 <arg name="x" type="fixed"/>
 <arg name="y" type="fixed"/>
</request>
<request name="send_button_to_surface">
 <arg name="surface" type="object" interface="wl_surface"/>
 <arg name="button" type="uint"/>
 <arg name="state" type="uint"/>
</request>
```

And used like this:

```cpp
const unsigned int oKeycode = LookupKeycodeForKeysym(*Base::keymap, XBMCK_o);
Base::xbmcWayland->GiveSurfaceKeyboardFocus(Base::surface->GetWlSurface());
Base::xbmcWayland->SendKeyToKeyboard(Base::surface->GetWlSurface(),
                                     oKeycode,
                                     WL_KEYBOARD_KEY_STATE_PRESSED);
```

On the module side, we're going to get that request on the private protocol, and send back a real key event in response.

```cpp
void
xtw::XBMCWayland::SendKeyToKeyboard(struct wl_client *client,
                                    struct wl_resource *resource,
                                    struct wl_resource *surface,
                                    uint32_t key,
                                    uint32_t state)
{
  struct wl_client *surfaceClient = wl_resource_get_client(surface);
  struct wl_resource *keyboard = m_compositor.KeyboardResource(surfaceClient);
  struct wl_display *display = wl_client_get_display(surfaceClient);
  uint32_t serial, time;
  GetSerialAndTime(display, serial, time);

  wl_keyboard_send_key(keyboard, serial, time, key, state);
}
```

In the test, the only thing that we customized was the `EventListener` for KeyboardProcessor. Once we receive the event from Weston instance, we can test to make sure it got converted back into what we expected.

```cpp
/* Inserts a "synchronization point" in the event stream so that we
 * keep calling CWinEvents::MessagePump() until all requests that
 * would have generated an event have finished processing their
 * corresponding events on our side */
Base::WaitForSynchronize();

XBMC_Event event(Base::listener.FetchLastEvent());
EXPECT_EQ(XBMC_KEYDOWN, event.type);
EXPECT_EQ(oKeycode, event.key.keysym.scancode);
EXPECT_EQ(XBMCK_o, event.key.keysym.sym);
EXPECT_EQ(XBMCK_o, event.key.keysym.unicode);
```

And the test runs as expected:

```

[ RUN ] EventQueues/InputEventQueueWestonTest/0.KeyEvent
[ OK ] EventQueues/InputEventQueueWestonTest/0.KeyEvent (340 ms)

```

Lots of other tests run this way too:

```

[----------] 1 test from CompatibleEGLNativeTypeWaylandWestonTest
[ RUN ] CompatibleEGLNativeTypeWaylandWestonTest.TestConnection
[ OK ] CompatibleEGLNativeTypeWaylandWestonTest.TestConnection (343 ms)
[----------] 1 test from CompatibleEGLNativeTypeWaylandWestonTest (343 ms total)

[----------] 5 tests from ConnectedEGLNativeTypeWaylandWestonTest
[ RUN ] ConnectedEGLNativeTypeWaylandWestonTest.CreateNativeWindowSuccess
[ OK ] ConnectedEGLNativeTypeWaylandWestonTest.CreateNativeWindowSuccess (339 ms)
[ RUN ] ConnectedEGLNativeTypeWaylandWestonTest.ProbeResolutionsSuccess
[ OK ] ConnectedEGLNativeTypeWaylandWestonTest.ProbeResolutionsSuccess (336 ms)
[ RUN ] ConnectedEGLNativeTypeWaylandWestonTest.PreferredResolutionSuccess
[ OK ] ConnectedEGLNativeTypeWaylandWestonTest.PreferredResolutionSuccess (344 ms)
[ RUN ] ConnectedEGLNativeTypeWaylandWestonTest.CurrentNativeSuccess
[ OK ] ConnectedEGLNativeTypeWaylandWestonTest.CurrentNativeSuccess (340 ms)
[ RUN ] ConnectedEGLNativeTypeWaylandWestonTest.GetMostRecentSurface
[ OK ] ConnectedEGLNativeTypeWaylandWestonTest.GetMostRecentSurface (340 ms)
[----------] 5 tests from ConnectedEGLNativeTypeWaylandWestonTest (1700 ms total)

[----------] 4 tests from AssistedEGLNativeTypeWaylandTest
[ RUN ] AssistedEGLNativeTypeWaylandTest.TestGotXBMCWayland
[ OK ] AssistedEGLNativeTypeWaylandTest.TestGotXBMCWayland (348 ms)
[ RUN ] AssistedEGLNativeTypeWaylandTest.AdditionalResolutions
[ OK ] AssistedEGLNativeTypeWaylandTest.AdditionalResolutions (341 ms)
[ RUN ] AssistedEGLNativeTypeWaylandTest.PreferredResolutionChange
[ OK ] AssistedEGLNativeTypeWaylandTest.PreferredResolutionChange (350 ms)
[ RUN ] AssistedEGLNativeTypeWaylandTest.CurrentResolutionChange
[ OK ] AssistedEGLNativeTypeWaylandTest.CurrentResolutionChange (331 ms)
[----------] 4 tests from AssistedEGLNativeTypeWaylandTest (1371 ms total)

[----------] 2 tests from WaylandPointerProcessor
[ RUN ] WaylandPointerProcessor.Motion
[ OK ] WaylandPointerProcessor.Motion (0 ms)
[ RUN ] WaylandPointerProcessor.MotionThenButton
[ OK ] WaylandPointerProcessor.MotionThenButton (0 ms)
[----------] 2 tests from WaylandPointerProcessor (0 ms total)

[----------] 8 tests from EventQueues/InputEventQueueWestonTest/0, where TypeParam = (anonymous namespace)::SingleThreadedEventQueue
[ RUN ] EventQueues/InputEventQueueWestonTest/0.Construction
[ OK ] EventQueues/InputEventQueueWestonTest/0.Construction (330 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/0.MotionEvent
[ OK ] EventQueues/InputEventQueueWestonTest/0.MotionEvent (338 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/0.ButtonEvent
[ OK ] EventQueues/InputEventQueueWestonTest/0.ButtonEvent (351 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/0.AxisEvent
[ OK ] EventQueues/InputEventQueueWestonTest/0.AxisEvent (328 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/0.KeyEvent
[ OK ] EventQueues/InputEventQueueWestonTest/0.KeyEvent (340 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/0.RepeatAfter1000Ms
[ OK ] EventQueues/InputEventQueueWestonTest/0.RepeatAfter1000Ms (1442 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/0.NoRepeatAfterRelease
[ OK ] EventQueues/InputEventQueueWestonTest/0.NoRepeatAfterRelease (2543 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/0.Modifiers
[ OK ] EventQueues/InputEventQueueWestonTest/0.Modifiers (354 ms)
[----------] 8 tests from EventQueues/InputEventQueueWestonTest/0 (6028 ms total)

[----------] 8 tests from EventQueues/InputEventQueueWestonTest/1, where TypeParam = xbmc::wayland::version_11::EventQueueStrategy
[ RUN ] EventQueues/InputEventQueueWestonTest/1.Construction
[ OK ] EventQueues/InputEventQueueWestonTest/1.Construction (343 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/1.MotionEvent
[ OK ] EventQueues/InputEventQueueWestonTest/1.MotionEvent (353 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/1.ButtonEvent
[ OK ] EventQueues/InputEventQueueWestonTest/1.ButtonEvent (361 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/1.AxisEvent
[ OK ] EventQueues/InputEventQueueWestonTest/1.AxisEvent (367 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/1.KeyEvent
[ OK ] EventQueues/InputEventQueueWestonTest/1.KeyEvent (367 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/1.RepeatAfter1000Ms
[ OK ] EventQueues/InputEventQueueWestonTest/1.RepeatAfter1000Ms (1450 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/1.NoRepeatAfterRelease
[ OK ] EventQueues/InputEventQueueWestonTest/1.NoRepeatAfterRelease (2551 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/1.Modifiers
[ OK ] EventQueues/InputEventQueueWestonTest/1.Modifiers (371 ms)
[----------] 8 tests from EventQueues/InputEventQueueWestonTest/1 (6165 ms total)

[----------] 8 tests from EventQueues/InputEventQueueWestonTest/2, where TypeParam = xbmc::wayland::version_12::EventQueueStrategy
[ RUN ] EventQueues/InputEventQueueWestonTest/2.Construction
[ OK ] EventQueues/InputEventQueueWestonTest/2.Construction (350 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/2.MotionEvent
[ OK ] EventQueues/InputEventQueueWestonTest/2.MotionEvent (350 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/2.ButtonEvent
[ OK ] EventQueues/InputEventQueueWestonTest/2.ButtonEvent (356 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/2.AxisEvent
[ OK ] EventQueues/InputEventQueueWestonTest/2.AxisEvent (343 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/2.KeyEvent
[ OK ] EventQueues/InputEventQueueWestonTest/2.KeyEvent (353 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/2.RepeatAfter1000Ms
[ OK ] EventQueues/InputEventQueueWestonTest/2.RepeatAfter1000Ms (1444 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/2.NoRepeatAfterRelease
[ OK ] EventQueues/InputEventQueueWestonTest/2.NoRepeatAfterRelease (2581 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/2.Modifiers
[ OK ] EventQueues/InputEventQueueWestonTest/2.Modifiers (354 ms)
[----------] 8 tests from EventQueues/InputEventQueueWestonTest/2 (6131 ms total)

```

With all those tests, we're able to get some fairly comprehensive functionality coverage and ensure that the backend isn't accidentally stepped on (as long as people run the tests!).

# Support for multiple wayland client library versions

Usually, this isn't a problem for the vast majority of wayland clients. It is only a problem for xbmc because xbmc uses a [game loop](http://en.wikipedia.org/wiki/Game_programming#Game_structure "Game Loops"), a design going back to its Xbox origins. The game loop structure means that any external function that could cause the program to stop and wait indefinitely for external input of a certain kind (blocking) cannot happen in the main thread and must be done in a separate thread.

The relevant blocking operation here is reading the wayland socket to see if there are any events, or at least, going to sleep until there are events. We can't just [`fcntl`](http://linux.die.net/man/2/fcntl) (s, F_SETFL, O_NONBLOCK) the socket's file descriptor, because it is the client library is the one reading the socket and we can't really guarantee that it will handle -EWOULDBLOCK in a consistent manner across versions. A quick code audit showed that at present, it isn't handled and there are probably a number of assumptions in place that read() from the socket will block if there is nothing to read. As such, if we want to read the socket without potentially blocking xbmc forever, we need to put that into a different thread and then set a flag to notify the main thread when there are events to be dispatched.

In wayland versions 1.2 and above, the new functions `wl_display_prepare_read` and `wl_display_read_events` were added. These functions read the client socket without calling any of the registered callback handling functions until `wl_display_dispatch_pending` is called. This means that we can read in one thread and dispatch read events in the main thread. That's great, but we need to support older wayland versions as well.

In wayland 1.1 and lower, the only function which would read the event queue was `wl_display_dispatch`, which would *also* dispatch events once they were read. This would have the effect of dispatching events in a non-main thread, which is undesirable for a number of reasons and would result in numerous data races or other weird behaviour.

The former implementation is the superior one for a number of reasons, namely that we can keep all the event handling on the main thread and allow ourselves more room to move in terms of adding small side effects to functions. At least for the latter, we need to get all the events back on to the main thread before they leave the wayland backend and go back into xbmc.

As such, we have two event dispatching implementations, which each have three purposes:

1. Creating a thread capable of reading the wayland socket
2. Dispatching events from the wayland socket to our registered wayland object listeners
3. Getting the processed XBMC_Events back on to the main thread for later processing outside the backend.

The implementation is chosen at runtime based on the functions available in the wayland client library. The version 1.1 and lower implementation reads and dispatches the initial events internally on a second thread, which then sends them to the main thread for dispatch into the rest of xbmc. The version 1.2 and higher implementation reads the event queue on a second thread, and then dispatches the initial events on the main thread and forwards them on to xbmc from there.

Because we're able to replace this strategy at runtime, we can run all of our functional tests over these two implementations to check that the resulting output is the same:

```

[----------] 8 tests from EventQueues/InputEventQueueWestonTest/1, where TypeParam = xbmc::wayland::version_11::EventQueueStrategy
[ RUN ] EventQueues/InputEventQueueWestonTest/1.Construction
[ OK ] EventQueues/InputEventQueueWestonTest/1.Construction (343 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/1.MotionEvent
[ OK ] EventQueues/InputEventQueueWestonTest/1.MotionEvent (353 ms)

```

```

[----------] 8 tests from EventQueues/InputEventQueueWestonTest/2, where TypeParam = xbmc::wayland::version_12::EventQueueStrategy
[ RUN ] EventQueues/InputEventQueueWestonTest/2.Construction
[ OK ] EventQueues/InputEventQueueWestonTest/2.Construction (350 ms)
[ RUN ] EventQueues/InputEventQueueWestonTest/2.MotionEvent
[ OK ] EventQueues/InputEventQueueWestonTest/2.MotionEvent (350 ms)

```

# GSoC Mini-Promotion

You may or may not be aware that this project was the result of my participation in [Google Summer of Code 2013.](<http://google-opensource.blogspot.com.au/2013/10/9th-year-of-google-summer-of-code-draws.html?utm_source=feedburner&utm_medium=feed&utm_campaign=Feed:+GoogleOpenSourceBlog+(Google+Open+Source+Blog)>) Google Summer of Code (or GSoC for short), is a programme run annually by Google which incentivises currently enrolled university students to participate in Open Source projects. Students work directly with nominated mentors from participating projects to implement a localized feature or substantial change that would take around two months to complete. Students receive a modest stipend from Google so that they can support themselves and devote their attention to the project instead of taking up summer jobs.

Even if you're already quite involved in Open Source project work already, GSoC is a highly rewarding experience. It provides a decent incentive to participate in a project that you might not have otherwise participated in and in this way allows you to expand the breadth of your knowledge in a particular area. It is running for its [tenth](http://www.google-melange.com/gsoc/homepage/google/gsoc2014) year in 2014, so I highly recommend you check out the schedule and register to participate next year!
