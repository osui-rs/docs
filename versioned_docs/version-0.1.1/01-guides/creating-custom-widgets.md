# Creating Custom Widgets

While OSUI provides a rich set of built-in elements, you'll often need to create your own custom widgets to encapsulate specific UI logic or appearance. This guide walks you through implementing the `Element` trait and integrating your custom widget into the OSUI ecosystem.

## The `Element` Trait Revisited

As discussed in [Concepts: Widget Model](/docs/0.1.1/concepts/widget-model), the `Element` trait is the contract for anything that can be rendered.

```rust
pub trait Element: Send + Sync {
    // Draw commands for the element itself
    fn render(&mut self, scope: &mut RenderScope, render_context: &RenderContext);

    // Logic after self-rendering, typically for rendering children
    fn after_render(&mut self, scope: &mut RenderScope, render_context: &RenderContext);

    // Used by rsx! to register children
    fn draw_child(&mut self, element: &Arc<Widget>);

    // Handle incoming events
    fn event(&mut self, event: &dyn Event);

    // Is this element purely a logical/layout container (e.g., Div, FlexRow)?
    fn is_ghost(&mut self) -> bool;

    // Required for downcasting, usually implemented boilerplate
    fn as_any(&self) -> &dyn Any;
    fn as_any_mut(&mut self) -> &mut dyn Any;
}
```

## Example: A Simple `ClickableBox`

Let's create a box that displays a message and changes its background color when clicked.

### 1. Define the Element Struct

Our `ClickableBox` will hold its message, current color, and a list of children.

```rust
// src/elements/clickable_box.rs (or anywhere you organize your custom elements)

use std::sync::Arc;
use crossterm::event::{Event as CrosstermEvent, MouseEvent, MouseEventKind};
use crate::{prelude::*, NoRenderRoot}; // Import necessary OSUI items

pub struct ClickableBox {
    message: String,
    current_color: u32,
    default_color: u32,
    clicked_color: u32,
    children: Vec<Arc<Widget>>, // To hold potential nested elements
    // We'll track the size it renders to, important for parents
    size: (u16, u16),
}

impl ClickableBox {
    pub fn new(message: &str) -> Self {
        Self {
            message: message.to_string(),
            current_color: 0x0055AA, // Default blue
            default_color: 0x0055AA,
            clicked_color: 0xAA5500, // Orange when clicked
            children: Vec::new(),
            size: (0, 0),
        }
    }

    // A method to change color, useful for event handlers
    pub fn set_clicked(&mut self, clicked: bool) {
        self.current_color = if clicked { self.clicked_color } else { self.default_color };
    }
}
```

### 2. Implement the `Element` Trait

Now, let's implement the core `Element` trait methods.

```rust
// Continue in src/elements/clickable_box.rs

impl Element for ClickableBox {
    fn render(
        &mut self,
        scope: &mut RenderScope,
        render_context: &RenderContext,
    ) {
        // Draw the background rectangle based on current_color
        scope.draw_rect(0, 0, scope.get_transform().width, scope.get_transform().height, self.current_color);

        // Draw the message text, centered
        let (msg_w, msg_h) = utils::str_size(&self.message);
        let text_x = (scope.get_transform().width.saturating_sub(msg_w)) / 2;
        let text_y = (scope.get_transform().height.saturating_sub(msg_h)) / 2;
        scope.draw_text_colored(text_x, text_y, &self.message, 0xFFFFFF); // White text

        // Use the area based on the message size if dimensions are `Content`
        scope.use_area(msg_w, msg_h);

        // Update the size for the after_render pass and parent's layout
        self.size = (scope.get_transform().width, scope.get_transform().height);
    }

    fn after_render(
        &mut self,
        scope: &mut RenderScope,
        render_context: &RenderContext,
    ) {
        // This element is a container, so we need to render its children.
        // We'll pass them a new RenderScope nested within this box's area.
        let mut transform = scope.get_transform().clone();
        let mut child_renderer = DivRenderer(&mut transform); // Use DivRenderer helper for children

        let (parent_w, parent_h) = scope.get_parent_size(); // Store parent size
        scope.set_parent_size(self.size.0, self.size.1); // Set current element's size as parent for children

        for widget in &self.children {
            // Render each child widget using the context and the specialized renderer
            scope.render_widget(&mut child_renderer, render_context.get_context(), widget);
        }

        // Restore parent size for subsequent sibling elements
        scope.set_parent_size(parent_w, parent_h);
        // The `DivRenderer` updates `transform.width/height` to encompass children.
        // We need to propagate this up to our element's own calculated size.
        self.size = (transform.width, transform.height);
    }

    fn event(&mut self, event: &dyn Event) {
        // Listen for Crossterm Mouse Events
        if let Some(crossterm_event) = event.get::<CrosstermEvent>() {
            if let CrosstermEvent::Mouse(MouseEvent { kind: MouseEventKind::Down(_), column, row, .. }) = crossterm_event {
                // Check if the click occurred within our widget's bounds
                // This would require knowing the widget's absolute position on screen.
                // For simplicity here, we'll just toggle color on any click to demonstrate.
                // In a real app, you'd get the widget's RawTransform from an extension
                // or a global layout manager to check bounds.
                self.set_clicked(!self.current_color == self.clicked_color);
            }
        }
    }

    fn draw_child(&mut self, element: &Arc<Widget>) {
        // When a child is added (e.g., via rsx! nesting), store it.
        // Inject NoRenderRoot so OSUI's main loop doesn't try to render it directly.
        element.inject(|w| w.component(NoRenderRoot));
        self.children.push(element.clone());
    }

    fn is_ghost(&mut self) -> bool {
        // This element draws its own background, so it's not a ghost.
        false
    }

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn as_any_mut(&mut self) -> &mut dyn std::any::Any {
        self
    }
}
```

### 3. Integrate with `mod.rs` (Optional but Recommended)

Add your new element to `src/elements/mod.rs` so it's easily accessible via `osui::prelude::*`.

```rust
// src/elements/mod.rs (partial)
pub mod div;
// ... other elements
pub mod clickable_box; // Your new module!

pub use div::*;
// ... other elements
pub use clickable_box::*; // Export it for prelude
// ... String impl (already there)
```

### 4. Use Your Custom Widget in `rsx!`

Now you can use `ClickableBox` just like any other built-in element:

```rust
// src/main.rs (or your demo app)
use osui::prelude::*;
use osui::elements::ClickableBox; // Explicitly import if not using prelude

fn main() -> std::io::Result<()> {
    let screen = Screen::new();
    screen.extension(InputExtension); // For mouse events
    screen.extension(RelativeFocusExtension::new()); // Optional, but good practice
    // You'd also need a MouseExtension if you want raw mouse events on widgets.
    // For this basic example, `crossterm::event::Event` captures all.

    rsx! {
        // A ClickableBox with fixed dimensions and some nested text
        @Transform::new().dimensions(30, 5).center();
        ClickableBox::new("Click Me!") {
            // Nested content will be drawn by ClickableBox's after_render
            @Transform::new().y(3); // Position child text within the box
            "Nested content inside the box"
        }
    }
    .draw(&screen);

    screen.run()?;
    Ok(())
}
```
**Note on mouse events**: For a true click-detection, you'd need to compare `MouseEvent.column` and `MouseEvent.row` against the widget's actual rendered `RawTransform` coordinates. This typically involves an extension collecting widget positions or a global event dispatcher that routes events to widgets based on their bounds. The `Input` element handles focus and key events because it's built to capture those when focused.

By following this pattern, you can extend OSUI with a wide variety of custom UI components tailored to your application's specific needs.
