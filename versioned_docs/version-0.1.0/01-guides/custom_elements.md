# Building Custom Elements

OSUI's component-based architecture allows you to create your own UI elements by implementing the `Element` trait. This guide details how to define custom elements, render them, handle their children, and process events.

## The `Element` Trait

The `Element` trait is the core interface for any renderable UI component in OSUI. It defines methods that the rendering engine calls during the UI lifecycle.

```rust
pub trait Element: Send + Sync {
    /// Called to perform rendering for the element.
    fn render(&mut self, scope: &mut RenderScope);

    /// Called after rendering, for follow-up logic or cleanup.
    fn after_render(&mut self, scope: &mut RenderScope);

    /// Called to draw child widgets, if any.
    fn draw_child(&mut self, element: &Arc<Widget>);

    /// Called when an event occurs.
    fn event(&mut self, event: &dyn Event);

    /// Returns a type-erased reference to this object.
    fn as_any(&self) -> &dyn Any;

    /// Returns a mutable type-erased reference to this object.
    fn as_any_mut(&mut self) -> &mut dyn Any;
}
```

## Defining a Simple Custom Element

Let's create a very basic `Box` element that just draws a rectangle and its text content.

```rust
use osui::prelude::*;
use std::sync::Arc;

pub struct MyBox {
    // Children are typically stored if your element acts as a container
    children: Vec<Arc<Widget>>,
    // Internal state for managing the box's size, if not determined by children
    calculated_size: (u16, u16),
    pub border_color: u32, // Public field for RSX properties
    pub fill_color: u32,   // Public field for RSX properties
}

impl MyBox {
    // Constructor for use with `rsx!`
    pub fn new() -> Self {
        MyBox {
            children: Vec::new(),
            calculated_size: (0, 0),
            border_color: 0xAAAAAA, // Default gray border
            fill_color: 0x333333,   // Default dark fill
        }
    }
}

impl Element for MyBox {
    // Called when the element needs to render its own content.
    fn render(&mut self, scope: &mut RenderScope) {
        // Draw the background rectangle first
        scope.draw_rect(
            0,
            0,
            scope.get_transform().width,
            scope.get_transform().height,
            self.fill_color,
        );

        // Draw a border (outline)
        // Note: RenderScope's draw_rect doesn't draw outlines directly,
        // so we'd typically rely on `Style::Background::Outline` applied
        // as a component to the widget containing this element.
        // For a simple filled box, we can just draw the background.
        // If we wanted a distinct border *inside* the box, it'd be more complex.
        // For simplicity, we'll assume `Style` component handles outlines.

        // Get the current accumulated size from the scope,
        // which might have been influenced by child rendering in `after_render`.
        let (width, height) = scope.get_size_or(self.calculated_size.0, self.calculated_size.1);
        // Ensure the scope tracks at least this area for its own calculations.
        scope.use_area(width, height);
    }

    // Called after the element's `render` method and its children's `render` methods.
    // This is where container elements typically render their children.
    fn after_render(&mut self, scope: &mut RenderScope) {
        // Store the original parent size for restoration later
        let (original_parent_width, original_parent_height) = scope.get_parent_size();

        // Pass this element's resolved size as the parent size for its children.
        // This is crucial for children to correctly calculate their `Full` or `Center` dimensions.
        let self_transform = scope.get_transform().clone(); // Clone resolved transform for current element
        scope.set_parent_size(self_transform.width, self_transform.height);

        // Track max dimensions used by children for this box's overall size
        let mut max_child_width = 0;
        let mut max_child_height = 0;

        for child_widget in &self.children {
            // Children marked with NoRender or NoRenderRoot are handled by their direct parent
            // or the screen, not by this specific element's `after_render`.
            // This prevents double-rendering if they are also top-level widgets.
            if child_widget.get::<NoRender>().is_some() {
                continue;
            }

            scope.clear(); // Clear the scope for each child's rendering context

            // Apply any Transform or Style components attached directly to the child widget.
            if let Some(child_style) = child_widget.get() {
                scope.set_style(child_style);
            }
            if let Some(child_transform_comp) = child_widget.get() {
                scope.set_transform(&child_transform_comp);
            }

            // Render the child's own content. This fills its render_stack.
            child_widget.get_elem().render(scope);

            // Re-apply the transform *after* child render to ensure any content-based sizing
            // (Dimension::Content) is reflected in the child's `raw_transform.width/height`.
            if let Some(child_transform_comp) = child_widget.get() {
                scope.set_transform(&child_transform_comp);
            }

            // Get the child's now-resolved raw transform (position, size, padding)
            let child_raw_transform = scope.get_transform_mut();

            // Offset the child's actual drawing coordinates by the parent's position and padding.
            // This ensures children are drawn relative to their parent's content area.
            child_raw_transform.x += self_transform.x + self_transform.px;
            child_raw_transform.y += self_transform.y + self_transform.py;
            child_raw_transform.px += self_transform.px; // Accumulate padding
            child_raw_transform.py += self_transform.py; // Accumulate padding

            // Update the parent's (MyBox's) effective size based on its children.
            // This is crucial for MyBox to "auto-size" if it's `Dimension::Content`.
            max_child_width = max_child_width.max(
                child_raw_transform.x
                    + child_raw_transform.width
                    + (child_raw_transform.px * 2)
                    - self_transform.x
                    - self_transform.px, // Relative to parent content area
            );
            max_child_height = max_child_height.max(
                child_raw_transform.y
                    + child_raw_transform.height
                    + (child_raw_transform.py * 2)
                    - self_transform.y
                    - self_transform.py, // Relative to parent content area
            );


            scope.draw(); // Draw the child's accumulated render stack to the terminal.
            child_widget.get_elem().after_render(scope); // Recursively call after_render for child
        }

        // After all children are processed, update MyBox's calculated size.
        // Add back MyBox's own padding to the children's max extent.
        self.calculated_size = (
            max_child_width + (self_transform.px * 2),
            max_child_height + (self_transform.py * 2),
        );
        // Ensure the scope's own transform reflects the newly calculated size
        scope.use_area(self.calculated_size.0, self.calculated_size.1);

        // Restore the parent size for subsequent elements at this level.
        scope.set_parent_size(original_parent_width, original_parent_height);
    }

    // Called when a child widget is added to this element via `rsx!`.
    fn draw_child(&mut self, element: &Arc<Widget>) {
        // Mark the child as `NoRenderRoot` so the Screen doesn't try to render it directly.
        // This indicates that its rendering will be managed by this parent element's `after_render`.
        element.inject(|w| w.component(NoRenderRoot));
        self.children.push(element.clone());
    }

    // Handles incoming events for this element.
    fn event(&mut self, event: &dyn Event) {
        // You can check for specific event types
        if let Some(key_event) = event.get::<crossterm::event::Event>() {
            // Example: Respond to a key press
            if let crossterm::event::Event::Key(ke) = key_event {
                // println!("MyBox received key: {:?}", ke.code); // For debugging
            }
        }
        // You might also want to pass events to children,
        // though OSUI's default event system often dispatches globally.
    }

    // Required for downcasting the trait object.
    fn as_any(&self) -> &dyn Any {
        self
    }
    fn as_any_mut(&mut self) -> &mut dyn Any {
        self
    }
}
```

