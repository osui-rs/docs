# Layout and Styling

OSUI provides a robust layout and styling system to control the appearance and positioning of your UI elements. This system is built around several key concepts: `Transform`, `Position`, `Dimension`, `Style`, and `Background`.

## 1. `Transform`: Positioning and Sizing Rules

The `Transform` component is used to define how a widget should be positioned and sized relative to its parent. It specifies declarative rules rather than absolute pixel values, allowing for flexible and responsive layouts.

You typically create and attach a `Transform` using the `@` component syntax in `rsx!` or by calling `widget.component(Transform::new()...)`.

```rust
use osui::prelude::*;

// Default transform: (0,0) position, content-sized
let default_transform = Transform::new();

// Centered horizontally and vertically, content-sized
let centered_transform = Transform::center();

rsx! {
    @Transform::new().padding(2, 1).dimensions(30, 5);
    Div { "A fixed-size div with padding." }

    @Transform::new().right().margin(5, 0);
    Div { "Aligned to the right with a 5-cell horizontal margin." }

    @Transform::new().bottom().margin(0, 2);
    Div { "Aligned to the bottom with a 2-cell vertical margin." }
}
```

### `Transform` Fields:

*   `x: Position`: Horizontal position relative to the parent.
*   `y: Position`: Vertical position relative to the parent.
*   `mx: i32`: Horizontal margin (offset) from the calculated `x` position. Can be negative for overlap.
*   `my: i32`: Vertical margin (offset) from the calculated `y` position. Can be negative for overlap.
*   `px: u16`: Horizontal padding (internal spacing) around the content.
*   `py: u16`: Vertical padding (internal spacing) around the content.
*   `width: Dimension`: Rule for the widget's width.
*   `height: Dimension`: Rule for the widget's height.

### Chainable Methods for `Transform`

`Transform` provides several convenient chainable methods for common layout patterns:

*   `Transform::new()`: Creates a default transform at `(0,0)` with `Content` dimensions and no padding/margin.
*   `Transform::center()`: Creates a transform centered both horizontally and vertically.
*   `Transform::bottom(self)`: Sets `y` to `Position::End`.
*   `Transform::right(self)`: Sets `x` to `Position::End`.
*   `Transform::margin(self, x: i32, y: i32)`: Sets `mx` and `my`.
*   `Transform::padding(self, x: u16, y: u16)`: Sets `px` and `py`.
*   `Transform::dimensions(self, width: u16, height: u16)`: Sets `width` and `height` to `Dimension::Const`.

## 2. `Position`: Horizontal and Vertical Alignment

`Position` defines how an element is placed along an axis relative to its parent's boundaries.

```rust
pub enum Position {
    /// Fixed position in cells from the origin (top-left).
    Const(u16),
    /// Centered in the parent.
    Center,
    /// Aligned to the end (right for x, bottom for y) of the parent.
    End,
}
```

*   `Position::Const(value)`: Sets an exact coordinate from the top-left (0,0). You can also use `u16` directly, thanks to `impl From<u16> for Position`.
    ```rust
    @Transform { x: 5, y: 10 }; // Same as x: Position::Const(5), y: Position::Const(10)
    ```
*   `Position::Center`: Centers the element within the available space of its parent on that axis.
    ```rust
    @Transform { x: Position::Center, y: Position::Center };
    ```
*   `Position::End`: Aligns the element to the right (for `x`) or bottom (for `y`) edge of its parent.
    ```rust
    @Transform { x: Position::End, y: Position::Const(0) }; // Top-right aligned
    ```

## 3. `Dimension`: Sizing Rules

`Dimension` defines how an element's width or height is determined.

```rust
pub enum Dimension {
    /// Fills the available space from the parent.
    Full,
    /// Automatically sized to fit content.
    Content,
    /// Fixed size in cells.
    Const(u16),
}
```

*   `Dimension::Full`: The element will take up 100% of the available space on that axis within its parent.
*   `Dimension::Content`: The element's size will be determined by its content. For container elements (like `Div`, `FlexRow`, `FlexCol`), this means their size will expand to encompass their children. For text elements, it will be the size of the text. This is the default.
*   `Dimension::Const(value)`: The element will have a fixed size in cells. You can also use `u16` directly, thanks to `impl From<u16> for Dimension`.
    ```rust
    @Transform { width: 20, height: 5 }; // Same as width: Dimension::Const(20), height: Dimension::Const(5)
    ```

## 4. `Style`: Visual Appearance

The `Style` component defines the background and foreground colors of a widget.

```rust
pub struct Style {
    pub background: Background,
    pub foreground: Option<u32>,
}
```

*   `background: Background`: Specifies the widget's background appearance.
*   `foreground: Option<u32>`: Sets the text color. `None` means the default terminal foreground color.

You attach `Style` using the `@` component syntax:

```rust
use osui::prelude::*;

rsx! {
    @Style { background: Background::Solid(0x222222), foreground: Some(0xFFFFFF) };
    Div {
        "This text is white on a dark gray background."
    }

    @Style { background: Background::Outline(0x00FF00), foreground: Some(0x00FF00) };
    Div {
        "This div has a green outline and green text."
    }
}
```

### `Background`: Background Appearance Options

`Background` defines various ways a widget's background can be drawn. Colors are specified as `u32` hex values (e.g., `0xFF0000` for red).

```rust
pub enum Background {
    /// Transparent / no background.
    NoBackground,
    /// Draws a basic outline using the given color.
    Outline(u32),
    /// Draws a rounded outline using the given color.
    RoundedOutline(u32),
    /// Fills the background with the specified color.
    Solid(u32),
}
```

## The `transform!` Macro

For even more concise `Transform` definitions, you can use the `transform!` macro:

```rust
use osui::prelude::*;

rsx! {
    @transform!{ x: 10, y: Center, width: Full, padding: (1, 1) };
    Div {
        "This div is at x=10, centered vertically, full width, with 1 unit of padding."
    }
}
```
This macro automatically converts `u16` values to `Position::Const` or `Dimension::Const` where appropriate.

## How Layout and Styling are Applied

When the `Screen` renders a widget, it performs the following steps (simplified):

1.  **Retrieve Components**: It fetches the `Transform` and `Style` components attached to the widget.
2.  **Resolve Transform**: The `Transform`'s `use_dimensions` and `use_position` methods are called. These methods take the *parent's* resolved size (from the `RenderScope`) and convert the declarative `Position` and `Dimension` rules into concrete `u16` values (absolute `x`, `y`, `width`, `height`) within a `RawTransform` structure.
3.  **Apply Style**: The `Style` component is passed to the `RenderScope`.
4.  **Element Rendering**: The widget's `Element::render` method is called. This method uses the now-resolved `RawTransform` and `Style` from the `RenderScope` to queue its drawing instructions (text, rectangles). It might also update `RenderScope`'s size based on content.
5.  **Parent Rendering (`after_render`)**: For container elements (like `Div`, `FlexRow`, `FlexCol`), their `Element::after_render` method then takes over. They iterate through their children, set the `RenderScope`'s "parent size" to *their own* resolved size, and recursively trigger the rendering process for each child.
6.  **Drawing to Terminal**: Finally, `RenderScope::draw()` is called, which takes all accumulated drawing instructions and applies them to the terminal using `crossterm` and ANSI escape codes. Backgrounds and outlines are drawn first, then text and other content.

This multi-stage process ensures that layout rules are correctly interpreted from parent to child, allowing for adaptive and well-positioned UI elements.



