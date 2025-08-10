# Getting Started with OSUI Example

This guide expands on the basic "Hello, OSUI!" example to demonstrate a slightly more interactive application with keyboard input and reactive state.

## 1. Project Setup (Review)

Ensure you have a new Rust project set up and `osui` added to your `Cargo.toml`. Refer to the [Getting Started](../intro/getting-started.md) guide if you haven't done this already.

## 2. The `main.rs` File

We'll use a `main.rs` file that directly calls into a `demos::app` function, similar to how the OSUI examples are structured. This separates the application logic from the basic setup.

```rust
// src/main.rs
mod demos; // Declare the demos module

use osui::prelude::*;

fn main() -> std::io::Result<()> {
    let screen = Screen::new();

    // Register extensions for input handling and relative focus navigation.
    // InputExtension is crucial for keyboard events.
    screen.extension(InputExtension);
    // RelativeFocusExtension enables navigation between widgets using arrow keys.
    screen.extension(RelativeFocusExtension::new());

    // Call the `app` function from the `demos` module,
    // which defines our UI and draws it to the screen.
    demos::app(screen.clone()).draw(&screen);

    // Run the main event loop. This will block until the application closes.
    screen.run()
}
```

## 3. The `demos` Module (`src/demos/mod.rs`)

This is where the main application logic and UI definition reside. We'll create a simple counter that increments every second and allows the user to exit using the `Esc` key.

```rust
// src/demos/mod.rs
use std::sync::Arc;
use osui::prelude::*;

// This function takes an Arc<Screen> to interact with the main TUI context.
pub fn app(screen: Arc<Screen>) -> Rsx {
    // 1. Create a reactive state variable for our counter.
    let count = use_state(0);

    // 2. Spawn a background thread to update the counter every second.
    //    We clone `count` (which is an Arc internally) to move it into the thread.
    std::thread::spawn({
        let count = count.clone();
        move || loop {
            // Acquire a mutable lock on the state and increment the value.
            // DerefMut implementation on Inner<T> automatically marks the state as "changed".
            **count.get() += 1;
            std::thread::sleep(std::time::Duration::from_secs(1));
        }
    });

    // 3. Define the UI using the rsx! macro.
    rsx! {
        // @Handler::new: Attaches an event handler component to the root widget.
        // This handler listens for `crossterm::event::Event`s.
        @Handler::new({
            let screen = screen.clone(); // Clone screen to move into the closure
            move |_, e: &crossterm::event::Event| {
                // Check if the event is a Key event and if the key is 'Esc'.
                if let crossterm::event::Event::Key(crossterm::event::KeyEvent { code, .. }) = e {
                    if *code == crossterm::event::KeyCode::Esc {
                        // If Esc is pressed, close the screen, terminating the application.
                        screen.close();
                    }
                }
            }});
        // @AlwaysFocused: A component from RelativeFocusExtension that keeps this widget focused
        // even when other widgets are navigated to. Useful for root containers or global handlers.
        @AlwaysFocused;
        Paginator { // Paginator is a simple page management element
            // FlexRow organizes children horizontally
            FlexRow {
                // Heading element for large text (uses figlet-rs)
                Heading, smooth: false, { "OSUI" } // Sets `smooth` property on Heading
                "Welcome to the OSUI demo!"
                "Press tab to switch to the next page or shift+tab to the previous page"
            }

            // FlexCol organizes children vertically
            FlexCol, gap: 3, { // Sets `gap` property on FlexCol
                // @Transform: Component to define layout (position, dimensions, padding)
                @Transform::new().padding(2, 2);
                // @Style: Component to define visual style (background, foreground)
                @Style { foreground: None, background: Background::RoundedOutline(0x00ff00) };
                Div { // Div is a basic container element
                    "This is text inside a div"
                }

                @Transform::new().padding(2, 2);
                @Style { foreground: None, background: Background::Outline(0x00ff00) };
                Div {
                    "This is text inside a div with square outlines"
                }
            }

            FlexRow, gap: 1, {
                // %count: Declares this widget depends on the `count` state variable.
                // When `count` changes, this widget (and its children) will re-render.
                %count
                // String interpolation directly from state.
                "This will increment every second: {count}"

                FlexRow { // Nested FlexRow for username input
                    "Username"
                    @Transform::new().padding(1, 1).dimensions(40, 1);
                    @Style { foreground: Some(0xffffff), background: Background::RoundedOutline(0xff0000) };
                    @Focused; // This component marks the Input as initially focused.
                    Input { } // Input element allows text input
                }

                @Transform::new().margin(0, 1);
                FlexRow { // Nested FlexRow for password input
                    "Password"
                    @Transform::new().padding(1, 1).dimensions(40, 1);
                    @Style { foreground: Some(0xffffff), background: Background::RoundedOutline(0xffff00) };
                    Input { }
                }
            }
        }
    }
}
```

## How It Works

1.  **`Screen` Initialization**: The `Screen` is the central orchestrator. It holds your UI widgets and extensions.
2.  **Extensions**:
    *   `InputExtension`: Crucial for any interactive app. It enables raw mode for terminal input and continuously reads keyboard events, dispatching them to the `Screen`'s event bus.
    *   `RelativeFocusExtension`: Manages which widget is "focused," allowing elements like `Input` to respond to typing. It also provides navigation (e.g., Tab key or arrow keys with Shift).
3.  **State Management (`use_state` and `%count`)**:
    *   `use_state(0)` creates a `State<i32>` variable initialized to `0`. `State` is an `Arc<Mutex<T>>` internally, making it safe to share across threads.
    *   The `std::thread::spawn` block continuously increments this `count` every second. `**count.get() += 1;` uses `DerefMut` on the `MutexGuard` obtained from `get()`. This `DerefMut` implementation *automatically marks the state as changed*.
    *   In the `rsx!` macro, `%count` tells OSUI that the enclosing `Div` (and its children) depends on `count`.
    *   Whenever `count` is marked as changed, the `DynWidget` associated with that `Div` automatically rebuilds its content and triggers a re-render in the next frame. This is why the number updates in the UI.
4.  **`rsx!` Macro**:
    *   The `rsx!` macro provides a declarative way to define your UI tree. It creates a hierarchy of `Widget`s, each potentially containing an `Element` and various `Component`s.
    *   `Paginator`, `FlexRow`, `FlexCol`, `Div`, `Heading`, `Input` are built-in [elements](../reference/elements/index.md) that define structure and appearance.
    *   `@Transform` and `@Style` are [components](../reference/style.md) that attach layout and visual properties to elements.
    *   `@Handler` is a [component](../reference/extensions.md) that allows a widget to listen for specific events (here, `crossterm::event::Event`).
    *   `@Focused` and `@AlwaysFocused` are [components](../reference/extensions/focus.md) from `RelativeFocusExtension` that manage input focus.
5.  **`screen.run()`**: This method starts the main application loop. It continuously:
    *   Renders all widgets.
    *   Processes events from extensions.
    *   Calls `auto_refresh` on dynamic widgets to check dependencies and re-render if needed.

This example showcases how OSUI integrates reactive state, event handling, and declarative UI definition to create interactive terminal applications.
