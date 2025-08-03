# Using Extensions

OSUI features an extensible architecture that allows you to add global behaviors, custom rendering logic, or integrate third-party functionalities by implementing the `Extension` trait. This guide explains what extensions are, how to implement them, and how to register them with your `Screen`.

## What are Extensions?

Extensions are separate modules or structs that provide lifecycle hooks for the `Screen` and can interact with widgets at a global level. They are ideal for:

*   **Global Event Handling**: Such as processing keyboard or mouse input across all widgets (e.g., `InputExtension`).
*   **Periodic Tasks**: Running logic on a fixed interval (e.g., `TickExtension`, `VelocityExtension`).
*   **Custom Rendering Overrides**: Injecting logic before or after a widget's rendering.
*   **Managing Global State**: Maintaining state accessible to multiple widgets or other extensions.
*   **Debugging or Logging**: Observing the UI tree or rendering process.

## The `Extension` Trait

The `Extension` trait defines the interface for all extensions:

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

All methods have default empty implementations, meaning you only need to implement the hooks relevant to your extension's functionality.

## Implementing a Custom Extension

Let's create a simple extension that logs when the screen initializes and when a widget is rendered.

```rust
use osui::prelude::*;
use std::sync::Arc;

pub struct MyLoggerExtension;

impl Extension for MyLoggerExtension {
    fn init(&mut self, screen: Arc<Screen>) {
        println!("MyLoggerExtension: Screen initialized!");
        // You could store the screen Arc if needed for later interaction
        // self.screen = Some(screen);
    }

    fn on_close(&mut self, screen: Arc<Screen>) {
        println!("MyLoggerExtension: Screen closing!");
    }

    fn render_widget(&mut self, scope: &mut RenderScope, widget: &Arc<Widget>) {
        // This hook is called for *every* widget about to be rendered.
        // It's useful for debugging or applying global styles/transforms.
        // Note: The widget here is the Arc<Widget>, not its inner Element.
        // You can use `widget.get_elem()` to access the Element.

        // For simplicity, we'll just log the widget's address and a component if it has one.
        if let Some(t) = widget.get::<Transform>() {
            println!(
                "MyLoggerExtension: Rendering widget at {:p} with transform: x={:?} y={:?}",
                Arc::as_ptr(widget), t.x, t.y
            );
        } else {
            println!("MyLoggerExtension: Rendering widget at {:p}", Arc::as_ptr(widget));
        }
    }
}
```

## Registering an Extension

To activate your extension, you must register it with the `Screen` instance using the `screen.extension()` method. This is typically done at the beginning of your `main` function.

```rust
use osui::prelude::*;
use std::sync::Arc; // Needed for Arc<Screen> in the main function

// ... (MyLoggerExtension definition from above) ...

fn main() -> std::io::Result<()> {
    let screen = Screen::new();

    // Register your custom extension
    screen.extension(MyLoggerExtension);

    // Register other built-in extensions if needed
    screen.extension(InputExtension);
    screen.extension(TickExtension(10)); // Example: Tick every 10ms

    rsx! {
        Div { "Hello, OSUI!" }
    }.draw(&screen);

    screen.run()
}
```

Once registered, the `Screen` will call the appropriate lifecycle methods of your extension at the right times during its operation.

## Built-in Extensions

OSUI comes with several useful built-in extensions:

*   [`InputExtension`](/docs/reference/extensions_api.md#inputextension): Handles keyboard input and dispatches `crossterm::event::Event`s. **Crucial for interactive applications.**
*   [`TickExtension`](/docs/reference/extensions_api.md#tickextension): Dispatches `TickEvent`s at a specified rate, useful for animations or periodic updates.
*   [`VelocityExtension`](/docs/reference/extensions_api.md#velocityextension): Automatically updates the `Transform` of widgets that have a `Velocity` component, causing them to move.
*   [`IdExtension`](/docs/reference/extensions_api.md#idextension): Provides a way to retrieve specific widgets by a unique `Id` component. (Note: The current `IdExtension` implementation only *stores* a screen reference but doesn't actively do anything unless you manually call its `get_element` method.)

You use these built-in extensions by simply calling `screen.extension(...)` with an instance of them, just like `MyLoggerExtension`.

## Interaction between Extensions and Widgets

Extensions can interact with widgets in various ways:

*   **Reading Components**: Within `render_widget` or other hooks, an extension can use `widget.get::<C>()` to read components (like `Transform` or `Style`) attached to a widget, influencing how it renders or behaves.
*   **Setting Components**: An extension can use `widget.set_component(c)` to dynamically add or modify components on a widget. For example, `VelocityExtension` modifies `Transform` components.
*   **Dispatching Events**: Extensions can dispatch custom events to widgets using `widget.event(&my_custom_event)`.
*   **Modifying RenderScope**: In `render_widget`, an extension can directly modify the `RenderScope` (e.g., apply a global offset or filter) before the widget's `render` method is called.

By leveraging extensions, you can keep your core UI logic clean and declarative, while offloading cross-cutting concerns or global features into reusable and modular units.



