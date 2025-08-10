# `osui::elements::flex`

The `flex` module provides `FlexRow` and `FlexCol` elements, which are powerful layout containers for automatically arranging their children either horizontally or vertically, with optional spacing. They are "ghost" elements, meaning they control the layout of their children but don't draw any visual elements themselves by default.

## `FlexRow` Struct

Arranges children in a row (horizontally).

```rust
pub struct FlexRow {
    pub gap: u16,           // Spacing in cells between adjacent children horizontally
    children: Vec<Arc<Widget>>,
    size: (u16, u16),       // Internal tracking of the FlexRow's calculated size
}
```

### Associated Methods

#### `FlexRow::new() -> Self`
Creates a new `FlexRow` instance with no children, no gap, and default size.

**Example:**
```rust
use osui::prelude::*;
let my_row = FlexRow::new();
```

### `Element` Trait Implementation for `FlexRow`

#### `render(&mut self, scope: &mut RenderScope, _: &RenderContext)`
Similar to `Div`, this method primarily ensures the `RenderScope`'s area reflects its calculated size. It doesn't draw anything visually for the `FlexRow` itself.

#### `after_render(&mut self, scope: &mut RenderScope, render_context: &RenderContext)`
This method calculates and applies the layout for its children:
1.  Clones the `RenderScope`'s `RawTransform` to use as a basis.
2.  Stores the original parent size from the `RenderScope`.
3.  Sets the `RenderScope`'s `parent_size` to its own (FlexRow's) determined `width` and `height`.
4.  Initializes `v = 0`; this variable tracks the current horizontal offset for placing children.
5.  Creates a `RowRenderer` helper which will modify `RenderScope`'s transforms for each child.
6.  Iterates through `self.children`, calling `scope.render_widget` for each. The `RowRenderer` updates the `x` position for each child and increments `v` to prepare for the next child.
7.  Restores the original `parent_size` to the `RenderScope`.
8.  Updates `self.size` based on the final accumulated width and maximum height of its children (as calculated by `RowRenderer`).

#### `draw_child(&mut self, element: &Arc<Widget>)`
Adds a child `Widget` to the `FlexRow`'s internal `children` list and injects `NoRenderRoot` into the child to prevent direct rendering by the main `Screen` loop.

#### `is_ghost(&mut self) -> bool`
Returns `true`, as `FlexRow` is a layout-only container.

#### `as_any(&self) -> &dyn std::any::Any` / `as_any_mut(&mut self) -> &mut dyn std::any::Any`
Standard implementations for downcasting.

## `FlexCol` Struct

Arranges children in a column (vertically).

```rust
pub struct FlexCol {
    pub gap: u16,           // Spacing in cells between adjacent children vertically
    children: Vec<Arc<Widget>>,
    size: (u16, u16),       // Internal tracking of the FlexCol's calculated size
}
```

### Associated Methods

#### `FlexCol::new() -> Self`
Creates a new `FlexCol` instance with no children, no gap, and default size.

**Example:**
```rust
use osui::prelude::*;
let my_col = FlexCol::new();
```

### `Element` Trait Implementation for `FlexCol`

The implementation mirrors `FlexRow`, but for vertical arrangement:

#### `render(&mut self, scope: &mut RenderScope, _: &RenderContext)`
Ensures `RenderScope` area is set. No direct drawing.

#### `after_render(&mut self, scope: &mut RenderScope, render_context: &RenderContext)`
1.  Clones `RawTransform`.
2.  Sets `RenderScope` `parent_size` to its own dimensions.
3.  Initializes `v = 0` (this variable tracks the current vertical offset).
4.  Creates a `ColumnRenderer` helper.
5.  Iterates `children`, calling `scope.render_widget`. The `ColumnRenderer` updates the `y` position for each child and increments `v` for the next child.
6.  Restores original `parent_size`.
7.  Updates `self.size` based on the accumulated height and maximum width of its children.

#### `draw_child(&mut self, element: &Arc<Widget>)`
Adds child and injects `NoRenderRoot`.

#### `is_ghost(&mut self) -> bool`
Returns `true`.

#### `as_any(&self) -> &dyn std::any::Any` / `as_any_mut(&mut self) -> &mut dyn std::any::Any`
Standard implementations.

## `RowRenderer` (Helper)

An `ElementRenderer` implementation specifically for `FlexRow` to adjust the `RenderScope` for its children's positions.

```rust
pub struct RowRenderer<'a>(&'a mut RawTransform, u16, &'a mut u16);
```

### `ElementRenderer` Trait Implementation for `RowRenderer`

#### `before_draw(&mut self, scope: &mut RenderScope, _widget: &Arc<Widget>)`
Called for each child of a `FlexRow` just before the child is drawn.
1.  Updates the `FlexRow`'s `RawTransform` (`self.0`) to encompass the child's area and the running horizontal offset.
2.  Adjusts the child's `RawTransform` (`t`) by the parent `FlexRow`'s absolute position and adds the current horizontal offset (`*self.2`).
3.  Increments `*self.2` (the running horizontal offset) by the child's width, its horizontal padding, and the `gap` to prepare for the next child.
4.  Adds the parent `FlexRow`'s padding to the child's `RawTransform` padding.

## `ColumnRenderer` (Helper)

An `ElementRenderer` implementation specifically for `FlexCol` to adjust the `RenderScope` for its children's positions.

```rust
pub struct ColumnRenderer<'a>(&'a mut RawTransform, u16, &'a mut u16);
```

### `ElementRenderer` Trait Implementation for `ColumnRenderer`

#### `before_draw(&mut self, scope: &mut RenderScope, _widget: &Arc<Widget>)`
Called for each child of a `FlexCol` just before the child is drawn.
1.  Updates the `FlexCol`'s `RawTransform` (`self.0`) to encompass the child's area and the running vertical offset.
2.  Adjusts the child's `RawTransform` (`t`) by the parent `FlexCol`'s absolute position and adds the current vertical offset (`*self.2`).
3.  Increments `*self.2` (the running vertical offset) by the child's height, its vertical padding, and the `gap` to prepare for the next child.
4.  Adds the parent `FlexCol`'s padding to the child's `RawTransform` padding.

## Usage in `rsx!`

```rust
use osui::prelude::*;

rsx! {
    // A FlexRow with 2 cells gap between items
    @Transform::new().padding(1,1);
    @Style { background: Background::Outline(0x00FF00) };
    FlexRow, gap: 2, {
        "First Item"
        Div { "Second Item (a Div)" }
        @Style { foreground: Some(0xFF0000) };
        "Third Item (Red Text)"
    }

    // A FlexCol with 1 cell gap, centered horizontally
    @Transform::new().x(Center).margin(0, 5); // Margin to separate from the row above
    @Style { background: Background::Outline(0x0000FF) };
    FlexCol, gap: 1, {
        "Column Item 1"
        Input { } // An input field
        "Column Item 3"
    }
}
```
Flex containers are powerful for building responsive and neatly aligned layouts without manual coordinate calculations.
