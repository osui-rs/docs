# `RenderScope` API Reference

The `RenderScope` is a crucial internal component of OSUI's rendering engine. It acts as a drawing canvas and context for individual widgets, accumulating drawing instructions (text, shapes, colors) and managing transformation states. Widgets use `RenderScope` to define what and where they want to draw, and the `Screen` then flushes these instructions to the terminal.

## `RenderScope` Struct

```rust
pub struct RenderScope {
    transform: RawTransform,
    render_stack: Vec<RenderMethod>, // Internal list of drawing commands
    parent_width: u16,
    parent_height: u16,
    style: Style,
}
```

*   `transform`: The `RawTransform` representing the current widget's absolute position and size. This is resolved from a `Transform` component.
*   `render_stack`: A queue of `RenderMethod` enums (internal) that define individual draw operations.
*   `parent_width`, `parent_height`: The dimensions of the *parent* container, used for resolving `Position::Center`, `Position::End`, and `Dimension::Full`.
*   `style`: The `Style` component currently applied to this scope.

## `RenderScope` Methods

### `RenderScope::new()`

Creates a new, empty `RenderScope` with default transform and style.

```rust
pub fn new() -> RenderScope
```

*   **Returns**: A new `RenderScope` instance.
*   **Usage**: Called internally by the `Screen` for each widget's render pass.

### `set_transform_raw(&mut self, transform: RawTransform)`

Directly sets the raw (absolute) transform for this scope. This bypasses the declarative `Transform` component rules.

```rust
pub fn set_transform_raw(&mut self, transform: RawTransform)
```

*   `transform`: The `RawTransform` to apply.
*   **Usage**: Rarely used directly by application developers; primarily for internal layout calculations or advanced custom elements.

### `set_transform(&mut self, transform: &Transform)`

Applies a declarative `Transform` component to this scope, resolving its position and dimensions into concrete values based on the `parent_width` and `parent_height`.

```rust
pub fn set_transform(&mut self, transform: &Transform)
```

*   `transform`: A reference to the `Transform` component.
*   **Usage**: Called by the `Screen` or a parent element before a child's `render` method to set up its coordinate system.

### `draw_text(&mut self, x: u16, y: u16, text: &str)`

Adds a plain text drawing instruction to the render stack. The text will be rendered relative to the `RenderScope`'s `x` and `y` coordinates, and will use the `RenderScope`'s current `style.foreground` if set.

```rust
pub fn draw_text(&mut self, x: u16, y: u16, text: &str)
```

*   `x`, `y`: Relative coordinates within the current `RenderScope`'s content area.
*   `text`: The string to draw.
*   **Side Effect**: Updates the `RenderScope`'s `transform.width` and `transform.height` to encompass the drawn text if it's larger than the current dimensions. This is how `Dimension::Content` works.

### `draw_text_inverted(&mut self, x: u16, y: u16, text: &str)`

Adds a text drawing instruction where the background and foreground colors are swapped.

```rust
pub fn draw_text_inverted(&mut self, x: u16, y: u16, text: &str)
```

*   `x`, `y`, `text`: Same as `draw_text`.
*   **Usage**: Useful for creating highlighted text, like a cursor in an input field.

### `draw_text_colored(&mut self, x: u16, y: u16, text: &str, color: u32)`

Adds a text drawing instruction with a specific 24-bit RGB foreground color. This color overrides the `RenderScope`'s `style.foreground` for this specific text.

```rust
pub fn draw_text_colored(&mut self, x: u16, y: u16, text: &str, color: u32)
```

*   `x`, `y`, `text`: Same as `draw_text`.
*   `color`: The 24-bit RGB color (e.g., `0xFF00FF`).

### `draw_rect(&mut self, x: u16, y: u16, width: u16, height: u16, color: u32)`

Adds a filled rectangle drawing instruction to the render stack.

```rust
pub fn draw_rect(&mut self, x: u16, y: u16, width: u16, height: u16, color: u32)
```

*   `x`, `y`: Relative top-left coordinates.
*   `width`, `height`: Dimensions of the rectangle.
*   `color`: The 24-bit RGB fill color.
*   **Side Effect**: Updates the `RenderScope`'s `transform.width` and `transform.height` to encompass the drawn rectangle if it's larger.

