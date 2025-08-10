# Common Built-in Elements

OSUI provides a set of essential UI elements that serve as building blocks for your terminal interfaces. These elements range from simple text to complex layout containers and interactive input fields.

## 1. Text (`String` Element)

The simplest element is a `String`. Any string literal or `format!` macro output directly within `rsx!` will be treated as a renderable text element.

```rust
use osui::prelude::*;

rsx! {
    "Hello, World!" // Renders "Hello, World!"
    format!("The current count is: {}", 123) // Dynamic text
}
```
**Behavior**: Draws the string at its calculated position. It's a "ghost" element (`is_ghost` returns `true`), meaning it primarily contributes content for layout but doesn't have its own background or border (unless a `Style` component is explicitly attached to its parent that applies to its area). Its size contributes to `Dimension::Content` calculations of its parent.

## 2. `Div` (Generic Container)

The `Div` element is a versatile, transparent container. It doesn't draw anything itself but is crucial for grouping other elements and applying layout and style components to a collection of children.

```rust
use osui::prelude::*;

rsx! {
    @Transform::new().padding(2, 2);
    @Style { background: Background::Solid(0x222222) };
    Div {
        "This text is inside a gray Div with padding."
        FlexRow { "Another", "element", "can", "be", "nested" }
    }
}
```
**Behavior**: `Div` is a "ghost" element. Its `after_render` method iterates through its children and renders them. It automatically calculates its own `width` and `height` to encompass all its children, plus any `padding` specified in its `Transform`.

## 3. Flex Containers (`FlexRow` and `FlexCol`)

Flex containers are powerful layout elements that automatically arrange their children either horizontally (`FlexRow`) or vertically (`FlexCol`), with optional gaps between them.

### `FlexRow`

Arranges children in a row (horizontally).

```rust
use osui::prelude::*;

rsx! {
    @Transform::new().padding(1, 1).dimensions(Full, Content);
    @Style { background: Background::Outline(0x00FF00) };
    FlexRow, gap: 2, { // `gap` property sets spacing between children
        "Item 1"
        "Item 2"
        @Style { foreground: Some(0xFFFF00) };
        "Item 3 (Yellow)"
        Div { "Nested div as item 4" }
    }
}
```
**Behavior**: `FlexRow` is a "ghost" element. Its `after_render` dynamically positions each child next to the previous one, accounting for the `gap` property. The `FlexRow`'s `width` will be the sum of its children's widths (plus gaps and padding), and its `height` will be the height of its tallest child.

### `FlexCol`

Arranges children in a column (vertically).

```rust
use osui::prelude::*;

rsx! {
    @Transform::new().padding(1, 1).dimensions(Content, Full);
    @Style { background: Background::Outline(0xFF00FF) };
    FlexCol, gap: 1, {
        "First Line"
        "Second Line"
        Input { } // An input field on a new line
        Div { "A div below the input" }
    }
}
```
**Behavior**: `FlexCol` is a "ghost" element. Its `after_render` dynamically positions each child below the previous one, accounting for the `gap` property. The `FlexCol`'s `height` will be the sum of its children's heights (plus gaps and padding), and its `width` will be the width of its widest child.

## 4. `Heading` (ASCII Art Text)

The `Heading` element uses the `figlet-rs` library to render large, ASCII art text. It's great for titles and banners.

```rust
use osui::prelude::*;

rsx! {
    // Heading with default (standard) font
    Heading { "OSUI" }

    // Heading with smooth characters (replaces hyphens and pipes)
    Heading, smooth: true, { "Awesome" }
}
```
**Properties**:
*   `font: FIGfont`: The font to use (defaults to `standard`). You can load other FIGlet fonts.
*   `smooth: bool`: If `true`, replaces common characters like `-` and `|` with Unicode line drawing characters for a smoother appearance.

**Behavior**: `Heading` is a "ghost" element. It takes a single `String` child (or any element that can be downcast to `String`) and converts it to ASCII art before drawing it. Its size contributes to its parent's `Dimension::Content` calculation.

## 5. `Input` (Text Input Field)

The `Input` element provides a basic interactive text input field.

```rust
use osui::prelude::*;

rsx! {
    FlexCol, gap: 1, {
        "Enter Username:"
        @Transform::new().dimensions(30, 1).padding(0,0);
        @Style { background: Background::Outline(0xAAAAAA) };
        @Focused; // Mark this input as initially focused for keyboard interaction
        Input { }

        "Enter Password:"
        @Transform::new().dimensions(30, 1).padding(0,0);
        @Style { background: Background::Outline(0xAAAAAA) };
        Input { } // This input will not be focused initially
    }
}
```
**Properties**:
*   `state: State<String>`: The internal `State` that holds the input string. You can access this `State` to get or set the input value.
*   `cursor: usize`: Internal cursor position within the input string.

**Behavior**:
*   When focused (via the `@Focused` component or navigation), it captures keyboard input.
*   Supports typing characters, `Backspace`, `Delete`, `Left` arrow, `Right` arrow.
*   The currently typed text is drawn, and a "inverted" character at the cursor position indicates focus.
*   The `Input` element automatically creates its own internal `State<String>`. To access this state, you would need to store a reference to the `Input` element (e.g., if you were creating it programmatically without `rsx!`) or manage your own state and inject it.

## 6. `Paginator` (Page Navigation)

The `Paginator` element manages a collection of child widgets, displaying only one at a time and allowing navigation between them (typically with Tab/Shift+Tab).

```rust
use osui::prelude::*;

rsx! {
    @Transform::new().center().dimensions(50, 20); // Paginator needs fixed size to contain pages
    @Style { background: Background::Solid(0x333333) };
    Paginator {
        // First page content
        FlexCol { "This is Page 1" "Press TAB for next page, Shift+TAB for previous" }

        // Second page content
        Div { "This is Page 2, with some input:" Input { } }

        // Third page content
        Heading { "Last Page!" }
    }
}
```
**Properties**:
*   `index: usize`: The current page index being displayed (defaults to 0).

**Behavior**:
*   `Paginator` is a "ghost" element. It draws only its child at the current `index`.
*   It listens for `KeyCode::Tab` and `KeyCode::BackTab` events to cycle through its children.
*   Its `width` and `height` are determined by its currently displayed child.

These built-in elements provide a solid foundation for building diverse and interactive terminal user interfaces with OSUI.
