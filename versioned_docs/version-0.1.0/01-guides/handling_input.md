# Handling Input

Interactive terminal applications rely heavily on input handling. OSUI provides a flexible event system to capture and respond to user input, primarily keyboard events. This guide explains how to integrate and use OSUI's input capabilities.

## The `InputExtension`

The core of OSUI's input system is the `InputExtension`. This extension is responsible for:

1.  Enabling `crossterm`'s raw mode, which allows for detailed, non-buffered input events.
2.  Spawning a dedicated thread to continuously read terminal events.
3.  Dispatching these events to all active widgets on the `Screen`.

### Registering the `InputExtension`

To start receiving input, you must register the `InputExtension` with your `Screen` instance:

```rust
use osui::prelude::*;

fn main() -> std::io::Result<()> {
    let screen = Screen::new();
    // Register the InputExtension once at startup
    screen.extension(InputExtension);

    // ... your rsx! or draw calls ...

    screen.run()
}
```

Once registered, the extension will manage raw mode and event polling. When your application closes (e.g., via `screen.close()`), the `InputExtension`'s `on_close` method will automatically disable raw mode, returning the terminal to its normal state.

## The `Event` Trait and `Handler` Component

OSUI uses a generic `Event` trait and a `Handler` component to enable widgets to subscribe to and process events.

*   **`Event` Trait**: A marker trait that identifies types that can be dispatched as events. It requires `Send + Sync` and `as_any()` for type erasure. `crossterm::event::Event` already implements this within OSUI.
*   **`Handler<E>` Component**: A wrapper component that holds a closure (`FnMut(&Arc<Widget>, &E)`) which will be called when an event of type `E` is dispatched to the widget it's attached to.

### Attaching an Event Handler

You attach `Handler` components to widgets using the `@` syntax in `rsx!` or by calling `widget.component(Handler::new(...))` directly.

The `Handler`'s closure receives two arguments:
1.  An `Arc<Widget>` representing the widget the handler is attached to. This allows the handler to interact with its own widget, e.g., by getting or setting components on it.
2.  A reference to the event (`&E`).

#### Example: Handling Keyboard Input

To handle `crossterm::event::Event` (which includes `KeyEvent`, `MouseEvent`, `ResizeEvent`, etc.), you'll typically downcast the incoming event to a `KeyEvent`.

```rust
use osui::prelude::*;
use crossterm::event::{KeyCode, KeyEvent, Event as CrosstermEvent}; // Alias to avoid conflict with osui::event!

fn main() -> std::io::Result<()> {
    let screen = Screen::new();
    screen.extension(InputExtension);

    // This widget will capture all keyboard events.
    // We attach the Handler directly to the root widget drawn on the screen.
    rsx! {
        @Handler::new({
            let screen = screen.clone(); // Clone Arc for the closure
            move |current_widget, event: &CrosstermEvent| {
                // Check if the event is a KeyEvent
                if let CrosstermEvent::Key(key_event) = event {
                    match key_event.code {
                        KeyCode::Char('q') => {
                            // Close the screen if 'q' is pressed
                            println!("Quitting application...");
                            screen.close();
                        }
                        KeyCode::Enter => {
                            // Example: Increment a counter on Enter
                            if let Some(mut my_state_comp) = current_widget.get::<State<i32>>() {
                                **my_state_comp.get_mut() += 1;
                                println!("Enter pressed! Count: {}", my_state_comp.get_dl());
                            }
                        }
                        _ => {
                            // Handle other keys or print them for debugging
                            // println!("Key pressed: {:?}", key_event.code);
                        }
                    }
                }
            }
        });
        Div {
            "Press 'q' to quit, 'Enter' to increment a hidden counter (check console)."
        }
    }.draw(&screen);

    screen.run()
}
```

In the example above, the `Handler` is attached to the root `Div`. Because the `InputExtension` dispatches events to *all* widgets managed by the screen, this root widget will receive every `crossterm::event::Event`.

### Element-Specific Event Handling

Some elements, like `Input` and `Paginator`, implement the `Element::event` method internally to handle specific events relevant to their functionality.

*   **`Input` Element**: Manages text input, cursor movement (left/right), backspace, and delete based on `KeyEvent`s.
*   **`Paginator` Element**: Switches pages on `KeyCode::Tab` and `KeyCode::BackTab` (`Shift+Tab`).

When you use these elements, their internal `event` method is automatically called by the `Screen`'s rendering loop. You can still attach your own `Handler` components to these elements for additional, custom event logic that doesn't interfere with their built-in behavior.

```rust
use osui::prelude::*;

rsx! {
    Paginator {
        // This handler will be called *in addition* to Paginator's default tab handling.
        @Handler::new(|_, e: &crossterm::event::Event| {
            if let crossterm::event::Event::Key(KeyEvent { code: KeyCode::Char('p'), .. }) = e {
                // Do something when 'p' is pressed on the Paginator
                println!("Paginator received 'p' key!");
            }
        });
        Div { "Page 1" }
        Div { "Page 2" }
    }
}
```

## Custom Events

Beyond `crossterm` events, you can define and dispatch your own custom event types using the `event!` macro. This is useful for communication between different parts of your application or custom extensions.

See the [Advanced: Custom Events](../advanced/custom_events.md) guide for details.

## Summary

By understanding how to register the `InputExtension` and attach `Handler` components to your widgets, you gain full control over user interaction in your OSUI applications. This robust event system allows for building highly responsive and interactive terminal UIs.



