# `osui::Screen`

The `Screen` struct is the central orchestrator of an OSUI application. It manages the UI tree (widgets), registers extensions, and runs the main rendering and event loop. It's the primary entry point for setting up and running your terminal user interface.

## Struct Definition

```rust
pub struct Screen {
    pub widgets: Mutex<Vec<Arc<Widget>>>,
    extensions: Mutex<Vec<Arc<Mutex<Box<dyn Extension + Send + Sync>>>>>,
    running: Mutex<bool>,
}
```

*   **`widgets`**: A `Mutex` protecting a `Vec` of `Arc<Widget>`. This holds the top-level widgets that `Screen` is responsible for rendering.
*   **`extensions`**: A `Mutex` protecting a `Vec` of registered `Extension` implementations. Extensions provide global behaviors and hooks into the rendering and event pipeline.
*   **`running`**: A `Mutex<bool>` flag controlling the main event loop's execution.

## Associated Items

### Methods

#### `Screen::new() -> Arc<Self>`
Creates a new `Screen` instance wrapped in an `Arc`.
It's recommended to always create the `Screen` this way, as its `Arc` can then be easily cloned and passed to extensions or other parts of your application without moving ownership.

**Example:**
```rust
use osui::prelude::*;
let screen = Screen::new();
```

#### `Screen::draw<E: Element + 'static + Send + Sync>(self: &Arc<Self>, element: E) -> Arc<Widget>`
Draws a static element to the screen and returns its `Arc<Widget>` handle.
This is a convenience method that wraps the provided `Element` into a `StaticWidget`.

**Arguments:**
*   `element`: An instance of a type that implements the `Element` trait.

**Returns:**
An `Arc<Widget>` representing the newly drawn static widget.

**Example:**
```rust
use osui::prelude::*;
let screen = Screen::new();
let my_text_widget = screen.draw("Hello, Static World!");
```

#### `Screen::draw_box(self: &Arc<Self>, element: BoxedElement) -> Arc<Widget>`
Draws a boxed `Element` to the screen and returns its `Arc<Widget>` handle.
Similar to `draw`, but takes a `BoxedElement` directly.

**Arguments:**
*   `element`: A `Box<dyn Element + Send + Sync>`.

**Returns:**
An `Arc<Widget>` representing the newly drawn static widget.

**Example:**
```rust
use osui::prelude::*;
let screen = Screen::new();
let my_div_widget = screen.draw_box(Box::new(Div::new()));
```

#### `Screen::draw_dyn<F: FnMut() -> WidgetLoad + 'static + Send + Sync>(self: &Arc<Self>, element: F) -> Arc<Widget>`
Draws a dynamic element (reactive widget) to the screen, built from a closure, and returns its `Arc<Widget>` handle.
This method creates a `DynWidget` that can re-evaluate its content based on dependencies.

**Arguments:**
*   `element`: A closure that, when called, returns a `WidgetLoad`. This closure defines how the dynamic widget's content is generated.

**Returns:**
An `Arc<Widget>` representing the newly drawn dynamic widget.

**Example:**
```rust
use osui::prelude::*;
let screen = Screen::new();
let counter_state = use_state(0);
let dynamic_text_widget = screen.draw_dyn({
    let counter_clone = counter_state.clone();
    move || {
        WidgetLoad::new(format!("Count: {}", counter_clone.get()))
    }
});
```

#### `Screen::draw_box_dyn(self: &Arc<Self>, element: Box<dyn FnMut() -> WidgetLoad + Send + Sync>) -> Arc<Widget>`
Draws a dynamic element from a boxed closure and returns its `Arc<Widget>` handle.
Similar to `draw_dyn`, but takes a boxed closure directly.

**Arguments:**
*   `element`: A `Box<dyn FnMut() -> WidgetLoad + Send + Sync>`.

**Returns:**
An `Arc<Widget>` representing the newly drawn dynamic widget.

#### `Screen::draw_widget(self: &Arc<Self>, widget: Arc<Widget>)`
Adds an existing `Arc<Widget>` to the screen's managed widget list.
This is used internally by `draw` and `draw_dyn` but can be called directly if you're constructing `Arc<Widget>` instances manually.

**Arguments:**
*   `widget`: The `Arc<Widget>` to add.

**Notes:**
*   The first widget added to the screen via any `draw` method or `draw_widget` will automatically be set as `focused`.

#### `Screen::extension<E: Extension + Send + Sync + 'static>(self: &Arc<Self>, ext: E)`
Registers an extension with the screen.
Extensions provide global hooks for lifecycle events, rendering, and event handling. They are initialized once and remain active for the screen's lifetime.

**Arguments:**
*   `ext`: An instance of a type that implements the `Extension` trait.

**Example:**
```rust
use osui::prelude::*;
let screen = Screen::new();
screen.extension(InputExtension); // Register the input handling extension
screen.extension(RelativeFocusExtension::new()); // Register the focus navigation extension
```

#### `Screen::run(self: &Arc<Self>) -> std::io::Result<()>`
Starts the main rendering and event loop.
This method blocks the current thread and continuously renders the UI, processes events, and updates dynamic widgets until `screen.close()` is called. It also performs initial setup and final cleanup of the terminal.

**Returns:**
A `std::io::Result<()>` indicating success or failure of terminal operations.

**Example:**
```rust
use osui::prelude::*;
let screen = Screen::new();
// ... draw widgets, register extensions ...
screen.run()?; // Start the loop
```

#### `Screen::render(self: &Arc<Self>, ctx: &Context) -> std::io::Result<()>`
Renders all widgets and applies extensions for a single frame.
This method is called internally by `Screen::run` and should generally not be called directly by users.

**Arguments:**
*   `ctx`: A `Context` object providing access to screen functionalities.

#### `Screen::close(self: &Arc<Self>)`
Closes the main event loop and performs cleanup.
This method sets the internal `running` flag to `false`, causing the `Screen::run` loop to terminate. It also calls `on_close` for all registered extensions and restores the terminal cursor and screen state.

**Example:**
```rust
use osui::prelude::*;
// Inside an event handler or another thread:
// screen.close();
```

## Related Components

### `NoRender` (Component)
```rust
component!(NoRender);
```
When attached to a widget, this component indicates that the widget should *not* be directly rendered by the `Screen`'s main loop. This is commonly used for child widgets managed and rendered by their parent "ghost" elements (e.g., `Div`, `FlexRow`, `Paginator`). The parent element takes responsibility for rendering these children within its own `after_render` phase.

### `NoRenderRoot` (Component)
```rust
component!(NoRenderRoot);
```
Similar to `NoRender`, but specifically used to prevent a widget from being rendered by the *root* `Screen` renderer. It is typically injected by parent elements (like `Div`) onto their children, indicating that the child's rendering is handled by the parent's `after_render` and thus shouldn't be processed by the main `Screen` loop. This avoids double-rendering or incorrect layout calculations at the root level.

## `RenderWrapperEvent` (Event)

```rust
event!(RenderWrapperEvent(*mut RenderScope));
```
A special internal event type used to pass a mutable reference to a `RenderScope` during rendering.
It's primarily used by `Handler<RenderWrapperEvent>` components to allow extensions or custom logic to directly manipulate the `RenderScope` for a widget *before* its `Element::render` method is called.

**Methods:**
*   `get_scope(&self) -> &mut RenderScope`: Returns a mutable reference to the underlying `RenderScope`.
    *   **Safety**: The caller must ensure the pointer is valid for the lifetime of the event. This is generally handled internally by OSUI.
