---
sidebar_position: 4
title: Render API
---

# Render Module API Reference

The `render` module provides the foundational primitives for drawing content to the terminal. It defines basic geometric types and the `DrawContext` for accumulating drawing instructions, abstracting away the specifics of the underlying terminal backend.

## Geometric Primitives

These structs define positions and dimensions within the terminal grid.

### `Point` Struct

```rust
#[derive(Clone)]
pub struct Point {
    pub x: u16, // X coordinate (column)
    pub y: u16, // Y coordinate (row)
}
```

Represents a specific coordinate in a 2D grid.

### `Size` Struct

```rust
#[derive(Clone)]
pub struct Size {
    pub width: u16,  // Width in terminal columns
    pub pub height: u16, // Height in terminal rows
}
```

Represents the dimensions of a rectangular area.

### `Area` Struct

```rust
#[derive(Clone)]
pub struct Area {
    pub x: u16,      // X coordinate (column) of the top-left corner
    pub y: u16,      // Y coordinate (row) of the top-left corner
    pub width: u16,  // Width in terminal columns
    pub height: u16, // Height in terminal rows
}
```

Represents a rectangular region defined by its top-left corner (`x`, `y`) and its `width` and `height`.

## `DrawInstruction` Enum

```rust
#[derive(Clone)]
pub enum DrawInstruction {
    Text(Point, String),
    View(Area, View),
    Child(Point, DrawContext), // For embedding child DrawContexts at an offset
}
```

`DrawInstruction` enumerates the different types of atomic drawing operations that the rendering engine can perform.

*   **`Text(Point, String)`**: Instructs the engine to draw a given `String` at a specific `Point`.
*   **`View(Area, View)`**: Instructs the engine to render a nested `View` within a specified `Area`. This is how child components are rendered.
*   **`Child(Point, DrawContext)`**: Instructs the engine to render a child `DrawContext` at a given offset `Point`. This is typically used internally when drawing recursively.

## `DrawContext` Struct

```rust
#[derive(Clone)]
pub struct DrawContext {
    pub area: Area,           // The total area available for drawing to this context
    pub allocated: Area,      // The union of all allocated sub-areas within this context
    pub drawing: Vec<DrawInstruction>, // Accumulated drawing instructions
}
```

The `DrawContext` is the primary interface for components to issue drawing commands. Each component's `View` receives a `DrawContext` that represents its allocated drawing space. It accumulates `DrawInstruction`s which are then processed by the `Engine`.

#### Methods:

*   **`fn new(area: Area) -> Self`**
    *   Creates a new `DrawContext` with the specified `area` as its total available space. Initializes `allocated` to an "empty" area (max `u16` for x/y, 0 for width/height).
*   **`fn allocate(&mut self, x: u16, y: u16, width: u16, height: u16) -> Area`**
    *   Marks a sub-region within the `DrawContext`'s `area` as "allocated".
    *   Updates the `self.allocated` field to grow to encompass this new allocation.
    *   Returns the `Area` representing the newly allocated space. Coordinates (`x`, `y`) are relative to `self.area`'s top-left corner.
*   **`fn draw(&mut self, inst: DrawInstruction)`**
    *   Adds a raw `DrawInstruction` to the `drawing` vector.
*   **`fn draw_text(&mut self, point: Point, text: &str)`**
    *   A convenience method to add a `DrawInstruction::Text` to the context. `point` is relative to `self.area`.
*   **`fn draw_view(&mut self, area: Area, view: View)`**
    *   A convenience method to add a `DrawInstruction::View` to the context. `area` is relative to `self.area`.

This module lays the groundwork for all visual output in OSUI, providing the necessary abstractions for components to describe what they want to render without knowing the specifics of the terminal backend.

**Next:** Explore the [State API](./state-api.md).
