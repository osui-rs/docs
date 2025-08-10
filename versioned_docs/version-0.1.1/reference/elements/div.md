# `osui::elements::div`

The `Div` element is a fundamental building block in OSUI, serving as a generic, transparent container. It doesn't have its own visual representation by default but is primarily used for grouping other elements and applying layout (`Transform`) and styling (`Style`) to a collection of children.

## `Div` Struct

```rust
pub struct Div {
    children: Vec<Arc<Widget>>, // Children widgets contained within this Div
    size: (u16, u16),           // Internal tracking of the Div's calculated size
}
```

### Associated Methods

#### `Div::new() -> Self`
Creates a new `Div` instance with no children and default size.

**Example:**
```rust
use osui::prelude::*;
let my_div = Div::new(); // Create a Div programmatically
```

### `Element` Trait Implementation

#### `render(&mut self, scope: &mut RenderScope, _: &RenderContext)`
This method, for `Div`, primarily focuses on setting the `RenderScope`'s area based on its calculated size or default values. It does *not* issue any direct drawing commands (e.g., `draw_text`, `draw_rect`) for itself, as `Div` is transparent by default.

#### `after_render(&mut self, scope: &mut RenderScope, render_context: &RenderContext)`
This is the crucial method for container elements like `Div`. It's called after the `Div` itself has been processed by the rendering pipeline.
1.  It clones the `RenderScope`'s `RawTransform` to use as a basis for its children's layout.
2.  It creates a `DivRenderer` (an `ElementRenderer` helper) which will adjust child positions relative to the `Div`.
3.  It temporarily sets the `RenderScope`'s `parent_size` to its own calculated content area. This ensures that children using `Dimension::Full` or `Position::Center`/`End` resolve correctly within the `Div`'s bounds.
4.  It iterates through its `children` and calls `scope.render_widget` for each, effectively triggering the rendering pipeline for its nested elements.
5.  After children are rendered, it restores the original `parent_size` to the `RenderScope`.
6.  It updates its internal `self.size` based on the accumulated size of its children (as reported by `DivRenderer`).

#### `draw_child(&mut self, element: &Arc<Widget>)`
This method is called by the `rsx!` macro or `Rsx::draw_parent` when a widget is declared as a child of this `Div`.
1.  It adds the `element` to its internal `children` `Vec`.
2.  It injects a `NoRenderRoot` component into the child widget. This is critical: it tells the main `Screen` rendering loop *not* to render this child directly, as the `Div` itself will handle its rendering in `after_render`. This prevents double-rendering and ensures correct layout.

#### `is_ghost(&mut self) -> bool`
Returns `true`. A `Div` is a "ghost" element because it primarily serves as a logical grouping and layout container and does not draw any visual representation (like a background or border) itself. Any visual properties are applied via external `Style` components associated with the `Div`'s widget.

#### `as_any(&self) -> &dyn std::any::Any` / `as_any_mut(&mut self) -> &mut dyn std::any::Any`
Standard implementations for downcasting.

## `DivRenderer`

A helper struct that implements `ElementRenderer` specifically for `Div` to adjust the `RenderScope` for its children.

```rust
pub struct DivRenderer<'a>(pub &'a mut RawTransform);
```

### `ElementRenderer` Trait Implementation for `DivRenderer`

#### `before_draw(&mut self, scope: &mut RenderScope, _widget: &Arc<Widget>)`
This method is called for each child widget of the `Div` just before that child is drawn.
1.  It updates the `Div`'s own `RawTransform` (`self.0`) to expand its `width` and `height` to encompass the child's area plus its padding.
2.  It translates the child's `RawTransform` (`t`) by the `Div`'s absolute position and padding. This ensures children are positioned correctly *inside* the `Div`.
3.  It updates the child's `RawTransform` padding by adding the `Div`'s padding.

## Usage in `rsx!`

```rust
use osui::prelude::*;

rsx! {
    // A Div with a solid background and padding, containing text and a FlexRow
    @Transform::new().dimensions(40, 10).center().padding(2, 1);
    @Style { background: Background::Solid(0x333333), foreground: Some(0xFFFFFF) };
    Div {
        "This is content inside the Div."
        "It will respect the Div's padding and dimensions."

        FlexRow, gap: 1, {
            "Nested"
            "FlexRow"
            "Elements"
        }
    }
}
```
`Div` is an essential tool for structuring your UI, applying common styles, and managing the layout of groups of widgets.
