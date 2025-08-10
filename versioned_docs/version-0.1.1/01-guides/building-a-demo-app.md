# Building a Comprehensive Demo Application

This guide walks through the `src/demos/mod.rs` file provided in the OSUI source, explaining how various features are combined to create a multi-page interactive application. This demo showcases reactive state, input handling, custom elements, and layout components.

## Overview of `src/demos/mod.rs`

The `demos::app` function returns an `Rsx` tree, which is the declarative representation of our UI. This `Rsx` tree is then drawn to the `Screen`.

```rust
// src/demos/mod.rs
use std::sync::Arc;
use osui::prelude::*;

pub fn app(screen: Arc<Screen>) -> Rsx {
    // 1. Reactive State
    let count = use_state(0);

    // Spawn a background thread to increment the counter
    std::thread::spawn({
        let count = count.clone();
        move || loop {
            **count.get() += 1; // Increment and mark as changed
            std::thread::sleep(std::time::Duration::from_secs(1));
        }
    });

    // 2. Main UI Definition
    rsx! {
        // Global event handler for Escape key to close the app
        @Handler::new({
            let screen = screen.clone();
            move |_, e: &crossterm::event::Event| {
                if let crossterm::event::Event::Key(crossterm::event::KeyEvent { code, .. }) = e {
                    if *code == crossterm::event::KeyCode::Esc {
                        screen.close();
                    }
                }
            }});
        // Keep the root Paginator widget always focused
        @AlwaysFocused;
        Paginator { // Main page manager
            // --- Page 1: Welcome and Instructions ---
            FlexRow { // Horizontal layout for elements on this page
                Heading, smooth: false, { "OSUI" } // Large ASCII art title
                "Welcome to the OSUI demo!"
                "Press tab to switch to the next page or shift+tab to the previous page"
            }

            // --- Page 2: Divs with different outlines ---
            FlexCol, gap: 3, { // Vertical layout for elements on this page
                @Transform::new().padding(2, 2);
                @Style { foreground: None, background: Background::RoundedOutline(0x00ff00) };
                Div {
                    "This is text inside a div with rounded outlines"
                }

                @Transform::new().padding(2, 2);
                @Style { foreground: None, background: Background::Outline(0x00ff00) };
                Div {
                    "This is text inside a div with square outlines"
                }
            }

            // --- Page 3: Reactive Counter & Input Fields ---
            FlexRow, gap: 1, {
                %count // This section depends on the 'count' state
                "This will increment every second: {count}"

                FlexRow { // Nested FlexRow for Username input
                    "Username"
                    @Transform::new().padding(1, 1).dimensions(40, 1);
                    @Style { foreground: Some(0xffffff), background: Background::RoundedOutline(0xff0000) };
                    @Focused; // Initially focus this input field
                    Input { }
                }

                @Transform::new().margin(0, 1); // Add a margin below previous element
                FlexRow { // Nested FlexRow for Password input
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

## Dissecting the Demo

### 1. Central `Screen` and Extensions

*   In `src/main.rs`, the `Screen` is initialized, and `InputExtension` and `RelativeFocusExtension` are registered.
    *   `InputExtension` is vital as it enables raw mode terminal input and dispatches `crossterm::event::Event`s throughout the OSUI system. Without it, keyboard input won't work.
    *   `RelativeFocusExtension` manages which widget is "focused," which is essential for `Input` elements to receive typing events. It also provides navigation between focusable elements (by default, using arrow keys when Shift is held).
*   The `demos::app(screen.clone()).draw(&screen);` line is the entry point for rendering the entire UI structure.

### 2. Global Event Handling (`@Handler` and `Esc` Key)

*   The very first element in `rsx!` (outside the `Paginator`) is a `Handler` component attached to an implicit root widget.
*   `@Handler::new(...)` creates an event handler that listens for `crossterm::event::Event`s.
*   The closure checks if the event is a `KeyCode::Esc` key press. If so, it calls `screen.close()`, which gracefully exits the OSUI application, restoring terminal state.
*   `@AlwaysFocused` ensures this root handler always receives events, regardless of which sub-widget might have specific input focus.

### 3. Page Navigation with `Paginator`

*   The top-level element is a `Paginator`. This element acts as a simple tab-like interface.
*   Each direct child of `Paginator` becomes a "page." The `Paginator` displays only one child at a time.
*   Pressing `Tab` (or `Shift+Tab`) cycles through the `Paginator`'s children, switching the active page. This behavior is built into the `Paginator` element's `event` method.

### 4. Layout with `FlexRow` and `FlexCol`

*   Each "page" within the `Paginator` uses either `FlexRow` or `FlexCol` to organize its content.
*   `FlexRow { ... }`: Arranges children horizontally. Used for the welcome message and the counter/input fields.
*   `FlexCol, gap: 3, { ... }`: Arranges children vertically. Used for the Div examples, with a `gap` of 3 cells between each child.
*   These flex containers automatically calculate their own size based on their children and distribute space. They are "ghost" elements, meaning they don't draw anything themselves but define layout for their children.

### 5. Styling and Layout Components (`@Transform`, `@Style`)

*   **`@Transform::new().padding(2, 2)`**: Sets internal spacing of 2 cells on all sides for the `Div` elements.
*   **`@Style { background: Background::RoundedOutline(0x00ff00) }`**: Applies a green rounded outline background to the first `Div`. `0x00ff00` is a 24-bit RGB hexadecimal color code.
*   **`@Style { background: Background::Outline(0x00ff00) }`**: Applies a green square outline background to the second `Div`.
*   **`@Transform::new().dimensions(40, 1)`**: Sets the `Input` fields to a fixed width of 40 cells and a height of 1 cell.
*   **`@Style { foreground: Some(0xffffff), background: Background::RoundedOutline(0xff0000) }`**: Styles the username input with white foreground text and a red rounded outline.

### 6. Reactive State and Text Interpolation (`%count`)

*   `let count = use_state(0);` initializes a reactive state variable.
*   The `std::thread::spawn` block modifies `count` every second (`**count.get() += 1;`). This modification automatically marks `count` as "changed."
*   `%count` (on the `FlexRow` containing the counter text) declares a dependency. When `count` changes, this `FlexRow` (and its children, including the text) is rebuilt and re-rendered, displaying the updated value.
*   The text `"This will increment every second: {count}"` directly interpolates the `count` state's value. This works because `State<T>` implements `Display`.

### 7. Interactive Input (`Input` Element)

*   `Input { }` creates a text input field.
*   `@Focused` on the "Username" `Input` ensures it receives keyboard focus when that page is active, allowing the user to type immediately. The `RelativeFocusExtension` helps manage this focus.
*   When an `Input` is focused, typing characters modifies its internal `State<String>`, and it redraws to show the updated text and cursor.

This demo illustrates a comprehensive use of OSUI's features, demonstrating how declarative UI, reactive state, event handling, and layout work together to build a functional TUI application.
