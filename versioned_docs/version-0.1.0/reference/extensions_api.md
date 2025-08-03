# Extensions API Reference

OSUI's extension system provides a powerful mechanism for adding global behaviors, cross-cutting concerns, or custom rendering logic to your application. Extensions are independent units that can hook into the `Screen`'s lifecycle and rendering pipeline.

## `Extension` Trait

The core trait that all extensions must implement.

```rust
pub trait Extension {
    /// Called once when the screen starts running, before the main loop begins.
    ///
    /// Useful for setting up resources, spawning threads, or initializing global state.
    fn init(&mut self, _screen: Arc<Screen>) {}

    /// Called when the screen is being closed, after the main loop has exited.
    ///
    /// Useful for cleanup, restoring terminal state, or saving data.
    fn on_close(&mut self, _screen: Arc<Screen>) {}

    /// Called for each top-level widget just before its `Element::render` method is invoked.
    ///
    /// This hook provides an opportunity to inspect or modify the `RenderScope`
    /// or the widget itself before it draws its content.
    fn render_widget(&mut self, _scope: &mut RenderScope, _widget: &Arc<Widget>) {}
}
```

*   `init(&mut self, screen: Arc<Screen>)`: For one-time setup.
*   `on_close(&mut self, screen: Arc<Screen>)`: For cleanup.
*   `render_widget(&mut self, scope: &mut RenderScope, widget: &Arc<Widget>)`: Called per widget during each render frame.

## `Event` Trait

A marker trait for types that can be dispatched as events within OSUI's system.

```rust
pub trait Event: Send + Sync {
    fn as_any(&self) -> &dyn Any;
}
```

*   `as_any()`: Required for type-erasing the event, allowing `dyn Event` to be downcasted to concrete types.
*   **Helper Method**: `impl<'a> dyn Event + 'a` has a `get<T: Event + 'static>(&self) -> Option<&T>` method for convenient downcasting.

## `Handler<E>` Component

A component that wraps a closure, allowing a `Widget` to subscribe to a specific `Event` type. When an event of type `E` is dispatched to the widget (via `Widget::event`), this handler's closure is called.

```rust
#[derive(Clone)]
pub struct Handler<E: Event>(Arc<Mutex<dyn FnMut(&Arc<Widget>, &E) + Send + Sync>>);
```

### `Handler<E>` Methods

*   `new<F: FnMut(&Arc<Widget>, &E) + Send + Sync + 'static>(f: F) -> Handler<E>`: Creates a new handler. The closure receives the `Arc<Widget>` it's attached to and the event.
*   `call(&self, w: &Arc<Widget>, e: &E)`: Manually calls the wrapped closure. Used internally by `Widget::event`.

### Usage Example: `Handler`

```rust
use osui::prelude::*;
use crossterm::event::{KeyCode, KeyEvent, Event as CrosstermEvent};

// In your main function or widget:
let my_widget = rsx! {
    @Handler::new({
        let my_local_data = "some_context".to_string();
        move |widget_ref, event: &CrosstermEvent| {
            if let CrosstermEvent::Key(KeyEvent { code: KeyCode::Char('x'), .. }) = event {
                println!("Widget {:p} received 'x' key. Context: {}", Arc::as_ptr(widget_ref), my_local_data);
                // You can also get/set components on the widget_ref:
                // if let Some(mut transform) = widget_ref.get::<Transform>() { ... }
            }
        }
    });
    Div { "Press 'x'" }
}.draw(&screen);
```

## Built-in Extensions

OSUI provides several pre-implemented extensions for common functionalities:

### `IdExtension`

Provides a mechanism to retrieve a widget by a unique ID. It relies on the `Id` component.

```rust
pub struct IdExtension(pub Arc<Screen>);
component!(Id(pub usize)); // The component used for identifying widgets

impl Extension for Arc<IdExtension> {} // Note: Implements for Arc<IdExtension>
```

