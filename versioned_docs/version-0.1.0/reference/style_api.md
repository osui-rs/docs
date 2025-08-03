# Style API Reference

The `style` module defines the fundamental structures for managing rendering geometry, positioning, sizing, and visual appearance of OSUI widgets. These types are essential for controlling how your UI elements are laid out and drawn.

## `RawTransform` Struct

`RawTransform` holds the concrete, resolved layout information for a widget *after* layout calculations have been performed. It contains absolute pixel values.

```rust
#[derive(Debug, Clone)]
pub struct RawTransform {
    pub x: u16,
    pub y: u16,
    pub width: u16,
    pub height: u16,
    pub px: u16, // Padding X
    pub py: u16, // Padding Y
}
```

*   `x`, `y`: Absolute top-left coordinate of the widget in terminal cells.
*   `width`, `height`: Absolute dimensions of the widget in terminal cells.
*   `px`, `py`: Resolved horizontal and vertical padding applied *around* the content area.

### `RawTransform::new()`

Creates a new `RawTransform` with all fields set to 0.

```rust
pub fn new() -> RawTransform
```

## `Position` Enum

`Position` defines horizontal or vertical positioning rules relative to a parent container.

```rust
#[derive(Debug, Clone)]
pub enum Position {
    /// Fixed position in cells from the origin.
    Const(u16),
    /// Centered in the parent.
    Center,
    /// Aligned to the end (right or bottom) of the parent.
    End,
}
```

### `Position` Implementations

*   `impl From<u16> for Position`: Allows `u16` values to be directly used where `Position` is expected (e.g., `Transform { x: 10 }`).
*   `use_position(&self, size: u16, parent: u16, m: i32, r: &mut u16)`: An internal method used by `Transform` to resolve the position based on the element's size, parent's size, and margin.

## `Dimension` Enum

`Dimension` defines sizing rules for width or height.

```rust
#[derive(Debug, Clone)]
pub enum Dimension {
    /// Fills the available space from the parent.
    Full,
    /// Automatically sized to fit content.
    Content,
    /// Fixed size in cells.
    Const(u16),
}
```

### `Dimension` Implementations

*   `impl From<u16> for Dimension`: Allows `u16` values to be directly used where `Dimension` is expected (e.g., `Transform { width: 50 }`).
*   `use_dimension(&self, parent: u16, r: &mut u16)`: An internal method used by `Transform` to resolve the dimension based on the parent's size.

## `Background` Enum

`Background` defines various visual appearances for a widget's background. Colors are 24-bit RGB values represented as `u32` (e.g., `0xFF0000` for red).

```rust
#[derive(Debug, Clone)]
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

## `Transform` Component

The `Transform` component is the primary way to define a widget's desired layout properties. It is typically attached to a `Widget` via `rsx!` or `widget.component()`.

```rust
component!(Transform {
    pub x: Position,
    pub y: Position,
    pub mx: i32, // Margin X
    pub my: i32, // Margin Y
    pub px: u16, // Padding X
    pub py: u16, // Padding Y
    pub width: Dimension,
    pub height: Dimension,
});
```

### `Transform` Methods

*   `Transform::new() -> Transform`: Creates a default transform with top-left alignment (`Position::Const(0)`) and content sizing (`Dimension::Content`), with no margins or padding.
*   `Transform::center() -> Transform`: Shortcut for centering both horizontally and vertically (`Position::Center`) with content sizing.
*   `bottom(mut self) -> Self`: Sets `y` to `Position::End`.
*   `right(mut self) -> Self`: Sets `x` to `Position::End`.
*   `margin(mut self, x: i32, y: i32) -> Self`: Adds margin (offset) from parent edge. `x` is `mx`, `y` is `my`.
*   `padding(mut self, x: u16, y: u16) -> Self`: Adds internal spacing (padding) around content. `x` is `px`, `y` is `py`.
*   `dimensions(mut self, width: u16, height: u16) -> Self`: Sets constant dimensions (`Dimension::Const`) for `width` and `height`.
*   `use_dimensions(&self, parent_width: u16, parent_height: u16, raw: &mut RawTransform)`: Internal method that resolves `Dimension` rules into absolute values (`raw.width`, `raw.height`) based on parent size.
*   `use_position(&self, parent_width: u16, parent_height: u16, raw: &mut RawTransform)`: Internal method that resolves `Position` rules into absolute coordinates (`raw.x`, `raw.y`) based on parent size and the resolved widget size.

### Usage Example: `Transform`

```rust
use osui::prelude::*;

rsx! {
    // A div that is 20x5 cells, centered, with 1 unit of padding
    @Transform::new().dimensions(20, 5).center().padding(1, 1);
    Div { "Centered Box" }

    // A div aligned to the bottom-right, with 2 cells margin from edges
    @Transform::new().bottom().right().margin(2, 2);
    Div { "Bottom Right" }

    // A div that fills the parent's width, is content-height, and starts at (0, 3)
    @Transform { x: 0, y: 3, width: Full, height: Content };
    Div { "Full Width Container" }
}
```

## `Style` Component

The `Style` component defines the visual appearance of a widget, primarily its background and foreground colors.

```rust
component!(Style {
    pub background: Background,
    pub foreground: Option<u32>,
});
```

### `Style` Methods

*   `Style::new() -> Self`: Creates a default style with `Background::NoBackground` and no foreground color (`None`).

### Usage Example: `Style`

```rust
use osui::prelude::*;

rsx! {
    // A solid red background with white text
    @Style { background: Background::Solid(0xFF0000), foreground: Some(0xFFFFFF) };
    Div { "Red Box" }

    // A green rounded outline with default foreground
    @Style { background: Background::RoundedOutline(0x00FF00), foreground: None };
    Div { "Green Rounded Outline" }
}
```

By combining `Transform` and `Style` components, developers have fine-grained control over the layout and aesthetics of every element in their OSUI applications.



