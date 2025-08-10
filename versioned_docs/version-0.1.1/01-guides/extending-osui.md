# Extending OSUI

OSUI's architecture is designed for extensibility, allowing you to add custom behaviors, event listeners, and rendering logic through the `Extension` trait. Extensions are global listeners and modifiers that hook into the OSUI application lifecycle.

## The `Extension` Trait

The core of OSUI's extensibility is the `Extension` trait:

```rust
pub trait Extension {
    fn init(&mut self, _ctx: &Context) {}
    fn event(&mut self, _ctx: &Context, _event: &dyn Event) {}
    fn on_close(&mut self) {}
    fn render(&mut self, _ctx: &Context, _scope: &mut RenderScope) {}
    fn render_widget(&mut self, _ctx: &Context, _scope: &mut RenderScope, _widget: &Arc<Widget>) {}
    fn after_render_widget(
        &mut self,
        _ctx: &Context,
        _scope: &mut RenderScope,
        _widget: &Arc<Widget>,
    ) {}
}
```

Each method provides a hook into a specific part of the OSUI application lifecycle:

*   **`init(&mut self, ctx: &Context)`**: Called once when the extension is registered with the `Screen` and before the main rendering loop starts. Use this for setup tasks, like spawning background threads or initializing global resources.
*   **`event(&mut self, ctx: &Context, event: &dyn Event)`**: Called whenever any `Event` is dispatched across the OSUI system. This is where extensions can listen for and react to keyboard input, custom events, or events from other extensions.
*   **`on_close(&mut self)`**: Called when `screen.close()` is invoked. Use this for cleanup, like disabling raw terminal mode or saving state.
*   **`render(&mut self, ctx: &Context, scope: &mut RenderScope)`**: Called *before* any individual widgets are rendered for a given frame. This `RenderScope` represents the *entire screen*. Useful for drawing global elements or backgrounds that span the whole terminal.
*   **`render_widget(&mut self, ctx: &Context, scope: &mut RenderScope, widget: &Arc<Widget>)`**: Called *before* a specific `widget`'s `Element::render` method is called. Extensions can inject drawing commands into the `scope` or modify the `widget` at this stage.
*   **`after_render_widget(&mut self, ctx: &Context, scope: &mut RenderScope, widget: &Arc<Widget>)`**: Called *after* a specific `widget`'s `Element::after_render` method and its drawing commands have been processed. Useful for post-processing, debugging, or recording widget positions (e.g., `RelativeFocusExtension`).

## The `Context` Object

The `Context` struct (`src/extensions/mod.rs`) is passed to most `Extension` hooks and provides access to core OSUI functionalities:

*   **`Context::new(screen: Arc<Screen>)`**: Creates a new `Context` linked to the main `Screen`.
*   **`context.event<E: Event + Clone + 'static>(&self, e: &E)`**: Dispatches an event `e` to all widgets (via their `event` method and `Handler<E>` components) and all registered extensions. This is how extensions can inject new events into the system.
*   **`context.get_widgets()`**: Provides a `MutexGuard` to the `Vec<Arc<Widget>>` currently managed by the `Screen`. This allows extensions to iterate over and potentially modify widgets.
*   **`context.iter_components<C, F>()` / `context.get_components<C>()`**: Helper methods to easily iterate over or collect specific components attached to widgets.

## Creating a Custom Extension

Let's create a simple extension that logs every keyboard key pressed to standard output.

```rust
// src/my_extension.rs
use std::io::{self, Write};
use osui::prelude::*; // Import OSUI prelude

// Define our custom extension struct
pub struct KeyLoggerExtension;

// Implement the Extension trait for our struct
impl Extension for KeyLoggerExtension {
    // Implement the event hook to listen for events
    fn event(&mut self, _ctx: &Context, event: &dyn Event) {
        // Attempt to downcast the generic `event` to a `crossterm::event::Event`.
        // The `InputExtension` dispatches these events.
        if let Some(crossterm_event) = event.get::<crossterm::event::Event>() {
            match crossterm_event {
                crossterm::event::Event::Key(key_event) => {
                    // Log the key event to stdout.
                    let _ = writeln!(io::stdout(), "Key Pressed: {:?}", key_event);
                    let _ = io::stdout().flush();
                }
                _ => {} // Ignore other crossterm events (mouse, resize)
            }
        }
    }
}
```

## Registering Your Extension

To make your extension active, you must register it with the `Screen` instance in your `main.rs` or application setup:

```rust
// src/main.rs
mod my_extension; // Declare your new module
mod demos; // Assuming you have a demos module as in guides

use osui::prelude::*;
use my_extension::KeyLoggerExtension; // Import your extension

fn main() -> std::io::Result<()> {
    let screen = Screen::new();

    // Register OSUI's built-in InputExtension (essential for keyboard input)
    screen.extension(InputExtension);
    // Register OSUI's built-in RelativeFocusExtension (for Tab/Shift+Tab navigation)
    screen.extension(RelativeFocusExtension::new());

    // Register your custom KeyLoggerExtension
    screen.extension(KeyLoggerExtension);

    demos::app(screen.clone()).draw(&screen);

    screen.run()
}
```

Now, when you run your application and press keys, you will see `Key Pressed: ...` messages in your terminal's output stream (though they might be mixed with the TUI output due to how `crossterm` operates).

## Built-in Extensions

OSUI includes several powerful built-in extensions that you've already encountered in examples:

*   **`InputExtension`**: Handles raw terminal input from `crossterm`.
*   **`RelativeFocusExtension`**: Manages focus between widgets based on their rendered positions, enabling navigation via keyboard (e.g., arrow keys). It introduces `Focused` and `AlwaysFocused` components.
*   **`IdExtension`**: Provides a way to assign unique IDs to widgets and retrieve them later by ID. It introduces the `Id` component.
*   **`TickExtension`**: Dispatches `TickEvent`s at a configurable interval, useful for animations or periodic updates.
*   **`VelocityExtension`**: Provides simple animation by automatically moving widgets with a `Velocity` component.

By implementing custom extensions, you can integrate external libraries, create complex behaviors not covered by simple components, or debug your UI in powerful ways.
