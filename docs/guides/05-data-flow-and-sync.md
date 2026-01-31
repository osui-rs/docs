markdown
---
sidebar_position: 5
title: Data Flow and Sync
---

# Data Flow and Synchronization

OSUI's reactive state system and event handling capabilities provide a robust foundation for managing data flow within your application. The `use_sync_state` and `use_sync_effect` hooks offer powerful patterns for synchronizing component state with external events and vice versa, enabling sophisticated inter-component communication and data management.

## `use_sync_state`: State from Events

`use_sync_state` allows a component's internal `State` to be automatically updated whenever a specific type of event is emitted to its `Context`. This is a powerful way to inject external data or changes into a component's reactive state.

### How it works:

It combines `use_state` and `cx.on_event`.
1.  You provide an initial value for the state.
2.  You specify the event type (`E`) and a `decoder` function.
3.  The `decoder` function takes an `&E` event and returns a new value `T` for the state.
4.  Whenever an event of type `E` is emitted to the current `Context`, the `decoder` runs, and the internal `State<T>` is updated.

```rust
use osui::prelude::*;
use std::sync::Arc;
use crossterm::event::{self, Event, KeyCode, KeyEventKind};

// Define a simple event to change a message
#[derive(Debug, Clone)]
pub struct MessageChangeEvent(pub String);

#[component]
fn MessageDisplay(cx: &Arc<Context>) -> View {
    // Use `use_sync_state` to update the message based on `MessageChangeEvent`
    let message = use_sync_state(
        cx,
        "Initial Message".to_string(), // Initial state value
        |event: &MessageChangeEvent| event.0.clone(), // Decoder: extract string from event
    );

    rsx! {
        "Received Message:"
        format!("  {}", message.get_dl())
    }.view(&cx)
}

#[component]
fn MessageInput(cx: &Arc<Context>) -> View {
    // Simulate input by reacting to key presses and emitting MessageChangeEvent
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
                                    KeyCode::Char(c) => {
                                        let msg = format!("Typed: {}", c);
                                        cx.emit_event(MessageChangeEvent(msg));
                                    },
                                    KeyCode::Enter => {
                                        cx.emit_event(MessageChangeEvent("Enter pressed!".to_string()));
                                    },
                                    KeyCode::Esc => {
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
        &[], // Run once on mount
    );

    rsx! {
        "Type something to change the message (Esc to quit):"
    }.view(&cx)
}

#[component]
fn App(cx: &Arc<Context>) -> View {
    rsx! {
        MessageInput {}   // Emits MessageChangeEvent
        MessageDisplay {} // Synchronizes its state with MessageChangeEvent
    }.view(&cx)
}

pub fn main() {
    let engine = Console::new();
    engine.run(App {}).expect("Failed to run app");
    let _ = crossterm::terminal::disable_raw_mode();
}
```

In this example, `MessageInput` emits `MessageChangeEvent`s based on keyboard input. `MessageDisplay` automatically updates its `message` state whenever it receives one of these events from its parent `Context`, thanks to `use_sync_state`.

## `use_sync_effect`: Events from State

`use_sync_effect` allows changes in a component's internal `State` to automatically trigger the emission of a specific type of event to its `Context`. This is useful for communicating state changes upwards or to sibling components.

### How it works:

It combines `use_effect` and `cx.emit_event`.
1.  You provide an `State<T>` instance you want to monitor.
2.  You specify an `encoder` function and optional dependencies.
3.  The `encoder` function takes a `&State<T>` and returns an event `Ev`.
4.  Whenever the `State<T>` changes (or any specified dependencies), the `encoder` runs, and the generated event `Ev` is emitted to the current `Context`.

```rust
use osui::prelude::*;
use std::sync::Arc;
use std::collections::HashMap;

// Event to signal a counter has changed
#[derive(Debug, Clone)]
pub struct CounterUpdatedEvent {
    pub id: usize,
    pub new_value: i32,
}

#[component]
fn ChildCounter(cx: &Arc<Context>, id: &usize, initial_value: &i32) -> View {
    let count = use_state(*initial_value);

    // Use `use_sync_effect` to emit `CounterUpdatedEvent` when `count` changes
    use_sync_effect(
        cx,
        &count, // Monitor this state
        move |state_ref: &State<i32>| {
            // Encoder: create an event from the state
            CounterUpdatedEvent {
                id: *id,
                new_value: state_ref.get_dl(),
            }
        },
        &[&count], // Effect runs when `count` changes
    );

    // Simulate incrementing the counter periodically
    use_effect(
        {
            let count = count.clone();
            move || {
                loop {
                    sleep(1000); // Increment every second
                    *count.get() += 1;
                }
            }
        },
        &[], // Run once on mount
    );

    rsx! {
        format!("Counter {}: {}", id, count.get_dl())
    }.view(&cx)
}

#[component]
fn ParentDashboard(cx: &Arc<Context>) -> View {
    let all_counts = use_state(HashMap::<usize, i32>::new());

    // Listen for `CounterUpdatedEvent` from children
    cx.on_event({
        let all_counts = all_counts.clone();
        move |_ctx, event: &CounterUpdatedEvent| {
            let mut counts_guard = all_counts.get();
            counts_guard.insert(event.id, event.new_value);
        }
    });

    rsx! {
        "Dashboard Overview:"
        @for (id, value) in all_counts.get_dl() {
            format!("  Counter {}: {}", id, value)
        }
        "---"
        ChildCounter { id: 1, initial_value: 0 }
        ChildCounter { id: 2, initial_value: 10 }
    }.view(&cx)
}

#[component]
fn App(cx: &Arc<Context>) -> View {
    rsx! {
        ParentDashboard {}
    }.view(&cx)
}

pub fn main() {
    let engine = Console::new();
    engine.run(App {}).expect("Failed to run app");
}
```

In this example:
*   `ChildCounter` uses `use_sync_effect` to emit a `CounterUpdatedEvent` every time its internal `count` state changes.
*   `ParentDashboard` listens for these `CounterUpdatedEvent`s (which bubble up from its children) using `cx.on_event` and updates its own `all_counts` `HashMap` state. This `HashMap` then drives the display in the dashboard.

## When to use `use_sync_state` and `use_sync_effect`:

*   **Inter-component Communication**: When components need to communicate beyond simple prop passing. Events are excellent for sibling-to-sibling or child-to-ancestor communication without prop drilling.
*   **Centralized State Management**: You can have a central "store" component that emits events, and other components `use_sync_state` to react to those events.
*   **External System Integration**: When your TUI needs to react to external system events (e.g., file changes, network updates) by mapping them to internal `State`.
*   **Decoupling**: They help decouple components, as they don't need direct references to each other, only awareness of event types.

By combining `use_state`, `use_effect`, `use_sync_state`, and `use_sync_effect` with OSUI's event system, you can build powerful and maintainable data flow architectures for your TUI applications.

**Next:** Learn how to arrange your components visually using OSUI's rendering primitives in [Building Complex Layouts](./06-building-complex-layouts.md).
