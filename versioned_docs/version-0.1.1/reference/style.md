# `osui::style`

The `style` module defines the structures and enums used to control the visual appearance and layout of OSUI widgets. It provides a declarative way to specify positions, dimensions, and backgrounds.

## `RawTransform`

`RawTransform` holds the concrete, resolved layout information for a widget. These values are absolute coordinates and sizes in terminal cells, derived after all layout calculations have been performed. Developers typically interact with `Transform` rather than `RawTransform` directly.

```rust
#[derive(Debug, Clone)]
pub struct RawTransform {
    pub x: u16,      // Absolute X-coordinate (column) of the widget's top-left corner.
    pub y: u16,      // Absolute Y-coordinate (row) of the widget's top-left corner.
    pub width: u16,  // Resolved width of the widget in cells.
    pub height: u16, // Resolved height of the widget in cells.
    pub px: u16,     // Resolved horizontal padding, derived from Transform.
    pub py: u16,     // Resolved vertical padding, derived from Transform.
}
```

### Associated Methods

#### `RawTransform::new() -> RawTransform`
Creates a new `RawTransform` instance with all fields set to `0`.

**Example:**
```rust
use osui::style::RawTransform;
let raw_t = RawTransform::new(); // x:0, y:0, width:0, height:0, px:0, py:0
```

## `Position`

`Position` defines how a widget is placed horizontally or vertically relative to its parent container.

```rust
#[derive(Debug, Clone)]
pub enum Position {
    /// Fixed position in cells from the origin (top/left).
    Const(u16),
    /// Centered in the parent's available space.
    Center,
    /// Aligned to the end (right for x, bottom for y) of the parent.
    End,
}
```

### Associated Methods

#### `Position::use_position(&self, size: u16, parent: u16, m: i32, r: &mut u16)`
Applies a `Position` rule to determine a final coordinate.
This method is used internally by `Transform::use_position` to resolve the `x` or `y` coordinate based on the widget's own size, its parent's available size, and any margin.

**Arguments:**
*   `size`: The widget's own resolved dimension (width for `x`, height for `y`).
*   `parent`: The parent's available dimension (parent width for `x`, parent height for `y`).
*   `m`: The margin value (mx for `x`, my for `y`).
*   `r`: A mutable reference to the `u16` where the resolved coordinate should be stored.

### Implementations

#### `impl From<u16> for Position`
Allows `u16` values to be implicitly converted to `Position::Const(value)`.

**Example:**
```rust
use osui::style::Position;
let pos_x: Position = 10; // Equivalent to Position::Const(10)
```

## `Dimension`

`Dimension` defines the sizing rule for a widget's width or height.

```rust
#[derive(Debug, Clone)]
pub enum Dimension {
    /// Fills the available space from the parent.
    Full,
    /// Automatically sized to fit content. The element determines its own size.
    Content,
    /// Fixed size in cells.
    Const(u16),
}
```

### Associated Methods

#### `Dimension::use_dimension(&self, parent: u16, r: &mut u16)`
Applies a `Dimension` rule to determine a final size.
This method is used internally by `Transform::use_dimensions` to resolve the `width` or `height`.

**Arguments:**
*   `parent`: The parent's available dimension (parent width for `width`, parent height for `height`).
*   `r`: A mutable reference to the `u16` where the resolved dimension should be stored.

### Implementations

#### `impl From<u16> for Dimension`
Allows `u16` values to be implicitly converted to `Dimension::Const(value)`.

**Example:**
```rust
use osui::style::Dimension;
let dim_w: Dimension = 50; // Equivalent to Dimension::Const(50)
```

## `Background`

`Background` defines the visual appearance of a widget's background.

```rust
#[derive(Debug, Clone)]
pub enum Background {
    /// Transparent / no background.
    NoBackground,
    /// Draws a basic rectangular outline using the given 24-bit RGB color.
    Outline(u32),
    /// Draws a rounded rectangular outline using the given 24-bit RGB color.
    RoundedOutline(u32),
    /// Fills the background with the specified 24-bit RGB color.
    Solid(u32),
}
```

## `Transform` (Component)

The `Transform` component is attached to widgets to define their layout rules using `Position` and `Dimension` enums.

```rust
component!(Transform {
    pub x: Position,
    pub y: Position,
    pub mx: i32, // Horizontal margin (offset)
    pub my: i32, // Vertical margin (offset)
    pub px: u16, // Horizontal padding (internal spacing)
    pub py: u16, // Vertical padding (internal spacing)
    pub width: Dimension,
    pub height: Dimension,
});
```

