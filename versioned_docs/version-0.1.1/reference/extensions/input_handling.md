# `osui::extensions::input_handling`

The `input_handling` module provides the `InputExtension`, which integrates `crossterm` for low-level terminal input and dispatches these events throughout the OSUI system. This is a fundamental extension required for any interactive OSUI application.

## `InputExtension`

Manages raw terminal input and dispatches `crossterm` events.

```rust
pub struct InputExtension;
```

### `Extension` Trait Implementation

#### `init(&mut self, ctx: &Context)`
Called when the extension is initialized.
1.  Enables `crossterm`'s raw mode (`crossterm::terminal::enable_raw_mode().unwrap()`). Raw mode allows direct, unbuffered input capture, essential for TUI applications.
2.  Spawns a new thread. This thread continuously listens for `crossterm::event::read()` events.
3.  Whenever an event is read successfully, it dispatches the event using `ctx.event(&e)`. This makes the `crossterm::event::Event` available to all widgets (via `Element::event` or `Handler<crossterm::event::Event>` components) and other extensions.

**Why a separate thread?**
Reading input from the terminal (`crossterm::event::read()`) is a blocking operation. Spawning it in a separate thread prevents the main rendering loop from freezing while waiting for user input, ensuring the UI remains responsive.

#### `on_close(&mut self)`
Called when `Screen::close()` is invoked.
1.  Disables `crossterm`'s raw mode (`crossterm::terminal::disable_raw_mode().unwrap()`). This restores the terminal to its normal, buffered input state, which is crucial for a clean exit.

### `Event` Trait Implementation

The `crossterm::event::Event` enum itself implements OSUI's `Event` trait, allowing `InputExtension` to dispatch it directly.

```rust
impl crate::extensions::Event for crossterm::event::Event {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }
}
```
This means you can easily listen for `crossterm` events in your widgets or other extensions using `Handler<crossterm::event::Event>` or by downcasting the `dyn Event` in an `Extension::event` method.

## Usage

You must register the `InputExtension` with your `Screen` for keyboard and mouse input to work in your OSUI application.

**Example:**
```rust
use osui::prelude::*;

fn main() -> std::io::Result<()> {
    let screen = Screen::new();
    
    // Register the InputExtension
    screen.extension(InputExtension);
    
    // Other extensions and UI setup
    screen.extension(RelativeFocusExtension::new()); // Often used with InputExtension for navigation

    rsx! {
        // A global event handler to exit on Escape key, relying on InputExtension
        @Handler::new({
            let screen = screen.clone();
            move |_, e: &crossterm::event::Event| {
                if let crossterm::event::Event::Key(crossterm::event::KeyEvent { code: crossterm::event::KeyCode::Esc, .. }) = e {
                    screen.close();
                }
            }
        });
        // An Input widget that will receive key events from InputExtension
        Input { }
    }.draw(&screen);

    screen.run()
}
```
`InputExtension` is a foundational component for building interactive terminal user interfaces with OSUI.
