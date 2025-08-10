# `osui::elements::heading`

The `Heading` element provides a way to render large, stylized text using FIGlet fonts (ASCII art). It's suitable for titles, banners, and decorative text in your terminal UI.

## `Heading` Struct

```rust
pub struct Heading {
    pub font: FIGfont,      // The FIGfont instance to use for rendering
    pub smooth: bool,       // If true, attempts to replace ASCII art characters with Unicode line drawing characters
    children: Vec<Arc<Widget>>, // Holds children, usually a single String element
}
```

### Associated Methods

#### `Heading::new() -> Heading`
Creates a new `Heading` instance. By default, it uses the `FIGfont::standard()` font and `smooth` is `false`.

**Example:**
```rust
use osui::prelude::*;
let my_heading = Heading::new();
```

### `Element` Trait Implementation

#### `render(&mut self, scope: &mut RenderScope, _: &RenderContext)`
This method performs the core rendering for the `Heading`.
1.  It iterates through its `children` (typically expects a single `String` child).
2.  It attempts to downcast the child's `Element` to a `String` and concatenates the text.
3.  It then uses the `FIGfont::convert` method to transform the accumulated text into ASCII art.
4.  If `self.smooth` is `true`, it replaces common ASCII art characters (`-` and `|`) with their Unicode line-drawing equivalents (`─` and `│`) for a cleaner look.
5.  Finally, it calls `scope.draw_text(0, 0, ...)` to render the generated ASCII art. The `RenderScope`'s width and height will automatically be updated by `draw_text` to encompass the size of the rendered ASCII art.

#### `draw_child(&mut self, element: &Arc<Widget>)`
This method is called when an element is declared as a child of the `Heading` (e.g., the text within its `rsx!` block).
1.  It injects a `NoRenderRoot` component into the child. This is important to ensure the child `String` element is not rendered independently by the main `Screen` loop, but rather its content is *read* by the `Heading` and then the `Heading` renders the ASCII art.
2.  It adds the `element` to its internal `children` `Vec`.

#### `is_ghost(&mut self) -> bool`
Returns `true`. `Heading` is a "ghost" element because it primarily processes and renders the content of its children into a new visual form (ASCII art) rather than directly displaying its own structural properties. Any background or other styling would be applied via a `Style` component on the `Heading`'s widget itself.

#### `as_any(&self) -> &dyn std::any::Any` / `as_any_mut(&mut self) -> &mut dyn std::any::Any`
Standard implementations for downcasting.

## Usage in `rsx!`

You typically pass the text for the `Heading` as a child. You can also set its `smooth` property.

```rust
use osui::prelude::*;

rsx! {
    // A standard FIGlet heading
    Heading { "OSUI" }

    // A smooth FIGlet heading, separated by a margin
    @Transform::new().margin(0, 5); // Add some vertical space
    Heading, smooth: true, { "Awesome!" }

    // Using Heading with dynamic text from state
    %my_dynamic_text_state
    Heading { format!("Hello {}", my_dynamic_text_state.get()) }
}
```
`Heading` is an easy way to add visual flair and prominence to titles in your TUI.
