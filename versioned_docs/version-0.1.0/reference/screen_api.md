# `Screen` API Reference

The `Screen` struct is the central orchestrator of an OSUI application. It manages the UI tree, handles the rendering loop, and coordinates with extensions.

## `Screen` Struct

```rust
pub struct Screen {
    pub widgets: Mutex<Vec<Arc<Widget>>>,
    // Internal fields for extensions and running state
    // extensions: Mutex<Vec<Arc<Mutex<Box<dyn Extension + Send + Sync>>>>>,
    // running: Mutex<bool>,
}
```

*   `widgets`: A `Mutex`-protected vector holding all top-level `Arc<Widget>` instances managed by this screen. These are the root elements of your UI tree.

## `Screen` Methods

### `Screen::new()`

Creates a new `Screen` instance, wrapped in an `Arc` for shared ownership.

```rust
pub fn new() -> Arc<Self>
```

*   **Returns**: An `Arc<Screen>`.
*   **Usage**: The primary way to initialize your OSUI environment.

    ```rust
    use osui::prelude::*;
    let screen = Screen::new();
    ```

### `Screen::draw<E: Element + 'static + Send + Sync>(self: &Arc<Self>, element: E) -> Arc<Widget>`

Draws a static element onto the screen. This creates a new `StaticWidget` internally and adds it to the screen's widget list.

```rust
pub fn draw<E: Element + 'static + Send + Sync>(self: &Arc<Self>, element: E) -> Arc<Widget>
```

*   `element`: The element to draw. This can be any type that implements the `Element` trait, such as `String`, `Div`, `Input`, etc.
*   **Returns**: An `Arc<Widget>` representing the newly created static widget.
*   **Usage**: Ideal for simple, non-reactive elements. Often used as the final step after defining your UI with `rsx!`.

    ```rust
    use osui::prelude::*;
    let screen = Screen::new();
    let my_widget = screen.draw(String::from("Hello, OSUI!"));
    // Equivalent to: rsx! { "Hello, OSUI!" }.draw(&screen);
    ```

### `Screen::draw_box(self: &Arc<Self>, element: BoxedElement) -> Arc<Widget>`

Draws a `BoxedElement` (a boxed trait object implementing `Element`) as a static widget.

```rust
pub fn draw_box(self: &Arc<Self>, element: BoxedElement) -> Arc<Widget>
```

*   `element`: A `Box<dyn Element + Send + Sync>`.
*   **Returns**: An `Arc<Widget>`.
*   **Usage**: Useful when you dynamically create a boxed element that you want to add as static content.

    ```rust
    use osui::prelude::*;
    let screen = Screen::new();
    let my_boxed_element: BoxedElement = Box::new(Div::new());
    screen.draw_box(my_boxed_element);
    ```

### `Screen::draw_widget(self: &Arc<Self>, widget: Arc<Widget>)`

Adds an already existing `Arc<Widget>` to the screen's list of top-level widgets.

```rust
pub fn draw_widget(self: &Arc<Self>, widget: Arc<Widget>)
```

*   `widget`: The `Arc<Widget>` to add.
*   **Usage**: When you've manually constructed an `Arc<Widget>` (e.g., a `StaticWidget` or `DynWidget`) and want to display it. `Rsx::draw_parent` uses this internally for non-`NoRenderRoot` widgets.

    ```rust
    use osui::prelude::*;
    let screen = Screen::new();
    let my_static_widget = Arc::new(Widget::Static(StaticWidget::new(Box::new(String::from("Manually created widget")))));
    screen.draw_widget(my_static_widget);
    ```

### `Screen::draw_dyn<F: FnMut() -> WidgetLoad + 'static + Send + Sync>(self: &Arc<Self>, element: F) -> Arc<Widget>`

Draws a dynamic element onto the screen. This element will be re-evaluated when its dependencies change.

```rust
pub fn draw_dyn<F: FnMut() -> WidgetLoad + 'static + Send + Sync>(self: &Arc<Self>, element: F) -> Arc<Widget>
```

*   `element`: A closure that returns a `WidgetLoad`. This closure encapsulates the logic for creating the widget's initial state and element.
*   **Returns**: An `Arc<Widget>` representing the newly created dynamic widget.
*   **Usage**: For reactive components whose content changes based on `State` or other dynamic factors.

    ```rust
    use osui::prelude::*;
    let screen = Screen::new();
    let count = use_state(0);
    let my_dyn_widget = screen.draw_dyn({
        let count = count.clone();
        move || WidgetLoad::new(format!("Count: {}", *count.get()))
    });
    my_dyn_widget.dependency(count); // Explicitly declare dependency if not using rsx!
    ```

