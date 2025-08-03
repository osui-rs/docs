# Extension System

OSUI's extension system is a powerful and flexible mechanism for adding global, cross-cutting concerns to your application without cluttering individual widget implementations. It allows you to inject custom logic into the `Screen`'s lifecycle and rendering pipeline.

## Why an Extension System?

In UI development, certain functionalities are not specific to a single widget but affect the entire application or many widgets. Examples include:

*   **Global Input Handling**: Capturing keyboard events and routing them to relevant widgets.
*   **Periodic Updates**: Driving animations or time-based logic across the UI.
*   **Custom Debugging/Logging**: Observing the rendering process or widget tree.
*   **Theming/Styling Overrides**: Applying consistent visual modifications dynamically.
*   **Data Persistence/Loading**: Interacting with external systems at application startup/shutdown.

Instead of scattering this logic throughout your `main` function or within every widget, the extension system provides a centralized, modular approach.

## The `Extension` Trait

The core of the system is the `Extension` trait, which defines a set of lifecycle hooks that the `Screen` will call at specific points.

```rust
pub trait Extension {
    /// Called once when the screen starts running.
    fn init(&mut self, _screen: Arc<Screen>) {}

    /// Called when the screen is being closed.
    fn on_close(&mut self, _screen: Arc<Screen>) {}

    /// Called for each widget before its `render` method is invoked.
    fn render_widget(&mut self, _scope: &mut RenderScope, _widget: &Arc<Widget>) {}
}
```

*   **`init(&mut self, screen: Arc<Screen>)`**:
    *   **When**: Called exactly once when `Screen::run()` is invoked, before the main rendering loop begins.
    *   **Purpose**: Ideal for one-time setup tasks like spawning background threads (e.g., for input polling or tick generation), initializing external resources, or setting up global state the extension will manage. The `Arc<Screen>` allows the extension to interact back with the screen (e.g., closing it, adding new widgets).
*   **`on_close(&mut self, screen: Arc<Screen>)`**:
    *   **When**: Called exactly once when `Screen::close()` is invoked and the main rendering loop has exited.
    *   **Purpose**: Cleanup. Restore terminal settings (like `InputExtension` disabling raw mode), release resources, save data, or perform final logging.
*   **`render_widget(&mut self, scope: &mut RenderScope, widget: &Arc<Widget>)`**:
    *   **When**: Called for every top-level `Arc<Widget>` in the `Screen`'s `widgets` list, during each frame's `Screen::render()` cycle. It's called *before* the widget's `Element::render` method.
    *   **Purpose**: This is a powerful hook for inspecting or modifying the rendering context (`RenderScope`) or the `Widget` itself.
        *   **Inspection**: You can use `widget.get::<C>()` to check a widget's components (e.g., its `Transform` or `Style`).
        *   **Modification**: You can use `widget.set_component(c)` to dynamically add or change components (e.g., `VelocityExtension` modifies `Transform`). You can also directly modify the `RenderScope` (e.g., adding an offset, changing its style, or drawing overlay content).
        *   **Filtering/Debugging**: Skip rendering certain widgets based on custom logic, or log their state.

## How Extensions are Integrated

1.  **Instantiation**: You create an instance of your struct that implements `Extension`.
2.  **Registration**: You register the instance with your `Screen` using `screen.extension(my_extension_instance)`. This typically happens at the start of your `main` function.
    *   The `Screen` stores `Arc<Mutex<Box<dyn Extension>>>` to allow multiple extensions, shared access, and dynamic dispatch.
3.  **Execution**: The `Screen`'s main `run()` and `render()` methods are hardwired to call the respective `Extension` trait methods at the appropriate times.

## Example: Custom Logging Extension

```rust
use osui::prelude::*;
use std::sync::Arc;

pub struct CustomLoggingExtension;

impl Extension for CustomLoggingExtension {
    fn init(&mut self, screen: Arc<Screen>) {
        println!("[LOG] CustomLoggingExtension initialized for screen {:p}", Arc::as_ptr(&screen));
    }

    fn on_close(&mut self, screen: Arc<Screen>) {
        println!("[LOG] CustomLoggingExtension closing for screen {:p}", Arc::as_ptr(&screen));
    }

    fn render_widget(&mut self, scope: &mut RenderScope, widget: &Arc<Widget>) {
        // Log the coordinates and size of every widget about to be rendered
        let raw_transform = scope.get_transform(); // Get the already resolved raw transform
        println!(
            "[LOG] Rendering widget {:p} at ({}, {}) size ({}, {})",
            Arc::as_ptr(widget),
            raw_transform.x, raw_transform.y,
            raw_transform.width, raw_transform.height
        );

        // Example: Apply a global offset for debugging
        // let mut current_transform = scope.get_transform_mut();
        // current_transform.x += 1;
        // current_transform.y += 1;
    }
}

fn main() -> std::io::Result<()> {
    let screen = Screen::new();
    screen.extension(InputExtension); // Always useful for interaction
    screen.extension(CustomLoggingExtension); // Register our custom extension

    rsx! {
        Div { "Hello" }
        @Transform::new().x(10).y(5);
        Div { "World" }
    }.draw(&screen);

    screen.run()
}
```

When you run this, you'll see console output from `CustomLoggingExtension` as the screen initializes, renders each widget, and closes.

## Benefits of the Extension System

*   **Modularity**: Keeps distinct functionalities separate, improving code organization.
*   **Reusability**: Extensions can be easily reused across different OSUI applications.
*   **Flexibility**: Allows injection of custom behavior without modifying OSUI's core library code.
*   **Separation of Concerns**: UI rendering logic is in `Element`s, state is in `State`s, and cross-cutting behaviors are in `Extension`s.

By leveraging the extension system, developers can build highly customized and feature-rich terminal applications with a clean and maintainable codebase.



