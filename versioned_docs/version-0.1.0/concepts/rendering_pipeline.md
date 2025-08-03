# Rendering Pipeline

OSUI's rendering pipeline orchestrates how your declarative UI definitions are translated into actual terminal output. It involves several distinct stages and components working in concert to efficiently draw frames to the screen.

## Overview of the Pipeline

The rendering process is driven by the `Screen::run()` method, which enters a continuous loop. Within each iteration of this loop (a "frame"), the `Screen::render()` method executes the core pipeline:

1.  **Clear Screen**: The entire terminal is cleared to prepare for a new frame.
2.  **Initialize Render Scope**: A `RenderScope` is created or reset for each top-level widget. This scope provides the drawing context for the current element.
3.  **Extension Pre-Render Hook**: Registered `Extension`s can inject logic *before* a widget's main rendering via their `render_widget` method.
4.  **Element Rendering (`Element::render`)**: The widget's root `Element` is asked to draw its own content into the `RenderScope`. This queues drawing commands.
5.  **Transform Resolution**: The `Transform` component's rules (`Position`, `Dimension`) are applied to calculate the absolute `RawTransform` (position, size) of the element within the `RenderScope`.
6.  **Child Rendering (`Element::after_render` for containers)**: If the current `Element` is a container (like `Div`, `FlexRow`, etc.), its `after_render` method recursively initiates the rendering pipeline for each of its children. This involves setting up a new `RenderScope` context for each child.
7.  **Flush to Terminal (`RenderScope::draw`)**: Once all drawing commands for an element (and its children) are queued within its `RenderScope`, the `RenderScope::draw()` method translates these commands into ANSI escape codes and writes them to the terminal.
8.  **Extension Post-Render/Cleanup Hook**: The `Element::after_render` method is also used for cleanup or final adjustments after drawing children.
9.  **Reactivity Check (`Widget::auto_refresh`)**: For `DynWidget`s, a check is performed to see if any `State` dependencies have changed. If so, the widget is marked for rebuilding for the *next* frame.
10. **Throttle**: The loop pauses briefly to control the frame rate.

## Key Components in the Pipeline

### 1. `Screen`

The orchestrator. It holds the list of top-level `Widget`s, manages extensions, and drives the main rendering loop (`run()`, `render()`).

*   Initializes terminal raw mode.
*   Calls `Extension::init` on startup.
*   Manages the frame rate using `std::thread::sleep`.
*   Iterates through top-level widgets, initiating their rendering.
*   Calls `Extension::on_close` and restores terminal state on shutdown.

(See [Reference: Screen API](/docs/reference/screen_api.md) for more details)

### 2. `Widget` (`Arc<Widget>`)

The container for an `Element` and its `Component`s. It's the unit passed around the UI tree.

*   `StaticWidget`: Its `Element` is instantiated once.
*   `DynWidget`: Its `Element` can be re-instantiated (rebuilt) if its dependencies change. This rebuild happens *before* its `render` method is called in a subsequent frame.
*   Provides access to its `Element` (`get_elem()`) and `Component`s (`get()`, `set_component()`).

(See [Reference: Widget API](/docs/reference/widget_api.md) for more details)

### 3. `Element` (`Box<dyn Element>`)

The actual drawable logic. Each `Element` implementation defines how it appears.

*   `render(&mut self, scope: &mut RenderScope)`: Puts drawing instructions into the `RenderScope`.
*   `after_render(&mut self, scope: &mut RenderScope)`: For containers, this is where children are processed and recursively rendered. It's also where the element might determine its final `Dimension::Content` size based on children.
*   `draw_child(&mut self, element: &Arc<Widget>)`: Called by `rsx!` to establish parent-child relationships. Children processed by a parent are marked `NoRenderRoot` to prevent the `Screen` from rendering them independently.

(See [Reference: Widget API - Element Trait](/reference/widget_api#element-trait) and [Guides: Custom Elements](/docs/guides/custom_elements) for more details)

### 4. `RenderScope`

The drawing context for a single element. It's a mutable structure that holds:

*   The element's current `RawTransform` (absolute position and size).
*   The element's current `Style`.
*   The `parent_width` and `parent_height` (critical for relative layout calculations).
*   A `render_stack` of primitive drawing commands (text, rectangles).

*   `set_transform()`: Uses a `Transform` component to calculate the `RawTransform`.
*   `set_style()`: Applies a `Style` component.
*   `draw_text()`, `draw_rect()`, etc.: Queue drawing commands. These also update the scope's dimensions for `Dimension::Content` sizing.
*   `draw()`: Flushes all queued commands and the background style to the terminal using ANSI escape codes.
*   `clear()`: Resets the scope for the next element.
*   `set_parent_size()`: Crucial for container elements to establish the bounding box for their children.

(See [Reference: RenderScope API](/docs/reference/render_scope_api.md) for more details)

### 5. `Transform` and `Style` Components

These components, attached to a `Widget`, provide the declarative rules for layout and appearance.

*   `Transform`: Contains `Position` and `Dimension` rules, plus `margin` and `padding`. These are resolved into `RawTransform` by `RenderScope`.
*   `Style`: Contains `Background` and `foreground` color. Applied to `RenderScope`.

(See [Reference: Style API](/docs/reference/style_api.md) for more details)

### 6. `Extension`s

Extensions are hooks into the pipeline.

*   `Extension::render_widget(scope, widget)`: Called for each top-level widget *before* its `Element::render`. Allows extensions to inspect or modify the `RenderScope` or widget before rendering.

(See [Reference: Extensions API](/docs/reference/extensions_api.md) for more details)

## Flow Diagram (Conceptual)

```mermaid
graph TD
    A[Screen::run() Loop] --> B{Frame};
    B --> C[utils::clear()];
    C --> D{For each top-level Arc<Widget> w};
    D --> E{Create/Clear RenderScope (rs)};
    E --> F{Set rs.parent_size};
    F --> G{Get w's Transform & Style Components};
    G --> H{rs.set_transform(w.transform_comp)};
    H --> I{rs.set_style(w.style_comp)};
    I --> J{For each Extension ext};
    J --> K[ext.render_widget(rs, w)];
    K --> L[w.get_elem().render(rs)];
    L --> M{w.get_elem().after_render(rs)};
    M --> N{rs.draw()};
    N --> O{w.auto_refresh() if DynWidget};
    O --> P{Check for screen.close()};
    P --> Q[Wait 28ms];
    Q --> B;

    subgraph Element/Container Flow in M
        M_start[Element::after_render(scope)] --> M1{For each child_widget};
        M1 --> M2[child_scope = scope.clone()];
        M2 --> M3[child_scope.clear()];
        M3 --> M4[child_scope.set_parent_size(self_resolved_width, self_resolved_height)];
        M4 --> M5[child_scope.set_transform(child_transform_comp)];
        M5 --> M6[child_scope.set_style(child_style_comp)];
        M6 --> M7[child_widget.get_elem().render(child_scope)];
        M7 --> M8[child_widget.get_elem().after_render(child_scope)];
        M8 --> M9[child_scope.draw()];
        M9 --> M10{Next child / Return};
    end
```

Understanding this pipeline is crucial for debugging rendering issues, optimizing performance, and building advanced custom elements or extensions that interact deeply with OSUI's drawing logic.



