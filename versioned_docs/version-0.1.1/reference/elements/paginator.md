# `osui::elements::paginator`

The `Paginator` element is a container that manages a collection of child widgets, displaying only one child at a time. It provides built-in logic to navigate between these "pages" using keyboard events (specifically, `Tab` and `Shift+Tab`).

## `Paginator` Struct

```rust
pub struct Paginator {
    children: Vec<Arc<Widget>>, // The list of pages/children
    size: (u16, u16),           // Internal tracking of the Paginator's calculated size
    index: usize,               // The index of the currently displayed child
}
```

### Associated Methods

#### `Paginator::new() -> Self`
Creates a new `Paginator` instance with no children and an initial `index` of `0`.

**Example:**
```rust
use osui::prelude::*;
let my_paginator = Paginator::new();
```

### `Element` Trait Implementation

#### `render(&mut self, scope: &mut RenderScope, _: &RenderContext)`
This method primarily focuses on setting the `RenderScope`'s area based on its calculated size. It does not draw any visual elements for the `Paginator` itself, acting as a "ghost" element.

#### `after_render(&mut self, scope: &mut RenderScope, render_context: &RenderContext)`
This is the core rendering logic for `Paginator`:
1.  It checks if `self.index` points to a valid child in `self.children`.
2.  If a child exists at the current `index`, it prepares a `RenderScope` (cloning its own `RawTransform`).
3.  It sets the `RenderScope`'s `parent_size` to its own (Paginator's) determined `width` and `height`, so the child lays out correctly within the Paginator's bounds.
4.  It creates a `DivRenderer` helper to manage the child's positioning.
5.  It calls `scope.render_widget` for *only the currently active child widget*.
6.  After the child is rendered, it restores the original `parent_size` to the `RenderScope`.
7.  It updates its internal `self.size` to reflect the size of the currently displayed child (plus any accumulated size from `DivRenderer`).

#### `event(&mut self, event: &dyn Event)`
This method handles keyboard events for navigation:
1.  It listens for `crossterm::event::Event::Key` events.
2.  If `KeyCode::Tab` is pressed:
    *   It increments `self.index`. If `self.index` goes beyond the last child, it wraps around to `0`.
3.  If `KeyCode::BackTab` (Shift+Tab) is pressed:
    *   It decrements `self.index`. If `self.index` goes below `0`, it wraps around to the last child.
These index changes will trigger a re-render in the next frame, displaying the new page.

#### `is_ghost(&mut self) -> bool`
Returns `true`. `Paginator` is a "ghost" element because it is a logical container that controls which of its children is visible, but it does not draw itself. Any styling applied to the `Paginator` widget will apply to the area it manages.

#### `draw_child(&mut self, element: &Arc<Widget>)`
This method is called when a widget is declared as a child of this `Paginator` in `rsx!`.
1.  It adds the `element` to its internal `children` `Vec`.
2.  It injects a `NoRenderRoot` component into the child to ensure the main `Screen` rendering loop doesn't render it directly (the `Paginator` handles rendering the active child).

#### `as_any(&self) -> &dyn std::any::Any` / `as_any_mut(&mut self) -> &mut dyn std::any::Any`
Standard implementations for downcasting.

## Usage in `rsx!`

The direct children of a `Paginator` element become its pages. You can use any other element (e.g., `Div`, `FlexCol`) as a page container.

```rust
use osui::prelude::*;

rsx! {
    // Paginator often needs explicit dimensions to define the space for its pages
    @Transform::new().dimensions(60, 20).center();
    @Style { background: Background::Solid(0x222222) }; // Optional background for the paginator's area
    Paginator {
        // Page 1: Simple text and instructions
        FlexCol {
            "Welcome to the first page!"
            "Press TAB to go to the next page."
        }

        // Page 2: Contains an input field
        FlexCol {
            "This is the second page."
            "Type something here:"
            @Transform::new().dimensions(30, 1);
            @Style { background: Background::Outline(0x555555) };
            Input { }
        }

        // Page 3: A heading
        FlexCol {
            Heading { "The End" }
            "This is the last page. Shift+TAB to go back."
        }
    }
}
```
`Paginator` is useful for organizing complex UIs into logical sections, preventing clutter, and improving user experience by allowing easy navigation between distinct views.
