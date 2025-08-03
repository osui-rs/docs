# Elements API Reference

OSUI provides a set of built-in `Element` implementations that serve as the fundamental visual components for building your terminal user interfaces. This section details their purpose and configurable properties.

All elements implicitly implement the `Element` trait and can be used within the `rsx!` macro.

## Basic Elements

### `String`

Represents simple plain text.

```rust
impl Element for String
```

*   **Properties**: None directly. Content is the string itself.
*   **Usage**:
    ```rust
    rsx! {
        "Hello, World!"
    }
    ```

### `(String, u32)` (Colored Text)

Represents text with a specific 24-bit RGB foreground color.

```rust
impl Element for (String, u32)
```

*   **Properties**:
    *   `0`: The `String` content.
    *   `1`: The `u32` RGB color (e.g., `0xFF0000` for red).
*   **Usage**:
    ```rust
    rsx! {
        ("This text is red.", 0xFF0000)
    }
    ```

## Container Elements

Container elements manage and render their children. They typically take care of positioning children relative to themselves.

### `Div`

A basic rectangular container element. It positions its children at their specified coordinates relative to the div's top-left corner and expands its own `Dimension::Content` size to fit them.

```rust
pub struct Div {
    // children: Vec<Arc<Widget>>, // Internal
    // size: (u16, u16),           // Internal calculated size
}
```

*   **Properties**: None specific to `Div`. Layout and style are controlled by attached `Transform` and `Style` components.
*   **Usage**:
    ```rust
    rsx! {
        @Transform::new().padding(1, 1);
        @Style { background: Background::Solid(0x333333) };
        Div {
            "Content inside a div."
            @Transform::new().x(2).y(2);
            Div { "Nested div offset by (2,2)" }
        }
    }
    ```

### `FlexRow`

A container element that arranges its children vertically, one after another, like a column. It expands its height to fit children and can apply a uniform `gap` between them.

```rust
pub struct FlexRow {
    pub gap: u16,
    // children: Vec<Arc<Widget>>, // Internal
    // size: (u16, u16),           // Internal calculated size
}
```

*   **Properties**:
    *   `gap: u16`: The number of empty cells between each child element. Defaults to `0`.
*   **Usage**:
    ```rust
    rsx! {
        FlexRow, gap: 1, {
            "First Item"
            ("Second Item (colored)", 0x00FFFF)
            Div { "Third Item (a div)" }
        }
    }
    ```
    This will render "First Item", then a 1-cell gap, then "Second Item", then a 1-cell gap, etc., all stacked vertically.

### `FlexCol`

A container element that arranges its children horizontally, one after another, like a row. It expands its width to fit children and can apply a uniform `gap` between them.

```rust
pub struct FlexCol {
    pub gap: u16,
    // children: Vec<Arc<Widget>>, // Internal
    // size: (u16, u16),           // Internal calculated size
}
```

*   **Properties**:
    *   `gap: u16`: The number of empty cells between each child element. Defaults to `0`.
*   **Usage**:
    ```rust
    rsx! {
        FlexCol, gap: 2, {
            "Left Item"
            ("Middle Item (colored)", 0xFFCC00)
            Div { "Right Item (a div)" }
        }
    }
    ```
    This will render "Left Item", then a 2-cell gap, then "Middle Item", etc., all laid out horizontally.

### `Paginator`

A container element that displays only one of its children at a time. It provides built-in keyboard navigation to cycle through its children.

```rust
pub struct Paginator {
    // children: Vec<Arc<Widget>>, // Internal
    // size: (u16, u16),           // Internal calculated size
    // index: usize,               // Internal current page index
}
```

*   **Properties**: None specific to `Paginator`.
*   **Internal Behavior**:
    *   Handles `crossterm::event::KeyCode::Tab` to advance to the next child. If at the last child, it wraps to the first.
    *   Handles `crossterm::event::KeyCode::BackTab` (Shift+Tab) to go to the previous child. If at the first child, it wraps to the last.
*   **Usage**:
    ```rust
    rsx! {
        Paginator {
            Div { "Page 1 Content" }
            FlexCol { "Page 2: Item A", "Item B" }
            "Page 3: Just some text."
        }
    }
    ```

## Form Elements

### `Input`

An interactive element that allows users to type text. It manages its own internal state, cursor position, and handles basic text editing key presses.

```rust
pub struct Input {
    pub state: State<String>, // Reactive state holding the input string
    // cursor: usize,           // Internal cursor position
}
```

*   **Properties**:
    *   `state: State<String>`: A reactive state variable that holds the current text content of the input field. You can pass your own `State<String>` to bind to it, or `Input::new()` creates a default one.
*   **Internal Behavior**:
    *   Handles `crossterm::event::KeyEvent` for:
        *   `KeyCode::Char`: Inserts character at cursor.
        *   `KeyCode::Backspace`: Deletes character before cursor.
        *   `KeyCode::Delete`: Deletes character at cursor.
        *   `KeyCode::Left`, `KeyCode::Right`: Moves cursor.
*   **Usage**:
    ```rust
    use osui::prelude::*;

    let my_input_state = use_state(String::from("Initial Text"));

    rsx! {
        @Transform::new().dimensions(30, 1).padding(1, 0);
        @Style { background: Background::Outline(0x888888), foreground: Some(0xFFFFFF) };
        Input, state: my_input_state, { }
    }
    // You can access my_input_state.get_dl() elsewhere to get the current value.
    ```
    Note that while the `Input` element has a `state` field, it's not declared as a dependency with `%` in `rsx!`. This is because `Input` internally manages its own `State<String>` and triggers its own re-renders when the text changes. You would use `%` if another widget needed to react to changes in `my_input_state`.

## Display Elements

### `Heading`

An element that renders text using FIGlet ASCII art fonts.

```rust
pub struct Heading {
    pub font: FIGfont, // The FIGlet font to use
    pub smooth: bool,  // Whether to replace '-' with '─' and '|' with '│'
    // children: Vec<Arc<Widget>>, // Internal: stores text children
}
```

*   **Properties**:
    *   `font: FIGfont`: The FIGlet font instance to use. You typically use `FIGfont::standard().unwrap()` or load a custom font.
    *   `smooth: bool`: If `true`, replaces standard ASCII box drawing characters with Unicode smooth box drawing characters for a cleaner look. Defaults to `false`.
*   **Usage**:
    ```rust
    use figlet_rs::FIGfont; // Import for `FIGfont` type

    rsx! {
        // Default standard font, not smooth
        Heading { "OSUI" }

        // Using a custom font and smoothing
        Heading, font: FIGfont::big().unwrap(), smooth: true, { "Big Title" }
    }
    ```
    Note that `Heading` expects `String` children (or `(String, u32)` children) for its text content. It concatenates all string children and renders them as one FIGlet text block.

These built-in elements provide a solid foundation for constructing diverse and interactive terminal user interfaces with OSUI.



