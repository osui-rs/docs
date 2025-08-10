# OSUI: A Rust Terminal User Interface Library

OSUI is a powerful and flexible library for building interactive and customizable terminal user interfaces (TUIs) in Rust. It provides a declarative component system, real-time keyboard input handling, and a JSX-like `rsx!` macro for defining UI elements, making TUI development intuitive and efficient.

## Key Features

*   **Declarative UI with `rsx!`**: Define your user interfaces using a familiar, expressive syntax similar to JSX, enhancing readability and maintainability.
*   **Component-Based Design**: Build complex UIs from reusable, self-contained widgets and components, promoting modularity and reusability.
*   **Reactive State Management**: Integrate dynamic behavior into your widgets with a built-in state management system that automatically triggers UI updates when data changes.
*   **Flexible Layout and Styling**: Control widget positioning, dimensions, padding, margins, and visual appearance with a comprehensive styling API.
*   **Extensible Architecture**: Customize and extend OSUI's core functionality through a robust extension system, allowing you to add custom behaviors, event handlers, and rendering logic.
*   **Real-time Interaction**: Seamlessly handle keyboard inputs to create responsive and interactive command-line applications.
*   **Virtual Screen Abstraction**: OSUI manages the underlying terminal drawing, providing a high-level abstraction for rendering your UI elements efficiently.

## Quick Example

Get started quickly with a simple "Hello, World!" example:

```rust
use osui::prelude::*;

fn main() -> std::io::Result<()> {
    // 1. Create a new Screen instance, which manages the TUI.
    let screen = Screen::new();

    // 2. Define your UI using the rsx! macro.
    //    "👋 Hello, World!" is a simple text element.
    rsx! {
        "👋 Hello, World!"
    }
    // 3. Draw the defined UI onto the screen.
    .draw(&screen);

    // 4. Run the main rendering loop. This will keep the TUI active
    //    and handle rendering and events until the application exits.
    screen.run()
}
```

This example initializes a `Screen`, uses the `rsx!` macro to define a basic text element, draws it to the screen, and then starts the rendering loop.

For more detailed information on installation and setting up your project, refer to the [Getting Started Guide](/docs/). For comprehensive API details, explore the [Reference section](/docs/reference/).