### `use_area(&mut self, width: u16, height: u16)`

Manually ensures that the `RenderScope`'s internal `transform.width` and `transform.height` are at least the specified values.

```rust
pub fn use_area(&mut self, width: u16, height: u16)
```

*   `width`, `height`: Minimum width and height to ensure.
*   **Usage**: For elements that might not draw content but have a conceptual size (e.g., a spacer, or a container that needs a minimum dimension).

### `draw(&self)`

Executes all accumulated drawing instructions in the `render_stack` and flushes them to the terminal. This also draws the `RenderScope`'s background style (`Style::Background`).

```rust
pub fn draw(&self)
```

*   **Behavior**:
    1.  Applies the `RenderScope`'s `style.background` (Solid, Outline, RoundedOutline).
    2.  Iterates through `render_stack`, applying text colors (if `style.foreground` is `Some`) or specific `draw_text_colored` colors, and drawing rectangles.
    3.  Uses `utils::print_liner` for efficient output.
*   **Usage**: Called internally by the `Screen` or parent elements after `render` and `after_render` for a child is complete.

### `clear(&mut self)`

Clears all accumulated drawing instructions, resets the `transform` to default (all zeros), and resets the `style` to `Style::new()`.

```rust
pub fn clear(&mut self)
```

*   **Usage**: Called by the `Screen` before rendering each top-level widget, and by container elements before rendering each of their children, to provide a clean drawing context.

### `get_size(&self) -> (u16, u16)`

Returns the current width and height of the `RenderScope` as determined by its `transform.width` and `transform.height`.

```rust
pub fn get_size(&self) -> (u16, u16)
```

### `get_size_or(&self, width: u16, height: u16) -> (u16, u16)`

Returns the current width and height, or falls back to the provided `width` and `height` if the current dimensions are zero.

```rust
pub fn get_size_or(&self, width: u16, height: u16) -> (u16, u16)
```

### `get_size_or_parent(&self) -> (u16, u16)`

Returns the current width and height, or falls back to the parent's dimensions (`parent_width`, `parent_height`) if the current dimensions are zero.

```rust
pub fn get_size_or_parent(&self) -> (u16, u16)
```

### `get_parent_size(&self) -> (u16, u16)`

Returns the width and height of the `RenderScope`'s parent container.

```rust
pub fn get_parent_size(&self) -> (u16, u16)
```

### `set_parent_size(&mut self, width: u16, height: u16)`

Sets the dimensions of the parent container for this `RenderScope`. This is crucial for children to correctly resolve `Dimension::Full`, `Position::Center`, and `Position::End`.

```rust
pub fn set_parent_size(&mut self, width: u16, height: u16)
```

*   **Usage**: Primarily used by container elements in their `after_render` method before rendering their children.

### `get_transform_mut(&mut self) -> &mut RawTransform`

Returns a mutable reference to the `RenderScope`'s internal `RawTransform`.

```rust
pub fn get_transform_mut(&mut self) -> &mut RawTransform
```

*   **Usage**: Allows elements or extensions to directly manipulate the resolved position and size.

### `get_transform(&self) -> &RawTransform`

Returns an immutable reference to the `RenderScope`'s internal `RawTransform`.

```rust
pub fn get_transform(&self) -> &RawTransform
```

### `set_style(&mut self, style: Style)`

Sets the `Style` for the current render scope. This style applies to subsequent drawing instructions unless overridden by a colored text instruction.

```rust
pub fn set_style(&mut self, style: Style)
```

*   `style`: The `Style` to apply.
*   **Usage**: Called by the `Screen` or a parent element before a child's `render` method to set up its visual appearance.

### `get_style(&mut self) -> &mut Style`

Gets a mutable reference to the current `Style` in the scope.

```rust
pub fn get_style(&mut self) -> &mut Style
```

`RenderScope` is the bridge between your declarative UI definitions and the actual terminal output. Understanding its methods is key to creating custom elements and mastering OSUI's rendering pipeline.



