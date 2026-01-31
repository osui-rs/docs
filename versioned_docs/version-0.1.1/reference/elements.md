# `osui::elements`

The `elements` module contains OSUI's built-in UI components, which serve as the fundamental building blocks for constructing your terminal user interfaces. These elements range from simple text to complex layout containers and interactive input fields.

## Core Element: `String`

In OSUI, a `String` (or anything that can be formatted into a `String`) implicitly acts as an `Element`. This allows you to directly embed text literals and interpolated strings within your `rsx!` markup.

### `Element` Trait Implementation for `String`

```rust
impl Element for String {
    fn render(
        &mut self,
        scope: &mut crate::render_scope::RenderScope,
        _: &crate::render_scope::RenderContext,
    ) {
        scope.draw_text(0, 0, self); // Draws the string at (0,0) relative to element's transform
    }

    fn is_ghost(&mut self) -> bool {
        true // String elements are "ghosts" – they don't draw their own background/border.
    }

    // as_any and as_any_mut implementations are boilerplate
    fn as_any(&self) -> &dyn std::any::Any { self }
    fn as_any_mut(&mut self) -> &mut dyn std::any::Any { self }
}
```

**Behavior:**
*   When a `String` is used as an element, its `render` method simply calls `scope.draw_text` to print itself.
*   It's marked as `is_ghost() -> true`, meaning it doesn't handle its own layout or background drawing. Its size contributes to its parent's `Dimension::Content` calculation.

**Usage:**
```rust
use osui::prelude::*;

rsx! {
    "Hello, World!" // Simple string literal
    format!("The answer is: {}", 42) // Formatted string
}
```

## Other Built-in Elements

The `elements` module exports several other essential UI elements, each with its own dedicated documentation:

*   **[`Div`](/docs/0.1.1/reference/elements/div)**: A generic, transparent container element used for grouping children and applying layout and style.
*   **[`FlexRow`](/docs/0.1.1/reference/elements/flex)**: A layout container that arranges its children horizontally in a row.
*   **[`FlexCol`](/docs/0.1.1/reference/elements/flex)**: A layout container that arranges its children vertically in a column.
*   **[`Heading`](/docs/0.1.1/reference/elements/heading)**: Renders large, stylized ASCII art text using `figlet-rs`.
*   **[`Input`](/docs/0.1.1/reference/elements/input)**: An interactive element for user text input.
*   **[`Paginator`](/docs/0.1.1/reference/elements/paginator)**: A container that manages multiple "pages" (children) and allows navigation between them.

These elements, combined with the `Transform` and `Style` components, provide a powerful foundation for building diverse and complex terminal user interfaces in OSUI.
