# `osui::extensions::tick`

The `tick` module provides the `TickExtension` and `TickEvent`, enabling applications to receive periodic updates at a defined rate. This is useful for animations, game loops, or any time-based logic.

## `TickEvent` (Event)

```rust
event!(TickEvent(pub u32));
```
A custom event type dispatched by the `TickExtension`. It contains a `u32` value representing the current tick count since the extension started.

**Fields:**
*   `0`: `u32` - The current tick count.

**Example:**
```rust
use osui::prelude::*;
// Listen for TickEvent
rsx! {
    @Handler::new(|_, e: &TickEvent| {
        println!("Tick: {}", e.0);
    });
    Div { "Listening for ticks" }
}
```

## `TickExtension`

Dispatches `TickEvent`s at a configurable interval.

```rust
pub struct TickExtension(pub u16);
```

**Fields:**
*   `0`: `u16` - The desired ticks per second (Hz). For example, `TickExtension(30)` would dispatch a `TickEvent` approximately every 33 milliseconds (1000ms / 30Hz).

### `Extension` Trait Implementation

#### `init(&mut self, ctx: &Context)`
Called when the `TickExtension` is registered with the `Screen`.
1.  Calculates the `rate_dur` (duration per tick) in milliseconds: `1000 / self.0 as u64`.
2.  Spawns a new thread.
3.  In this new thread, it enters an infinite loop:
    *   It dispatches a `TickEvent` with the current tick count using `ctx.event(&TickEvent(tick))`.
    *   The `tick` counter is incremented.
    *   The thread sleeps for the calculated `rate_dur`.

**Why a separate thread?**
Similar to `InputExtension`, `TickExtension` spawns a separate thread because `std::thread::sleep` is a blocking operation. This ensures that the main rendering loop continues to run smoothly, independent of the tick rate.

## Usage

To use `TickExtension`, you simply need to create an instance with your desired tick rate and register it with the `Screen`. Then, your widgets or other extensions can listen for `TickEvent`s using `Handler<TickEvent>`.

**Example:**
```rust
use osui::prelude::*;
use std::{thread, time::Duration};

fn main() -> std::io::Result<()> {
    let screen = Screen::new();

    // Register essential extensions
    screen.extension(InputExtension);
    screen.extension(RelativeFocusExtension::new());

    // Register TickExtension for 30 ticks per second
    screen.extension(TickExtension(30));

    // Create a state to display the tick count
    let tick_count_state = use_state(0u32);

    rsx! {
        // Attach a Handler to update the state on each TickEvent
        @Handler::new({
            let state_clone = tick_count_state.clone();
            move |_, e: &TickEvent| {
                state_clone.set(e.0); // Update the state with the current tick count
            }
        });
        // Display the reactive tick count
        %tick_count_state
        Div {
            format!("Current Tick: {}", tick_count_state.get())
        }
    }
    .draw(&screen);

    screen.run()
}
```
This example demonstrates how `TickExtension` provides a consistent timing mechanism, allowing you to build dynamic and animated UIs.