### `Screen::draw_box_dyn(self: &Arc<Self>, element: Box<dyn FnMut() -> WidgetLoad + Send + Sync>) -> Arc<Widget>`

Draws a dynamic element from a boxed closure. Similar to `draw_dyn` but takes a `Box<dyn FnMut() -> WidgetLoad>`.

```rust
pub fn draw_box_dyn(self: &Arc<Self>, element: Box<dyn FnMut() -> WidgetLoad + Send + Sync>) -> Arc<Widget>
```

*   `element`: A boxed closure.
*   **Returns**: An `Arc<Widget>`.
*   **Usage**: Less common for direct use, as `draw_dyn` covers most cases. Used internally by `Rsx::create_element`.

### `Screen::extension<E: Extension + Send + Sync + 'static>(self: &Arc<Self>, ext: E)`

Registers an extension with the screen. Extensions receive lifecycle events and can influence rendering.

```rust
pub fn extension<E: Extension + Send + Sync + 'static>(self: &Arc<Self>, ext: E)
```

*   `ext`: An instance of a type that implements the `Extension` trait.
*   **Usage**: Essential for adding global functionalities like input handling or periodic updates.

    ```rust
    use osui::prelude::*;
    let screen = Screen::new();
    screen.extension(InputExtension); // Enable keyboard input
    screen.extension(TickExtension(100)); // Enable 100ms ticks
    ```

### `Screen::run(self: &Arc<Self>) -> std::io::Result<()>`

Starts the main rendering loop of the application. This method blocks the current thread until `screen.close()` is called.

```rust
pub fn run(self: &Arc<Self>) -> std::io::Result<()>
```

*   **Returns**: `Ok(())` on successful exit, or an `Err` if a terminal operation fails.
*   **Behavior**:
    *   Calls `init()` on all registered extensions.
    *   Hides the terminal cursor.
    *   Enters a loop that repeatedly calls `render()` and sleeps for 28ms (approx. 36 FPS).
    *   When the loop exits (due to `close()` being called), it shows the cursor, clears the screen, and calls `on_close()` on all extensions.
*   **Usage**: The last call in your `main` function.

    ```rust
    use osui::prelude::*;
    let screen = Screen::new();
    // ... setup widgets and extensions ...
    screen.run()?; // Note the '?' for error propagation
    ```

### `Screen::render(self: &Arc<Self>) -> std::io::Result<()>`

Performs a single rendering pass of all widgets on the screen.

```rust
pub fn render(self: &Arc<Self>) -> std::io::Result<()>
```

*   **Returns**: `Ok(())` or an `Err` on terminal failure.
*   **Behavior**:
    *   Clears the terminal.
    *   Initializes a new `RenderScope` with the current terminal dimensions.
    *   Iterates through all widgets in `screen.widgets`:
        *   If a widget has `NoRender` or `NoRenderRoot` components, it's skipped for direct rendering by the screen (its parent is responsible for rendering it).
        *   Otherwise, it applies the widget's `Style` and `Transform` to the `RenderScope`.
        *   Calls `Extension::render_widget` for each extension.
        *   Calls `Element::render` on the widget's root element.
        *   Draws the `RenderScope` to the terminal.
        *   Calls `Element::after_render` on the widget's root element.
        *   Calls `Widget::auto_refresh()` on dynamic widgets to check for state changes.
*   **Usage**: Primarily called internally by `Screen::run()`. You typically don't need to call this directly unless implementing a custom rendering loop.

### `Screen::close(self: &Arc<Self>)`

Signals the main rendering loop to terminate.

```rust
pub fn close(self: &Arc<Self>)
```

*   **Behavior**: Sets an internal flag that causes the `Screen::run()` loop to exit on its next iteration. It also performs cleanup: shows the cursor, clears the terminal, and calls `on_close()` on all registered extensions.
*   **Usage**: Call this from an event handler or other logic to gracefully shut down your application.

    ```rust
    use osui::prelude::*;
    use crossterm::event::{KeyCode, KeyEvent, Event as CrosstermEvent};

    let screen = Screen::new();
    screen.extension(InputExtension);
    rsx! {
        @Handler::new({
            let screen = screen.clone();
            move |_, e: &CrosstermEvent| {
                if let CrosstermEvent::Key(KeyEvent { code: KeyCode::Char('q'), .. }) = e {
                    screen.close(); // Exit application on 'q'
                }
            }
        });
        "Press 'q' to quit"
    }.draw(&screen);
    screen.run()?;
    ```
