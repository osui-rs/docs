---
slug: /
---

# Getting Started with OSUI

This guide will walk you through setting up your first OSUI project and running a basic application.

## Prerequisites

Before you begin, ensure you have:

*   **Rust and Cargo**: If you don't have Rust installed, you can get it from [rustup.rs](https://rustup.rs/). OSUI requires a recent stable version of Rust.

## 1. Create a New Cargo Project

First, create a new Rust binary project:

```bash
cargo new my_osui_app --bin
cd my_osui_app
```

## 2. Add OSUI to Your Dependencies

Open your `Cargo.toml` file and add `osui` to your `[dependencies]` section. We also recommend adding `crossterm` if you plan to handle raw terminal events directly, though OSUI uses it internally.

```toml
# Cargo.toml
[package]
name = "my_osui_app"
version = "0.1.0"
edition = "2021"

[dependencies]
osui = "0.1" # Use the latest version from crates.io
crossterm = "0.28" # Required for input handling, OSUI uses it internally
figlet-rs = "0.1" # Used by the Heading element, can be excluded if not needed
```

> **Note**: Always check [crates.io/crates/osui](https://crates.io/crates/osui) for the latest available version.

## 3. Write Your First OSUI Application

Now, open `src/main.rs` and replace its contents with the following code. This example sets up a basic screen, adds an input handler (using an `Extension`), and displays a simple "Hello, OSUI!" message. It also includes a paginator with multiple "pages" to demonstrate basic navigation.

```rust
// src/main.rs
use osui::prelude::*;

fn main() -> std::io::Result<()> {
    // Create the main Screen instance.
    // The Screen manages the rendering loop, widgets, and extensions.
    let screen = Screen::new();

    // Register the InputExtension.
    // This extension enables raw mode and dispatches keyboard events to widgets.
    // Without it, keyboard input (like 'q' to quit or Tab for paginator) won't work.
    screen.extension(InputExtension);

    // Create a dynamic state variable for a counter.
    // This demonstrates OSUI's reactivity.
    let count = use_state(0);

    // Spawn a background thread to increment the counter every second.
    // This will cause the associated widget to re-render automatically.
    std::thread::spawn({
        let count = count.clone(); // Clone the Arc for the thread
        move || loop {
            // Dereference the MutexGuard and modify the inner value.
            // This also marks the state as 'changed'.
            **count.get() += 1;
            std::thread::sleep(std::time::Duration::from_secs(1));
        }
    });

    // Define the UI using the `rsx!` macro.
    // This is the declarative way to build your UI tree.
    rsx! {
        // Attach a Handler component to the root widget for key events.
        // This handler closes the screen when 'q' is pressed.
        @Handler::new({
            let screen = screen.clone(); // Clone the Arc for the closure
            move |_, e: &crossterm::event::Event| {
                if let crossterm::event::Event::Key(crossterm::event::KeyEvent { code, .. }) = e {
                    if *code == crossterm::event::KeyCode::Char('q') {
                        screen.close(); // Close the screen, exiting the main loop
                    }
                }
            }});
        // Paginator is an element that displays one child at a time.
        // Press Tab/Shift+Tab to cycle through its children.
        Paginator {
            // First page: A FlexRow container with a heading and text.
            FlexRow {
                Heading, smooth: false, { "OSUI" } // A large ASCII art heading
                "Welcome to the OSUI demo!"
                "Press tab to switch to the next page or shift+tab to the previous page"
            }

            // Second page: A FlexCol container with two Divs, demonstrating styling.
            FlexCol, gap: 3, {
                // Attach Transform and Style components directly to the Div.
                @Transform::new().padding(2, 2);
                @Style { foreground: None, background: Background::RoundedOutline(0x00ff00) };
                Div {
                    "This is text inside a div"
                }

                @Transform::new().padding(2, 2);
                @Style { foreground: None, background: Background::Outline(0x00ff00) };
                Div {
                    "This is text inside a div with square outlines"
                }
            }

            // Third page: Another FlexCol with a reactive counter and an Input element.
            FlexCol, gap: 2, {
                @transform!{ y: Center }; // Custom macro for convenient Transform creation
                static Div { // `static` keyword means this Div itself is static, but its children can be dynamic.
                    %count // The '%' symbol indicates a dependency on the 'count' state.
                    "This will increment every second: {count}" // 'count' will be automatically updated.
                }

                // An interactive Input field.
                @Transform::new().padding(1, 1).dimensions(40, 1);
                @Style { foreground: Some(0xffffff), background: Background::RoundedOutline(0xff0000) };
                Input { }
            }
        }
    }
    // Draw the entire RSX tree onto the screen.
    .draw(&screen);

    // Start the main event loop and rendering.
    screen.run()
}
```

## 4. Run Your Application

From your project's root directory, run:

```bash
cargo run
```

You should see a terminal application launch, displaying the "OSUI" heading and welcome message.

*   Press `Tab` to navigate through the pages.
*   Press `Shift+Tab` to go back.
*   Observe the counter incrementing on the third page.
*   Interact with the input field on the third page.
*   Press `q` to quit the application.

Congratulations! You've successfully set up and run your first OSUI application.


