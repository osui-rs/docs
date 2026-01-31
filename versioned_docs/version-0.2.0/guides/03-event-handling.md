markdown
---
sidebar_position: 3
title: Event Handling
---

# Event Handling

OSUI provides a flexible and type-safe event system that allows components to react to various occurrences, such as user input, internal state changes, or custom application-specific events. This guide explains how to define, emit, and listen for events using `on_event`, `emit_event`, and `emit_event_threaded`.

## Event Propagation Model

In OSUI, events are propagated downwards through the component tree. When an event is emitted from a `Context`, it first triggers all registered handlers on that `Context`, and then recursively calls `emit_event` on all its child `Context`s.

## Defining Custom Events

Any Rust type that implements `Send + Sync + Any + 'static` can be used as an event. Typically, you'll define custom `struct`s or `enum`s for your events to carry specific data.

```rust
// Define a custom event
#[derive(Debug, Clone)]
pub struct ButtonClickEvent {
    pub button_id: usize,
    pub timestamp: std::time::Instant,
}

// Another custom event
#[derive(Debug, Clone)]
pub enum CustomAppEvent {
    Tick,
    ReloadData,
}
```

## Listening for Events: `cx.on_event()`

Components can register event handlers using `cx.on_event()` to respond to specific event types.

```rust
use osui::prelude::*;
use std::sync::Arc;
use std::time::Instant;

// Custom event definition
#[derive(Debug, Clone)]
pub struct MyCustomEvent {
    pub value: String,
}

#[component]
fn EventListener(cx: &Arc<Context>) -> View {
    let received_events = use_state(Vec::<String>::new());

    // Register an event handler for `MyCustomEvent`
    cx.on_event({
        let received_events = received_events.clone(); // Clone State for the closure
        move |_ctx, event: &MyCustomEvent| {
            // This closure runs when MyCustomEvent is emitted
            let mut events_guard = received_events.get();
            events_guard.push(format!("Received: {}", event.value));
            // No need to call `update()` manually, `Inner` guard handles it on drop
        }
    });

    rsx! {
        "Event Listener Component"
        @for msg in received_events.get_dl() {
            format!("- {}", msg)
        }
    }.view(&cx)
}
```

