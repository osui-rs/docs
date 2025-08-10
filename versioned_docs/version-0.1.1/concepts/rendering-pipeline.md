# Rendering Pipeline and `RenderScope`

OSUI's rendering process is a structured sequence of operations managed by the `RenderScope`. This module centralizes the accumulation of drawing commands and their eventual flush to the terminal.

## The Role of `RenderScope`

`RenderScope` is a mutable context passed through the rendering process for each widget. It serves several key purposes:

*   **Layout Context**: It holds the current `RawTransform` (resolved position and dimensions) for the widget being rendered, derived from its `Transform` component and its parent's layout.
*   **Drawing Command Accumulation**: It acts as a temporary buffer for `RenderMethod` instructions (text, rectangles). Widgets and extensions add commands to this stack.
*   **Parent Size Tracking**: It keeps track of the available dimensions from the current widget's parent, crucial for resolving `Dimension::Full` and `Position::Center`/`End` rules.
*   **Style Application**: It carries the `Style` component for the current widget, influencing how drawing commands are eventually rendered (e.g., background fill, foreground color).

## The Rendering Sequence

When `Screen::render_widget` is called for a given `Arc<Widget>`, the following general pipeline is executed:

1.  **Clear Scope**: The `RenderScope` is cleared of any previous draw instructions, ensuring a clean slate for the current widget.
2.  **Apply Style (if present)**: If the widget has a `Style` component, it's applied to the `RenderScope`.
3.  **Apply Transform (Dimensions First)**: If the widget has a `Transform` component, its `use_dimensions` method is called. This resolves `Dimension` rules (`Full`, `Const`, `Content`) into the `RawTransform` based on the parent's size.
4.  **Element `render` Call**: The widget's `Element::render` method is invoked.
    *   Here, the `Element` issues its direct drawing commands (e.g., `scope.draw_text(...)`, `scope.draw_rect(...)`).
    *   Crucially, if the `Dimension` was `Content`, the `Element` is responsible for updating the `RenderScope`'s `RawTransform` width/height to enclose its drawn content (e.g., `scope.use_area`).
5.  **Extension `render_widget` Calls**: Any registered extensions have their `render_widget` hook called. Extensions can observe or modify the `RenderScope` or widget state at this point.
6.  **Re-Apply Transform (Positions Second)**: After the `Element` and extensions have had a chance to determine the *content size* (for `Dimension::Content`), the widget's `Transform::use_position` is called. This resolves `Position` rules (`Const`, `Center`, `End`) into the `RawTransform` using the now-finalized dimensions. Margins are also applied here.
7.  **`ElementRenderer::before_draw` Call**: An `ElementRenderer` trait hook is called. This is specifically used by "ghost" elements (like `Div` or `FlexRow`) to adjust the `RenderScope`'s transform *for their children*. For example, a `FlexRow` would update the `x`/`y` of the `RenderScope`'s internal `RawTransform` so that the next child starts at the correct position within the row.
8.  **`RenderScope::draw`**: The accumulated `RenderMethod` instructions within the `RenderScope`'s `render_stack` are flushed to the terminal. This involves:
    *   Drawing the background (if `Style::background` is `Solid`, `Outline`, or `RoundedOutline`).
    *   Iterating through `render_stack` and printing text or drawing rectangles at their resolved coordinates, applying foreground colors from `Style` or specific `TextColored` commands.
9.  **Element `after_render` Call**: The widget's `Element::after_render` method is invoked.
    *   This is typically where container elements (`Div`, `FlexRow`, `Paginator`) recursively trigger `scope.render_widget` for their children. They pass a *new* or modified `RenderScope` to their children, setting the `parent_width` and `parent_height` appropriately (e.g., the parent's own *content area*).
10. **Extension `after_render_widget` Calls**: Any registered extensions have their `after_render_widget` hook called. This allows extensions to perform post-rendering logic, such as updating internal state based on the final rendered transform (e.g., `RelativeFocusExtension` records widget positions).
11. **`widget.auto_refresh()`**: For `DynWidget`s, this checks if any registered dependencies have changed and, if so, triggers a `refresh()` to rebuild the widget for the next frame.

## Key Concepts in `RenderScope`

*   **`RenderMethod`**: An internal enum representing a single primitive drawing operation (Text, TextInverted, TextColored, Rectangle).
*   **`draw_text`, `draw_rect`, etc.**: Methods on `RenderScope` to add `RenderMethod`s to the `render_stack`. These methods also update the `RenderScope`'s internal `RawTransform` to account for the content's size, enabling `Dimension::Content` to work.
*   **`use_area(width, height)`**: Allows an `Element` to explicitly declare a minimum required width and height, which is useful when the content itself doesn't automatically dictate a size (e.g., a `Div` that just reserves space).
*   **Coordinate System**: All coordinates `(x, y)` are relative to the *current* `RenderScope`'s top-left corner. When `RenderScope::draw` is called, these relative coordinates are offset by the `RenderScope`'s absolute `transform.x` and `transform.y`. Padding (`px`, `py`) is also applied as an offset for content rendering.

This pipeline ensures that layout calculations are performed efficiently, drawing commands are batched, and elements are rendered within their correctly determined bounds, respecting both parent constraints and self-determined content sizes.