### Associated Methods

#### `Transform::new() -> Transform`
Creates a default `Transform` with top-left alignment (`Const(0)` for x/y), no margins or padding, and content sizing (`Dimension::Content`).

**Example:**
```rust
use osui::prelude::*;
let default_transform = Transform::new();
```

#### `Transform::center() -> Transform`
Shortcut for centering both horizontally and vertically. Sets `x: Position::Center` and `y: Position::Center`, with other fields as default.

**Example:**
```rust
use osui::prelude::*;
rsx! {
    @Transform::center();
    Div { "I am centered" }
}
```

#### `Transform::bottom(mut self) -> Self`
Fluent method to align the widget to the bottom of its parent. Sets `self.y = Position::End`.

**Example:**
```rust
use osui::prelude::*;
rsx! {
    @Transform::new().bottom();
    Div { "I am at the bottom" }
}
```

#### `Transform::right(mut self) -> Self`
Fluent method to align the widget to the right of its parent. Sets `self.x = Position::End`.

**Example:**
```rust
use osui::prelude::*;
rsx! {
    @Transform::new().right();
    Div { "I am at the right" }
}
```

#### `Transform::margin(mut self, x: i32, y: i32) -> Self`
Fluent method to add margin (offset) from the parent edge. Sets `self.mx = x` and `self.my = y`.

**Arguments:**
*   `x`: Horizontal margin. Positive moves right, negative moves left.
*   `y`: Vertical margin. Positive moves down, negative moves up.

**Example:**
```rust
use osui::prelude::*;
rsx! {
    @Transform::new().right().bottom().margin(-2, -1);
    Div { "2 cells from right, 1 cell from bottom" }
}
```

#### `Transform::padding(mut self, x: u16, y: u16) -> Self`
Fluent method to add internal spacing (padding) around the content. Sets `self.px = x` and `self.py = y`. This padding is added *inside* the widget's determined `width` and `height`.

**Arguments:**
*   `x`: Horizontal padding.
*   `y`: Vertical padding.

**Example:**
```rust
use osui::prelude::*;
rsx! {
    @Transform::new().dimensions(10, 3).padding(1, 0);
    Div { "Padded text" } // Text will be 1 cell in from left/right edges
}
```

#### `Transform::dimensions(mut self, width: u16, height: u16) -> Self`
Fluent method to set constant dimensions. Sets `self.width = Dimension::Const(width)` and `self.height = Dimension::Const(height)`.

**Arguments:**
*   `width`: Fixed width in cells.
*   `height`: Fixed height in cells.

**Example:**
```rust
use osui::prelude::*;
rsx! {
    @Transform::new().dimensions(20, 5);
    Div { "A 20x5 cell box" }
}
```

#### `Transform::use_dimensions(&self, parent_width: u16, parent_height: u16, raw: &mut RawTransform)`
Resolves the `Dimension` rules (`width`, `height`) into absolute values and updates the `raw.width` and `raw.height` fields of the provided `RawTransform`. This is an internal method called during the rendering pipeline.

#### `Transform::use_position(&self, parent_width: u16, parent_height: u16, raw: &mut RawTransform)`
Resolves the `Position` rules (`x`, `y`) into absolute coordinates and updates the `raw.x` and `raw.y` fields of the provided `RawTransform`. This is an internal method called during the rendering pipeline, usually *after* dimensions have been resolved.

## `Style` (Component)

The `Style` component defines the background and foreground appearance of a widget.

```rust
component!(Style {
    pub background: Background,
    pub foreground: Option<u32>, // 24-bit RGB color, or None for default
});
```

### Associated Methods

#### `Style::new() -> Self`
Creates a default `Style` with `NoBackground` and `foreground: None`.

**Example:**
```rust
use osui::prelude::*;
let default_style = Style::new();
```

**Usage with `rsx!`:**
```rust
use osui::prelude::*;

rsx! {
    @Transform::new().dimensions(20, 5);
    @Style { background: Background::Solid(0x550055), foreground: Some(0xFFFFFF) };
    Div { "Purple background, white text" }

    @Transform::new().dimensions(20, 5).margin(0, 6);
    @Style { background: Background::Outline(0x00FF00) };
    Div { "Green outline, default text color" }
}
```