*   `cx.on_event<T: Any + 'static, F: Fn(&Arc<Self>, &T) + Send + Sync + 'static>(self: &Arc<Self>, handler: F)`:
    *   `T`: The type of event you want to listen for (e.g., `MyCustomEvent`).
    *   `F`: A closure that takes `&Arc<Context>` (the component's context) and `&T` (a reference to the event data).
    *   You pass a closure that captures the necessary state (`received_events` in this case) and logic to execute when the event fires.

## Emitting Events: `cx.emit_event()` and `cx.emit_event_threaded()`

Components or other parts of your application can send events using `cx.emit_event()` or `cx.emit_event_threaded()`.

### `cx.emit_event()` (Synchronous)

`emit_event` processes event handlers sequentially in the current thread.

```rust
// ... (MyCustomEvent and EventListener component definitions from above)

#[component]
fn EventSender(cx: &Arc<Context>) -> View {
    let button_clicks = use_state(0);

    // Simulate an action that emits an event
    let emit_click_event = {
        let cx = cx.clone(); // Clone Context for the closure
        let button_clicks = button_clicks.clone();
        move || {
            let current_clicks = *button_clicks.get();
            *button_clicks.get() += 1;
            let event = MyCustomEvent {
                value: format!("Button clicked {} times", current_clicks + 1),
            };
            cx.emit_event(event); // Emit the event
        }
    };

    // Simulate clicking the button every second
    use_effect(
        {
            let emit_click_event = emit_click_event.clone();
            move || {
                loop {
                    sleep(1000); // Wait 1 second
                    emit_click_event();
                }
            }
        },
        &[], // No dependencies, run once on mount
    );

    rsx! {
        format!("Button clicks: {}", button_clicks.get_dl())
    }.view(&cx)
}

#[component]
fn App(cx: &Arc<Context>) -> View {
    rsx! {
        // EventSender and EventListener are siblings in the tree.
        // Events emitted by EventSender will propagate down to EventListener.
        EventSender {}
        EventListener {}
    }.view(&cx)
}

pub fn main() {
    let engine = Console::new();
    engine.run(App {}).expect("Failed to run App");
}
```

### `cx.emit_event_threaded()` (Asynchronous)

`emit_event_threaded` spawns a new thread for each registered event handler. This is useful for long-running or potentially blocking event handlers, preventing them from freezing your UI.

```rust
// ... (MyCustomEvent, EventListener definitions)

#[component]
fn ThreadedEventSender(cx: &Arc<Context>) -> View {
    let cx_clone = cx.clone();
    // Emit an event using `emit_event_threaded` on mount
    use_effect(
        move || {
            println!("Emitting threaded event on mount!");
            let event = MyCustomEvent {
                value: "Threaded mount event".to_string(),
            };
            cx_clone.emit_event_threaded(&event); // Notice the `&event` for threaded
        },
        &[], // Run once on mount
    );

    rsx! {
        "Threaded Event Sender"
    }.view(&cx)
}

#[component]
fn AppWithThreaded(cx: &Arc<Context>) -> View {
    rsx! {
        ThreadedEventSender {}
        EventListener {} // This listener will receive the threaded event
    }.view(&cx)
}

// To run: engine.run(AppWithThreaded {})
```

*   `cx.emit_event_threaded<E: Any + Send + Sync + Clone + 'static>(self: &Arc<Self>, event: &E)`:
    *   Takes `&E` (a reference to the event), which must implement `Clone` because each spawned thread receives a clone of the event data.
    *   Each handler for `E` will be executed in its own `std::thread::spawn`.

## Realistic Usage Scenario: Interactive Counter

Let's create a more interactive counter that responds to keyboard input.

```rust
use osui::prelude::*;
use std::sync::Arc;
use crossterm::event::{self, Event, KeyCode, KeyEventKind};

// Define a custom event for counter actions
#[derive(Debug, Clone)]
pub enum CounterAction {
    Increment,
    Decrement,
}

#[component]
fn InteractiveCounter(cx: &Arc<Context>) -> View {
    let count = use_state(0);

    // Listen for CounterAction events
    cx.on_event({
        let count = count.clone();
        move |_ctx, action: &CounterAction| {
            let mut count_guard = count.get();
            match action {
                CounterAction::Increment => *count_guard += 1,
                CounterAction::Decrement => *count_guard -= 1,
            }
        }
    });

    rsx! {
        "Press 'q' to quit, '+' to increment, '-' to decrement."
        format!("Current Count: {}", count.get_dl())
    }.view(&cx)
}

// A component (or `main` function logic) to poll keyboard input
// and emit CounterAction events.
#[component]
fn KeyboardInputHandler(cx: &Arc<Context>) -> View {
    // This effect runs once on mount to start the keyboard polling thread
    use_effect(
        {
            let cx = cx.clone();
            move || {
                let _ = crossterm::terminal::enable_raw_mode();
                loop {
                    if event::poll(std::time::Duration::from_millis(50)).unwrap() {
                        if let Event::Key(key_event) = event::read().unwrap() {
                            if key_event.kind == KeyEventKind::Press {
                                match key_event.code {
                                    KeyCode::Char('+') => cx.emit_event(CounterAction::Increment),
                                    KeyCode::Char('-') => cx.emit_event(CounterAction::Decrement),
                                    KeyCode::Char('q') => {
                                        let _ = crossterm::terminal::disable_raw_mode();
                                        cx.stop().expect("Failed to stop engine");
                                        break;
                                    },
                                    _ => {}
                                }
                            }
                        }
                    }
                }
            }
        },
        &[], // Empty deps: run once on mount
    );

    // This component doesn't render anything visible itself.
    // Its purpose is purely to handle input and emit events.
    rsx! { "" }.view(&cx)
}

pub fn main() {
    let engine = Console::new();
    engine.run(AppWithKeyboardInput {}).expect("Failed to run interactive app");
    let _ = crossterm::terminal::disable_raw_mode(); // Ensure raw mode is disabled on exit
}

#[component]
fn AppWithKeyboardInput(cx: &Arc<Context>) -> View {
    rsx! {
        KeyboardInputHandler {} // Handles input and emits events
        InteractiveCounter {}   // Listens for events and updates UI
    }.view(&cx)
}
```

In this example:
*   `KeyboardInputHandler` runs in a separate thread (due to `use_effect`'s spawning behavior).
*   It polls for keyboard events using `crossterm`.
*   Upon detecting `+`, `-`, or `q`, it emits a `CounterAction` or `Stop` command to its `Context`.
*   `InteractiveCounter` listens for `CounterAction` events and updates its internal `count` state, which then causes it to re-render.
*   The `stop()` command, emitted by `KeyboardInputHandler`, instructs the `Console` engine to terminate its rendering loop.

This showcases a full interaction loop using custom events for communication between components.

**Next:** Explore specialized lifecycle management with `use_mount` and `use_mount_manual` in [Lifecycle Hooks](./04-lifecycle-hooks.md).
