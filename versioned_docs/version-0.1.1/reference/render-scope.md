# `osui::render_scope`

The `render_scope` module defines the `RenderScope` struct, which is central to OSUI's drawing and layout process. It acts as a context for rendering operations, handling transformations, parent-child dimensions, and collecting drawing instructions before they are flushed to the terminal.

## `ElementRenderer` Trait

A trait that can be implemented by custom renderers, allowing them to hook into the drawing process right before `RenderScope::draw` is called. Used internally by container elements like `Div` and `Flex`.

```rust
pub trait ElementRenderer {
    /// Called right after the `after_render` function is called for a widget,
    /// just before the `RenderScope::draw` method is invoked.
    #[allow(unused)]
    fn before_draw(&mut self, scope: &mut RenderScope, widget: &Arc<Widget>) {}
}
```

## `RenderMethod` Enum

An internal enum representing a single primitive draw instruction. These methods are accumulated in `RenderScope`'s `render_stack`.

```rust
#[derive(Clone)]
enum RenderMethod {
    /// Plain text rendering at current transform. (x, y, text)
    Text(u16, u16, String),
    /// Plain text rendering at current transform with foreground/background swapped. (x, y, text)
    TextInverted(u16, u16, String),
    /// Text rendered with a specific 24-bit color. (x, y, text, color)
    TextColored(u16, u16, String, u32),
    /// A filled rectangle of a given size and background color. (x, y, width, height, color)
    Rectangle(u16, u16, u16, u16, u32),
}
```

## `RenderScope`

`RenderScope` is the primary context object passed around during the rendering phase. It contains mutable state for the current widget's layout, style, and accumulated draw commands.

```rust
#[derive(Clone)]
pub struct RenderScope {
    transform: RawTransform, // Resolved layout (position, dimensions, padding)
    render_stack: Vec<RenderMethod>, // Stack of drawing instructions
    parent_width: u16,       // Width of the parent container
    parent_height: u16,      // Height of the parent container
    style: Style,            // Current style applied to this scope
}
```

### Associated Methods

#### `RenderScope::new() -> RenderScope`
Creates a new, empty `RenderScope` with default `RawTransform` and `Style`.

#### `RenderScope::set_transform_raw(&mut self, transform: RawTransform)`
Directly sets the internal `RawTransform` for this scope. This is usually managed internally or by `ElementRenderer`s.

#### `RenderScope::set_transform(&mut self, transform: &Transform)`
Applies a high-level `Transform` configuration to this scope. This method resolves the `Position` and `Dimension` rules into the concrete `RawTransform` based on the `parent_width` and `parent_height` of the scope. It also applies padding (`px`, `py`).

#### `RenderScope::draw_text(&mut self, x: u16, y: u16, text: &str)`
Adds a plain text draw instruction to the `render_stack`.
The `(x, y)` coordinates are relative to the current `RenderScope`'s top-left corner (after its `Transform` is applied and considering padding). This method also updates the `RenderScope`'s `RawTransform` width and height if the drawn text exceeds the current content size, which is important for `Dimension::Content`.

#### `RenderScope::draw_text_inverted(&mut self, x: u16, y: u16, text: &str)`
Adds a text draw instruction where the foreground and background colors are swapped (inverted).

#### `RenderScope::draw_text_colored(&mut self, x: u16, y: u16, text: &str, color: u32)`
Adds a text draw instruction with a specific 24-bit RGB foreground `color`.

#### `RenderScope::draw_rect(&mut self, x: u16, y: u16, width: u16, height: u16, color: u32)`
Adds a filled rectangle draw instruction. The `(x, y)` coordinates are relative to the current `RenderScope`'s top-left corner. This method also updates the `RenderScope`'s `RawTransform` width and height if the rectangle exceeds the current content size.

#### `RenderScope::use_area(&mut self, width: u16, height: u16)`
Manually ensures that the `RenderScope`'s `RawTransform` has at least the specified `width` and `height`. This is useful for elements with `Dimension::Content` that might not draw explicit text or rectangles but still need to claim space.