*   `new(screen: Arc<Screen>) -> Arc<Self>`: Creates a new `IdExtension` instance.
*   `get_element(self: &Arc<IdExtension>, id: usize) -> Option<Arc<Widget>>`: Iterates through all widgets on the screen to find one with the matching `Id` component.

    ```rust
    use osui::prelude::*;
    let screen = Screen::new();
    let id_ext = IdExtension::new(screen.clone());
    screen.extension(id_ext.clone()); // Register the extension

    let my_widget_id = 123;
    rsx! {
        @Id(my_widget_id); // Attach the Id component
        Div { "My Identifiable Div" }
    }.draw(&screen);

    // Later, retrieve the widget by ID
    if let Some(widget) = id_ext.get_element(my_widget_id) {
        // Do something with the widget
        println!("Found widget with ID {}", my_widget_id);
    }
    ```

### `InputExtension`

Handles raw terminal input using `crossterm` and dispatches `crossterm::event::Event`s to all widgets.

```rust
pub struct InputExtension;
impl Extension for InputExtension { /* ... */ }
impl crate::extensions::Event for crossterm::event::Event { /* ... */ } // Implemented for crossterm events
```

*   **Behavior**: Enables raw mode on `init()`, continuously reads events, and calls `widget.event(&e)` for every widget. Disables raw mode on `on_close()`.
*   **Usage**: **Essential for any interactive application that needs keyboard input.**

    ```rust
    use osui::prelude::*;
    let screen = Screen::new();
    screen.extension(InputExtension); // Enable input handling
    ```

### `TickExtension`

Dispatches `TickEvent`s at a specified rate (in ticks per second). Useful for animations, timers, or periodic updates.

```rust
pub struct TickExtension(pub u16); // Rate in ticks per second
event!(TickEvent(pub u32)); // The event dispatched by this extension

impl Extension for TickExtension { /* ... */ }
```

*   **Constructor**: Takes `u16` representing ticks per second.
*   **Behavior**: Spawns a thread that sends a `TickEvent(tick_count)` to all widgets at the specified rate.
*   **Usage**:

    ```rust
    use osui::prelude::*;

    let screen = Screen::new();
    screen.extension(TickExtension(30)); // 30 ticks per second (approx 33ms interval)

    // A widget that reacts to ticks
    let tick_counter = use_state(0);
    rsx! {
        @Handler::new({
            let tick_counter = tick_counter.clone();
            move |_, e: &TickEvent| {
                // The `e` is the TickEvent(tick_count)
                **tick_counter.get() = e.0; // Update state with current tick count
            }
        });
        %tick_counter
        Div { "Current Tick: {tick_counter}" }
    }.draw(&screen);
    ```

### `VelocityExtension`

Automatically updates the `Transform` of widgets that have a `Velocity` component, simulating movement.

```rust
pub struct VelocityExtension;
component!(Velocity(pub i32, pub i32)); // (velocity_x, velocity_y)

impl Extension for VelocityExtension { /* ... */ }
```

*   **Behavior**: Spawns a thread that periodically iterates through all widgets. If a widget has both a `Velocity` and a `Transform` component, it updates the `Transform::x` and `Transform::y` based on the velocity.
*   **Note**: `VelocityExtension` works by directly modifying `Position::Const` values. If `Transform::x` or `Transform::y` are `Center` or `End`, velocity won't apply to that axis.
*   **Usage**:

    ```rust
    use osui::prelude::*;

    let screen = Screen::new();
    screen.extension(VelocityExtension);

    rsx! {
        @Transform::new().x(5).y(5); // Initial position
        @Velocity(10, 0); // Move 10 cells per second horizontally (positive X)
        Div { "Moving Right" }

        @Transform::new().x(50).y(10);
        @Velocity(-5, 5); // Move left and down
        Div { "Moving Left-Down" }
    }.draw(&screen);
    ```

Extensions are a powerful way to add modular, global, or cross-cutting features to your OSUI applications, keeping your core UI definitions focused on structure and reactivity.