## Using Your Custom Element in `rsx!`

After defining `MyBox`, you can use it just like any other built-in element:

```rust
use osui::prelude::*;

// In your main or app function:
rsx! {
    @Transform::new().dimensions(50, 10); // Set a fixed size for the box
    MyBox, border_color: 0xFF0000, fill_color: 0x0000FF, {
        ("Hello from inside MyBox!", 0xFFFFFF)
        Div {
            "Another nested div!"
        }
    }
}.draw(&screen);
```

## Key Considerations for Custom Elements

*   **`render()` vs. `after_render()`**:
    *   `render()`: Use this for drawing the element's *own* content (e.g., text, background shapes). It should use the `RenderScope` to queue drawing commands.
    *   `after_render()`: Use this for container logic, specifically iterating through `self.children` and rendering them. It needs to manage the `RenderScope`'s parent size and transform for each child.
*   **`draw_child()`**: This method is called by the `rsx!` macro when you nest elements inside your custom element. You *must* store the `Arc<Widget>` in a `Vec` or similar structure.
    *   Crucially, you should also call `element.inject(|w| w.component(NoRenderRoot));`. This tells the main `Screen` loop to *not* render this child directly at the root level, as its rendering will be managed by its parent (`MyBox` in this case).
*   **`as_any()` / `as_any_mut()`**: These are boilerplate methods required for downcasting trait objects, allowing you to retrieve specific `Element` or `Component` types from a `Box<dyn Element>` or `Box<dyn Component>`.
*   **`RenderScope` Usage**:
    *   `scope.set_transform(&t)`: Applies a `Transform` component's rules to calculate the absolute position and size (`RawTransform`) for the current scope, based on its parent's size.
    *   `scope.get_transform()` / `scope.get_transform_mut()`: Accesses the `RawTransform` that represents the current element's resolved position and size.
    *   `scope.set_parent_size(width, height)`: Critical for nested elements. Before rendering a child, set the `scope`'s parent size to *this element's* resolved size so the child can correctly resolve its `Dimension::Full` or `Position::Center` values. Remember to restore the original parent size after processing all children.
    *   `scope.use_area(width, height)`: In your `render` method, if your element's size depends on its content or a fixed size, use this to tell the `RenderScope` what minimum area your element occupies. This helps when the element's `Dimension` is `Content`.
*   **State Management**: If your custom element needs to hold dynamic data, consider using `osui::state::State<T>` for reactive updates, especially if you want your element to trigger re-renders of itself or its children when its internal data changes.

By following these guidelines, you can create sophisticated and well-integrated custom UI elements that extend OSUI's capabilities to fit your application's unique needs.