#### `RenderScope::draw(&self)`
Flushes all accumulated `RenderMethod` instructions in the `render_stack` to the actual terminal. This method also draws any background defined by the `Style` component (e.g., solid fill, outline) *before* the text/rectangle commands.

#### `RenderScope::clear(&mut self)`
Clears all accumulated render instructions and resets the internal `RawTransform` and `Style` to defaults. This is called at the beginning of rendering each new widget.

#### `RenderScope::get_size(&self) -> (u16, u16)`
Returns the current width and height of the `RenderScope`'s internal `RawTransform`. This represents the *calculated* size of the widget's content area.

#### `RenderScope::get_size_or(&self, width: u16, height: u16) -> (u16, u16)`
Returns the current size. If the current width or height is `0`, it defaults to the provided `width` or `height` respectively.

#### `RenderScope::get_size_or_parent(&self) -> (u16, u16)`
Returns the current size. If the current width or height is `0`, it defaults to the `parent_width` or `parent_height` respectively.

#### `RenderScope::get_parent_size(&self) -> (u16, u16)`
Returns the width and height of the parent container that this `RenderScope` is operating within. This is crucial for `Dimension::Full` and `Position::Center`/`End` calculations.

#### `RenderScope::set_parent_size(&mut self, width: u16, height: u16)`
Sets the dimensions of the parent container for this `RenderScope`. Container elements (like `Div`, `FlexRow`) use this to define the available space for their children.

#### `RenderScope::get_transform_mut(&mut self) -> &mut RawTransform`
Returns a mutable reference to the internal `RawTransform`. Use with caution.

#### `RenderScope::get_transform(&self) -> &RawTransform`
Returns an immutable reference to the internal `RawTransform`.

#### `RenderScope::set_style(&mut self, style: Style)`
Sets the `Style` for the current render scope. This style will apply to any `draw_text` or background drawing operations within this scope.

#### `RenderScope::get_style(&mut self) -> &mut Style`
Returns a mutable reference to the `Style` currently applied to this scope.

#### `RenderScope::render_widget(&mut self, renderer: &mut dyn ElementRenderer, ctx: &crate::extensions::Context, widget: &std::sync::Arc<crate::widget::Widget>) -> bool`
This is the central function for rendering a single widget and its associated process. It performs:
1.  Clears the `RenderScope`.
2.  Applies `Style` and `Transform` components to the `RenderScope`.
3.  Calls the widget's `Element::render` method.
4.  Calls `Context::render` (extension hook `render_widget`).
5.  Re-applies `Transform` (for final position based on calculated size).
6.  Calls `ElementRenderer::before_draw` (for parent-controlled child positioning).
7.  Calls `RenderScope::draw` to flush commands to terminal.
8.  Calls the widget's `Element::after_render` method.
9.  Calls `Context::after_render` (extension hook `after_render_widget`).
10. Calls `widget.auto_refresh()` for dynamic widgets.

**Returns:**
`true` if the widget was rendered, `false` if it had a `NoRender` component.

## `RenderContext`

A wrapper around the global `Context` that also indicates whether the currently rendering widget is focused.

```rust
pub struct RenderContext(Context, bool);
```

### Associated Methods

#### `RenderContext::new(c: &Context, focused: bool) -> Self`
Creates a new `RenderContext`.

#### `RenderContext::is_focused(&self) -> bool`
Returns `true` if the widget associated with this `RenderContext` is currently focused. Elements often use this to draw a focus indicator.

#### `RenderContext::render(&self, w: &Arc<Widget>, scope: &mut RenderScope)`
Delegates to `Context::render`, allowing the widget to trigger extension `render_widget` hooks.

#### `RenderContext::after_render(&self, w: &Arc<Widget>, scope: &mut RenderScope)`
Delegates to `Context::after_render`, allowing the widget to trigger extension `after_render_widget` hooks.

#### `RenderContext::get_context(&self) -> &Context`
Returns an immutable reference to the underlying global `Context`.
