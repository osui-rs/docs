# Layout and Styling System

OSUI employs a two-phase approach to layout and rendering, driven by `Transform` and `RawTransform` structures, and provides expressive tools for styling elements using `Style`.

## The Two-Phase Transform Model

OSUI's layout system resolves abstract positioning and sizing rules into concrete pixel coordinates and dimensions. This is managed by two primary structures:

1.  **`Transform` (Configured Layout)**:
    *   This is the high-level struct that developers interact with.
    *   It defines abstract rules for position (`Position` enum) and dimension (`Dimension` enum), along with explicit margins (`mx`, `my`) and padding (`px`, `py`).
    *   `Transform` instances are typically attached to widgets as components using the `Transform` component or via the `transform!` macro.
    *   Examples: `Position::Center`, `Dimension::Full`, `Position::Const(10)`.

    ```rust
    // Example Transform definition
    component!(Transform {
        pub x: Position,
        pub y: Position,
        pub mx: i32,
        pub my: i32,
        pub px: u16,
        pub py: u16,
        pub width: Dimension,
        pub height: Dimension,
    });
    ```
    *   Methods like `center()`, `bottom()`, `right()`, `margin()`, `padding()`, and `dimensions()` provide a fluent API for configuration.

2.  **`RawTransform` (Resolved Layout)**:
    *   This struct holds the *concrete, absolute* `u16` values for `x`, `y`, `width`, `height`, `px`, and `py` after layout calculations have occurred.
    *   It represents the final calculated bounds and offsets for a widget on the virtual screen.
    *   Developers generally don't manipulate `RawTransform` directly; it's used internally by the `RenderScope` during the rendering phase.

    ```rust
    // Example RawTransform definition
    #[derive(Debug, Clone)]
    pub struct RawTransform {
        pub x: u16,
        pub y: u16,
        pub width: u16,
        pub height: u16,
        pub px: u16,
        pub py: u16,
    }
    ```

### How Resolution Works (`use_dimensions`, `use_position`)

When a widget is rendered, its `Transform` component is used by the `RenderScope` to resolve its abstract rules into a concrete `RawTransform`.

*   **`Transform::use_dimensions(parent_width, parent_height, raw_transform)`**:
    *   This method takes the `parent_width` and `parent_height` (the available space from the parent container) and updates the `raw_transform.width` and `raw_transform.height` based on the `Dimension` rules.
    *   `Dimension::Full` will set the raw dimension to the parent's available size.
    *   `Dimension::Const(n)` will set it to `n`.
    *   `Dimension::Content` means the dimension will be determined by the content drawn by the element itself (e.g., text length or explicit `use_area` calls).

*   **`Transform::use_position(parent_width, parent_height, raw_transform)`**:
    *   This method uses the widget's *resolved* `raw_transform.width` and `raw_transform.height` (after `use_dimensions`) along with `parent_width` and `parent_height` to determine the absolute `raw_transform.x` and `raw_transform.y`.
    *   `Position::Const(n)` sets the coordinate to `n`.
    *   `Position::Center` calculates the coordinate to center the widget within the parent.
    *   `Position::End` calculates the coordinate to align the widget to the end (right/bottom) of the parent.
    *   Margins (`mx`, `my`) are applied as offsets after the base position is calculated.

This separation allows for a clear definition of layout rules at design time (`Transform`) and their efficient resolution into precise screen coordinates at runtime (`RawTransform`).

## Styling with `Style`

The `Style` component defines the visual appearance of a widget. It primarily controls background and foreground colors.

```rust
component!(Style {
    pub background: Background,
    pub foreground: Option<u32>,
});

pub enum Background {
    NoBackground,
    Outline(u32),
    RoundedOutline(u32),
    Solid(u32),
}
```

*   **`background`**: Defines how the widget's background is rendered.
    *   `NoBackground`: The widget's area is transparent.
    *   `Outline(color)`: Draws a simple rectangular outline using the specified 24-bit RGB color.
    *   `RoundedOutline(color)`: Draws a rounded rectangular outline.
    *   `Solid(color)`: Fills the entire widget area with the specified 24-bit RGB color.
*   **`foreground`**: An `Option<u32>` representing the 24-bit RGB color for any text drawn within the widget. If `None`, default terminal foreground color is used.

**Usage:**

```rust
use osui::prelude::*;

// Example: A div with blue background and white text
rsx! {
    @Transform::new().dimensions(20, 5).padding(1,1);
    @Style { background: Background::Solid(0x0000FF), foreground: Some(0xFFFFFF) };
    Div {
        "This is a blue box with white text."
    }
}
```

By combining `Transform` and `Style` components, developers have precise control over the visual presentation and spatial arrangement of UI elements.
