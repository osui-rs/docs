# Layout and Styling with OSUI

OSUI provides a robust system for controlling the position, size, and visual appearance of your UI elements using `Transform` and `Style` components.

## 1. Controlling Layout with `Transform`

The `Transform` component defines how a widget is positioned and sized relative to its parent. It's designed for flexibility, allowing both fixed values and dynamic rules.

```rust
// Defined using the component! macro in src/style.rs
component!(Transform {
    pub x: Position,
    pub y: Position,
    pub mx: i32,
    pub my: i32,
    pub px: u16,
    pub py: u16,
    pub width: Dimension,
    pub height: Dimension,
});
```

*   **`x`, `y`**: Horizontal and vertical position, defined by the `Position` enum.
*   **`mx`, `my`**: Margins (offsets) from the calculated position. Can be positive or negative.
*   **`px`, `py`**: Padding (internal spacing) around the content within the widget's bounds.
*   **`width`, `height`**: Sizing rules for dimensions, defined by the `Dimension` enum.

### `Position` Enum

Controls horizontal or vertical alignment:

*   **`Const(u16)`**: Fixed position in cells from the origin (top-left).
    *   `x: Position::Const(10)` or simply `x: 10` (due to `From<u16> for Position` impl).
*   **`Center`**: Centers the widget in the parent's available space.
*   **`End`**: Aligns the widget to the end (right or bottom) of the parent.

### `Dimension` Enum

Controls sizing:

*   **`Full`**: Fills the available space from the parent.
*   **`Content`**: Automatically sized to fit content. This is the default. The element's `render` method will typically update the `RenderScope`'s size to match its content.
*   **`Const(u16)`**: Fixed size in cells.
    *   `width: Dimension::Const(50)` or simply `width: 50`.

### Fluent API for `Transform`

`Transform` provides a fluent builder pattern for easy configuration:

*   **`Transform::new()`**: Creates a default transform: top-left aligned (`x: 0`, `y: 0`), content sizing (`width: Content`, `height: Content`), no margins or padding.
*   **`Transform::center()`**: Shortcut for `x: Center`, `y: Center`.
*   **`transform.bottom()`**: Sets `y: End`.
*   **`transform.right()`**: Sets `x: End`.
*   **`transform.margin(x, y)`**: Sets `mx` and `my`.
*   **`transform.padding(x, y)`**: Sets `px` and `py`.
*   **`transform.dimensions(width, height)`**: Sets `width: Const(width)` and `height: Const(height)`.

### Examples of `Transform` Usage

Attach `Transform` as a component to any element using the `@` syntax in `rsx!`:

```rust
use osui::prelude::*;

rsx! {
    // Center a Div on the screen
    @Transform::center();
    Div { "I am centered." }

    // Place a Div at (10, 5) with fixed dimensions and padding
    @Transform::new().x(10).y(5).dimensions(30, 7).padding(2, 1);
    Div { "Fixed size box with padding." }

    // Align a Div to the bottom-right with margin
    @Transform::new().bottom().right().margin(-5, -3); // Negative margin pulls it closer to edge
    Div { "Bottom right with margin." }

    // A FlexRow that takes full width and automatically sizes height
    @Transform::new().width(Full);
    FlexRow { "Full width content." }
}
```

The `transform!` macro provides a more concise way to create and set properties on a `Transform`:

```rust
use osui::prelude::*;

rsx! {
    // Equivalent to Transform::new().x(10).y(5).dimensions(30, 7).padding(2, 1);
    @transform!(x: 10, y: 5, width: 30, height: 7, px: 2, py: 1);
    Div { "Shorter syntax for transform." }

    // Using Position and Dimension enums directly
    @transform!(x: Center, y: End, width: Full);
    Div { "Centered horizontally, at bottom, full width." }
}
```

## 2. Defining Style with `Style`

The `Style` component defines the visual appearance, specifically background and foreground colors.

```rust
// Defined using the component! macro in src/style.rs
component!(Style {
    pub background: Background,
    pub foreground: Option<u32>,
});

pub enum Background {
    NoBackground,       // No background drawn
    Outline(u32),       // Draws a basic rectangular outline
    RoundedOutline(u32),// Draws a rounded rectangular outline
    Solid(u32),         // Fills the background with a solid color
}
```

*   **`background`**: Determines how the background of the widget's calculated area is rendered.
*   **`foreground`**: An `Option<u32>` where `u32` represents a 24-bit RGB color (e.g., `0xFF0000` for red, `0x00FF00` for green). If `None`, the default terminal foreground color is used.

### Examples of `Style` Usage

Attach `Style` as a component:

```rust
use osui::prelude::*;

rsx! {
    // A div with a solid blue background and white text
    @Transform::new().dimensions(25, 3);
    @Style { background: Background::Solid(0x0000FF), foreground: Some(0xFFFFFF) };
    Div { "Hello, Blue World!" }

    // A div with a green rounded outline
    @Transform::new().dimensions(25, 3).margin(0, 4);
    @Style { background: Background::RoundedOutline(0x00FF00), foreground: Some(0xFFFFFF) };
    Div { "Rounded green box." }

    // A div with a red square outline
    @Transform::new().dimensions(25, 3).margin(0, 8);
    @Style { background: Background::Outline(0xFF0000), foreground: Some(0xFFFFFF) };
    Div { "Square red box." }
}
```

By combining `Transform` and `Style`, you can precisely control both the layout and visual aesthetics of your OSUI applications.
