---
sidebar_position: 6
title: Building Complex Layouts
---

# Building Complex Layouts

OSUI provides foundational primitives for rendering text and components, allowing you to compose them into complex layouts. While OSUI doesn't include a built-in layout engine (like flexbox or grid), it exposes the `DrawContext` and geometric types (`Point`, `Area`, `Size`) that enable you to manually position elements or build your own layout components.

## The Rendering Pipeline

At its core, OSUI's rendering works by accumulating `DrawInstruction`s into a `DrawContext`. The engine then takes this `DrawContext` and executes the instructions to draw to the terminal.

1.  **`View`**: A component returns a `View`, which is essentially a closure that takes a mutable `DrawContext` and adds drawing instructions to it.
2.  **`DrawContext`**: This is the canvas for your component. It has an `area` (the total space available to the current component) and an `allocated` area (the space currently used by drawing instructions within that component).
3.  **`DrawInstruction`**: The actual commands to draw, like `Text`, `View` (for child components), or `Child` (for nested `DrawContext`s).

## Core Rendering Primitives

These types, found in the `osui::render` module, are essential for manual layout.

*   ### `Point`
    Represents a position `(x, y)` in terminal coordinates. `x` is column, `y` is row.
    ```rust
    pub struct Point {
        pub x: u16,
        pub y: u16,
    }
    ```

*   ### `Size`
    Represents `width` and `height` in terminal columns and rows.
    ```rust
    pub struct Size {
        pub width: u16,
        pub height: u16,
    }
    ```

*   ### `Area`
    Combines `Point` and `Size` to define a rectangular region.
    ```rust
    pub struct Area {
        pub x: u16,
        pub y: u16,
        pub width: u16,
        pub height: u16,
    }
    ```

## `DrawContext`: Your Drawing Canvas

Inside a `View` closure, you receive a mutable `DrawContext`. This is how you interact with the rendering system.

```rust
use osui::prelude::*;
use std::sync::Arc;

#[component]
fn MyCustomLayout(cx: &Arc<Context>, children: &Rsx) -> View {
    let children_view = children.view(&cx); // Convert Rsx children to a View

    Arc::new(move |ctx: &mut DrawContext| {
        // `ctx.area` gives you the total available space for this component.
        let available_width = ctx.area.width;
        let available_height = ctx.area.height;

        // --- Manual layout example: Two columns ---

        // Allocate space for the left column
        let left_col_area = ctx.allocate(
            ctx.area.x,
            ctx.area.y,
            available_width / 2,
            available_height,
        );

        // Draw some text in the left column
        ctx.draw_text(
            Point { x: left_col_area.x + 1, y: left_col_area.y + 1 },
            "Left Panel",
        );
        ctx.draw_text(
            Point { x: left_col_area.x + 1, y: left_col_area.y + 2 },
            &format!("Available: {}x{}", left_col_area.width, left_col_area.height),
        );

        // Allocate space for the right column
        let right_col_area = ctx.allocate(
            ctx.area.x + available_width / 2, // Start x at half width
            ctx.area.y,
            available_width / 2,
            available_height,
        );

        // Draw the children (passed to MyCustomLayout) into the right column
        // This effectively "moves" the children's rendering into this specific area.
        ctx.draw_view(
            right_col_area, // Children will render relative to this new area
            children_view.clone(),
        );

        // Draw more text in the right column
        ctx.draw_text(
            Point { x: right_col_area.x + 1, y: right_col_area.y + 1 },
            "Right Panel (Children Area)",
        );
    })
}

#[component]
fn App(cx: &Arc<Context>) -> View {
    rsx! {
        MyCustomLayout {
            rsx! {
                "Hello from the child content!"
                "This text should appear in the right panel."
            }
        }
    }.view(&cx)
}

pub fn main() {
    let engine = Console::new();
    engine.run(App {}).expect("Failed to run app");
}
```

### Key `DrawContext` Methods:

*   **`ctx.area`**: The `Area` that the *current component* has been allocated by its parent. All drawing coordinates are relative to `ctx.area.x` and `ctx.area.y`.
*   **`ctx.allocate(x, y, width, height)`**: This method marks a region within `ctx.area` as "used". It takes coordinates relative to `ctx.area`'s top-left corner (0,0 of its own space) and returns a new `Area` representing the allocated sub-region. It also updates `ctx.allocated` to be the union of all allocations so far within this `DrawContext`.
*   **`ctx.draw_text(point, text)`**: Adds a `Text` instruction. `point` is relative to `ctx.area`.
*   **`ctx.draw_view(area, view)`**: Adds a `View` instruction. This is how you tell the renderer to draw a child component (or another `View`) within a specific `area`. The `area` here is also relative to `ctx.area`. The child view will then receive this `area` as its own `ctx.area`.

### Building a Simple Layout Component

The `MyCustomLayout` component above demonstrates a basic two-column layout. You can create more sophisticated layout components by:

1.  **Calculating Sub-Regions**: Based on `ctx.area.width` and `ctx.area.height`, divide the space into logical sub-regions (e.g., header, footer, sidebar, main content).
2.  **Allocating Space**: Use `ctx.allocate()` to define these sub-regions.
3.  **Drawing Content**:
    *   For static text or background elements, use `ctx.draw_text()`.
    *   For child components, call `child_rsx.view(&cx)` to get their `View`, and then use `ctx.draw_view(sub_area, child_view)` to render them in their designated space.

### Tips for Layouts:

*   **Relative Positioning**: Always think of `Point` and `Area` coordinates as being *relative* to the `ctx.area` of the current `View` being rendered. The `Console` engine handles translating these relative coordinates to absolute terminal coordinates.
*   **No Overlapping**: Be mindful of overlapping areas. If you draw two things to the same `Point`, the last one drawn will overwrite the first. OSUI does not automatically manage Z-ordering.
*   **Responsive Design**: Consider how your layouts will adapt to different terminal sizes. You can use `ctx.area.width` and `ctx.area.height` to make calculations dynamic.
*   **Composition**: Layout components can themselves be children of other layout components, allowing you to build complex nested structures.

While implementing a full layout system like CSS Flexbox is beyond the scope of OSUI's core, these primitives empower you to craft highly customized and visually rich terminal interfaces by manually managing space and component placement.
