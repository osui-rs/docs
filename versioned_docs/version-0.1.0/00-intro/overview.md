# OSUI: A Rust Terminal User Interface Library

OSUI (OSmium User Interface) is a powerful and flexible library for building interactive and customizable Terminal User Interfaces (TUIs) in Rust. It provides a declarative component system inspired by modern web frameworks, real-time keyboard input handling, and a virtual screen abstraction to simplify TUI development.

## Key Features

*   **Declarative UI with `rsx!`**: Define your UI structure using an intuitive, JSX-like macro that allows for nesting, component composition, and reactive updates.
*   **Component-Based Design**: Build complex UIs from reusable `Element`s and extend their functionality with `Component`s, promoting modularity and maintainability.
*   **Reactive State Management**: Integrate dynamic behavior effortlessly with the `State` system, automatically re-rendering parts of your UI when underlying data changes.
*   **Flexible Layout System**: Control element positioning and sizing with `Transform`, `Position`, and `Dimension` properties, supporting both fixed and content-based layouts.
*   **Extensible Architecture**: Customize or extend OSUI's core behavior by implementing the `Extension` trait, allowing you to add global event handling, custom rendering logic, and more.
*   **Virtual Screen Abstraction**: OSUI manages the complexities of terminal rendering, providing a consistent API for drawing text, shapes, and applying styles across different terminal environments.
*   **Real-time Input Handling**: Built-in support for capturing and dispatching keyboard events, enabling interactive applications.

## Quick Example

The following example demonstrates a minimal OSUI application that displays "Hello, World!" on the terminal.

```rust
use osui::prelude::*;

fn main() -> std::io::Result<()> {
    // 1. Create a new Screen instance, which manages the TUI environment.
    let screen = Screen::new();

    // 2. Define your UI using the `rsx!` macro.
    //    Here, a simple string "Hello, World!" becomes a renderable element.
    rsx! {
        "👋 Hello, World!"
    }
    // 3. Draw the constructed UI tree onto the screen.
    .draw(&screen);

    // 4. Run the main rendering loop. This will block until the application is closed.
    screen.run()
}
```

This simple application initializes the `Screen`, defines a basic text element using `rsx!`, draws it, and then enters the main rendering loop.

## Philosophy

OSUI aims to provide a high-level, ergonomic API for TUI development, abstracting away the low-level details of terminal interaction. By embracing a component-based and reactive paradigm, it encourages developers to build robust and interactive command-line applications with a familiar development experience, similar to modern graphical UI frameworks.

For more detailed guides and API references, explore the rest of the documentation.


