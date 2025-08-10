# `osui::extensions`

The `extensions` module defines the core traits and types for extending OSUI's functionality. It provides a global event bus and lifecycle hooks that allow custom logic to interact with the entire UI application.

## `Extension` Trait

The central trait for adding global behaviors to an OSUI application. Any struct implementing this trait can be registered with the `Screen` to receive lifecycle and event callbacks.

```rust
pub trait Extension {
    /// Called once when the extension is registered with the `Screen`.
    #[allow(unused)]
    fn init(&mut self, _ctx: &Context) {}

    /// Called when any `Event` is dispatched across the system.
    #[allow(unused)]
    fn event(&mut self, _ctx: &Context, _event: &dyn Event) {}

    /// Called when `Screen::close()` is invoked, before the application terminates.
    #[allow(unused)]
    fn on_close(&mut self) {}

    /// Called before any widgets are rendered in a frame, with a scope for the entire screen.
    #[allow(unused)]
    fn render(&mut self, _ctx: &Context, _scope: &mut RenderScope) {}

    /// Called before a specific widget's `Element::render` method is invoked.
    #[allow(unused)]
    fn render_widget(&mut self, _ctx: &Context, _scope: &mut RenderScope, _widget: &Arc<Widget>) {}

    /// Called after a specific widget's `Element::after_render` method is invoked.
    #[allow(unused)]
    fn after_render_widget(
        &mut self,
        _ctx: &Context,
        _scope: &mut RenderScope,
        _widget: &Arc<Widget>,
    ) {}
}
```

## `Event` Trait

A marker trait for types that can be dispatched as events within the OSUI system. Events are type-erased (`dyn Event`) when dispatched, requiring downcasting to retrieve their specific type.

```rust
pub trait Event: Send + Sync {
    /// Returns a type-erased reference to this object, enabling downcasting.
    fn as_any(&self) -> &dyn Any;
}

impl<'a> dyn Event + 'a {
    /// Attempts to downcast a dynamic `Event` trait object to a concrete type `T`.
    ///
    /// # Type Parameters
    /// * `T`: The concrete event type to downcast to. Must also implement `Event`.
    ///
    /// # Returns
    /// `Some(&T)` if the downcast is successful, `None` otherwise.
    pub fn get<T: Event + 'static>(&self) -> Option<&T> {
        self.as_any().downcast_ref()
    }
}
```

## `Context`

The `Context` struct provides a way for extensions and widgets to interact with the global OSUI `Screen` instance. It holds an `Arc<Screen>` and offers convenience methods for dispatching events, querying widgets, and accessing components.

```rust
#[derive(Clone)]
pub struct Context {
    screen: Arc<Screen>,
}
```

### Associated Methods

#### `Context::new(screen: Arc<Screen>) -> Self`
Creates a new `Context` instance.

**Arguments:**
*   `screen`: An `Arc` to the `Screen` instance that this context will operate on.

#### `Context::event<E: Event + Clone + 'static>(&self, e: &E)`
Dispatches an event `e` throughout the OSUI system.
This will:
1.  Call the `event` method on all widgets (specifically, on any `Handler<E>` components attached to them, and on the `Element::event` method of focused widgets).
2.  Call the `event` method on all registered `Extension`s.

**Arguments:**
*   `e`: A reference to the event to dispatch.

**Example:**
```rust
use osui::prelude::*;
// Inside an extension or a component:
// self.ctx.event(&MyCustomEvent { /* ... */ });
```

#### `Context::get_widgets(&self) -> MutexGuard<Vec<Arc<Widget>>>`
Returns a `MutexGuard` to the `Vec` of `Arc<Widget>` that the `Screen` is currently managing. This allows extensions to iterate over and manipulate the global list of widgets.

**Returns:**
A `MutexGuard` providing mutable access to the list of root widgets.

#### `Context::iter_components<C: Component + 'static + Clone, F: FnMut(&Arc<Widget>, Option<C>)>(&self, mut iterator: F)`
Iterates over all widgets managed by the `Screen` and applies a provided closure to each widget, along with an `Option` of a cloned component of type `C` if the widget has one.

**Type Parameters:**
*   `C`: The `Component` type to look for.
*   `F`: The closure to execute for each widget.

**Arguments:**
*   `iterator`: A closure that takes an `Arc<Widget>` and an `Option<C>`.

#### `Context::get_components<C: Component + 'static + Clone>(&self) -> Vec<C>`
Collects all instances of a specific `Component` type from all widgets managed by the `Screen` into a `Vec`.

**Type Parameters:**
*   `C`: The `Component` type to collect.

**Returns:**
A `Vec` containing cloned instances of component `C`.

#### `Context::render_root(&self, scope: &mut RenderScope)`
Calls the `render` hook for all registered `Extension`s, allowing them to draw global elements that span the entire screen. This is typically called once per frame before individual widgets are rendered.

**Arguments:**
*   `scope`: The `RenderScope` representing the entire screen.

#### `Context::render(&self, w: &Arc<Widget>, scope: &mut RenderScope)`
Calls the `render_widget` hook for all registered `Extension`s for a specific `widget`. This is invoked during the rendering of each individual widget.

**Arguments:**
*   `w`: The `Arc<Widget>` currently being rendered.
*   `scope`: The `RenderScope` for `w`.

#### `Context::after_render(&self, w: &Arc<Widget>, scope: &mut RenderScope)`
Calls the `after_render_widget` hook for all registered `Extension`s for a specific `widget`. This is invoked after a widget's `Element::after_render` method has completed.

**Arguments:**
*   `w`: The `Arc<Widget>` that has just finished its `after_render` phase.
*   `scope`: The `RenderScope` for `w`.

## `Handler<E>` (Component)

A component that allows a widget to listen for and react to specific `Event` types `E`.

```rust
#[derive(Clone)]
pub struct Handler<E: Event>(Arc<Mutex<dyn FnMut(&Arc<Widget>, &E) + Send + Sync>>);
```

### Implementations

#### `impl<E: Event + 'static> Component for Handler<E>`
`Handler<E>` implements the `Component` trait, allowing it to be attached to any `Widget`.

#### `impl<E: Event + 'static> Handler<E>`
#### `Handler::new<F: FnMut(&Arc<Widget>, &E) + Send + Sync + 'static>(f: F) -> Handler<E>`
Creates a new `Handler<E>` with the given mutable closure `f`. This closure will be called when an event of type `E` is dispatched.

**Arguments:**
*   `f`: The closure to execute when the event occurs. It receives the `Arc<Widget>` it's attached to and a reference to the event.

**Example:**
```rust
use osui::prelude::*;

event!(ButtonClicked);

rsx! {
    @Handler::new(|widget_arc, event: &ButtonClicked| {
        println!("Button clicked on widget: {:?}", widget_arc);
    });
    Div { "My Button" }
}
```

#### `Handler::call(&self, w: &Arc<Widget>, e: &E)`
Invokes the internal closure with the provided widget and event. This method is called internally by `Widget::event`.

**Arguments:**
*   `w`: The `Arc<Widget>` that owns this handler.
*   `e`: The event to process.
