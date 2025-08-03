# Layout System

OSUI's layout system is designed for flexibility and responsiveness in a grid-based terminal environment. It abstracts away absolute pixel calculations by allowing developers to define layout rules declaratively using `Transform`, `Position`, and `Dimension` components. The system then resolves these rules into concrete coordinates and sizes during the rendering phase.

## Core Principles

1.  **Parent-Child Relationship**: Layout is always relative to the parent container. A child element's position and size are determined by its own `Transform` and the dimensions of its immediate parent.
2.  **Two-Phase Calculation**:
    *   **Dimension Resolution**: First, `Dimension` rules (`Full`, `Content`, `Const`) are applied to determine the concrete width and height of an element.
    *   **Position Resolution**: Second, `Position` rules (`Const`, `Center`, `End`) are applied to determine the concrete `x` and `y` coordinates, using the newly resolved dimensions.
3.  **Content-Based Sizing**: Elements can automatically size themselves to fit their content (`Dimension::Content`), allowing for dynamic UI.
4.  **Padding and Margin**: Distinct concepts for internal spacing (padding) and external offset (margin).

## Key Components of Layout

### `Transform`

The central component for defining layout rules. It encapsulates all the properties that influence an element's position and size.

*   `x: Position`, `y: Position`: Define alignment along horizontal and vertical axes.
*   `width: Dimension`, `height: Dimension`: Define sizing along horizontal and vertical axes.
*   `px: u16`, `py: u16`: **Padding** - internal space between the element's border and its content/children. This increases the overall size of the element.
*   `mx: i32`, `my: i32`: **Margin** - an offset applied *after* the element's position is calculated. This creates space *around* the element relative to its parent's edges. Can be negative for overlap.

(See [Reference: Style API - Transform](/docs/reference/style_api#transform-component) for full details)

### `Position` Enum

Determines the `x` or `y` coordinate.

*   `Const(u16)`: Absolute coordinate from the top-left (0,0).
*   `Center`: Centers the element within the parent's available space on that axis.
*   `End`: Aligns the element to the right or bottom edge of the parent.

(See [Reference: Style API - Position](/docs/reference/style_api#position-enum) for full details)

### `Dimension` Enum

Determines the `width` or `height`.

*   `Full`: Takes up all available space from the parent on that axis.
*   `Content`: Sizes itself to fit its content (text) or children. This is dynamic.
*   `Const(u16)`: Fixed size in terminal cells.

(See [Reference: Style API - Dimension](/docs/reference/style_api#dimension-enum) for full details)

### `RawTransform` Struct

This is the internal, resolved representation of a `Transform`. After all calculations, a `Transform`'s declarative rules are converted into a `RawTransform` with concrete `u16` values for `x`, `y`, `width`, `height`, `px`, `py`. This `RawTransform` is then used by the `RenderScope` for actual drawing.

(See [Reference: Style API - RawTransform](/docs/reference/style_api#rawtransform-struct) for full details)

## Layout Calculation Flow (Simplified)

The layout process happens during the `Screen::render()` cycle, primarily managed by the `RenderScope` and parent `Element::after_render` methods.

1.  **Initialize `RenderScope`**: For each top-level widget (or for each child within a container element), a new or cleared `RenderScope` is prepared. Its `parent_width` and `parent_height` are set to the available space (either terminal size or the parent element's resolved size).

2.  **Apply `Transform` (Phase 1: Dimensions)**:
    *   The `Transform` component attached to the current widget is accessed.
    *   `Transform::use_dimensions()` is called. This method takes the `RenderScope`'s `parent_width` and `parent_height` and resolves the `width` and `height` `Dimension` rules into concrete `u16` values.
        *   If `Dimension::Full`, it takes the `parent_width`/`height`.
        *   If `Dimension::Const(n)`, it takes `n`.
        *   If `Dimension::Content`, it's initially set to `0` or left unchanged; its final value will be determined by the `Element::render` method (based on text size) or by `Element::after_render` (based on children's size).

3.  **Element Renders Content (`Element::render`)**:
    *   The `Element::render` method is called. It uses `RenderScope::draw_text()`, `draw_rect()`, etc., to queue drawing commands.
    *   Crucially, these `draw_*` methods automatically update the `RenderScope`'s internal `RawTransform.width` and `height` to be at least the size of the drawn content. This is how `Dimension::Content` gets its actual size.
    *   `Element`s can also explicitly use `scope.use_area(w, h)` to hint their minimum desired size.

4.  **Apply `Transform` (Phase 2: Position)**:
    *   After the `Element::render` has potentially updated the `RawTransform`'s `width` and `height` (for `Content` dimensions), `Transform::use_position()` is called.
    *   This method takes the now-resolved `RawTransform.width` and `height`, the `RenderScope`'s `parent_width`/`height`, and the `Transform`'s `mx`/`my` (margins) to calculate the final `RawTransform.x` and `y`.
        *   `Position::Const(n)`: Sets `x` or `y` to `n`.
        *   `Position::Center`: Calculates `(parent_size - element_size) / 2`.
        *   `Position::End`: Calculates `parent_size - element_size`.
        *   `mx`, `my` are then added or subtracted to these calculated base positions.

5.  **Child Rendering (`Element::after_render` for containers)**:
    *   For container elements (`Div`, `FlexRow`, `FlexCol`), their `after_render` method then steps in.
    *   Before rendering each child, the parent container performs a critical step: it sets the `RenderScope`'s `parent_width` and `parent_height` to *its own* newly resolved `RawTransform.width` and `height`. This creates a new layout context for the child.
    *   The parent also shifts the `RawTransform.x` and `y` of the child by its own resolved `x`, `y`, and `px`, `py` (padding), ensuring children are drawn relative to the parent's padded content area.
    *   The entire process (steps 2-5) recursively repeats for each child.
    *   After all children are rendered, the parent element might update its *own* `RawTransform.width` and `height` based on the maximum extent of its children, especially if its `Dimension` was `Content`.

6.  **Final Draw (`RenderScope::draw`)**: Once all elements and their children have queued their commands and positions are finalized, `RenderScope::draw()` translates these `RawTransform`-based instructions into actual terminal ANSI escape codes and prints them.

## Flex Layouts (`FlexRow`, `FlexCol`)

`FlexRow` and `FlexCol` elements implement a simpler sequential layout model on top of the core `Transform` system.

*   `FlexRow` (Column-like): Children are stacked vertically. Each child's `y` position is implicitly determined by the previous child's height plus the `gap`. Its `x` position is usually `0` relative to the `FlexRow`.
*   `FlexCol` (Row-like): Children are laid out horizontally. Each child's `x` position is implicitly determined by the previous child's width plus the `gap`. Its `y` position is usually `0` relative to the `FlexCol`.

These elements internally manage the cumulative position (`v` variable in source) for their children to ensure correct sequential placement.

By understanding this hierarchical and two-phase layout resolution, you can effectively predict and control how your OSUI elements will appear on the terminal.



