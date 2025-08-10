---
slug: /
---

# Getting Started with OSUI

This guide will walk you through setting up your Rust project to use OSUI and creating your first interactive terminal application.

## 1. Project Setup

First, create a new Rust project (if you haven't already):

```bash
cargo new my-osui-app
cd my-osui-app
```

## 2. Add OSUI to Your `Cargo.toml`

Open your `Cargo.toml` file and add `osui` to your `[dependencies]` section. You can also specify a particular version or use `*` for the latest compatible version.

```toml
# Cargo.toml
[package]
name = "my-osui-app"
version = "0.1.0"
edition = "2021"

[dependencies]
osui = "0.1.1" # Use the latest version available on crates.io
crossterm = "0.28.1" # OSUI internally uses crossterm for terminal interactions
figlet-rs = "0.1.5" # Optional: for Heading element (if you need it)
```

The `crossterm` and `figlet-rs` dependencies are automatically included by OSUI, but explicitly listing them doesn't hurt. OSUI uses `crossterm` for low-level terminal control and `figlet-rs` for the `Heading` element, which can render ASCII art text.

## 3. Basic OSUI Application

Now, let's create a minimal OSUI application. Open `src/main.rs` and replace its contents with the following:

```rust
use osui::prelude::*; // Import all necessary OSUI items

fn main() -> std::io::Result<()> {
    // Initialize the main screen abstraction.
    // The Screen manages all widgets and extensions.
    let screen = Screen::new();

    // Register essential extensions:
    // InputExtension: Handles keyboard input and dispatches events.
    screen.extension(InputExtension);
    // RelativeFocusExtension: Manages focus between widgets based on relative position,
    // enabling navigation with arrow keys (e.g., in Flex layouts).
    screen.extension(RelativeFocusExtension::new());

    // Define your UI declaratively using the rsx! macro.
    // This example creates a simple text string.
    rsx! {
        "Hello, OSUI!"
    }
    // Draw the defined UI tree onto the screen.
    .draw(&screen);

    // Start the main event loop. This blocks until the application is closed.
    // It handles rendering, event processing, and extension updates.
    screen.run()
}
```

## 4. Run Your Application

Save the file and run your application from the terminal:

```bash
cargo run
```

You should see "Hello, OSUI!" displayed in your terminal. You can press `Ctrl+C` or `Esc` (if you add an event handler for `Esc` like in the [Demo Application Guide](/docs/guides/building-a-demo-app)) to exit the application.

## Next Steps

*   **[Concepts: Widget Model](/docs/concepts/widget-model)**: Understand the core building blocks of OSUI: Elements, Components, and Widgets.
*   **[Guides: Layout and Styling](/docs/guides/layout-and-styling)**: Learn how to position and style your UI elements.
*   **[Guides: Common Elements](/docs/guides/common-elements)**: Explore the built-in UI elements provided by OSUI like Divs, Flex containers, and Input fields.
*   **[Guides: State and Reactivity](/docs/guides/state-and-reactivity)**: Discover how to make your UI dynamic and responsive to data changes.
